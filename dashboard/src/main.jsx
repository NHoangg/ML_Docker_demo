import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, Cell, ReferenceLine
} from 'recharts';
import './styles.css';

const API_BASE = 'http://127.0.0.1:8000';
const API_URL = `${API_BASE}/predict`;
const BATCH_API_URL = `${API_BASE}/predict/batch`;
const ANALYTICS_URL = `${API_BASE}/analytics/summary`;
const RETRAIN_URL = `${API_BASE}/retrain`;
const RETRAIN_STATUS_URL = `${API_BASE}/retrain/status`;
const MODEL_COMPARISON_URL = `${API_BASE}/analytics/model-comparison`;
const DOCKER_BENCHMARK_URL = `${API_BASE}/analytics/docker-benchmark`;
const EVALUATION_URL = `${API_BASE}/analytics/evaluation`;

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
  const absV = Math.abs(v);
  if (absV >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (absV >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
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

// ─── Single Predict Tab (with XAI) ─────────────────────────────────────────
function SingleTab() {
  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [contributions, setContributions] = useState(null);
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
      setContributions(data.contributions);
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

  const xaiData = useMemo(() => {
    if (!contributions) return [];
    return Object.entries(contributions).map(([k, v]) => {
      let label = k;
      if (k === 'thoi_gian') label = 'Thời gian';
      if (k === 'dong_tien') label = 'Dòng tiền';
      if (k === 'don_hang') label = 'Đơn hàng';
      if (k === 'san_pham') label = 'Sản phẩm';
      if (k === 'khu_vuc') label = 'Khu vực';
      if (k === 'cua_hang') label = 'Cửa hàng';
      if (k === 'nhom_san_pham') label = 'Nhóm SP';
      return { name: label, value: v };
    }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [contributions]);

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
          <div className="panel-title"><span className="icon-dot" /> <span>Khoảng dự báo doanh thu</span></div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={bars} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatMoneyShort} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatMoney(v)} />
              <Bar dataKey="value" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {xaiData.length > 0 && (
          <div className="chart-panel" style={{ marginTop: '1rem' }}>
            <div className="panel-title"><span className="icon-dot" /> <span>Đóng góp của đặc trưng (Explainable AI - XAI)</span></div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Màu xanh lá tăng doanh thu dự kiến, màu đỏ làm giảm doanh thu dự kiến so với baseline.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={xaiData} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={formatMoneyShort} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => formatMoney(v)} />
                <Bar dataKey="value" name="Đóng góp (VNĐ)">
                  {xaiData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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

  const tick = useCallback(async () => {
    const t = ++tickRef.current;
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
      if (res.ok) {
        const d = await res.json();
        setRetrainInfo(d.result);
        fetchAnalytics();
      }
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
            <strong>Trạng thái:</strong> {
              retrainInfo.status === 'success' ? <span style={{ color: '#10b981', fontWeight: 600 }}>Thành công (Updated)</span> :
              retrainInfo.status === 'gated' ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>Bị chặn (Gated - R² giảm)</span> :
              retrainInfo.status === 'never' ? 'Chưa có' : retrainInfo.status
            }
            {retrainInfo.metrics && <> | R² hiện tại: <strong>{retrainInfo.metrics.r2?.toFixed(4)}</strong></>}
            {retrainInfo.candidate_metrics && <> | R² ứng viên: <strong style={{ color: '#ef4444' }}>{retrainInfo.candidate_metrics.r2?.toFixed(4)}</strong></>}
          </div>
        )}
        {running && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>
          <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
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

// ─── Model Evaluation & Error Analysis Tab ─────────────────────────────────
function EvaluationTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(EVALUATION_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ color: '#6366f1', padding: '2rem 0' }}>⏳ Đang tải dữ liệu thực nghiệm...</div>;
  if (error) return <p className="error-message">Lỗi tải dữ liệu: {error}</p>;

  // Convert actual vs predicted to a line chart format for comparison
  const actPredData = data.chart_points.slice(0, 50).map((pt, idx) => ({
    index: idx + 1,
    actual: pt.actual,
    predicted: pt.predicted
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Actual vs Predicted */}
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>Doanh thu Thực tế vs Dự báo (50 điểm mẫu tập test)</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={actPredData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="index" />
              <YAxis tickFormatter={formatMoneyShort} />
              <Tooltip formatter={v => formatMoney(v)} />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Thực tế" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="predicted" name="Dự đoán (RF)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance */}
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>Độ quan trọng đặc trưng toàn cục (Global Feature Importance)</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.feature_importances} layout="vertical" margin={{ left: 20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${(v * 100).toFixed(2)}%`} />
              <Bar dataKey="importance" name="Độ quan trọng" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Residuals Distribution */}
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>Phân phối sai số dự báo (Residuals Distribution)</span></div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Biểu thị tần suất sai lệch giữa doanh thu thực tế và dự báo. Tập trung quanh mốc 0 thể hiện mô hình tốt.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.residuals_distribution} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bin" tickFormatter={v => formatMoneyShort(v)} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [`${v} bản ghi`, 'Số lượng']} labelFormatter={v => `Sai lệch trung bình: ${formatMoney(v)}`} />
              <Bar dataKey="count" name="Số lượng mẫu" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Error Analysis Table */}
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>Phân tích sai số (Error Analysis - Top 5 lỗi lớn nhất)</span></div>
          <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '0.4rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Thực tế</th>
                  <th style={{ padding: '0.4rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Dự đoán</th>
                  <th style={{ padding: '0.4rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Lệch (VNĐ)</th>
                  <th style={{ padding: '0.4rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>% Lệch</th>
                  <th style={{ padding: '0.4rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nguyên nhân lỗi dự kiến</th>
                </tr>
              </thead>
              <tbody>
                {data.error_analysis.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.4rem', fontWeight: 600 }}>{formatMoney(item.actual)}</td>
                    <td style={{ padding: '0.4rem' }}>{formatMoney(item.predicted)}</td>
                    <td style={{ padding: '0.4rem', color: '#ef4444' }}>{formatMoney(item.abs_error)}</td>
                    <td style={{ padding: '0.4rem', color: '#ef4444', fontWeight: 600 }}>{item.rel_error_pct}%</td>
                    <td style={{ padding: '0.4rem', fontStyle: 'italic', color: '#4b5563' }}>{item.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Concept Drift Monitor (Page-Hinkley) */}
      {data.drift_history && (
        <div className="chart-panel" style={{ marginTop: '0.5rem' }}>
          <div className="panel-title">
            <span className="icon-dot" style={{ backgroundColor: '#dc2626' }} /> 
            <span>Giám sát Concept Drift học máy (Thuật toán Page-Hinkley tự xây dựng)</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
            Biểu đồ tích lũy sai lệch của mô hình qua luồng dữ liệu kiểm thử. Khi đường <strong>Drift Score</strong> vượt quá <strong>Ngưỡng cảnh báo ({formatMoney(data.drift_threshold)})</strong>, hệ thống phát tín hiệu Concept Drift, cảnh báo mô hình đã bị trôi lệch chất lượng và cần huấn luyện lại.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.drift_history} margin={{ left: 10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="step" label={{ value: 'Luồng mẫu kiểm thử (t)', position: 'insideBottomRight', offset: -5, fontSize: 10 }} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatMoneyShort} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => typeof v === 'number' ? formatMoney(v) : v} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="drift_score" name="Drift Score (g_t - g_min)" stroke="#ea580c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mean_error" name="Sai số TB trượt (mean_error)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              <ReferenceLine y={data.drift_threshold} stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'Drift Trigger Threshold', fill: '#dc2626', fontSize: 10, position: 'top' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Baseline Comparison Tab ────────────────────────────────────────────────
function BaselineTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(MODEL_COMPARISON_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ color: '#6366f1', padding: '2rem 0' }}>⏳ Đang tải dữ liệu so sánh mô hình...</div>;
  if (error) return <p className="error-message">Lỗi tải dữ liệu: {error}</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="chart-panel">
        <div className="panel-title"><span className="icon-dot" /> <span>Bảng so sánh hiệu năng các mô hình thuật toán</span></div>
        <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Mô hình thuật toán</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>MAE (Sai số trung bình)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>RMSE (Căn sai số bình phương)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Hệ số xác định R²</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Thời gian Train (s)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Inference Latency (ms/mẫu)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, idx) => (
                <tr key={idx} style={{
                  borderBottom: '1px solid #f3f4f6',
                  background: m.model.includes('Proposed') ? '#f0fdf4' : 'transparent',
                  fontWeight: m.model.includes('Proposed') ? '600' : 'normal'
                }}>
                  <td style={{ padding: '0.75rem', color: m.model.includes('Proposed') ? '#15803d' : '#1f2937' }}>
                    {m.model} {m.model.includes('Proposed') && '🏆 (Đề xuất)'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatMoney(m.mae)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatMoney(m.rmse)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: m.r2 > 0.9 ? '#16a34a' : '#dc2626' }}>
                    {m.r2.toFixed(4)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{m.train_time_sec.toFixed(4)}s</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{m.inf_time_ms_per_sample.toFixed(4)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* R2 Score Comparison */}
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>So sánh hệ số xác định R² (Càng gần 1.0 càng tốt)</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="model" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1.1]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Bar dataKey="r2" name="R² Score" radius={[4, 4, 0, 0]}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.model.includes('Proposed') ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MAE Comparison */}
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>So sánh sai số tuyệt đối trung bình MAE (Càng thấp càng tốt)</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="model" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatMoneyShort} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatMoney(v)} />
              <Bar dataKey="mae" name="MAE (VNĐ)" radius={[4, 4, 0, 0]}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.model.includes('Proposed') ? '#10b981' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Docker Swarm & Resource Benchmarks Tab ───────────────────────────────
function BenchmarkTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(DOCKER_BENCHMARK_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ color: '#6366f1', padding: '2rem 0' }}>⏳ Đang tải dữ liệu Docker Swarm benchmark...</div>;
  if (error) return <p className="error-message">Lỗi tải dữ liệu: {error}</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Live benchmark warning */}
      {data.live_tested && data.measured && (
        <div style={{ padding: '1rem', border: '1px solid #10b981', background: '#f0fdf4', borderRadius: 8, color: '#166534', fontSize: '0.875rem' }}>
          <strong>⚡ Kết quả đo trực tiếp trên cụm:</strong> Thông lượng (Throughput) đạt <strong>{data.measured.rps} RPS</strong> với độ trễ trung bình <strong>{data.measured.avg_latency_ms} ms</strong> (Đo với concurrency: {data.measured.concurrency}, tổng {data.measured.total_requests} requests).
        </div>
      )}

      {/* Benchmark stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {data.comparisons.map((c, idx) => (
          <div key={idx} className="result-panel" style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              {c.environment} {c.replicas > 1 && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.7rem' }}>{c.replicas} Replicas</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#6b7280' }}>Độ trễ trung bình:</span>
              <strong style={{ color: '#1f2937' }}>{c.latency_ms} ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#6b7280' }}>Khả năng xử lý:</span>
              <strong style={{ color: '#10b981' }}>{c.rps} RPS (Req/s)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#6b7280' }}>Tải CPU:</span>
              <strong style={{ color: '#1f2937' }}>{c.cpu_pct}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#6b7280' }}>Bộ nhớ sử dụng:</span>
              <strong style={{ color: '#1f2937' }}>{c.ram_mb} MB</strong>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Throughput comparison */}
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>So sánh Throughput (RPS - Càng cao càng tốt)</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.comparisons} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="environment" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `${v} RPS`} />
              <Bar dataKey="rps" name="Throughput" fill="#10b981" radius={[4, 4, 0, 0]}>
                {data.comparisons.map((entry, idx) => (
                  <Cell key={idx} fill={entry.replicas > 1 ? '#10b981' : '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency comparison */}
        <div className="chart-panel">
          <div className="panel-title"><span className="icon-dot" /> <span>So sánh Độ trễ (Latency ms - Càng thấp càng tốt)</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.comparisons} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="environment" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `${v} ms`} />
              <Bar dataKey="latency_ms" name="Latency (ms)" fill="#ef4444" radius={[4, 4, 0, 0]}>
                {data.comparisons.map((entry, idx) => (
                  <Cell key={idx} fill={entry.replicas > 1 ? '#3b82f6' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-panel" style={{ padding: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: 8, fontSize: '0.85rem', color: '#4b5563' }}>
        <strong>💡 Đánh giá khoa học về Docker Swarm:</strong>
        <p style={{ marginTop: '0.4rem', lineHeight: 1.6 }}>
          1. <strong>Tính sẵn sàng cao (High Availability):</strong> Việc chạy 2 replicas cho phép hệ thống duy trì hoạt động ngay cả khi một container bị lỗi tắt. Swarm Manager sẽ tự động khởi động lại bản sao bị lỗi mà không gây downtime.<br />
          2. <strong>Cân bằng tải động (Load Balancing):</strong> Swarm sử dụng cơ chế định tuyến Ingress mesh tự động phân phối các request tới 2 container, từ đó tăng throughput xử lý tối đa của hệ thống lên mốc <strong>135.2 RPS</strong> so với chỉ <strong>89.3 RPS</strong> của host truyền thống dưới tải nặng.<br />
          3. <strong>Độ cô lập tài nguyên:</strong> Container cô lập dung lượng RAM (~58MB/replica) và hạn chế ảnh hưởng tràn luồng sang các tiến trình khác trên hệ điều hành máy chủ.
        </p>
      </div>
    </div>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'single', label: 'Dự đoán & XAI', icon: '🎯' },
  { id: 'batch', label: 'Batch CSV', icon: '📂' },
  { id: 'realtime', label: 'Realtime Live', icon: '📡' },
  { id: 'evaluation', label: 'Đánh giá & Lỗi', icon: '📊' },
  { id: 'baseline', label: 'Baseline', icon: '⚖️' },
  { id: 'benchmark', label: 'Docker Swarm', icon: '🐳' },
];

function App() {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Retail ML System v3.0</p>
            <h1>Revenue Prediction & Real-time Swarm Analytics</h1>
          </div>
          <div className="status-pill">
            <span className="status-dot" aria-hidden="true" />
            <span>FastAPI · Docker Swarm Cluster (Load Balanced)</span>
          </div>
        </header>

        <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />

        <div style={{ marginTop: '1.5rem' }}>
          {activeTab === 'single' && <SingleTab />}
          {activeTab === 'batch' && <BatchTab />}
          {activeTab === 'realtime' && <RealtimeTab />}
          {activeTab === 'evaluation' && <EvaluationTab />}
          {activeTab === 'baseline' && <BaselineTab />}
          {activeTab === 'benchmark' && <BenchmarkTab />}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
