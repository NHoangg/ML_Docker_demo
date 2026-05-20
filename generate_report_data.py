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
# 1. CHUẨN BỊ DỮ LIỆU THỰC TẾ (REAL DATA PREPARATION)
# ==========================================
FILE_PATH = "data/raw/revenue_sample.csv"

# Đọc dữ liệu từ file csv thật của dự án
try:
    df = pd.read_csv(FILE_PATH)
except FileNotFoundError:
    print(f"[ERROR] Khong tim thay file du lieu tai {FILE_PATH}!")
    exit(1)

X = df.drop(columns=['revenue'])
y = df['revenue']

# Thực hiện One-Hot Encoding cho các biến phân loại để các thuật toán Baseline học được
X_encoded = pd.get_dummies(X, columns=['khu_vuc', 'cua_hang', 'nhom_san_pham'], drop_first=False)

X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

# ==========================================
# 2. HUẤN LUYỆN VÀ SO SÁNH (BASELINE COMPARISON)
# ==========================================
models = {
    "Linear Regression": LinearRegression(),
    "Decision Tree": DecisionTreeRegressor(random_state=42),
    "Random Forest (Proposed)": RandomForestRegressor(n_estimators=300, random_state=42)
}

results = []
print("\n--- BANG SO SANH PHUONG PHAP NEN (DU LIEU THAT DU AN) ---")
for name, model in models.items():
    start_time = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start_time
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    results.append({
        "Model": name, 
        "MAE (VND)": round(mae, 2), 
        "RMSE (VND)": round(rmse, 2), 
        "R2 Score": round(r2, 4), 
        "Train Time (s)": round(train_time, 4)
    })

results_df = pd.DataFrame(results)
print(results_df.to_string(index=False))

# ==========================================
# 3. TRỰC QUAN HÓA (VISUALIZATIONS)
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
plt.xlabel("Actual Revenue (VND)")
plt.ylabel("Predicted Revenue (VND)")

# Biểu đồ 2: Feature Importance
plt.subplot(1, 3, 2)
importances = rf_model.feature_importances_
indices = np.argsort(importances)
plt.barh(range(len(indices)), importances[indices], color='#2ca02c')
plt.yticks(range(len(indices)), [X_encoded.columns[i] for i in indices])
plt.title("Random Forest Feature Importance", fontsize=14, fontweight='bold')
plt.xlabel("Relative Importance")

# Biểu đồ 3: Error Distribution
plt.subplot(1, 3, 3)
sns.histplot(errors, kde=True, color='#d62728', bins=30)
plt.title("Error Distribution (Residuals)", fontsize=14, fontweight='bold')
plt.xlabel("Prediction Error (Actual - Predicted)")

plt.tight_layout()
plt.savefig("model_evaluation_charts.png", dpi=300)
print("\n[+] Da luu bieu do thanh file 'model_evaluation_charts.png' thanh cong!")

# ==========================================
# 4. PHÂN TÍCH LỖI (ERROR ANALYSIS - TOP 5 DỰ ĐOÁN SAI NHIỀU NHẤT)
# ==========================================
print("\n--- PHAN TICH LOI (TOP 5 DU DOAN SAI NHIEU NHAT - DU LIEU THAT) ---")
error_df = pd.DataFrame({'Actual_Revenue': y_test, 'Predicted_Revenue': y_pred_rf, 'Absolute_Error': abs(errors)})
# Ghép lại với X_test gốc để dễ đọc
X_test_orig = X.loc[y_test.index]
error_df = error_df.join(X_test_orig)
top_errors = error_df.sort_values(by='Absolute_Error', ascending=False).head(5)
print(top_errors.to_string())
