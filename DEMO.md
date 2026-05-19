# 🎬 DEMO – Kịch bản chứng minh yêu cầu đề tài

> **Đề tài 12 – Phân tích và Dự đoán Doanh thu Bán lẻ**  
> File này hướng dẫn từng bước demo để chứng minh hệ thống đáp ứng đầy đủ yêu cầu.

---

## ✅ Checklist yêu cầu đề tài

| # | Yêu cầu | Kịch bản demo |
|---|---------|--------------|
| 1 | Tiền xử lý và phân tích dữ liệu bán lẻ | [Kịch bản 1](#kịch-bản-1-huấn-luyện-và-đánh-giá-mô-hình) |
| 2 | Xây dựng mô hình dự báo doanh thu (Random Forest) | [Kịch bản 1](#kịch-bản-1-huấn-luyện-và-đánh-giá-mô-hình) |
| 3 | Đánh giá mô hình và trực quan hóa kết quả | [Kịch bản 1](#kịch-bản-1-huấn-luyện-và-đánh-giá-mô-hình) + [Kịch bản 4](#kịch-bản-4-dashboard-realtime) |
| 4 | REST API nhận dữ liệu và trả về dự báo | [Kịch bản 2](#kịch-bản-2-dự-đoán-đơn-lẻ-qua-api) + [Kịch bản 3](#kịch-bản-3-dự-đoán-hàng-loạt-batch-csv) |
| 5 | Triển khai toàn bộ hệ thống trên Docker Swarm | [Kịch bản 6](#kịch-bản-6-docker-swarm) |
| A | Tự động cập nhật mô hình hằng ngày *(nâng cao)* | [Kịch bản 5](#kịch-bản-5-tự-động-retrain-mô-hình) |
| B | Phân tích sâu theo khu vực, cửa hàng, nhóm SP *(nâng cao)* | [Kịch bản 2](#kịch-bản-2-dự-đoán-đơn-lẻ-qua-api) + [Kịch bản 4](#kịch-bản-4-dashboard-realtime) |
| C | Dashboard realtime doanh thu thực tế vs dự đoán *(nâng cao)* | [Kịch bản 4](#kịch-bản-4-dashboard-realtime) |

---

## 🔧 Chuẩn bị trước khi demo

Đảm bảo các service đang chạy:

```bash
# Kiểm tra Docker Swarm services
docker service ls
```

**Kết quả mong đợi:**
```
ID             NAME                      MODE         REPLICAS   IMAGE
xxx            retail_system_api         replicated   1/1        retail-system-api:latest         *:8000->8000/tcp
xxx            retail_system_dashboard   replicated   1/1        retail-system-dashboard:latest   *:5173->5173/tcp
```

**Các URL cần mở sẵn:**
- 🔗 API: http://localhost:8000
- 📖 Swagger UI: http://localhost:8000/docs
- 🖥️ Dashboard: http://localhost:5173

---

## Kịch bản 1: Huấn luyện và đánh giá mô hình

> **Chứng minh:** Yêu cầu 1 (tiền xử lý dữ liệu) + Yêu cầu 2 (mô hình Random Forest) + Yêu cầu 3 (đánh giá)

### Bước 1.1 – Xem dữ liệu huấn luyện

```bash
python -c "import pandas as pd; df = pd.read_csv('data/raw/revenue_sample.csv'); print(df.head(10).to_string())"
```

**Chỉ ra:** Dữ liệu có 8 cột gồm cả số (thoi_gian, dong_tien, don_hang, san_pham) và categorical (khu_vuc, cua_hang, nhom_san_pham) → thể hiện đã tiền xử lý đa chiều.

### Bước 1.2 – Huấn luyện lại mô hình

```bash
python model/train_model.py
```

**Output mong đợi:**
```
Training complete
MAE:      41132.12
RMSE:     65683.16
R2 Score: 0.8727
Saved model: model/model.pkl
```

**Chỉ ra:** R² = 0.87 → mô hình giải thích được 87% phương sai doanh thu. Model được lưu vào `model/model.pkl`.

### Bước 1.3 – Đánh giá mô hình trên dữ liệu huấn luyện

```bash
python model/evaluate_model.py --input data/raw/revenue_sample.csv
```

**Chỉ ra:** In ra bảng dự đoán cho từng dòng kèm MAE / RMSE / R² so với revenue thực.

---

## Kịch bản 2: Dự đoán đơn lẻ qua API

> **Chứng minh:** Yêu cầu 4 (REST API) + Yêu cầu nâng cao B (phân tích theo khu vực/cửa hàng/nhóm SP)

### Bước 2.1 – Gọi API qua curl

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d "{\"thoi_gian\": 12, \"dong_tien\": 50000, \"don_hang\": 1200, \"san_pham\": 2500, \"khu_vuc\": \"Nam\", \"cua_hang\": \"CH3\", \"nhom_san_pham\": \"DienTu\"}"
```

**Output mong đợi:**
```json
{"predicted_revenue": 612000.0}
```

### Bước 2.2 – So sánh dự đoán giữa các khu vực

Gọi lần lượt 3 request với `khu_vuc` khác nhau nhưng các thông số khác giống nhau:

```bash
# Khu vực Bắc
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d "{\"thoi_gian\": 6, \"dong_tien\": 28000, \"don_hang\": 800, \"san_pham\": 1500, \"khu_vuc\": \"Bac\", \"cua_hang\": \"CH1\", \"nhom_san_pham\": \"DienTu\"}"

# Khu vực Trung
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d "{\"thoi_gian\": 6, \"dong_tien\": 28000, \"don_hang\": 800, \"san_pham\": 1500, \"khu_vuc\": \"Trung\", \"cua_hang\": \"CH2\", \"nhom_san_pham\": \"DienTu\"}"

# Khu vực Nam
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d "{\"thoi_gian\": 6, \"dong_tien\": 28000, \"don_hang\": 800, \"san_pham\": 1500, \"khu_vuc\": \"Nam\", \"cua_hang\": \"CH3\", \"nhom_san_pham\": \"DienTu\"}"
```

**Chỉ ra:** Kết quả khác nhau giữa 3 khu vực → mô hình đã học được đặc trưng địa lý.

### Bước 2.3 – Demo trên Dashboard

1. Mở **http://localhost:5173**
2. Chọn tab **"🎯 Dự đoán đơn"**
3. Điền các thông số → chọn **Khu vực**, **Cửa hàng**, **Nhóm sản phẩm** từ dropdown
4. Bấm **"⚡ Dự đoán doanh thu"**
5. Thấy: số doanh thu dự đoán + **BarChart** khoảng tin cậy (Thấp / Dự báo / Cao)

**Chỉ ra:** Giao diện người dùng đồ họa, nhập liệu trực quan, kết quả hiển thị ngay lập tức.

---

## Kịch bản 3: Dự đoán hàng loạt (Batch CSV)

> **Chứng minh:** Yêu cầu 4 (API nhận file CSV và trả về nhiều dự báo)

### Bước 3.1 – Tạo file test CSV

Tạo file `test_batch.csv` với nội dung:

```csv
thoi_gian,dong_tien,don_hang,san_pham,khu_vuc,cua_hang,nhom_san_pham
6,28000,800,1500,Nam,CH3,DienTu
12,50000,1200,2500,Bac,CH1,GiaDung
3,20000,600,1200,Trung,CH2,ThucPham
10,40000,1000,2000,Nam,CH3,GiaDung
```

### Bước 3.2 – Gọi API batch

```bash
curl -X POST http://localhost:8000/predict/batch \
  -F "file=@test_batch.csv"
```

**Output mong đợi:**
```json
[
  {"thoi_gian": 6, "dong_tien": 28000, ..., "predicted_revenue": 218400.0},
  {"thoi_gian": 12, "dong_tien": 50000, ..., "predicted_revenue": 375000.0},
  {"thoi_gian": 3, "dong_tien": 20000, ..., "predicted_revenue": 109200.0},
  {"thoi_gian": 10, "dong_tien": 40000, ..., "predicted_revenue": 380000.0}
]
```

**Chỉ ra:** Một lần gọi API → nhận kết quả dự đoán cho toàn bộ file CSV.

### Bước 3.3 – Demo trên Dashboard

1. Mở tab **"📂 Batch CSV"**
2. Bấm chọn file → upload `test_batch.csv`
3. Thấy: bảng kết quả dự đoán hiển thị từng dòng với doanh thu dự đoán

---

## Kịch bản 4: Dashboard Realtime

> **Chứng minh:** Yêu cầu 3 (trực quan hóa) + Yêu cầu nâng cao B (phân tích nhóm) + Yêu cầu nâng cao C (realtime)

### Bước 4.1 – Analytics theo nhóm (API)

```bash
curl http://localhost:8000/analytics/summary
```

**Output mong đợi:**
```json
{
  "by_khu_vuc": {
    "Bac":   {"avg_revenue": 283375.0, "total_revenue": 2267000.0, "records": 8},
    "Nam":   {"avg_revenue": 308325.0, "total_revenue": 2466600.0, "records": 8},
    "Trung": {"avg_revenue": 283575.0, "total_revenue": 2268600.0, "records": 8}
  },
  "by_cua_hang": {
    "CH1": {"avg_revenue": 283375.0, ...},
    "CH2": {"avg_revenue": 283575.0, ...},
    "CH3": {"avg_revenue": 308325.0, ...}
  },
  "by_nhom_san_pham": {
    "DienTu":   {"avg_revenue": 330000.0, ...},
    "GiaDung":  {"avg_revenue": 279025.0, ...},
    "ThucPham": {"avg_revenue": 266250.0, ...}
  },
  "total_revenue": 7002200.0,
  "total_records": 24
}
```

**Chỉ ra:** Hệ thống phân tích được doanh thu theo từng **khu vực địa lý**, **cửa hàng cụ thể** và **nhóm sản phẩm** → đúng yêu cầu nâng cao B.

### Bước 4.2 – Demo Realtime trên Dashboard

1. Mở tab **"📡 Realtime Dashboard"**
2. Cuộn xuống → thấy **3 BarChart** phân tích theo Khu vực / Cửa hàng / Nhóm SP
3. Bấm **"▶ Bắt đầu Realtime"**
4. Quan sát:
   - 🟢 Indicator "Live · cập nhật mỗi 3s" sáng lên
   - **LineChart** bắt đầu vẽ 4 đường đồng thời:
     - `Thực tế (mô phỏng)` – đường nét đứt màu xám
     - `🏔️ Bắc - CH1` – đường màu tím
     - `🌊 Trung - CH2` – đường màu xanh lá
     - `🌴 Nam - CH3` – đường màu vàng
   - Mỗi 3 giây: 3 lần gọi API đồng thời → 3 dự đoán mới → đồ thị cập nhật
5. Bấm **"⏹ Dừng stream"** để dừng

**Chỉ ra:** Dashboard trực quan hóa doanh thu thực tế vs dự đoán theo thời gian thực, so sánh đồng thời 3 khu vực địa lý.

---

## Kịch bản 5: Tự động retrain mô hình

> **Chứng minh:** Yêu cầu nâng cao A (tự động cập nhật mô hình hằng ngày)

### Bước 5.1 – Kích hoạt retrain thủ công

```bash
curl -X POST http://localhost:8000/retrain
```

**Output mong đợi:**
```json
{
  "message": "Retraining triggered",
  "result": {
    "time": "2026-05-19T10:55:00Z",
    "metrics": {"mae": 41132.12, "rmse": 65683.16, "r2": 0.8727},
    "status": "success"
  }
}
```

### Bước 5.2 – Kiểm tra trạng thái

```bash
curl http://localhost:8000/retrain/status
```

**Chỉ ra:** API trả về thời điểm và kết quả của lần retrain gần nhất. Container không cần khởi động lại – mô hình mới được hot-reload ngay lập tức.

### Bước 5.3 – Xem logs scheduler trong container

```bash
docker service logs retail_system_api --tail 30
```

**Chỉ ra:** Log hiển thị `[Scheduler] Auto-retrain scheduler started (daily at 00:00 UTC)` → hệ thống đã đăng ký job tự động chạy hằng ngày lúc 00:00 UTC.

### Bước 5.4 – Demo trên Dashboard

1. Tab **"📡 Realtime Dashboard"**
2. Bấm **"🔄 Retrain ngay"**
3. Thấy: badge hiển thị `status: success` + `R²: 0.8727` ngay trên Dashboard

---

## Kịch bản 6: Docker Swarm

> **Chứng minh:** Yêu cầu 5 (triển khai Docker Swarm)

### Bước 6.1 – Kiểm tra services đang chạy

```bash
docker service ls
```

**Output thực tế (đã chạy):**
```
ID             NAME                      MODE         REPLICAS   IMAGE                            PORTS
vowdhqs2026r   retail_system_api         replicated   1/1        retail-system-api:latest         *:8000->8000/tcp
m4ga4r6425d1   retail_system_dashboard   replicated   1/1        retail-system-dashboard:latest   *:5173->5173/tcp
```

**Chỉ ra:** 2 services đang chạy trên Docker Swarm, mỗi service 1/1 replica ổn định.

### Bước 6.2 – Scale API lên 2 replicas

```bash
docker service scale retail_system_api=2
docker service ls
```

**Output mong đợi:**
```
retail_system_api   replicated   2/2   retail-system-api:latest   *:8000->8000/tcp
```

**Chỉ ra:** Docker Swarm hỗ trợ scale horizontal không cần downtime.

### Bước 6.3 – Xem logs service

```bash
docker service logs retail_system_api --tail 20 --follow
```

**Chỉ ra:** Logs từ tất cả replicas được aggregate vào một chỗ – đặc trưng của Docker Swarm orchestration.

### Bước 6.4 – Deploy từ script

```bash
# Xem nội dung script
cat cluster/deploy.sh

# Chạy toàn bộ pipeline (init swarm + build + deploy)
bash cluster/deploy.sh
```

**Chỉ ra:** Toàn bộ quy trình CI/CD được đóng gói trong 1 script shell duy nhất.

### Bước 6.5 – Kiểm tra Swarm mode

```bash
docker info | findstr "Swarm"
```

**Output mong đợi:**
```
Swarm: active
```

---

## 📊 Bảng tổng hợp kết quả

| Yêu cầu | Chứng minh bằng | Kết quả |
|---------|----------------|---------|
| Dữ liệu bán lẻ (dòng tiền, đơn hàng, SP, thời gian) | `revenue_sample.csv` – 8 features, 24 records | ✅ |
| Mô hình Random Forest | `python model/train_model.py` | R² = **0.8727** |
| Đánh giá mô hình | `python model/evaluate_model.py` | MAE = 41132, RMSE = 65683 |
| REST API dự đoán | `POST /predict` · Swagger UI · Dashboard | HTTP 200 + `predicted_revenue` |
| Docker Swarm | `docker service ls` → 2 services `1/1` | ✅ Running |
| **Nâng cao A** – Retrain hằng ngày | `POST /retrain` · APScheduler 00:00 UTC | ✅ Hot-reload |
| **Nâng cao B** – Phân tích theo nhóm | `GET /analytics/summary` · 3 BarChart | ✅ 3 chiều |
| **Nâng cao C** – Dashboard realtime | Tab Realtime · LineChart streaming 3s | ✅ Live |
