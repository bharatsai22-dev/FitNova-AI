import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Spark/Particle Canvas Component ─── */
function ParticleCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(animRef.current);
      const c = canvasRef.current;
      if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    const spawnParticle = () => ({
      x: Math.random() * W,
      y: H + 5,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(Math.random() * 2 + 1),
      life: 1,
      decay: Math.random() * 0.012 + 0.006,
      size: Math.random() * 2.5 + 0.5,
      hue: Math.random() > 0.6 ? 51 : Math.random() > 0.5 ? 200 : 160,
    });

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      if (Math.random() < 0.4) particlesRef.current.push(spawnParticle());
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.03;
        p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life * 0.7);
        ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
      }}
    />
  );
}

/* ─── Animated metric bar ─── */
function MetricBar({ label, val, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(val), delay + 100);
    return () => clearTimeout(t);
  }, [val, delay]);

  const colorMap = {
    gold: { bar: '#FFD700', glow: 'rgba(255,215,0,0.35)' },
    blue: { bar: '#3B82F6', glow: 'rgba(59,130,246,0.35)' },
    red:  { bar: '#F43F5E', glow: 'rgba(244,63,94,0.35)' },
    cyan: { bar: '#06B6D4', glow: 'rgba(6,182,212,0.35)' },
    green:{ bar: '#10B981', glow: 'rgba(16,185,129,0.35)' },
  };
  const c = colorMap[color] || colorMap.gold;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: '#8B8B8B', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{label}</span>
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>{val}%</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: '#111', borderRadius: 99, overflow: 'visible' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${width}%`, borderRadius: 99,
          background: `linear-gradient(90deg, ${c.bar}99, ${c.bar})`,
          boxShadow: `0 0 10px 2px ${c.glow}`,
          transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${width}%`,
          transform: 'translate(-50%,-50%)',
          width: 10, height: 10, borderRadius: '50%',
          background: c.bar,
          boxShadow: `0 0 8px 3px ${c.glow}`,
          transition: 'left 0.9s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
    </div>
  );
}

/* ─── Score Ring ─── */
function ScoreRing({ score }) {
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(dash), 200);
    return () => clearTimeout(t);
  }, [dash]);

  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1a1a1a" strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${animated} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFF176" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>score</span>
      </div>
    </div>
  );
}

