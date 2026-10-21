import React, { useState, useEffect, useRef } from 'react';

/**
 * RobertMascot Component
 * - Rest in Motion: Robert hovers gently in place when idle. NEVER moves across the screen unintentionally.
 * - Field-Click Triggered: Moves ONLY when a typing field is clicked / focused.
 * - Forbidden Typing Area: Avoids the entire login form / typing field area with a safety buffer.
 * - Message Flight & Typewriter: Speech bubble hides during flight and types out with a typewriter animation after landing!
 * - Redesigned Face with Mouth & Expressions:
 *     - Retains the exact sleek 35px glossy futuristic orb design.
 *     - Expressive SVG Mouth (Smile, Talking Chatter, Surprised 'o', Worried frown, Playful smirk).
 *     - Lively Eyes (Natural blinking, idle eye glance tracking, happy smile arcs, wink, surprised, worried).
 *     - Soft glowing cheek blush dots.
 */
export const RobertMascot = ({ activeField = 'idle', role = 'STUDENT', errorMessage = '' }) => {
  // Flight & Position state
  const [position, setPosition] = useState({ top: '75px', left: '75px' });
  const [isMoving, setIsMoving] = useState(false);
  const [flightTilt, setFlightTilt] = useState(0);
  const [bubbleDir, setBubbleDir] = useState('right');

  // Speech & Typewriter state
  const [targetSpeech, setTargetSpeech] = useState("Hi! I'm Robert 👋 Click a field to sign in!");
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
  const prevFieldRef = useRef(activeField);

  // ============================================================
  // SAFE COORDINATE ENGINE (Strictly Avoids Typing Fields Area)
  // ============================================================
  const getSafeCoordinate = () => {
    if (typeof window === 'undefined') return { top: '75px', left: '75px', x: 75, y: 75 };
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Detect the typing field container (Login Auth Panel / Form)
    const authPanel = document.getElementById('loginAuthPanel') || document.querySelector('form');
    const authRect = authPanel ? authPanel.getBoundingClientRect() : null;

    // Detect Left Hero Panel (desktop bento area - prime safe spot)
    const heroPanel = document.getElementById('loginHeroPanel');
    const heroRect = (heroPanel && heroPanel.offsetWidth > 0 && winW >= 1024)
      ? heroPanel.getBoundingClientRect()
      : null;

    // Strategy 1: Desktop Left Hero area (completely clear of typing fields)
    if (heroRect && heroRect.width > 120) {
      const minX = Math.max(35, Math.round(heroRect.left + 30));
      // Auth panel is to the right. A speech bubble extends up to 210px to the right.
      // Robert's x + 210px must be strictly less than authRect.left to never touch typing fields!
      const maxBubbleWidth = 210;
      const boundaryRight = authRect ? authRect.left : heroRect.right;
      const safeMaxX = Math.max(minX + 25, Math.round(boundaryRight - maxBubbleWidth - 30));
      const maxX = Math.min(safeMaxX, Math.round(heroRect.right - 90));

      const minY = Math.max(45, Math.round(heroRect.top + 35));
      const maxY = Math.max(minY + 30, Math.round(heroRect.bottom - 60));

      const targetX = Math.floor(Math.random() * (Math.max(minX, maxX) - minX + 1)) + minX;
      const targetY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      return { top: `${targetY}px`, left: `${targetX}px`, x: targetX, y: targetY };
    }

    // Strategy 2: Test random viewport coordinates, strictly rejecting the typing area
    const minScreenX = 30;
    const maxScreenX = winW - 65;
    const minScreenY = 30;
    const maxScreenY = winH - 65;

    for (let attempt = 0; attempt < 30; attempt++) {
      const candX = Math.floor(Math.random() * (maxScreenX - minScreenX)) + minScreenX;
      const candY = Math.floor(Math.random() * (maxScreenY - minScreenY)) + minScreenY;

      if (authRect) {
        // Enforce 50px safety buffer around all sides of typing field area
        const buffer = 50;
        const insideForbidden =
          candX >= (authRect.left - buffer) &&
          candX <= (authRect.right + buffer) &&
          candY >= (authRect.top - buffer) &&
          candY <= (authRect.bottom + buffer);

        if (insideForbidden) continue;
      }

      return { top: `${candY}px`, left: `${candX}px`, x: candX, y: candY };
    }

    // Reliable fallback (safe top-left margin)
    return { top: '55px', left: '45px', x: 45, y: 55 };
  };

  // ============================================================
  // TYPEWRITER ENGINE (Types out message character by character)
  // ============================================================
  const triggerTypewriter = (text, finalExpression = 'happy') => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    setTargetSpeech(text);
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

  // ============================================================
  // FLIGHT CONTROLLER (Moves ONLY when triggered, then types)
  // ============================================================
  const flyToSafeSpot = (text, nextExpr = 'happy') => {
    const curX = parseInt(position.left, 10) || 75;
    const newPos = getSafeCoordinate();

    // Natural tilt into the wind of motion
    const deltaX = newPos.x - curX;
    setFlightTilt(deltaX > 20 ? 12 : deltaX < -20 ? -12 : 0);

    // Auto-adjust speech bubble direction so it stays on-screen
    if (typeof window !== 'undefined' && newPos.x > window.innerWidth - 240) {
      setBubbleDir('left');
    } else {
      setBubbleDir('right');
    }

    // Hide speech bubble during flight
    setIsMoving(true);
    setPosition({ top: newPos.top, left: newPos.left });

    // Flight takes 850ms (matches CSS transition)
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
    flightTimerRef.current = setTimeout(() => {
      setIsMoving(false);
      setFlightTilt(0);
      triggerTypewriter(text, nextExpr);
    }, 850);
  };

  // ============================================================
  // REST IN MOTION: Subtle eye glance shifts while idling in place
  // ============================================================
  useEffect(() => {
    if (activeField !== 'idle' || isMoving) return;

    const glanceDirections = [
      { x: 0, y: 0 },
      { x: -1.5, y: 0 },
      { x: 1.5, y: 0 },
      { x: 0, y: 1 },
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
  // REACTIVE FIELD CLICK HANDLER: Moves ONLY on field focus/events
  // ============================================================
  useEffect(() => {
    const prevField = prevFieldRef.current;
    prevFieldRef.current = activeField;

    // When returning to idle: Robert stays at rest, no extra flight!
    if (activeField === 'idle') {
      if (prevField !== 'idle') {
        setExpression('normal');
      }
      return;
    }

    // User clicked a typing field -> Initiate flight away from typing area!
    switch (activeField) {
      case 'reg': {
        flyToSafeSpot('Enter register number 🎓', 'happy');
        break;
      }
      case 'dob': {
        flyToSafeSpot('Enter DOB (DDMMYYYY) 🎂', 'happy');
        break;
      }
      case 'adminUser': {
        flyToSafeSpot('Enter faculty username 👤', 'happy');
        break;
      }
      case 'adminPass': {
        flyToSafeSpot('Enter admin password 🔒', 'happy');
        break;
      }
      case 'loading': {
        flyToSafeSpot('Checking credentials... ⚡', 'surprised');
        break;
      }
      case 'success': {
        flyToSafeSpot('Access Granted! Welcome! 🎉', 'happy');
        break;
      }
      case 'error': {
        // Trigger worried head-shake tilt wobble
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

        flyToSafeSpot(errMsg, 'worried');
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
      flyToSafeSpot("Catch me if you can! 🚀", 'happy');
    }, 400);
  };

  const isWorried = expression === 'worried';

  return (
    <div
      id="robertContainer"
      style={{
        top: position.top,
        left: position.left,
        transform: `rotate(${flightTilt}deg) ${isWobbling ? 'scale(1.08)' : 'scale(1)'}`,
        transition: 'top 0.85s cubic-bezier(0.22, 1, 0.36, 1), left 0.85s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s ease'
      }}
    >
      {/* Rest in Motion: Gentle vertical hover bobbing in place */}
      <div className={`relative ${!isMoving ? 'robert-hover-bob' : ''}`}>
        
        {/* Adaptive Speech Bubble with Typewriter Text */}
        <div 
          className={`robert-bubble ${
            bubbleDir === 'left' ? 'right-[45px]' : 'left-[45px]'
          } ${
            isMoving ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
          } ${
            isWorried
              ? 'bg-[#2b0b14]/96 border-rose-400/90 text-rose-100 shadow-[0_8px_20px_rgba(225,29,72,0.4)]'
              : 'bg-[#012357]/96 border-cyan-400/75 text-white shadow-[0_8px_20px_rgba(0,15,50,0.45)]'
          }`}
        >
          <span>{typedSpeech}</span>
          {/* Animated typing cursor */}
          {isTyping && <span className="robert-cursor" />}

          {/* Speech Bubble Pointer Arrow */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 border-4 border-transparent ${
              bubbleDir === 'left' 
                ? (isWorried ? 'left-full border-l-[#2b0b14]' : 'left-full border-l-[#012357]')
                : (isWorried ? 'right-full border-r-[#2b0b14]' : 'right-full border-r-[#012357]')
            }`} 
          />
        </div>

        {/* Robert Orb (Refined 35px Futuristic Sphere) */}
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
              : '0 6px 16px -2px rgba(37, 99, 235, 0.6), 0 0 14px rgba(59, 130, 246, 0.5), inset 0 -2.5px 5px rgba(15, 23, 42, 0.5), inset 0 2px 3.5px rgba(255, 255, 255, 0.9)',
            border: isWorried
              ? '1.5px solid rgba(253, 164, 175, 0.85)'
              : '1.5px solid rgba(147, 197, 253, 0.55)'
          }}
        >
          {/* Glowing Halo */}
          <div 
            className={`robert-halo ${isWorried ? 'bg-rose-500/50' : 'bg-cyan-400/40'}`} 
          />

          {/* Expressive Face (Eyes + Mouth + Cheek Blushes) */}
          <div className="robert-face">
            
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
                <svg width="5.5" height="5.5" viewBox="0 0 6 6" fill="none">
                  <path d="M 1 4.5 Q 3 1.5 5 4.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : expression === 'wink' ? (
                // Playful wink slit
                <div className="w-[5px] h-[1.5px] bg-white rounded-full shadow-[0_0_4px_#fff]" />
              ) : expression === 'worried' ? (
                // Worried angled eye (\)
                <div 
                  className="w-[4.5px] h-[8px] bg-[#FFE4E6] rounded-full shadow-[0_0_5px_#FDA4AF]"
                  style={{ transform: 'rotate(-22deg) scaleY(0.85)' }}
                />
              ) : expression === 'surprised' ? (
                // Surprised large open eye
                <div className="w-[5px] h-[8.5px] bg-white rounded-full shadow-[0_0_6px_#fff]" />
              ) : (
                // Normal / Talking sleek pill eye with natural blink
                <div className="robert-eye" />
              )}

              {/* Right Eye */}
              {expression === 'happy' ? (
                // Happy curved smile eye (^)
                <svg width="5.5" height="5.5" viewBox="0 0 6 6" fill="none">
                  <path d="M 1 4.5 Q 3 1.5 5 4.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : expression === 'wink' ? (
                // Open sparkling right eye on wink
                <div className="w-[4.5px] h-[9px] bg-white rounded-full shadow-[0_0_6px_#fff] scale-110" />
              ) : expression === 'worried' ? (
                // Worried angled eye (/)
                <div 
                  className="w-[4.5px] h-[8px] bg-[#FFE4E6] rounded-full shadow-[0_0_5px_#FDA4AF]"
                  style={{ transform: 'rotate(22deg) scaleY(0.85)' }}
                />
              ) : expression === 'surprised' ? (
                // Surprised large open eye
                <div className="w-[5px] h-[8.5px] bg-white rounded-full shadow-[0_0_6px_#fff]" />
              ) : (
                // Normal / Talking sleek pill eye with natural blink
                <div className="robert-eye" />
              )}

              {/* Soft Right Blush */}
              <div className={`robert-blush ${isWorried ? 'robert-blush-worried' : ''}`} />
            </div>

            {/* Expressive Mouth */}
            <div className="robert-mouth mt-[1px]">
              {isWorried ? (
                // Worried sad frown (∩)
                <svg width="9" height="4.5" viewBox="0 0 9 4.5" fill="none">
                  <path d="M 1.8 3.5 Q 4.5 1.2 7.2 3.5" stroke="#FFE4E6" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              ) : expression === 'surprised' ? (
                // Surprised cute 'o' mouth
                <div className="w-[3px] h-[3.5px] rounded-full border-[1.2px] border-white shadow-[0_0_3px_#fff]" />
              ) : expression === 'talking' || isTyping ? (
                // Talking chatter mouth (animates while typing out message)
                <svg width="9" height="4.5" viewBox="0 0 9 4.5" fill="none" className="robert-mouth-chatter">
                  <path d="M 2 1.5 Q 4.5 4.5 7 1.5 Q 4.5 2.8 2 1.5 Z" fill="#FFFFFF" />
                </svg>
              ) : expression === 'wink' ? (
                // Playful smirk mouth
                <svg width="9" height="4.5" viewBox="0 0 9 4.5" fill="none">
                  <path d="M 1.8 2.5 Q 5 4.5 7.5 1.5" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              ) : (
                // Normal & Happy warm glowing smile (⌒)
                <svg width="9" height="4.5" viewBox="0 0 9 4.5" fill="none">
                  <path d="M 1.8 1.5 Q 4.5 4.2 7.2 1.5" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
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
