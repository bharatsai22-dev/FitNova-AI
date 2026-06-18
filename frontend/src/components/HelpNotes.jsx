import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Dumbbell, Utensils, MessageSquare,
  CalendarDays, Activity, MapPin, BarChart3, ArrowLeft
} from 'lucide-react';

const GOLD = '#FFD700';
const GOLD_DIM = '#B8960C';

const guides = {
  overview: {
    title: "FitNova AI Overview",
    icon: BookOpen,
    subtitle: "Biometric Command Matrix",
    color: '#FFD700',
    accent: '#FFF5A0',
    steps: [
      { label: "Sync Engine", text: "FitNova synchronizes computer vision telemetry, lifestyle habits, and real-time IoT biometrics across all modules." },
      { label: "Navigation", text: "Use the persistent sidebar to instantly cycle between specific operational sectors." },
      { label: "Core Metrics", text: "Your core metrics — KCAL, Time, Streak — auto-refresh daily at 00:00 local time." },
      { label: "Data Security", text: "Every byte of your data is mathematically isolated in your personal secure storage vault." }
    ]
  },
  trainer: {
    title: "AI Gym Trainer",
    icon: Dumbbell,
    subtitle: "Edge Computer Vision Rep Counter",
    color: '#FF6B35',
    accent: '#FFB899',
    steps: [
      { label: "Select Routine", text: "Choose your target operational routine: Pushups, Squats, Pullups, or Custom Sets." },
      { label: "Camera Access", text: "Grant camera permissions when prompted by your browser or mobile interface." },
      { label: "Positioning", text: "Place your device 5–8 feet away, ensuring your full profile is visible in the frame." },
      { label: "Rep Tracking", text: "Begin your set. The MediaPipe matrix automatically tracks joint angles and logs reps on clean execution." }
    ]
  },
  dietitian: {
    title: "AI Dietician",
    icon: Utensils,
    subtitle: "Macronutrient Synthesis Engine",
    color: '#00D4AA',
    accent: '#A0FFE8',
    steps: [
      { label: "Your Metrics", text: "Input your exact physical data: Height (cm) and Weight (kg) to initialize the BMI calculator." },
      { label: "Set Goal", text: "Select your trajectory: Lean Mass Volumization, Aggressive Deficit, or Kinetic Maintenance." },
      { label: "Preferences", text: "Type custom parameters directly into the natural language stream (e.g., 'High-protein, lactose-free, vegetarian')." },
      { label: "Meal Blueprint", text: "The model returns a fully actionable macro blueprint parsed into localized grocery assets." }
    ]
  },
  buddy: {
    title: "Virtual Gym Buddy",
    icon: MessageSquare,
    subtitle: "Neural Training Assistant",
    color: '#A855F7',
    accent: '#DDB4FF',
    steps: [
      { label: "Text Queries", text: "Use the interactive console to ask training, recovery, or physiological questions." },
      { label: "Voice Mode", text: "Tap the microphone token to engage direct real-time voice synthesis streaming." },
      { label: "Image Upload", text: "Upload images of nutritional labels, injury areas, or workout sheets for immediate parsing." },
      { label: "Context Aware", text: "The assistant maintains system-wide context of your ML habit tracking and IoT telemetry scores." }
    ]
  },
  habit_ml: {
    title: "Habit & ML Tracker",
    icon: CalendarDays,
    subtitle: "Predictive Analytics Pipeline",
    color: '#F59E0B',
    accent: '#FDE68A',
    steps: [
      { label: "Daily Log", text: "Log behavioral factors daily: Sleep hours, exertion levels, and subjective motivation score." },
      { label: "Risk Inference", text: "The system runs a live inference pass to render your 'Skip Vulnerability Risk' as a percentage coefficient." },
      { label: "AI Nudge", text: "If threat indexes cross 50%, the pipeline injects an AI Nudge and creates adaptive schedule scaling." },
      { label: "Recalculate", text: "Commit to modifications to dynamically recalculate and flatten your skip curve." }
    ]
  },
  iot: {
    title: "Smart Gym IoT Hub",
    icon: Activity,
    subtitle: "Bluetooth Biometric Streaming",
    color: '#06B6D4',
    accent: '#A5F3FC',
    steps: [
      { label: "Enable BT", text: "Ensure your wearable, mobile sensor, or smart gym terminal has Bluetooth enabled." },
      { label: "Pair Device", text: "Click 'Scan for Devices' inside the IoT viewport to securely pair your hardware." },
      { label: "Live Streams", text: "During sets, Heart Rate, Pulse Oximetry, and BP streams are plotted in real-time." },
      { label: "CNS Alerts", text: "The hub warns of Central Nervous System fatigue and triggers optimized dynamic rest timers." }
    ]
  },
  recommender: {
    title: "Gym Recommender",
    icon: MapPin,
    subtitle: "Geographic Sorting Matrix",
    color: '#EC4899',
    accent: '#FBCFE8',
    steps: [
      { label: "Geo Access", text: "Ensure geo-location services are active on your web browser or mobile client hardware." },
      { label: "Auto-Pin", text: "The interface automatically queries and pins verified gym nodes across your region within India." },
      { label: "Smart Filter", text: "Sort recommendations dynamically by membership pricing, user ratings, or distance radius." },
      { label: "Book Now", text: "Tap the direct telephone vector to dial facilities or use the digital booking engine for memberships." }
    ]
  },
  analyzer: {
    title: "Pose Analyzer",
    icon: BarChart3,
    subtitle: "Kinetic Efficiency Reporting",
    color: '#10B981',
    accent: '#A7F3D0',
    steps: [
      { label: "Video Assets", text: "This utility evaluates historical video assets captured during your AI Gym Trainer blocks." },
      { label: "Path Tracking", text: "The engine calculates geometric paths to measure velocity drops and form degradation over time." },
      { label: "Score Report", text: "A composite 'Performance Score' out of 100 is generated summarizing structural movement economy." },
      { label: "Weekly Review", text: "Review weekly reports to isolate mechanical breakdown vectors before they manifest as injury." }
    ]
  }
};

