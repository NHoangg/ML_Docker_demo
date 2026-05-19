from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd

from api.schemas import RetailSalesData


MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "revenue_random_forest.joblib"


class RevenuePredictor:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model file not found: {model_path}. Run `python train_revenue_model.py` first."
            )

        model_bundle = joblib.load(model_path)
        self.model = model_bundle["model"]
        self.feature_columns = model_bundle["feature_columns"]

    def predict(self, retail_data: RetailSalesData) -> float:
        input_data = pd.DataFrame([retail_data.model_dump()])
        prediction = self.model.predict(input_data[self.feature_columns])[0]
        return round(float(prediction), 2)

    def predict_batch(self, df: pd.DataFrame) -> list[float]:
        # Validate that df contains required columns
        missing_cols = [col for col in self.feature_columns if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns in CSV: {missing_cols}")
        
        predictions = self.model.predict(df[self.feature_columns])
        return [round(float(pred), 2) for pred in predictions]
