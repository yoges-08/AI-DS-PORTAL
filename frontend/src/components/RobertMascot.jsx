import React, { useState, useEffect } from 'react';

/**
 * RobertMascot Component (Compact 34px Free-Flight Edition)
 * - Ultra-compact 34px size (refined, elegant, never obstructive).
 * - Fixed/viewport-level flight: flies anywhere across the entire webpage (left hero, bento boxes, logos, header).
 * - Away-from-field engine: when any field is clicked, Robert flies to an unpredictable spot FAR AWAY from that field.
 * - Dynamic facial expressions (blinking, happy, winking, surprised).
 * - Adaptive speech bubble that automatically flips to stay on-screen.
 */
export const RobertMascot = ({ activeField = 'idle', role = 'STUDENT' }) => {
  const [position, setPosition] = useState({ top: '80px', left: '80px' });
  const [speech, setSpeech] = useState("Hi! I'm Robert 👋 Click a field to sign in!");
  const [expression, setExpression] = useState('normal');
  const [tilt, setTilt] = useState(0);
  const [bubbleDir, setBubbleDir] = useState('right');

  // Calculates a random coordinate across the whole webpage, guaranteed away from the active form
  const getRandomAnywherePos = (favorLeft = false) => {
    if (typeof window === 'undefined') return { top: '80px', left: '80px' };
    const winW = Math.max(window.innerWidth, 800);
    const winH = Math.max(window.innerHeight, 600);

    const minX = 35;
    const maxX = winW - 95;
    const minY = 35;
    const maxY = winH - 95;

    let targetX = 0;
    let targetY = Math.floor(Math.random() * (maxY - minY)) + minY;

    if (favorLeft) {
      // Actively fly to the left side (over AAMEC crest, bento boxes, etc.)
      targetX = Math.floor(Math.random() * (winW * 0.42 - minX)) + minX;
    } else {
      targetX = Math.floor(Math.random() * (maxX - minX)) + minX;
    }

    return { top: `${targetY}px`, left: `${targetX}px`, x: targetX, y: targetY };
  };

  const flyTo = (newPos, text, expr = 'happy') => {
    const curX = parseInt(position.left, 10) || 80;
    const nextX = parseInt(newPos.left, 10) || 80;

    // Organic flight tilt into wind
    const deltaX = nextX - curX;
    if (deltaX > 25) setTilt(9);
    else if (deltaX < -25) setTilt(-9);

    // Auto-flip speech bubble so it never clips off-screen
    if (typeof window !== 'undefined' && nextX > window.innerWidth - 240) {
      setBubbleDir('left');
    } else {
      setBubbleDir('right');
    }

    setPosition({ top: newPos.top, left: newPos.left });
    setSpeech(text);
    setExpression(expr);

    setTimeout(() => {
      setTilt(0);
    }, 950);
  };

  // Continuous background random wander across webpage every 4.8 seconds when idle
  useEffect(() => {
    if (activeField !== 'idle') return;

    const timer = setInterval(() => {
      const pos = getRandomAnywherePos(false);
      flyTo(pos, speech, 'normal');
    }, 4800);

    return () => clearInterval(timer);
  }, [activeField, speech]);

  // Target specific field when focused -> flies across the webpage away from inputs
  useEffect(() => {
    switch (activeField) {
      case 'reg': {
        const pos = getRandomAnywherePos(true);
        flyTo(pos, 'Enter register number 🎓', 'happy');
        break;
      }
      case 'dob': {
        const pos = getRandomAnywherePos(true);
        flyTo(pos, 'Enter DOB (DDMMYYYY) 🎂', 'happy');
        break;
      }
      case 'adminUser': {
        const pos = getRandomAnywherePos(true);
        flyTo(pos, 'Enter faculty username 👤', 'happy');
        break;
      }
      case 'adminPass': {
        const pos = getRandomAnywherePos(true);
        flyTo(pos, 'Enter admin password 🔒', 'happy');
        break;
      }
      case 'loading': {
        const pos = getRandomAnywherePos(false);
        flyTo(pos, 'Checking credentials... ⚡', 'surprised');
        break;
      }
      case 'success': {
        flyTo({ top: '80px', left: '42%' }, 'Access Granted! Welcome! 🎉', 'happy');
        break;
      }
      default:
        setSpeech(role === 'STUDENT' ? "Hi! I'm Robert 👋 Watching over your portal!" : "Admin Portal Ready 🛡️");
        setExpression('normal');
        break;
    }
  }, [activeField, role]);

  const handleClick = () => {
    setExpression('wink');
    setSpeech("Swoosh! Catch me! 🚀");
    setTilt(360);
    setTimeout(() => {
      setTilt(0);
      const pos = getRandomAnywherePos(false);
      flyTo(pos, "Hehe! I'm Robert! 🚀", 'happy');
    }, 500);
  };

  return (
    <div
      id="robertContainer"
      className="fixed z-[9999] pointer-events-auto transition-all duration-1000 ease-out"
      style={{
        top: position.top,
        left: position.left,
        transform: `rotate(${tilt}deg)`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      {/* Continuous Multi-Axis Organic Float Wrapper */}
      <div className="relative robert-hover-bob">
        
        {/* Adaptive Speech Bubble */}
        <div 
          key={speech}
          className={`robert-bubble absolute top-1/2 -translate-y-1/2 bg-[#012357]/96 border border-cyan-400/75 text-white px-2.5 py-1 rounded-[11px] text-[10.5px] font-bold whitespace-nowrap shadow-xl backdrop-blur-md pointer-events-none transition-all duration-300 ${
            bubbleDir === 'left' ? 'right-[44px]' : 'left-[44px]'
          }`}
        >
          {speech}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 border-4 border-transparent ${
              bubbleDir === 'left' ? 'left-full border-l-[#012357]' : 'right-full border-r-[#012357]'
            }`} 
          />
        </div>

        {/* Compact 34px Exact Blue Glowing Orb */}
        <div 
          className="robert-orb w-[34px] h-[34px] rounded-full relative cursor-pointer flex items-center justify-center transition-transform hover:scale-115 active:scale-95"
          onClick={handleClick}
          onMouseEnter={() => setExpression('happy')}
          onMouseLeave={() => setExpression(activeField === 'idle' ? 'normal' : 'happy')}
          title="Click to play with Robert!"
          style={{
            background: 'radial-gradient(circle at 36% 30%, #93C5FD 0%, #3B82F6 36%, #1D4ED8 72%, #0F172A 100%)',
            boxShadow: '0 6px 16px -2px rgba(37, 99, 235, 0.6), 0 0 14px rgba(59, 130, 246, 0.5), inset 0 -2.5px 5px rgba(15, 23, 42, 0.5), inset 0 2px 3.5px rgba(255, 255, 255, 0.9)',
            border: '1.5px solid rgba(147, 197, 253, 0.55)'
          }}
        >
          {/* Subtle glowing halo */}
          <div className="robert-halo absolute -inset-1 rounded-full bg-cyan-400/40 blur-sm pointer-events-none" />

          {/* Expressive Face */}
          <div 
            className="robert-face flex items-center gap-[4px] transition-transform duration-250"
            style={{
              transform: expression === 'look-down-right' ? 'translate(2.5px, 2.5px)' : 'translate(1px, -1.5px)'
            }}
          >
            {/* Left Eye */}
            <div 
              className="robert-eye w-[4.5px] bg-white rounded-full transition-all duration-200"
              style={{
                height: expression === 'happy' ? '7.5px' : expression === 'surprised' ? '12px' : '9.5px',
                borderRadius: expression === 'happy' ? '5px 5px 0 0' : '999px',
                transform: expression === 'wink' ? 'scaleY(0.1)' : 'none',
                boxShadow: '0 0 4px #FFFFFF, 0 0 7px rgba(255, 255, 255, 0.85)'
              }}
            />
            {/* Right Eye */}
            <div 
              className="robert-eye w-[4.5px] bg-white rounded-full transition-all duration-200"
              style={{
                height: expression === 'happy' ? '7.5px' : expression === 'surprised' ? '12px' : '9.5px',
                borderRadius: expression === 'happy' ? '5px 5px 0 0' : '999px',
                transform: expression === 'wink' ? 'scale(1.2)' : 'none',
                boxShadow: '0 0 4px #FFFFFF, 0 0 7px rgba(255, 255, 255, 0.85)'
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default RobertMascot;