function SparkCanvas({ color }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const spawn = () => {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        particles.current.push({
          x: canvas.width * 0.5 + (Math.random() - 0.5) * 60,
          y: canvas.height * 0.65,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          life: 1,
          decay: 0.015 + Math.random() * 0.02,
          size: 1 + Math.random() * 2,
          trail: []
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.3) spawn();

      particles.current = particles.current.filter(p => p.life > 0);
      particles.current.forEach(p => {
        p.trail.push({ x: p.x, y: p.y, life: p.life });
        if (p.trail.length > 8) p.trail.shift();

        p.trail.forEach((t, i) => {
          const alpha = (t.life * (i / p.trail.length)) * 0.4;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
        });

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const alpha = Math.floor(p.life * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `${color}${alpha}`;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= p.decay;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', borderRadius: '1rem'
      }}
    />
  );
}

function StepCard({ step, index, color, accent, visible }) {
  return (
    <div
      style={{
        display: 'flex', gap: '1rem', alignItems: 'flex-start',
        padding: '1rem 1.25rem',
        background: 'rgba(255,255,255,0.03)',
        border: `0.5px solid rgba(255,255,255,0.07)`,
        borderRadius: '0.875rem',
        position: 'relative', overflow: 'hidden',
        transition: `opacity 0.4s ease ${index * 80}ms, transform 0.4s ease ${index * 80}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(28px)',
      }}
    >
      <div
        style={{
          width: '2rem', height: '2rem', flexShrink: 0,
          borderRadius: '0.5rem',
          background: `${color}18`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
          color: color, letterSpacing: '0.05em'
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {step.label}
        </p>
        <p style={{ margin: 0, fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          {step.text}
        </p>
      </div>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
        background: `linear-gradient(to bottom, transparent, ${color}80, transparent)`,
        borderRadius: '2px 0 0 2px'
      }} />
    </div>
  );
}

function NavItem({ id, guide, isActive, onClick }) {
  const Icon = guide.icon;
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '0.75rem', border: 'none',
        cursor: 'pointer', textAlign: 'left',
        background: isActive ? `${guide.color}14` : 'transparent',
        outline: isActive ? `1px solid ${guide.color}50` : '1px solid transparent',
        transition: 'all 0.2s ease',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {isActive && (
        <div style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '2px',
          background: guide.color, borderRadius: '2px'
        }} />
      )}
      <div style={{
        width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
        background: isActive ? `${guide.color}22` : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease'
      }}>
        <Icon size={14} color={isActive ? guide.color : 'rgba(255,255,255,0.4)'} />
      </div>
      <span style={{
        fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.05em',
        textTransform: 'uppercase', color: isActive ? guide.color : 'rgba(255,255,255,0.4)',
        transition: 'color 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {guide.title}
      </span>
    </button>
  );
}

export default function HelpNotes({ onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [prevTab, setPrevTab] = useState(null);
  const [visible, setVisible] = useState(true);
  const [stepsVisible, setStepsVisible] = useState(true);

  const handleTabChange = (key) => {
    if (key === activeTab) return;
    setVisible(false);
    setStepsVisible(false);
    setTimeout(() => {
      setPrevTab(activeTab);
      setActiveTab(key);
      setVisible(true);
      setTimeout(() => setStepsVisible(true), 60);
    }, 200);
  };

  const guide = guides[activeTab];
  const Icon = guide.icon;

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      background: '#0A0A0A',
      color: '#fff', padding: '1.75rem',
      borderRadius: '1.25rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>

      {/* Ambient background glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse 60% 40% at 70% 20%, ${guide.color}09 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
        transition: 'background 0.6s ease'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2rem', paddingBottom: '1.5rem',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `${GOLD}18`, border: `1px solid ${GOLD}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookOpen size={20} color={GOLD} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                  FitNova AI
                </span>
                <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: GOLD }}>
                  Docs
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                System Module Reference
              </p>
            </div>
          </div>

          <button
            onClick={onBackToDashboard}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <ArrowLeft size={13} /> Back
          </button>
        </div>

        {/* ── Main Grid ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem' }}>

          {/* Sidebar */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '0.5px solid rgba(255,255,255,0.06)',
            borderRadius: '1rem', padding: '0.75rem', height: 'fit-content'
          }}>
            <p style={{
              fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
              padding: '4px 10px 10px', margin: '0 0 4px'
            }}>
              Modules
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {Object.keys(guides).map(key => (
                <NavItem
                  key={key}
                  id={key}
                  guide={guides[key]}
                  isActive={activeTab === key}
                  onClick={handleTabChange}
                />
              ))}
            </div>
          </div>

          {/* Content Panel */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '0.5px solid rgba(255,255,255,0.06)',
            borderRadius: '1rem', padding: '2rem',
            position: 'relative', overflow: 'hidden',
            minHeight: '520px'
          }}>

            {/* Particle sparks layer */}
            <SparkCanvas color={guide.color} />

            {/* Corner glow */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '200px', height: '200px',
              background: `radial-gradient(circle, ${guide.color}18 0%, transparent 70%)`,
              pointerEvents: 'none',
              transition: 'background 0.5s ease'
            }} />
            <div style={{
              position: 'absolute', bottom: '-60px', left: '-40px',
              width: '160px', height: '160px',
              background: `radial-gradient(circle, ${guide.color}0C 0%, transparent 70%)`,
              pointerEvents: 'none',
              transition: 'background 0.5s ease'
            }} />

            {/* Header block — slides in */}
            <div style={{
              position: 'relative', zIndex: 2,
              transition: 'opacity 0.25s ease, transform 0.25s ease',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(-12px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: `${guide.color}16`,
                  border: `1px solid ${guide.color}45`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 20px ${guide.color}20`,
                  transition: 'all 0.3s ease'
                }}>
                  <Icon size={22} color={guide.color} />
                </div>
                <div>
                  <h2 style={{
                    margin: 0, fontSize: '20px', fontWeight: 800,
                    letterSpacing: '-0.01em', color: '#fff'
                  }}>
                    {guide.title}
                  </h2>
                  <p style={{
                    margin: '3px 0 0', fontSize: '11px', fontWeight: 600,
                    color: guide.color, letterSpacing: '0.08em', textTransform: 'uppercase'
                  }}>
                    {guide.subtitle}
                  </p>
                </div>

                {/* Animated accent badge */}
                <div style={{ marginLeft: 'auto' }}>
                  <div style={{
                    padding: '5px 12px', borderRadius: '100px',
                    background: `${guide.color}14`,
                    border: `1px solid ${guide.color}35`,
                    fontSize: '10px', fontWeight: 700, color: guide.color,
                    letterSpacing: '0.08em', textTransform: 'uppercase'
                  }}>
                    {Object.keys(guides).indexOf(activeTab) + 1} / {Object.keys(guides).length}
                  </div>
                </div>
              </div>

              {/* Separator with glow line */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '1px', width: '80px',
                  background: `linear-gradient(to right, ${guide.color}80, transparent)`,
                  transition: 'background 0.4s ease'
                }} />
              </div>

              <p style={{
                fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '12px'
              }}>
                Standard Deployment Protocol
              </p>
            </div>

            {/* Steps */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {guide.steps.map((step, i) => (
                <StepCard
                  key={`${activeTab}-${i}`}
                  step={step}
                  index={i}
                  color={guide.color}
                  accent={guide.accent}
                  visible={stepsVisible}
                />
              ))}
            </div>

            {/* Bottom navigation arrows */}
            <div style={{
              position: 'relative', zIndex: 2,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '2rem', paddingTop: '1.25rem',
              borderTop: '0.5px solid rgba(255,255,255,0.06)'
            }}>
              {(() => {
                const keys = Object.keys(guides);
                const idx = keys.indexOf(activeTab);
                const prev = keys[idx - 1];
                const next = keys[idx + 1];
                return (
                  <>
                    <button
                      disabled={!prev}
                      onClick={() => prev && handleTabChange(prev)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '0.625rem',
                        background: prev ? 'rgba(255,255,255,0.04)' : 'transparent',
                        border: `0.5px solid ${prev ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                        cursor: prev ? 'pointer' : 'default',
                        color: prev ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ArrowLeft size={12} />
                      {prev ? guides[prev].title.split(' ').slice(-1)[0] : ''}
                    </button>

                    {/* Dot progress */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {Object.keys(guides).map((k, i) => (
                        <div
                          key={k}
                          onClick={() => handleTabChange(k)}
                          style={{
                            width: k === activeTab ? '20px' : '5px',
                            height: '5px', borderRadius: '100px',
                            background: k === activeTab ? guide.color : 'rgba(255,255,255,0.15)',
                            cursor: 'pointer', transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </div>

                    <button
                      disabled={!next}
                      onClick={() => next && handleTabChange(next)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '0.625rem',
                        background: next ? `${guide.color}14` : 'transparent',
                        border: `0.5px solid ${next ? guide.color + '35' : 'transparent'}`,
                        cursor: next ? 'pointer' : 'default',
                        color: next ? guide.color : 'rgba(255,255,255,0.15)',
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                        transition: 'all 0.2s'
                      }}
                    >
                      {next ? guides[next].title.split(' ').slice(-1)[0] : ''}
                      <ArrowLeft size={12} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}