/* ─── Plotly chart panel ─── */
function PlotlyChartPanel({ dbFeed }) {
  const [plotlyReady, setPlotlyReady] = useState(!!window.Plotly);
  const drawn = useRef(false);

  useEffect(() => {
    if (window.Plotly) { setPlotlyReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.plot.ly/plotly-2.24.1.min.js';
    s.onload = () => setPlotlyReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!plotlyReady || !window.Plotly || dbFeed.length === 0) return;

    const baseLayout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#666', family: "'JetBrains Mono', 'Courier New', monospace", size: 10 },
      margin: { t: 8, r: 12, b: 36, l: 36 },
      xaxis: {
        gridcolor: '#1C1C1C', zeroline: false, type: 'category',
        tickfont: { color: '#555', size: 9 }, showline: false,
      },
      yaxis: {
        gridcolor: '#1C1C1C', zeroline: false, range: [0, 100],
        tickfont: { color: '#555', size: 9 }, showline: false,
      },
    };
    const config = { displayModeBar: false, responsive: true };

    /* Chart 1 — Performance Timeline */
    const el1 = document.getElementById('px-timeline');
    if (el1) {
      window.Plotly.newPlot(el1, [{
        x: dbFeed.map(d => d.date),
        y: dbFeed.map(d => d.score),
        type: 'scatter', mode: 'lines+markers',
        line: { color: '#FFD700', width: 2.5, shape: 'spline' },
        marker: { color: '#fff', size: 7, line: { color: '#FFD700', width: 2 } },
        fill: 'tozeroy',
        fillcolor: 'rgba(255,215,0,0.04)',
        hovertemplate: '<b>%{y}</b> pts<br>%{x}<extra></extra>',
      }], { ...baseLayout, height: 150 }, config);
    }

    /* Chart 2 — Exercise Distribution bar */
    const grouped = dbFeed.reduce((a, r) => {
      if (!a[r.exercise]) a[r.exercise] = { sum: 0, n: 0 };
      a[r.exercise].sum += r.score; a[r.exercise].n++;
      return a;
    }, {});
    const exKeys = Object.keys(grouped);
    const exAvgs = exKeys.map(k => Math.round(grouped[k].sum / grouped[k].n));

    const el2 = document.getElementById('px-distribution');
    if (el2) {
      window.Plotly.newPlot(el2, [{
        x: exKeys, y: exAvgs, type: 'bar',
        marker: {
          color: exAvgs.map((v, i) => ['#FFD700', '#3B82F6', '#10B981'][i % 3]),
          line: { color: 'rgba(0,0,0,0)', width: 0 },
          opacity: 0.9,
        },
        width: 0.4,
        hovertemplate: '<b>%{x}</b><br>Avg score: <b>%{y}</b><extra></extra>',
      }], {
        ...baseLayout,
        height: 150,
        bargap: 0.4,
        yaxis: { ...baseLayout.yaxis, gridcolor: '#1C1C1C' },
      }, config);
    }

    /* Chart 3 — Form Mastery (area) */
    const el3 = document.getElementById('px-form');
    if (el3) {
      window.Plotly.newPlot(el3, [{
        x: dbFeed.map(d => d.date),
        y: dbFeed.map(d => d.form),
        type: 'scatter', mode: 'lines+markers',
        fill: 'tozeroy',
        fillcolor: 'rgba(16,185,129,0.07)',
        line: { color: '#10B981', width: 2.5, shape: 'spline' },
        marker: { color: '#fff', size: 7, line: { color: '#10B981', width: 2 } },
        hovertemplate: 'Form: <b>%{y}%</b><br>%{x}<extra></extra>',
      }], { ...baseLayout, height: 150 }, config);
    }

    /* Chart 4 — ROM + Stability dual line */
    const el4 = document.getElementById('px-rom');
    if (el4) {
      window.Plotly.newPlot(el4, [
        {
          x: dbFeed.map(d => d.date),
          y: dbFeed.map(d => d.rom),
          name: 'ROM', type: 'scatter', mode: 'lines+markers',
          line: { color: '#3B82F6', width: 2, shape: 'spline', dash: 'solid' },
          marker: { color: '#fff', size: 6, line: { color: '#3B82F6', width: 2 } },
          hovertemplate: 'ROM: <b>%{y}%</b><extra></extra>',
        },
        {
          x: dbFeed.map(d => d.date),
          y: dbFeed.map(d => d.stability),
          name: 'Stability', type: 'scatter', mode: 'lines+markers',
          line: { color: '#F43F5E', width: 2, shape: 'spline', dash: 'dot' },
          marker: { color: '#fff', size: 6, line: { color: '#F43F5E', width: 2 } },
          hovertemplate: 'Stability: <b>%{y}%</b><extra></extra>',
        },
      ], {
        ...baseLayout,
        height: 150,
        legend: {
          font: { color: '#555', size: 9 },
          bgcolor: 'rgba(0,0,0,0)',
          x: 0, y: 1.15, orientation: 'h',
        },
        showlegend: true,
      }, config);
    }

    drawn.current = true;
  }, [plotlyReady, dbFeed]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {[
        { id: 'px-timeline', label: 'Performance Timeline', color: '#FFD700' },
        { id: 'px-distribution', label: 'Exercise Distribution', color: '#3B82F6' },
        { id: 'px-form', label: 'Form Mastery', color: '#10B981' },
        { id: 'px-rom', label: 'ROM & Stability', color: '#F43F5E' },
      ].map(({ id, label, color }) => (
        <div key={id} style={{
          background: '#0A0A0A',
          border: '1px solid #1A1A1A',
          borderRadius: 12,
          padding: '12px 12px 4px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
          }} />
          <div style={{
            fontSize: 9, color: '#555', textTransform: 'uppercase',
            letterSpacing: '0.12em', fontFamily: 'monospace', marginBottom: 4,
          }}>{label}</div>
          <div id={id} style={{ width: '100%' }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Glow Pulse Badge ─── */
function GlowBadge({ active, children, color = '#FFD700' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: active ? `${color}14` : '#0A0A0A',
      border: `1px solid ${active ? color + '44' : '#1A1A1A'}`,
      fontSize: 9, color: active ? color : '#555',
      fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase',
      transition: 'all 0.3s',
      boxShadow: active ? `0 0 12px 2px ${color}22` : 'none',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: active ? color : '#333',
        boxShadow: active ? `0 0 6px ${color}` : 'none',
        animation: active ? 'pulseGlow 1.5s ease-in-out infinite' : 'none',
      }} />
      {children}
    </span>
  );
}

/* ─── Exercise Tab Button ─── */
function ExerciseTab({ id, label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
      background: active ? '#FFD700' : 'transparent',
      color: active ? '#000' : '#666',
      fontFamily: 'monospace', fontSize: 11, fontWeight: active ? 800 : 500,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
      boxShadow: active ? '0 4px 20px rgba(255,215,0,0.3)' : 'none',
      transform: active ? 'translateY(-1px)' : 'none',
      whiteSpace: 'nowrap',
    }}>
      {icon} {label}
    </button>
  );
}

/* ─── Feedback Terminal ─── */
function FeedbackTerminal({ text }) {
  const isWarning = text.includes('Lower') || text.includes('blocked') || text.includes('straight') || text.includes('Drive') || text.includes('Complete');
  const isSuccess = text.includes('acquired') || text.includes('hit');

  return (
    <div style={{
      background: '#050505',
      border: `1px solid ${isSuccess ? '#10B98144' : isWarning ? '#F59E0B44' : '#1A1A1A'}`,
      borderRadius: 10, padding: '12px 16px',
      position: 'relative', overflow: 'hidden',
    }}>
      {isSuccess && <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg,transparent,#10B981,transparent)',
      }} />}
      {isWarning && <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg,transparent,#F59E0B,transparent)',
      }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 11,
          color: isSuccess ? '#10B981' : isWarning ? '#F59E0B' : '#555',
          marginTop: 1, flexShrink: 0,
        }}>{'>'}</span>
        <span style={{
          fontFamily: 'monospace', fontSize: 12,
          color: isSuccess ? '#10B981' : isWarning ? '#F59E0B' : '#777',
          lineHeight: 1.5,
        }}>{text}</span>
      </div>
    </div>
  );
}

