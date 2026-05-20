# 🎬 DEMO – Kịch bản chứng minh yêu cầu đề tài (Phiên bản nâng cấp v3.0)

> **Đề tài 12 – Phân tích và Dự đoán Doanh thu Bán lẻ**  
> File này hướng dẫn từng bước demo để chứng minh hệ thống đáp ứng đầy đủ yêu cầu học thuật và thực tiễn, tích hợp các tính năng đổi mới nâng cao.

---

## ✅ Checklist yêu cầu đề tài & Tính năng đổi mới

| # | Yêu cầu / Tính năng | Kịch bản demo | Trạng thái |
|---|---------------------|--------------|------------|
| 1 | Tiền xử lý và phân tích dữ liệu bán lẻ | [Kịch bản 1](#kịch-bản-1-huấn-luyện-và-đánh-giá-baseline) | ✅ Hoàn thành |
| 2 | Xây dựng mô hình dự báo doanh thu (Random Forest) | [Kịch bản 1](#kịch-bản-1-huấn-luyện-và-đánh-giá-baseline) | ✅ R² ≈ 0.9922 |
| 3 | So sánh Baseline (Linear Regression, Decision Tree) | [Kịch bản 1](#kịch-bản-1-huấn-luyện-và-đánh-giá-baseline) | ✅ Mới |
| 4 | Trực quan thực nghiệm, sai số & Error Analysis | [Kịch bản 4](#kịch-bản-4-đánh-giá-mô-hình--error-analysis-trực-quan) | ✅ Mới |
| 5 | REST API nhận dữ liệu và trả về dự báo kèm XAI | [Kịch bản 2](#kịch-bản-2-dự-đoán-đơn-lẻ-qua-api-kèm-xai) | ✅ Mới |
| 6 | Dự đoán hàng loạt qua upload CSV | [Kịch bản 3](#kịch-bản-3-dự-đoán-hàng-loạt-batch-csv) | ✅ Hoàn thành |
| 7 | Triển khai Docker Swarm Cluster & Load Balancing | [Kịch bản 6](#kịch-bản-6-docker-swarm--benchmark-hiệu-năng) | ✅ Hoàn thành |
| 8 | Chốt kiểm soát chất lượng mô hình (Performance Gate) | [Kịch bản 5](#kịch-bản-5-huấn-luyện-tự-thích-ứng-có-gating) | ✅ Mới |
| 9 | Dashboard Realtime cập nhật luồng dữ liệu 3s | [Kịch bản 4](#kịch-bản-4-đánh-giá-mô-hình--error-analysis-trực-quan) | ✅ Hoàn thành |

---

## 🔧 Chuẩn bị trước khi demo

Khởi chạy FastAPI API server và React Dashboard trên máy chủ:

```bash
# Trong thư mục dự án, chạy API ở cổng 8000
uvicorn api.main:app --reload

# Trong thư mục dashboard, chạy React ở cổng 5173
npm run dev
```

**Các URL cần mở sẵn:**
- 🔗 API Docs: http://localhost:8000/docs
- 🖥️ Dashboard: http://localhost:5173

---

## Kịch bản 1: Huấn luyện và đánh giá Baseline

> **Chứng minh:** Tiền xử lý dữ liệu + So sánh Baseline (LR vs DT vs RF)

### Bước 1.1 – Xem dữ liệu huấn luyện
```bash
python -c "import pandas as pd; df = pd.read_csv('data/raw/revenue_sample.csv'); print(df.head(5).to_string())"
```
*Chỉ ra:* Dữ liệu đa chiều có các biến số như `dong_tien`, `don_hang` và các biến phân loại `khu_vuc`, `cua_hang`, `nhom_san_pham`.

### Bước 1.2 – Chạy script so sánh Baseline
```bash
python model/baseline_comparison.py
```
**Kết quả mong đợi:**
```
Starting baseline model comparison...
Finished Linear Regression         | R2: -0.0963 | MAE: 19485.66 | Train Time: 0.0148s
Finished Decision Tree             | R2: 0.9868 | MAE: 4197.24 | Train Time: 0.0085s
Finished Random Forest (Proposed)  | R2: 0.9922 | MAE: 2580.38 | Train Time: 0.3046s
```
*Chỉ ra:* 
- Mô hình Linear Regression thất bại ($R^2 < 0$) do dữ liệu phi tuyến.
- Mô hình Random Forest (Đề xuất) đạt độ chính xác cao nhất với $R^2 \approx 0.9922$ và sai số MAE thấp nhất (~2580 VNĐ).
- File so sánh được lưu vào `data/processed/model_comparison.json`.

---

## Kịch bản 2: Dự đoán đơn lẻ qua API kèm XAI

> **Chứng minh:** REST API + Tính giải thích cục bộ Explainable AI (XAI)

### Bước 2.1 – Gọi API qua curl
```bash
curl -X 'POST' \
  'http://localhost:8000/predict' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "thoi_gian": 12,
  "dong_tien": 32000,
  "don_hang": 1500,
  "san_pham": 3000,
  "khu_vuc": "Bac",
  "cua_hang": "CH1",
  "nhom_san_pham": "DienTu"
}'
```

**Output mong đợi:**
```json
{
  "predicted_revenue": 612000.0,
  "contributions": {
    "thoi_gian": 8200.0,
    "dong_tien": 412500.0,
    "don_hang": 32100.0,
    "san_pham": -1500.0,
    "khu_vuc": 12000.0,
    "cua_hang": 4500.0,
    "nhom_san_pham": 85000.0
  }
}
```
*Chỉ ra:* API trả về không chỉ con số doanh thu dự đoán mà cả phần đóng góp cục bộ (XAI contributions). Ví dụ: danh mục `nhom_san_pham` đóng góp làm tăng doanh thu lên **85.000 VNĐ** so với baseline, trong khi lượng tồn kho `san_pham` kéo giảm **1.500 VNĐ**.

### Bước 2.2 – Kiểm tra trên Dashboard
1. Mở tab **"Dự đoán & XAI"** trên Dashboard.
2. Thay đổi các tham số đầu vào và nhấn nút **⚡ Dự đoán doanh thu**.
3. Quan sát: Biểu đồ cột ngang hiển thị đóng góp đặc trưng (màu xanh lá thể hiện đóng góp tăng, màu đỏ thể hiện đóng góp giảm).

---

## Kịch bản 3: Dự đoán hàng loạt (Batch CSV)

> **Chứng minh:** API tải lên tệp CSV và trả về mảng kết quả dự báo.

### Bước 3.1 – Tạo file test CSV `test_batch.csv`
```csv
thoi_gian,dong_tien,don_hang,san_pham,khu_vuc,cua_hang,nhom_san_pham
6,28000,800,1500,Nam,CH3,DienTu
12,50000,1200,2500,Bac,CH1,GiaDung
3,20000,600,1200,Trung,CH2,ThucPham
```

### Bước 3.2 – Gọi API batch upload
```bash
curl -X POST http://localhost:8000/predict/batch -F "file=@test_batch.csv"
```

### Bước 3.3 – Kiểm tra trên Dashboard
1. Chọn tab **"Batch CSV"**.
2. Chọn tệp `test_batch.csv` tải lên.
3. Hệ thống phân tích tức thì và xuất bảng kết quả dự đoán chi tiết từng dòng.

---

## Kịch bản 4: Đánh giá mô hình & Error Analysis trực quan

> **Chứng minh:** Trực quan hóa thực nghiệm, phân tích lỗi (Error Analysis) và Realtime streaming.

### Bước 4.1 – Xem tab "Đánh giá & Lỗi" trên Dashboard
1. Click vào tab **"Đánh giá & Lỗi"**.
2. Biểu đồ **Thực tế vs Dự đoán** (vẽ 50 điểm test mẫu) hiển thị sự bám sát cực tốt của mô hình Random Forest đối với doanh thu thực.
3. Biểu đồ **Độ quan trọng đặc trưng** chỉ ra biến nào ảnh hưởng nhất toàn cục (ví dụ: Dòng tiền chiếm tỉ lệ cao nhất).
4. Biểu đồ **Phân phối sai số** (Residuals) thể hiện các lỗi tập trung sát mốc 0.
5. Bảng **Error Analysis** hiển thị 5 trường hợp dự đoán sai lệch nhiều nhất tập test kèm lý do giải thích tự động từ chuyên gia ML.
6. Biểu đồ **Giám sát Concept Drift (Page-Hinkley)** hiển thị điểm tích lũy sai số (Drift Score) so với ngưỡng kích hoạt trôi lệch dữ liệu.

### Bước 4.2 – Realtime Live Stream
1. Click vào tab **"Realtime Live"**.
2. Nhấn **▶ Bắt đầu Realtime** để chạy mô phỏng luồng dữ liệu cập nhật mỗi 3s.
3. Nhìn biểu đồ đường chạy động so sánh thực tế vs dự đoán của 3 khu vực địa lý cùng một lúc.

---

## Kịch bản 5: Huấn luyện tự thích ứng có Gating

> **Chứng minh:** Cơ chế Performance Gate ngăn chặn sự suy giảm của mô hình.

### Bước 5.1 – Kích hoạt retrain thủ công
```bash
curl -X POST http://localhost:8000/retrain
```
**Output nếu vượt qua chốt kiểm soát:**
```json
{
  "message": "Retraining triggered",
  "result": {
    "time": "2026-05-20T11:45:00Z",
    "metrics": {"mae": 2580.38, "rmse": 5452.27, "r2": 0.9922},
    "previous_metrics": {"mae": 2610.11, "rmse": 5510.45, "r2": 0.9918},
    "status": "success"
  }
}
```

**Output nếu mô hình mới bị suy giảm chất lượng (bị chặn):**
```json
{
  "message": "Retraining triggered",
  "result": {
    "time": "2026-05-20T11:45:00Z",
    "metrics": {"mae": 2580.38, "rmse": 5452.27, "r2": 0.9922},
    "candidate_metrics": {"mae": 4500.22, "rmse": 8900.54, "r2": 0.9650},
    "status": "gated"
  }
}
```
*Chỉ ra:* Trạng thái trả về là `gated` nếu mô hình mới huấn luyện bị giảm chất lượng hơn 2% so với mô hình đang chạy. Hệ thống tự động từ chối ghi đè file `model.pkl` để giữ tính ổn định cho ứng dụng.

---

## Kịch bản 6: Docker Swarm & Benchmark hiệu năng

> **Chứng minh:** Triển khai Multi-replica, Load Balancing trên Docker Swarm và đo lường hiệu năng.

### Bước 6.1 – Khởi động benchmark tải hệ thống
```bash
python cluster/benchmark.py
```
*Chỉ ra:* Script sẽ gửi 100 requests đồng thời (concurrency=10) vào API để đo lường Throughput (RPS) và Latency thực tế của môi trường hiện tại, sau đó lưu kết quả vào `data/processed/docker_benchmark.json`.

### Bước 6.2 – So sánh hiệu năng trên Dashboard
1. Mở tab **"Docker Swarm"** trên Dashboard.
2. Kiểm tra biểu đồ so sánh:
   - **Throughput (RPS):** Docker Swarm (2 Replicas) đạt **~135 RPS** vượt trội so với 1 container thông thường (~78 RPS).
   - **Độ trễ (Latency ms):** Độ trễ trung bình của Swarm chỉ khoảng **7.4 ms** do tải được định tuyến vòng (Round-Robin) tới các bản sao container khác nhau.
