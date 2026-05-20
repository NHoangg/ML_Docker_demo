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

## 🔧 Thiết lập môi trường và Khởi chạy (Setup & Run)

Thực hiện các bước sau để thiết lập môi trường và khởi chạy ứng dụng từ đầu:

### Bước 1: Thiết lập và chạy Backend API
Mở một cửa sổ Terminal (PowerShell) tại thư mục dự án:
```powershell
# 1. Kích hoạt môi trường ảo Python
.\.venv\Scripts\activate

# 2. Cài đặt các thư viện backend cần thiết
pip install -r api/requirements.txt

# 3. Khởi chạy FastAPI API server
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

## Kịch bản 1: Huấn luyện và đánh giá Baseline

> **Chứng minh:** Quy trình xử lý tiền xử lý dữ liệu và So sánh mô hình nền (Linear Regression vs Decision Tree vs Random Forest) để tìm thuật toán tối ưu.

### Bước 1.1 – Khám phá và xem cấu trúc dữ liệu huấn luyện
Chạy lệnh Python nhanh dưới đây từ Terminal để xem trước 5 dòng đầu tiên của tập dữ liệu huấn luyện thực tế:
```bash
python -c "import pandas as pd; df = pd.read_csv('data/raw/revenue_sample.csv'); print(df.head(5).to_string())"
```
**Giải thích cấu trúc dữ liệu trả về:**
- **thoi_gian (tháng):** Giá trị số từ 1 đến 12 thể hiện các tháng trong năm (đặc trưng tính mùa vụ).
- **dong_tien (VNĐ):** Vốn xoay vòng hoạt động của cửa hàng tại tháng đó.
- **don_hang:** Tổng số lượng đơn hàng phát sinh trong tháng.
- **san_pham:** Tổng số sản phẩm bán ra được.
- **khu_vuc:** Biến phân loại gồm 3 vùng thị trường (`Bac` - Bắc, `Trung` - Trung, `Nam` - Nam).
- **cua_hang:** Mã định danh của chuỗi cửa hàng tương ứng (`CH1`, `CH2`, `CH3`).
- **nhom_san_pham:** Ngành hàng sản phẩm bán lẻ (`ThucPham` - Thực phẩm, `GiaDung` - Gia dụng, `DienTu` - Điện tử).
- **revenue (VNĐ):** Doanh thu thực tế đạt được (Nhãn mục tiêu $y$).

### Bước 1.2 – Chạy script so sánh các mô hình Baseline
Chạy script huấn luyện so sánh tự động để kiểm chứng hiệu năng R² và MAE của cả 3 mô hình thuật toán nền tảng:
```bash
python model/baseline_comparison.py
```
**Ý nghĩa kỹ thuật của script:**
1. Đọc dữ liệu từ `data/raw/revenue_sample.csv`.
2. Phân tách tập dữ liệu thành `Train set (80%)` và `Test set (20%)`.
3. Áp dụng kỹ thuật mã hóa One-Hot Encoding cho các biến phân loại để chuẩn bị dữ liệu đầu vào phù hợp.
4. Huấn luyện đồng thời 3 mô hình: **Linear Regression (Tuyến tính)**, **Decision Tree (Cây quyết định)**, và **Random Forest (Rừng ngẫu nhiên)**.
5. Đo lường thời gian huấn luyện và tính toán các thang đo chất lượng khoa học: MAE, RMSE, và R² Score.
6. Lưu bảng so sánh hiệu năng vào tệp cấu hình JSON tại `data/processed/model_comparison.json`.

**Kết quả mong đợi trên Console:**
```
Starting baseline model comparison...
Finished Linear Regression         | R2: -0.0963 | MAE: 19485.66 | Train Time: 0.0148s
Finished Decision Tree             | R2: 0.9868 | MAE: 4197.24 | Train Time: 0.0085s
Finished Random Forest (Proposed)  | R2: 0.9922 | MAE: 2580.38 | Train Time: 0.3046s
```
*Nhận xét:* Mô hình Tuyến tính (Linear Regression) thất bại hoàn toàn do doanh thu bán lẻ có tính chất phi tuyến phức tạp ($R^2 < 0$). Mô hình Random Forest đề xuất đạt chất lượng vượt trội nhất với hệ số xác định $R^2 \approx 0.99$ và sai số trung bình (MAE) cực thấp chỉ khoảng ~2,580 VNĐ.

---

## Kịch bản 2: Dự đoán đơn lẻ qua API kèm giải thích XAI

> **Chứng minh:** Khả năng giao tiếp REST API và tính toán đóng góp cục bộ Explainable AI (XAI) thời gian thực theo phương pháp Perturbation.

### Bước 2.1 – Gửi truy vấn dự toán đơn lẻ đến API
Thực hiện gửi một bản ghi bán lẻ thông qua phương thức POST tới cổng API dịch vụ để kiểm tra kết quả dự toán và phân tích đóng góp đặc trưng.

**Cách 1: Sử dụng cURL.exe trên Windows Command Prompt hoặc Git Bash:**
```bash
curl.exe -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d "{\"thoi_gian\":12,\"dong_tien\":32000,\"don_hang\":1500,\"san_pham\":3000,\"khu_vuc\":\"Bac\",\"cua_hang\":\"CH1\",\"nhom_san_pham\":\"DienTu\"}"
```

**Cách 2: Sử dụng lệnh gốc của Windows PowerShell (Tránh trùng alias cURL):**
```powershell
Invoke-RestMethod -Uri http://localhost:8000/predict -Method Post -ContentType "application/json" -Body '{"thoi_gian": 12, "dong_tien": 32000, "don_hang": 1500, "san_pham": 3000, "khu_vuc": "Bac", "cua_hang": "CH1", "nhom_san_pham": "DienTu"}'
```

**Chi tiết các thông số đầu vào gửi đi:**
- `"thoi_gian": 12` : Tháng 12 (mùa mua sắm cuối năm).
- `"dong_tien": 32000` : Vòng xoay tiền vốn là 32,000,000 VNĐ.
- `"don_hang": 1500` : Số lượng đơn đặt hàng là 1,500 đơn.
- `"san_pham": 3000` : Lượng sản phẩm bán là 3,000 đơn vị.
- `"khu_vuc": "Bac"`, `"cua_hang": "CH1"`, `"nhom_san_pham": "DienTu"` : Cửa hàng CH1 miền Bắc bán ngành hàng Điện tử.

**Kết quả JSON nhận về:**
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
**Giải thích kết quả XAI:**
API trả về doanh thu dự báo là **612.000.000 VNĐ** cùng với đóng góp tương ứng của từng thuộc tính so với giá trị mặc định (baseline). 
- Dòng tiền lớn đóng góp tích cực nhiều nhất kéo tăng **+412.500.000 VNĐ**.
- Danh mục ngành hàng Điện tử kéo tăng thêm **+85.000.000 VNĐ** doanh thu.
- Tuy nhiên, tồn kho sản phẩm quá cao làm giảm nhẹ doanh thu **-1.500.000 VNĐ** (hiển thị màu đỏ trên UI).

### Bước 2.2 – Kiểm tra trên giao diện Web Dashboard
1. Mở trình duyệt truy cập Tab **"Dự đoán & XAI"**.
2. Thay đổi các con số trên bảng nhập liệu hoặc chọn nhanh từ phần gợi ý kịch bản.
3. Bấm **⚡ Dự đoán doanh thu** và quan sát biểu đồ đóng góp đặc trưng trực quan của XAI (Màu xanh: tăng doanh thu, Màu đỏ: giảm doanh thu).

---

## Kịch bản 3: Dự đoán hàng loạt (Batch CSV)

> **Chứng minh:** Khả năng xử lý tệp tin đầu vào (Multipart upload), chuyển đổi cấu trúc DataFrame và trả về kết quả dự đoán hàng loạt.

### Bước 3.1 – Tạo hoặc kiểm tra tệp tin CSV mẫu
Hệ thống đã chuẩn bị sẵn tệp tin `test_batch.csv` ở thư mục gốc của dự án chứa các thông tin cần suy luận hàng loạt:
```csv
thoi_gian,dong_tien,don_hang,san_pham,khu_vuc,cua_hang,nhom_san_pham
10,32000,880,1700,Nam,CH3,ThucPham
11,45000,1100,2200,Trung,CH2,DienTu
12,50000,1200,2500,Bac,CH1,DienTu
```

### Bước 3.2 – Gửi tệp tin CSV qua API Batch
Thực hiện upload tệp tin CSV để API tự động phân tích và tính toán đồng thời các bản ghi dữ liệu.

**Cách 1: Chạy lệnh cURL.exe từ Terminal:**
```bash
curl.exe -X POST http://localhost:8000/predict/batch -F "file=@test_batch.csv"
```

**Cách 2: Chạy lệnh gốc của Windows PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:8000/predict/batch -Method Post -Form @{file=[System.IO.FileInfo]"test_batch.csv"}
```

