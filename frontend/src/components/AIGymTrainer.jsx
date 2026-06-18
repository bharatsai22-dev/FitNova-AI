import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Play, Square, RotateCcw, Activity, ShieldAlert, CheckCircle2, ArrowLeft, Zap, Layers, ChevronUp, ChevronDown, Flame, Clock, Target, TrendingUp, Dumbbell, Eye, AlertCircle, Wifi, WifiOff } from 'lucide-react';

// ─── Safety Guard For Global Scope Objects ──────────────────────────────────
// This prevents "MEDIAPIPE_CV is not defined" reference crashes during runtime execution
const MEDIAPIPE_CV = typeof window !== 'undefined' ? (window.MEDIAPIPE_CV || {}) : {};

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const end   = value;
    const dur   = 400;
    const t0    = performance.now();
    const tick  = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      setDisplay(start + (end - start) * eased);
      if (p < 1) requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{Math.round(display)}{suffix}</>;
}

// ─── Pulse ring around status dot ────────────────────────────────────────────
const PulseRing = ({ active }) => (
  <span className="relative flex h-3 w-3">
    {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
    <span className={`relative inline-flex rounded-full h-3 w-3 ${active ? 'bg-emerald-400' : 'bg-stone-600'}`} />
  </span>
);

// ─── Radial progress ring ─────────────────────────────────────────────────────
function RadialRing({ pct, size = 80, stroke = 6, color = '#FFD700' }) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c1c1c" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s cubic-bezier(.4,2,.6,1)' }}
      />
    </svg>
  );
}

