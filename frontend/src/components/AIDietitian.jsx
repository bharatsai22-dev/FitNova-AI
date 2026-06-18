import React, { useState, useEffect, useRef } from 'react';
import {
  Apple, Scale, Flame, Activity, Brain, ArrowLeft, Sparkles,
  Utensils, AlertCircle, XCircle, ChevronDown, CheckCircle2,
  Leaf, Egg, Drumstick, Zap, TrendingDown, TrendingUp, Minus,
  NutOff, Nut, ClipboardList, X, Loader2
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   MICRO-COMPONENTS
───────────────────────────────────────────────────────────────*/

/** Animated number counter */
function AnimCount({ to, decimals = 1 }) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const end = Number(to) || 0;
    if (prev.current === end) return;
    const start = prev.current;
    const dur = 500;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      setVal(start + (end - start) * e);
      if (p < 1) requestAnimationFrame(tick);
      else { setVal(end); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{val.toFixed(decimals)}</>;
}

/** BMI gauge arc */
function BMIGauge({ bmi }) {
  const clamp = Math.min(Math.max(bmi, 10), 40);
  const pct   = (clamp - 10) / 30; // 10→40 mapped to 0→1
  const angle = pct * 180 - 90;    // -90° to 90°
  const color =
    bmi < 18.5 ? '#38bdf8' :
    bmi < 25   ? '#22c55e' :
    bmi < 30   ? '#f59e0b' : '#ef4444';

  const r = 52, cx = 64, cy = 64;
  const arc = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = arc(180), end = arc(0);
  const segEnd = arc(pct * 180 + 180);
  const largeArc = pct > 0.5 ? 1 : 0;

  return (
    <svg viewBox="0 0 128 80" style={{ width: '100%', maxWidth: 120 }}>
      {/* track */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
        fill="none" stroke="#1e1e1e" strokeWidth="10" strokeLinecap="round"
      />
      {/* fill */}
      {bmi > 0 && (
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${segEnd.x} ${segEnd.y}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'all 0.6s cubic-bezier(.4,2,.6,1)' }}
        />
      )}
      {/* needle */}
      {bmi > 0 && (() => {
        const nrad = ((pct * 180 + 180) * Math.PI) / 180;
        const nx = cx + 38 * Math.cos(nrad);
        const ny = cy + 38 * Math.sin(nrad);
        return (
          <line x1={cx} y1={cy} x2={nx} y2={ny}
            stroke={color} strokeWidth="3" strokeLinecap="round"
            style={{ transition: 'all 0.6s cubic-bezier(.4,2,.6,1)', filter: `drop-shadow(0 0 4px ${color})` }}
          />
        );
      })()}
      <circle cx={cx} cy={cy} r="5" fill={color} style={{ transition: 'fill 0.4s' }} />
      {/* value */}
      <text x={cx} y={cy + 18} textAnchor="middle" fill={color}
        style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', transition: 'fill 0.4s' }}>
        {bmi > 0 ? bmi.toFixed(1) : '—'}
      </text>
      {/* zone labels */}
      {[['10','#38bdf8'], ['18.5','#22c55e'], ['25','#f59e0b'], ['30','#ef4444']].map(([l, c], i) => {
        const pp = (Number(l) - 10) / 30;
        const pr = ((pp * 180 + 180) * Math.PI) / 180;
        return (
          <text key={i}
            x={cx + 64 * Math.cos(pr)} y={cy + 64 * Math.sin(pr)}
            textAnchor="middle" fill={c}
            style={{ fontSize: 7, fontFamily: 'monospace', opacity: 0.7 }}>
            {l}
          </text>
        );
      })}
    </svg>
  );
}

