import React from 'react';
import { GraduationCap, ShieldCheck } from 'lucide-react';

/**
 * RoleSwitch Component
 * Top segmented glass switcher allowing fast switching between Student and Faculty.
 */
export const RoleSwitch = ({ role = 'STUDENT', onSelect }) => {
  return (
    <div className="glass-role-switch" role="tablist" aria-label="Sign in role switcher">
      <button
        type="button"
        role="tab"
        aria-selected={role === 'STUDENT'}
        onClick={() => onSelect('STUDENT')}
        className={`glass-role-tab ${role === 'STUDENT' ? 'active' : ''}`}
      >
        <GraduationCap className="w-4 h-4" />
        <span>Student</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={role === 'ADMIN'}
        onClick={() => onSelect('ADMIN')}
        className={`glass-role-tab ${role === 'ADMIN' ? 'active' : ''}`}
      >
        <ShieldCheck className="w-4 h-4" />
        <span>Faculty</span>
      </button>
    </div>
  );
};

export default RoleSwitch;
