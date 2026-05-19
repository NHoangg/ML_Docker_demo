import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import './styles.css';

const API_BASE = 'http://127.0.0.1:8000';
const API_URL = `${API_BASE}/predict`;
const BATCH_API_URL = `${API_BASE}/predict/batch`;
const ANALYTICS_URL = `${API_BASE}/analytics/summary`;
const RETRAIN_URL = `${API_BASE}/retrain`;
const RETRAIN_STATUS_URL = `${API_BASE}/retrain/status`;

const KHU_VUC = ['Bac', 'Trung', 'Nam'];
const CUA_HANG = ['CH1', 'CH2', 'CH3'];
const NHOM_SP = ['ThucPham', 'GiaDung', 'DienTu'];

const initialForm = {
  thoi_gian: 12,
  dong_tien: 32000,
  don_hang: 1500,
  san_pham: 3000,
  khu_vuc: 'Bac',
  cua_hang: 'CH1',
  nhom_san_pham: 'DienTu',
};

const numFields = [
  { name: 'thoi_gian', label: 'Thời gian (tháng)', min: 1, step: 1 },
  { name: 'dong_tien', label: 'Dòng tiền (VNĐ)', min: 0, step: 1000 },
  { name: 'don_hang', label: 'Đơn hàng', min: 0, step: 10 },
  { name: 'san_pham', label: 'Sản phẩm', min: 0, step: 10 },
];

function formatMoney(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}
function formatMoneyShort(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v;
}

