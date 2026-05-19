from __future__ import annotations

import threading
from pathlib import Path

import joblib
import pandas as pd

from api.schemas import RetailSalesData


MODEL_PATH = Path(__file__).resolve().parents[1] / "model" / "model.pkl"


class RevenuePredictor:
    """Loads a trained sklearn Pipeline and performs inference.

    Thread-safe hot-reload: call `reload()` after a retrain to swap in
    the new model without restarting the container.
    """

    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        self._model_path = model_path
        self._lock = threading.Lock()
        self._load()

    def _load(self) -> None:
        if not self._model_path.exists():
            raise FileNotFoundError(
                f"Model file not found: {self._model_path}. Run `python model/train_model.py` first."
            )
        bundle = joblib.load(self._model_path)
        self._pipeline = bundle["pipeline"]
        self._feature_columns: list[str] = bundle["feature_columns"]

    def reload(self) -> None:
        """Hot-reload the model from disk (called after retraining)."""
        with self._lock:
            self._load()

    def predict(self, retail_data: RetailSalesData) -> float:
        with self._lock:
            input_df = pd.DataFrame([retail_data.model_dump()])
            prediction = self._pipeline.predict(input_df[self._feature_columns])[0]
        return round(float(prediction), 2)

    def predict_batch(self, df: pd.DataFrame) -> list[float]:
        missing_cols = [c for c in self._feature_columns if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns in CSV: {missing_cols}")
        with self._lock:
            predictions = self._pipeline.predict(df[self._feature_columns])
        return [round(float(p), 2) for p in predictions]
