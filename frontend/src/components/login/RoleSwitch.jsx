import React from 'react';
import { GraduationCap, UserCheck } from 'lucide-react';

/**
 * RoleSwitch Component
 * Top segmented glass pill allowing fast switching between Student and Faculty / Admin.
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
        <GraduationCap className="w-3.5 h-3.5" />
        <span>Student Portal</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={role === 'ADMIN'}
        onClick={() => onSelect('ADMIN')}
        className={`glass-role-tab ${role === 'ADMIN' ? 'active' : ''}`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>Faculty / Admin</span>
      </button>
    </div>
  );
};
