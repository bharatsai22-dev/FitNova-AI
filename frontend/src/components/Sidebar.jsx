import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from "firebase/auth";
import ReactDOM from 'react-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  MessageSquare,
  CalendarDays,
  Activity,
  MapPin,
  BarChart3,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
} from 'lucide-react';

/* ─── Inline styles / design tokens ─────────────────────────────────────────── */
const GOLD        = '#FFD700';
const GOLD_SOFT   = '#E6C200';
const DARK_BG     = '#111111';
const DARKER_BG   = '#0d0d0d';
const SURFACE     = '#1a1a1a';
const RED         = '#FF3131';

/* Per-item accent colours (cycles through a small palette) */
const ITEM_ACCENTS = [GOLD, '#7C3AED', '#06B6D4', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#3B82F6', '#6B7280'];

export default function Sidebar({ currentView, setCurrentView, user, setUser }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isCollapsed, setIsCollapsed]         = useState(false);
  const [hoveringToggle, setHoveringToggle]   = useState(false);
  const [hoveredItem, setHoveredItem]         = useState(null);

  /* ── Navigation items (same IDs as original) ── */
  const menuItems = [
    { id: 'dashboard',       name: 'Dashboard',          icon: LayoutDashboard, badge: null    },
    { id: 'trainer',         name: 'AI Gym Trainer',     icon: Dumbbell,        badge: 'NEW'   },
    { id: 'dietitian',       name: 'AI Dietician',       icon: Utensils,        badge: null    },
    { id: 'buddy',           name: 'Virtual Gym Buddy',  icon: MessageSquare,   badge: null    },
    { id: 'habit_ml',        name: 'Habit & ML Tracker', icon: CalendarDays,    badge: null    },
    { id: 'iot',             name: 'Smart Gym IoT Hub',  icon: Activity,        badge: null    },
    { id: 'gym_recommender', name: 'Gym Recommender',    icon: MapPin,          badge: null    },
    { id: 'analyzer',        name: 'Pose Analyzer',      icon: BarChart3,       badge: null    },
    { id: 'notes',           name: 'How to Use',         icon: HelpCircle,      badge: null    },
  ];

  /* ── Google OAuth (logic unchanged) ── */
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profileData = await response.json();
        const backendResponse = await fetch('http://127.0.0.1:8000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profileData.email, name: profileData.name, avatar: profileData.picture }),
        });
        const backendData = await backendResponse.json();
        if (backendData.status === 'success') {
          console.log('Profile synchronized:', backendData.message);
          setUser({
            isLoggedIn: true,
            id:    backendData.user._id,
            name:  backendData.user.name,
            email: backendData.user.email,
            avatar: backendData.user.avatar,
            dbId:  backendData.user._id,
          });
        } else {
          console.error('Backend validation failed:', backendData);
          alert('FastAPI rejected the login! Check the console (F12).');
        }
      } catch (error) {
        console.error('DEBUG: Authentication failed:', error);
        alert('Backend error: ' + error.message);
      }
    },
    onError: (error) => console.error('OAuth Authorization handshake failed:', error),
  });

  /* ── Fully Re-engineered Sign Out Operations ── */
  const handleLogoutConfirm = async () => {
    try {
      // 1. Sign out cleanly from Firebase client context
      const auth = getAuth();
      await signOut(auth);
    } catch (err) {
      console.log("Firebase auth clear skipped or uninitialized.");
    }

    try {
      // 2. Notify stateless backend architecture if route is open
      await fetch('http://127.0.0.1:8000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id }),
      });
    } catch (err) {
      console.log("Stateless server log session frame update skipped.");
    }

    // 3. Purge all structural tracking cache footprints
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    sessionStorage.clear();

    // 4. Wipe active context states completely clean
    setUser({ 
      isLoggedIn: false, 
      id: '', 
      name: '', 
      email: '', 
      avatar: '', 
      dbId: '' 
    });
    
    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => setShowLogoutModal(false);

  useEffect(() => {
    let portalRoot = document.getElementById('modal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'modal-root';
      document.body.appendChild(portalRoot);
    }
  }, []);

  /* ── Sidebar width ── */
  const SIDEBAR_W   = isCollapsed ? 72 : 260;
  const TOGGLE_SIZE = 28;

  /* ── Toggle button inline style ── */
  const toggleStyle = {
    position:       'fixed',
    top:            '50%',
    left:           SIDEBAR_W - TOGGLE_SIZE / 2,
    transform:      'translateY(-50%)',
    transition:     'left 300ms cubic-bezier(0.4,0,0.2,1), background 180ms ease, border-color 180ms ease',
    zIndex:         60,
    width:          TOGGLE_SIZE,
    height:         TOGGLE_SIZE,
    borderRadius:   '50%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    border:         '1px solid',
    outline:        'none',
    padding:        0,
    borderColor:    hoveringToggle ? GOLD       : 'rgba(255,215,0,0.35)',
    background:     hoveringToggle ? GOLD       : '#1e1e1e',
    color:          hoveringToggle ? '#1C1C1C'  : GOLD,
    boxShadow:      hoveringToggle
      ? `0 0 0 4px rgba(255,215,0,0.12), 0 0 16px rgba(255,215,0,0.2)`
      : '0 2px 8px rgba(0,0,0,0.5)',
  };

  /* ════════════════════════════════════════════════════════════════════════════
      LOGOUT MODAL — portal-rendered
  ═══════════════════════════════════════════════════════════════════════════ */
  const LogoutModal = () =>
    ReactDOM.createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* backdrop */}
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={handleLogoutCancel}
        />
        {/* dialog */}
        <div
          className="relative w-[92%] max-w-sm mx-auto rounded-2xl p-6 shadow-2xl"
          style={{
            background:  '#141414',
            border:      '1px solid rgba(255,215,0,0.18)',
            boxShadow:   '0 0 0 1px rgba(255,215,0,0.06), 0 24px 48px rgba(0,0,0,0.7)',
          }}
        >
          {/* icon ring */}
          <div className="mb-4 flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,49,49,0.12)', border: '1px solid rgba(255,49,49,0.25)' }}
            >
              <LogOut size={22} color={RED} />
            </div>
          </div>
          <h3 className="text-center text-base font-black text-white mb-1">Sign Out?</h3>
          <p className="text-center text-xs text-stone-400 leading-relaxed mb-6">
            You'll need to sign in again to access your account and training data.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleLogoutCancel}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-stone-300 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleLogoutConfirm}
              className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all"
              style={{ background: `linear-gradient(135deg, ${RED}, #cc0000)`, color: '#fff' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>,
      document.getElementById('modal-root')
    );

  /* ════════════════════════════════════════════════════════════════════════════
      RENDER
  ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ══════════  SIDEBAR SHELL  ══════════ */}
      <div
        className="h-screen fixed left-0 top-0 flex flex-col z-50"
        style={{
          width:      SIDEBAR_W,
          background: DARK_BG,
          borderRight:'1px solid rgba(255,215,0,0.1)',
          transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
          overflow:   'hidden',
          boxShadow:  '4px 0 32px rgba(0,0,0,0.6)',
        }}
      >

        {/* ── Brand Header ── */}
        <div
          className="flex items-center gap-3 flex-shrink-0"
          style={{
            padding:      '14px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            minHeight:    68,
          }}
        >
          {/* Logo mark */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-xl"
            style={{
              width:      38,
              height:     38,
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_SOFT})`,
              boxShadow:  `0 0 12px rgba(255,215,0,0.3)`,
            }}
          >
            <Dumbbell size={18} color="#1C1C1C" strokeWidth={2.5} />
          </div>

          {/* Brand copy — fades out when collapsed */}
          <div
            style={{
              overflow:   'hidden',
              whiteSpace: 'nowrap',
              opacity:    isCollapsed ? 0 : 1,
              maxWidth:   isCollapsed ? 0 : 200,
              transition: 'opacity 250ms ease, max-width 300ms ease',
            }}
          >
            <div
              style={{
                fontSize:       17,
                fontWeight:     900,
                letterSpacing:  '0.14em',
                background:     `linear-gradient(90deg, ${GOLD} 0%, #FFE97A 50%, ${GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight:     1,
              }}
            >
              FITNOVA AI
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 3 }}>
              Luxury Performance
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {menuItems.map((item, idx) => {
            const Icon     = item.icon;
            const isActive = currentView === item.id;
            const isHover  = hoveredItem === item.id;
            const accent   = ITEM_ACCENTS[idx % ITEM_ACCENTS.length];

            /* divider before "Gym Recommender" */
            const showDivider = idx === 6;

            return (
              <React.Fragment key={item.id}>
                {showDivider && (
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 10px' }} />
                )}
                <button
                  onClick={() => setCurrentView(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={isCollapsed ? item.name : undefined}
                  style={{
                    width:          '100%',
                    display:        'flex',
                    alignItems:     'center',
                    gap:            10,
                    padding:        isCollapsed ? '10px 0' : '9px 10px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    borderRadius:   10,
                    cursor:         'pointer',
                    border:         `1px solid ${isActive ? `${accent}30` : isHover ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
                    background:     isActive
                      ? `linear-gradient(90deg, ${accent}18 0%, ${accent}06 100%)`
                      : isHover
                        ? 'rgba(255,255,255,0.04)'
                        : 'transparent',
                    transition:     'all 160ms ease',
                    position:       'relative',
                    overflow:       'hidden',
                  }}
                >
                  {/* Left accent bar */}
                  {isActive && (
                    <div
                      style={{
                        position:     'absolute',
                        left:         0,
                        top:          5,
                        bottom:       5,
                        width:        3,
                        borderRadius: '0 2px 2px 0',
                        background:   accent,
                      }}
                    />
                  )}

                  {/* Icon tray */}
                  <div
                    style={{
                      width:        32,
                      height:       32,
                      borderRadius: 8,
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent:'center',
                      background:   isActive ? `${accent}20` : isHover ? 'rgba(255,255,255,0.06)' : 'transparent',
                      flexShrink:   0,
                      transition:   'background 160ms ease',
                    }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      color={isActive ? accent : isHover ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.32)'}
                      style={{ transition: 'color 160ms' }}
                    />
                  </div>

                  {/* Label */}
                  {!isCollapsed && (
                    <span
                      style={{
                        fontSize:      11,
                        fontWeight:    isActive ? 800 : 600,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color:         isActive ? accent : isHover ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.32)',
                        whiteSpace:    'nowrap',
                        flex:          1,
                        textAlign:     'left',
                        transition:    'color 160ms ease',
                      }}
                    >
                      {item.name}
                    </span>
                  )}

                  {/* Badge */}
                  {item.badge && !isCollapsed && (
                    <span
                      style={{
                        fontSize:     8,
                        fontWeight:   800,
                        letterSpacing:'0.08em',
                        background:   RED,
                        color:        '#fff',
                        padding:      '2px 6px',
                        borderRadius: 99,
                        flexShrink:   0,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* ── Auth Footer ── */}
        <div
          className="flex-shrink-0"
          style={{
            padding:    '10px 8px',
            borderTop:  '1px solid rgba(255,255,255,0.05)',
            background: DARKER_BG,
          }}
        >
          {user?.isLoggedIn ? (
            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                justifyContent: isCollapsed ? 'center' : 'space-between',
              }}
            >
              {/* Avatar — Now clickable when collapsed to open logout window */}
              <img
                src={user.avatar}
                alt={user.name}
                title={isCollapsed ? `${user.name} (Click to Sign Out)` : undefined}
                referrerPolicy="no-referrer"
                onClick={isCollapsed ? () => setShowLogoutModal(true) : undefined}
                style={{
                  width:        36,
                  height:       36,
                  borderRadius: 9,
                  objectFit:    'cover',
                  border:       `1.5px solid rgba(255,215,0,0.3)`,
                  flexShrink:   0,
                  cursor:       isCollapsed ? 'pointer' : 'default',
                }}
              />

              {/* Name + pill — hidden when collapsed */}
              {!isCollapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize:     11,
                      fontWeight:   700,
                      color:        'rgba(255,255,255,0.9)',
                      whiteSpace:   'nowrap',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      display:       'inline-block',
                      marginTop:     2,
                      fontSize:      8.5,
                      fontWeight:    700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color:         GOLD,
                      background:    'rgba(255,215,0,0.1)',
                      border:        '0.5px solid rgba(255,215,0,0.25)',
                      padding:       '2px 6px',
                      borderRadius:  4,
                    }}
                  >
                    Google Secure
                  </div>
                </div>
              )}

              {/* Logout button — hidden when collapsed */}
              {!isCollapsed && (
                <button
                  onClick={() => { console.log('Logout button clicked'); setShowLogoutModal(true); }}
                  title="Sign Out"
                  style={{
                    width:        30,
                    height:       30,
                    borderRadius: 8,
                    background:   'transparent',
                    border:       '1px solid rgba(255,255,255,0.08)',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    cursor:       'pointer',
                    flexShrink:   0,
                    transition:   'background 150ms, border-color 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,49,49,0.12)'; e.currentTarget.style.borderColor='rgba(255,49,49,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
                >
                  <LogOut size={14} color="rgba(255,255,255,0.3)" />
                </button>
              )}
            </div>
          ) : !isCollapsed ? (
            /* ── Sign-in button ── */
            <button
              onClick={() => handleGoogleLogin()}
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            8,
                padding:        '10px',
                borderRadius:   10,
                background:     '#fff',
                border:         'none',
                cursor:         'pointer',
                fontSize:       11,
                fontWeight:     800,
                letterSpacing:  '0.06em',
                textTransform:  'uppercase',
                color:          '#1a1a1a',
                transition:     'background 150ms, transform 120ms',
                boxShadow:      '0 2px 8px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#f0f0f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#fff'; }}
              onMouseDown={e  => { e.currentTarget.style.transform='scale(0.98)'; }}
              onMouseUp={e    => { e.currentTarget.style.transform='scale(1)'; }}
            >
              <GoogleG />
              Sign in with Google
            </button>
          ) : (
            /* ── Collapsed sign-in icon ── */
            <button
              onClick={() => handleGoogleLogin()}
              title="Sign in with Google"
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        8,
                borderRadius:   10,
                background:     '#fff',
                border:         'none',
                cursor:         'pointer',
                transition:     'background 150ms',
                boxShadow:      '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              <GoogleG />
            </button>
          )}
        </div>
      </div>

      {/* ══════════  COLLAPSE TOGGLE BUTTON  ══════════ */}
      <button
        style={toggleStyle}
        onMouseEnter={() => setHoveringToggle(true)}
        onMouseLeave={() => setHoveringToggle(false)}
        onClick={() => setIsCollapsed(v => !v)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed
          ? <PanelLeftOpen  size={12} strokeWidth={2.4} style={{ position: 'relative', zIndex: 1 }} />
          : <PanelLeftClose size={12} strokeWidth={2.4} style={{ position: 'relative', zIndex: 1 }} />
        }
      </button>

      {/* ══════════  LOGOUT MODAL  ══════════ */}
      {showLogoutModal && <LogoutModal />}
    </>
  );
}

/* ── Google "G" SVG mark ── */
function GoogleG() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.66 1.44 14.96 1 12 1 7.35 1 3.41 3.65 1.57 7.53l3.86 3C6.35 7.56 8.96 5.04 12 5.04z"/>
      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.88c2.18-2.01 3.43-4.97 3.43-8.61z"/>
      <path fill="#FBBC05" d="M5.43 14.47c-.24-.73-.38-1.51-.38-2.32s.14-1.59.38-2.32L1.57 6.83C.57 8.84 0 11.11 0 13.5s.57 4.66 1.57 6.67l3.86-3.7z"/>
      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.72-2.88c-1.03.69-2.35 1.11-4.24 1.11-3.04 0-5.65-2.52-6.57-5.49l-3.86 3C3.41 20.35 7.35 23 12 23z"/>
    </svg>
  );
}