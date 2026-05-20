from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeRegressor

DATA_PATH = Path("data/raw/revenue_sample.csv")
OUTPUT_PATH = Path("data/processed/model_comparison.json")
TARGET_COLUMN = "revenue"
CATEGORICAL_COLUMNS = ["khu_vuc", "cua_hang", "nhom_san_pham"]


def build_pipeline(model_name: str, feature_columns: list[str]) -> Pipeline:
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

    if model_name == "Linear Regression":
        regressor = LinearRegression()
    elif model_name == "Decision Tree":
        regressor = DecisionTreeRegressor(random_state=42)
    elif model_name == "Random Forest (Proposed)":
        regressor = RandomForestRegressor(
            n_estimators=300,
            random_state=42,
            min_samples_leaf=2,
            n_jobs=-1,
        )
    else:
        raise ValueError(f"Unknown model name: {model_name}")

    return Pipeline(steps=[("preprocessor", preprocessor), ("regressor", regressor)])


def main() -> None:
    print("Starting baseline model comparison...")

    # Load data
    if not DATA_PATH.exists():
        print(f"Error: {DATA_PATH} not found.")
        return
    df = pd.read_csv(DATA_PATH)

    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    models_to_test = ["Linear Regression", "Decision Tree", "Random Forest (Proposed)"]
    comparison_results = []

    for name in models_to_test:
        pipeline = build_pipeline(name, list(X.columns))

        # Measure training time
        start_train = time.time()
        pipeline.fit(X_train, y_train)
        train_time = time.time() - start_train

        # Measure inference latency (per sample)
        start_inf = time.time()
        preds = pipeline.predict(X_test)
        inf_time = (time.time() - start_inf) / len(X_test) * 1000  # in milliseconds

        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)

        comparison_results.append(
            {
                "model": name,
                "mae": round(float(mae), 2),
                "rmse": round(float(rmse), 2),
                "r2": round(float(r2), 4),
                "train_time_sec": round(train_time, 4),
                "inf_time_ms_per_sample": round(inf_time, 4),
            }
        )
        print(
            f"Finished {name:25s} | R2: {r2:.4f} | MAE: {mae:.2f} | Train Time: {train_time:.4f}s"
        )

    # Save to JSON
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(comparison_results, f, indent=4, ensure_ascii=False)

    print(f"\nSaved comparison results to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
