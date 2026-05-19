import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = 'http://127.0.0.1:8000/predict';
const BATCH_API_URL = 'http://127.0.0.1:8000/predict/batch';
const initialForm = {
  thoi_gian: 12,
  dong_tien: 32000,
  don_hang: 1500,
  san_pham: 3000,
};

const fields = [
  { name: 'thoi_gian', label: 'Thời gian', min: 1, step: 1 },
  { name: 'dong_tien', label: 'Dòng tiền', min: 0, step: 1000 },
  { name: 'don_hang', label: 'Đơn hàng', min: 0, step: 10 },
  { name: 'san_pham', label: 'Sản phẩm', min: 0, step: 10 },
];

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function RevenueChart({ predictedRevenue }) {
  const bars = useMemo(() => {
    const estimate = predictedRevenue || 252612.52;
    return [
      { label: 'Low', value: estimate * 0.82 },
      { label: 'Expected', value: estimate },
      { label: 'High', value: estimate * 1.14 },
    ];
  }, [predictedRevenue]);

  const maxValue = Math.max(...bars.map((bar) => bar.value));

  return (
    <div className="chart-panel">
      <div className="panel-title">
        <span className="icon-dot" aria-hidden="true" />
        <span>Revenue range</span>
      </div>
      <div className="bars" aria-label="Revenue prediction chart">
        {bars.map((bar) => (
          <div className="bar-row" key={bar.label}>
            <span className="bar-label">{bar.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(bar.value / maxValue) * 100}%` }} />
            </div>
            <span className="bar-value">{formatMoney(bar.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('single'); // 'single' or 'batch'

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: Number(value),
    }));
  }

  async function handlePredict(event) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : `API returned ${response.status}`);
      }

      const data = await response.json();
      setPrediction(data.predicted_revenue);
    } catch (err) {
      setError(err.message || 'Cannot connect to the prediction API.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBatchUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    setError('');
    setBatchResults(null);
    setPrediction(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(BATCH_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API returned ${response.status}`);
      }

      const data = await response.json();
      setBatchResults(data);
    } catch (err) {
      setError(err.message || 'Cannot connect to the batch prediction API or invalid file.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Retail ML Dashboard</p>
            <h1>Revenue Prediction</h1>
          </div>
          <div className="status-pill">
            <span className="status-dot" aria-hidden="true" />
            <span>FastAPI /predict</span>
          </div>
        </header>

        <div className="content-grid">
          <div className="input-panel">
            <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
              <button 
                onClick={() => setMode('single')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: mode === 'single' ? 'bold' : 'normal', color: mode === 'single' ? '#000' : '#666' }}>
                Single Entry
              </button>
              <button 
                onClick={() => setMode('batch')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: mode === 'batch' ? 'bold' : 'normal', color: mode === 'batch' ? '#000' : '#666' }}>
                Batch Upload (CSV)
              </button>
            </div>

            {mode === 'single' ? (
              <form onSubmit={handlePredict}>
                <div className="panel-title" style={{ marginTop: '1rem' }}>
                  <span className="icon-dot" aria-hidden="true" />
                  <span>Retail sales data</span>
                </div>

                <div className="field-grid">
                  {fields.map((field) => (
                    <label className="field" key={field.name}>
                      <span>{field.label}</span>
                      <input
                        type="number"
                        value={form[field.name]}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        onChange={(event) => updateField(field.name, event.target.value)}
                      />
                    </label>
                  ))}
                </div>

                <button className="predict-button" disabled={isLoading} type="submit" style={{ marginTop: '1.5rem' }}>
                  <span className={isLoading ? 'button-loader spin' : 'button-spark'} aria-hidden="true" />
                  <span>{isLoading ? 'Predicting' : 'Predict'}</span>
                </button>
              </form>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <div className="panel-title">
                  <span className="icon-dot" aria-hidden="true" />
                  <span>Upload CSV file</span>
                </div>
                <p style={{ marginBottom: '1rem', color: '#666' }}>Upload a CSV file with the required feature columns (thoi_gian, dong_tien, don_hang, san_pham) to predict revenue for all rows.</p>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleBatchUpload} 
                  disabled={isLoading}
                  style={{ display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                {isLoading && <p style={{ marginTop: '1rem' }}>Processing batch...</p>}
              </div>
            )}

            {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}
          </div>

          <section className="result-panel">
            {mode === 'single' || !batchResults ? (
              <>
                <div className="result-card">
                  <span className="result-label">Predicted revenue</span>
                  <strong>{prediction === null ? 'Run prediction' : formatMoney(prediction)}</strong>
                </div>
                <RevenueChart predictedRevenue={prediction} />
              </>
            ) : (
              <div className="result-card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <span className="result-label">Batch Predictions ({batchResults.length} rows)</span>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Row</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Predicted Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>#{idx + 1}</td>
                        <td style={{ textAlign: 'right', borderBottom: '1px solid #eee', padding: '0.5rem' }}>
                          <strong>{formatMoney(row.predicted_revenue)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