**Kịch bản xử lý của API phía Backend:**
1. Tiếp nhận file tải lên thông qua middleware `UploadFile`.
2. Kiểm tra định dạng đuôi file (`.csv`).
3. Sử dụng `pandas.read_csv()` để nạp file vào bộ nhớ dưới dạng DataFrame.
4. Kiểm duyệt các tiêu đề cột bắt buộc. Nếu thiếu bất kỳ cột nào, API sẽ lập tức trả về lỗi `HTTP 400`.
5. Đưa dữ liệu qua pipeline Random Forest để suy luận hàng loạt.
6. Thêm cột `predicted_revenue` vào DataFrame và trả về toàn bộ dữ liệu kèm kết quả dự đoán dạng JSON.

**Kết quả nhận được:**
Mảng JSON chi tiết chứa đầy đủ các bản ghi đã được đính kèm trường `"predicted_revenue"` cụ thể cho từng chuỗi cửa hàng.

### Bước 3.3 – Tải tệp lên giao diện Dashboard
1. Truy cập tab **"Batch CSV"** trên giao diện Web.
2. Click nút tải file lên, chọn tệp tin **`test_batch.csv`** tại thư mục gốc của dự án.
3. Kết quả dự đoán chi tiết của 10 cửa hàng sẽ hiển thị trực quan.

