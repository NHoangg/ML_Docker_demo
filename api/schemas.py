from __future__ import annotations

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


class RetailSalesData(BaseModel):
    thoi_gian: int = Field(..., description="Thời gian", ge=1, examples=[12])
    dong_tien: float = Field(..., description="Dòng tiền", ge=0, examples=[50000])
    don_hang: int = Field(..., description="Đơn hàng", ge=0, examples=[1500])
    san_pham: int = Field(..., description="Sản phẩm", ge=0, examples=[3000])


class RevenuePrediction(BaseModel):
    predicted_revenue: float
