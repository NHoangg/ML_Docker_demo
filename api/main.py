from __future__ import annotations

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

from api.predictor import RevenuePredictor
from api.schemas import RetailSalesData, RevenuePrediction


app = FastAPI(
    title="Revenue Prediction API",
    description="REST API du bao doanh thu ban le bang Random Forest Regressor.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = RevenuePredictor()


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict", response_model=RevenuePrediction)
def predict_revenue(retail_data: RetailSalesData) -> RevenuePrediction:
    predicted_revenue = predictor.predict(retail_data)
    return RevenuePrediction(predicted_revenue=predicted_revenue)


@app.post("/predict/batch")
async def predict_revenue_batch(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {e}")
        
    try:
        predictions = predictor.predict_batch(df)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Thêm cột dự đoán vào dataframe và trả về JSON
    df["predicted_revenue"] = predictions
    return df.to_dict(orient="records")

