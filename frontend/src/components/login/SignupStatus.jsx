import React from 'react';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * SignupStatus Component
 * Displays real-time eligibility verification feedback directly below the DOB field.
 */
export const SignupStatus = ({ status, message, onSwitchToLogin }) => {
  if (!status) return null;

  return (
    <div
      aria-live="polite"
      className={`glass-status-line ${
        status === 'CHECKING'
          ? 'glass-status--checking'
          : status === 'MATCH'
          ? 'glass-status--match'
          : status === 'ALREADY_REGISTERED'
          ? 'glass-status--already'
          : status === 'RATE_LIMITED'
          ? 'glass-status--limited'
          : 'glass-status--no-match'
      }`}
    >
      {status === 'CHECKING' && (
        <>
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0 mt-0.5" />
          <span>Verifying registration eligibility with department whitelist...</span>
        </>
      )}

      {status === 'MATCH' && (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-emerald-300">Pre-registration Verified</strong>
            <span className="text-[11px] text-emerald-300/80">
              Eligible for account creation. Fill in your details below to finish setup.
            </span>
          </div>
        </>
      )}

      {status === 'NO_MATCH' && (
        <>
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-300">Verification Status</strong>
            <span className="text-[11px] text-rose-300/80">
              {message || 'Verify your Register Number and DOB with your department administrator.'}
              {message && message.toLowerCase().includes('already registered') && onSwitchToLogin && (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="block mt-1 font-bold underline text-rose-200 hover:text-white transition-colors"
                >
                  Already registered? Sign in here
                </button>
              )}
            </span>
          </div>
        </>
      )}

      {status === 'ALREADY_REGISTERED' && (
        <>
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-300">Account Already Exists</strong>
            <span className="text-[11px] text-amber-300/80">
              An account has already been claimed for this student.{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold underline text-amber-200 hover:text-white transition-colors"
              >
                Sign in here
              </button>
            </span>
          </div>
        </>
      )}

      {status === 'RATE_LIMITED' && (
        <>
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-300">Too Many Verification Attempts</strong>
            <span className="text-[11px] text-rose-300/80">
              {message || 'Verification is locked for 15 minutes due to consecutive failed attempts.'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
