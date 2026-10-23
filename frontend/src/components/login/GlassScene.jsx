import React from 'react';

/**
 * Fullscreen Cyberpunk Glass Scene Background
 * Inline SVG + CSS with diagonal neon ribbons, metallic chrome bands, glow pools, and vignette.
 */
export const GlassScene = () => {
  return (
    <div className="glass-streaks-layer" aria-hidden="true">
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full object-cover"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Neon Blue / Cyan Gradients */}
          <linearGradient id="neonCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
            <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#67E8F9" stopOpacity="1" />
            <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="deepBlueGrad" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#0369A1" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#0284C7" stopOpacity="0.75" />
            <stop offset="80%" stopColor="#38BDF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#075985" stopOpacity="0.2" />
          </linearGradient>

          {/* Metallic Silver / Chrome Ribbon Gradients */}
          <linearGradient id="chromeRibbonGrad" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.3" />
            <stop offset="30%" stopColor="#475569" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#64748B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0B1329" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="subtleSilverGrad" x1="0%" y1="10%" x2="100%" y2="90%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.1" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="neonGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="deepGlowPool" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" />
          </filter>

          <filter id="lightGlowPool" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
        </defs>

        {/* 1. Ambient Glow Pools (Soft blurred colored backdrops) */}
        <g opacity="0.6">
          <circle cx="350" cy="220" r="280" fill="#0284C7" filter="url(#deepGlowPool)" opacity="0.45" />
          <circle cx="1250" cy="720" r="320" fill="#0EA5E9" filter="url(#deepGlowPool)" opacity="0.35" />
          <ellipse cx="780" cy="450" rx="420" ry="240" fill="#38BDF8" filter="url(#lightGlowPool)" opacity="0.18" />
        </g>

        {/* 2. Metallic Silver Ribbons (Drifting Group 1) */}
        <g className="glass-streaks-group">
          {/* Wide Chrome Ribbon Band 1 */}
          <path
            d="M -150 -50 C 320 180, 850 420, 1750 950"
            fill="none"
            stroke="url(#chromeRibbonGrad)"
            strokeWidth="55"
            strokeLinecap="round"
            opacity="0.35"
          />

          {/* Sleek Chrome Hairline */}
          <path
            d="M -120 -20 C 350 205, 875 440, 1780 970"
            fill="none"
            stroke="#F8FAFC"
            strokeWidth="1.5"
            opacity="0.5"
          />

          {/* Secondary Silver Ribbon Band 2 */}
          <path
            d="M -50 120 C 480 340, 980 580, 1850 1020"
            fill="none"
            stroke="url(#subtleSilverGrad)"
            strokeWidth="75"
            strokeLinecap="round"
            opacity="0.25"
          />
        </g>

        {/* 3. Primary Glowing Neon Streaks (Drifting Group 2) */}
        <g className="glass-streaks-group--secondary">
          {/* Main Thick Neon Blue Ribbon */}
          <path
            d="M -80 50 C 380 240, 920 490, 1800 880"
            fill="none"
            stroke="url(#deepBlueGrad)"
            strokeWidth="38"
            strokeLinecap="round"
            filter="url(#neonGlowBlur)"
            opacity="0.85"
          />

          {/* Center High-Energy Cyan Beam */}
          <path
            d="M -60 70 C 395 255, 935 505, 1810 890"
            fill="none"
            stroke="url(#neonCyanGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#neonGlowBlur)"
            opacity="0.95"
          />

          {/* Hot White Specular Core Thread */}
          <path
            d="M -50 78 C 405 262, 945 512, 1820 898"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Parallel Accent Neon Streak */}
          <path
            d="M 120 -80 C 600 220, 1120 540, 1880 780"
            fill="none"
            stroke="url(#neonCyanGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#neonGlowBlur)"
            opacity="0.75"
          />

          {/* Thin Hairline Specular Curve */}
          <path
            d="M 140 -65 C 615 230, 1135 550, 1890 790"
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="1.2"
            opacity="0.6"
          />

          {/* Soft Bottom-Left Counter Streak */}
          <path
            d="M -200 480 C 240 620, 780 790, 1500 1100"
            fill="none"
            stroke="url(#deepBlueGrad)"
            strokeWidth="22"
            strokeLinecap="round"
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
};
