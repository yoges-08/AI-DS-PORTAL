import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ShieldCheck } from 'lucide-react';

/**
 * ModernLoadingScreen Component (White / Light Theme)
 * Clean, futuristic, high-class light theme loading animation for the AI & DS Portal.
 * Eliminates distortion with fixed aspect-ratio geometry, concentric glowing cyan-indigo
 * tech rings, animated scanning progress track, and cycling system status messages.
 */
export const ModernLoadingScreen = ({ message = 'Connecting to Student Information System...' }) => {
  const [logoError, setLogoError] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = [
    'Connecting to Student Information System...',
    'Authenticating Department Security Protocols...',
    'Synchronizing Academic & Eligibility Records...',
    'Preparing Interactive AI & DS Portal...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [statusMessages.length]);

  return (
    <div className="fixed inset-0 z-[9999] min-h-screen w-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-sky-50/50 text-slate-800 select-none">
      {/* Ambient Tech Grid & Radial Glows (Light Theme) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(2, 132, 199, 0.08) 0%, transparent 65%),
            linear-gradient(rgba(2, 132, 199, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(2, 132, 199, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 36px 36px, 36px 36px'
        }}
      />

      {/* Soft Ambient Background Flares */}
      <div className="absolute w-[440px] h-[440px] rounded-full bg-sky-200/40 blur-[120px] -top-24 -left-24 pointer-events-none animate-pulse" />
      <div className="absolute w-[460px] h-[460px] rounded-full bg-indigo-200/30 blur-[130px] -bottom-24 -right-24 pointer-events-none animate-pulse" />

      {/* Main Frosted White Glass Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center px-8 py-10 rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.08),0_0_30px_rgba(2,132,199,0.06)] max-w-sm sm:max-w-md w-full mx-4"
      >
        {/* College Tag Capsule */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50/90 border border-sky-200/80 text-[10.5px] font-semibold text-sky-800 tracking-wider uppercase mb-7 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>AAMEC • Department of AI &amp; DS</span>
        </div>

        {/* 3D Multi-Orbital Cyber Loading Centerpiece */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-7">
          
          {/* Soft Outer Sky Glow Halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400/20 via-blue-300/10 to-indigo-400/20 blur-xl animate-pulse" />

          {/* Orbit 1: Outer Rotating Tech Dashed Ring (Clockwise) */}
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(2, 132, 199, 0.28)"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
            {/* Accent Glowing Beads along outer track */}
            <circle cx="50" cy="4" r="2.5" fill="#0284c7" />
            <circle cx="50" cy="96" r="2.5" fill="#4f46e5" />
          </motion.svg>

          {/* Orbit 2: Middle Smooth Vibrant Gradient Ring (Counter-Clockwise) */}
          <motion.svg
            className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)]"
            viewBox="0 0 100 100"
            animate={{ rotate: -360 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id="cyberSpinnerGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="1" />
                <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#cyberSpinnerGradLight)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="95 180"
            />
          </motion.svg>

          {/* Orbit 3: Inner High-Speed Micro Glow Ring */}
          <motion.svg
            className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)]"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#0284c7"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="40 210"
            />
          </motion.svg>

          {/* Central Protected Circular Core (Always Perfectly Square & Centered) */}
          <div className="relative w-20 h-20 rounded-full p-2.5 bg-white border border-sky-200/90 shadow-[0_4px_25px_rgba(2,132,199,0.18)] flex items-center justify-center overflow-hidden">
            {/* Subtle inner radial glow */}
            <div className="absolute inset-0 bg-radial from-sky-50 via-white to-slate-50 opacity-80" />

            {!logoError ? (
              <motion.img
                src="/college-logo.webp"
                alt="AAMEC"
                onError={() => setLogoError(true)}
                className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                animate={{ scale: [0.96, 1.04, 0.96] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : (
              <motion.div
                animate={{ scale: [0.94, 1.06, 0.94] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 flex items-center justify-center text-sky-600"
              >
                <Cpu className="w-9 h-9 drop-shadow-[0_0_8px_rgba(2,132,199,0.35)]" />
              </motion.div>
            )}

            {/* Shimmer sweep effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-sky-100/40 to-transparent pointer-events-none"
              animate={{ x: ['-120%', '120%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
            />
          </div>
        </div>

        {/* Portal Title & Subtitle */}
        <div className="text-center space-y-1 mb-5">
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-[0.16em] bg-gradient-to-r from-sky-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent drop-shadow-xs font-sans">
            AI &amp; DS Portal
          </h1>
          <p className="text-[11.5px] font-medium tracking-wide text-slate-500">
            Student Information &amp; Academic System
          </p>
        </div>

        {/* Modern Scanning Progress Bar (White Theme) */}
        <div className="w-56 sm:w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-[1px] relative mb-4 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 shadow-[0_0_10px_rgba(2,132,199,0.45)]"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>

        {/* Cycling System Status Indicator */}
        <div className="h-6 flex items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-mono font-medium text-sky-800 tracking-tight"
            >
              {statusMessages[statusIndex] || message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Bottom Security Assurance */}
        <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-[10.5px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Statutory Concessions &amp; Encrypted Student Portal</span>
        </div>
      </motion.div>
    </div>
  );
};
