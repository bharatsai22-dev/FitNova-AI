import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Brain, Sliders, Activity, AlertTriangle, ShieldCheck, Sparkles, Clock, Calendar, Zap, TrendingUp, ChevronRight } from 'lucide-react';

// ─── Magnetic Button Hook ───────────────────────────────────────────────────
function useMagnetic(strength = 0.35) {
  const ref = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.max(rect.width, rect.height) * 1.2;

      if (dist < maxDist) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx * strength}px, ${dy * strength}px) scale(1.04)`;
        });
      }
    };

    const handleLeave = () => {
      cancelAnimationFrame(frameRef.current);
      el.style.transition = 'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)';
      el.style.transform = 'translate(0,0) scale(1)';
      setTimeout(() => { el.style.transition = ''; }, 560);
    };

    window.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(frameRef.current);
    };
  }, [strength]);

  return ref;
}

// ─── Cursor Spotlight Card ──────────────────────────────────────────────────
function SpotlightCard({ children, className = '', accent = '#FFD700', intensity = 0.06 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      el.style.setProperty('--opacity', '1');
    };
    const handleLeave = () => el.style.setProperty('--opacity', '0');

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        '--mx': '50%',
        '--my': '50%',
        '--opacity': '0',
        '--accent': accent,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: `radial-gradient(320px circle at var(--mx) var(--my), ${accent}${Math.round(intensity * 255).toString(16).padStart(2,'0')}, transparent 70%)`,
          opacity: 'var(--opacity)',
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── Animated Number ────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '', className = '' }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    const duration = 600;
    const start = performance.now();

    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <span className={className}>{display}{suffix}</span>;
}

// ─── Risk Orb ───────────────────────────────────────────────────────────────
function RiskOrb({ probability, riskLevel }) {
  const color = riskLevel === 'Critical' || riskLevel === 'High'
    ? '#FF3131' : riskLevel === 'Medium' ? '#FFD700' : '#32CD32';

  const circumference = 2 * Math.PI * 54;
  const progress = (probability / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx="70" cy="70" r="54" fill="none" stroke="#1a1a1a" strokeWidth="10" />
        <circle
          cx="70" cy="70" r="54"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.23,1,0.32,1), stroke 0.4s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2
      }}>
        <span style={{
          fontSize: 30, fontWeight: 900, letterSpacing: '-2px',
          color,
          transition: 'color 0.4s ease',
          fontFamily: 'monospace'
        }}>
          <AnimatedNumber value={probability} suffix="%" />
        </span>
        <span style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
          color: '#666', textTransform: 'uppercase'
        }}>
          {riskLevel}
        </span>
      </div>
    </div>
  );
}

// ─── Slider with Glow Track ──────────────────────────────────────────────────
function GlowSlider({ label, value, min, max, step, onChange, color, leftLabel, rightLabel, centerLabel, unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>
          {label}
        </span>
        <span style={{
          fontSize: 13, fontWeight: 900, fontFamily: 'monospace',
          color,
          background: `${color}18`,
          border: `1px solid ${color}40`,
          padding: '2px 10px',
          borderRadius: 20,
          transition: 'color 0.3s',
          letterSpacing: '0.05em'
        }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4,
          background: '#1a1a1a', borderRadius: 4, overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}60, ${color})`,
            borderRadius: 4,
            transition: 'width 0.15s ease',
            boxShadow: `0 0 8px ${color}80`
          }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute', width: '100%',
            opacity: 0, cursor: 'pointer', height: 24
          }}
        />
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 10px)`,
          width: 20, height: 20,
          background: color,
          borderRadius: '50%',
          boxShadow: `0 0 0 3px #111, 0 0 12px ${color}`,
          transition: 'left 0.15s ease',
          pointerEvents: 'none'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#444', fontFamily: 'monospace' }}>
        <span>{leftLabel}</span>
        {centerLabel && <span>{centerLabel}</span>}
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

