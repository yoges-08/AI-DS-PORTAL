import React from 'react';
import { Check } from 'lucide-react';

/**
 * Welcome overlay shown after a successful login.
 * Styled in dark cyber glass matching the GlassCard theme.
 */
export const LoginWelcomeAnimation = ({ isVisible, role = 'STUDENT', userName = '', registerNo = '' }) => {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#030e20]/95 backdrop-blur-2xl z-50 transition-opacity duration-300 ease-out p-6 text-center select-none ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isVisible}
    >
      {/* Spring-pop check badge with glowing cyan aura */}
      <div
        className="relative w-20 h-20 rounded-full border-2 border-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/40"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(3,14,32,0.85) 75%)',
          animation: isVisible ? 'glWelcomePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none'
        }}
      >
        <Check className="w-10 h-10 text-sky-300 stroke-[3]" />
        {/* Pulsing ring aura */}
        <div className="absolute inset-0 rounded-full border border-sky-400/50 animate-ping opacity-30" />
      </div>

      <div
        className="space-y-2 max-w-xs"
        style={{ animation: isVisible ? 'glWelcomeFade 0.5s ease 0.15s both' : 'none' }}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30 text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>{role === 'STUDENT' ? 'Student Verified' : 'Faculty Authorized'}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Welcome, <span className="text-sky-300">{userName || (role === 'STUDENT' ? 'Student' : 'Administrator')}</span>!
        </h2>

        {role === 'STUDENT' && registerNo && (
          <p className="text-xs text-slate-300 font-medium">
            Register No: <span className="font-mono text-white font-bold">{registerNo}</span>
          </p>
        )}

        <p className="text-[11px] text-slate-400">Entering Department Student Information System...</p>

        <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden mx-auto mt-3">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.6)]"
            style={{
              width: isVisible ? '100%' : '0%',
              transition: isVisible ? 'width 1.25s linear' : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginWelcomeAnimation;
