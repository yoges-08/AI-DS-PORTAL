import React from 'react';

/**
 * Welcome overlay shown after a successful login (spring-pop check + greeting + progress bar).
 * Displayed inside the login form panel.
 */
export const LoginWelcomeAnimation = ({ isVisible, role = 'STUDENT', userName = '', registerNo = '' }) => {
  return (
    <div
      className={`login-welcome-overlay absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-[#012357]/95 backdrop-blur-xl rounded-[22px] z-50 transition-opacity duration-300 ease-out p-6 text-center select-none ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isVisible}
    >
      {/* Spring-pop check badge */}
      <div
        className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400/80 flex items-center justify-center shadow-lg shadow-emerald-500/30"
        style={{
          background: 'radial-gradient(circle, rgba(34,197,94,0.28) 0%, rgba(1,35,87,0.1) 75%)',
          animation: isVisible ? 'aamecSpringPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none'
        }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div
        className="space-y-1.5 max-w-xs"
        style={{ animation: isVisible ? 'aamecFadeUp 0.5s ease 0.15s both' : 'none' }}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{role === 'STUDENT' ? 'Student Verified' : 'Faculty Authorized'}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Welcome, <span className="text-[#D9E2FF]">{userName || (role === 'STUDENT' ? 'Student' : 'Administrator')}</span>!
        </h2>

        {role === 'STUDENT' && registerNo && (
          <p className="text-xs text-[#AFC6FF] font-medium">
            Register No: <span className="font-mono text-white font-bold">{registerNo}</span>
          </p>
        )}

        <p className="text-[11px] text-[#AFC6FF]/80">Entering Department Student Information System...</p>

        <div className="w-36 h-1 bg-white/15 rounded-full overflow-hidden mx-auto mt-2.5">
          <div
            className="h-full bg-gradient-to-r from-[#D6E3FF] via-[#005AB3] to-[#22c55e] rounded-full"
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
