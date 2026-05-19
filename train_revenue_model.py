from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


TARGET_COLUMN = "revenue"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a revenue forecasting model.")
    parser.add_argument(
        "--data",
        default="data/revenue_sample.csv",
        help="Path to CSV training data.",
    )
    parser.add_argument(
        "--model-out",
        default="models/revenue_random_forest.joblib",
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


def train_model(features: pd.DataFrame, labels: pd.Series) -> tuple[RandomForestRegressor, dict[str, float]]:
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
    )

    model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        min_samples_leaf=2,
        n_jobs=-1,
    )
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    metrics = {
        "mae": mean_absolute_error(y_test, predictions),
        "rmse": mean_squared_error(y_test, predictions) ** 0.5,
        "r2": r2_score(y_test, predictions),
    }
    return model, metrics


def main() -> None:
    args = parse_args()
    data_path = Path(args.data)
    model_path = Path(args.model_out)

    features, labels = load_dataset(data_path, args.target)
    model, metrics = train_model(features, labels)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "feature_columns": list(features.columns),
            "target_column": args.target,
            "metrics": metrics,
        },
        model_path,
    )

    print("Training complete")
    print(f"Rows: {len(features)}")
    print(f"Features: {', '.join(features.columns)}")
    print(f"MAE: {metrics['mae']:.2f}")
    print(f"R2 Score: {metrics['r2']:.4f}")
    print(f"Saved model: {model_path}")


if __name__ == "__main__":
    main()
