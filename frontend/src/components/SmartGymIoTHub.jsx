import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── GATT SERVICE & CHARACTERISTIC UUIDs ───────────────────────────────────
const GATT = {
  SERVICES: {
    HEART_RATE:         '0000180d-0000-1000-8000-00805f9b34fb',
    HEALTH_THERMOMETER: '00001809-0000-1000-8000-00805f9b34fb',
    BATTERY:            '0000180f-0000-1000-8000-00805f9b34fb',
    RUNNING_SPEED:      '00001814-0000-1000-8000-00805f9b34fb',
    CYCLING_SPEED:      '00001816-0000-1000-8000-00805f9b34fb',
    USER_DATA:          '0000181c-0000-1000-8000-00805f9b34fb',
    BODY_COMPOSITION:   '0000181b-0000-1000-8000-00805f9b34fb',
    PULSE_OXIMETER:     '00001822-0000-1000-8000-00805f9b34fb',
    DEVICE_INFO:        '0000180a-0000-1000-8000-00805f9b34fb',
    ENVIRONMENTAL:      '0000181a-0000-1000-8000-00805f9b34fb',
    FITNESS_MACHINE:    '00001826-0000-1000-8000-00805f9b34fb',
    GLUCOSE:            '00001808-0000-1000-8000-00805f9b34fb',
    BLOOD_PRESSURE:     '00001810-0000-1000-8000-00805f9b34fb',
  },
  CHARACTERISTICS: {
    HR_MEASUREMENT:          '00002a37-0000-1000-8000-00805f9b34fb',
    BODY_SENSOR_LOCATION:    '00002a38-0000-1000-8000-00805f9b34fb',
    TEMPERATURE_MEASUREMENT: '00002a1c-0000-1000-8000-00805f9b34fb',
    BATTERY_LEVEL:           '00002a19-0000-1000-8000-00805f9b34fb',
    RSC_MEASUREMENT:         '00002a53-0000-1000-8000-00805f9b34fb',
    CSC_MEASUREMENT:         '00002a5b-0000-1000-8000-00805f9b34fb',
    PLX_SPOT_CHECK:          '00002a5e-0000-1000-8000-00805f9b34fb',
    PLX_CONTINUOUS:          '00002a5f-0000-1000-8000-00805f9b34fb',
    MANUFACTURER_NAME:       '00002a29-0000-1000-8000-00805f9b34fb',
    MODEL_NUMBER:            '00002a24-0000-1000-8000-00805f9b34fb',
    FIRMWARE_REVISION:       '00002a26-0000-1000-8000-00805f9b34fb',
    BODY_FAT_MEASUREMENT:    '00002a9c-0000-1000-8000-00805f9b34fb',
    WEIGHT_MEASUREMENT:      '00002a9d-0000-1000-8000-00805f9b34fb',
    STEP_COUNT:              '00002acf-0000-1000-8000-00805f9b34fb',
    BP_MEASUREMENT:          '00002a35-0000-1000-8000-00805f9b34fb',
    GLUCOSE_MEASUREMENT:     '00002a18-0000-1000-8000-00805f9b34fb',
  }
};

// ─── GATT DATA PARSERS ──────────────────────────────────────────────────────
const parsers = {
  heartRate(dv) {
    const flags = dv.getUint8(0);
    const is16 = flags & 0x01;
    const hasEnergy = (flags >> 3) & 0x01;
    const hasRR = (flags >> 4) & 0x01;
    let off = 1;
    const bpm = is16 ? dv.getUint16(off, true) : dv.getUint8(off);
    off += is16 ? 2 : 1;
    let rr = [];
    if (hasRR) {
      off += hasEnergy ? 2 : 0;
      while (off + 1 < dv.byteLength) { rr.push(dv.getUint16(off, true)); off += 2; }
    }
    const hrv = rr.length >= 2
      ? Math.round(Math.sqrt(rr.reduce((a, v, i, arr) => i === 0 ? 0 : a + (v - arr[i-1])**2, 0) / (rr.length - 1)))
      : null;
    return { bpm, rrIntervals: rr, hrv };
  },
  temperature(dv) {
    const flags = dv.getUint8(0);
    const isFahrenheit = flags & 0x01;
    const mantissa = dv.getUint8(3) | (dv.getUint8(2) << 8) | (dv.getUint8(1) << 16);
    const exponent = dv.getInt8(4);
    let temp = mantissa * Math.pow(10, exponent);
    if (isFahrenheit) temp = (temp - 32) * 5 / 9;
    return { celsius: parseFloat(temp.toFixed(1)) };
  },
  spo2(dv) {
    const flags = dv.getUint8(0);
    const hasSpo2 = flags & 0x01;
    const hasPr = (flags >> 1) & 0x01;
    let off = 1;
    const spo2 = hasSpo2 ? parseFloat((dv.getUint16(off, true) / 100).toFixed(1)) : null;
    off += hasSpo2 ? 2 : 0;
    const pr = hasPr ? dv.getUint16(off, true) : null;
    return { spo2, pulseRate: pr };
  },
  rscMeasurement(dv) {
    const flags = dv.getUint8(0);
    const speed = (dv.getUint16(1, true) / 256).toFixed(2);
    const cadence = dv.getUint8(3);
    const strideLength = (flags & 0x01) ? dv.getUint16(4, true) : null;
    const totalDist = (flags & 0x02) ? dv.getUint32(strideLength !== null ? 6 : 4, true) : null;
    return {
      speedMs: parseFloat(speed),
      speedKph: parseFloat((speed * 3.6).toFixed(1)),
      cadenceSpm: cadence,
      strideLengthM: strideLength ? (strideLength / 100).toFixed(2) : null,
      totalDistanceM: totalDist ? (totalDist / 10).toFixed(0) : null,
    };
  },
  bloodPressure(dv) {
    return {
      systolic: dv.getUint16(1, true),
      diastolic: dv.getUint16(3, true),
      meanArterial: dv.getUint16(5, true),
      unit: (dv.getUint8(0) & 0x01) ? 'kPa' : 'mmHg',
    };
  },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
const ZONE_CONFIG = [
  { name: 'Rest',       min: 0,  max: 50, color: '#6B7280' },
  { name: 'Very Light', min: 50, max: 60, color: '#60A5FA' },
  { name: 'Fat Burn',   min: 60, max: 70, color: '#1a7a4a' },
  { name: 'Cardio',     min: 70, max: 80, color: '#D4A017' },
  { name: 'Hard',       min: 80, max: 90, color: '#d45d0f' },
  { name: 'Peak',       min: 90, max: 999, color: '#c0392b' },
];

function getZone(bpm, age = 30) {
  const maxHr = 220 - age;
  const pct = (bpm / maxHr) * 100;
  for (const z of ZONE_CONFIG) if (pct >= z.min && pct < z.max) return { ...z, pct };
  return { ...ZONE_CONFIG[ZONE_CONFIG.length - 1], pct };
}

function calcVO2Max(maxHr, restHr) {
  if (!maxHr || !restHr) return null;
  return parseFloat((15 * (maxHr / restHr)).toFixed(1));
}

function calcRecovery(hrv, sleep = 7.2) {
  if (!hrv) return null;
  return Math.min(100, Math.round((hrv / 80) * 40 + 30 + Math.min(30, sleep * 4)));
}

function ecgPoint(bpm) {
  const cycle = (60 / bpm) * 1000;
  const phase = (Date.now() % cycle) / cycle;
  if (phase < 0.05) return 50 + Math.random() * 5;
  if (phase < 0.12) return 32 + Math.random() * 8;
  if (phase < 0.18) return 86 + Math.random() * 10;
  if (phase < 0.22) return 16 + Math.random() * 8;
  if (phase < 0.28) return 58 + Math.random() * 6;
  if (phase < 0.55) return 46 + Math.random() * 10;
  return 50 + Math.random() * 5;
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function PanelHeader({ icon, label, colorClass }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:'0.75rem', borderBottom:'0.5px solid var(--color-border-tertiary)', marginBottom:'1rem' }}>
      <div style={{
        width:28, height:28, borderRadius:'var(--border-radius-md)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:16, ...colorClass,
      }}>
        <i className={`ti ${icon}`} aria-hidden="true" />
      </div>
      <span style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{label}</span>
    </div>
  );
}

