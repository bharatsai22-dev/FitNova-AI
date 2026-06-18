import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VirtualBuddy from './components/VirtualBuddy';
import AIDietitian from './components/AIDietitian';
import AIGymTrainer from './components/AIGymTrainer';
import HabitMLTracker from './components/HabitMLTracker'; 
import GymRecommender from './components/GymRecommender'; // Integrated Target Component Vector
import SmartGymIoTHub from './components/SmartGymIoTHub'; // New Real-Time IoT Stream Hub Component
import PosePerformanceAnalyzer from './components/PosePerformanceAnalyzer';
import HelpNotes from './components/HelpNotes'; // Integrated Operational Documentation Module
import LoginView from './components/LoginView'; // Phase 1: New Big Login Form Terminal
import AdminFeedback from './components/AdminFeedback'; // ── New Admin Support Hub Import

// Phase 1: Authentication & Session Persistence Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut, ShieldCheck } from 'lucide-react';

// Imported to prevent the Sidebar OAuth Provider crash
import { GoogleOAuthProvider } from '@react-oauth/google';

// ─── Pure inference function — called once, result shared everywhere ───────────
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

// ─── SUBSYSTEM ROUTER CONTENT ENGINE ─────────────────────────────────────────
function AppContent() {
  // Synchronized state initialization from localStorage to maintain navigation position across hot-reloads
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('fitnova_current_view') || 'dashboard';
  });
  
  // Phase 1: Extract authenticated payload states directly from our Cloud Context bubble
  const { currentUser, logoutSession, isAdmin } = useAuth();

  // Centralized performance analytics lifted to sync tracking across all views dynamically
  const [dailyStats, setDailyStats] = useState({
    calories: 229,
    timeSpent: 45,
    streak: 7,
    startDate: '2026-06-01'
  });

  // ── CENTRALIZED SINGLE SOURCE OF TRUTH: ML Input State ───────────────────
  const [sleepHours,         setSleepHours]         = useState(7.5);
  const [workoutTimePrev,    setWorkoutTimePrev]    = useState(45);
  const [motivationScore,    setMotivationScore]    = useState(7);
  const [previousAttendance, setPreviousAttendance]  = useState(85);
  const [committedAdjustments, setCommittedAdjustments] = useState([]);

  // ── SYNCHRONIZED RUNTIME INFERENCE PASS ──────────────────────────────────
  const mlResult = computeMLInference({ sleepHours, workoutTimePrev, motivationScore, previousAttendance });
  const { skipProbability, riskLevel, featureWeights, aiNudge, adaptiveSchedule } = mlResult;

  // 🆕 UPDATED: ASYNCHRONOUS CLOUD DATA PIPELINE BRIDGE FUNCTION 
  // This automatically captures completed workout results from the Trainer and streams it directly to your cloud API database endpoint!
  const handleSyncTrainerToAnalyzer = async (completedWorkout) => {
    try {
      // 1. Safety Check: Verify that an authenticated user session is active
      if (!contextualUserPayload.id) {
        console.warn("[Data Sync Hub] Save aborted: No active user authentication token found.");
        return;
      }

      // 2. Format incoming tracking variables to match cloud analytics database layout schemas
      const newLogEntry = {
        userId: contextualUserPayload.id,            // Link record permanently to user's database entry
        userEmail: contextualUserPayload.email,       // Contextual identity lookup index
        date: new Date().toISOString().split('T')[0], // e.g., "2026-06-16"
        exercise: (completedWorkout?.exerciseType || 'SQUAT').toUpperCase(),
        reps: completedWorkout?.totalRepsCount || 0,
        score: completedWorkout?.averageFormScore || 85,
        form: completedWorkout?.averageFormScore || 85, 
        rom: completedWorkout?.rangeOfMotion || 88,        
        stability: completedWorkout?.stabilityScore || 90,  
        smoothness: completedWorkout?.smoothnessScore || 87
      };

      console.log("[Data Sync Hub] Initiating cloud stream transmission for payload...", newLogEntry);

      // 3. Dispatch the network payload across the bridge to your database server endpoint
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLogEntry)
      });

      // 4. Validate response status state
      if (!response.ok) {
        throw new Error(`Server responded with status code: ${response.status}`);
      }

      const serverData = await response.json();
      console.log("[Data Sync Hub] Successfully synchronized live workout data with cloud database backend matrix.", serverData);

    } catch (error) {
      console.error("[Data Sync Hub Error] Target cloud stream network pipeline write collapsed: ", error);
      
      // Fallback Safeguard: If the network or cloud infrastructure fails, cache values locally to secure continuity
      console.log("[Data Sync Hub] Engaging local storage fallback cache protocol.");
      try {
        const existingHistory = JSON.parse(localStorage.getItem('AIGym_Performance_Analytics') || '[]');
        const fallbackEntry = {
          date: new Date().toISOString().split('T')[0],
          exercise: (completedWorkout?.exerciseType || 'SQUAT').toUpperCase(),
          reps: completedWorkout?.totalRepsCount || 0,
          score: completedWorkout?.averageFormScore || 85,
          form: completedWorkout?.averageFormScore || 85, 
          rom: completedWorkout?.rangeOfMotion || 88,        
          stability: completedWorkout?.stabilityScore || 90,  
          smoothness: completedWorkout?.smoothnessScore || 87
        };
        const filteredHistory = existingHistory.filter(
          row => !(row.date === fallbackEntry.date && row.exercise === fallbackEntry.exercise)
        );
        localStorage.setItem('AIGym_Performance_Analytics', JSON.stringify([...filteredHistory, fallbackEntry]));
      } catch (fallbackError) {
        console.error("Local storage fallback protocol failed: ", fallbackError);
      }
    }
  };

  // LIVE ROUTE MONITOR & PERSISTENCE INTEGRATION: Syncs dynamic navigation tokens directly into secure browser state storage
  useEffect(() => {
    console.log(`[FitNova Router Routing Switch] Active View State: "${currentView}"`);
    localStorage.setItem('fitnova_current_view', currentView);
  }, [currentView]);

  // Automatic Daily Refresh Protocol (resets values if calendar lifecycle boundaries cross midnight)
  useEffect(() => {
    const lastAccessDate = localStorage.getItem('fitnova_last_access');
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (lastAccessDate && lastAccessDate !== todayStr) {
      // Midnight crossover detected: archive session matrices and clear metrics
      setDailyStats(prev => ({
        ...prev,
        calories: 0,
        timeSpent: 0,
        streak: prev.streak + 1 // Increment consistency validation matrix
      }));
    }
    localStorage.setItem('fitnova_last_access', todayStr);
  }, []);

  // ─── ARCHITECTURAL IDENTITY INTERCEPTOR GATEWALL ──────────────────────────
  if (!currentUser) {
    return <LoginView onLoginSuccess={() => setCurrentView('dashboard')} />;
  }

  // Construct standard mapping footprint for child views tracking user identity properties
  const contextualUserPayload = {
    isLoggedIn: true,
    id: currentUser.uid,
    name: currentUser.displayName || 'Authorized Athlete',
    email: currentUser.email,
    avatar: currentUser.photoURL || '',
    isAdmin: isAdmin
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#FFFFFF] flex font-sans antialiased selection:bg-[#FFD700] selection:text-[#1C1C1C]">
      
      {/* Structural Identity HUD Panel Injection */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-stone-950/80 backdrop-blur border border-stone-850 px-3 py-1.5 rounded-xl shadow-xl">
        {contextualUserPayload.avatar && (
          <img src={contextualUserPayload.avatar} alt="Identity Frame" className="w-5 h-5 rounded-full border border-stone-800" />
        )}
        <span className="text-[10px] font-mono tracking-tight text-stone-400 max-w-[100px] truncate">
          {contextualUserPayload.name.split(' ')[0]}
        </span>
        {isAdmin && (
          <span className="text-[8px] bg-amber-500 text-black font-black px-1 rounded uppercase tracking-wider flex items-center gap-0.5">
            <ShieldCheck size={8} /> Admin
          </span>
        )}
        <button 
          onClick={logoutSession}
          className="ml-1 p-1 text-stone-500 hover:text-red-400 transition-colors"
          title="Terminate Session"
        >
          <LogOut size={12} />
        </button>
      </div>

      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        user={contextualUserPayload}
        setUser={() => console.warn("Notice: Mutation rejected. Profile state is bound to Cloud Auth streams.")}
      />
      
      <main className="flex-1 ml-64 min-h-screen bg-[#1C1C1C]">
        {/* Workspace Multi-Router Engine */}
        {currentView === 'dashboard' && (
          <Dashboard 
            currentView={currentView}
            setCurrentView={setCurrentView} 
            userId={contextualUserPayload.id}
            dailyStats={dailyStats}
            setDailyStats={setDailyStats}
            
            sleepHours={sleepHours}                       setSleepHours={setSleepHours}
            workoutTimePrev={workoutTimePrev}             setWorkoutTimePrev={setWorkoutTimePrev}
            motivationScore={motivationScore}             setMotivationScore={setMotivationScore}
            previousAttendance={previousAttendance}       setPreviousAttendance={setPreviousAttendance}
            committedAdjustments={committedAdjustments}   setCommittedAdjustments={setCommittedAdjustments}
          />
        )}

        {currentView === 'buddy' && (
          <VirtualBuddy 
            userId={contextualUserPayload.id} 
            onNavigateToDietitian={() => setCurrentView('dietitian')} 
          />
        )}

        {/* AI DIETITIAN VIEW INTERCEPTOR MODULE */}
        {currentView === 'dietitian' && (
          <AIDietitian 
            userId={contextualUserPayload.id} 
            onBackToDashboard={() => setCurrentView('dashboard')} 
          />
        )}
        
        {/* AI GYM TRAINER REAL TIME COMPUTER VISION CORE MODULE */}
        {currentView === 'trainer' && (
          <AIGymTrainer 
            userId={contextualUserPayload.id} 
            dailyStats={dailyStats}
            setDailyStats={setDailyStats}
            onBackToDashboard={() => setCurrentView('dashboard')} 
            onWorkoutComplete={handleSyncTrainerToAnalyzer}
          />
        )}

        {/* HABIT AND BEHAVIORAL ML TRACKER MODULE ENGINE */}
        {currentView === 'habit_ml' && (
          <HabitMLTracker 
            userId={contextualUserPayload.id}
            dailyStats={dailyStats}
            setDailyStats={setDailyStats}
            setCommittedAdjustments={setCommittedAdjustments}
            onBackToDashboard={() => setCurrentView('dashboard')}

            // Direct synchronization pipeline injection
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
        )}
        
        {/* GYM RECOMMENDER ROUTE TARGET BLOCK */}
        {currentView === 'gym_recommender' && (
          <GymRecommender 
            userId={contextualUserPayload.id}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {/* REAL-TIME SMART GYM IOT HUB ROUTE BLOCK */}
        {(currentView === 'iot' || currentView === 'iot_system' || currentView === 'smart_gym_iot_hub') && (
          <SmartGymIoTHub 
            userId={contextualUserPayload.id}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {/* AI POSE AND MOVEMENT BIO-MECHANICS ANALYZER */}
        {currentView === 'analyzer' && (
          <PosePerformanceAnalyzer 
            user={contextualUserPayload}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {/* INTERACTIVE OPERATIONAL NOTES SECTION PROTOCOL */}
        {currentView === 'notes' && (
          <HelpNotes 
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {/* ── ADMIN/SUPPORT FEEDBACK EMAIL ROUTE MATRIX BLOCK */}
        {currentView === 'admin_feedback' && (
          <AdminFeedback 
            userId={contextualUserPayload.id}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {/* Fallback Safeguard for components we haven't built out completely yet */}
        {currentView !== 'dashboard' && 
         currentView !== 'buddy' && 
         currentView !== 'dietitian' && 
         currentView !== 'trainer' && 
         currentView !== 'habit_ml' && 
         currentView !== 'gym_recommender' && 
         currentView !== 'iot' && 
         currentView !== 'iot_system' && 
         currentView !== 'smart_gym_iot_hub' && 
         currentView !== 'analyzer' && 
         currentView !== 'notes' && 
         currentView !== 'admin_feedback' && (
          <div className="p-12 space-y-6">
            <div className="border-b border-stone-800 pb-4">
              <h2 className="text-3xl font-black text-[#FFD700] uppercase tracking-widest">
                {currentView.replace('_', ' ').replace('-', ' ')} System
              </h2>
              <p className="text-stone-400 text-sm mt-1">FitNova Advanced Intelligence Module Architecture Active.</p>
            </div>
            
            <div className="bg-[#1C1C1C] p-8 rounded-2xl border border-stone-800 min-h-[300px] flex flex-col justify-between">
              <p className="text-stone-300 font-medium">Initializing hardware acceleration and tracking matrices...</p>
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="self-start flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#FF3131] to-[#b31e1e] hover:brightness-110 text-white transition-all rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF3131]/10"
              >
                &larr; Escape to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── GLOBAL APPLICATION WRAPPER ENTRY NODE ──────────────────────────────────
export default function App() {
  return (
    <GoogleOAuthProvider clientId="355517774441-dummyclientid.apps.googleusercontent.com">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}