/** Animated slide-in modal */
function Modal({ visible, onClose, type, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (visible) {
      setTimeout(() => setMounted(true), 10);
    } else {
      setMounted(false);
    }
  }, [visible]);

  if (!visible) return null;

  const isError = type === 'error';
  const accentColor = isError ? '#ef4444' : '#FFD700';
  const shadowColor = isError ? 'rgba(239,68,68,0.25)' : 'rgba(255,215,0,0.2)';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)',
      transition: 'opacity 0.3s',
      opacity: mounted ? 1 : 0,
    }}>
      <div style={{
        background: '#111',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '24px',
        padding: '36px 40px',
        minWidth: 340,
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        boxShadow: `0 0 80px ${shadowColor}, 0 24px 48px rgba(0,0,0,0.6)`,
        transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(24px)',
        transition: 'transform 0.35s cubic-bezier(.4,2,.6,1), box-shadow 0.35s',
      }}>
        {children}
      </div>
    </div>
  );
}

/** Ripple button */
function RippleBtn({ onClick, disabled, children, style }) {
  const [ripples, setRipples] = useState([]);
  const addRipple = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700);
  };
  return (
    <button
      onClick={(e) => { addRipple(e); onClick && onClick(e); }}
      disabled={disabled}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      {ripples.map(rp => (
        <span key={rp.id} style={{
          position: 'absolute', borderRadius: '50%',
          width: 80, height: 80, left: rp.x - 40, top: rp.y - 40,
          background: 'rgba(255,255,255,0.22)',
          animation: 'rpl 0.7s linear forwards',
          pointerEvents: 'none',
        }} />
      ))}
      {children}
    </button>
  );
}

/** Diet plan renderer — upgraded to blocks */
function PlanRenderer({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return <div key={i} style={{ height: 6 }} />;

        if (line.startsWith('##')) {
          const title = line.replace(/^#+/, '').trim();
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: '20px 0 8px',
              paddingBottom: 8,
              borderBottom: '1px solid #1e1e1e',
            }}>
              <Brain size={13} color="#FFD700" />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                {title}
              </span>
            </div>
          );
        }

        if (line.startsWith('###')) {
          const title = line.replace(/^#+/, '').trim();
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              margin: '12px 0 4px',
            }}>
              <Utensils size={11} color="#555" />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
                {title}
              </span>
            </div>
          );
        }

        // bold parse
        const parts = [];
        const boldRe = /\*\*(.*?)\*\*/g;
        let last = 0, m;
        while ((m = boldRe.exec(line)) !== null) {
          if (m.index > last) parts.push(line.slice(last, m.index));
          parts.push(<strong key={m.index} style={{ color: '#FFD700', fontWeight: 700 }}>{m[1]}</strong>);
          last = boldRe.lastIndex;
        }
        if (last < line.length) parts.push(line.slice(last));

        return (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '5px 0 5px 12px',
            borderLeft: '2px solid #1a1a1a',
          }}>
            <span style={{
              fontSize: 10, lineHeight: '1.65', color: '#777',
              fontFamily: 'monospace', flexShrink: 0, marginTop: 1,
            }}>›</span>
            <p style={{ fontSize: 10, lineHeight: '1.65', color: '#666', fontFamily: 'monospace', margin: 0 }}>
              {parts.length > 1 ? parts : (parts[0] || line)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FIELD COMPONENTS
───────────────────────────────────────────────────────────────*/
function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 9, fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 8, color: '#333', fontFamily: 'monospace' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: '#0a0a0a',
  border: '1px solid #1e1e1e',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 12,
  fontWeight: 800,
  color: '#fff',
  fontFamily: 'monospace',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function NumberInput({ name, value, onChange, min, max, unit }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          borderColor: focused ? '#FFD700' : '#1e1e1e',
          boxShadow: focused ? '0 0 0 3px rgba(255,215,0,0.08)' : 'none',
        }}
      />
      {unit && (
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 9, color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none',
        }}>{unit}</span>
      )}
    </div>
  );
}

