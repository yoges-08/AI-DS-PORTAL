import React, { useState, useEffect, useRef } from 'react';
import { useRobert } from '../../context/RobertContext';
import { useAuthModal } from '../../context/AuthModalContext';

/**
 * Global Robert Assistant Component
 * Mounted once at app root, visible on both the landing page and the login overlay.
 * Fixed positioning, z-index 60 above overlays, with context-aware typewriter speech and facial expressions.
 */
export const Robert = () => {
  const { activeField, role, errorMessage, customSpeech, setCustomSpeech } = useRobert();
  const { isLoginOpen, openLogin } = useAuthModal();

  // Position state (adapts when login modal is open vs on landing page)
  const [position, setPosition] = useState({ bottom: '28px', left: '28px' });
  const [isHopping, setIsHopping] = useState(false);
  const [isWobbling, setIsWobbling] = useState(false);

  // Speech & Typewriter state
  const [typedSpeech, setTypedSpeech] = useState("Hi! I'm Robert 👋 Tap Login to get started.");
  const [isTyping, setIsTyping] = useState(false);

  // Facial Expression & Visor state
  const [expression, setExpression] = useState('happy'); // 'normal' | 'happy' | 'talking' | 'wink' | 'surprised' | 'worried'
  const [eyeGlance, setEyeGlance] = useState({ x: 0, y: 0 });

  const typingTimerRef = useRef(null);
  const hopTimerRef = useRef(null);
  const wobbleTimerRef = useRef(null);
  const prevFieldRef = useRef(activeField);

  // Keep Robert in bottom-left dock with clear margin so he never obstructs the card
  useEffect(() => {
    setPosition({ bottom: '28px', left: '28px', top: 'auto' });
  }, [isLoginOpen]);

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
    }, 28);
  };

  const hopAndSpeak = (text, nextExpr = 'happy') => {
    setIsHopping(true);
    if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
    hopTimerRef.current = setTimeout(() => setIsHopping(false), 350);

    triggerTypewriter(text, nextExpr);
  };

  // React to field focus, login open, and landing state
  useEffect(() => {
    if (customSpeech) {
      hopAndSpeak(customSpeech, 'happy');
      setCustomSpeech(null);
      return;
    }

    if (!isLoginOpen) {
      hopAndSpeak("Hi! I'm Robert 👋 Tap Login to get started.", 'happy');
      return;
    }

    // Modal is open, handle field guidance
    switch (activeField) {
      case 'loginOpen': {
        hopAndSpeak('Click a field to sign in! 🚀', 'happy');
        break;
      }
      case 'reg': {
        hopAndSpeak('Enter your register number 🎓', 'happy');
        break;
      }
      case 'studentPass': {
        hopAndSpeak('Enter your account password 🔑', 'happy');
        break;
      }
      case 'signupReg': {
        hopAndSpeak('Enter your Register Number 🎓', 'happy');
        break;
      }
      case 'signupDob': {
        hopAndSpeak('Select your Date of Birth 🎂', 'happy');
        break;
      }
      case 'signupName': {
        hopAndSpeak('Enter your Full Name ✍️', 'happy');
        break;
      }
      case 'signupEmail': {
        hopAndSpeak('Enter your college email ✉️', 'happy');
        break;
      }
      case 'signupPass': {
        hopAndSpeak('Choose a strong password 🔒', 'happy');
        break;
      }
      case 'signupConfirmPass': {
        hopAndSpeak('Confirm your password 🔑', 'happy');
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
        hopAndSpeak('Enter faculty username 👤', 'happy');
        break;
      }
      case 'adminPass': {
        hopAndSpeak('Enter admin password 🔒', 'happy');
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
      default:
        break;
    }
  }, [activeField, isLoginOpen, customSpeech, errorMessage, role]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
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
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="select-none pointer-events-auto"
    >
      <div className="relative flex items-center gap-3">
        
        {/* Modern White Theme Speech Bubble */}
        <div
          className={`relative max-w-[210px] sm:max-w-[250px] px-3.5 py-2.5 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xl backdrop-blur-md text-[12px] font-semibold text-slate-800 leading-snug transition-all duration-200 ${
            isWorried ? 'border-rose-300 text-rose-800 bg-rose-50/95 shadow-rose-200/50' : ''
          }`}
          style={{
            boxShadow: '0 10px 25px -5px rgba(30, 79, 216, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
          }}
        >
          <span>{typedSpeech}</span>
          {isTyping && <span className="inline-block w-1 h-3.5 bg-blue-600 ml-0.5 animate-pulse" />}

          {/* Speech bubble arrow pointer */}
          <div
            className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 border-t border-r border-slate-200/90 ${
              isWorried ? 'bg-rose-50 border-rose-300' : ''
            }`}
          />
        </div>

        {/* Robert Floating Character Avatar */}
        <div
          onClick={handleRobertClick}
          className={`relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${
            isHopping ? '-translate-y-2.5' : ''
          } ${isWobbling ? 'animate-bounce' : ''}`}
          title="Click Robert!"
        >
          {/* Outer Aura Halo */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/25 to-sky-300/30 rounded-full blur-md animate-pulse" />

          {/* White Glossy Body Capsule */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-b from-white via-slate-50 to-slate-100 border-2 border-white shadow-lg shadow-blue-500/15 flex items-center justify-center overflow-hidden">
            
            {/* Top Gloss Highlight */}
            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white/90 to-transparent pointer-events-none" />

            {/* Dark OLED Visor Face */}
            <div className="w-10 h-7 rounded-xl bg-[#091124] border border-blue-400/30 shadow-inner flex flex-col items-center justify-center p-1 relative">
              
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

            {/* Bottom Antenna/Feet Accent */}
            <div className="absolute -bottom-1 w-6 h-1 rounded-full bg-blue-500/30" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Robert;