/* ─── Calibration Guide Panel ─── */
function CalibrationPanel({ meta, activeExercise }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      background: '#080808',
      border: '1px solid #1A1A1A',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 16,
      transition: 'all 0.3s',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
        borderBottom: open ? '1px solid #1A1A1A' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📐</span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Spatial Calibration Guide
          </span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#444' }}>
          {open ? '[ HIDE ]' : '[ SHOW ]'}
        </span>
      </button>

      {open && (
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', marginBottom: 4 }}>
              Module Target
            </div>
            <div style={{ fontSize: 12, color: '#ccc', fontFamily: 'monospace', marginBottom: 12, fontWeight: 700 }}>
              {meta.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 130, overflowY: 'auto' }}>
              {meta.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    background: '#FFD70014', border: '1px solid #FFD70033',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#FFD700', fontWeight: 800, fontFamily: 'monospace',
                    marginTop: 1,
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 11, color: '#777', fontFamily: 'monospace', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 12, paddingTop: 10, borderTop: '1px solid #141414',
            }}>
              <span style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', textTransform: 'uppercase' }}>Target Flexion</span>
              <span style={{
                fontFamily: 'monospace', fontSize: 11, color: '#FFD700', fontWeight: 800,
                background: '#FFD70010', border: '1px solid #FFD70033',
                padding: '2px 8px', borderRadius: 6,
              }}>{meta.targetAngle}</span>
            </div>
          </div>

          <div style={{
            width: 120, height: 150, background: '#0A0A0A',
            border: '1px solid #1A1A1A', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, flexShrink: 0,
          }}>
            {activeExercise === 'squat' ? '🏋️' : activeExercise === 'pushup' ? '💪' : '🦾'}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function PosePerformanceAnalyzer({ user, onBackToDashboard }) {
  const [activeExercise, setActiveExercise] = useState('squat');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [loadingCloudData, setLoadingCloudData] = useState(false);
  const [cloudError, setCloudError] = useState(null);
  const [repFlash, setRepFlash] = useState(false);

  const [liveMetrics, setLiveMetrics] = useState({
    formAccuracy: 100, rangeOfMotion: 0, stability: 100,
    smoothness: 100, consistency: 100, performanceScore: 0,
    repCount: 0, feedback: 'System armed. Align camera feed to begin tracking...',
  });

  const [dbFeed, setDbFeed] = useState([
    { date: '2026-06-08', exercise: 'SQUAT',  reps: 10, score: 76, form: 74, rom: 78, stability: 82, smoothness: 72 },
    { date: '2026-06-09', exercise: 'PUSHUP', reps: 15, score: 81, form: 79, rom: 83, stability: 85, smoothness: 77 },
    { date: '2026-06-10', exercise: 'SQUAT',  reps: 12, score: 84, form: 82, rom: 85, stability: 88, smoothness: 80 },
    { date: '2026-06-11', exercise: 'BICEP_CURL', reps: 8, score: 78, form: 76, rom: 80, stability: 79, smoothness: 75 },
    { date: '2026-06-12', exercise: 'SQUAT',  reps: 14, score: 88, form: 87, rom: 89, stability: 90, smoothness: 84 },
    { date: '2026-06-13', exercise: 'PUSHUP', reps: 18, score: 85, form: 83, rom: 87, stability: 86, smoothness: 82 },
    { date: '2026-06-14', exercise: 'SQUAT',  reps: 15, score: 90, form: 89, rom: 91, stability: 92, smoothness: 87 },
  ]);

  const activeExerciseRef = useRef(activeExercise);
  const dbFeedRef = useRef(dbFeed);
  const userRef = useRef(user);
  useEffect(() => { activeExerciseRef.current = activeExercise; }, [activeExercise]);
  useEffect(() => { dbFeedRef.current = dbFeed; }, [dbFeed]);
  useEffect(() => { userRef.current = user; }, [user]);

  /* ─── Load Cloud ─── */
  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        const cache = localStorage.getItem('AIGym_v2');
        if (cache) setDbFeed(JSON.parse(cache));
        return;
      }
      try {
        setLoadingCloudData(true);
        const res = await fetch(`https://fitnova-ai-2.onrender.com/api/workouts?userId=${user.id}`);
        if (!res.ok) throw new Error(res.status);
        const { success, records } = await res.json();
        if (success && records?.length) setDbFeed(records);
      } catch {
        setCloudError('Offline — showing cached data');
        const cache = localStorage.getItem('AIGym_v2');
        if (cache) setDbFeed(JSON.parse(cache));
      } finally { setLoadingCloudData(false); }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    if (dbFeed.length) localStorage.setItem('AIGym_v2', JSON.stringify(dbFeed));
  }, [dbFeed]);

  const exerciseMeta = {
    squat: {
      title: 'Barbell / Bodyweight Squat',
      targetAngle: '90° — Hips Parallel',
      steps: [
        'Stand completely sideways (lateral profile) to the camera.',
        'Step back 6–8 ft so your head, hips, and ankles are fully in frame.',
        'Keep spine upright; system measures absolute knee flexion arc.',
      ],
    },
    pushup: {
      title: 'Standard Horizontal Pushup',
      targetAngle: '75° — Chest Near Floor',
      steps: [
        'Hands shoulder-width on floor, body parallel to the camera.',
        'Form a straight line from feet to shoulders.',
        'Lower until elbows hit target flexion, then press up.',
      ],
    },
    bicep_curl: {
      title: 'Isolated Bicep Curl',
      targetAngle: '40° — Peak Contraction',
      steps: [
        'Stand upright facing sideways — do NOT face the camera.',
        'Pin elbow tightly against ribs to prevent shoulder drift.',
        'Control the concentric arc strictly at the elbow hinge.',
      ],
    },
  };

  const currentMeta = exerciseMeta[activeExercise];

  /* ─── Camera & Pose refs ─── */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const isStreamingRef = useRef(false);
  const trackingEngine = useRef({
    stage: 'UP', currentRepMinAngle: 180,
    stabilityBuffer: [], velocityBuffer: [],
    lastAngle: null, lastFrameTime: Date.now(),
    repHistory: [], accelerationSpikes: 0, phaseGuardTs: null,
  });

  /* ─── Script injection ─── */
  useEffect(() => {
    let alive = true;
    const injectScripts = async () => {
      if (window.Pose && window.Plotly) { if (alive) setScriptsLoaded(true); return; }
      const load = (src) => new Promise(res => {
        const s = document.createElement('script');
        s.src = src; s.crossOrigin = 'anonymous'; s.onload = res;
        document.head.appendChild(s);
      });
      await load('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await load('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
      await load('https://cdn.plot.ly/plotly-2.24.1.min.js');
      if (alive) setScriptsLoaded(true);
    };
    injectScripts();
    return () => { alive = false; stopCamera(); };
  }, []);

  /* ─── Angle Calculator ─── */
  const calcAngle = (p1, p2, p3) => {
    if (!p1 || !p2 || !p3) return 180;
    const ba = { x: p1.x - p2.x, y: p1.y - p2.y };
    const bc = { x: p3.x - p2.x, y: p3.y - p2.y };
    const dot = ba.x * bc.x + ba.y * bc.y;
    const mag = Math.sqrt(ba.x**2+ba.y**2) * Math.sqrt(bc.x**2+bc.y**2);
    if (!mag) return 180;
    return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
  };

  /* ─── Frame Processor ─── */
  const processFrame = useCallback((results) => {
    if (!isStreamingRef.current || !canvasRef.current || !videoRef.current) return;
    try {
      const ctx = canvasRef.current.getContext('2d');
      const W = canvasRef.current.width, H = canvasRef.current.height;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(results.image, 0, 0, W, H);

      if (!results.poseLandmarks) {
        setLiveMetrics(p => ({ ...p, feedback: 'Searching for joint landmarks...' }));
        return;
      }

      const J = results.poseLandmarks;
      const vis = (n) => n?.visibility > 0.65;
      const now = Date.now();
      const dt = (now - trackingEngine.current.lastFrameTime) / 1000;
      trackingEngine.current.lastFrameTime = now;

      const exKey = activeExerciseRef.current;
      let angle = 180, benchmark = 90, hint = 'Aligning...', valid = false;

      if (exKey === 'squat') {
        valid = vis(J[23]) && vis(J[25]) && vis(J[27]);
        if (valid) { angle = calcAngle(J[23],J[25],J[27]); benchmark=90; hint='Lower hips below knees.'; trackingEngine.current.stabilityBuffer.push(J[23].x); }
      } else if (exKey === 'pushup') {
        valid = vis(J[11]) && vis(J[13]) && vis(J[15]);
        if (valid) { angle = calcAngle(J[11],J[13],J[15]); benchmark=75; hint='Lower torso smoothly.'; trackingEngine.current.stabilityBuffer.push(J[11].y); }
      } else {
        valid = vis(J[11]) && vis(J[13]) && vis(J[15]);
        if (valid) { angle = calcAngle(J[11],J[13],J[15]); benchmark=40; hint='Flex upward, elbow locked.'; trackingEngine.current.stabilityBuffer.push(J[13].x); }
      }

      if (!valid) { setLiveMetrics(p => ({ ...p, feedback: 'Landmarks blocked — adjust position.' })); return; }
      if (trackingEngine.current.stabilityBuffer.length > 40) trackingEngine.current.stabilityBuffer.shift();

      /* Skeleton draw */
      const draw = (a, b) => {
        ctx.beginPath(); ctx.moveTo(a.x*W,a.y*H); ctx.lineTo(b.x*W,b.y*H);
        ctx.strokeStyle='#FFD700'; ctx.lineWidth=4; ctx.shadowColor='rgba(255,215,0,0.6)'; ctx.shadowBlur=8; ctx.stroke();
        ctx.shadowBlur=0;
      };
      const dot = (p, col) => {
        ctx.beginPath(); ctx.arc(p.x*W,p.y*H,7,0,Math.PI*2);
        ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;
      };

      if (exKey==='squat') { draw(J[23],J[25]); draw(J[25],J[27]); dot(J[23],'#FFD700'); dot(J[25],'#fff'); dot(J[27],'#FFD700'); }
      else { draw(J[11],J[13]); draw(J[13],J[15]); dot(J[11],'#FFD700'); dot(J[13],'#fff'); dot(J[15],'#FFD700'); }

      const eng = trackingEngine.current;

      /* Velocity + smoothness */
      if (eng.lastAngle !== null && dt > 0) {
        const vel = (angle - eng.lastAngle) / dt;
        eng.velocityBuffer.push(vel);
        if (eng.velocityBuffer.length > 2) {
          const acc = Math.abs((vel - eng.velocityBuffer[eng.velocityBuffer.length-2]) / dt);
          if (acc > 480) eng.accelerationSpikes++;
        }
        if (eng.velocityBuffer.length > 30) eng.velocityBuffer.shift();
      }
      eng.lastAngle = angle;

      if (angle < eng.currentRepMinAngle) eng.currentRepMinAngle = angle;

      const pivot = exKey==='squat' ? J[25] : J[13];
      if (pivot) {
        ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.beginPath();
        ctx.roundRect((pivot.x*W)+18,(pivot.y*H)-12,52,22,4); ctx.fill();
        ctx.fillStyle='#FFD700'; ctx.font='bold 13px monospace';
        ctx.fillText(`${Math.round(angle)}°`,(pivot.x*W)+22,(pivot.y*H)+4);
      }

      /* Phase tracking */
      if (eng.stage==='UP' && angle < (benchmark+30)) { eng.stage='DOWN'; eng.phaseGuardTs=now; }
      if (eng.stage==='DOWN' && eng.phaseGuardTs && (now-eng.phaseGuardTs)>4500) {
        eng.stage='UP'; eng.currentRepMinAngle=180; eng.phaseGuardTs=null; eng.accelerationSpikes=0;
        setLiveMetrics(p=>({...p, feedback:'Recalibrating posture bounds...'})); return;
      }

      /* Rep completion */
      if (eng.stage==='DOWN' && angle > 155) {
        const apex = eng.currentRepMinAngle;
        const form = Math.max(50, Math.min(100, 100 - Math.abs(apex-benchmark)));
        const rom = Math.max(35, Math.min(100, ((175-apex)/(175-benchmark))*100));
        const buf = eng.stabilityBuffer;
        const mean = buf.reduce((a,b)=>a+b,0)/buf.length;
        const variance = buf.reduce((a,b)=>a+(b-mean)**2,0)/buf.length;
        const stab = Math.max(55,Math.min(100,100-variance*25000));
        const smooth = Math.max(45,Math.min(100,100-eng.accelerationSpikes*4));
        let consist = 90;
        if (eng.repHistory.length > 0) {
          const histMean = eng.repHistory.reduce((a,r)=>a+r.score,0)/eng.repHistory.length;
          consist = Math.max(50,Math.min(100,100-Math.abs(form-histMean)));
        }
        const score = Math.round(0.35*form+0.2*rom+0.15*stab+0.15*smooth+0.15*consist);
        eng.repHistory.push({ score, form });

        const today = new Date().toISOString().split('T')[0];
        const exUpper = exKey.toUpperCase();
        const hist = dbFeedRef.current.find(r=>r.date===today&&r.exercise===exUpper);
        const newReps = hist ? hist.reps+1 : 1;
        const payload = { date:today, exercise:exUpper, reps:newReps, score, form:Math.round(form), rom:Math.round(rom), stability:Math.round(stab), smoothness:Math.round(smooth) };

        if (userRef.current?.id) {
          fetch('https://fitnova-ai-2.onrender.com/api/workouts',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:userRef.current.id,...payload}) }).catch(()=>{});
        }
        setDbFeed(prev=>[...prev.filter(r=>r.date!==today||r.exercise!==exUpper),payload]);
        setRepFlash(true); setTimeout(()=>setRepFlash(false),800);
        setLiveMetrics(prev=>({
          formAccuracy:Math.round(form), rangeOfMotion:Math.round(rom),
          stability:Math.round(stab), smoothness:Math.round(smooth),
          consistency:Math.round(consist), performanceScore:score,
          repCount:prev.repCount+1,
          feedback: form<78 ? 'Increase flexion depth for better accuracy.' : '✓ Target tracking score acquired!',
        }));

        eng.stage='UP'; eng.currentRepMinAngle=180; eng.accelerationSpikes=0; eng.phaseGuardTs=null;
      }

      if (eng.stage==='DOWN') {
        if (exKey==='squat'&&angle>115) hint='Drive hips lower.';
        else if (exKey==='pushup'&&angle>105) hint='Keep core flat, lower chest.';
        else if (exKey==='bicep_curl'&&angle>75) hint='Complete the upward squeeze.';
        else hint='Flexion target hit — control eccentric return.';
      }
      setLiveMetrics(p=>({...p, feedback:hint}));

    } catch(e) { console.error('Frame error:', e); }
  }, []);

  /* ─── Start/Stop Camera ─── */
  const startCamera = async () => {
    if (!scriptsLoaded || isStreamingRef.current) return;
    isStreamingRef.current = true;
    setIsCameraActive(true);
    const pose = new window.Pose({ locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
    pose.setOptions({ modelComplexity:1, smoothLandmarks:true, minDetectionConfidence:0.65, minTrackingConfidence:0.65 });
    pose.onResults(processFrame);
    poseRef.current = pose;

    if (videoRef.current) {
      const cam = new window.Camera(videoRef.current, {
        onFrame: async () => { if (videoRef.current && isStreamingRef.current && poseRef.current) await poseRef.current.send({ image: videoRef.current }); },
        width: 640, height: 480,
      });
      try { await cam.start(); cameraRef.current = cam; }
      catch(e) { console.error('Camera error:', e); stopCamera(); }
    }
  };

  const stopCamera = () => {
    isStreamingRef.current = false;
    setIsCameraActive(false);
    try { cameraRef.current?.stop(); } catch {}
    try { poseRef.current?.close(); } catch {}
    cameraRef.current = null; poseRef.current = null;
    if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    trackingEngine.current.stage = 'UP';
    trackingEngine.current.phaseGuardTs = null;
  };

  const handleClear = () => {
    if (!window.confirm('Clear all analytics history? This cannot be undone.')) return;
    localStorage.removeItem('AIGym_v2');
    setDbFeed([{ date:'2026-06-11',exercise:'SQUAT',reps:12,score:84,form:82,rom:85,stability:88,smoothness:80 }]);
    setLiveMetrics({ formAccuracy:100, rangeOfMotion:0, stability:100, smoothness:100, consistency:100, performanceScore:0, repCount:0, feedback:'Data cleared. Ready for new session.' });
  };

  /* ─── Inline keyframe style ─── */
  const style = `
    @keyframes pulseGlow { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
    @keyframes repFlash { 0%{box-shadow:0 0 0 0 rgba(255,215,0,0)} 30%{box-shadow:0 0 40px 12px rgba(255,215,0,0.4)} 100%{box-shadow:0 0 0 0 rgba(255,215,0,0)} }
    @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #050505; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 99px; }
  `;

  const lastScore = dbFeed.length ? dbFeed[dbFeed.length - 1].score : 0;

  return (
    <div style={{
      minHeight: '100vh', background: '#030303',
      color: '#ccc', fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      <style>{style}</style>

      {/* Background ambient glow */}
      <div style={{
        position: 'fixed', top: '-20%', left: '30%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.025) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.02) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 12,
          borderBottom: '1px solid #111', paddingBottom: 20, marginBottom: 24,
          animation: 'slideUp 0.5s ease both',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 32, height: 32, background: '#FFD700',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, boxShadow: '0 0 20px rgba(255,215,0,0.4)',
              }}>⚡</div>
              <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                BIO-KINEMATIC <span style={{ color: '#FFD700' }}>WORKSPACE</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <GlowBadge active={!loadingCloudData} color="#10B981">
                {loadingCloudData ? 'Syncing...' : 'Cloud Sync Active'}
              </GlowBadge>
              {cloudError && <GlowBadge active color="#F59E0B">{cloudError}</GlowBadge>}
              <GlowBadge active={isCameraActive} color="#3B82F6">
                {isCameraActive ? 'Inference Live' : 'Feed Offline'}
              </GlowBadge>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleClear} style={{
              padding: '8px 14px', borderRadius: 8, background: 'transparent',
              border: '1px solid #2A0808', color: '#F43F5E88',
              fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseOver={e=>e.currentTarget.style.borderColor='#F43F5E44'}
              onMouseOut={e=>e.currentTarget.style.borderColor='#2A0808'}
            >
              Clear Logs
            </button>
            {onBackToDashboard && (
              <button onClick={onBackToDashboard} style={{
                padding: '8px 14px', borderRadius: 8, background: '#0A0A0A',
                border: '1px solid #1A1A1A', color: '#888',
                fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.08em', cursor: 'pointer',
              }}>
                ← Exit
              </button>
            )}
          </div>
        </div>

        {/* ── Exercise Tabs ── */}
        <div style={{
          display: 'flex', gap: 4, background: '#070707',
          border: '1px solid #111', borderRadius: 12,
          padding: 6, width: 'fit-content', marginBottom: 24,
          animation: 'slideUp 0.5s 0.1s ease both', opacity: 0,
          animationFillMode: 'forwards',
        }}>
          {[
            { id: 'squat', label: 'Squat Matrix', icon: '🏋️' },
            { id: 'pushup', label: 'Pushup Vector', icon: '💪' },
            { id: 'bicep_curl', label: 'Bicep Engine', icon: '🦾' },
          ].map(t => (
            <ExerciseTab key={t.id} {...t} active={activeExercise===t.id} onClick={()=>{ stopCamera(); setActiveExercise(t.id); trackingEngine.current.stage='UP'; trackingEngine.current.phaseGuardTs=null; }} />
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* ── Left Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <CalibrationPanel meta={currentMeta} activeExercise={activeExercise} />

            {/* Camera Feed */}
            <div style={{
              background: '#060606', border: '1px solid #1A1A1A',
              borderRadius: 14, padding: 12, position: 'relative', overflow: 'hidden',
              animation: 'slideUp 0.5s 0.2s ease both', opacity: 0, animationFillMode: 'forwards',
            }}>
              {/* Top glow bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: isCameraActive
                  ? 'linear-gradient(90deg, transparent, #FFD700, transparent)'
                  : 'linear-gradient(90deg, transparent, #1A1A1A, transparent)',
                transition: 'background 0.5s',
              }} />

              <div style={{
                position: 'absolute', top: 16, left: 16, zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
                border: '1px solid #1A1A1A', borderRadius: 8, padding: '5px 10px',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isCameraActive ? '#10B981' : '#F43F5E',
                  boxShadow: isCameraActive ? '0 0 8px #10B981' : '0 0 8px #F43F5E',
                  animation: isCameraActive ? 'pulseGlow 1.5s infinite' : 'none',
                }} />
                <span style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {isCameraActive ? 'Inference Pipeline Live' : 'Feed Offline'}
                </span>
              </div>

              <div style={{
                position: 'relative', width: '100%', aspectRatio: '4/3',
                background: '#050505', borderRadius: 10, overflow: 'hidden',
                border: '1px solid #111',
                animation: repFlash ? 'repFlash 0.8s ease' : 'none',
              }}>
                <video ref={videoRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0,pointerEvents:'none' }} width="640" height="480" playsInline muted />
                <canvas ref={canvasRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0 }} width="640" height="480" />
                <ParticleCanvas active={isCameraActive} />

                {!isCameraActive && (
                  <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,zIndex:5 }}>
                    <div style={{ fontSize:40, opacity:0.3 }}>📹</div>
                    <p style={{ fontSize:11,color:'#333',textAlign:'center',textTransform:'uppercase',letterSpacing:'0.08em',maxWidth:200 }}>
                      Initialize feed to begin tracking
                    </p>
                  </div>
                )}

                {/* Scanline effect */}
                {isCameraActive && (
                  <div style={{
                    position:'absolute',inset:0,pointerEvents:'none',zIndex:4,
                    background:'linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.03) 50%)',
                    backgroundSize:'100% 4px',
                  }} />
                )}
              </div>

              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                disabled={!scriptsLoaded}
                style={{
                  width: '100%', marginTop: 12, padding: '13px 0',
                  borderRadius: 10, border: 'none', cursor: scriptsLoaded ? 'pointer' : 'not-allowed',
                  background: isCameraActive
                    ? 'transparent'
                    : '#FFD700',
                  border: isCameraActive ? '1px solid #F43F5E44' : 'none',
                  color: isCameraActive ? '#F43F5E' : '#000',
                  fontFamily: 'monospace', fontWeight: 900, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  boxShadow: !isCameraActive && scriptsLoaded ? '0 4px 30px rgba(255,215,0,0.3)' : 'none',
                  transition: 'all 0.3s', opacity: scriptsLoaded ? 1 : 0.5,
                }}
              >
                {!scriptsLoaded ? '⏳ Loading Modules...' : isCameraActive ? '⏹ Disconnect Stream' : '▶ Initialize Tracker'}
              </button>
            </div>

            {/* Feedback Terminal */}
            <FeedbackTerminal text={liveMetrics.feedback} />
          </div>

          {/* ── Right Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Score + Metrics Row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16,
              animation: 'slideUp 0.5s 0.3s ease both', opacity: 0, animationFillMode: 'forwards',
            }}>
              {/* Score Ring */}
              <div style={{
                background: '#060606', border: '1px solid #1A1A1A',
                borderRadius: 14, padding: '20px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: 'linear-gradient(90deg,transparent,#FFD70033,transparent)',
                }} />
                <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Composite</div>
                <ScoreRing score={liveMetrics.performanceScore} />
                <div style={{
                  fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: '#0A0A0A', border: '1px solid #1A1A1A',
                  padding: '4px 10px', borderRadius: 6,
                }}>Live Score</div>

                <div style={{ borderTop: '1px solid #111', width: '100%', paddingTop: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', marginBottom: 4 }}>Session Reps</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {liveMetrics.repCount}
                  </div>
                </div>
              </div>

              {/* Metric Bars */}
              <div style={{
                background: '#060606', border: '1px solid #1A1A1A',
                borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: 'linear-gradient(90deg,transparent,#3B82F633,transparent)',
                }} />
                <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
                  Biomechanical Matrix
                </div>
                <MetricBar label="Form Accuracy"  val={liveMetrics.formAccuracy}   color="gold"  delay={0} />
                <MetricBar label="Range of Motion" val={liveMetrics.rangeOfMotion}  color="blue"  delay={80} />
                <MetricBar label="Stability"       val={liveMetrics.stability}      color="red"   delay={160} />
                <MetricBar label="Smoothness"      val={liveMetrics.smoothness}     color="cyan"  delay={240} />
                <MetricBar label="Consistency"     val={liveMetrics.consistency}    color="green" delay={320} />
              </div>
            </div>

            {/* History Summary */}
            <div style={{
              background: '#060606', border: '1px solid #1A1A1A',
              borderRadius: 14, padding: 16,
              animation: 'slideUp 0.5s 0.4s ease both', opacity: 0, animationFillMode: 'forwards',
            }}>
              <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                Session History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
                {[...dbFeed].reverse().slice(0, 6).map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', background: '#0A0A0A', borderRadius: 8,
                    border: '1px solid #111',
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 9, color: '#FFD700', background: '#FFD70010',
                        border: '1px solid #FFD70022', padding: '1px 6px', borderRadius: 4,
                        fontWeight: 700,
                      }}>{r.exercise.replace('_', ' ')}</span>
                      <span style={{ fontSize: 10, color: '#555' }}>{r.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#666' }}>{r.reps} reps</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: r.score >= 85 ? '#10B981' : r.score >= 70 ? '#FFD700' : '#F43F5E',
                      }}>{r.score}pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plotly Charts */}
            <div style={{
              animation: 'slideUp 0.5s 0.5s ease both', opacity: 0, animationFillMode: 'forwards',
            }}>
              <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                Analytics Dashboard
              </div>
              <PlotlyChartPanel dbFeed={dbFeed} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}