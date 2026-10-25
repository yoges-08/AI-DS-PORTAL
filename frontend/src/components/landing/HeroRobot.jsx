import React, { useEffect, useRef } from 'react';

/**
 * HeroRobot
 * Glossy 3D-style astronaut robot built from pure SVG + CSS 3D transforms + ambient floating data sparks.
 * - On desktop (mouse), the head, eyes, and body turn toward the cursor in real 3D perspective space.
 * - On phones / touch, it stays still with a graceful levitation float.
 */
export const HeroRobot = ({ trackRef }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const area = trackRef?.current;
    if (!root || !area || typeof window === 'undefined') return undefined;

    const canTrack =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canTrack) return undefined;

    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;

    const apply = () => {
      cur.x += (target.x - cur.x) * 0.14;
      cur.y += (target.y - cur.y) * 0.14;
      root.style.setProperty('--nx', cur.x.toFixed(3));
      root.style.setProperty('--ny', cur.y.toFixed(3));
      if (Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001) {
        raf = requestAnimationFrame(apply);
      } else {
        raf = 0;
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.35;
      target.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.45)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.45)));
      kick();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };

    area.addEventListener('pointermove', onMove, { passive: true });
    area.addEventListener('pointerleave', onLeave);
    return () => {
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [trackRef]);

  return (
    <div ref={rootRef} className="hero-robot" aria-hidden="true">
      <div className="hero-robot__float">
        <div className="hero-robot__scene">
          
          {/* Ambient 3D Energy Halo / Hologram Ring */}
          <div 
            className="absolute -inset-10 rounded-full border border-cyan-400/30 opacity-70 animate-spin pointer-events-none"
            style={{ 
              animationDuration: '16s', 
              transform: 'rotateX(75deg) rotateY(15deg) scale(1.15)',
              boxShadow: '0 0 35px rgba(56, 189, 248, 0.25)' 
            }} 
          />
          <div 
            className="absolute -inset-16 rounded-full border border-amber-300/25 opacity-50 animate-spin pointer-events-none"
            style={{ 
              animationDuration: '24s', 
              animationDirection: 'reverse', 
              transform: 'rotateX(65deg) rotateY(-20deg) scale(1.28)' 
            }} 
          />

          {/* Body */}
          <div className="hero-robot__body">
            <svg viewBox="0 0 400 330" xmlns="http://www.w3.org/2000/svg" focusable="false">
              <defs>
                <linearGradient id="hrShell" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="0.55" stopColor="#ece9f7" />
                  <stop offset="1" stopColor="#bfb8d9" />
                </linearGradient>
                <linearGradient id="hrCopper" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f3b48e" />
                  <stop offset="1" stopColor="#a8583b" />
                </linearGradient>
                <filter id="hrChestGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" />
                </filter>
              </defs>
              {/* Legs */}
              <rect x="128" y="236" width="56" height="86" rx="24" fill="url(#hrShell)" />
              <rect x="216" y="236" width="56" height="86" rx="24" fill="url(#hrShell)" />
              <rect x="124" y="296" width="64" height="12" rx="6" fill="url(#hrCopper)" />
              <rect x="212" y="296" width="64" height="12" rx="6" fill="url(#hrCopper)" />
              {/* Arms */}
              <g transform="rotate(14 98 70)">
                <rect x="66" y="40" width="46" height="120" rx="23" fill="url(#hrShell)" />
                <rect x="62" y="84" width="54" height="9" rx="4.5" fill="url(#hrCopper)" />
                <circle cx="89" cy="168" r="27" fill="url(#hrShell)" />
              </g>
              <g transform="rotate(-14 302 70)">
                <rect x="288" y="40" width="46" height="120" rx="23" fill="url(#hrShell)" />
                <rect x="284" y="84" width="54" height="9" rx="4.5" fill="url(#hrCopper)" />
                <circle cx="311" cy="168" r="27" fill="url(#hrShell)" />
              </g>
              {/* Torso */}
              <rect x="108" y="18" width="184" height="236" rx="62" fill="url(#hrShell)" />
              <rect x="108" y="196" width="184" height="12" rx="6" fill="url(#hrCopper)" opacity="0.85" />
              {/* Chest Panel with Pulsing AI Reactor Core */}
              <rect x="152" y="76" width="96" height="76" rx="14" fill="#e4e1f2" stroke="#c98a6b" strokeWidth="3" />
              <rect x="172" y="92" width="28" height="6" rx="3" fill="#e0a07d" />
              <circle cx="228" cy="96" r="14" fill="#38bdf8" opacity="0.45" filter="url(#hrChestGlow)" />
              <circle cx="228" cy="96" r="8" fill="#ffe9a0" />
              <circle cx="132" cy="62" r="6" fill="url(#hrCopper)" />
              <circle cx="268" cy="62" r="6" fill="url(#hrCopper)" />
            </svg>
          </div>

          {/* Head (Turns towards cursor in 3D) */}
          <div className="hero-robot__head">
            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" focusable="false">
              <defs>
                <linearGradient id="hrHead" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="0.6" stopColor="#ece9f7" />
                  <stop offset="1" stopColor="#c3bcdc" />
                </linearGradient>
                <linearGradient id="hrRim" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff6b0" />
                  <stop offset="1" stopColor="#ffc233" />
                </linearGradient>
                <radialGradient id="hrVisor" cx="0.35" cy="0.25" r="0.9">
                  <stop offset="0" stopColor="#2a2a36" />
                  <stop offset="0.5" stopColor="#0d0d14" />
                  <stop offset="1" stopColor="#05050a" />
                </radialGradient>
                <filter id="hrGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>
              {/* Ear Discs */}
              <ellipse cx="46" cy="150" rx="26" ry="44" fill="url(#hrHead)" stroke="#a8583b" strokeWidth="6" />
              <ellipse cx="354" cy="150" rx="26" ry="44" fill="url(#hrHead)" stroke="#a8583b" strokeWidth="6" />
              {/* Outer Shell */}
              <rect x="50" y="16" width="300" height="256" rx="112" fill="url(#hrHead)" />
              <path d="M150 20 h100 a10 10 0 0 1 0 14 h-100 a10 10 0 0 1 0 -14z" fill="#d9d4ec" />
              {/* Glowing Cyber Visor */}
              <rect x="76" y="46" width="248" height="198" rx="88" fill="none" stroke="#ffc233" strokeWidth="16" opacity="0.75" filter="url(#hrGlow)" />
              <rect x="76" y="46" width="248" height="198" rx="88" fill="url(#hrVisor)" stroke="url(#hrRim)" strokeWidth="10" />
              {/* Interactive Eyes following pointer */}
              <g className="hero-robot__face">
                <g className="hero-robot__eyes">
                  <path d="M124 150 q26 -34 52 0" fill="none" stroke="#fff6d6" strokeWidth="11" strokeLinecap="round" />
                  <path d="M224 150 q26 -34 52 0" fill="none" stroke="#fff6d6" strokeWidth="11" strokeLinecap="round" />
                </g>
                <path d="M178 186 q22 34 44 0 z" fill="#fff6d6" />
              </g>
              {/* Reflective Glass Highlights */}
              <ellipse cx="150" cy="84" rx="46" ry="20" fill="#ffffff" opacity="0.28" transform="rotate(-18 150 84)" />
              <circle cx="262" cy="96" r="7" fill="#ffffff" opacity="0.45" />
            </svg>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroRobot;
