from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Predict revenue using the trained model.")
    parser.add_argument(
        "--model",
        default="models/revenue_random_forest.joblib",
        help="Path to the trained model file.",
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to a CSV file containing feature columns.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    model_bundle = joblib.load(Path(args.model))
    input_data = pd.read_csv(args.input)

    feature_columns = model_bundle["feature_columns"]
    missing_columns = [column for column in feature_columns if column not in input_data.columns]
    if missing_columns:
        raise ValueError(f"Missing feature columns: {', '.join(missing_columns)}")

    predictions = model_bundle["model"].predict(input_data[feature_columns])
    output = input_data.copy()
    output["predicted_revenue"] = predictions.round(2)
    print(output.to_string(index=False))


if __name__ == "__main__":
    main()