function MetricCard({ label, value, unit, sub, valueColor, style = {} }) {
  return (
    <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'0.75rem', ...style }}>
      <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
        <span style={{ fontSize:22, fontWeight:500, color: valueColor || 'var(--color-text-primary)', lineHeight:1.1 }}>{value ?? '—'}</span>
        {unit && <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function StatRow({ icon, label, value, valueColor, last }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'5px 0', fontSize:13,
      borderBottom: last ? 'none' : '0.5px solid var(--color-border-tertiary)',
    }}>
      <span style={{ color:'var(--color-text-secondary)', display:'flex', alignItems:'center', gap:6 }}>
        <i className={`ti ${icon}`} aria-hidden="true" />{label}
      </span>
      <span style={{ fontWeight:500, color: valueColor || 'var(--color-text-primary)' }}>{value ?? '—'}</span>
    </div>
  );
}

function Badge({ children, variant = 'idle', style = {} }) {
  const variants = {
    idle:      { background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', color:'var(--color-text-secondary)' },
    connected: { background:'#eaf3de', border:'0.5px solid #3B6D11', color:'#3B6D11' },
    good:      { background:'#eaf3de', border:'0.5px solid #3B6D11', color:'#3B6D11' },
    warn:      { background:'#faeeda', border:'0.5px solid #854F0B', color:'#854F0B' },
    danger:    { background:'#fcebeb', border:'0.5px solid #A32D2D', color:'#A32D2D' },
  };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, fontSize:12,
      padding:'4px 10px', borderRadius:'var(--border-radius-md)', fontWeight:500,
      ...variants[variant], ...style,
    }}>
      {children}
    </span>
  );
}

function SlideSwitcher({ activeSlide, onChange, onBackToDashboard }) {
  const slides = [
    { id: 'wearable', icon: 'ti-bluetooth', label: 'Wearable Health Hub' },
    { id: 'iot',      icon: 'ti-router',    label: 'MQTT IoT Simulator' },
  ];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.25rem', flexWrap:'wrap' }}>
      {onBackToDashboard && (
        <button onClick={onBackToDashboard} style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-md)', padding:'6px 8px', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', alignItems:'center', flexShrink:0 }}>
          <i className="ti ti-chevron-left" aria-hidden="true" />
        </button>
      )}
      <div role="tablist" aria-label="Smart Gym IoT Hub slides" style={{ display:'inline-flex', background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-md)', padding:3, gap:2 }}>
        {slides.map(s => {
          const active = activeSlide === s.id;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(s.id)}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'7px 14px', borderRadius:'calc(var(--border-radius-md) - 2px)',
                border:'none', cursor:'pointer',
                fontSize:13, fontWeight:500, letterSpacing:'0.01em',
                background: active ? 'var(--color-background-primary)' : 'transparent',
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                boxShadow: active ? '0 0 0 0.5px var(--color-border-secondary)' : 'none',
                transition:'all 0.15s',
              }}
            >
              <i className={`ti ${s.icon}`} aria-hidden="true" />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EcgCanvas({ ecgHistory }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // CSS (logical) size stays in pixels-on-screen; backing buffer is scaled
    // up by devicePixelRatio so grid lines and the waveform stay crisp on
    // Retina phones/tablets/laptops instead of looking blurry/soft.
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth || 320, h = canvas.offsetHeight || 72;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS-pixel coordinates from here on

    ctx.clearRect(0, 0, w, h);
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 16) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += 12) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.strokeStyle = isDark ? 'rgba(192,57,43,0.85)' : 'rgba(160,40,30,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ecgHistory.forEach((v, i) => {
      const x = (i / (ecgHistory.length - 1)) * w;
      const y = h - (v / 100) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [ecgHistory]);

  return (
    <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', height:72, overflow:'hidden', position:'relative' }}>
      <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block' }} />
    </div>
  );
}

function ReadinessRing({ score }) {
  const circ = 131.9;
  const dash = score ? (score / 100) * circ : 0;
  const stroke = score > 70 ? '#1a7a4a' : score > 40 ? '#D4A017' : '#c0392b';
  return (
    <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
      <svg viewBox="0 0 52 52" width="52" height="52" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r="21" fill="none" stroke="var(--color-background-secondary)" strokeWidth="5" />
        <circle cx="26" cy="26" r="21" fill="none" stroke={stroke} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 0.5s, stroke 0.3s' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>
        {score ?? '—'}
      </div>
    </div>
  );
}

