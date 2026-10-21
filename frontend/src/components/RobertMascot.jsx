import React, { useState, useEffect, useRef } from 'react';

/**
 * RobertMascot Component
 * - Rest in Motion: Robert hovers gently in place. NEVER moves across the screen unintentionally.
 * - Strictly Left-Side Safe Zones: Confined to the left hero area, at least 350px away from typing fields!
 * - OLED Visor Face: Dark glossy faceplate ensuring the glowing LED eyes and expressive mouth are 100% crystal-clear and bold.
 * - Expressive Animated Mouth:
 *     - Bold glowing smile arc (⌒) when happy/idle.
 *     - Active talking chatter mouth during typewriter speech.
 *     - Cute open 'o' mouth when surprised.
 *     - Sad downturned frown (∩) in soft coral rose on error.
 *     - Playful wink smirk.
 * - Typewriter Speech Engine: Characters type out smoothly with blinking cursor while Robert chatters.
 */
export const RobertMascot = ({ activeField = 'idle', role = 'STUDENT', errorMessage = '' }) => {
  // Flight & Position state - strictly anchored to the safe left side
  const [position, setPosition] = useState({ top: '95px', left: '70px' });
  const [isMoving, setIsMoving] = useState(false);
  const [flightTilt, setFlightTilt] = useState(0);
  const [isHopping, setIsHopping] = useState(false);

  // Speech & Typewriter state
  const [typedSpeech, setTypedSpeech] = useState("Hi! I'm Robert 👋 Click a field to sign in!");
  const [isTyping, setIsTyping] = useState(false);

  // Facial Expression & Eye Tracking
  const [expression, setExpression] = useState('normal'); // 'normal' | 'happy' | 'talking' | 'wink' | 'surprised' | 'worried'
  const [eyeGlance, setEyeGlance] = useState({ x: 0, y: 0 });
  const [isWobbling, setIsWobbling] = useState(false);

  // Refs for tracking active intervals and animations
  const typingTimerRef = useRef(null);
  const flightTimerRef = useRef(null);
  const wobbleTimerRef = useRef(null);
  const hopTimerRef = useRef(null);
  const prevFieldRef = useRef(activeField);
  const perchIdxRef = useRef(0);

  // ============================================================
  // STRICT LEFT-SIDE SAFE PERCH ENGINE (Never enters typing area!)
  // ============================================================
  const getSafeLeftPerch = () => {
    if (typeof window === 'undefined') return { top: '95px', left: '70px' };
    const winW = window.innerWidth;

    // Mobile / Tablet: Sit safely at the very top, well above the centered card
    if (winW < 1024) {
      return { top: '35px', left: '35px' };
    }

    // Desktop: Dedicated perches on the LEFT HERO art area (columns 1-7)
    // The typing fields are in columns 8-12 on the right side (>700px).
    // All perches here have left <= 100px, leaving a 350px+ clear buffer!
    const desktopPerches = [
      { top: '95px', left: '70px' },   // Upper Left Banner
      { top: '190px', left: '80px' },  // Bento Card Top Margin
      { top: '140px', left: '105px' }  // Upper Hero Center-Left
    ];

    perchIdxRef.current = (perchIdxRef.current + 1) % desktopPerches.length;
    return desktopPerches[perchIdxRef.current];
  };

  // ============================================================
  // TYPEWRITER ENGINE (Types out message character by character)
  // ============================================================
  const triggerTypewriter = (text, finalExpression = 'happy') => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    setTypedSpeech('');
    setIsTyping(true);
    setExpression('talking');

    let charIdx = 0;
    typingTimerRef.current = setInterval(() => {
      charIdx++;
      setTypedSpeech(text.slice(0, charIdx));

      if (charIdx >= text.length) {
        clearInterval(typingTimerRef.current);
        setIsTyping(false);
        setExpression(finalExpression);
      }
    }, 28);
  };

  // Gentle hop in place (used when switching fields so Robert doesn't fly wildly)
  const hopAndSpeak = (text, nextExpr = 'happy') => {
    setIsHopping(true);
    if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
    hopTimerRef.current = setTimeout(() => setIsHopping(false), 350);

    triggerTypewriter(text, nextExpr);
  };

  // Safe flight (moves smoothly within left-side hero zone, hides bubble during flight)
  const flyToSafePerch = (text, nextExpr = 'happy') => {
    const curX = parseInt(position.left, 10) || 70;
    const newPos = getSafeLeftPerch();

    const deltaX = parseInt(newPos.left, 10) - curX;
    setFlightTilt(deltaX > 15 ? 10 : deltaX < -15 ? -10 : 0);

    setIsMoving(true);
    setPosition(newPos);

    if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
    flightTimerRef.current = setTimeout(() => {
      setIsMoving(false);
      setFlightTilt(0);
      triggerTypewriter(text, nextExpr);
    }, 850);
  };

  // ============================================================
  // REST IN MOTION: Subtle eye glances while idling in place
  // ============================================================
  useEffect(() => {
    if (activeField !== 'idle' || isMoving) return;

    const glanceDirections = [
      { x: 0, y: 0 },
      { x: -1.2, y: 0 },
      { x: 1.2, y: 0 },
      { x: 0, y: 0.8 },
      { x: 0, y: 0 }
    ];
    let step = 0;

    const eyeInterval = setInterval(() => {
      step = (step + 1) % glanceDirections.length;
      setEyeGlance(glanceDirections[step]);
    }, 3800);

    return () => clearInterval(eyeInterval);
  }, [activeField, isMoving]);

  // ============================================================
  // REACTIVE FIELD HANDLER: Moves ONLY when user clicks a field
  // ============================================================
  useEffect(() => {
    const prevField = prevFieldRef.current;
    prevFieldRef.current = activeField;

    // When returning to idle: Robert stays at rest, no movement!
    if (activeField === 'idle') {
      if (prevField !== 'idle') {
        setExpression('normal');
      }
      return;
    }

    // User clicked a field -> Guide them safely from his left perch!
    switch (activeField) {
      case 'reg': {
        // If already positioned on left hero, hop in place and speak; otherwise fly to perch
        if (prevField === 'idle') {
          flyToSafePerch('Enter register number 🎓', 'happy');
        } else {
          hopAndSpeak('Enter register number 🎓', 'happy');
        }
        break;
      }
      case 'dob': {
        hopAndSpeak('Enter DOB (DDMMYYYY) 🎂', 'happy');
        break;
      }
      case 'adminUser': {
        if (prevField === 'idle') {
          flyToSafePerch('Enter faculty username 👤', 'happy');
        } else {
          hopAndSpeak('Enter faculty username 👤', 'happy');
        }
        break;
      }
      case 'adminPass': {
        hopAndSpeak('Enter admin password 🔒', 'happy');
        break;
      }
      case 'loading': {
        hopAndSpeak('Checking credentials... ⚡', 'surprised');
        break;
      }
      case 'success': {
        flyToSafePerch('Access Granted! Welcome! 🎉', 'happy');
        break;
      }
      case 'error': {
        setIsWobbling(true);
        if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
        wobbleTimerRef.current = setTimeout(() => setIsWobbling(false), 600);

        let errMsg = "Oops! Check your details 🧐";
        if (errorMessage && typeof errorMessage === 'string') {
          const lower = errorMessage.toLowerCase();
          if (lower.includes('date of birth') || lower.includes('dob')) {
            errMsg = 'Check DOB: DDMMYYYY format (e.g. 14052003) 🎂';
          } else if (lower.includes('register') || lower.includes('student')) {
            errMsg = 'Oops! Check your Reg No & DOB 🧐';
          } else if (lower.includes('username') || lower.includes('password') || lower.includes('admin')) {
            errMsg = 'Uh-oh! Check username & password 🔑';
          } else if (errorMessage.length <= 48) {
            errMsg = errorMessage;
          }
        } else if (role === 'STUDENT') {
          errMsg = 'Oops! Check your Reg No & DOB (DDMMYYYY) 🧐';
        } else {
          errMsg = 'Uh-oh! Check faculty username & password 🔑';
        }

        hopAndSpeak(errMsg, 'worried');
        break;
      }
      default:
        break;
    }
  }, [activeField, role, errorMessage]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
      if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
    };
  }, []);

  // Playful interaction when user clicks Robert directly
  const handleRobertClick = () => {
    if (expression === 'worried') {
      setExpression('happy');
      triggerTypewriter("Don't worry! Double-check & try again! 💪", 'happy');
      return;
    }

    setExpression('wink');
    setFlightTilt(360);
    setTimeout(() => {
      setFlightTilt(0);
      hopAndSpeak("Hehe! I'm Robert! 🚀", 'happy');
    }, 450);
  };

  const isWorried = expression === 'worried';

  return (
    <div
      id="robertContainer"
      style={{
        top: position.top,
        left: position.left,
        transform: `rotate(${flightTilt}deg) ${isHopping ? 'translateY(-10px)' : ''} ${isWobbling ? 'scale(1.08)' : 'scale(1)'}`,
        transition: 'top 0.85s cubic-bezier(0.22, 1, 0.36, 1), left 0.85s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s ease'
      }}
    >
      {/* Rest in Motion: Gentle vertical breathing hover bob in place */}
      <div className={`relative ${!isMoving && !isHopping ? 'robert-hover-bob' : ''}`}>
        
        {/* Adaptive Speech Bubble with Typewriter Text */}
        <div 
          className={`robert-bubble left-[48px] ${
            isMoving ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
          } ${
            isWorried
              ? 'bg-[#2b0b14]/96 border-rose-400/90 text-rose-100 shadow-[0_8px_20px_rgba(225,29,72,0.4)]'
              : 'bg-[#012357]/96 border-cyan-400/75 text-white shadow-[0_8px_20px_rgba(0,15,50,0.45)]'
          }`}
        >
          <span>{typedSpeech}</span>
          {/* Animated blinking typing cursor */}
          {isTyping && <span className="robert-cursor" />}

          {/* Speech Bubble Pointer Arrow */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 right-full border-4 border-transparent ${
              isWorried ? 'border-r-[#2b0b14]' : 'border-r-[#012357]'
            }`} 
          />
        </div>

        {/* Robert Orb (40px Futuristic Companion) */}
        <div 
          className="robert-orb"
          onClick={handleRobertClick}
          onMouseEnter={() => {
            if (!isWorried && !isTyping) setExpression('happy');
          }}
          onMouseLeave={() => {
            if (!isWorried && !isTyping) setExpression(activeField === 'idle' ? 'normal' : 'happy');
          }}
          title={isWorried ? "Click Robert for encouragement!" : "Click to play with Robert!"}
          style={{
            background: isWorried
              ? 'radial-gradient(circle at 36% 30%, #FDA4AF 0%, #E11D48 36%, #9F1239 72%, #4C0519 100%)'
              : 'radial-gradient(circle at 36% 30%, #93C5FD 0%, #3B82F6 36%, #1D4ED8 72%, #0F172A 100%)',
            boxShadow: isWorried
              ? '0 6px 18px -2px rgba(225, 29, 72, 0.7), 0 0 16px rgba(244, 63, 94, 0.65), inset 0 -2.5px 5px rgba(15, 23, 42, 0.5), inset 0 2px 3.5px rgba(255, 255, 255, 0.9)'
              : '0 6px 16px -2px rgba(37, 99, 235, 0.6), 0 0 16px rgba(59, 130, 246, 0.5), inset 0 -2.5px 5px rgba(15, 23, 42, 0.5), inset 0 2px 3.5px rgba(255, 255, 255, 0.9)',
            border: isWorried
              ? '1.5px solid rgba(253, 164, 175, 0.85)'
              : '1.5px solid rgba(147, 197, 253, 0.65)'
          }}
        >
          {/* Glowing Halo */}
          <div 
            className={`robert-halo ${isWorried ? 'bg-rose-500/50' : 'bg-cyan-400/40'}`} 
          />

          {/* High-Contrast OLED Visor Face Screen (Ensures mouth and eyes POP crystal-clear) */}
          <div className={`robert-visor ${isWorried ? 'robert-visor-worried' : ''}`}>
            
            {/* Eyes Row with Natural Glance Tracking */}
            <div 
              className="robert-eyes-row"
              style={{
                transform: `translate(${eyeGlance.x}px, ${eyeGlance.y}px)`
              }}
            >
              {/* Soft Left Blush */}
              <div className={`robert-blush ${isWorried ? 'robert-blush-worried' : ''}`} />

              {/* Left Eye */}
              {expression === 'happy' ? (
                // Happy curved smile eye (^)
                <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
                  <path d="M 1 4.5 Q 3.5 1 6 4.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : expression === 'wink' ? (
                // Playful wink slit (-)
                <div className="w-[5.5px] h-[2px] bg-white rounded-full shadow-[0_0_5px_#38bdf8]" />
              ) : expression === 'worried' ? (
                // Worried angled eye (\)
                <div 
                  className="w-[4px] h-[8px] bg-[#FFE4E6] rounded-full shadow-[0_0_5px_#FDA4AF]"
                  style={{ transform: 'rotate(-22deg) scaleY(0.85)' }}
                />
              ) : expression === 'surprised' ? (
                // Surprised large open eye (O)
                <div className="w-[5px] h-[8px] bg-white rounded-full shadow-[0_0_6px_#fff]" />
              ) : (
                // Normal & Talking sleek pill eye with natural blink
                <div className="robert-eye" />
              )}

              {/* Right Eye */}
              {expression === 'happy' ? (
                // Happy curved smile eye (^)
                <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
                  <path d="M 1 4.5 Q 3.5 1 6 4.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : expression === 'wink' ? (
                // Open sparkling right eye on wink
                <div className="w-[4px] h-[8.5px] bg-white rounded-full shadow-[0_0_6px_#fff] scale-110" />
              ) : expression === 'worried' ? (
                // Worried angled eye (/)
                <div 
                  className="w-[4px] h-[8px] bg-[#FFE4E6] rounded-full shadow-[0_0_5px_#FDA4AF]"
                  style={{ transform: 'rotate(22deg) scaleY(0.85)' }}
                />
              ) : expression === 'surprised' ? (
                // Surprised large open eye (O)
                <div className="w-[5px] h-[8px] bg-white rounded-full shadow-[0_0_6px_#fff]" />
              ) : (
                // Normal & Talking sleek pill eye with natural blink
                <div className="robert-eye" />
              )}

              {/* Soft Right Blush */}
              <div className={`robert-blush ${isWorried ? 'robert-blush-worried' : ''}`} />
            </div>

            {/* Expressive Mouth (Bold, high-contrast, crystal clear) */}
            <div className="robert-mouth mt-[1px]">
              {isWorried ? (
                // Worried sad frown (∩) in soft coral pink
                <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
                  <path 
                    d="M 1.8 4.5 Q 6 1 10.2 4.5" 
                    stroke="#FDA4AF" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    style={{ filter: 'drop-shadow(0 0 3px #f43f5e)' }}
                  />
                </svg>
              ) : expression === 'surprised' ? (
                // Surprised cute 'o' mouth
                <div className="w-[4.5px] h-[4.5px] rounded-full border-[1.8px] border-white shadow-[0_0_4px_#38bdf8]" />
              ) : expression === 'talking' || isTyping ? (
                // Talking chatter mouth (animates rhythmically while typing out message)
                <svg width="12" height="6.5" viewBox="0 0 12 6.5" fill="none" className="robert-mouth-chatter">
                  <path d="M 2 1.5 Q 6 6 10 1.5 Q 6 3.2 2 1.5 Z" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.4" />
                </svg>
              ) : expression === 'wink' ? (
                // Playful smirk mouth
                <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
                  <path 
                    d="M 2 2 Q 6 5.5 10.5 1.2" 
                    stroke="#FFFFFF" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    style={{ filter: 'drop-shadow(0 0 3px #38bdf8)' }}
                  />
                </svg>
              ) : (
                // Normal & Happy warm glowing smile (⌒)
                <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
                  <path 
                    d="M 1.8 1.8 Q 6 5.5 10.2 1.8" 
                    stroke="#FFFFFF" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    style={{ filter: 'drop-shadow(0 0 3px #38bdf8)' }}
                  />
                </svg>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RobertMascot;
