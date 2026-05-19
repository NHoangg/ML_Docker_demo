from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from api.predictor import RevenuePredictor
from api.schemas import RetailSalesData, RevenuePrediction

logger = logging.getLogger("uvicorn.error")

# ─── Global state ────────────────────────────────────────────────────────────
predictor = RevenuePredictor()
_last_retrain: dict = {"time": None, "metrics": None, "status": "never"}


def _retrain_job() -> None:
    """Background job: retrain model from latest data then hot-reload."""
    global _last_retrain
    logger.info("[Scheduler] Starting scheduled model retraining...")
    try:
        from model.train_model import run_training  # avoid circular at import time
        metrics = run_training()
        predictor.reload()
        _last_retrain = {
            "time": datetime.utcnow().isoformat() + "Z",
            "metrics": metrics,
            "status": "success",
        }
        logger.info(f"[Scheduler] Retraining done. R2={metrics['r2']:.4f}")
    except Exception as exc:
        _last_retrain = {
            "time": datetime.utcnow().isoformat() + "Z",
            "metrics": None,
            "status": f"error: {exc}",
        }
        logger.error(f"[Scheduler] Retraining failed: {exc}")


# ─── App lifespan ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    # Chạy lại model lúc 00:00 mỗi ngày (UTC)
    scheduler.add_job(_retrain_job, CronTrigger(hour=0, minute=0))
    scheduler.start()
    logger.info("[Scheduler] Auto-retrain scheduler started (daily at 00:00 UTC).")
    yield
    scheduler.shutdown(wait=False)


# ─── Application ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Revenue Prediction API",
    description=(
        "REST API dự báo doanh thu bán lẻ theo khu vực, cửa hàng và nhóm sản phẩm "
        "bằng Random Forest Pipeline. Hỗ trợ tự động cập nhật mô hình hằng ngày."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok", "version": "2.0.0"}


@app.post("/predict", response_model=RevenuePrediction, tags=["Prediction"])
def predict_revenue(retail_data: RetailSalesData) -> RevenuePrediction:
    """Dự đoán doanh thu cho một bản ghi."""
    predicted_revenue = predictor.predict(retail_data)
    return RevenuePrediction(predicted_revenue=predicted_revenue)


@app.post("/predict/batch", tags=["Prediction"])
async def predict_revenue_batch(file: UploadFile = File(...)):
    """Upload file CSV để dự đoán hàng loạt."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {exc}")

    try:
        predictions = predictor.predict_batch(df)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    df["predicted_revenue"] = predictions
    return df.to_dict(orient="records")


@app.post("/retrain", tags=["Model Management"])
def manual_retrain():
    """Kích hoạt retrain mô hình ngay lập tức (không cần chờ lịch hằng ngày)."""
    _retrain_job()
    return {"message": "Retraining triggered", "result": _last_retrain}


@app.get("/retrain/status", tags=["Model Management"])
def retrain_status():
    """Trả về thông tin lần retrain gần nhất."""
    return _last_retrain


@app.get("/analytics/summary", tags=["Analytics"])
def analytics_summary():
    """Tóm tắt dữ liệu phân tích theo khu vực, cửa hàng, nhóm sản phẩm."""
    import pandas as pd
    from pathlib import Path

    data_path = Path("data/raw/revenue_sample.csv")
    if not data_path.exists():
        raise HTTPException(status_code=404, detail="Training data not found")

    df = pd.read_csv(data_path)

    summary = {
        "by_khu_vuc": df.groupby("khu_vuc")["revenue"].agg(["mean", "sum", "count"]).rename(columns={"mean": "avg_revenue", "sum": "total_revenue", "count": "records"}).to_dict(orient="index"),
        "by_cua_hang": df.groupby("cua_hang")["revenue"].agg(["mean", "sum", "count"]).rename(columns={"mean": "avg_revenue", "sum": "total_revenue", "count": "records"}).to_dict(orient="index"),
        "by_nhom_san_pham": df.groupby("nhom_san_pham")["revenue"].agg(["mean", "sum", "count"]).rename(columns={"mean": "avg_revenue", "sum": "total_revenue", "count": "records"}).to_dict(orient="index"),
        "total_revenue": float(df["revenue"].sum()),
        "total_records": len(df),
    }
    return summary