// ─── Weight Bar ──────────────────────────────────────────────────────────────
function WeightBar({ label, value, maxVal = 4.5 }) {
  const pct = Math.min(100, (value / maxVal) * 100);
  const color = value > 1.5 ? '#FF3131' : value > 0.5 ? '#FFD700' : '#32CD32';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555' }}>
          {label}
        </span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color, fontWeight: 700 }}>
          +{value.toFixed(2)}
        </span>
      </div>
      <div style={{ height: 3, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          borderRadius: 2,
          transition: 'width 0.6s cubic-bezier(0.23,1,0.32,1), background 0.3s'
        }} />
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#0e0e0e',
      borderLeft: '3px solid #FFD700',
      border: '1px solid #2a2a2a',
      borderLeftWidth: 3,
      borderLeftColor: '#FFD700',
      padding: '12px 14px',
      borderRadius: 14,
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      animation: 'toastIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
    }}>
      <div style={{
        width: 32, height: 32,
        background: '#FFD70018',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFD700', flexShrink: 0
      }}>
        <ShieldCheck size={16} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', margin: 0 }}>
          Committed
        </p>
        <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#555', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
          {toast.detail}
        </p>
        <p style={{ fontSize: 8, fontFamily: 'monospace', color: '#333', margin: '2px 0 0', letterSpacing: '0.05em' }}>
          {toast.timestamp}
        </p>
      </div>
    </div>
  );
}

