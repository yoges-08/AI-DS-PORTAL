import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * GlassCard Component (White / Light Theme Edition)
 * Preserves:
 * 1. Exact geometric chamfer cuts with 24px corner curves
 * 2. Signature corner wedges with matching 24px outer radius & glowing stroke
 * 3. 3D interactive mouse tilt with perspective & dynamic specular glare
 * 4. Center morph emblem with expanding luminous bubble ring
 * 5. Frosted white glass depth (rgba(255, 255, 255, 0.94)) with navy/blue accents
 */
export const GlassCard = ({ phase = 'idle', onClose, children }) => {
  const cardRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 440, height: 530 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // ResizeObserver to track exact card dimensions for geometric SVG frame
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setDimensions({
            width: Math.round(entry.contentRect.width),
            height: Math.round(entry.contentRect.height)
          });
        }
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // 3D Interactive Mouse Tilt
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    // Skip tilt calculations on touch/mobile devices to prevent jitter
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6.5;
    const rotateY = ((x - centerX) / centerX) * 6.5;

    setTilt({
      rotateX: Math.round(rotateX * 10) / 10,
      rotateY: Math.round(rotateY * 10) / 10,
      glareX: Math.round((x / rect.width) * 100),
      glareY: Math.round((y / rect.height) * 100)
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const W = dimensions.width;
  const H = dimensions.height;
  const isSmallScreen = W < 400;
  const cut = isSmallScreen ? 38 : 56;
  const radius = isSmallScreen ? 18 : 24;

  // Exact card outline path with rounded top-right & bottom-left, chamfered top-left & bottom-right
  const cardPath = `
    M ${cut} 0
    L ${Math.max(cut, W - radius)} 0
    A ${radius} ${radius} 0 0 1 ${W} ${radius}
    L ${W} ${Math.max(radius, H - cut)}
    L ${Math.max(radius, W - cut)} ${H}
    L ${radius} ${H}
    A ${radius} ${radius} 0 0 1 0 ${H - radius}
    L 0 ${cut}
    Z
  `;

  // Top-left wedge tab (matches 24px outer rounded corner, 5px gap from cut)
  const wedgeTLPath = `
    M ${radius} 0
    L 46 0
    C 48 0, 49 2, 47 4
    L 4 47
    C 2 49, 0 48, 0 46
    L 0 ${radius}
    A ${radius} ${radius} 0 0 1 ${radius} 0
    Z
  `;

  // Bottom-right wedge tab (matches 24px outer rounded corner, 5px gap from cut)
  const wedgeBRPath = `
    M 48 24
    L 48 2
    C 48 0, 46 -1, 44 1
    L 1 44
    C -1 46, 0 48, 2 48
    L 24 48
    A ${radius} ${radius} 0 0 0 48 24
    Z
  `;

  const isMorph = phase === 'morph';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[450px] mx-auto select-none"
      style={{
        perspective: '1200px'
      }}
    >
      {/* Discreet Close Button (Clean White/Grey Pill matching User Screenshot) */}
      {onClose && (
        <motion.button
          type="button"
          onClick={onClose}
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="absolute -top-2.5 -right-2.5 sm:-top-3 sm:-right-3 z-30 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white border border-gray-200/80 text-gray-500 hover:text-gray-900 flex items-center justify-center shadow-[0_4px_12px_rgba(15,35,80,0.12)] cursor-pointer backdrop-blur-md"
          title="Close dialog"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}

      {/* 3D Tilted Card Container */}
      <div
        className="relative w-full transition-transform duration-150 ease-out"
        style={{
          transform: isHovered
            ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(8px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* ============================================================ */}
        {/* SVG GEOMETRIC BORDER & FROSTED GLASS SHELL                   */}
        {/* ============================================================ */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
        >
          <defs>
            {/* Subtle Blue/Cyan Border Gradient */}
            <linearGradient id="cardBorderGradWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E4FD8" stopOpacity="0.45" />
              <stop offset="30%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#0EA5E9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1E4FD8" stopOpacity="0.4" />
            </linearGradient>

            {/* Glowing Border Filter */}
            <filter id="cardGlowFilterWhite" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#1E4FD8" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Card Body Frame Stroke */}
          <path
            d={cardPath}
            fill="none"
            stroke="url(#cardBorderGradWhite)"
            strokeWidth="1.2"
            filter="url(#cardGlowFilterWhite)"
          />
        </svg>

        {/* ============================================================ */}
        {/* SIGNATURE CORNER WEDGES (Top-Left & Bottom-Right)           */}
        {/* ============================================================ */}

        {/* Top-Left Wedge */}
        <div
          className="absolute z-20 pointer-events-none transition-all duration-500 ease-out"
          style={{
            top: isMorph ? `calc(${H / 2}px - 24px)` : '0px',
            left: isMorph ? `calc(${W / 2}px - 24px)` : '0px',
            transform: isMorph ? 'scale(1.4) rotate(135deg)' : 'scale(1) rotate(0deg)',
            opacity: isMorph ? 0.95 : 1
          }}
        >
          <svg viewBox="0 0 50 50" className="w-[50px] h-[50px] overflow-visible">
            <path
              d={wedgeTLPath}
              fill="rgba(235, 245, 255, 0.85)"
              stroke="#1E4FD8"
              strokeWidth="1.4"
              className="drop-shadow-[0_2px_8px_rgba(30,79,216,0.25)]"
            />
          </svg>
        </div>

        {/* Bottom-Right Wedge */}
        <div
          className="absolute z-20 pointer-events-none transition-all duration-500 ease-out"
          style={{
            bottom: isMorph ? `calc(${H / 2}px - 24px)` : '0px',
            right: isMorph ? `calc(${W / 2}px - 24px)` : '0px',
            transform: isMorph ? 'scale(1.4) rotate(135deg)' : 'scale(1) rotate(0deg)',
            opacity: isMorph ? 0.95 : 1
          }}
        >
          <svg viewBox="0 0 50 50" className="w-[50px] h-[50px] overflow-visible">
            <path
              d={wedgeBRPath}
              fill="rgba(235, 245, 255, 0.85)"
              stroke="#1E4FD8"
              strokeWidth="1.4"
              className="drop-shadow-[0_2px_8px_rgba(30,79,216,0.25)]"
            />
          </svg>
        </div>

        {/* ============================================================ */}
        {/* CENTER MORPH: EMBLEM & EXPANDING BUBBLE RING                */}
        {/* ============================================================ */}
        {isMorph && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            {/* Luminous Expanding Bubble Ring in White Theme */}
            <div className="glass-bubble-shockwave--white" />

            {/* Central Merged Emblem with Diagonal Slash */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-blue-400 shadow-[0_0_28px_rgba(30,79,216,0.5)] flex items-center justify-center animate-glEmblemPop">
              <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                <rect
                  x="8"
                  y="8"
                  width="32"
                  height="32"
                  rx="9"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  fill="rgba(255, 255, 255, 0.2)"
                />
                <line
                  x1="15"
                  y1="33"
                  x2="33"
                  y2="15"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CARD SURFACE: WHITE FROSTED GLASS & SPECULAR MOUSE GLARE    */}
        {/* ============================================================ */}
        <section
          className="relative w-full overflow-hidden transition-all duration-300"
          style={{
            clipPath: `polygon(
              ${cut}px 0%,
              calc(100% - ${radius}px) 0%,
              100% ${radius}px,
              100% calc(100% - ${cut}px),
              calc(100% - ${cut}px) 100%,
              ${radius}px 100%,
              0% calc(100% - ${radius}px),
              0% ${cut}px
            )`,
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(32px) saturate(190%)',
            WebkitBackdropFilter: 'blur(32px) saturate(190%)',
            boxShadow: '0 24px 70px -15px rgba(15, 35, 80, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.9) inset, 0 8px 30px rgba(30, 79, 216, 0.08)'
          }}
        >
          {/* Dynamic Specular Glare Spot following mouse */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
            style={{
              opacity: isHovered ? 1 : 0.4,
              background: `radial-gradient(circle 350px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.75) 0%, transparent 70%)`
            }}
          />

          {/* Diagonal Glass Sheen */}
          <div className="absolute -top-[60%] -left-[80%] w-[60%] h-[220%] bg-gradient-to-r from-transparent via-white/[0.2] to-transparent rotate-[25deg] pointer-events-none animate-glSheen" />

          {/* Card Content Wrapper */}
          <div
            className={`relative z-20 p-5 sm:p-7 text-[#0B1B3A] transition-all duration-200 ${
              phase === 'out' || phase === 'morph' ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
            }`}
          >
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GlassCard;