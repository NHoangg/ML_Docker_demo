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
        self._baselines: dict = bundle.get("baselines", {
            "thoi_gian": 6,
            "dong_tien": 30000.0,
            "don_hang": 800,
            "san_pham": 1500,
            "khu_vuc": "Bac",
            "cua_hang": "CH1",
            "nhom_san_pham": "ThucPham"
        })

    def reload(self) -> None:
        """Hot-reload the model from disk (called after retraining)."""
        with self._lock:
            self._load()

    def predict(self, retail_data: RetailSalesData) -> tuple[float, dict[str, float]]:
        with self._lock:
            input_dict = retail_data.model_dump()
            
            # Build a batch of original and perturbed inputs to predict in a single call
            rows = [input_dict.copy()]
            for col in self._feature_columns:
                perturbed_dict = input_dict.copy()
                perturbed_dict[col] = self._baselines.get(col, input_dict[col])
                rows.append(perturbed_dict)
                
            batch_df = pd.DataFrame(rows)
            preds = self._pipeline.predict(batch_df[self._feature_columns])
            
            original_val = round(float(preds[0]), 2)
            contributions = {}
            for idx, col in enumerate(self._feature_columns):
                # Row (idx + 1) corresponds to column 'col' perturbed
                perturbed_val = preds[idx + 1]
                contribution_val = preds[0] - perturbed_val
                contributions[col] = round(float(contribution_val), 2)
                
        return original_val, contributions

    def predict_batch(self, df: pd.DataFrame) -> list[float]:
        missing_cols = [c for c in self._feature_columns if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns in CSV: {missing_cols}")
        with self._lock:
            predictions = self._pipeline.predict(df[self._feature_columns])
        return [round(float(p), 2) for p in predictions]
