import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import VirtualBuddy from './VirtualBuddy';
import AIDietitian from './AIDietitian';
import HabitMLTracker from './HabitMLTracker';
import GymRecommender from './GymRecommender'; 
import SmartGymIoTHub from './SmartGymIoTHub'; 
import { 
  Dumbbell, 
  Utensils, 
  MessageSquare, 
  CalendarDays, 
  Activity, 
  MapPin, 
  BarChart3, 
  Award, 
  ShieldCheck,
  Cpu,
  Flame,
  Clock,
  Zap,
  Radio,
  ChevronRight,
  Crosshair,
  CheckCircle2,
  XCircle,
  Mail,
  Send
} from 'lucide-react';

// ─── PURE INFERENCE ENGINE — Mathematical Modeling for Behavior Prediction ───
function computeMLInference({ sleepHours, workoutTimePrev, motivationScore, previousAttendance }) {
  const sleepDeficit      = sleepHours < 7       ? (7   - sleepHours)       * 1.5
                          : sleepHours > 9       ? (sleepHours - 9)         * 0.5
                          : 0;
  const motivationDeficit = (10 - motivationScore)   * 0.4;
  const attendanceDeficit = (100 - previousAttendance) * 0.03;
  const fatigueFactor     = workoutTimePrev > 75  ? (workoutTimePrev - 75)  * 0.02 : 0;

  const intercept   = -1.8;
  const wSleep      = 1.2;
  const wMotivation = 1.5;
  const wAttendance = 0.8;
  const wFatigue    = 0.9;

  const z = intercept
    + wSleep      * sleepDeficit
    + wMotivation * motivationDeficit
    + wAttendance * attendanceDeficit
    + wFatigue    * fatigueFactor;

  const skipProbability = Math.round((1 / (1 + Math.exp(-z))) * 100) || 0;

  let riskLevel = 'Low';
  if      (skipProbability > 75) riskLevel = 'Critical';
  else if (skipProbability > 50) riskLevel = 'High';
  else if (skipProbability > 25) riskLevel = 'Medium';

  const featureWeights = {
    sleep:     parseFloat((wSleep      * sleepDeficit).toFixed(2)),
    motivation: parseFloat((wMotivation * motivationDeficit).toFixed(2)),
    attendance: parseFloat((wAttendance * attendanceDeficit).toFixed(2)),
    fatigue:    parseFloat((wFatigue    * fatigueFactor).toFixed(2)),
  };

  let aiNudge = '';
  let adaptiveSchedule = [];

  if (riskLevel === 'Critical' || riskLevel === 'High') {
    if (sleepHours < 6) {
      aiNudge = "🚨 Central Nervous System Exhaustion Risk: Your sleep matrix is critically low. Your brain is signaling a workout drop. Let's outsmart the skip tendency before it occurs.";
      adaptiveSchedule = [
        { id: 1, type: 'Scale Down',     title: 'Neural Reset Strategy',         detail: "Convert today's target routine to a 20-min low-intensity mobility/flow session." },
        { id: 2, type: 'Schedule Shift', title: 'Circadian Window Realignment', detail: 'Lock down your gym window 2 hours later to allow an optimal recovery nap.' },
      ];
    } else if (motivationScore <= 4) {
      aiNudge = "⚡ Behavioral Momentum Alert: System motivation readings are low. Don't look at the complete stack today—just focus on crossing the threshold. Show up for exactly 5 minutes.";
      adaptiveSchedule = [
        { id: 1, type: 'Gamification Trigger', title: '5-Min Threshold Compact',  detail: 'Commit only to your core warm-up sets. Exit permission granted if momentum fails.' },
        { id: 2, type: 'Environment Swap',     title: 'Audio Stimulation Anchor', detail: 'Inject high-tempo auditory tracking list. Move your session to an outdoor park footprint.' },
      ];
    } else {
      aiNudge = "📉 Habit Friction Detected: Cumulative fatigue markers indicate a high skip probability. Let's drop volume to protect your target streak.";
      adaptiveSchedule = [
        { id: 1, type: 'Volume Half-Life', title: 'De-load Vector Pass', detail: 'Cut all exercise operational sets by 50% while holding baseline resistance values.' },
      ];
    }
  } else if (riskLevel === 'Medium') {
    aiNudge = "🎯 Optimization Window Open: Minor behavioral friction detected. A gentle friction reduction modification will lock today's attendance vector in place.";
    adaptiveSchedule = [
      { id: 1, type: 'Optimization', title: 'Hyper-Focus Isolation', detail: 'Strip accessory movements from the queue. Execute compound targets only.' },
    ];
  } else {
    aiNudge = "🟢 Habit Kinetic Loop Stabilized: Your behavioral metrics are in perfect alignment. Probability models indicate maximum compliance velocity.";
    adaptiveSchedule = [
      { id: 1, type: 'Maintain', title: 'Full Trajectory Retention', detail: 'No alterations required. Keep current target volumes and resistance arrays unchanged.' },
    ];
  }

  return { skipProbability, riskLevel, featureWeights, aiNudge, adaptiveSchedule };
}