// ─── Schedule Card ───────────────────────────────────────────────────────────
function ScheduleCard({ item, onCommit, index }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const ref = useMagnetic(0.15);

  return (
    <SpotlightCard
      className="schedule-card"
      accent="#FFD700"
      intensity={0.05}
      style={{
        background: hovered ? '#1f1f1f' : '#171717',
        border: `1px solid ${hovered ? '#2f2f2f' : '#1f1f1f'}`,
        borderRadius: 18,
        padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'background 0.3s, border 0.3s, transform 0.3s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        cursor: 'default',
        animationDelay: `${index * 80}ms`,
        animation: 'cardFadeUp 0.5s cubic-bezier(0.23,1,0.32,1) both',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
          background: '#FFD70018', border: '1px solid #FFD70040',
          color: '#FFD700', padding: '3px 10px', borderRadius: 20
        }}>
          {item.type}
        </span>
        <Clock size={12} color="#333" />
      </div>
      <div>
        <h4 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e0e0e0', margin: '0 0 6px' }}>
          {item.title}
        </h4>
        <p style={{ fontSize: 11, color: '#555', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
          {item.detail}
        </p>
      </div>
      <button
        ref={ref}
        onClick={() => { onCommit(item.title); setPressed(true); setTimeout(() => setPressed(false), 400); }}
        style={{
          width: '100%',
          background: pressed ? '#FFD700' : hovered ? '#FFD70015' : 'transparent',
          border: `1px solid ${pressed ? '#FFD700' : '#2a2a2a'}`,
          color: pressed ? '#000' : '#666',
          padding: '9px 0',
          borderRadius: 10,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
          transform: pressed ? 'scale(0.97)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}
      >
        <ChevronRight size={11} />
        Commit Pipeline Adjustment
      </button>
    </SpotlightCard>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function HabitMLTracker({
  userId,
  dailyStats,
  setDailyStats,
  onBackToDashboard,
  setDashboardSkipRisk,
  setCommittedAdjustments
}) {
  const [sleepHours, setSleepHours] = useState(7.5);
  const [workoutTimePrev, setWorkoutTimePrev] = useState(45);
  const [motivationScore, setMotivationScore] = useState(7);
  const [previousAttendance, setPreviousAttendance] = useState(85);

  const [skipProbability, setSkipProbability] = useState(0);
  const [riskLevel, setRiskLevel] = useState('Low');
  const [aiNudge, setAiNudge] = useState('');
  const [adaptiveSchedule, setAdaptiveSchedule] = useState([]);
  const [featureWeights, setFeatureWeights] = useState({ sleep: 0, motivation: 0, attendance: 0, fatigue: 0 });
  const [toasts, setToasts] = useState([]);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const backRef = useMagnetic(0.25);
  const optimizeRef = useMagnetic(0.2);

  // Global cursor tracker
  useEffect(() => {
    const track = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener('mousemove', track);
    return () => window.removeEventListener('mousemove', track);
  }, []);

  useEffect(() => { runBehavioralInferenceEngine(); }, [sleepHours, workoutTimePrev, motivationScore, previousAttendance]);

  const runBehavioralInferenceEngine = () => {
    const sleepDeficit = sleepHours < 7 ? (7 - sleepHours) * 1.5 : sleepHours > 9 ? (sleepHours - 9) * 0.5 : 0;
    const motivationDeficit = (10 - motivationScore) * 0.4;
    const attendanceDeficit = (100 - previousAttendance) * 0.03;
    const fatigueFactor = workoutTimePrev > 75 ? (workoutTimePrev - 75) * 0.02 : 0;

    const intercept = -1.8;
    const wSleep = 1.2, wMotivation = 1.5, wAttendance = 0.8, wFatigue = 0.9;
    const z = intercept + wSleep * sleepDeficit + wMotivation * motivationDeficit + wAttendance * attendanceDeficit + wFatigue * fatigueFactor;
    const probability = 1 / (1 + Math.exp(-z));
    const finalPercentage = Math.round(probability * 100);

    setSkipProbability(finalPercentage);
    if (setDashboardSkipRisk) setDashboardSkipRisk(finalPercentage);

    let currentRisk = 'Low';
    if (finalPercentage > 75) currentRisk = 'Critical';
    else if (finalPercentage > 50) currentRisk = 'High';
    else if (finalPercentage > 25) currentRisk = 'Medium';
    setRiskLevel(currentRisk);

    setFeatureWeights({
      sleep: parseFloat((wSleep * sleepDeficit).toFixed(2)),
      motivation: parseFloat((wMotivation * motivationDeficit).toFixed(2)),
      attendance: parseFloat((wAttendance * attendanceDeficit).toFixed(2)),
      fatigue: parseFloat((wFatigue * fatigueFactor).toFixed(2))
    });

    generateModelInterventions(finalPercentage, currentRisk, sleepHours, workoutTimePrev);
  };

  const generateModelInterventions = (prob, risk, sleep, prevWork) => {
    if (risk === 'Critical' || risk === 'High') {
      if (sleep < 6) {
        setAiNudge("🚨 Central Nervous System Exhaustion Risk: Your sleep matrix is critically low. Your brain is signaling a workout drop. Let's outsmart the skip tendency before it occurs.");
        setAdaptiveSchedule([
          { id: 1, type: 'Scale Down', title: 'Neural Reset Strategy', detail: 'Convert today\'s target routine to a 20-min low-intensity mobility/flow session.' },
          { id: 2, type: 'Schedule Shift', title: 'Circadian Window Realignment', detail: 'Lock down your gym window 2 hours later to allow an optimal recovery nap.' }
        ]);
      } else if (motivationScore <= 4) {
        setAiNudge("⚡ Behavioral Momentum Alert: System motivation readings are low. Don't look at the complete stack today—just focus on crossing the threshold. Show up for exactly 5 minutes.");
        setAdaptiveSchedule([
          { id: 1, type: 'Gamification', title: '5-Min Threshold Compact', detail: 'Commit only to your core warm-up sets. Exit permission granted if momentum fails.' },
          { id: 2, type: 'Environment Swap', title: 'Audio Stimulation Anchor', detail: 'Inject high-tempo auditory tracking list. Move your session to an outdoor park footprint.' }
        ]);
      } else {
        setAiNudge("📉 Habit Friction Detected: Cumulative fatigue markers indicate a high skip probability. Let's drop volume to protect your target streak.");
        setAdaptiveSchedule([
          { id: 1, type: 'Volume Reduce', title: 'De-load Vector Pass', detail: 'Cut all exercise operational sets by 50% while holding baseline resistance values.' }
        ]);
      }
    } else if (risk === 'Medium') {
      setAiNudge("🎯 Optimization Window Open: Minor behavioral friction detected. A gentle friction reduction modification will lock today's attendance vector in place.");
      setAdaptiveSchedule([
        { id: 1, type: 'Optimization', title: 'Hyper-Focus Isolation', detail: 'Strip accessory movements from the queue. Execute compound targets only.' }
      ]);
    } else {
      setAiNudge("🟢 Habit Kinetic Loop Stabilized: Your behavioral metrics are in perfect alignment. Probability models indicate maximum compliance velocity.");
      setAdaptiveSchedule([
        { id: 1, type: 'Maintain', title: 'Full Trajectory Retention', detail: 'No alterations required. Keep current target volumes and resistance arrays unchanged.' }
      ]);
    }
  };

  const handleCommitPipeline = (adjustmentTitle) => {
    const newToast = {
      id: Date.now(),
      message: 'Committed successfully',
      detail: adjustmentTitle,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setToasts((prev) => [...prev, newToast]);
    if (setCommittedAdjustments) {
      setCommittedAdjustments((prev) => [{ id: newToast.id, title: adjustmentTitle, timestamp: newToast.timestamp, riskSnapshot: skipProbability }, ...prev]);
    }
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== newToast.id)), 3500);
  };

  const autoOptimizeMetrics = () => {
    setSleepHours(8.0);
    setMotivationScore(9);
    setPreviousAttendance(90);
  };

  const riskColor = riskLevel === 'Critical' || riskLevel === 'High' ? '#FF3131'
    : riskLevel === 'Medium' ? '#FFD700' : '#32CD32';

  return (
    <div ref={containerRef} style={{ padding: '40px 40px', maxWidth: 1200, margin: '0 auto', position: 'relative', minHeight: '100vh' }}>

      {/* Global ambient cursor glow */}
      <div style={{
        position: 'fixed',
        width: 500, height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${riskColor}06 0%, transparent 70%)`,
        transform: `translate(${cursorPos.x - 250}px, ${cursorPos.y - 250}px)`,
        pointerEvents: 'none',
        transition: 'transform 0.08s linear, background 1s ease',
        zIndex: 0,
        top: 0, left: 0
      }} />

      {/* Toast Portal */}
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, width: 280, pointerEvents: 'none' }}>
        {toasts.map((t) => <Toast key={t.id} toast={t} />)}
      </div>

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: 40, borderBottom: '1px solid #1a1a1a', paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <button
              ref={backRef}
              onClick={onBackToDashboard}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#555',
                marginBottom: 10, padding: 0,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFD700'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#555'}
            >
              <ArrowLeft size={13} /> Back to CMD Suite
            </button>
            <h2 style={{
              fontSize: 32, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '-1px', color: '#f0f0f0', margin: 0, lineHeight: 1
            }}>
              Habit &amp; ML Tracker <span style={{ color: '#FFD700' }}>Behavioral AI</span>
            </h2>
            <p style={{ fontSize: 11, color: '#444', margin: '8px 0 0', fontFamily: 'monospace' }}>
              Continuous client-side predictive log-odds engine · Dropout prevention in real-time
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#111', border: '1px solid #1f1f1f',
            borderRadius: 12, padding: '8px 14px',
            fontSize: 9, fontFamily: 'monospace', color: '#444', letterSpacing: '0.08em'
          }}>
            <Brain size={13} style={{ color: '#FFD700' }} />
            MODEL ID: BEHAVIORAL_LOGISTIC_REG_V5
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#32CD32', display: 'inline-block', boxShadow: '0 0 6px #32CD32', animation: 'pulse 2s infinite' }} />
          </div>
        </div>
      </div>

      {/* ─── Main Grid ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 28, position: 'relative', zIndex: 1 }}>

        {/* ── Left: Inputs ─────────────────────────────────────────────── */}
        <SpotlightCard
          accent="#FFD700"
          intensity={0.04}
          style={{
            background: '#111', border: '1px solid #1c1c1c',
            borderRadius: 24, padding: '28px 28px',
            display: 'flex', flexDirection: 'column', gap: 28,
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '1px solid #1a1a1a' }}>
            <Sliders size={15} style={{ color: '#FFD700' }} />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e0e0e0' }}>
              Live Feature Vector Inputs
            </span>
          </div>

          <GlowSlider
            label="Sleep Context (Last Night)"
            value={sleepHours}
            min={4} max={10} step={0.5}
            onChange={setSleepHours}
            color="#FFD700"
            unit=" hrs"
            leftLabel="Deficit (4h)"
            centerLabel="Optimal (7.5h)"
            rightLabel="Over (10h)"
          />
          <GlowSlider
            label="Previous Workout Volume"
            value={workoutTimePrev}
            min={15} max={120} step={5}
            onChange={setWorkoutTimePrev}
            color="#FF3131"
            unit=" min"
            leftLabel="Light (15m)"
            centerLabel="Standard (60m)"
            rightLabel="CNS Limit (120m)"
          />
          <GlowSlider
            label="Mental Motivation Score"
            value={motivationScore}
            min={1} max={10} step={1}
            onChange={setMotivationScore}
            color="#32CD32"
            leftLabel="Burnout (1)"
            centerLabel="Neutral (5)"
            rightLabel="Max Drive (10)"
          />
          <GlowSlider
            label="14-Day Attendance Momentum"
            value={previousAttendance}
            min={30} max={100} step={5}
            onChange={setPreviousAttendance}
            color="#60a5fa"
            unit="%"
            leftLabel="Broken (30%)"
            centerLabel="Forming (75%)"
            rightLabel="Flawless (100%)"
          />

          <button
            ref={optimizeRef}
            onClick={autoOptimizeMetrics}
            style={{
              width: '100%', background: '#0e0e0e',
              border: '1px solid #2a2a2a',
              color: '#888',
              padding: '12px 0',
              borderRadius: 14,
              fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFD70012';
              e.currentTarget.style.borderColor = '#FFD70060';
              e.currentTarget.style.color = '#FFD700';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0e0e0e';
              e.currentTarget.style.borderColor = '#2a2a2a';
              e.currentTarget.style.color = '#888';
            }}
          >
            <Zap size={13} style={{ color: '#FFD700' }} />
            Inject Perfect Intervention Constants
          </button>
        </SpotlightCard>

        {/* ── Right: Analytics ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Risk Readout Card */}
          <SpotlightCard
            accent={riskColor}
            intensity={0.06}
            style={{
              background: '#111', border: '1px solid #1c1c1c',
              borderRadius: 24, padding: '28px 28px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center'
            }}
          >
            {/* Orb + Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#444', margin: 0 }}>
                Calculated Skip Risk
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <RiskOrb probability={skipProbability} riskLevel={riskLevel} />
                <div>
                  <span style={{
                    display: 'inline-block',
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: 20,
                    background: `${riskColor}14`,
                    border: `1px solid ${riskColor}40`,
                    color: riskColor,
                    transition: 'all 0.4s ease'
                  }}>
                    {riskLevel} Threat
                  </span>
                  <p style={{ fontSize: 10, color: '#333', margin: '8px 0 0', fontFamily: 'monospace' }}>
                    Logistic Model Output
                  </p>
                </div>
              </div>
            </div>

            {/* Weight Vector Bars */}
            <div style={{ background: '#0c0c0c', padding: '16px 18px', borderRadius: 16, border: '1px solid #181818', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#333', margin: 0 }}>
                Live Weight Contribution (z-impact)
              </p>
              {Object.entries(featureWeights).map(([key, val]) => (
                <WeightBar key={key} label={`${key} factor`} value={val} />
              ))}
            </div>
          </SpotlightCard>

          {/* AI Nudge Card */}
          <SpotlightCard
            accent="#FFD700"
            intensity={0.05}
            style={{
              background: '#0d0d0d', border: '1px solid #1a1a1a',
              borderRadius: 20, padding: '22px 24px',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 120, height: 120, borderRadius: '50%',
              background: '#FFD70006',
              pointerEvents: 'none'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={13} style={{ color: '#FFD700', fill: '#FFD700' }} />
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FFD700' }}>
                Behavioral AI Nudge
              </span>
            </div>
            <p style={{
              fontSize: 12, color: '#777', lineHeight: 1.75, margin: 0,
              fontFamily: 'monospace',
              background: '#0a0a0a', padding: '14px 16px',
              borderRadius: 12, border: '1px solid #161616',
              transition: 'all 0.4s ease'
            }}>
              "{aiNudge}"
            </p>
          </SpotlightCard>

          {/* Adaptive Schedule */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Calendar size={13} style={{ color: '#444' }} />
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#444' }}>
                Dynamic Adaptive Schedule
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: adaptiveSchedule.length === 1 ? '1fr' : '1fr 1fr', gap: 16 }}>
              {adaptiveSchedule.map((item, i) => (
                <ScheduleCard key={item.id} item={item} onCommit={handleCommitPipeline} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes toastIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance: none; appearance: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 0; height: 0; }
        input[type=range]::-moz-range-thumb     { width: 0; height: 0; border: none; }
      `}</style>
    </div>
  );
}