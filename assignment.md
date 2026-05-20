ĐỀ TÀI 12: PHÂN TÍCH VÀ DỰ ĐOÁN DOANH THU BÁN LẺ
Mô tả:
Xây dựng hệ thống phân tích và dự đoán doanh thu bán lẻ dựa trên dữ liệu lịch sử. Các yêu cầu chính:
- Tiền xử lý và phân tích dữ liệu bán lẻ (dòng tiền, đơn hàng, sản phẩm, thời gian).
- Xây dựng mô hình dự báo doanh thu (Linear Regression, Random Forest, Prophet...).
- Đánh giá mô hình và trực quan hóa kết quả dự đoán.
- Phát triển REST API nhận dữ liệu và trả về dự báo doanh thu.
- Triển khai toàn bộ hệ thống trên Docker Swarm hoặc Kubernetes.

Phân công cho nhóm 5 người:
Thành viên	Nhiệm vụ chính
1. Data Engineer	Thu thập, tiền xử lý và chuẩn hóa dữ liệu bán lẻ.
2. ML Engineer	Xây dựng và tối ưu mô hình dự báo doanh thu.
3. API Developer	Xây dựng REST API nhận đầu vào và trả về dự báo doanh thu.
4. DevOps Engineer	Dockerize hệ thống và triển khai lên Docker Swarm/Kubernetes.
5. Data Analyst & Tester	Phân tích kết quả, kiểm thử hệ thống và trực quan hóa dự đoán.
Cấu trúc thư mục dự án mẫu:
retail_revenue_forecasting/
├── data/
│   ├── raw/
│   └── processed/
├── model/
│   ├── train_model.py
│   ├── model.pkl
│   └── evaluate_model.py
├── api/
│   ├── main.py
│   └── requirements.txt
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── cluster/
│   └── deploy.sh
└── README.md

Dockerfile (API + model):
FROM python:3.10-slim
WORKDIR /app
COPY api/requirements.txt .
RUN pip install -r requirements.txt
COPY api/ .
COPY model/model.pkl ./model.pkl
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

docker-compose.yml:
version: '3.8'
services:
  api:
    build: ./docker
    ports:
      - "8000:8000"
    volumes:
      - ./model:/app/model
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure

DỮ LIỆU CỦA ĐỀ TÀI
1. Bộ dữ liệu bán lẻ:
| Dataset | Link | Ghi chú |
|---------|------|--------|
| Retail Sales Forecasting | https://www.kaggle.com/datasets/c/competitive-data-science-predict-future-sales | Bộ dữ liệu bán lẻ lớn cho dự báo doanh thu. |
| Walmart Sales Dataset | https://www.kaggle.com/datasets/ananthr1/walmart-recruiting-store-sales-forecasting | Dữ liệu bán hàng từ hệ thống Walmart. |

2. Cấu trúc lưu trữ dữ liệu:
data/
├── raw/
│   └── sales/
├── processed/
│   └── features/

3. Gợi ý mô hình dự báo doanh thu:
| Mô hình | Đặc điểm |
|---------|----------|
| Linear Regression | Dễ triển khai, diễn giải rõ ràng. |
| Random Forest Regressor | Linh hoạt, ít overfitting. |
| Facebook Prophet | Tốt cho chuỗi thời gian, tự động xử lý mùa vụ. |

Hướng phát triển nâng cao:
- Tự động cập nhật mô hình với dữ liệu bán lẻ mới hằng ngày.
- Phân tích sâu hơn theo từng khu vực, cửa hàng, nhóm sản phẩm.
- Xây dựng dashboard trực quan hóa doanh thu thực tế và dự đoán theo thời gian thực.