---

## Kịch bản 4: Đánh giá mô hình & Error Analysis trực quan

> **Chứng minh:** Khả năng tự phát hiện lỗi dựa trên thống kê độ lệch Z-Score động và giám sát Concept Drift (Page-Hinkley) từ chuỗi sai số.

### Bước 4.1 – Gọi API phân tích chất lượng từ Terminal
Bạn có thể gọi trực tiếp API để xem các tính toán thống kê lỗi và concept drift từ Backend:
```bash
curl.exe http://localhost:8000/analytics/summary
```
**Phân tích dữ liệu trả về từ API:**
- `chart_points`: Tập 100 điểm dữ liệu đối sánh thực tế vs dự đoán phục vụ việc vẽ đồ thị độ chính xác.
- `feature_importances`: Chỉ số đóng góp toàn cục của các đặc trưng (giúp chứng minh biến `dong_tien` và `don_hang` là 2 yếu tố tác động mạnh nhất).
- `error_analysis`: Danh sách 5 dòng dự báo sai nhiều nhất. Backend tự động tính Z-Score của các biến đầu vào để sinh ra giải thích cụ thể: *"Dự đoán thấp hơn thực tế do cửa hàng có lượng đơn hàng vượt mức trung bình đáng kể ($z > 1.5$)..."*.
- `drift_history`: Lịch sử điểm tích lũy Page-Hinkley để giám sát trôi lệch dữ liệu.

### Bước 4.2 – Xem các công cụ trực quan trên giao diện
1. Mở tab **"Đánh giá & Lỗi"** để kiểm tra:
   - Đồ thị Scatter đối sánh giúp quan định dạng độ lệch tuyến tính.
   - Thẻ phân tích lỗi tự động bôi màu vàng cảnh báo các thuộc tính bị bất thường gây sai lệch dự toán.
   - Biểu đồ đường **Page-Hinkley Concept Drift** trực quan.
2. Chuyển qua tab **"Realtime Live"** bấm **▶ Bắt đầu Realtime** để theo dõi luồng giả lập thay đổi của doanh số trôi chảy mỗi 3 giây.

---

## Kịch bản 5: Huấn luyện tự thích ứng và chốt chặn Performance Gate

> **Chứng minh:** Chốt an toàn ngăn chặn sự suy giảm hiệu năng khi huấn luyện lại mô hình mới (Performance Gate).

### Bước 5.1 – Kích hoạt tiến trình huấn luyện lại qua API
Gửi yêu cầu huấn luyện lại mô hình từ Terminal để kích hoạt quy trình kiểm định chất lượng:
```bash
curl.exe -X POST http://localhost:8000/retrain
```

**Quy trình kiểm định ngầm của hệ thống (Performance Gate):**
1. Backend gọi hàm huấn luyện mô hình mới (Candidate model) trên tập dữ liệu mở rộng.
2. Đo lường sai số MAE và R² của mô hình ứng viên mới này trên tập dữ liệu test.
3. So sánh hiệu năng với mô hình đang vận hành (Current model).
4. Áp dụng điều kiện chặn:
   $$\text{Nếu } R^2_{new} < R^2_{old} - 0.02 \implies \text{Từ chối (Gated)}$$
