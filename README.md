# 🛒 Retail Revenue Forecasting System

> **Đề tài 12 – Phân tích và Dự đoán Doanh thu Bán lẻ**

Hệ thống phân tích và dự đoán doanh thu bán lẻ dựa trên dữ liệu lịch sử, bao gồm mô hình ML, REST API, Dashboard React và triển khai Docker Swarm.

---

## 📁 Cấu trúc thư mục

```
ML_Docker_demo/
├── data/
│   ├── raw/
│   │   ├── revenue_sample.csv       ← Dữ liệu huấn luyện
│   │   └── new_revenue_features.csv ← Dữ liệu dự đoán batch
│   └── processed/
├── model/
│   ├── train_model.py               ← Script huấn luyện mô hình
│   ├── evaluate_model.py            ← Script đánh giá / dự đoán offline
│   └── model.pkl                    ← Model đã huấn luyện (Random Forest)
├── api/
│   ├── main.py                      ← FastAPI application
│   ├── predictor.py                 ← Inference engine
│   ├── schemas.py                   ← Pydantic request/response schemas
│   └── requirements.txt
├── docker/
│   ├── Dockerfile                   ← Multi-stage build
│   ├── docker-compose.yml           ← Compose config
│   └── docker-stack.yml
├── cluster/
│   └── deploy.sh                    ← Script triển khai Docker Swarm
├── dashboard/
│   └── src/
│       ├── main.jsx                 ← React app (3 tabs)
│       └── styles.css
├── README.md
└── DEMO.md                          ← Kịch bản demo & chứng minh yêu cầu
```

---

## ⚙️ Cài đặt & Chạy

### Yêu cầu hệ thống
- Python 3.10+
- Node.js 18+
- Docker Desktop

### 1. Cài đặt Python

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r api/requirements.txt
```

### 2. Huấn luyện mô hình

```bash
python model/train_model.py
```

### 3. Chạy API (FastAPI)

```bash
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

→ Swagger UI: **http://localhost:8000/docs**

### 4. Chạy Dashboard (React)

```bash
cd dashboard
npm install
npm run dev
```

→ Dashboard: **http://localhost:5173**

### 5. Triển khai Docker Swarm

```bash
# Build images
docker compose -f docker/docker-compose.yml build

# Khởi tạo Swarm (nếu chưa có)
docker swarm init

# Deploy stack
docker stack deploy -c docker/docker-compose.yml retail_system

# Hoặc dùng script
bash cluster/deploy.sh
```

---

## 🔗 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Health check |
| GET | `/docs` | Swagger UI |
| POST | `/predict` | Dự đoán đơn lẻ |
| POST | `/predict/batch` | Dự đoán batch (CSV) |
| GET | `/analytics/summary` | Thống kê theo khu vực/cửa hàng/nhóm SP |
| POST | `/retrain` | Kích hoạt retrain thủ công |
| GET | `/retrain/status` | Trạng thái retrain gần nhất |

---

## 👥 Phân công nhóm

| Thành viên | Vai trò | File chính |
|------------|---------|-----------|
| Data Engineer | Thu thập, tiền xử lý dữ liệu | `data/`, `model/train_model.py` |
| ML Engineer | Xây dựng và tối ưu mô hình | `model/train_model.py`, `model/evaluate_model.py` |
| API Developer | REST API FastAPI | `api/` |
| DevOps Engineer | Docker, Swarm | `docker/`, `cluster/` |
| Data Analyst & Tester | Dashboard, kiểm thử | `dashboard/`, `DEMO.md` |

> 📋 **Xem kịch bản demo chi tiết tại [DEMO.md](DEMO.md)**
