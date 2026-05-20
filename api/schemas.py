from __future__ import annotations

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from typing import Literal


class RetailSalesData(BaseModel):
    thoi_gian: int = Field(..., description="Thời gian (tháng)", ge=1, examples=[12])
    dong_tien: float = Field(..., description="Dòng tiền", ge=0, examples=[50000])
    don_hang: int = Field(..., description="Số đơn hàng", ge=0, examples=[1500])
    san_pham: int = Field(..., description="Số sản phẩm", ge=0, examples=[3000])
    khu_vuc: Literal["Bac", "Trung", "Nam"] = Field(
        ..., description="Khu vực (Bac, Trung, Nam)", examples=["Bac"]
    )
    cua_hang: Literal["CH1", "CH2", "CH3"] = Field(
        ..., description="Mã cửa hàng", examples=["CH1"]
    )
    nhom_san_pham: Literal["ThucPham", "GiaDung", "DienTu"] = Field(
        ..., description="Nhóm sản phẩm", examples=["DienTu"]
    )


class RevenuePrediction(BaseModel):
    predicted_revenue: float
    contributions: dict[str, float] = Field(default_factory=dict, description="Đóng góp đặc trưng cục bộ (XAI)")
