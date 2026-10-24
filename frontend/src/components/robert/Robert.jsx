import React, { useState, useEffect, useRef } from 'react';
import { useRobert } from '../../context/RobertContext';
import { useAuthModal } from '../../context/AuthModalContext';

/**
 * Global Robert Assistant Component
 * - Fixed Left-Gutter Perches: Strictly confined to the far left margin, guaranteed never to cover or overlap the center login dialog or register number banner.
 * - Reactive Only on Typing: Moves ONLY when the user clicks/focuses into an active input field.
 * - Gentle Float Transition: 1.1s smooth, "lite slow" float with flight tilt, landing in sync with typewriter guidance speech.
 * - Mobile Safe: Stays docked at bottom-left corner on mobile/tablets (<768px) so virtual keyboards and fields are completely unobstructed.
 */

const TYPING_FIELDS = [
  'reg',
  'studentPass',
  'signupReg',
  'signupDob',
  'signupName',
  'signupEmail',
  'signupPass',
  'signupConfirmPass',
  'adminUser',
  'adminPass'
];

export const Robert = () => {
  const { activeField, role, errorMessage, customSpeech, setCustomSpeech } = useRobert();
  const { isLoginOpen, openLogin } = useAuthModal();

  // Position & Flight states
  const [position, setPosition] = useState({ bottom: '28px', left: '28px', top: 'auto' });
  const [isMoving, setIsMoving] = useState(false);
  const [flightTilt, setFlightTilt] = useState(0);
  const [isHopping, setIsHopping] = useState(false);
  const [isWobbling, setIsWobbling] = useState(false);

  // Speech & Typewriter states
  const [typedSpeech, setTypedSpeech] = useState("Hi! I'm Robert 👋 Tap Login to get started.");
  const [isTyping, setIsTyping] = useState(false);

  // Facial Expression state
  const [expression, setExpression] = useState('happy'); // 'normal' | 'happy' | 'talking' | 'wink' | 'surprised' | 'worried'

  const typingTimerRef = useRef(null);
  const hopTimerRef = useRef(null);
  const wobbleTimerRef = useRef(null);
  const flightTimerRef = useRef(null);
  const speechDelayTimerRef = useRef(null);

  // Safe fixed positions strictly on the far-left margin (never covering the center card)
  const getTargetPosition = (field, modalOpen) => {
    if (typeof window === 'undefined') return { bottom: '28px', left: '28px', top: 'auto' };
    const isMobile = window.innerWidth < 768;

    // Mobile: keep docked safely at bottom-left corner so screen inputs & banners are never obstructed
    if (isMobile) {
      return { bottom: '16px', left: '16px', top: 'auto' };
    }

    // When login modal is closed or user is NOT in a typing field: stay at Home Base
    if (!modalOpen || !TYPING_FIELDS.includes(field)) {
      return { bottom: '28px', left: '28px', top: 'auto' };
    }

    // FIXED PERCHES ON FAR-LEFT MARGIN:
    // Left edge clamped <= 48px, leaves >150px clearance from the centered 460px dialog card!
    switch (field) {
      case 'reg':
      case 'signupReg':
        // Upper Perch (aligned comfortably with Register Number field)
        return { top: '22%', bottom: 'auto', left: 'clamp(20px, 3.5vw, 44px)' };

      case 'studentPass':
      case 'signupPass':
      case 'signupConfirmPass':
      case 'adminPass':
        // Mid-Lower Perch (aligned comfortably with Password field)
        return { top: '48%', bottom: 'auto', left: 'clamp(24px, 4vw, 52px)' };

      case 'signupName':
      case 'signupEmail':
      case 'signupDob':
      case 'adminUser':
      default:
        // Mid-Upper Perch (aligned comfortably with Name/Email/DOB/User fields)
        return { top: '35%', bottom: 'auto', left: 'clamp(20px, 3.5vw, 48px)' };
    }
  };

  // Typewriter Speech Engine
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
    }, 26);
  };

  // Gentle hop in place (used when staying on the same perch)
  const hopAndSpeak = (text, nextExpr = 'happy') => {
    setIsHopping(true);
    if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
    hopTimerRef.current = setTimeout(() => setIsHopping(false), 350);

    triggerTypewriter(text, nextExpr);
  };

  // Move smoothly ("lite slow" 1.1s glide) and speak on arrival
  const moveAndSpeak = (targetPos, speechText, expr = 'happy') => {
    const isDifferent =
      targetPos.top !== position.top ||
      targetPos.bottom !== position.bottom ||
      targetPos.left !== position.left;

    if (isDifferent) {
      // Flight tilt: subtle angle in direction of flight (-6deg when rising, +5deg when descending)
      const isRising = targetPos.top && (!position.top || parseInt(targetPos.top) < parseInt(position.top));
      setFlightTilt(isRising ? -6 : 5);
      setIsMoving(true);
      setPosition(targetPos);

      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
      if (speechDelayTimerRef.current) clearTimeout(speechDelayTimerRef.current);

      // Begin typewriter speech as Robert reaches the destination ("move on time")
      speechDelayTimerRef.current = setTimeout(() => {
        triggerTypewriter(speechText, expr);
      }, 420);

      // Gracefully settle into the fixed perch
      flightTimerRef.current = setTimeout(() => {
        setIsMoving(false);
        setFlightTilt(0);
      }, 1100);
    } else {
      hopAndSpeak(speechText, expr);
    }
  };

  // React to field focus, login modal state, and speech triggers
  useEffect(() => {
    if (customSpeech) {
      hopAndSpeak(customSpeech, 'happy');
      setCustomSpeech(null);
      return;
    }

    if (!isLoginOpen) {
      const homePos = getTargetPosition('landing', false);
      moveAndSpeak(homePos, "Hi! I'm Robert 👋 Tap Login to get started.", 'happy');
      return;
    }

    // Modal is open: handle fixed perches ONLY for typing fields
    const targetPos = getTargetPosition(activeField, true);

    switch (activeField) {
      case 'loginOpen': {
        // Modal just opened: Robert stays at Home Base! (He only moves if user clicks typing field)
        moveAndSpeak(targetPos, 'Click a field to sign in! 🚀', 'happy');
        break;
      }
      case 'reg': {
        moveAndSpeak(targetPos, 'Enter your Register Number 🎓', 'happy');
        break;
      }
      case 'studentPass': {
        moveAndSpeak(targetPos, 'Enter your account password 🔑', 'happy');
        break;
      }
      case 'signupReg': {
        moveAndSpeak(targetPos, 'Enter your Register Number 🎓', 'happy');
        break;
      }
      case 'signupDob': {
        moveAndSpeak(targetPos, 'Select your Date of Birth 🎂', 'happy');
        break;
      }
      case 'signupName': {
        moveAndSpeak(targetPos, 'Enter your Full Name ✍️', 'happy');
        break;
      }
      case 'signupEmail': {
        moveAndSpeak(targetPos, 'Enter your college email ✉️', 'happy');
        break;
      }
      case 'signupPass': {
        moveAndSpeak(targetPos, 'Choose a strong password 🔒', 'happy');
        break;
      }
      case 'signupConfirmPass': {
        moveAndSpeak(targetPos, 'Confirm your password 🔑', 'happy');
        break;
      }
      case 'match': {
        hopAndSpeak('Pre-registration verified! ✅', 'happy');
        break;
      }
      case 'no_match': {
        hopAndSpeak('No matching record found 🧐', 'worried');
        break;
      }
      case 'already_registered': {
        hopAndSpeak('Account already created! Sign in 👉', 'happy');
        break;
      }
      case 'verifying': {
        hopAndSpeak('Checking eligibility... 🔍', 'surprised');
        break;
      }
      case 'adminUser': {
        moveAndSpeak(targetPos, 'Enter faculty username 👤', 'happy');
        break;
      }
      case 'adminPass': {
        moveAndSpeak(targetPos, 'Enter admin password 🔒', 'happy');
        break;
      }
      case 'loading': {
        hopAndSpeak('Authenticating... ⚡', 'surprised');
        break;
      }
      case 'success': {
        hopAndSpeak('Access Granted! Welcome! 🎉', 'happy');
        break;
      }
      case 'error': {
        setIsWobbling(true);
        if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
        wobbleTimerRef.current = setTimeout(() => setIsWobbling(false), 600);

        let errMsg = 'Oops! Check your credentials 🧐';
        if (errorMessage && typeof errorMessage === 'string') {
          if (errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('admin')) {
            errMsg = 'Uh-oh! Check username & password 🔑';
          } else if (errorMessage.length <= 48) {
            errMsg = errorMessage;
          }
        }
        hopAndSpeak(errMsg, 'worried');
        break;
      }
      case 'idle':
      default: {
        // User blurred or finished typing: glide smoothly back to Home Base!
        const basePos = getTargetPosition('idle', true);
        moveAndSpeak(basePos, "I'm right here if you need help signing in! 😊", 'happy');
        break;
      }
    }
  }, [activeField, isLoginOpen, customSpeech, errorMessage, role]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
      if (speechDelayTimerRef.current) clearTimeout(speechDelayTimerRef.current);
    };
  }, []);

  const handleRobertClick = () => {
    if (!isLoginOpen) {
      hopAndSpeak('Ready to access the portal? Tap Login at the top right! 🚀', 'wink');
    } else {
      hopAndSpeak("I'm right here if you need help signing in! 😊", 'happy');
    }
  };

  const isWorried = expression === 'worried';

  return (
    <div
      style={{
        position: 'fixed',
        ...position,
        zIndex: isLoginOpen ? 60 : 40,
        transform: `rotate(${flightTilt}deg) ${isHopping ? 'translateY(-10px)' : ''}`,
        transition: 'top 1.1s cubic-bezier(0.22, 1, 0.36, 1), bottom 1.1s cubic-bezier(0.22, 1, 0.36, 1), left 1.1s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
      }}
      className="select-none pointer-events-auto"
    >
      {/* Robert Avatar on the left + Speech Bubble to the right (never covers card) */}
      <div className="relative flex items-center gap-2.5">

        {/* Robert Floating Character Avatar */}
        <div
          onClick={handleRobertClick}
          className={`relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 flex-shrink-0 ${
            isWobbling ? 'animate-bounce' : ''
          }`}
          title="Click Robert!"
        >
          {/* Outer Aura Halo - gentle blue or rose glow */}
          <div
            className={`absolute -inset-2 rounded-full blur-md animate-pulse ${
              isWorried ? 'bg-rose-400/35' : 'bg-gradient-to-r from-blue-400/25 to-sky-300/30'
            }`}
          />

          {/* White Glossy Body Capsule */}
          <div
            className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-white via-slate-50 to-slate-100 border-2 border-white shadow-lg flex items-center justify-center overflow-hidden"
            style={{
              boxShadow: isWorried
                ? '0 8px 20px -2px rgba(225, 29, 72, 0.35), 0 0 14px rgba(244, 63, 94, 0.25)'
                : '0 8px 20px -2px rgba(30, 79, 216, 0.3), 0 0 14px rgba(56, 189, 248, 0.25)'
            }}
          >
            {/* Top Gloss Highlight */}
            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white/90 to-transparent pointer-events-none" />

            {/* Dark High-Contrast OLED Visor Face */}
            <div className="w-9 h-6 sm:w-10 sm:h-7 rounded-xl bg-[#081022] border border-blue-400/30 shadow-inner flex flex-col items-center justify-center p-1 relative">

              {/* Eye Pair */}
              <div className="flex items-center gap-2">
                {/* Left Eye */}
                {expression === 'happy' ? (
                  <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                    <path d="M 1 4 Q 3 1 5 4" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                ) : expression === 'wink' ? (
                  <div className="w-1.5 h-0.5 bg-sky-300 rounded-full" />
                ) : expression === 'worried' ? (
                  <div className="w-1 h-2 bg-rose-300 rounded-full rotate-[-20deg]" />
                ) : (
                  <div className="w-1.5 h-2.5 bg-sky-300 rounded-full shadow-[0_0_6px_#38bdf8]" />
                )}

                {/* Right Eye */}
                {expression === 'happy' ? (
                  <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                    <path d="M 1 4 Q 3 1 5 4" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                ) : expression === 'wink' ? (
                  <div className="w-1.5 h-2.5 bg-sky-300 rounded-full shadow-[0_0_6px_#38bdf8]" />
                ) : expression === 'worried' ? (
                  <div className="w-1 h-2 bg-rose-300 rounded-full rotate-[20deg]" />
                ) : (
                  <div className="w-1.5 h-2.5 bg-sky-300 rounded-full shadow-[0_0_6px_#38bdf8]" />
                )}
              </div>

              {/* Expressive Mouth */}
              <div className="mt-0.5">
                {isWorried ? (
                  <svg width="8" height="4" viewBox="0 0 8 4" fill="none">
                    <path d="M 1 3 Q 4 1 7 3" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : expression === 'talking' || isTyping ? (
                  <div className="w-2.5 h-1 bg-sky-400 rounded-full animate-pulse" />
                ) : (
                  <svg width="8" height="4" viewBox="0 0 8 4" fill="none">
                    <path d="M 1 1 Q 4 3.5 7 1" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            </div>

            {/* Jet Thrust / Bottom Foot Accent */}
            <div
              className={`absolute -bottom-1 w-6 h-1 rounded-full transition-colors duration-300 ${
                isMoving ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]' : 'bg-blue-500/30'
              }`}
            />
          </div>
        </div>

        {/* Modern Speech Bubble (Positioned to the right of Robert with pointer arrow facing Robert) */}
        <div
          className={`pointer-events-none max-w-[175px] sm:max-w-[200px] xl:max-w-[220px] px-3.5 py-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xl backdrop-blur-md text-[11.5px] sm:text-[12px] font-semibold text-slate-800 leading-snug transition-all duration-300 ${
            isMoving ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
          } ${
            isWorried ? 'border-rose-300 text-rose-800 bg-rose-50/95 shadow-rose-200/50' : ''
          }`}
          style={{
            boxShadow: '0 10px 25px -5px rgba(30, 79, 216, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
          }}
        >
          <span>{typedSpeech}</span>
          {isTyping && <span className="inline-block w-1 h-3 bg-blue-600 ml-0.5 animate-pulse" />}

          {/* Speech bubble arrow pointer pointing towards Robert on the left */}
          <div
            className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white -rotate-45 border-l border-t border-slate-200/90 ${
              isWorried ? 'bg-rose-50 border-rose-300' : ''
            }`}
          />
        </div>

      </div>
    </div>
  );
};

export default Robert;
