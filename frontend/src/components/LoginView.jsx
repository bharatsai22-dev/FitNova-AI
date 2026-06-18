import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginView({ onLoginSuccess }) {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dotCount, setDotCount] = useState(0);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const rafRef = useRef(null);

  /* ── Canvas: grid + floating particles ─────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    dotsRef.current = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.6 + Math.random() * 1.1,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a: 0.15 + Math.random() * 0.45,
    }));

    let scanY = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* grid */
      ctx.strokeStyle = 'rgba(255,215,0,0.04)';
      ctx.lineWidth = 0.5;
      const step = 38;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      /* scan line */
      const scanH = 80;
      const grad = ctx.createLinearGradient(0, scanY - scanH, 0, scanY + scanH);
      grad.addColorStop(0, 'rgba(255,215,0,0)');
      grad.addColorStop(0.5, 'rgba(255,215,0,0.035)');
      grad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - scanH, canvas.width, scanH * 2);
      scanY += 0.9;
      if (scanY > canvas.height + scanH) scanY = -scanH;

      /* particles */
      const cx = canvas.width / 2, cy = canvas.height * 0.43;
      const dots = dotsRef.current;
      dots.forEach(d => {
        const dx = d.x - cx, dy = d.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = dist < 200 ? d.a * (1 - dist / 200) * 0.8 : 0;
        if (alpha > 0.01) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,215,0,${alpha})`;
          ctx.fill();
        }
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
      });

      /* connections */
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const ddx = dots[i].x - dots[j].x, ddy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < 90) {
            const ci = { x: dots[i].x - cx, y: dots[i].y - cy };
            const distI = Math.sqrt(ci.x * ci.x + ci.y * ci.y);
            if (distI < 220) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(255,215,0,${0.06 * (1 - dist / 90) * (1 - distI / 220)})`;
              ctx.lineWidth = 0.4;
              ctx.moveTo(dots[i].x, dots[i].y);
              ctx.lineTo(dots[j].x, dots[j].y);
              ctx.stroke();
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /* ── Login handler ──────────────────────────────────── */
  const handleGoogleLogin = async () => {
    if (loading) return;
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      console.error('Login failed:', err);
      setError('Authentication failed. Please verify your Firebase configuration setup.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Styles ─────────────────────────────────────────── */
  const styles = `
    @keyframes pulse-ring { 0%,100%{transform:scale(0.85);opacity:.6}50%{transform:scale(1.08);opacity:.15} }
    @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes spin-rev  { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
    @keyframes glow-text { 0%,100%{text-shadow:0 0 18px rgba(255,215,0,.4)} 50%{text-shadow:0 0 36px rgba(255,215,0,.75)} }
    @keyframes float-dot { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.4);opacity:1} }
    @keyframes btn-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes border-glow { 0%,100%{box-shadow:0 0 0 0 rgba(255,215,0,0)} 50%{box-shadow:0 0 28px 2px rgba(255,215,0,.15)} }
    @keyframes card-in { from{opacity:0;transform:scale(.94) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes err-in { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

    .fn-card { animation: card-in 0.55s cubic-bezier(.22,1,.36,1) forwards; }
    .fn-card-inner { animation: border-glow 3.5s ease infinite; }
    .fn-ring-outer { animation: pulse-ring 2.8s ease-in-out infinite; }
    .fn-ring-mid   { animation: spin-slow 8s linear infinite; }
    .fn-ring-inner { animation: spin-rev 6s linear infinite; }
    .fn-logo-text  { animation: glow-text 3s ease infinite; }
    .fn-status-dot { animation: float-dot 2s ease infinite; }
    .fn-btn-shimmer { animation: btn-shimmer 2.8s ease-in-out infinite; }
    .fn-error      { animation: err-in 0.3s ease forwards; }
    .fn-google-btn { transition: transform .15s ease, opacity .15s ease; }
    .fn-google-btn:not(:disabled):hover  { transform: translateY(-1px); }
    .fn-google-btn:not(:disabled):active { transform: scale(.98); }
  `;

  const GOLD = '#FFD700';

  return (
    <>
      <style>{styles}</style>

      <div style={{
        minHeight: '100vh', background: '#080808',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Canvas BG */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }} />

        {/* Ambient radial */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(255,215,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Card */}
        <div className="fn-card" style={{ position: 'relative', zIndex: 10, width: 400, padding: '0 1rem' }}>
          <div className="fn-card-inner" style={{
            background: 'rgba(12,12,12,0.92)',
            border: '0.5px solid rgba(255,215,0,0.22)',
            borderRadius: '1.375rem', padding: '2.5rem 2rem',
          }}>

            {/* Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ position: 'relative', width: 84, height: 84, marginBottom: '1.25rem' }}>
                <div className="fn-ring-outer" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,215,0,0.15)' }} />
                <div className="fn-ring-mid"   style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '0.5px solid rgba(255,215,0,0.25)' }} />
                <div className="fn-ring-inner" style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '0.5px dashed rgba(255,215,0,0.2)' }} />
                <div style={{
                  position: 'absolute', inset: 20, borderRadius: '50%',
                  background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 20, color: GOLD }}>⚡</span>
                </div>
                {/* spark dots */}
                {[{ top: 3, left: '50%', ml: -2 }, { bottom: 8, right: 6 }, { top: 16, left: 3 }].map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: i === 0 ? 4 : i === 1 ? 3 : 2,
                    height: i === 0 ? 4 : i === 1 ? 3 : 2,
                    borderRadius: '50%', background: GOLD,
                    boxShadow: `0 0 ${6 - i}px ${GOLD}`,
                    opacity: 1 - i * 0.2,
                  }} />
                ))}
              </div>

              <h1 className="fn-logo-text" style={{ fontSize: 27, fontWeight: 900, letterSpacing: '0.14em', color: GOLD, textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>
                FITNOVA AI
              </h1>
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6 }}>
                Autonomous Biomechanics Gateway
              </p>
            </div>

            {/* Status pill */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              marginBottom: '1.75rem', padding: '7px 16px',
              background: 'rgba(0,212,100,0.07)', border: '0.5px solid rgba(0,212,100,0.22)',
              borderRadius: 100,
            }}>
              <div className="fn-status-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D464', boxShadow: '0 0 8px #00D464' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,212,100,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                Secure Identity Node — Online
              </span>
            </div>

            {/* Divider */}
            <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
              <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                padding: '0 14px', background: 'rgba(12,12,12,0.92)',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.14em' }}>AUTHORIZE</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="fn-error" style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                marginBottom: '1.25rem', padding: '10px 14px',
                background: 'rgba(220,50,50,0.08)', border: '0.5px solid rgba(220,50,50,0.28)',
                borderRadius: 10,
              }}>
                <span style={{ color: '#F87171', fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span style={{ fontSize: 11.5, color: '#F87171', lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            {/* Google Button */}
            <button
              className="fn-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%', position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 20px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: '#FFFFFF', color: '#111', opacity: loading ? 0.75 : 1,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              <div className="fn-btn-shimmer" style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(105deg, transparent 35%, rgba(255,215,0,0.22) 50%, transparent 65%)',
                backgroundSize: '300% 100%',
              }} />
              {/* Google G */}
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? `Authorizing${'.'.repeat((dotCount % 3) + 1)}` : 'Sign in with Google'}
            </button>

            {/* Feature pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1.5rem', flexWrap: 'wrap' }}>
              {[['🔒', 'Encrypted'], ['👆', 'Biometric'], ['⚡', 'Instant']].map(([icon, label]) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                  background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)',
                  borderRadius: 100,
                }}>
                  <span style={{ fontSize: 11 }}>{icon}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.16)', letterSpacing: '0.06em' }}>
              Authorization Node v1.0.4 &bull; Identity Gateway
            </p>

          </div>
        </div>
      </div>
    </>
  );
}