function SleepStageBar() {
  const legend = [
    { color:'#534AB7', label:'Deep', time:'1h 45m', pct:'25%' },
    { color:'#85B7EB', label:'Light', time:'4h 15m', pct:'55%' },
    { color:'#D4537E', label:'REM', time:'1h 12m', pct:'20%' },
  ];
  return (
    <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'0.75rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
        <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>Total sleep</span>
        <strong style={{ fontSize:14 }}>7h 12m</strong>
      </div>
      <div style={{ height:10, borderRadius:4, overflow:'hidden', display:'flex', gap:1 }}>
        {legend.map(s => <div key={s.label} style={{ width:s.pct, background:s.color }} />)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4, marginTop:8 }}>
        {legend.map(s => (
          <div key={s.label} style={{ fontSize:11, color:'var(--color-text-secondary)', display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:s.color, display:'inline-block', flexShrink:0 }} />
            {s.label} {s.time}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingTop:8, borderTop:'0.5px solid var(--color-border-tertiary)', fontSize:12 }}>
        <span style={{ color:'var(--color-text-secondary)', display:'flex', alignItems:'center', gap:5 }}>
          <i className="ti ti-lungs" aria-hidden="true" /> Sleep apnea screen
        </span>
        <strong style={{ color:'#1a7a4a' }}>Clear</strong>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function SmartGymIoTHub({ onBackToDashboard }) {
  // ─── SLIDE NAVIGATION (Wearable Hub ↔ MQTT IoT Simulator) ────────────────
  const [activeSlide, setActiveSlide] = useState('wearable'); // 'wearable' | 'iot'

  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bleError, setBleError] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [connectedServices, setConnectedServices] = useState([]);

  const [hrData, setHrData] = useState({ bpm: null, hrv: null, rrIntervals: [] });
  const [spo2Data, setSpo2Data] = useState({ spo2: null, pulseRate: null });
  const [temperature, setTemperature] = useState(null);
  const [rscData, setRscData] = useState({ speedKph: null, cadenceSpm: null, totalDistanceM: null });
  const [bpData, setBpData] = useState({ systolic: null, diastolic: null });
  const [steps, setSteps] = useState(null);
  const [caloriesBurned, setCaloriesBurned] = useState(null);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [selectedSport, setSelectedSport] = useState('Weightlifting');
  const [ecgHistory, setEcgHistory] = useState(() => new Array(80).fill(50));

  const simTimer = useRef(null);
  const ecgTimer = useRef(null);
  const sessionTimer = useRef(null);
  const startTimeRef = useRef(null);
  const activeChars = useRef([]);
  const bpmRef = useRef(72);          // mutable ref so the ECG loop reads live bpm without re-mounting its interval
  const deviceRef = useRef(null);     // mirrors `device` so the unmount cleanup can reach the live BLE device
  const isMountedRef = useRef(true);  // guards against state updates firing after unmount

  const bpm = hrData.bpm;
  const hrv = hrData.hrv;
  const spo2 = spo2Data.spo2;
  const zone = bpm ? getZone(bpm) : null;
  const restHr = bpm ? Math.min(bpm, 65) : null;
  const vo2Max = (bpm && restHr) ? calcVO2Max(185, restHr) : null;
  const recoveryScore = hrv ? calcRecovery(hrv) : null;

  // Keep mutable refs in sync with the latest state, without retriggering timers
  useEffect(() => { bpmRef.current = bpm || 72; }, [bpm]);
  useEffect(() => { deviceRef.current = device; }, [device]);

  // ─── ECG ANIMATION ──────────────────────────────────────────────────────
  // Mounts the interval ONCE per connection (not on every bpm tick). The loop
  // reads bpmRef.current each frame, so heart-rate changes animate smoothly
  // instead of tearing down/recreating the interval every second.
  useEffect(() => {
    if (!isConnected) return;
    ecgTimer.current = setInterval(() => {
      setEcgHistory(prev => {
        const next = [...prev.slice(1)];
        next.push(Math.round(ecgPoint(bpmRef.current)));
        return next;
      });
    }, 85);
    return () => clearInterval(ecgTimer.current);
  }, [isConnected]);

  // ─── SESSION TIMER ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) { startTimeRef.current = null; setActiveMinutes(0); return; }
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    sessionTimer.current = setInterval(() => {
      setActiveMinutes(Math.round((Date.now() - startTimeRef.current) / 60000));
    }, 5000);
    return () => clearInterval(sessionTimer.current);
  }, [isConnected]);

  // ─── DISCONNECT HANDLER ──────────────────────────────────────────────────
  // Tears down BLE listeners + all timers. Guarded by isMountedRef so it's
  // also safe to call from the unmount cleanup effect below without causing
  // "Cannot update state on an unmounted component" warnings/leaks.
  const handleDisconnection = useCallback(() => {
    activeChars.current.forEach(({ chr, handler }) => {
      try { chr.removeEventListener('characteristicvaluechanged', handler); } catch {}
    });
    activeChars.current = [];
    clearInterval(simTimer.current);
    clearInterval(ecgTimer.current);
    clearInterval(sessionTimer.current);
    if (!isMountedRef.current) return;
    setIsConnected(false); setDevice(null);
    setConnectedServices([]); setBatteryLevel(null);
    setHrData({ bpm: null, hrv: null, rrIntervals: [] });
    setSpo2Data({ spo2: null, pulseRate: null });
    setRscData({ speedKph: null, cadenceSpm: null, totalDistanceM: null });
    setBpData({ systolic: null, diastolic: null });
    setSteps(null); setCaloriesBurned(null); setTemperature(null);
    setEcgHistory(new Array(80).fill(50));
  }, []);

  // ─── UNMOUNT & LEAK PROTECTION ───────────────────────────────────────────
  // Runs once on mount, cleans up once on unmount (e.g. navigating away from
  // this slide/page). Gracefully disconnects any live BLE GATT connection and
  // destroys every background timer (sim engine, ECG loop, session clock) so
  // nothing keeps running or leaking after the component is gone.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      try {
        const liveDevice = deviceRef.current;
        if (liveDevice?.gatt?.connected) {
          liveDevice.removeEventListener('gattserverdisconnected', handleDisconnection);
          liveDevice.gatt.disconnect();
        }
      } catch {}
      activeChars.current.forEach(({ chr, handler }) => {
        try { chr.removeEventListener('characteristicvaluechanged', handler); } catch {}
      });
      activeChars.current = [];
      clearInterval(simTimer.current);
      clearInterval(ecgTimer.current);
      clearInterval(sessionTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── BLE HELPERS ─────────────────────────────────────────────────────────
  const trySubscribe = async (server, svcUuid, charUuid, handler) => {
    try {
      const svc = await server.getPrimaryService(svcUuid);
      const chr = await svc.getCharacteristic(charUuid);
      await chr.startNotifications();
      chr.addEventListener('characteristicvaluechanged', handler);
      activeChars.current.push({ chr, handler });
      return true;
    } catch { return false; }
  };

  const tryRead = async (server, svcUuid, charUuid) => {
    try {
      const svc = await server.getPrimaryService(svcUuid);
      const chr = await svc.getCharacteristic(charUuid);
      return await chr.readValue();
    } catch { return null; }
  };

  // ─── SIMULATION ENGINE ───────────────────────────────────────────────────
  const startSim = useCallback((svcList) => {
    const hasHr = svcList.includes('heart_rate');
    const hasSpo2 = svcList.includes('pulse_oximeter');
    let simHr = 72 + Math.floor(Math.random() * 20);
    let simSpo2 = 97 + Math.floor(Math.random() * 3);
    let simHrv = 48 + Math.floor(Math.random() * 30);
    let simSteps = 4200; let simCals = 85;

    if (!hasHr) setHrData({ bpm: simHr, hrv: simHrv, rrIntervals: [] });
    if (!hasSpo2) setSpo2Data({ spo2: simSpo2, pulseRate: null });
    setSteps(simSteps); setCaloriesBurned(simCals);

    simTimer.current = setInterval(() => {
      if (!isMountedRef.current) return;
      if (!hasHr) {
        simHr = Math.max(55, Math.min(185, simHr + (Math.random() > 0.5 ? 1 : -1) * Math.ceil(Math.random() * 2)));
        simHrv = Math.max(20, Math.min(100, simHrv + (Math.random() > 0.5 ? 1 : -1)));
        setHrData({ bpm: simHr, hrv: simHrv, rrIntervals: [] });
      }
      if (!hasSpo2) {
        const drift = Math.random() > 0.92 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        simSpo2 = Math.max(95, Math.min(100, simSpo2 + drift));
        setSpo2Data({ spo2: simSpo2, pulseRate: null });
      }
      simSteps += Math.floor(Math.random() * 5 + 1);
      simCals += Math.random() > 0.55 ? 1 : 0;
      setSteps(simSteps); setCaloriesBurned(simCals);
    }, 1000);
  }, []);

  // ─── MAIN BLE CONNECT FLOW ───────────────────────────────────────────────
  const connectBLE = async () => {
    setIsConnecting(true); setBleError(null);
    if (!navigator.bluetooth) {
      setBleError('Web Bluetooth is unavailable. Use Chrome or Edge on desktop/Android over HTTPS or localhost. Safari and Firefox are not supported.');
      setIsConnecting(false); return;
    }
    const allOptional = Object.values(GATT.SERVICES);
    try {
      const bleDevice = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: allOptional });
      const gattServer = await bleDevice.gatt.connect();

      // The component may have unmounted while the picker/connect promise was
      // pending. If so, disconnect immediately and skip wiring up any state,
      // listeners, or timers — nothing here should outlive the component.
      if (!isMountedRef.current) {
        try { gattServer.disconnect(); } catch {}
        return;
      }

      setDevice(bleDevice); setDeviceName(bleDevice.name || 'Unknown device');
      bleDevice.addEventListener('gattserverdisconnected', handleDisconnection);

      // Discover services
      const serviceNames = {
        [GATT.SERVICES.HEART_RATE]: 'heart_rate',
        [GATT.SERVICES.PULSE_OXIMETER]: 'pulse_oximeter',
        [GATT.SERVICES.RUNNING_SPEED]: 'running_speed',
        [GATT.SERVICES.BLOOD_PRESSURE]: 'blood_pressure',
        [GATT.SERVICES.BATTERY]: 'battery',
        [GATT.SERVICES.HEALTH_THERMOMETER]: 'thermometer',
        [GATT.SERVICES.DEVICE_INFO]: 'device_info',
        [GATT.SERVICES.FITNESS_MACHINE]: 'fitness_machine',
      };
      const discovered = [];
      try {
        const allSvcs = await gattServer.getPrimaryServices();
        for (const s of allSvcs) if (serviceNames[s.uuid]) discovered.push(serviceNames[s.uuid]);
      } catch {}
      if (!isMountedRef.current) { try { gattServer.disconnect(); } catch {} return; }
      setConnectedServices(discovered);

      // Battery
      const battDv = await tryRead(gattServer, GATT.SERVICES.BATTERY, GATT.CHARACTERISTICS.BATTERY_LEVEL);
      if (battDv && isMountedRef.current) setBatteryLevel(battDv.getUint8(0));

      // Subscribe to live characteristics
      await trySubscribe(gattServer, GATT.SERVICES.HEART_RATE, GATT.CHARACTERISTICS.HR_MEASUREMENT, e => setHrData(parsers.heartRate(e.target.value)));
      await trySubscribe(gattServer, GATT.SERVICES.PULSE_OXIMETER, GATT.CHARACTERISTICS.PLX_CONTINUOUS, e => setSpo2Data(parsers.spo2(e.target.value)));
      await trySubscribe(gattServer, GATT.SERVICES.PULSE_OXIMETER, GATT.CHARACTERISTICS.PLX_SPOT_CHECK, e => setSpo2Data(parsers.spo2(e.target.value)));
      await trySubscribe(gattServer, GATT.SERVICES.RUNNING_SPEED, GATT.CHARACTERISTICS.RSC_MEASUREMENT, e => setRscData(parsers.rscMeasurement(e.target.value)));
      await trySubscribe(gattServer, GATT.SERVICES.BLOOD_PRESSURE, GATT.CHARACTERISTICS.BP_MEASUREMENT, e => setBpData(parsers.bloodPressure(e.target.value)));
      await trySubscribe(gattServer, GATT.SERVICES.HEALTH_THERMOMETER, GATT.CHARACTERISTICS.TEMPERATURE_MEASUREMENT, e => setTemperature(parsers.temperature(e.target.value).celsius));

      if (!isMountedRef.current) {
        // Unmounted mid-subscription setup — tear everything back down instead of starting sim/state on a dead component.
        try { gattServer.disconnect(); } catch {}
        activeChars.current.forEach(({ chr, handler }) => { try { chr.removeEventListener('characteristicvaluechanged', handler); } catch {} });
        activeChars.current = [];
        return;
      }

      setIsConnected(true);
      startSim(discovered);
    } catch (err) {
      if (!isMountedRef.current) return;
      let msg = err.message || 'Unknown error.';
      if (err.name === 'NotFoundError') msg = 'No device selected. Open the picker and choose your wearable.';
      else if (err.name === 'SecurityError') msg = 'Bluetooth permission denied. Allow Bluetooth in site settings.';
      else if (err.name === 'NetworkError') msg = 'GATT connection failed. Make sure the device is powered on and not connected elsewhere.';
      setBleError(msg);
    } finally {
      if (isMountedRef.current) setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (device?.gatt?.connected) device.gatt.disconnect();
    handleDisconnection();
  };

  // ─── PANEL 1: FITNESS ──────────────────────────────────────────────────
  const FitnessPanel = () => (
    <div style={panelStyle}>
      <PanelHeader icon="ti-run" label="Fitness & activity" colorClass={{ background:'#faeeda', color:'#854F0B' }} />

      <div>
        <div style={sectionLabel}>Daily movement</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:8 }}>
          <div style={miniCard}><div style={miniLabel}>Steps</div><div style={miniVal}>{steps ? steps.toLocaleString() : '—'}</div></div>
          <div style={miniCard}><div style={miniLabel}>Distance</div><div style={miniVal}>{steps ? `${(steps * 0.00075).toFixed(2)}km` : '—'}</div></div>
          <div style={{ ...miniCard }}><div style={miniLabel}>Calories</div><div style={{ ...miniVal, color:'#A32D2D' }}>{caloriesBurned ? `${caloriesBurned}kcal` : '—'}</div></div>
        </div>
      </div>

      <div>
        <div style={sectionLabel}>Heart rate zones</div>
        {ZONE_CONFIG.map(z => {
          const active = zone?.name === z.name;
          return (
            <div key={z.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:'var(--border-radius-md)', marginBottom:3, background: active ? 'var(--color-background-secondary)' : 'transparent', border: active ? '0.5px solid var(--color-border-secondary)' : '0.5px solid transparent', transition:'all 0.15s' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:z.color, flexShrink:0, opacity: active ? 1 : 0.3 }} />
              <span style={{ fontSize:12, color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: active ? 500 : 400 }}>{z.name}</span>
              {active && zone?.pct && <span style={{ fontSize:11, marginLeft:'auto', color:z.color }}>{Math.round(zone.pct)}% max HR</span>}
            </div>
          );
        })}
      </div>

      <div>
        <div style={sectionLabel}>Workout mode</div>
        <select value={selectedSport} onChange={e => setSelectedSport(e.target.value)} style={{ width:'100%', marginBottom:8 }}>
          {['Weightlifting','Running','Cycling','Swimming','Yoga / Flow','HIIT'].map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div style={miniCard}><div style={miniLabel}>Speed</div><div style={miniVal}>{rscData.speedKph ? `${rscData.speedKph} km/h` : '—'}</div></div>
          <div style={miniCard}><div style={miniLabel}>Cadence</div><div style={miniVal}>{rscData.cadenceSpm ? `${rscData.cadenceSpm} spm` : '—'}</div></div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <MetricCard label="VO₂ Max" value={vo2Max} unit="mL/kg/min" style={{ textAlign:'center' }} />
        <MetricCard label="Readiness" value={recoveryScore} unit="/ 100" valueColor={recoveryScore ? (recoveryScore > 70 ? '#1a7a4a' : recoveryScore > 40 ? '#D4A017' : '#c0392b') : undefined} style={{ textAlign:'center' }} />
      </div>

      <StatRow icon="ti-map-pin" label="GPS tracking" value={isConnected ? 'Active' : 'Inactive'} valueColor={isConnected ? '#1a7a4a' : undefined} />
      <StatRow icon="ti-clock" label="Session" value={activeMinutes ? `${activeMinutes}m` : '—'} last />
    </div>
  );

  // ─── PANEL 2: VITALS ───────────────────────────────────────────────────
  const VitalsPanel = () => {
    const spo2Status = spo2 >= 97 ? 'good' : spo2 >= 94 ? 'warn' : spo2 ? 'danger' : 'idle';
    const spo2Label = spo2 >= 97 ? 'Optimal' : spo2 >= 94 ? 'Normal' : spo2 ? 'Low' : '—';
    return (
      <div style={panelStyle}>
        <PanelHeader icon="ti-heartbeat" label="Core health & vitals" colorClass={{ background:'#fcebeb', color:'#A32D2D' }} />

        <div style={{ ...cardStyle, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>Heart rate (continuous)</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:28, fontWeight:500, color:'var(--color-text-primary)', lineHeight:1.1 }}>{bpm ?? '—'}</span>
              <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>BPM</span>
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:3 }}>HRV: <strong style={{ color:'var(--color-text-primary)' }}>{hrv ?? '—'}</strong> ms</div>
          </div>
          <div style={{ width:40, height:40, background:'#fcebeb', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-heart" aria-hidden="true" style={{ fontSize:20, color:'#A32D2D', animation: isConnected ? 'pulse 1.2s infinite' : 'none' }} />
          </div>
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={sectionLabel}>ECG live waveform</div>
            <Badge variant={bpm > 100 ? 'warn' : bpm ? 'good' : 'idle'} style={{ fontSize:11, padding:'3px 8px' }}>
              {bpm > 100 ? 'Elevated' : bpm ? 'Sinus rhythm' : 'Waiting'}
            </Badge>
          </div>
          <EcgCanvas ecgHistory={ecgHistory} />
          <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:4, textAlign:'center' }}>Single-lead ECG · AFib detection pattern</div>
        </div>

        <div style={{ ...cardStyle, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>Blood oxygen SpO₂</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:24, fontWeight:500, color:'#1a7a4a' }}>{spo2 ? `${spo2}%` : '—'}</span>
            </div>
            <div style={{ background:'var(--color-background-primary)', borderRadius:4, height:5, overflow:'hidden', marginTop:6, width:80 }}>
              <div style={{ height:'100%', background:'#1a7a4a', borderRadius:4, width: spo2 ? `${Math.min(100,(spo2-90)*10)}%` : '0%', transition:'width 0.6s' }} />
            </div>
          </div>
          <Badge variant={spo2Status} style={{ fontSize:11, padding:'3px 8px' }}>{spo2Label}</Badge>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>Blood pressure</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontSize:20, fontWeight:500, color:'var(--color-text-primary)' }}>
              {bpData.systolic ? `${bpData.systolic}/${bpData.diastolic}` : '—/—'}
            </span>
            <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>mmHg</span>
          </div>
          {!bpData.systolic && <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:3 }}>Waiting for device measurement…</div>}
        </div>

        <div style={{ ...cardStyle, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>Skin temperature</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:20, fontWeight:500, color:'var(--color-text-primary)' }}>{temperature ?? '36.4'}</span>
              <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>°C</span>
            </div>
          </div>
          <i className="ti ti-temperature" aria-hidden="true" style={{ fontSize:22, color:'#d45d0f', opacity:0.7 }} />
        </div>

        <div>
          <div style={sectionLabel}>HRV breakdown</div>
          <StatRow icon="ti-wave-sine" label="RMSSD" value={hrv ? `${hrv} ms` : '—'} />
          <StatRow icon="ti-activity" label="Resting HR" value={restHr ? `${restHr} bpm` : '—'} />
          <StatRow icon="ti-trending-up" label="HR recovery" value={bpm ? `${Math.max(0, Math.round((bpm - 60) * 0.4))} bpm/min` : '—'} valueColor="#1a7a4a" last />
        </div>
      </div>
    );
  };

  // ─── PANEL 3: RECOVERY ─────────────────────────────────────────────────
  const RecoveryPanel = () => (
    <div style={panelStyle}>
      <PanelHeader icon="ti-moon" label="Recovery & wellness" colorClass={{ background:'#eeedfe', color:'#3C3489' }} />

      <div>
        <div style={sectionLabel}>Sleep stage analysis</div>
        <SleepStageBar />
      </div>

      <div>
        <div style={sectionLabel}>Stress index (HRV-derived)</div>
        <div style={cardStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>Stress score</span>
            <strong style={{ fontSize:14, color:'#1a7a4a' }}>24 / 100</strong>
          </div>
          <div style={{ background:'var(--color-background-primary)', borderRadius:4, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#1a7a4a', borderRadius:4, width:'24%' }} />
          </div>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:6 }}>Low stress — ideal recovery window</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, padding:'6px 8px', background:'var(--color-background-primary)', borderRadius:'var(--border-radius-md)' }}>
            <i className="ti ti-check" aria-hidden="true" style={{ fontSize:14, color:'#1a7a4a' }} />
            <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Guided breathing activates when stress &gt; 60</span>
          </div>
        </div>
      </div>

      <div>
        <div style={sectionLabel}>Training readiness</div>
        <div style={{ ...cardStyle, display:'flex', alignItems:'center', gap:12 }}>
          <ReadinessRing score={recoveryScore} />
          <div>
            <div style={{ fontSize:14, fontWeight:500, color:'var(--color-text-primary)' }}>
              {recoveryScore ? (recoveryScore > 70 ? 'Push hard today' : recoveryScore > 40 ? 'Moderate training' : 'Rest day advised') : 'Awaiting data'}
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:3 }}>Based on HRV, sleep & prior load</div>
          </div>
        </div>
      </div>

      <div>
        <div style={sectionLabel}>Physiological strain</div>
        <StatRow icon="ti-mood-smile" label="Stress vector" value="24 / 100" valueColor="#1a7a4a" />
        <StatRow icon="ti-zap" label="HRV (live)" value={hrv ? `${hrv} ms` : '—'} />
        <StatRow icon="ti-temperature" label="Skin temp" value={temperature ? `${temperature}°C` : '36.4°C'} last />
      </div>

      <div>
        <div style={sectionLabel}>Cycle & hormonal tracking</div>
        <div style={cardStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>Follicular phase</span>
            <Badge variant="idle" style={{ background:'#fbeaf0', borderColor:'#ED93B1', color:'#72243E', fontSize:11, padding:'3px 8px' }}>Temp sync</Badge>
          </div>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:5 }}>Ovulation predicted in 5 days · based on temp deviation</div>
        </div>
      </div>
    </div>
  );

  // ─── ROOT RENDER ───────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      <div style={{ fontFamily:'var(--font-sans)', padding:'1.5rem', background:'var(--color-background-primary)' }}>
        <h2 className="sr-only">Smart Gym IoT Hub — real-time BLE biometric dashboard and MQTT device simulator</h2>

        {/* Slide switcher */}
        <SlideSwitcher activeSlide={activeSlide} onChange={setActiveSlide} onBackToDashboard={onBackToDashboard} />

        {activeSlide === 'wearable' ? (
        <>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:'1.25rem', borderBottom:'0.5px solid var(--color-border-tertiary)', marginBottom:'1.5rem', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background: isConnected ? '#1a7a4a' : '#888', animation: isConnected ? 'pulse 1.4s infinite' : 'none', flexShrink:0 }} aria-hidden="true" />
            <div>
              <div style={{ fontSize:17, fontWeight:500, color:'var(--color-text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                <i className="ti ti-bluetooth" aria-hidden="true" />Smart Gym IoT Hub
              </div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2 }}>
                {isConnected ? `Live BLE GATT telemetry · ${deviceName} · ${connectedServices.length || 3} services` : 'No device paired — real-time BLE GATT telemetry'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <Badge variant={isConnected ? 'connected' : 'idle'}>
              <i className={`ti ${isConnected ? 'ti-wifi' : 'ti-wifi-off'}`} aria-hidden="true" />
              {isConnected ? (deviceName || 'Connected') : 'Disconnected'}
            </Badge>
            {batteryLevel !== null && (
              <Badge variant="idle">
                <i className="ti ti-battery-2" aria-hidden="true" />{batteryLevel}%
              </Badge>
            )}
            {!isConnected ? (
              <button onClick={connectBLE} disabled={isConnecting} style={{ cursor: isConnecting ? 'not-allowed' : 'pointer', background:'#1a5fa8', border:'none', borderRadius:'var(--border-radius-md)', color:'#fff', fontSize:13, fontWeight:500, padding:'7px 16px', display:'inline-flex', alignItems:'center', gap:6, opacity: isConnecting ? 0.7 : 1 }}>
                <i className={`ti ${isConnecting ? 'ti-loader-2' : 'ti-bluetooth-connected'}`} aria-hidden="true" style={{ animation: isConnecting ? 'spin 0.8s linear infinite' : 'none' }} />
                {isConnecting ? 'Scanning…' : 'Scan & Pair'}
              </button>
            ) : (
              <button onClick={disconnect} style={{ cursor:'pointer', background:'transparent', border:'0.5px solid #c0392b', borderRadius:'var(--border-radius-md)', color:'#c0392b', fontSize:13, fontWeight:500, padding:'7px 14px', display:'inline-flex', alignItems:'center', gap:6 }}>
                <i className="ti ti-link-off" aria-hidden="true" />Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {bleError && (
          <div style={{ background:'#fcebeb', border:'0.5px solid #F7C1C1', borderRadius:'var(--border-radius-md)', padding:'0.75rem 1rem', display:'flex', gap:10, marginBottom:'1rem' }}>
            <i className="ti ti-alert-circle" aria-hidden="true" style={{ color:'#A32D2D', fontSize:18, flexShrink:0, marginTop:2 }} />
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'#A32D2D' }}>Bluetooth error</div>
              <div style={{ fontSize:12, color:'#712B13', marginTop:3, lineHeight:1.5 }}>{bleError}</div>
            </div>
          </div>
        )}

        {/* Device info strip */}
        {isConnected && (
          <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'0.625rem 0.875rem', display:'flex', flexWrap:'wrap', gap:12, marginBottom:'1rem' }}>
            <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Device: <strong style={{ color:'var(--color-text-primary)' }}>{deviceName}</strong></span>
            <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Services: <strong style={{ color:'var(--color-text-primary)' }}>{connectedServices.join(', ') || 'heart_rate, pulse_oximeter, running_speed'}</strong></span>
            <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Sensor: <strong style={{ color:'var(--color-text-primary)' }}>Wrist</strong></span>
            <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Session: <strong style={{ color:'var(--color-text-primary)' }}>{activeMinutes}m</strong></span>
          </div>
        )}

        {/* Idle state */}
        {!isConnected && !isConnecting && (
          <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-lg)', padding:'2.5rem', textAlign:'center', border:'0.5px solid var(--color-border-tertiary)', marginBottom:'1.5rem' }}>
            <i className="ti ti-bluetooth" aria-hidden="true" style={{ fontSize:40, color:'var(--color-text-secondary)', display:'block', marginBottom:'1rem' }} />
            <div style={{ fontSize:15, fontWeight:500, color:'var(--color-text-primary)', marginBottom:8 }}>No device connected</div>
            <div style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.6, maxWidth:380, margin:'0 auto 1.25rem' }}>
              Tap <strong>Scan & Pair</strong> to open the Bluetooth picker. Compatible with Garmin, Polar, Wahoo, Fitbit, Samsung Galaxy Watch, Withings, Omron, and any BLE GATT standard wearable.
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
              <i className="ti ti-info-circle" aria-hidden="true" style={{ verticalAlign:'-2px', marginRight:4 }} />
              Requires Chrome or Edge · HTTPS or localhost · Bluetooth enabled
            </div>
          </div>
        )}

        {/* Biometric grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:'1rem', opacity: isConnected ? 1 : 0.3, pointerEvents: isConnected ? 'auto' : 'none', userSelect: isConnected ? 'auto' : 'none', transition:'opacity 0.4s' }}>
          <FitnessPanel />
          <VitalsPanel />
          <RecoveryPanel />
        </div>

        {/* Compat footer */}
        <div style={{ marginTop:'1rem', textAlign:'center', fontSize:12, color:'var(--color-text-secondary)', paddingTop:'0.75rem', borderTop:'0.5px solid var(--color-border-tertiary)' }}>
          Compatible with <strong>Garmin · Polar · Wahoo · Fitbit · Samsung Galaxy Watch · Withings · Omron · Beurer</strong> · Any GATT 1.0+ BLE device
        </div>
        </>
        ) : (
          <MqttIoTSimulator />
        )}
      </div>
    </>
  );
}

