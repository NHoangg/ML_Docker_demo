# Hướng Dẫn Sử Dụng Hệ Thống Dự Báo Doanh Thu

Tài liệu này cung cấp hướng dẫn chi tiết về cách cài đặt, vận hành và sử dụng hệ thống dự báo doanh thu dựa trên mô hình Machine Learning (Random Forest). Hệ thống bao gồm 3 thành phần chính:
1. **Mô hình AI**: Huấn luyện và dự đoán dựa trên dữ liệu.
2. **REST API (FastAPI)**: Cung cấp giao diện lập trình ứng dụng (API) tự động giao tiếp với mô hình.
3. **Web Dashboard (React)**: Giao diện trực quan thân thiện dành cho người dùng cuối.

---

## 1. Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo máy tính/máy chủ của bạn đã cài đặt các công cụ sau:
- **Python 3.8+** (Dành cho việc chạy mô hình và API cục bộ)
- **Node.js 16+** & **npm** (Dành cho việc chạy Dashboard cục bộ)
- **Docker** & **Docker Compose** (Khuyến nghị sử dụng để chạy toàn bộ hệ thống đồng bộ và nhanh chóng nhất)

---

## 2. Hướng Dẫn Khởi Chạy Nhanh Bằng Docker (Khuyến Nghị)

Cách đơn giản và ổn định nhất để khởi chạy hệ thống là sử dụng Docker. Bạn không cần phải cài đặt thủ công các môi trường ngôn ngữ như Python hay Node.js.

### Bước 1: Khởi động hệ thống
Mở Terminal / Command Prompt ở thư mục gốc của dự án (thư mục chứa file `docker-compose.yml`) và chạy lệnh sau:

```powershell
docker compose up --build
```

### Bước 2: Truy cập hệ thống
Sau khi quá trình build và khởi động hoàn tất, bạn có thể truy cập các thành phần qua trình duyệt:
- **Giao diện Web Dashboard:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Tài liệu REST API (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API Endpoint:** `http://127.0.0.1:8000`

### Bước 3: Dừng hệ thống
Để dừng toàn bộ hệ thống, bạn có thể nhấn `Ctrl + C` tại terminal đang chạy, hoặc mở một terminal khác tại thư mục gốc và chạy lệnh:
```powershell
docker compose down
```

---

## 3. Hướng Dẫn Chạy Cục Bộ (Thủ Công)

Nếu bạn là lập trình viên muốn phát triển thêm hoặc không sử dụng Docker, bạn có thể chạy thủ công từng dịch vụ.

### 3.1. Chạy API và Huấn luyện mô hình (Backend)

**Cài đặt thư viện:**
```powershell
python -m pip install -r requirements.txt
```

**Huấn luyện mô hình:**
Hệ thống cần có mô hình AI được huấn luyện trước khi có thể đưa ra dự báo.
```powershell
python train_revenue_model.py
```
*(Mô hình sau khi huấn luyện sẽ được lưu ở thư mục `models/revenue_random_forest.joblib`)*

**Khởi động REST API:**
```powershell
uvicorn api.main:app --reload
```
Server backend sẽ chạy tại: `http://127.0.0.1:8000`.

### 3.2. Chạy Web Dashboard (Frontend)

Mở một cửa sổ terminal mới, chuyển hướng vào thư mục `dashboard/`:
```powershell
cd dashboard
npm install
npm run dev -- --port 5173
```
Dashboard sẽ chạy tại: `http://127.0.0.1:5173`.

---

## 4. Hướng Dẫn Sử Dụng Chức Năng Dự Báo

### 4.1. Dành cho Người Dùng (Qua Web Dashboard)
1. Mở trình duyệt và truy cập vào Dashboard (`http://127.0.0.1:5173`).
2. Trên giao diện, bạn sẽ thấy các ô nhập liệu đại diện cho các chỉ số kinh doanh (Ví dụ: Chi phí Marketing, Số lượng khách truy cập, Tỉ lệ chuyển đổi, Giá trị trung bình đơn hàng...).
3. Nhập các thông số dự kiến của tháng tiếp theo hoặc các chiến dịch mới vào các ô này.
4. Bấm nút **"Dự báo"** (Predict).
5. Hệ thống AI sẽ tính toán và hiển thị trực quan kết quả **Doanh thu dự kiến** ngay trên màn hình.

### 4.2. Dành cho Chuyên Viên Dữ Liệu (Qua Terminal)
Bạn có thể đưa dữ liệu hàng loạt vào file CSV để dự báo:
1. Tạo một file `.csv` chứa các cột dữ liệu tương ứng với đặc trưng (features) huấn luyện, nhưng không có cột `revenue`.
2. Chạy lệnh sau:
```powershell
python predict_revenue.py --input data/ten_file_cua_ban.csv
```

### 4.3. Huấn Luyện Lại Mô Hình (Khi Có Dữ Liệu Mới)
Khi có thêm dữ liệu thực tế về doanh thu để giúp AI học và dự báo chính xác hơn:
1. Lưu tập dữ liệu dưới định dạng CSV và đặt vào thư mục `data/` (ví dụ: `data/doanh_thu_quy_3.csv`).
2. Chạy lệnh:
```powershell
python train_revenue_model.py --data data/doanh_thu_quy_3.csv --target ten_cot_doanh_thu
```
Hệ thống sẽ cập nhật mô hình với dữ liệu mới này.

---

## 5. Triển Khai Lên Máy Chủ (Production)

Hệ thống đã được thiết kế sẵn sàng để triển khai lên các cụm máy chủ lớn bằng **Docker Swarm**.

**Khởi tạo Swarm:**
```powershell
docker swarm init
```

**Triển khai hệ thống:**
```powershell
docker compose build
docker stack deploy -c docker/docker-stack.yml retail-system
```

**Kiểm tra và Scale hệ thống (đáp ứng nhiều lượt truy cập):**
```powershell
# Xem danh sách dịch vụ đang chạy
docker service ls

# Tăng cường số lượng máy chủ/bản sao xử lý API lên 5, Dashboard lên 3
docker service scale retail-system_api=5
docker service scale retail-system_dashboard=3
```

Để gỡ bỏ hệ thống khỏi cụm máy chủ:
```powershell
docker stack rm retail-system
```
