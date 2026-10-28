import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound,
  ArrowRight
} from 'lucide-react';

export const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Lock body scroll while modal is active & support Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const minLen = user?.role === 'ADMIN' ? 12 : 8;
  const hasMinLength = newPassword.length >= minLen;
  const hasLetters = /[a-zA-Z]/.test(newPassword);
  const hasNumbers = /[0-9]/.test(newPassword);
  const isDifferent = Boolean(currentPassword && newPassword && currentPassword !== newPassword);
  const isMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  const canSubmit = hasMinLength && hasLetters && hasNumbers && isDifferent && isMatch && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (!hasMinLength || !hasLetters || !hasNumbers) {
      setError(`New password must be at least ${minLen} characters and contain both letters and numbers.`);
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.changePassword(currentPassword, newPassword);
      if (res?.success) {
        setSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setError(res?.message || 'Failed to update password. Please check your current password.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-md my-auto bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E4FD8] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 id="change-password-title" className="text-base font-bold text-[#0B1B3A]">
                Change Password
              </h2>
              <p className="text-[11px] text-slate-500">
                Institutional Security &bull; {user?.role === 'ADMIN' ? 'Faculty Admin' : user?.registerNo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body with smooth scrolling on constrained displays */}
        <div className="p-6 overflow-y-auto">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Password Changed!</h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Your password has been successfully updated. All prior sessions on other devices have been securely revoked.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 bg-[#1E4FD8] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20 focus:outline-none transition-all pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={`At least ${minLen} characters with letters & numbers`}
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20 focus:outline-none transition-all pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20 focus:outline-none transition-all pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Policy Requirements Live Checklist */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
                <p className="font-semibold text-slate-700">Password Policy Requirements:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>&ge; {minLen} characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${(hasLetters && hasNumbers) ? 'text-emerald-700 font-medium' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${(hasLetters && hasNumbers) ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Letters &amp; numbers</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isDifferent ? 'text-emerald-700 font-medium' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isDifferent ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Different from current</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-700 font-medium' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#1E4FD8] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                  {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChangePasswordModal;