// ─── Exercise selector pill button ───────────────────────────────────────────
function ExercisePill({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px',
        borderRadius: '99px',
        border: active ? '1.5px solid #FFD700' : '1.5px solid #2a2a2a',
        background: active ? 'rgba(255,215,0,0.10)' : 'transparent',
        color: active ? '#FFD700' : '#6b7280',
        fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
        transform: active ? 'scale(1.04)' : 'scale(1)',
        boxShadow: active ? '0 0 18px rgba(255,215,0,0.15)' : 'none',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, icon, value, unit, color = '#FFD700', accent }) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #222',
        borderRadius: '16px',
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {accent && <div style={{ position:'absolute', inset:0, background: `radial-gradient(ellipse at top right, ${color}0d 0%, transparent 70%)`, pointerEvents:'none' }} />}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
        <p style={{ fontSize:'9px', fontWeight:800, color:'#555', letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>{label}</p>
        <span style={{ color, opacity:0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize:'24px', fontWeight:900, color, margin:0, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
        {value}
      </div>
      <p style={{ fontSize:'9px', color:'#555', marginTop:'4px', fontFamily:'monospace', letterSpacing:'0.06em', textTransform:'uppercase' }}>{unit}</p>
    </div>
  );
}

// ─── Form score ring card ─────────────────────────────────────────────────────
function FormRing({ score }) {
  const color = score >= 90 ? '#32CD32' : score >= 75 ? '#FFD700' : '#FF3131';
  const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : 'Fix Form';
  return (
    <div
      style={{
        background:'#141414', border:'1px solid #222', borderRadius:'16px',
        padding:'18px 20px', display:'flex', alignItems:'center', gap:'18px',
        transition: 'border-color 0.2s, transform 0.2s', cursor:'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ position:'relative', flexShrink:0 }}>
        <RadialRing pct={score} size={72} stroke={6} color={color} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:'14px', fontWeight:900, color }}>{score}%</span>
        </div>
      </div>
      <div>
        <p style={{ fontSize:'9px', fontWeight:800, color:'#555', letterSpacing:'0.1em', textTransform:'uppercase', margin:'0 0 4px' }}>Form Score</p>
        <p style={{ fontSize:'15px', fontWeight:800, color, margin:0 }}>{label}</p>
        <p style={{ fontSize:'9px', color:'#555', marginTop:'2px', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.06em' }}>Accuracy Index</p>
      </div>
    </div>
  );
}

// ─── Ripple button hook ───────────────────────────────────────────────────────
function useRipple() {
  const [ripples, setRipples] = useState([]);
  const add = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  };
  return [ripples, add];
}

function RippleBtn({ onClick, disabled, children, style, className }) {
  const [ripples, addRipple] = useRipple();
  return (
    <button
      disabled={disabled}
      onClick={(e) => { addRipple(e); onClick && onClick(e); }}
      className={className}
      style={{ position:'relative', overflow:'hidden', ...style }}
    >
      {ripples.map(r => (
        <span
          key={r.id}
          style={{
            position:'absolute', borderRadius:'50%',
            transform:'scale(0)', animation:'ripple 0.6s linear',
            background:'rgba(255,255,255,0.25)',
            width:'80px', height:'80px',
            left: r.x - 40, top: r.y - 40,
            pointerEvents:'none',
          }}
        />
      ))}
      {children}
    </button>
  );
}

// ─── History mini-bar ─────────────────────────────────────────────────────────
function RepHistoryBar({ history }) {
  if (!history.length) return null;
  return (
    <div style={{ display:'flex', gap:'4px', alignItems:'flex-end', height:'32px', marginTop:'8px' }}>
      {history.slice(-12).map((score, i) => {
        const h = Math.max(4, (score / 100) * 32);
        const col = score >= 90 ? '#32CD32' : score >= 75 ? '#FFD700' : '#FF3131';
        return (
          <div
            key={i}
            title={`Rep ${i+1}: ${score}%`}
            style={{
              flex:1, height:`${h}px`, borderRadius:'3px', background:col, opacity:0.7,
              transition:'height 0.3s cubic-bezier(.4,2,.6,1)',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIGymTrainer({ userId, dailyStats, setDailyStats, onBackToDashboard, onWorkoutComplete }) {
  const [isActive, setIsActive]           = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [targetSets, setTargetSets]       = useState(3);
  const [currentSet, setCurrentSet]       = useState(1);
  const [targetReps, setTargetReps]       = useState(12);
  const [repCount, setRepCount]           = useState(0);
  const [formScore, setFormScore]         = useState(100);
  const [feedback, setFeedback]           = useState('Loading MediaPipe Computer Vision Models...');
  const [postureStatus, setPostureStatus] = useState('good');
  const [libraryReady, setLibraryReady]   = useState(false);
  const [repHistory, setRepHistory]       = useState([]);
  const [lastRepFlash, setLastRepFlash]   = useState(false);
  const [sessionTime, setSessionTime]     = useState(0);
  const sessionTimerRef = useRef(null);

  const videoRef          = useRef(null);
  const canvasRef         = useRef(null);
  const activeStreamRef   = useRef(null);
  const cameraInstanceRef = useRef(null);
  const poseEngineRef     = useRef(null);

  const isActiveRef        = useRef(false);
  const stageRef           = useRef('up');
  const totalCaloriesBurntRef = useRef(dailyStats?.calories || 0);
  const exerciseStateRef   = useRef(selectedExercise);
  const repCountRef        = useRef(0);
  const currentSetRef      = useRef(1);
  const targetRepsRef      = useRef(targetReps);
  const targetSetsRef      = useRef(targetSets);
  const repHistoryRef      = useRef([]);

  useEffect(() => { exerciseStateRef.current = selectedExercise; }, [selectedExercise]);
  useEffect(() => { targetRepsRef.current = targetReps; }, [targetReps]);
  useEffect(() => { targetSetsRef.current = targetSets; }, [targetSets]);
  useEffect(() => { repHistoryRef.current = repHistory; }, [repHistory]);

  // Session timer
  useEffect(() => {
    if (isActive) {
      sessionTimerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    } else {
      clearInterval(sessionTimerRef.current);
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [isActive]);

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const exerciseMeta = {
    squat: {
      name: 'Deep Squat Core', metValue: 0.55,
      feedbackIdeal: 'Drop hip joints below knee horizon parallel line.',
      icon: '🏋️', tip1: 'Keep chest tall', tip2: 'Push knees outward',
    },
    pushup: {
      name: 'Plank Pushup Axis', metValue: 0.45,
      feedbackIdeal: 'Keep spinal column line continuous. Break 90° at elbows.',
      icon: '💪', tip1: 'Brace your core', tip2: 'Elbows at 45°',
    },
    bicep_curl: {
      name: 'Isolation Bicep Curl', metValue: 0.20,
      feedbackIdeal: 'Isolate elbow anchor lock. Avoid hip thrust movement.',
      icon: '🦾', tip1: 'Lock elbows at sides', tip2: 'Full range of motion',
    },
  };

  // ── Load MediaPipe ──────────────────────────────────────────────────────────
  useEffect(() => {
    const injectMediaPipeLibraries = () => {
      if (window.Pose && window.Camera) {
        setLibraryReady(true);
        setFeedback('MediaPipe Vision Core initialized. Ready to launch camera.');
        return;
      }
      const scriptCamera  = document.createElement('script');
      scriptCamera.src    = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      scriptCamera.crossOrigin = 'anonymous';
      const scriptDrawing = document.createElement('script');
      scriptDrawing.src   = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
      scriptDrawing.crossOrigin = 'anonymous';
      const scriptPose    = document.createElement('script');
      scriptPose.src      = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
      scriptPose.crossOrigin = 'anonymous';
      document.head.appendChild(scriptCamera);
      document.head.appendChild(scriptDrawing);
      document.head.appendChild(scriptPose);
      scriptPose.onload = () => {
        let attempts = 0;
        const check = setInterval(() => {
          attempts++;
          if (window.Pose && window.Camera) {
            clearInterval(check);
            setLibraryReady(true);
            setFeedback('MediaPipe compiled. Engine ready to start.');
          } else if (attempts > 40) {
            clearInterval(check);
            setFeedback('Failed to load dependencies. Check network connection.');
          }
        }, 250);
      };
      scriptPose.onerror = () => setFeedback('Script load error. Check network or CDN availability.');
    };
    injectMediaPipeLibraries();
    return () => { terminateVisionPipeline(); };
  }, []);

  // ── Geometry ────────────────────────────────────────────────────────────────
  const calculateAngle3D = (p1, p2, p3) => {
    if (!p1 || !p2 || !p3) return 180;
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return angle;
  };

  // ── Rep counter & Data Stream Pipelines ──────────────────────────────────────
  const executeRepCycleAction = useCallback((calculatedAccuracyScore) => {
    const targetMeta = exerciseMeta[exerciseStateRef.current];
    repCountRef.current += 1;
    const newRepCount = repCountRef.current;
    const currentBurnTotal = parseFloat((totalCaloriesBurntRef.current + targetMeta.metValue).toFixed(1));
    totalCaloriesBurntRef.current = currentBurnTotal;
    
    setFormScore(calculatedAccuracyScore);
    const updatedHistory = [...repHistoryRef.current, calculatedAccuracyScore];
    setRepHistory(updatedHistory);
    
    setLastRepFlash(true);
    setTimeout(() => setLastRepFlash(false), 350);
    
    if (calculatedAccuracyScore < 80) {
      setFeedback(`Rep ${newRepCount} captured. Fix form: ${targetMeta.feedbackIdeal}`);
      setPostureStatus('warning');
    } else {
      setFeedback(`Rep ${newRepCount} counted! Clean form detected.`);
      setPostureStatus('good');
    }
    
    if (setDailyStats) {
      setDailyStats((prev) => ({ ...prev, calories: currentBurnTotal, timeSpent: prev.timeSpent + 0.2 }));
    }
    setRepCount(newRepCount);
    
    if (newRepCount >= targetRepsRef.current) {
      repCountRef.current = 0;
      setRepCount(0);
      const nextSet = currentSetRef.current + 1;
      
      if (currentSetRef.current >= targetSetsRef.current) {
        setFeedback('🎉 All sets complete! Great workout.');
        
        // Pipeline Synchronization Pass: Full Routine Completed Sequence Trigger
        if (onWorkoutComplete) {
          const avgScore = updatedHistory.length ? Math.round(updatedHistory.reduce((a, b) => a + b, 0) / updatedHistory.length) : calculatedAccuracyScore;
          onWorkoutComplete({
            exerciseType: exerciseStateRef.current,
            totalRepsCount: targetRepsRef.current * targetSetsRef.current,
            averageFormScore: avgScore,
            rangeOfMotion: avgScore >= 90 ? 94 : 86,
            stabilityScore: avgScore >= 90 ? 92 : 84,
            smoothnessScore: avgScore >= 90 ? 95 : 88
          });
        }
      } else {
        currentSetRef.current = nextSet;
        setCurrentSet(nextSet);
        setFeedback(`Set ${currentSetRef.current - 1} done. Get ready for Set ${currentSetRef.current}.`);
      }
    }
  }, [setDailyStats, onWorkoutComplete]);

  // ── Safe Intercepting Exit Route ───────────────────────────────────────────
  const handleSafeExitNavigation = () => {
    if (repHistory.length > 0 && onWorkoutComplete) {
      const avgScore = Math.round(repHistory.reduce((a, b) => a + b, 0) / repHistory.length);
      onWorkoutComplete({
        exerciseType: selectedExercise,
        totalRepsCount: repHistory.length,
        averageFormScore: avgScore,
        rangeOfMotion: avgScore >= 90 ? 93 : 85,
        stabilityScore: avgScore >= 90 ? 91 : 83,
        smoothnessScore: avgScore >= 90 ? 94 : 86
      });
    }
    terminateVisionPipeline();
    onBackToDashboard();
  };

  // ── Pose handler ─────────────────────────────────────────────────────────────
  const handlePoseResultsRef = useRef(null);
  handlePoseResultsRef.current = (results) => {
    if (!canvasRef.current || !videoRef.current || !isActiveRef.current) return;
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      if (results.image) ctx.drawImage(results.image, 0, 0, W, H);
      ctx.restore();
      if (results.poseLandmarks) {
        const lm = results.poseLandmarks;
        const leftShoulder = lm[11], leftElbow = lm[13], leftWrist = lm[15];
        const leftHip = lm[23], leftKnee = lm[25], leftAnkle = lm[27];
        const currentExercise = exerciseStateRef.current;
        const mCtx = canvas.getContext('2d');
        const draw = (a, b, color = '#FF3131') => {
          if (!a || !b) return;
          mCtx.beginPath();
          mCtx.moveTo((1-a.x)*W, a.y*H);
          mCtx.lineTo((1-b.x)*W, b.y*H);
          mCtx.strokeStyle = color;
          mCtx.lineWidth = 4;
          mCtx.shadowColor = color;
          mCtx.shadowBlur = 8;
          mCtx.stroke();
          mCtx.shadowBlur = 0;
        };
        if (currentExercise === 'bicep_curl') {
          const angle = calculateAngle3D(leftShoulder, leftElbow, leftWrist);
          draw(leftShoulder, leftElbow, '#FF3131');
          draw(leftElbow, leftWrist, '#FFD700');
          if (angle > 150) stageRef.current = 'down';
          if (angle < 50 && stageRef.current === 'down') { stageRef.current = 'up'; executeRepCycleAction(98); }
        } else if (currentExercise === 'squat') {
          const angle = calculateAngle3D(leftHip, leftKnee, leftAnkle);
          draw(leftHip, leftKnee, '#FF3131');
          draw(leftKnee, leftAnkle, '#FFD700');
          if (angle > 160) stageRef.current = 'up';
          if (angle < 100 && stageRef.current === 'up') { stageRef.current = 'down'; executeRepCycleAction(angle < 90 ? 100 : 88); }
        } else if (currentExercise === 'pushup') {
          const elbowAngle = calculateAngle3D(leftShoulder, leftElbow, leftWrist);
          const hipAngle   = calculateAngle3D(leftShoulder, leftHip, leftKnee);
          draw(leftShoulder, leftElbow, '#FF3131');
          draw(leftElbow, leftWrist, '#FFD700');
          draw(leftShoulder, leftHip, '#32CD32');
          if (elbowAngle > 160) stageRef.current = 'up';
          if (elbowAngle < 95 && stageRef.current === 'up') { stageRef.current = 'down'; executeRepCycleAction((hipAngle < 150 || hipAngle > 185) ? 70 : 95); }
        }
        lm.forEach((lmPoint) => {
          if (lmPoint.visibility > 0.5) {
            mCtx.beginPath();
            mCtx.arc((1-lmPoint.x)*W, lmPoint.y*H, 5, 0, 2*Math.PI);
            mCtx.fillStyle = '#FFD700';
            mCtx.shadowColor = '#FFD700';
            mCtx.shadowBlur = 6;
            mCtx.fill();
            mCtx.shadowBlur = 0;
          }
        });
      }
    } catch (err) { console.error('Frame processing error:', err); }
  };

  // ── Camera init ─────────────────────────────────────────────────────────────
  const initializeLiveWebcamTracking = async () => {
    if (!libraryReady || !videoRef.current) return;
    try {
      setFeedback('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      activeStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      videoRef.current.onloadedmetadata = () => {
        if (canvasRef.current) {
          canvasRef.current.width  = videoRef.current.videoWidth  || 640;
          canvasRef.current.height = videoRef.current.videoHeight || 480;
        }
      };
      isActiveRef.current = true;
      setIsActive(true);
      setSessionTime(0);
      const pose = new window.Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
      pose.setOptions({ modelComplexity:1, smoothLandmarks:true, enableSegmentation:false, minDetectionConfidence:0.5, minTrackingConfidence:0.5 });
      pose.onResults((results) => { if (handlePoseResultsRef.current) handlePoseResultsRef.current(results); });
      poseEngineRef.current = pose;
      const cam = new window.Camera(videoRef.current, {
        onFrame: async () => { if (isActiveRef.current && poseEngineRef.current) await poseEngineRef.current.send({ image: videoRef.current }); },
        width: 640, height: 480,
      });
      await cam.start();
      cameraInstanceRef.current = cam;
      setFeedback('Camera live! Position your full body in frame.');
    } catch (err) {
      console.error('Camera init error:', err);
      if (err.name === 'NotAllowedError') setFeedback('Camera permission denied. Allow access in browser settings.');
      else if (err.name === 'NotFoundError') setFeedback('No camera found. Connect a webcam and try again.');
      else setFeedback(`Camera error: ${err.message}`);
    }
  };

  const terminateVisionPipeline = () => {
    isActiveRef.current = false;
    setIsActive(false);
    setFormScore(100);
    clearInterval(sessionTimerRef.current);
    if (cameraInstanceRef.current) { try { cameraInstanceRef.current.stop(); } catch (e) {} cameraInstanceRef.current = null; }
    if (poseEngineRef.current)     { try { poseEngineRef.current.close(); } catch (e) {} poseEngineRef.current = null; }
    if (activeStreamRef.current)   { activeStreamRef.current.getTracks().forEach(t => t.stop()); activeStreamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); }
    setFeedback('Camera stopped. Click Start to begin again.');
  };

  const resetTracker = () => {
    repCountRef.current = 0;
    currentSetRef.current = 1;
    setRepCount(0); setCurrentSet(1);
    setFormScore(100); setPostureStatus('good');
    setRepHistory([]);
    setSessionTime(0);
    setFeedback('Counters reset. Ready to go.');
  };

  const pct = Math.min(100, (repCount / targetReps) * 100);
  const meta = exerciseMeta[selectedExercise];

  return (
    <>
      <style>{`
        @keyframes ripple { to { transform: scale(4); opacity: 0; } }
        @keyframes slideUp { from { transform: translateY(8px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes flash  { 0%,100% { background: transparent; } 50% { background: rgba(255,215,0,0.12); } }
        @keyframes scanline { 0%,100% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        .rep-flash { animation: flash 0.35s ease; }
        .slide-up  { animation: slideUp 0.3s ease; }
        .step-btn:hover { transform: scale(1.15) !important; }
        .step-btn:active { transform: scale(0.92) !important; }
      `}</style>

      <div style={{ padding:'40px 40px 60px', maxWidth:'1280px', margin:'0 auto', fontFamily:'system-ui, -apple-system, sans-serif' }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'32px' }}>
          <button
            onClick={handleSafeExitNavigation}
            style={{
              display:'inline-flex', alignItems:'center', gap:'6px',
              background:'transparent', border:'none', cursor:'pointer',
              color:'#555', fontSize:'10px', fontWeight:800,
              letterSpacing:'0.12em', textTransform:'uppercase', padding:'0',
              transition:'color 0.2s, gap 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color='#FFD700'; e.currentTarget.style.gap='10px'; }}
            onMouseLeave={e => { e.currentTarget.style.color='#555'; e.currentTarget.style.gap='6px'; }}
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </button>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'16px' }}>
            <div>
              <h2 style={{
                fontSize:'32px', fontWeight:900, letterSpacing:'-0.03em', color:'#fff', margin:'0 0 4px',
                textShadow:'0 0 40px rgba(255,215,0,0.15)',
              }}>
                AI Gym Trainer{' '}
                <span style={{ color:'#FFD700' }}>Computer Vision</span>
              </h2>
              <p style={{ fontSize:'11px', color:'#555', margin:0, letterSpacing:'0.04em' }}>
                Real-time pose tracking via MediaPipe — all processing runs locally in your browser.
              </p>
            </div>

            <div style={{
              display:'flex', alignItems:'center', gap:'10px',
              background:'#111', border:'1px solid #222', borderRadius:'12px', padding:'10px 16px',
            }}>
              <PulseRing active={isActive} />
              <span style={{ fontFamily:'monospace', fontSize:'20px', fontWeight:900, color: isActive ? '#fff' : '#444', letterSpacing:'0.08em' }}>
                {fmtTime(sessionTime)}
              </span>
              <span style={{ fontSize:'9px', color:'#444', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:800 }}>session</span>
            </div>
          </div>
        </div>

        {/* ── Exercise selector ──────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'28px', flexWrap:'wrap' }}>
          {Object.entries(exerciseMeta).map(([key, m]) => (
            <ExercisePill
              key={key}
              label={m.name}
              icon={<span style={{ fontSize:'14px' }}>{m.icon}</span>}
              active={selectedExercise === key}
              onClick={() => { setSelectedExercise(key); resetTracker(); }}
            />
          ))}

          {/* Sets / Reps spinners */}
          <div style={{ marginLeft:'auto', display:'flex', gap:'12px', alignItems:'center' }}>
            {[['Sets', targetSets, setTargetSets], ['Reps', targetReps, setTargetReps]].map(([label, val, setter]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px', background:'#111', border:'1px solid #222', borderRadius:'10px', padding:'6px 14px' }}>
                <span style={{ fontSize:'9px', fontWeight:800, color:'#555', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
                <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
                  <button
                    className="step-btn"
                    onClick={() => setter(v => Math.max(1, v+1))}
                    style={{ background:'#1e1e1e', border:'1px solid #333', borderRadius:'4px', width:'20px', height:'16px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform 0.15s, background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#2a2a2a'}
                    onMouseLeave={e => e.currentTarget.style.background='#1e1e1e'}
                  >
                    <ChevronUp size={10} color="#888" />
                  </button>
                  <button
                    className="step-btn"
                    onClick={() => setter(v => Math.max(1, v-1))}
                    style={{ background:'#1e1e1e', border:'1px solid #333', borderRadius:'4px', width:'20px', height:'16px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform 0.15s, background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#2a2a2a'}
                    onMouseLeave={e => e.currentTarget.style.background='#1e1e1e'}
                  >
                    <ChevronDown size={10} color="#888" />
                  </button>
                </div>
                <span style={{ fontSize:'16px', fontWeight:900, color:'#FFD700', minWidth:'20px', textAlign:'center', fontVariantNumeric:'tabular-nums' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main grid ──────────────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:'24px', alignItems:'start' }}>

          {/* Camera column */}
          <div style={{
            background:'#0a0a0a', border:'1px solid #1e1e1e', borderRadius:'20px',
            overflow:'hidden', display:'flex', flexDirection:'column', minHeight:'560px',
            boxShadow:'0 0 60px rgba(0,0,0,0.6)',
          }}>

            {/* Status bar */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'14px 20px', borderBottom:'1px solid #151515',
              background:'linear-gradient(180deg,#0f0f0f 0%,transparent 100%)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <PulseRing active={isActive} />
                <span style={{ fontSize:'10px', fontWeight:800, color:'#555', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                  {isActive ? 'TRACKING LIVE' : 'CAMERA OFFLINE'}
                </span>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {isActive ? <Wifi size={12} color="#32CD32" /> : <WifiOff size={12} color="#555" />}
                <span style={{ fontSize:'9px', fontWeight:800, background:'#111', border:'1px solid #222', borderRadius:'6px', padding:'4px 10px', color:'#FFD700', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                  MEDIAPIPE CV
                </span>
              </div>
            </div>

            {/* Video / canvas */}
            <div style={{ flex:1, position:'relative', background:'#050505', minHeight:'420px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <video ref={videoRef} style={{ position:'absolute', width:'100%', height:'100%', opacity:0, pointerEvents:'none', objectFit:'cover' }} playsInline muted />
              <canvas ref={canvasRef} width={640} height={480}
                style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover', display: isActive ? 'block' : 'none' }}
              />

              {isActive && (
                <div style={{
                  position:'absolute', inset:0, pointerEvents:'none', zIndex:5,
                  background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
                }} />
              )}

              {!isActive && (
                <div style={{ textAlign:'center', padding:'32px', zIndex:10 }} className="slide-up">
                  <div style={{
                    width:'72px', height:'72px', borderRadius:'18px',
                    background:'#111', border:'1px solid #222',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    color: '#FFD700', boxShadow: '0 0 30px rgba(255,215,0,0.05)'
                  }}>
                    <Camera size={28} />
                  </div>
                  <h3 style={{ fontSize:'16px', fontWeight:800, color:'#fff', margin:'0 0 6px' }}>Vision Framework Disengaged</h3>
                  <p style={{ fontSize:'11px', color:'#444', maxWidth:'280px', margin:'0 auto 20px', lineHeight:1.5 }}>
                    Initialize your optical capture stream to sync with localized telemetry analysis.
                  </p>
                  <RippleBtn
                    onClick={initializeLiveWebcamTracking}
                    disabled={!libraryReady}
                    style={{
                      background: '#FFD700', color: '#000', border: 'none',
                      padding: '12px 28px', borderRadius: '10px', fontSize: '11px',
                      fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'opacity 0.2s'
                    }}
                  >
                    Start Session Stream
                  </RippleBtn>
                </div>
              )}
            </div>

            {/* Real-time Feedback HUD Banner */}
            <div style={{
              padding: '16px 20px', background: '#0e0e0e', borderTop: '1px solid #161616',
              display: 'flex', alignItems: 'center', gap: '12px'
            }} className={lastRepFlash ? 'rep-flash' : ''}>
              {postureStatus === 'good' ? <CheckCircle2 size={16} color="#32CD32" /> : <AlertCircle size={16} color="#FF3131" />}
              <p style={{
                margin: 0, fontSize: '11px', fontWeight: 600,
                color: postureStatus === 'good' ? '#888' : '#FF3131', lineHeight: 1.4
              }}>
                {feedback}
              </p>
            </div>
          </div>

          {/* Right Metrics Panel Column */}
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            
            {/* Main HUD Counter Display */}
            <div style={{
              background: '#141414', border: '1px solid #222', borderRadius: '20px',
              padding: '30px', position: 'relative', overflow: 'hidden'
            }} className={lastRepFlash ? 'rep-flash' : ''}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '24px' }}>
                <div>
                  <p style={{ fontSize: '9px', fontWeight: 800, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>Current Performance</p>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>{meta.name}</h3>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'#1c1c1c', padding:'6px 12px', borderRadius:'8px', border:'1px solid #262626' }}>
                  <Layers size={12} color="#FFD700" />
                  <span style={{ fontSize:'11px', fontWeight:800, color:'#FFD700' }}>SET {currentSet} / {targetSets}</span>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'baseline', gap:'12px', margin:'20px 0 10px' }}>
                <span style={{ fontSize: '90px', fontWeight: 900, color: '#fff', lineHeight: 0.8, letterSpacing: '-0.04em' }}>
                  <AnimatedNumber value={repCount} />
                </span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#333' }}>/ {targetReps} Reps</span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: '#222', borderRadius: '99px', overflow: 'hidden', marginTop: '20px' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', background: '#FFD700', borderRadius: '99px',
                  transition: 'width 0.3s cubic-bezier(.4,2,.6,1)'
                }} />
              </div>

              <RepHistoryBar history={repHistory} />
            </div>

            {/* Form Accuracy Index Component */}
            <FormRing score={formScore} />

            {/* Metrics Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <StatCard label="Energy Expenditure" icon={<Flame size={14} />} value={totalCaloriesBurntRef.current} unit="Kilocalories" color="#FF4500" accent />
              <StatCard label="Active Duration" icon={<Clock size={14} />} value={fmtTime(sessionTime)} unit="Minutes Run" color="#00BFFF" />
              <StatCard label="Pillars Target" icon={<Target size={14} />} value={targetReps * targetSets} unit="Total Reps Req" color="#9370DB" />
              <StatCard label="Kinematic Tips" icon={<Eye size={14} />} value={meta.tip1} unit={meta.tip2} color="#FFD700" />
            </div>

            {/* Session Action Control Deck */}
            {isActive && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }} className="slide-up">
                <RippleBtn
                  onClick={terminateVisionPipeline}
                  style={{
                    background: 'rgba(255,49,49,0.1)', color: '#FF3131', border: '1px solid rgba(255,49,49,0.2)',
                    padding: '14px', borderRadius: '14px', fontSize: '11px', fontWeight: 800,
                    letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Square size={12} fill="#FF3131" /> Stop Tracking
                </RippleBtn>

                <RippleBtn
                  onClick={resetTracker}
                  style={{
                    background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a',
                    padding: '14px', borderRadius: '14px', fontSize: '11px', fontWeight: 800,
                    letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <RotateCcw size={12} /> Reset Counters
                </RippleBtn>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}