# Revenue Forecasting with Random Forest

Project nay train mo hinh du bao doanh thu bang `RandomForestRegressor`.

## 1. Cai thu vien

```powershell
python -m pip install -r requirements.txt
```

## 2. Train model

```powershell
python train_revenue_model.py
```

Model se duoc luu tai:

```text
models/revenue_random_forest.joblib
```

## 3. Dung du lieu that

Thay file `data/revenue_sample.csv` bang CSV cua ban. Mac dinh script can cot muc tieu:

```text
revenue
```

Tat ca cac cot con lai se duoc dung lam feature de train.

Neu cot doanh thu co ten khac, chay:

```powershell
python train_revenue_model.py --data data/your_file.csv --target ten_cot_doanh_thu
```

## 4. Du doan

Tao CSV moi co cung cac cot feature voi du lieu train, nhung khong can cot `revenue`, roi chay:

```powershell
python predict_revenue.py --input data/new_revenue_features.csv
```

## 5. Chay REST API

API dung FastAPI, endpoint du doan la:

```text
POST /predict
```

Khoi dong server:

```powershell
uvicorn api.main:app --reload
```

Mo Swagger:

```text
http://127.0.0.1:8000/docs
```

Body mau cho Swagger hoac Postman:

```json
{
  "month": 12,
  "marketing_spend": 32000,
  "website_visits": 92000,
  "conversion_rate": 0.045,
  "avg_order_value": 60,
  "active_customers": 2050
}
```

Response mau:

```json
{
  "predicted_revenue": 252612.52
}
```

## 6. Chay React dashboard

Vao folder dashboard va cai dependency:

```powershell
cd dashboard
npm install
```

Chay giao dien:

```powershell
npm run dev -- --port 5173
```

Mo dashboard:

```text
http://127.0.0.1:5173
```

Dashboard se goi FastAPI tai:

```text
http://127.0.0.1:8000/predict
```

## 7. Chay bang Docker

Build va chay toan bo he thong:

```powershell
docker compose up --build
```

Sau khi container chay:

```text
API:       http://127.0.0.1:8000
Swagger:   http://127.0.0.1:8000/docs
Dashboard: http://127.0.0.1:5173
```

Dung lenh sau de dung he thong:

```powershell
docker compose down
```

## 8. Deploy bang Docker Swarm

Build image truoc khi deploy stack:

```powershell
docker compose build
```

Khoi tao Swarm:

```powershell
docker swarm init
```

Deploy stack:

```powershell
docker stack deploy -c docker/docker-stack.yml retail-system
```

Kiem tra replicas:

```powershell
docker service ls
```

Xem chi tiet task cua tung service:

```powershell
docker service ps retail-system_api
docker service ps retail-system_dashboard
```

Scale thu cong de demonstrate scalability:

```powershell
docker service scale retail-system_api=5
docker service scale retail-system_dashboard=3
```

Dung stack:

```powershell
docker stack rm retail-system
```
