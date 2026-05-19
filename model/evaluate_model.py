from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate the trained revenue pipeline on new data.")
    parser.add_argument(
        "--model",
        default="model/model.pkl",
        help="Path to the trained model file (.pkl).",
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to a CSV file containing feature columns (and optionally a 'revenue' target column).",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional path to save predictions CSV.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    bundle = joblib.load(Path(args.model))
    pipeline = bundle["pipeline"]
    feature_columns: list[str] = bundle["feature_columns"]

    input_data = pd.read_csv(args.input)

    missing = [c for c in feature_columns if c not in input_data.columns]
    if missing:
        raise ValueError(f"Missing feature columns in input: {', '.join(missing)}")

    predictions = pipeline.predict(input_data[feature_columns])
    output = input_data.copy()
    output["predicted_revenue"] = predictions.round(2)

    print("\n=== Evaluation Results ===")
    print(output[["predicted_revenue"] + [c for c in feature_columns if c in output.columns]].to_string(index=False))

    if "revenue" in input_data.columns:
        actual = input_data["revenue"]
        mae = mean_absolute_error(actual, predictions)
        rmse = mean_squared_error(actual, predictions) ** 0.5
        r2 = r2_score(actual, predictions)
        print(f"\nMAE:      {mae:.2f}")
        print(f"RMSE:     {rmse:.2f}")
        print(f"R2 Score: {r2:.4f}")

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        output.to_csv(out_path, index=False)
        print(f"\nSaved predictions to: {out_path}")


if __name__ == "__main__":
    main()
