import React from 'react';
import { Lock } from 'lucide-react';

export const StatusBadge = ({ status, isLocked = false, className = '' }) => {
  const normStatus = (status || 'DRAFT').toUpperCase();

  const getStyle = () => {
    switch (normStatus) {
      case 'VERIFIED':
        return {
          pill: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
          dot: 'bg-emerald-500'
        };
      case 'SUBMITTED':
        return {
          pill: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
          dot: 'bg-amber-500'
        };
      case 'REJECTED':
        return {
          pill: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
          dot: 'bg-rose-500'
        };
      case 'DRAFT':
      default:
        return {
          pill: 'bg-slate-500/10 text-slate-700 border-slate-400/30',
          dot: 'bg-slate-400'
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shadow-2xs ${style.pill}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
        <span>{normStatus}</span>
      </span>

      {isLocked && (
        <span 
          title="Record is locked by administrator"
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-500/25 rounded-full"
        >
          <Lock className="w-2.5 h-2.5" />
          <span>LOCKED</span>
        </span>
      )}
    </div>
  );
};
