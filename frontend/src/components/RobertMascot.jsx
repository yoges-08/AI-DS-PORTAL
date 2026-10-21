import React, { useState, useEffect } from 'react';

/**
 * RobertMascot Component (Compact 34px Free-Flight Edition)
 * - Ultra-compact 34px size (refined, elegant, never obstructive).
 * - Fixed/viewport-level flight: flies anywhere across the entire webpage (left hero, bento boxes, logos, header).
 * - Away-from-field engine: when any field is clicked, Robert flies to an unpredictable spot FAR AWAY from that field.
 * - Dynamic facial expressions (blinking, happy, winking, surprised, worried).
 * - Reactive Error State: Shakes head (no-no tilt), shows worried eyes, glowing coral alert orb, and gives helpful, encouraging feedback.
 * - Adaptive speech bubble that automatically flips to stay on-screen.
 */
export const RobertMascot = ({ activeField = 'idle', role = 'STUDENT', errorMessage = '' }) => {
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
    if (typeof window !== 'undefined' && nextX > window.innerWidth - 250) {
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
      case 'error': {
        // Head shake tilt sequence (gentle no-no wobble)
        setTilt(-14);
        const t1 = setTimeout(() => setTilt(14), 100);
        const t2 = setTimeout(() => setTilt(-10), 200);
        const t3 = setTimeout(() => setTilt(8), 300);
        const t4 = setTimeout(() => setTilt(-4), 400);
        const t5 = setTimeout(() => setTilt(0), 500);

        // Pick context-aware encouraging error message
        let errMsg = "Oops! Something's not right 🤔";
        if (errorMessage && typeof errorMessage === 'string') {
          const lower = errorMessage.toLowerCase();
          if (lower.includes('date of birth') || lower.includes('dob')) {
            errMsg = 'Check DOB: DDMMYYYY format (e.g. 14052003) 🎂';
          } else if (lower.includes('register') || lower.includes('student')) {
            errMsg = 'Oops! Check your Reg No & DOB 🧐';
          } else if (lower.includes('username') || lower.includes('password') || lower.includes('faculty') || lower.includes('admin')) {
            errMsg = 'Uh-oh! Incorrect username or password 🔑';
          } else if (errorMessage.length <= 48) {
            errMsg = errorMessage;
          } else {
            errMsg = 'Oops! Check your details and try again 🧐';
          }
        } else if (role === 'STUDENT') {
          errMsg = 'Oops! Check your Reg No & DOB (DDMMYYYY) 🧐';
        } else {
          errMsg = 'Uh-oh! Check your faculty username & password 🔑';
        }

        const targetPos = typeof window !== 'undefined' && window.innerWidth > 768
          ? { top: '85px', left: '70px' }
          : { top: '45px', left: '25px' };

        flyTo(targetPos, errMsg, 'worried');

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
          clearTimeout(t5);
        };
      }
      default:
        setSpeech(role === 'STUDENT' ? "Hi! I'm Robert 👋 Watching over your portal!" : "Admin Portal Ready 🛡️");
        setExpression('normal');
        break;
    }
  }, [activeField, role, errorMessage]);

  const handleClick = () => {
    if (expression === 'worried') {
      setExpression('happy');
      setSpeech("Don't worry! Double-check & try again! 💪");
      setTilt(14);
      setTimeout(() => setTilt(-14), 160);
      setTimeout(() => {
        setTilt(0);
        setExpression('worried');
      }, 1600);
      return;
    }
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
          className={`robert-bubble absolute top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-[11px] text-[10.5px] font-bold whitespace-nowrap shadow-xl backdrop-blur-md pointer-events-none transition-all duration-300 ${
            bubbleDir === 'left' ? 'right-[44px]' : 'left-[44px]'
          } ${
            expression === 'worried'
              ? 'bg-[#2b0b14]/96 border border-rose-400/90 text-rose-100 shadow-[0_8px_20px_rgba(225,29,72,0.4)]'
              : 'bg-[#012357]/96 border border-cyan-400/75 text-white shadow-[0_8px_20px_rgba(0,15,50,0.45)]'
          }`}
        >
          {speech}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 border-4 border-transparent ${
              bubbleDir === 'left' 
                ? (expression === 'worried' ? 'left-full border-l-[#2b0b14]' : 'left-full border-l-[#012357]')
                : (expression === 'worried' ? 'right-full border-r-[#2b0b14]' : 'right-full border-r-[#012357]')
            }`} 
          />
        </div>

        {/* Compact 34px Exact Orb */}
        <div 
          className="robert-orb w-[34px] h-[34px] rounded-full relative cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-115 active:scale-95"
          onClick={handleClick}
          onMouseEnter={() => {
            if (expression !== 'worried') setExpression('happy');
          }}
          onMouseLeave={() => {
            if (expression !== 'worried') setExpression(activeField === 'idle' ? 'normal' : 'happy');
          }}
          title={expression === 'worried' ? "Click Robert for encouragement!" : "Click to play with Robert!"}
          style={{
            background: expression === 'worried'
              ? 'radial-gradient(circle at 36% 30%, #FDA4AF 0%, #E11D48 36%, #9F1239 72%, #4C0519 100%)'
              : 'radial-gradient(circle at 36% 30%, #93C5FD 0%, #3B82F6 36%, #1D4ED8 72%, #0F172A 100%)',
            boxShadow: expression === 'worried'
              ? '0 6px 18px -2px rgba(225, 29, 72, 0.7), 0 0 16px rgba(244, 63, 94, 0.65), inset 0 -2.5px 5px rgba(15, 23, 42, 0.5), inset 0 2px 3.5px rgba(255, 255, 255, 0.9)'
              : '0 6px 16px -2px rgba(37, 99, 235, 0.6), 0 0 14px rgba(59, 130, 246, 0.5), inset 0 -2.5px 5px rgba(15, 23, 42, 0.5), inset 0 2px 3.5px rgba(255, 255, 255, 0.9)',
            border: expression === 'worried'
              ? '1.5px solid rgba(253, 164, 175, 0.85)'
              : '1.5px solid rgba(147, 197, 253, 0.55)'
          }}
        >
          {/* Subtle glowing halo */}
          <div 
            className={`robert-halo absolute -inset-1 rounded-full blur-sm pointer-events-none transition-colors duration-300 ${
              expression === 'worried' ? 'bg-rose-500/50' : 'bg-cyan-400/40'
            }`} 
          />

          {/* Expressive Face */}
          <div 
            className="robert-face flex flex-col items-center justify-center transition-transform duration-250"
            style={{
              transform: expression === 'worried'
                ? 'translate(0.5px, 2px)'
                : expression === 'look-down-right'
                  ? 'translate(2.5px, 2.5px)'
                  : 'translate(1px, -1.5px)'
            }}
          >
            <div className="flex items-center gap-[4px]">
              {/* Left Eye */}
              <div 
                className="robert-eye w-[4.5px] rounded-full transition-all duration-200"
                style={{
                  height: expression === 'worried' 
                    ? '8px' 
                    : expression === 'happy' 
                      ? '7.5px' 
                      : expression === 'surprised' 
                        ? '12px' 
                        : '9.5px',
                  borderRadius: expression === 'worried'
                    ? '3px'
                    : expression === 'happy' 
                      ? '5px 5px 0 0' 
                      : '999px',
                  backgroundColor: expression === 'worried' ? '#FFE4E6' : '#FFFFFF',
                  transform: expression === 'worried'
                    ? 'rotate(-22deg) scaleY(0.8)'
                    : expression === 'wink' 
                      ? 'scaleY(0.1)' 
                      : 'none',
                  boxShadow: expression === 'worried'
                    ? '0 0 4px #FDA4AF, 0 0 7px rgba(244, 63, 94, 0.85)'
                    : '0 0 4px #FFFFFF, 0 0 7px rgba(255, 255, 255, 0.85)',
                  animation: expression === 'worried' ? 'none' : 'robertEyeBlink 4s infinite'
                }}
              />
              {/* Right Eye */}
              <div 
                className="robert-eye w-[4.5px] rounded-full transition-all duration-200"
                style={{
                  height: expression === 'worried' 
                    ? '8px' 
                    : expression === 'happy' 
                      ? '7.5px' 
                      : expression === 'surprised' 
                        ? '12px' 
                        : '9.5px',
                  borderRadius: expression === 'worried'
                    ? '3px'
                    : expression === 'happy' 
                      ? '5px 5px 0 0' 
                      : '999px',
                  backgroundColor: expression === 'worried' ? '#FFE4E6' : '#FFFFFF',
                  transform: expression === 'worried'
                    ? 'rotate(22deg) scaleY(0.8)'
                    : expression === 'wink' 
                      ? 'scale(1.2)' 
                      : 'none',
                  boxShadow: expression === 'worried'
                    ? '0 0 4px #FDA4AF, 0 0 7px rgba(244, 63, 94, 0.85)'
                    : '0 0 4px #FFFFFF, 0 0 7px rgba(255, 255, 255, 0.85)',
                  animation: expression === 'worried' ? 'none' : 'robertEyeBlink 4s infinite'
                }}
              />
            </div>
            {/* Cute worried mouth line when troubled */}
            {expression === 'worried' && (
              <div className="w-[5px] h-[1.5px] bg-rose-200/90 rounded-full mt-[2px] transition-all animate-pulse" />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RobertMascot;
