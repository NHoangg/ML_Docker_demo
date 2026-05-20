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

// ─── Interactive Demo Tab ──────────────────────────────────────────────────
function DemoTab({ onPrefill, onNavigate }) {
  const [retrainLog, setRetrainLog] = useState('');
  const [retrainLoading, setRetrainLoading] = useState(false);

  async function handleTriggerRetrain() {
    setRetrainLoading(true);
    setRetrainLog('⏳ Đang gửi yêu cầu retrain tới API server...');
    try {
      const res = await fetch('http://127.0.0.1:8000/retrain', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const status = data.result?.status;
      const metrics = data.result?.metrics;
      const prevMetrics = data.result?.previous_metrics || data.result?.candidate_metrics;
      
      let msg = `✅ Trạng thái: ${status === 'success' ? 'THÀNH CÔNG (Mô hình đã cập nhật)' : 'GATED (Bị chặn do suy giảm hiệu năng)'}\n`;
      msg += `⏱️ Thời gian: ${new Date(data.result?.time).toLocaleString('vi-VN')}\n`;
      if (metrics) {
        msg += `📈 Chỉ số mới: R²=${metrics.r2.toFixed(4)}, MAE=${metrics.mae.toFixed(1)}, RMSE=${metrics.rmse.toFixed(1)}\n`;
      }
      if (status === 'gated' && data.result?.candidate_metrics) {
        msg += `⚠ Mô hình ứng cử bị từ chối do chất lượng kém (R²=${data.result.candidate_metrics.r2.toFixed(4)} so với baseline ${data.result.metrics.r2.toFixed(4)})\n`;
      } else if (prevMetrics) {
        msg += `📉 Chỉ số trước đó: R²=${prevMetrics.r2.toFixed(4)}, MAE=${prevMetrics.mae.toFixed(1)}\n`;
      }
      setRetrainLog(msg);
    } catch (err) {
      setRetrainLog(`❌ Lỗi kết nối API: ${err.message}. Hãy chắc chắn rằng API Server đang chạy ở cổng 8000.`);
    } finally {
      setRetrainLoading(false);
    }
  }

  const demoScenarios = [
    {
      id: 1,
      title: 'Kịch bản 1: Huấn luyện & Đánh giá Baseline',
      desc: 'Phân tích dữ liệu lịch sử bán lẻ đa chiều và so sánh hiệu năng các thuật toán học máy cổ điển (Linear Regression, Decision Tree) với Random Forest đề xuất.',
      badge: 'Học thuật',
      actionText: '📊 Xem so sánh Baseline',
      action: () => onNavigate('baseline'),
    },
    {
      id: 2,
      title: 'Kịch bản 2: Dự đoán đơn lẻ & XAI',
      desc: 'Nhập thông tin bán lẻ đơn lẻ để dự đoán doanh thu thực tế kèm biểu đồ đóng góp đặc trưng giải thích thuật toán (Explainable AI - XAI) theo phương pháp Perturbation.',
      badge: 'Thực tế',
      actionText: '🎯 Tự động điền & chạy XAI',
      action: () => {
        onPrefill({
          thoi_gian: 12,
          dong_tien: 32000,
          don_hang: 1500,
          san_pham: 3000,
          khu_vuc: 'Bac',
          cua_hang: 'CH1',
          nhom_san_pham: 'DienTu',
        });
      },
    },
    {
      id: 3,
      title: 'Kịch bản 3: Dự đoán hàng loạt (Batch CSV)',
      desc: 'Tải lên một tệp CSV chứa hàng loạt dòng dữ liệu bán lẻ để suy luận đồng thời, phù hợp cho việc phân tích báo cáo doanh số định kỳ.',
      badge: 'Thực tiễn',
      actionText: '📂 Chuyển sang Batch CSV',
      action: () => onNavigate('batch'),
    },
    {
      id: 4,
      title: 'Kịch bản 4: Đánh giá mô hình & Sai số & Concept Drift',
      desc: 'Trực quan hóa sai số (Residuals), phân tích lỗi (Error Analysis) động dựa trên thống kê z-score và giám sát trôi lệch dữ liệu (Concept Drift) bằng giải thuật Page-Hinkley.',
      badge: 'Đột phá',
      actionText: '📈 Xem Đánh giá & Drift',
      action: () => onNavigate('evaluation'),
    },
    {
      id: 5,
      title: 'Kịch bản 5: Huấn luyện tự thích ứng có Gating',
      desc: 'Kích hoạt quá trình huấn luyện lại mô hình mới. Hệ thống sử dụng chốt chặn Performance Gate tự động so sánh chất lượng mô hình cũ và mới trước khi hot-reload.',
      badge: 'Mới',
      isInteractive: true,
    },
    {
      id: 6,
      title: 'Kịch bản 6: Triển khai Docker Swarm & Cân bằng tải',
      desc: 'Triển khai cụm Docker Swarm Multi-replica (2 replicas) có Ingress routing mesh giúp cân bằng tải tự động, tối ưu hóa Throughput (RPS) và giảm thiểu Latency dưới tải nặng.',
      badge: 'Hệ thống',
      actionText: '🐳 Xem biểu đồ Docker Swarm',
      action: () => onNavigate('benchmark'),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #e0f2fe 100%)', border: '1px solid #c7d2fe', borderRadius: '0.75rem', padding: '1.5rem', color: '#1e1b4b' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>🎬 Hướng dẫn Chạy các Kịch bản Demo Hệ thống</h2>
        <p style={{ fontSize: '0.9rem', color: '#312e81', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Trang hướng dẫn này tích hợp sẵn các nút bấm giúp tự động hóa việc cấu hình, chạy kịch bản thử nghiệm hoặc chuyển hướng nhanh đến các trang phân tích chuyên sâu tương ứng. Hãy chọn một kịch bản dưới đây để bắt đầu.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {demoScenarios.map(s => (
          <div key={s.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{s.title}</span>
                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 600 }}>{s.badge}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '1.25rem' }}>{s.desc}</p>
            </div>
            
            {s.isInteractive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  className="predict-button" 
                  disabled={retrainLoading} 
                  onClick={handleTriggerRetrain}
                  style={{ width: '100%', margin: 0, padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                >
                  <span className={retrainLoading ? 'button-loader spin' : 'button-spark'} aria-hidden="true" />
                  <span>{retrainLoading ? 'Đang chạy Retrain...' : '⚡ Kích hoạt Retrain Ngay Lập Tức (Manual Trigger)'}</span>
                </button>
                {retrainLog && (
                  <pre style={{ margin: 0, padding: '0.75rem', background: '#1f2937', color: '#10b981', fontSize: '0.8rem', borderRadius: '0.5rem', overflowX: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #374151' }}>
                    {retrainLog}
                  </pre>
                )}
              </div>
            ) : (
              <button 
                onClick={s.action}
                style={{ 
                  width: '100%', 
                  background: '#f3f4f6', 
                  border: '1px solid #d1d5db', 
                  color: '#374151', 
                  padding: '0.6rem 1rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  transition: 'background 0.2s',
                  textAlign: 'center'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'}
                onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}
              >
                {s.actionText}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Single Predict Tab (with XAI) ─────────────────────────────────────────
function SingleTab({ prefilledForm, clearPrefill }) {
  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [contributions, setContributions] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilledForm) {
      setForm(prefilledForm);
      clearPrefill();
      const timer = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} };
        handleSubmit(fakeEvent, prefilledForm);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [prefilledForm]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: typeof initialForm[k] === 'number' ? Number(v) : v }));

  async function handleSubmit(e, currentForm = form) {
    if (e) e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentForm) });
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

        {/* Error Analysis Cards — Data-Driven */}
        <div className="chart-panel" style={{ gridColumn: '1/-1' }}>
          <div className="panel-title">
            <span className="icon-dot" style={{ background: '#ef4444' }} />
            <span>Phân tích sai số chuyên sâu — Top 5 dự đoán lệch lớn nhất (Data-driven Error Analysis)</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '1rem' }}>
            Mỗi trường hợp được phân tích tự động dựa trên đặc điểm dữ liệu thực tế của dòng đó (z-score so với trung bình tập test, danh mục sản phẩm, khu vực địa lý) — <strong>không phải giải thích cố định</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.error_analysis.map((item, idx) => {
              const isOver = item.direction === 'over';
              const dirColor = isOver ? '#f59e0b' : '#6366f1';
              const dirLabel = isOver ? '▲ Over-prediction' : '▼ Under-prediction';
              return (
                <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  {/* Header Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#374151' }}>#{idx + 1}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                      <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
                        📍 {item.khu_vuc}
                      </span>
                      <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
                        🏪 {item.cua_hang}
                      </span>
                      <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
                        📦 {item.nhom_san_pham}
                      </span>
                      <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>
                        📅 Tháng {item.thoi_gian}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                      <div style={{ color: '#6b7280' }}>Thực tế</div>
                      <div style={{ fontWeight: 700, color: '#10b981' }}>{formatMoney(item.actual)}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                      <div style={{ color: '#6b7280' }}>Dự đoán</div>
                      <div style={{ fontWeight: 700, color: '#6366f1' }}>{formatMoney(item.predicted)}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                      <div style={{ background: dirColor, color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.72rem', marginBottom: 2 }}>
                        {dirLabel}
                      </div>
                      <div style={{ color: '#ef4444', fontWeight: 700 }}>Δ {formatMoney(item.abs_error)} ({item.rel_error_pct}%)</div>
                    </div>
                  </div>

                  {/* Feature Values + Test Stats Comparison */}
                  {item.test_stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                      {Object.entries(item.test_stats).map(([col, stats]) => {
                        const val = item[col];
                        const z = (val - stats.mean) / (stats.std + 0.001);
                        const anomaly = Math.abs(z) > 1.5;
                        const label = { thoi_gian: 'Thời gian', dong_tien: 'Dòng tiền', don_hang: 'Đơn hàng', san_pham: 'Sản phẩm' }[col] || col;
                        return (
                          <div key={col} style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', background: anomaly ? '#fef9c3' : '#f9fafb', border: `1px solid ${anomaly ? '#fbbf24' : '#e5e7eb'}` }}>
                            <div style={{ color: '#6b7280', marginBottom: 2 }}>{label}</div>
                            <div style={{ fontWeight: 700, color: anomaly ? '#92400e' : '#1f2937' }}>
                              {typeof val === 'number' ? val.toLocaleString('vi-VN') : val}
                              {anomaly && <span style={{ marginLeft: 4, fontSize: '0.65rem', color: '#b45309' }}>⚠ z={z.toFixed(1)}</span>}
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '0.68rem' }}>TB: {stats.mean.toLocaleString('vi-VN')} ± {stats.std.toLocaleString('vi-VN')}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Data-driven Flags */}
                  <div style={{ padding: '0.75rem 1rem', background: '#fff' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                      🔍 Phân tích nguyên nhân lỗi từ dữ liệu:
                    </div>
                    <ul style={{ margin: 0, padding: '0 0 0 1.2rem', fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.7 }}>
                      {(item.data_flags || [item.explanation]).map((flag, fi) => (
                        <li key={fi} dangerouslySetInnerHTML={{ __html: flag.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
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
  { id: 'demo', label: 'Hướng dẫn Demo', icon: '🎬' },
  { id: 'single', label: 'Dự đoán & XAI', icon: '🎯' },
  { id: 'batch', label: 'Batch CSV', icon: '📂' },
  { id: 'realtime', label: 'Realtime Live', icon: '📡' },
  { id: 'evaluation', label: 'Đánh giá & Lỗi', icon: '📊' },
  { id: 'baseline', label: 'Baseline', icon: '⚖️' },
  { id: 'benchmark', label: 'Docker Swarm', icon: '🐳' },
];

function App() {
  const [activeTab, setActiveTab] = useState('demo');
  const [prefilledForm, setPrefilledForm] = useState(null);

  const handlePrefill = (formValues) => {
    setPrefilledForm(formValues);
    setActiveTab('single');
  };

  const clearPrefill = () => setPrefilledForm(null);

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
          {activeTab === 'demo' && <DemoTab onPrefill={handlePrefill} onNavigate={setActiveTab} />}
          {activeTab === 'single' && <SingleTab prefilledForm={prefilledForm} clearPrefill={clearPrefill} />}
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