// ─── HUD DECORATION: corner bracket frame ───
const CornerBrackets = ({ color = '#FFD700', opacity = 'opacity-50' }) => (
  <>
    <span className={`absolute top-2 left-2 w-2.5 h-2.5 border-t border-l ${opacity} pointer-events-none`} style={{ borderColor: color }} />
    <span className={`absolute top-2 right-2 w-2.5 h-2.5 border-t border-r ${opacity} pointer-events-none`} style={{ borderColor: color }} />
    <span className={`absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l ${opacity} pointer-events-none`} style={{ borderColor: color }} />
    <span className={`absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r ${opacity} pointer-events-none`} style={{ borderColor: color }} />
  </>
);

export default function Dashboard({ 
  currentView, 
  setCurrentView, 
  userId, 
  dailyStats,
  sleepHours,
  setSleepHours,
  workoutTimePrev,
  setWorkoutTimePrev,
  motivationScore,
  setMotivationScore,
  previousAttendance,
  setPreviousAttendance,
  committedAdjustments,
  setCommittedAdjustments
}) {
  const [date, setDate] = useState(new Date());

  // ─── PERSISTENT TIMESTAMP TIME ENGINE (Survives Refreshes, Resets On Tab Close) ───
  const [sessionSeconds, setSessionSeconds] = useState(() => {
    let startTime = sessionStorage.getItem('sessionStartTime');
    if (!startTime) {
      startTime = Date.now().toString();
      sessionStorage.setItem('sessionStartTime', startTime);
    }
    return Math.floor((Date.now() - Number(startTime)) / 1000);
  });

  const [programStartDate, setProgramStartDate] = useState(() => {
    return dailyStats?.startDate || '2026-06-01';
  });
  const [currentStreak, setCurrentStreak] = useState(() => {
    return dailyStats?.streak ?? 7;
  });
  const [attendanceLogs, setAttendanceLogs] = useState({});

  // ─── ADMIN FEEDBACK TERMINAL STATES ───
  const [feedbackType, setFeedbackType] = useState('recommendation');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isDispatched, setIsDispatched] = useState(false);

  // Absolute Delta Calculation Hook (Prevents throttling drift and preserves state)
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const startTime = sessionStorage.getItem('sessionStartTime');
      if (startTime) {
        setSessionSeconds(Math.floor((Date.now() - Number(startTime)) / 1000));
      }
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Format Elapsed Stopwatch Stream (MM:SS or HH:MM:SS)
  const formatSessionClock = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Log Attendance Action Handler
  const handleLogAttendance = (status) => {
    const key = date.toDateString();
    setAttendanceLogs((prev) => ({ ...prev, [key]: status }));

    if (status === 'missed') {
      setCurrentStreak(0); // Break streak calculation immediately on a missed target
    } else if (status === 'attended') {
      setCurrentStreak((prev) => prev + 1);
    }
  };

  // Set selected calendar date as permanent journey starting point
  const handleSetStartDate = () => {
    const formatted = date.toISOString().split('T')[0];
    setProgramStartDate(formatted);
  };

  // Direct Communication Tunnel Dispatch Logic
  const handleDispatchFeedback = (e) => {
    e.preventDefault();
    if (!feedbackSubject || !feedbackMessage) return;

    const adminEmail = "admin@bvsinc.com"; 
    const emailSubject = encodeURIComponent(`[Platform ${feedbackType.toUpperCase()}] ${feedbackSubject}`);
    const emailBody = encodeURIComponent(
      `SYSTEM USER CONTEXT ID: ${userId || 'ANONYMOUS_RUNNER'}\n` +
      `CLASSIFICATION VECTOR: ${feedbackType.toUpperCase()}\n` +
      `TIMESTAMP: ${new Date().toISOString()}\n\n` +
      `LOGGED MESSAGE:\n${feedbackMessage}`
    );

    window.location.href = `mailto:${adminEmail}?subject=${emailSubject}&body=${emailBody}`;
    
    setIsDispatched(true);
    setTimeout(() => {
      setIsDispatched(false);
      setFeedbackSubject('');
      setFeedbackMessage('');
    }, 4000);
  };

  // ── RUNTIME INFERENCE PASS — fed from shared sync props
  const mlResult = computeMLInference({ sleepHours, workoutTimePrev, motivationScore, previousAttendance });
  const { skipProbability, riskLevel, featureWeights, aiNudge, adaptiveSchedule } = mlResult;

  // ── TELEMETRY CONTEXTS ───────────────────────────────────────────────────────
  const stats = {
    calories:  dailyStats?.calories  ?? 229,
    timeSpent: formatSessionClock(sessionSeconds), // Wired to the absolute live tracking clock engine
    streak:    currentStreak,
    startDate: programStartDate,
  };

  const selectedDay   = (date instanceof Date ? date : new Date()).getDay();
  const isWeekend     = selectedDay === 0 || selectedDay === 6;
  const formattedDate = (date instanceof Date ? date : new Date()).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const modulesList = [
    { id: 'trainer',         name: 'AI Gym Trainer',      desc: 'Camera posture & rep counter.',       icon: Dumbbell      },
    { id: 'dietitian',       name: 'AI Dietician',        desc: 'BMI-driven structural meal plans.',   icon: Utensils      },
    { id: 'buddy',           name: 'Virtual Gym Buddy',   desc: 'Voice, image, and file assistant.',   icon: MessageSquare },
    { id: 'habit_ml',        name: 'Habit & ML Tracker',  desc: 'Predictive behavioral algorithms.',   icon: CalendarDays  },
    { id: 'iot',             name: 'Smart Gym IoT Hub',   desc: 'Live BLE health streaming.',          icon: Activity      },
    { id: 'gym_recommender', name: 'Gym Recommender',     desc: 'Geo-located gym sorting maps.',       icon: MapPin        },
    { id: 'admin_feedback',  name: 'Admin Support Hub',   desc: 'Direct dispatch to website creator.', icon: Mail          },
    { id: 'analyzer',        name: 'Pose Analyzer',       desc: 'Motion execution score generator.',   icon: BarChart3     },
  ];

  const skipColor =
    skipProbability > 75 ? 'text-[#FF3131]' :
    skipProbability > 45 ? 'text-[#FFD700]' :
                           'text-[#32CD32]';

  const skipStroke =
    skipProbability > 75 ? '#FF3131' :
    skipProbability > 45 ? '#FFD700' :
                           '#32CD32';

  const gaugeRadius = 30;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (gaugeCircumference * skipProbability) / 100;

  const renderModulePlaceholder = (title, description) => (
    <div className="relative w-full min-h-[400px] bg-[#151515] border border-stone-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fadeIn overflow-hidden">
      <CornerBrackets />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="relative w-16 h-16 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center text-[#FFD700] mb-4">
        <span className="absolute inset-0 rounded-full border border-[#FFD700]/40 animate-ping" />
        <Cpu size={28} />
      </div>
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#FFD700]/70 mb-2">// Initializing Module</p>
      <h3 className="text-lg font-black uppercase tracking-wider text-white">{title}</h3>
      <p className="text-stone-400 text-xs mt-2 max-w-md">{description}</p>
      <button 
        onClick={() => setCurrentView('dashboard')}
        className="mt-6 px-5 py-2.5 bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-[#1C1C1C] text-xs font-black uppercase tracking-wider rounded-xl hover:brightness-110 hover:shadow-[0_0_25px_rgba(255,215,0,0.35)] transition-all shadow-lg"
      >
        Return to Core Suite
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-white relative overflow-hidden">
      <style>{`
        @keyframes scanline { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
        @keyframes floatSlow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-16px); } }
        @keyframes glowPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .scan-line { animation: scanline 4s linear infinite; }
        .float-slow { animation: floatSlow 9s ease-in-out infinite; }
        .glow-pulse { animation: glowPulse 2.2s ease-in-out infinite; }
        .luxury-calendar-wrapper .react-calendar { border-radius: 0.75rem; font-family: inherit; width: 100%; border: none; background: white; p: 4px; }
        .luxury-calendar-wrapper .react-calendar__tile--active { background: #1C1C1C !important; color: #FFD700 !important; border-radius: 0.5rem; }
        .luxury-calendar-wrapper .react-calendar__tile--now { background: rgba(255,215,0,0.12) !important; border-radius: 0.5rem; }
      `}</style>

      <div
        className="absolute top-0 left-0 w-full pointer-events-none z-0"
        style={{
          height: '45vh',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.12), #0C0C0C), url('/gym-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none z-0 float-slow" />
      <div className="absolute top-1/2 -left-40 w-[26rem] h-[26rem] bg-[#FF3131]/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="p-10 max-w-7xl mx-auto space-y-10 relative z-10">

        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center border-b border-stone-800/60 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Radio size={11} className="text-[#FFD700] glow-pulse" />
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-stone-500">System Online // Live Telemetry Feed</p>
            </div>
            <h2 className="text-4xl font-black tracking-tight uppercase">
              Command Suite <span className="text-[#FFD700]">V1</span>
            </h2>
            <div className="relative w-40 h-[2px] mt-3 overflow-hidden rounded-full bg-stone-800/80">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent scan-line" />
            </div>
            <p className="text-stone-300 mt-3 text-sm font-medium tracking-wide">
              Welcome back — ignite the session. Dominate today.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-[#FFD700]/20 border border-[#FFD700]/50 px-4 py-2 rounded-xl text-xs font-black text-[#FFD700] uppercase tracking-widest backdrop-blur-md shadow-[0_0_25px_rgba(255,215,0,0.15)]">
            <Award size={14} className="glow-pulse" /> Elite Status — Active
          </div>
        </div>

        {/* ── TELEMETRY SYSTEM CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Energy Matrix */}
          <div className="relative bg-[#1C1C1C] bg-opacity-75 backdrop-blur-md p-6 rounded-2xl border border-stone-800/80 shadow-2xl overflow-hidden group hover:border-[#FF3131]/40 transition-colors">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF3131] to-transparent opacity-70" />
            <CornerBrackets color="#FF3131" opacity="opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-black tracking-widest text-stone-400 uppercase">Energy Expended</p>
              <div className="p-1.5 rounded-lg bg-[#FF3131]/10 border border-[#FF3131]/20 text-[#FF3131]">
                <Flame size={13} />
              </div>
            </div>
            <p className="text-4xl font-black mt-3 text-[#FF3131]">
              {stats.calories} <span className="text-sm font-bold text-stone-300 normal-case">KCAL</span>
            </p>
          </div>

          {/* Temporal Metrics — Integrated Live Session Clock */}
          <div className="relative bg-[#1C1C1C] bg-opacity-75 backdrop-blur-md p-6 rounded-2xl border border-stone-800/80 shadow-2xl overflow-hidden group hover:border-[#FFD700]/40 transition-colors">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] to-transparent opacity-70" />
            <CornerBrackets color="#FFD700" opacity="opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-black tracking-widest text-stone-400 uppercase">Session Active Time</p>
              <div className="p-1.5 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]">
                <Clock size={13} className="animate-pulse" />
              </div>
            </div>
            <p className="text-2xl font-black mt-4 text-[#FFD700] font-mono tracking-wide">
              {stats.timeSpent}
            </p>
          </div>

          {/* Habit Streak Index — Integrated Dynamic Calculator */}
          <div className="relative bg-[#1C1C1C] bg-opacity-75 backdrop-blur-md p-6 rounded-2xl border border-stone-800/80 shadow-2xl overflow-hidden group hover:border-stone-600 transition-colors">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#FF3131] to-transparent opacity-70" />
            <CornerBrackets color="#FFD700" opacity="opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-black tracking-widest text-stone-400 uppercase">Streak Consistency</p>
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#FFD700]">
                <Zap size={13} />
              </div>
            </div>
            <p className="text-4xl font-black mt-3 text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FF3131]">
              ⚡ {stats.streak} <span className="text-sm font-bold text-white uppercase ml-1">Cycles</span>
            </p>
          </div>

          {/* ML Skip Risk Factor */}
          <div
            className="relative bg-[#1C1C1C] bg-opacity-75 backdrop-blur-md p-6 rounded-2xl border border-stone-800/80 shadow-2xl flex flex-col justify-between overflow-hidden cursor-pointer hover:border-[#FFD700]/40 transition-colors group"
            onClick={() => setCurrentView('habit_ml')}
            title="Open Habit & ML Tracker"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-current to-transparent opacity-70" style={{ color: skipStroke }} />
            <CornerBrackets color={skipStroke} opacity="opacity-0 group-hover:opacity-50 transition-opacity" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black tracking-widest text-stone-400 uppercase">Skip Vulnerability Risk</p>
                <p className={`text-4xl font-black mt-2 font-mono transition-colors duration-300 ${skipColor}`}>
                  {skipProbability}%
                </p>
              </div>

              <div className="relative w-[60px] h-[60px] flex-shrink-0">
                <svg width="60" height="60" className="-rotate-90">
                  <circle cx="30" cy="30" r={gaugeRadius} stroke="#292524" strokeWidth="5" fill="none" />
                  <circle
                    cx="30" cy="30" r={gaugeRadius}
                    stroke={skipStroke} strokeWidth="5" fill="none"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <Crosshair size={14} className="absolute inset-0 m-auto" style={{ color: skipStroke }} />
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-stone-500">
                <span>Status: {riskLevel} Threat Level</span>
                <Activity
                  size={12}
                  className={skipProbability > 50 ? 'text-[#FF3131] animate-pulse' : 'text-[#32CD32]'}
                />
              </div>

              {committedAdjustments?.length > 0 && (
                <div className="bg-[#FFD700]/8 border border-[#FFD700]/20 rounded-lg p-2 space-y-1.5 mt-1">
                  <p className="text-[8px] font-mono font-black uppercase tracking-widest text-[#FFD700] flex items-center gap-1">
                    <ShieldCheck size={9} /> {committedAdjustments.length} Pipeline{committedAdjustments.length > 1 ? 's' : ''} Committed
                  </p>
                  {committedAdjustments.slice(0, 2).map((adj) => (
                    <div key={adj.id} className="flex items-center justify-between gap-1">
                      <span className="text-[8px] font-mono text-stone-400 truncate max-w-[120px]">{adj.title}</span>
                      <span className="text-[7px] font-mono text-stone-600 flex-shrink-0">{adj.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CENTRAL SUB-SUITE VIEWPORTS ──────────────────────────────────────── */}
        {currentView === 'buddy' ? (
          <div className="pt-2 animate-fadeIn">
            <VirtualBuddy userId={userId} />
          </div>

        ) : currentView === 'dietitian' ? (
          <div className="pt-2 animate-fadeIn">
            <AIDietitian userId={userId} onBackToDashboard={() => setCurrentView('dashboard')} />
          </div>

        ) : currentView === 'habit_ml' ? (
          <div className="pt-2 animate-fadeIn">
            <HabitMLTracker
              userId={userId}
              dailyStats={stats}
              setCommittedAdjustments={setCommittedAdjustments}
              onBackToDashboard={() => setCurrentView('dashboard')}
              sleepHours={sleepHours}                       setSleepHours={setSleepHours}
              workoutTimePrev={workoutTimePrev}             setWorkoutTimePrev={setWorkoutTimePrev}
              motivationScore={motivationScore}             setMotivationScore={setMotivationScore}
              previousAttendance={previousAttendance}       setPreviousAttendance={setPreviousAttendance}
              skipProbability={skipProbability}
              riskLevel={riskLevel}
              featureWeights={featureWeights}
              aiNudge={aiNudge}
              adaptiveSchedule={adaptiveSchedule}
            />
          </div>

        ) : currentView === 'gym_recommender' ? (
          <div className="pt-2 animate-fadeIn">
            <GymRecommender 
              userId={userId} 
              onBackToDashboard={() => setCurrentView('dashboard')} 
            />
          </div>

        ) : currentView === 'iot' || currentView === 'smart_gym_iot_hub' ? (
          <div className="pt-2 animate-fadeIn">
            <SmartGymIoTHub userId={userId} onBackToDashboard={() => setCurrentView('dashboard')} />
          </div>
        
        ) : currentView === 'trainer' ? (
          renderModulePlaceholder("AI Gym Trainer Suite", "Real-time structural computer-vision posture checking and automatic repetitive set calculation telemetry are initializing.")

        ) : currentView === 'analyzer' ? (
          renderModulePlaceholder("Pose Execution Analyzer", "High-frequency operational angular velocity analyzers and multi-pass kinetic efficiency matrix configurations are spinning up.")

        ) : currentView === 'admin_feedback' ? (
          <div className="pt-2 animate-fadeIn">
            <div className="relative bg-[#151515] bg-opacity-90 border border-stone-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl overflow-hidden">
              <CornerBrackets color="#FFD700" />
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg text-[#FFD700]">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Admin Support Gateway</h3>
                  <p className="text-[10px] font-mono text-[#FFD700]/80 uppercase tracking-widest">// Direct pipeline to system creator</p>
                </div>
              </div>
              <p className="text-stone-400 text-xs mb-6 leading-relaxed">
                Have structural feature recommendations, website bugs, or performance complaints? Submit your feedback down below. It will bypass intermediaries and dispatch directly to the creator's inbox.
              </p>

              {isDispatched ? (
                <div className="bg-[#32CD32]/10 border border-[#32CD32]/30 rounded-xl p-6 text-center space-y-2 animate-pulse">
                  <CheckCircle2 size={32} className="text-[#32CD32] mx-auto" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Transmission Initiated</h4>
                  <p className="text-[11px] text-stone-400">Opening system mail client. Packet routing directly to admin terminal...</p>
                </div>
              ) : (
                <form onSubmit={handleDispatchFeedback} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">Classification Tag</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['recommendation', 'complaint', 'bug'].map((type) => (
                        <button
                          key={type} type="button" onClick={() => setFeedbackType(type)}
                          className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                            feedbackType === type 
                              ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.25)]' 
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">Subject Stream</label>
                    <input
                      type="text" value={feedbackSubject} onChange={(e) => setFeedbackSubject(e.target.value)} required
                      placeholder="e.g., Requesting interactive weight progress graph logs"
                      className="w-full bg-stone-900 border border-stone-800 focus:border-[#FFD700]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">Detailed Log Content / Description</label>
                    <textarea
                      rows={5} value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} required
                      placeholder="Describe your operational bottleneck or recommendation vector in high fidelity..."
                      className="w-full bg-stone-900 border border-stone-800 focus:border-[#FFD700]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button" onClick={() => setCurrentView('dashboard')}
                      className="flex-1 py-2.5 border border-stone-800 text-stone-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FFD700] hover:brightness-110 text-[#1C1C1C] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                    >
                      <Send size={13} /> Dispatch to Mail
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        ) : (
          /* ── DEFAULT SUITE GRID ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-black tracking-widest text-stone-300 uppercase">Core Capabilities</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-stone-800 to-transparent" />
                <span className="text-[9px] font-mono text-stone-600 uppercase tracking-widest">{modulesList.length} Modules // Online</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {modulesList.map((mod, idx) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setCurrentView(mod.id)}
                      className="relative group bg-[#151515] bg-opacity-75 hover:bg-stone-900/90 transition-all duration-300 p-5 rounded-xl border border-stone-800/80 hover:border-[#FFD700]/40 text-left flex items-start gap-4 active:scale-[0.99] backdrop-blur-sm overflow-hidden"
                    >
                      <CornerBrackets opacity="opacity-0 group-hover:opacity-40 transition-opacity" />
                      <div className="p-3 bg-[#1C1C1C] rounded-xl text-[#FFD700] border border-stone-800 group-hover:border-[#FFD700] group-hover:bg-[#FFD700] group-hover:text-black group-hover:shadow-[0_0_20px_rgba(255,215,0,0.35)] transition-all duration-300">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-xs uppercase tracking-wider text-stone-200 group-hover:text-[#FFD700] transition-colors">
                            {mod.name}
                          </h4>
                          <span className="text-[8px] font-mono text-stone-600 flex-shrink-0">MOD-{String(idx + 1).padStart(2, '0')}</span>
                        </div>
                        <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">{mod.desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-stone-700 group-hover:text-[#FFD700] group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Telemetry Calendar Control Panel */}
            <div className="space-y-6">
              <div className="relative bg-[#151515] bg-opacity-75 backdrop-blur-md p-6 rounded-2xl border border-stone-800/80 shadow-2xl flex flex-col justify-between overflow-hidden">
                <CornerBrackets opacity="opacity-40" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays size={12} className="text-[#FFD700]" />
                    <h3 className="text-xs font-black tracking-widest text-stone-300 uppercase">Telemetry Calendar</h3>
                  </div>
                  <p className="text-[10px] font-mono text-stone-400 mb-4 uppercase">
                    Initialization Base: <span className="text-[#FFD700] font-bold">{stats.startDate}</span>
                  </p>
                  
                  <div className="luxury-calendar-wrapper text-slate-900 rounded-xl overflow-hidden p-1.5 bg-white shadow-inner ring-1 ring-[#FFD700]/20">
                    <Calendar onChange={setDate} value={date} className="border-none font-sans" />
                  </div>

                  {/* ── HUD LOGGING WORKSPACE INTERFACE ── */}
                  <div className="mt-4 p-3 bg-stone-900/90 border border-stone-800 rounded-xl space-y-3">
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">// Selected Date Controls</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleLogAttendance('attended')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#32CD32]/10 border border-[#32CD32]/30 rounded-lg text-[11px] font-black uppercase text-[#32CD32] hover:bg-[#32CD32]/20 transition-all"
                      >
                        <CheckCircle2 size={12} /> Log Attended
                      </button>
                      <button
                        onClick={() => handleLogAttendance('missed')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FF3131]/10 border border-[#FF3131]/30 rounded-lg text-[11px] font-black uppercase text-[#FF3131] hover:bg-[#FF3131]/20 transition-all"
                      >
                        <XCircle size={12} /> Log Missed
                      </button>
                    </div>
                    <button
                      onClick={handleSetStartDate}
                      className="w-full py-1.5 bg-stone-800 border border-stone-700 text-stone-300 hover:text-[#FFD700] hover:border-[#FFD700]/40 rounded-lg text-[10px] font-mono uppercase transition-all"
                    >
                      Set as Program Start Date
                    </button>

                    {attendanceLogs[date.toDateString()] && (
                      <p className="text-center text-[10px] font-mono text-stone-400">
                        Status for this slot: <span className={`font-bold uppercase ${attendanceLogs[date.toDateString()] === 'attended' ? 'text-[#32CD32]' : 'text-[#FF3131]'}`}>{attendanceLogs[date.toDateString()]}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-stone-800/60 text-center">
                    <div className={`relative p-4 rounded-xl border transition-all duration-500 flex flex-col items-center gap-1.5 overflow-hidden ${
                      isWeekend
                        ? 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]'
                        : 'bg-[#FF3131]/10 border-[#FF3131]/30 text-[#FF3131]'
                    }`}>
                      <div className={`absolute inset-x-0 top-0 h-px ${isWeekend ? 'bg-[#FFD700]/50' : 'bg-[#FF3131]/50'}`} />
                      <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">System Designation</span>
                      <p className="text-xs font-black uppercase tracking-wider">{formattedDate}</p>
                      <span className="text-[11px] font-black tracking-widest uppercase px-3 py-0.5 rounded bg-black/50 mt-1 border border-white/10">
                        {isWeekend ? 'Weekend Recovery' : 'Grind Phase Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}