// ─── Tabs ──────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onSelect }) {
  return (
    <div className="tab-bar">
      {tabs.map(t => (
        <button key={t.id} className={`tab-btn${active === t.id ? ' active' : ''}`} onClick={() => onSelect(t.id)}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Single Predict Tab ────────────────────────────────────────────────────
function SingleTab() {
  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: typeof initialForm[k] === 'number' ? Number(v) : v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || `HTTP ${res.status}`); }
      const data = await res.json();
      setPrediction(data.predicted_revenue);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const bars = useMemo(() => {
    const base = prediction ?? 450000;
    return [
      { label: 'Thấp (-18%)', value: base * 0.82 },
      { label: 'Dự báo', value: base },
      { label: 'Cao (+14%)', value: base * 1.14 },
    ];
  }, [prediction]);

  return (
    <div className="content-grid">
      <div className="input-panel">
        <form onSubmit={handleSubmit}>
          <div className="panel-title"><span className="icon-dot" /> <span>Dữ liệu bán lẻ</span></div>
          <div className="field-grid">
            {numFields.map(f => (
              <label className="field" key={f.name}>
                <span>{f.label}</span>
                <input type="number" value={form[f.name]} min={f.min} step={f.step} onChange={e => update(f.name, e.target.value)} />
              </label>
            ))}
          </div>

          <div className="panel-title" style={{ marginTop: '1.25rem' }}><span className="icon-dot" /> <span>Phân tích theo danh mục</span></div>
          <div className="field-grid">
            <label className="field">
              <span>Khu vực</span>
              <select value={form.khu_vuc} onChange={e => update('khu_vuc', e.target.value)}>
                {KHU_VUC.map(v => <option key={v} value={v}>{v === 'Bac' ? '🏔️ Bắc' : v === 'Trung' ? '🌊 Trung' : '🌴 Nam'}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Cửa hàng</span>
              <select value={form.cua_hang} onChange={e => update('cua_hang', e.target.value)}>
                {CUA_HANG.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="field" style={{ gridColumn: '1/-1' }}>
              <span>Nhóm sản phẩm</span>
              <select value={form.nhom_san_pham} onChange={e => update('nhom_san_pham', e.target.value)}>
                <option value="ThucPham">🛒 Thực phẩm</option>
                <option value="GiaDung">🏠 Gia dụng</option>
                <option value="DienTu">📱 Điện tử</option>
              </select>
            </label>
          </div>

          <button className="predict-button" disabled={loading} type="submit" style={{ marginTop: '1.5rem' }}>
            <span className={loading ? 'button-loader spin' : 'button-spark'} aria-hidden="true" />
            <span>{loading ? 'Đang tính...' : '⚡ Dự đoán doanh thu'}</span>
          </button>
        </form>
        {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}
      </div>

      <section className="result-panel">
        <div className="result-card">
          <span className="result-label">Doanh thu dự đoán</span>
          <strong>{prediction === null ? 'Nhập dữ liệu và bấm Dự đoán' : formatMoney(prediction)}</strong>
        </div>
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>Khoảng dự báo</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bars} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatMoneyShort} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatMoney(v)} />
              <Bar dataKey="value" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// ─── Batch Upload Tab ──────────────────────────────────────────────────────
function BatchTab() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true); setError(''); setResults(null);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch(BATCH_API_URL, { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || `HTTP ${res.status}`); }
      setResults(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
      <div className="input-panel">
        <div className="panel-title"><span className="icon-dot" /> <span>Upload CSV batch</span></div>
        <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
          File CSV phải có các cột: <code>thoi_gian, dong_tien, don_hang, san_pham, khu_vuc, cua_hang, nhom_san_pham</code>
        </p>
        <input type="file" accept=".csv" onChange={handleFile} disabled={loading}
          style={{ display: 'block', width: '100%', padding: '0.75rem', border: '2px dashed #d1d5db', borderRadius: '0.75rem', cursor: 'pointer' }} />
        {loading && <p style={{ marginTop: '1rem', color: '#6366f1' }}>⏳ Đang xử lý...</p>}
        {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}

        {results && (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="panel-title"><span className="icon-dot" /><span>Kết quả ({results.length} dòng)</span></div>
            <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>#</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Khu vực</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Cửa hàng</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nhóm SP</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Dự đoán</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.5rem' }}>#{i + 1}</td>
                      <td style={{ padding: '0.5rem' }}>{r.khu_vuc ?? '-'}</td>
                      <td style={{ padding: '0.5rem' }}>{r.cua_hang ?? '-'}</td>
                      <td style={{ padding: '0.5rem' }}>{r.nhom_san_pham ?? '-'}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{formatMoney(r.predicted_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Realtime Dashboard Tab ────────────────────────────────────────────────
const REGIONS = [
  { khu_vuc: 'Bac', cua_hang: 'CH1', nhom_san_pham: 'DienTu' },
  { khu_vuc: 'Trung', cua_hang: 'CH2', nhom_san_pham: 'GiaDung' },
  { khu_vuc: 'Nam', cua_hang: 'CH3', nhom_san_pham: 'ThucPham' },
];
const COLORS = ['#6366f1', '#10b981', '#f59e0b'];
const REGION_LABELS = { Bac: '🏔️ Bắc - CH1', Trung: '🌊 Trung - CH2', Nam: '🌴 Nam - CH3' };

function RealtimeTab() {
  const [running, setRunning] = useState(false);
  const [dataPoints, setDataPoints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [retrainInfo, setRetrainInfo] = useState(null);
  const [retraining, setRetraining] = useState(false);
  const intervalRef = useRef(null);
  const tickRef = useRef(0);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(ANALYTICS_URL);
      if (res.ok) setAnalytics(await res.json());
    } catch (_) {}
  }, []);

  const fetchRetrainStatus = useCallback(async () => {
    try {
      const res = await fetch(RETRAIN_STATUS_URL);
      if (res.ok) setRetrainInfo(await res.json());
    } catch (_) {}
  }, []);

  useEffect(() => { fetchAnalytics(); fetchRetrainStatus(); }, []);

  // Simulate real-time data stream + call API
  const tick = useCallback(async () => {
    const t = ++tickRef.current;
    const baseTime = Date.now();
    const dong_tien = 20000 + Math.round(Math.random() * 40000);
    const don_hang = 400 + Math.round(Math.random() * 900);
    const san_pham = 800 + Math.round(Math.random() * 2000);
    const thoi_gian = (t % 12) + 1;

    const predictions = await Promise.all(
      REGIONS.map(async r => {
        try {
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thoi_gian, dong_tien, don_hang, san_pham, ...r }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return data.predicted_revenue;
        } catch { return null; }
      })
    );

    const actual = dong_tien * 1.8 + don_hang * 50 + Math.round((Math.random() - 0.5) * 30000);
    const point = {
      tick: `T${t}`,
      actual: Math.round(actual),
      ...Object.fromEntries(REGIONS.map((r, i) => [r.khu_vuc, predictions[i]])),
    };
    setDataPoints(prev => [...prev.slice(-19), point]);
  }, []);

  const startStop = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      tick();
      intervalRef.current = setInterval(tick, 3000);
      setRunning(true);
    }
  };
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await fetch(RETRAIN_URL, { method: 'POST' });
      if (res.ok) { const d = await res.json(); setRetrainInfo(d.result); }
    } catch (_) {}
    setRetraining(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="predict-button" onClick={startStop} style={{ minWidth: 160 }}>
          <span>{running ? '⏹ Dừng stream' : '▶ Bắt đầu Realtime'}</span>
        </button>
        <button className="predict-button" onClick={handleRetrain} disabled={retraining}
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)', minWidth: 180 }}>
          <span>{retraining ? '⏳ Đang retrain...' : '🔄 Retrain ngay'}</span>
        </button>
        {retrainInfo && (
          <div style={{ fontSize: '0.8rem', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
            <strong>Retrain gần nhất:</strong> {retrainInfo.status === 'never' ? 'Chưa có' : retrainInfo.status}
            {retrainInfo.metrics && <> | R²: <strong>{retrainInfo.metrics.r2?.toFixed(4)}</strong></>}
          </div>
        )}
        {running && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1s infinite' }} />
          Live · cập nhật mỗi 3s
        </div>}
      </div>

      {/* Line Chart */}
      <div className="chart-panel">
        <div className="panel-title"><span className="icon-dot" /> <span>Doanh thu thực tế vs Dự đoán theo thời gian thực</span></div>
        {dataPoints.length === 0
          ? <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem 0' }}>Bấm "Bắt đầu Realtime" để xem dữ liệu</div>
          : <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dataPoints} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tick" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatMoneyShort} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => v ? formatMoney(v) : 'N/A'} />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Thực tế (mô phỏng)" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              {REGIONS.map((r, i) => (
                <Line key={r.khu_vuc} type="monotone" dataKey={r.khu_vuc} name={REGION_LABELS[r.khu_vuc]} stroke={COLORS[i]} strokeWidth={2.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        }
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[
            { title: '📍 Theo khu vực', data: analytics.by_khu_vuc },
            { title: '🏪 Theo cửa hàng', data: analytics.by_cua_hang },
            { title: '📦 Theo nhóm SP', data: analytics.by_nhom_san_pham },
          ].map(({ title, data }) => (
            <div key={title} className="chart-panel">
              <div className="panel-title"><span className="icon-dot" /> <span>{title}</span></div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={Object.entries(data).map(([k, v]) => ({ name: k, total: v.total_revenue, avg: v.avg_revenue }))} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatMoneyShort} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => formatMoney(v)} />
                  <Bar dataKey="total" name="Tổng DT" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'single', label: 'Dự đoán đơn', icon: '🎯' },
  { id: 'batch', label: 'Batch CSV', icon: '📂' },
  { id: 'realtime', label: 'Realtime Dashboard', icon: '📡' },
];

function App() {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Retail ML System v2.0</p>
            <h1>Revenue Prediction & Analytics</h1>
          </div>
          <div className="status-pill">
            <span className="status-dot" aria-hidden="true" />
            <span>FastAPI · Docker Swarm</span>
          </div>
        </header>

        <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />

        <div style={{ marginTop: '1.5rem' }}>
          {activeTab === 'single' && <SingleTab />}
          {activeTab === 'batch' && <BatchTab />}
          {activeTab === 'realtime' && <RealtimeTab />}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