function SelectInput({ name, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          paddingRight: 36,
          borderColor: focused ? '#FFD700' : '#1e1e1e',
          boxShadow: focused ? '0 0 0 3px rgba(255,215,0,0.08)' : 'none',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} color="#444" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PILL TOGGLE
───────────────────────────────────────────────────────────────*/
function PillToggle({ value, options, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px',
              borderRadius: 99,
              border: active ? '1.5px solid #FFD700' : '1.5px solid #1e1e1e',
              background: active ? 'rgba(255,215,0,0.08)' : 'transparent',
              color: active ? '#FFD700' : '#444',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
              transform: active ? 'scale(1.04)' : 'scale(1)',
              boxShadow: active ? '0 0 16px rgba(255,215,0,0.12)' : 'none',
            }}
          >
            {o.icon && <span style={{ opacity: active ? 1 : 0.5 }}>{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TOGGLE SWITCH
───────────────────────────────────────────────────────────────*/
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: checked ? '#FFD700' : '#1e1e1e',
        border: checked ? '1.5px solid #FFD700' : '1.5px solid #2a2a2a',
        position: 'relative',
        transition: 'background 0.25s, border-color 0.25s',
        flexShrink: 0,
        boxShadow: checked ? '0 0 12px rgba(255,215,0,0.3)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: checked ? '#000' : '#444',
        transition: 'left 0.25s cubic-bezier(.4,2,.6,1)',
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────*/
export default function AIDietitian({ userId, onBackToDashboard }) {
  const [formData, setFormData] = useState({
    age: 24,
    height: 175,
    weight: 70,
    baseGoal: 'fat_loss',
    dietPreference: 'pure_vegetarian',
    includesDryFruits: true,
    customNotes: ''
  });

  const [localBMI, setLocalBMI]         = useState(0);
  const [isLoading, setIsLoading]       = useState(false);
  const [dietPlanResult, setDietPlanResult] = useState('');
  const [error, setError]               = useState(null);
  const [notesFocused, setNotesFocused] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  const abortControllerRef = useRef(null);
  const activeUserId = userId || '6a27b03447151920d62074d3';

  useEffect(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      setLocalBMI(Number((formData.weight / (h * h)).toFixed(1)));
    }
  }, [formData.height, formData.weight]);

  const handleCancel = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsLoading(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGenerateDietPlan = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDietPlanResult('');
    setSuccessBanner(false);
    abortControllerRef.current = new AbortController();

    const synthesizedGoal = `${formData.baseGoal.toUpperCase()} | Diet Style: ${formData.dietPreference.replace('_', ' ').toUpperCase()} | Dry Fruits Integration: ${formData.includesDryFruits ? 'REQUIRED' : 'NONE'} | Special Rules: ${formData.customNotes || 'None'}`;

    const requestPayload = {
      user_id: activeUserId,
      age: Number(formData.age),
      height: Number(formData.height),
      weight: Number(formData.weight),
      goal: synthesizedGoal
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/dietician/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setDietPlanResult(data.plan);
        setSuccessBanner(true);
        setTimeout(() => setSuccessBanner(false), 4000);
      } else {
        throw new Error('Failed to build plan framework. Review application logs.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Dietitian pipeline request dropped:', err);
        setError('Core Engine connection failure. Verify your FastAPI local instance is live.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const bmiCategory =
    localBMI < 18.5  ? { label: 'Underweight', color: '#38bdf8', icon: <TrendingDown size={13} /> } :
    localBMI < 25    ? { label: 'Healthy Weight', color: '#22c55e', icon: <CheckCircle2 size={13} /> } :
    localBMI < 30    ? { label: 'Overweight', color: '#f59e0b', icon: <AlertCircle size={13} /> } :
                       { label: 'Obese', color: '#ef4444', icon: <TrendingUp size={13} /> };

  const goalOptions = [
    { value: 'fat_loss',    label: 'Cut',  icon: <TrendingDown size={11} /> },
    { value: 'lean_bulk',   label: 'Bulk', icon: <TrendingUp size={11} /> },
    { value: 'maintenance', label: 'Maintain', icon: <Minus size={11} /> },
  ];

  const dietOptions = [
    { value: 'pure_vegetarian', label: 'Vegetarian', icon: <Leaf size={11} /> },
    { value: 'eggetarian',      label: 'Eggetarian', icon: <Egg size={11} /> },
    { value: 'non_vegetarian',  label: 'Non-Veg',    icon: <Drumstick size={11} /> },
  ];

  return (
    <>
      <style>{`
        @keyframes rpl    { to { transform: scale(4); opacity: 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bannerIn  { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .plan-appear { animation: fadeUp 0.4s cubic-bezier(.4,0,.2,1) both; }
        .field-slide  { animation: slideRight 0.3s cubic-bezier(.4,0,.2,1) both; }
        .shimmer-bar {
          background: linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>

      <div style={{
        display: 'flex', height: '88vh', maxHeight: 900,
        width: '100%', maxWidth: 1200, margin: '24px auto',
        background: '#0a0a0a', borderRadius: 28,
        border: '1px solid #1a1a1a',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
        overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}>

        {/* ── LOADING MODAL ─────────────────────────────────────── */}
        <Modal visible={isLoading} type="loading">
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            {/* Outer ring */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid #1e1e1e',
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#FFD700',
              animation: 'spin 0.9s linear infinite',
            }} />
            {/* Inner pulse */}
            <div style={{
              position: 'absolute', inset: 12, borderRadius: '50%',
              background: 'rgba(255,215,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={16} color="#FFD700" />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 900, color: '#FFD700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Sculpting Your Plan
            </p>
            <p style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', margin: 0 }}>
              Running nutritional distribution transforms…
            </p>
          </div>
          {/* Shimmer bars */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[80, 60, 70, 50].map((w, i) => (
              <div key={i} className="shimmer-bar" style={{ height: 8, width: `${w}%` }} />
            ))}
          </div>
          <button
            onClick={handleCancel}
            style={{
              fontSize: 10, background: 'rgba(239,68,68,0.08)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.25)', padding: '8px 20px',
              borderRadius: 99, cursor: 'pointer', fontWeight: 700, letterSpacing: '0.06em',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            Cancel Generation
          </button>
        </Modal>

        {/* ── ERROR MODAL ────────────────────────────────────────── */}
        <Modal visible={!!error} onClose={() => setError(null)} type="error">
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(239,68,68,0.08)',
            border: '1.5px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <XCircle size={24} color="#ef4444" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 900, color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Generation Failed
            </p>
            <p style={{ fontSize: 11, color: '#666', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>
              {error}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button
              onClick={() => setError(null)}
              style={{
                flex: 1, fontSize: 11, background: '#ef4444', color: '#fff',
                border: 'none', padding: '11px 0', borderRadius: 12,
                cursor: 'pointer', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                transition: 'background 0.2s',
                boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
            >Dismiss</button>
          </div>
        </Modal>

        {/* ── SUCCESS TOAST ─────────────────────────────────────── */}
        {successBanner && (
          <div style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 55, background: '#111', border: '1.5px solid #22c55e',
            borderRadius: 14, padding: '12px 24px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 32px rgba(34,197,94,0.2)',
            animation: 'bannerIn 0.4s cubic-bezier(.4,2,.6,1)',
            whiteSpace: 'nowrap',
          }}>
            <CheckCircle2 size={16} color="#22c55e" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Diet Plan Ready
            </span>
            <button onClick={() => setSuccessBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', marginLeft: 4, display: 'flex' }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            LEFT SIDEBAR
        ──────────────────────────────────────────────────────────*/}
        <div style={{
          width: 320, background: '#0d0d0d',
          borderRight: '1px solid #151515',
          display: 'flex', flexDirection: 'column',
          height: '100%', overflowY: 'auto', flexShrink: 0,
        }}>

          {/* Sidebar header */}
          <div style={{
            padding: '20px 22px', borderBottom: '1px solid #151515',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Apple size={15} color="#FFD700" />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#ddd', margin: 0, letterSpacing: '0.04em' }}>Diet Diagnostics</p>
                <p style={{ fontSize: 8, color: '#444', margin: 0, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nutritional Engine</p>
              </div>
            </div>
            <button
              onClick={onBackToDashboard}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 9, fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em',
                background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 8, padding: '6px 10px',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFD700'; e.currentTarget.style.borderColor = '#333'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = '#1e1e1e'; }}
            >
              <ArrowLeft size={10} /> Back
            </button>
          </div>

          {/* BMI Gauge panel */}
          <div style={{
            margin: '16px 16px 0',
            background: '#0a0a0a', border: '1px solid #151515', borderRadius: 16,
            padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flexShrink: 0, width: 100 }}>
              <BMIGauge bmi={localBMI} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 8, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'monospace', margin: '0 0 4px', fontWeight: 800 }}>
                Body Mass Index
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: bmiCategory.color }}>
                {bmiCategory.icon}
                <span style={{ fontSize: 11, fontWeight: 900, color: bmiCategory.color }}>
                  {bmiCategory.label}
                </span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  ['< 18.5', 'Underweight', '#38bdf8'],
                  ['18.5–24.9', 'Healthy', '#22c55e'],
                  ['25–29.9', 'Overweight', '#f59e0b'],
                  ['≥ 30', 'Obese', '#ef4444'],
                ].map(([range, label, col]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#333' }}>{range}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: col, letterSpacing: '0.04em' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerateDietPlan} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

            {/* Weight + Height */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Weight" hint="kg">
                <NumberInput name="weight" value={formData.weight} onChange={handleInputChange} min={30} max={200} unit="kg" />
              </Field>
              <Field label="Height" hint="cm">
                <NumberInput name="height" value={formData.height} onChange={handleInputChange} min={100} max={250} unit="cm" />
              </Field>
            </div>

            <Field label="Age" hint="yrs">
              <NumberInput name="age" value={formData.age} onChange={handleInputChange} min={12} max={100} unit="yrs" />
            </Field>

            <Field label="Goal">
              <PillToggle
                value={formData.baseGoal}
                options={goalOptions}
                onChange={(v) => setFormData(p => ({ ...p, baseGoal: v }))}
              />
            </Field>

            <Field label="Diet Type">
              <PillToggle
                value={formData.dietPreference}
                options={dietOptions}
                onChange={(v) => setFormData(p => ({ ...p, dietPreference: v }))}
              />
            </Field>

            <Field label="Dry Fruits">
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#0a0a0a', border: '1px solid #151515', borderRadius: 12, padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {formData.includesDryFruits ? <Nut size={14} color="#FFD700" /> : <NutOff size={14} color="#444" />}
                  <span style={{ fontSize: 10, color: formData.includesDryFruits ? '#ccc' : '#444', fontWeight: 700, transition: 'color 0.2s' }}>
                    {formData.includesDryFruits ? 'Included in plan' : 'Excluded from plan'}
                  </span>
                </div>
                <Toggle
                  checked={formData.includesDryFruits}
                  onChange={(v) => setFormData(p => ({ ...p, includesDryFruits: v }))}
                />
              </div>
            </Field>

            <Field label="Notes / Allergies">
              <textarea
                name="customNotes"
                value={formData.customNotes}
                onChange={handleInputChange}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                placeholder="e.g. Lactose intolerant, no peanuts…"
                style={{
                  ...inputStyle,
                  height: 68, resize: 'none', lineHeight: '1.6',
                  fontWeight: 400,
                  borderColor: notesFocused ? '#FFD700' : '#1e1e1e',
                  boxShadow: notesFocused ? '0 0 0 3px rgba(255,215,0,0.08)' : 'none',
                  paddingTop: 10,
                }}
              />
            </Field>

            {/* Macro preview chips */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: 'Protein', val: `${Math.round(formData.weight * (formData.baseGoal === 'lean_bulk' ? 2.2 : 1.8))}g` },
                { label: 'Carbs',   val: `${Math.round(formData.weight * (formData.baseGoal === 'fat_loss' ? 2.5 : 4))}g` },
                { label: 'Fat',     val: `${Math.round(formData.weight * 0.8)}g` },
              ].map(chip => (
                <div key={chip.label} style={{
                  flex: 1, background: '#0a0a0a', border: '1px solid #151515', borderRadius: 10,
                  padding: '8px 10px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 8, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px', fontWeight: 800 }}>{chip.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 900, color: '#FFD700', margin: 0, fontFamily: 'monospace' }}>{chip.val}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <RippleBtn
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px 0',
                background: isLoading ? '#1a1a1a' : '#FFD700',
                color: isLoading ? '#444' : '#000',
                border: 'none', borderRadius: 14, cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                boxShadow: isLoading ? 'none' : '0 6px 28px rgba(255,215,0,0.25)',
              }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(255,255,255,0.2)'; }}}
              onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.background = '#FFD700'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,215,0,0.25)'; }}}
              onClick={handleGenerateDietPlan}
            >
              <Sparkles size={14} />
              {isLoading ? 'Synthesizing…' : 'Generate Diet Matrix'}
            </RippleBtn>

          </form>
        </div>

        {/* ─────────────────────────────────────────────────────────
            RIGHT PANEL
        ──────────────────────────────────────────────────────────*/}
        <div style={{
          flex: 1, background: '#0a0a0a',
          display: 'flex', flexDirection: 'column',
          height: '100%', overflow: 'hidden',
        }}>

          {/* Stats bar */}
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid #111',
            display: 'flex', gap: 12, alignItems: 'center', background: '#0d0d0d',
          }}>
            {[
              {
                label: 'BMI', icon: <Scale size={14} />,
                value: localBMI || '—',
                color: bmiCategory.color,
                suffix: '',
              },
              {
                label: 'Est. TDEE', icon: <Zap size={14} />,
                value: localBMI > 0 ? Math.round(10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5) : '—',
                color: '#FFD700', suffix: ' kcal',
              },
              {
                label: 'Target Calories', icon: <Flame size={14} />,
                value: localBMI > 0 ? Math.round((10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5) * (formData.baseGoal === 'fat_loss' ? 0.8 : formData.baseGoal === 'lean_bulk' ? 1.15 : 1)) : '—',
                color: '#f97316', suffix: ' kcal',
              },
              {
                label: 'Status', icon: bmiCategory.icon,
                value: bmiCategory.label, color: bmiCategory.color, suffix: '',
              },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: 1, background: '#0a0a0a', border: '1px solid #151515', borderRadius: 14,
                padding: '12px 16px',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#151515'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <span style={{ color: '#444' }}>{stat.icon}</span>
                  <span style={{ fontSize: 8, fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{stat.label}</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 900, color: stat.color, margin: 0, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                  {typeof stat.value === 'number' ? <AnimCount to={stat.value} decimals={0} /> : stat.value}
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#444' }}>{stat.suffix}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Output area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', position: 'relative' }}>

            {/* Empty state */}
            {!dietPlanResult && !isLoading && (
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 16,
                animation: 'fadeUp 0.4s ease',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: '#111', border: '1px solid #1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Utensils size={28} color="#222" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                    No plan compiled yet
                  </p>
                  <p style={{ fontSize: 11, color: '#2a2a2a', maxWidth: 300, lineHeight: 1.65, margin: 0 }}>
                    Configure your metrics in the sidebar and click <strong style={{ color: '#444' }}>Generate Diet Matrix</strong> to receive a personalized macro breakdown.
                  </p>
                </div>
                {/* Step hints */}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {['Set metrics', 'Choose goal', 'Generate'].map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#0d0d0d', border: '1px solid #151515', borderRadius: 10, padding: '8px 14px',
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#151515', border: '1px solid #1e1e1e',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, fontWeight: 900, color: '#333', fontFamily: 'monospace',
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 10, color: '#444', fontWeight: 700 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading shimmer */}
            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[90, 65, 80, 55, 75, 40, 85, 60].map((w, i) => (
                  <div key={i} className="shimmer-bar" style={{ height: 12, width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            )}

            {/* Results */}
            {dietPlanResult && !isLoading && (
              <div className="plan-appear">
                {/* Result header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #151515',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ClipboardList size={13} color="#22c55e" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 900, color: '#ddd', margin: 0 }}>Your Personalized Plan</p>
                      <p style={{ fontSize: 8, color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                        {formData.baseGoal.replace('_', ' ')} · {formData.dietPreference.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDietPlanResult('')}
                    style={{
                      background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 8,
                      padding: '6px 10px', cursor: 'pointer', color: '#444', display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#444'; }}
                  >
                    <X size={10} /> Clear
                  </button>
                </div>

                <PlanRenderer text={dietPlanResult} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}