5. Nếu mô hình mới đạt chuẩn (không bị giảm R² quá 2%), hệ thống ghi đè file `model.pkl` và tự động hot-reload mô hình mới vào bộ nhớ. Trạng thái trả về sẽ là `success`. Nếu không đạt chuẩn, mô hình mới bị hủy và trạng thái trả về là `gated`.

**Mẫu kết quả JSON trả về nếu chốt chặn được thông qua (Success):**
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

**Mẫu kết quả JSON trả về nếu mô hình mới bị suy giảm chất lượng và bị chặn (Gated):**
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

---

## 🖥️ Phần 2: Hướng dẫn chạy Demo trực quan trên UI (Interactive UI Guide)

Bản cập nhật v3.0 đã tích hợp trực tiếp một trang **"Hướng dẫn Demo" (Demo Shell)** làm màn hình mặc định khi bạn truy cập Dashboard. Bạn có thể dễ dàng kích hoạt và theo dõi các kịch bản chỉ với các cú click chuột.

### 2.1 – Kịch bản 1: Baseline Comparison trên UI
1. Trên tab **"Hướng dẫn Demo"**, tìm thẻ **"Kịch bản 1"**.
2. Click nút **"📊 Xem so sánh Baseline"**.
3. Hệ thống sẽ tự động chuyển hướng bạn sang tab **Baseline** để hiển thị bảng số liệu chi tiết và 2 biểu đồ cột so sánh trực quan chỉ số $R^2$ và sai số MAE giữa Linear Regression, Decision Tree và Random Forest.

### 2.2 – Kịch bản 2: Dự đoán đơn lẻ & XAI trên UI
1. Tìm thẻ **"Kịch bản 2"** trên trang Hướng dẫn.
2. Click nút **"🎯 Tự động điền & chạy XAI"**.
3. Hệ thống sẽ tự động chuyển sang tab **"Dự đoán & XAI"**, điền các giá trị mẫu (Tháng 12, Dòng tiền 32K, Đơn hàng 1500, Sản phẩm 3000, Cửa hàng 1, Khu vực Bắc, Nhóm Điện tử) và thực thi dự đoán ngay lập tức.
4. Bạn sẽ thấy kết quả dự đoán cùng biểu đồ cột ngang thể hiện trực quan mức độ đóng góp cục bộ (XAI) của từng biến số.

### 2.3 – Kịch bản 3: Dự đoán hàng loạt (Batch CSV) trên UI
1. Tìm thẻ **"Kịch bản 3"** trên trang Hướng dẫn.
2. Click nút **"📂 Chuyển sang Batch CSV"**.
3. Hệ thống chuyển sang tab **Batch CSV**, nơi bạn chỉ cần nhấn chọn file `test_batch.csv` và hệ thống sẽ xử lý hiển thị bảng kết quả cho bạn.

### 2.4 – Kịch bản 4: Đánh giá sai số & Drift trên UI
1. Tìm thẻ **"Kịch bản 4"**.
2. Click nút **"📈 Xem Đánh giá & Drift"**.
3. Hệ thống sẽ chuyển hướng đến tab **"Đánh giá & Lỗi"**, hiển thị:
   - Biểu đồ đường **Thực tế vs Dự toán** và độ quan trọng đặc trưng toàn cục.
   - Thẻ xếp hạng phân tích lỗi (**Error Analysis Cards**) - tự động bôi vàng cảnh báo các thuộc tính có Z-score bất thường ($z > 1.5$) kèm giải thích chi tiết.
   - Biểu đồ theo dõi độ lệch phân phối **Page-Hinkley Concept Drift**.

### 2.5 – Kịch bản 5: Kiểm soát chất lượng Retrain (Performance Gate) trên UI
1. Tìm thẻ **"Kịch bản 5"** trên trang Hướng dẫn.
2. Click nút **"⚡ Kích hoạt Retrain Ngay Lập Tức (Manual Trigger)"**.
3. Dashboard sẽ gọi trực tiếp API `/retrain` nền và hiển thị trực tiếp một hộp thoại nhật ký (logs) màu xanh lá ở phía dưới. Nhật ký này cho biết trạng thái huấn luyện là `success` (Mô hình tốt hơn được cập nhật) hay `gated` (Bị chặn do chất lượng kém hơn mô hình cũ).

### 2.6 – Kịch bản 6: Đánh giá hiệu năng Swarm Load Balancing trên UI
1. Tìm thẻ **"Kịch bản 6"**.
2. Click nút **"🐳 Xem biểu đồ Docker Swarm"**.
3. Hệ thống chuyển đến tab **Docker Swarm** để hiển thị so sánh Throughput (RPS), Latency, CPU và RAM của cụm multi-replica.
