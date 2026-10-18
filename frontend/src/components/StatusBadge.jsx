import React from 'react';

export const StatusBadge = ({ status, isLocked = false, className = '' }) => {
  const normStatus = (status || 'DRAFT').toUpperCase();

  const getStyle = () => {
    switch (normStatus) {
      case 'VERIFIED':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'SUBMITTED':
        return 'bg-blue-50 text-gov-navy border-blue-300';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-300';
      case 'DRAFT':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-1.5 ${className}`}>
      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${getStyle()}`}>
        {normStatus}
      </span>
      {isLocked && (
        <span 
          title="Record is locked by administrator"
          className="inline-block px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300 rounded"
        >
          LOCKED
        </span>
      )}
    </div>
  );
};