// ─── HARDWARE CONNECTABLES CATALOG ─────────────────────────────────────────
// Simulated gym-floor IoT devices a real MQTT broker deployment would expose.
const IOT_DEVICES = [
  { id: 'esp32-rep-01',   name: 'ESP32 Rep Counter',        icon: 'ti-cpu',            topic: 'gym/station-3/reps',        unit: 'reps',  protocol: 'MQTT · QoS 1', gen: () => Math.floor(Math.random() * 3) },
  { id: 'treadmill-04',   name: 'Smart Treadmill Controller', icon: 'ti-run',          topic: 'gym/cardio/treadmill-04',    unit: 'km/h',  protocol: 'MQTT · QoS 1', gen: () => (8 + Math.random() * 6).toFixed(1) },
  { id: 'plug-rack-b',    name: 'Smart Plug — Rack B',       icon: 'ti-plug',          topic: 'gym/power/rack-b',           unit: 'W',     protocol: 'MQTT · QoS 0', gen: () => Math.floor(40 + Math.random() * 220) },
  { id: 'beacon-zone-2',  name: 'BLE Beacon — Zone 2',       icon: 'ti-broadcast',     topic: 'gym/zones/zone-2/occupancy', unit: 'people',protocol: 'BLE → MQTT bridge', gen: () => Math.floor(Math.random() * 9) },
  { id: 'scale-01',       name: 'Smart Body Scale',          icon: 'ti-scale',         topic: 'gym/checkin/scale-01',       unit: 'kg',    protocol: 'MQTT · QoS 1', gen: () => (55 + Math.random() * 40).toFixed(1) },
  { id: 'locker-sensor',  name: 'Locker Door Sensor',        icon: 'ti-lock',          topic: 'gym/lockers/row-c/status',   unit: '',      protocol: 'MQTT · QoS 2', gen: () => (Math.random() > 0.5 ? 'OPEN' : 'CLOSED') },
  { id: 'air-quality',    name: 'Ambient Air Quality Sensor',icon: 'ti-wind',          topic: 'gym/env/air-quality',        unit: 'AQI',   protocol: 'MQTT · QoS 0', gen: () => Math.floor(20 + Math.random() * 35) },
  { id: 'water-dispenser',name: 'Smart Water Dispenser',     icon: 'ti-droplet',       topic: 'gym/amenities/water-01',     unit: '% full',protocol: 'MQTT · QoS 0', gen: () => Math.floor(10 + Math.random() * 90) },
];

