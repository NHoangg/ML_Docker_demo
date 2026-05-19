from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


TARGET_COLUMN = "revenue"
CATEGORICAL_COLUMNS = ["khu_vuc", "cua_hang", "nhom_san_pham"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a revenue forecasting model.")
    parser.add_argument(
        "--data",
        default="data/raw/revenue_sample.csv",
        help="Path to CSV training data.",
    )
    parser.add_argument(
        "--model-out",
        default="model/model.pkl",
        help="Path where the trained model will be saved.",
    )
    parser.add_argument(
        "--target",
        default=TARGET_COLUMN,
        help="Target column name to predict.",
    )
    return parser.parse_args()


def load_dataset(csv_path: Path, target: str) -> tuple[pd.DataFrame, pd.Series]:
    if not csv_path.exists():
        raise FileNotFoundError(f"Data file not found: {csv_path}")

    data = pd.read_csv(csv_path)
    if target not in data.columns:
        raise ValueError(f"Target column '{target}' was not found in {csv_path}")

    features = data.drop(columns=[target])
    labels = data[target]
    return features, labels


def build_pipeline(feature_columns: list[str]) -> Pipeline:
    """Build a sklearn Pipeline with OHE for categorical columns."""
    cat_cols = [c for c in CATEGORICAL_COLUMNS if c in feature_columns]
    num_cols = [c for c in feature_columns if c not in cat_cols]

    transformers = []
    if cat_cols:
        transformers.append(
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_cols,
            )
        )
    if num_cols:
        transformers.append(("num", "passthrough", num_cols))

    preprocessor = ColumnTransformer(transformers=transformers)

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=300,
                    random_state=42,
                    min_samples_leaf=2,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    return pipeline


def train_model(
    features: pd.DataFrame, labels: pd.Series
) -> tuple[Pipeline, dict[str, float]]:
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
    )

    pipeline = build_pipeline(list(features.columns))
    pipeline.fit(x_train, y_train)

    predictions = pipeline.predict(x_test)
    metrics = {
        "mae": mean_absolute_error(y_test, predictions),
        "rmse": mean_squared_error(y_test, predictions) ** 0.5,
        "r2": r2_score(y_test, predictions),
    }
    return pipeline, metrics


def run_training(
    data_path: str = "data/raw/revenue_sample.csv",
    model_out: str = "model/model.pkl",
    target: str = TARGET_COLUMN,
) -> dict[str, float]:
    """Callable entry-point used by the API scheduler for auto-retraining."""
    csv_path = Path(data_path)
    model_path = Path(model_out)

    features, labels = load_dataset(csv_path, target)
    pipeline, metrics = train_model(features, labels)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": pipeline,
            "feature_columns": list(features.columns),
            "categorical_columns": CATEGORICAL_COLUMNS,
            "target_column": target,
            "metrics": metrics,
        },
        model_path,
    )
    return metrics


def main() -> None:
    args = parse_args()
    metrics = run_training(
        data_path=args.data,
        model_out=args.model_out,
        target=args.target,
    )

    print("Training complete")
    print(f"MAE:      {metrics['mae']:.2f}")
    print(f"RMSE:     {metrics['rmse']:.2f}")
    print(f"R2 Score: {metrics['r2']:.4f}")
    print(f"Saved model: {args.model_out}")


if __name__ == "__main__":
    main()
