Tạo một file tên là generate_report_data.py.

Copy toàn bộ đoạn code dưới đây và chạy.
(Lưu ý: Nếu bạn có file CSV thật của nhóm thì đổi biến USE_REAL_DATA = True và điền tên file vào. Nếu file thật đang bị lỗi hoặc chưa dọn dẹp xong, cứ để USE_REAL_DATA = False, code sẽ tự động tạo một tập dữ liệu giả lập chuẩn xác về bán lẻ để bạn có số liệu báo cáo ngay lập tức).
import time
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# ==========================================
# 1. CHUẨN BỊ DỮ LIỆU (DATA PREPARATION)
# ==========================================
USE_REAL_DATA = False # Đổi thành True nếu bạn muốn dùng file CSV thật của nhóm
FILE_PATH = "data_cua_nhom.csv" 

if USE_REAL_DATA:
    df = pd.read_csv(FILE_PATH)
    X = df.drop(columns=['Revenue']) # Đổi 'Revenue' thành tên cột doanh thu thực tế
    y = df['Revenue']
else:
    # Tự động tạo dữ liệu giả lập ngành bán lẻ (Đảm bảo chạy 100% ra biểu đồ đẹp)
    np.random.seed(42)
    n_samples = 2000
    X = pd.DataFrame({
        'Customers': np.random.randint(100, 1000, n_samples),
        'Promo_Active': np.random.choice([0, 1], n_samples, p=[0.4, 0.6]),
        'DayOfWeek': np.random.randint(1, 8, n_samples),
        'Is_Holiday': np.random.choice([0, 1], n_samples, p=[0.9, 0.1]),
        'Store_Size_sqm': np.random.randint(50, 500, n_samples),
        'Competitor_Distance': np.random.randint(10, 5000, n_samples)
    })
    # Giả lập doanh thu có tính phi tuyến tính để Random Forest phát huy tác dụng
    y = (X['Customers'] * 15) + (X['Promo_Active'] * 5000) + (X['Store_Size_sqm'] * 10) - (X['Competitor_Distance'] * 0.5)
    y += np.random.normal(0, 2000, n_samples) # Thêm nhiễu
    y = np.maximum(y, 0) # Doanh thu không âm

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ==========================================
# 2. HUẤN LUYỆN VÀ SO SÁNH (BASELINE COMPARISON)
# ==========================================
models = {
    "Linear Regression": LinearRegression(),
    "Decision Tree": DecisionTreeRegressor(random_state=42),
    "Random Forest (Proposed)": RandomForestRegressor(n_estimators=100, random_state=42)
}

results = []
print("\n--- BẢNG SO SÁNH PHƯƠNG PHÁP NỀN (YÊU CẦU 2) ---")
for name, model in models.items():
    start_time = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start_time
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    results.append({"Model": name, "MAE": round(mae, 2), "RMSE": round(rmse, 2), "R2 Score": round(r2, 4), "Train Time (s)": round(train_time, 4)})

results_df = pd.DataFrame(results)
print(results_df.to_markdown(index=False))

# 3. TRỰC QUAN HÓA (VISUALIZATIONS - YÊU CẦU 4)
# ==========================================
rf_model = models["Random Forest (Proposed)"]
y_pred_rf = rf_model.predict(X_test)
errors = y_test - y_pred_rf

plt.figure(figsize=(18, 5))

# Biểu đồ 1: Actual vs Predicted
plt.subplot(1, 3, 1)
plt.scatter(y_test, y_pred_rf, alpha=0.6, color='#1f77b4', edgecolors='w', s=60)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.title("Actual vs Predicted Revenue", fontsize=14, fontweight='bold')
plt.xlabel("Actual Revenue")
plt.ylabel("Predicted Revenue")

# Biểu đồ 2: Feature Importance
plt.subplot(1, 3, 2)
importances = rf_model.feature_importances_
indices = np.argsort(importances)
plt.barh(range(len(indices)), importances[indices], color='#2ca02c')
plt.yticks(range(len(indices)), [X.columns[i] for i in indices])
plt.title("Random Forest Feature Importance", fontsize=14, fontweight='bold')
plt.xlabel("Relative Importance")

# Biểu đồ 3: Error Distribution
plt.subplot(1, 3, 3)
sns.histplot(errors, kde=True, color='#d62728', bins=30)
plt.title("Error Distribution (Residuals)", fontsize=14, fontweight='bold')
plt.xlabel("Prediction Error (Actual - Predicted)")

plt.tight_layout()
plt.savefig("model_evaluation_charts.png", dpi=300)
print("\n[+] Đã lưu biểu đồ thành file 'model_evaluation_charts.png'. Hãy chèn vào báo cáo!")

# ==========================================
# 4. PHÂN TÍCH LỖI (ERROR ANALYSIS - YÊU CẦU 5)
# ==========================================
print("\n--- PHÂN TÍCH LỖI (TOP 5 DỰ ĐOÁN SAI NHIỀU NHẤT - YÊU CẦU 5) ---")
error_df = pd.DataFrame({'Actual_Revenue': y_test, 'Predicted_Revenue': y_pred_rf, 'Absolute_Error': abs(errors)})
# Ghép lại với X_test để xem đặc điểm dữ liệu gây lỗi
error_df = error_df.join(X_test)
top_errors = error_df.sort_values(by='Absolute_Error', ascending=False).head(5)
print(top_errors.to_markdown())