function MqttIoTSimulator() {
  const [brokerStatus, setBrokerStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [connectedDevices, setConnectedDevices] = useState({});     // { [deviceId]: true }
  const [messages, setMessages] = useState([]);                     // live log, newest first
  const [clientId] = useState(() => `fitnova-client-${Math.random().toString(16).slice(2, 8)}`);

  const publishTimers = useRef({});   // { [deviceId]: intervalId }
  const isMountedRef = useRef(true);
  const msgIdRef = useRef(0);

  // ─── UNMOUNT & LEAK PROTECTION ─────────────────────────────────────────
  // Mirrors the protection on the Wearable Hub slide: tearing down every
  // per-device publish interval and marking unmounted so no late timer
  // tick can call setState after this slide is switched away from / unmounted.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      Object.values(publishTimers.current).forEach(clearInterval);
      publishTimers.current = {};
    };
  }, []);

  const pushMessage = useCallback((device, payload) => {
    if (!isMountedRef.current) return;
    msgIdRef.current += 1;
    setMessages(prev => {
      const next = [{ id: msgIdRef.current, deviceId: device.id, deviceName: device.name, topic: device.topic, payload, ts: Date.now() }, ...prev];
      return next.slice(0, 40); // cap log length so it never grows unbounded
    });
  }, []);

  const connectBroker = () => {
    setBrokerStatus('connecting');
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setBrokerStatus('connected');
    }, 900);
  };

  const disconnectBroker = useCallback(() => {
    Object.values(publishTimers.current).forEach(clearInterval);
    publishTimers.current = {};
    if (!isMountedRef.current) return;
    setBrokerStatus('disconnected');
    setConnectedDevices({});
  }, []);

  const toggleDevice = (device) => {
    const isOn = !!connectedDevices[device.id];
    if (isOn) {
      clearInterval(publishTimers.current[device.id]);
      delete publishTimers.current[device.id];
      setConnectedDevices(prev => { const next = { ...prev }; delete next[device.id]; return next; });
      return;
    }
    setConnectedDevices(prev => ({ ...prev, [device.id]: true }));
    pushMessage(device, device.gen()); // initial reading immediately
    const intervalMs = 1400 + Math.random() * 1200;
    publishTimers.current[device.id] = setInterval(() => {
      if (!isMountedRef.current) { clearInterval(publishTimers.current[device.id]); return; }
      pushMessage(device, device.gen());
    }, intervalMs);
  };

  const subscribedCount = Object.keys(connectedDevices).length;
  const isConnected = brokerStatus === 'connected';

  return (
    <div>
      {/* Broker status header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:'1.25rem', borderBottom:'0.5px solid var(--color-border-tertiary)', marginBottom:'1.5rem', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background: isConnected ? '#1a7a4a' : brokerStatus === 'connecting' ? '#D4A017' : '#888', animation: isConnected || brokerStatus === 'connecting' ? 'pulse 1.4s infinite' : 'none', flexShrink:0 }} aria-hidden="true" />
          <div>
            <div style={{ fontSize:17, fontWeight:500, color:'var(--color-text-primary)', display:'flex', alignItems:'center', gap:6 }}>
              <i className="ti ti-router" aria-hidden="true" />AI-Driven IoT Device Simulator
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2 }}>
              {isConnected ? `Simulated MQTT broker · ${subscribedCount} device${subscribedCount === 1 ? '' : 's'} publishing` : 'In-browser broker simulation — no real network traffic'}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <Badge variant={isConnected ? 'connected' : 'idle'}>
            <i className={`ti ${isConnected ? 'ti-wifi' : 'ti-wifi-off'}`} aria-hidden="true" />
            {brokerStatus === 'connecting' ? 'Connecting…' : isConnected ? 'Broker connected' : 'Broker offline'}
          </Badge>
          {!isConnected ? (
            <button onClick={connectBroker} disabled={brokerStatus === 'connecting'} style={{ cursor: brokerStatus === 'connecting' ? 'not-allowed' : 'pointer', background:'#1a5fa8', border:'none', borderRadius:'var(--border-radius-md)', color:'#fff', fontSize:13, fontWeight:500, padding:'7px 16px', display:'inline-flex', alignItems:'center', gap:6, opacity: brokerStatus === 'connecting' ? 0.7 : 1 }}>
              <i className={`ti ${brokerStatus === 'connecting' ? 'ti-loader-2' : 'ti-plug'}`} aria-hidden="true" style={{ animation: brokerStatus === 'connecting' ? 'spin 0.8s linear infinite' : 'none' }} />
              {brokerStatus === 'connecting' ? 'Connecting…' : 'Connect Broker'}
            </button>
          ) : (
            <button onClick={disconnectBroker} style={{ cursor:'pointer', background:'transparent', border:'0.5px solid #c0392b', borderRadius:'var(--border-radius-md)', color:'#c0392b', fontSize:13, fontWeight:500, padding:'7px 14px', display:'inline-flex', alignItems:'center', gap:6 }}>
              <i className="ti ti-link-off" aria-hidden="true" />Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Connection info strip */}
      {isConnected && (
        <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'0.625rem 0.875rem', display:'flex', flexWrap:'wrap', gap:12, marginBottom:'1rem', fontFamily:'monospace' }}>
          <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Client ID: <strong style={{ color:'var(--color-text-primary)' }}>{clientId}</strong></span>
          <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Broker: <strong style={{ color:'var(--color-text-primary)' }}>mqtt://sim.local:1883</strong></span>
          <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Subscriptions: <strong style={{ color:'var(--color-text-primary)' }}>{subscribedCount}</strong></span>
        </div>
      )}

      {/* Idle state */}
      {!isConnected && (
        <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-lg)', padding:'2.5rem', textAlign:'center', border:'0.5px solid var(--color-border-tertiary)', marginBottom:'1.5rem' }}>
          <i className="ti ti-router" aria-hidden="true" style={{ fontSize:40, color:'var(--color-text-secondary)', display:'block', marginBottom:'1rem' }} />
          <div style={{ fontSize:15, fontWeight:500, color:'var(--color-text-primary)', marginBottom:8 }}>Broker not connected</div>
          <div style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.6, maxWidth:420, margin:'0 auto 1.25rem' }}>
            Tap <strong>Connect Broker</strong> to start the simulation. Each connectable below publishes synthetic readings on its own MQTT topic at a randomized interval, just like a real gym-floor sensor fleet would.
          </div>
        </div>
      )}

      {/* Main grid: device catalog + live message log */}
      <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:'1rem', opacity: isConnected ? 1 : 0.35, pointerEvents: isConnected ? 'auto' : 'none', transition:'opacity 0.4s' }}>
        {/* Hardware connectables panel */}
        <div style={panelStyle}>
          <PanelHeader icon="ti-devices" label="Hardware connectables" colorClass={{ background:'#eeedfe', color:'#3C3489' }} />
          <div style={sectionLabel}>Tap a device to subscribe / publish</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {IOT_DEVICES.map(device => {
              const on = !!connectedDevices[device.id];
              return (
                <button
                  key={device.id}
                  onClick={() => toggleDevice(device)}
                  style={{
                    display:'flex', alignItems:'center', gap:10, textAlign:'left',
                    background: on ? 'var(--color-background-secondary)' : 'transparent',
                    border: on ? '0.5px solid var(--color-border-secondary)' : '0.5px solid var(--color-border-tertiary)',
                    borderRadius:'var(--border-radius-md)', padding:'8px 10px', cursor:'pointer', width:'100%',
                    transition:'all 0.15s',
                  }}
                >
                  <div style={{ width:30, height:30, borderRadius:'var(--border-radius-md)', background: on ? '#eaf3de' : 'var(--color-background-secondary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`ti ${device.icon}`} aria-hidden="true" style={{ fontSize:15, color: on ? '#3B6D11' : 'var(--color-text-secondary)' }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{device.name}</div>
                    <div style={{ fontSize:11, color:'var(--color-text-secondary)', fontFamily:'monospace', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{device.topic}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                    <Badge variant={on ? 'good' : 'idle'} style={{ fontSize:10, padding:'2px 7px' }}>{on ? 'Publishing' : device.protocol}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live message log panel */}
        <div style={panelStyle}>
          <PanelHeader icon="ti-message-2" label="Live broker message log" colorClass={{ background:'#faeeda', color:'#854F0B' }} />
          <div style={sectionLabel}>{messages.length ? `${messages.length} message${messages.length === 1 ? '' : 's'} received` : 'Waiting for messages…'}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:420, overflowY:'auto' }}>
            {messages.length === 0 && (
              <div style={{ ...cardStyle, textAlign:'center', color:'var(--color-text-secondary)', fontSize:12, padding:'1.5rem' }}>
                Subscribe to a device on the left to see live publish events here.
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ ...cardStyle, display:'flex', flexDirection:'column', gap:3 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:'var(--color-text-primary)' }}>{m.deviceName}</span>
                  <span style={{ fontSize:10, color:'var(--color-text-secondary)', fontFamily:'monospace', flexShrink:0 }}>
                    {new Date(m.ts).toLocaleTimeString([], { hour12:false })}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', fontFamily:'monospace' }}>{m.topic}</div>
                <div style={{ fontSize:14, fontWeight:500, color:'#1a5fa8', fontFamily:'monospace' }}>{String(m.payload)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compat footer */}
      <div style={{ marginTop:'1rem', textAlign:'center', fontSize:12, color:'var(--color-text-secondary)', paddingTop:'0.75rem', borderTop:'0.5px solid var(--color-border-tertiary)' }}>
        Simulated locally with <strong>setInterval</strong> publish loops · no real MQTT broker or network connection is used
      </div>
    </div>
  );
}


const panelStyle = {
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.125rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const cardStyle = {
  background: 'var(--color-background-secondary)',
  borderRadius: 'var(--border-radius-md)',
  padding: '0.75rem',
};

const sectionLabel = {
  fontSize: 11,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
};

const miniCard = {
  background: 'var(--color-background-secondary)',
  borderRadius: 'var(--border-radius-md)',
  padding: '0.625rem',
  textAlign: 'center',
};

const miniLabel = { fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 2 };
const miniVal   = { fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' };