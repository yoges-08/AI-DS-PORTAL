import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, AlertCircle, CheckCircle, Calendar, Hash } from 'lucide-react';
import { api } from '../services/api';

export const AddStudentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    registerNo: '',
    dob: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lock body scroll while modal is active (prevents background scroll and blur misalignment)
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.registerNo || !formData.dob) {
      setError('Please provide both Register Number and Date of Birth.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.addStudent(formData);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to pre-register student.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto apple-modal-backdrop flex min-h-full items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Click-away backdrop overlay */}
      <div className="fixed inset-0 bg-transparent" onClick={onClose} aria-hidden="true" />
      
      {/* Modal Dialog Card */}
      <div className="relative z-10 apple-modal-card rounded-3xl w-full max-w-md overflow-hidden my-auto transition-all">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Pre-register Student</h3>
              <p className="text-[11px] text-white/70">Whitelist Single Candidate Eligibility</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-secondary" />
              Register Number <span className="text-error">*</span>
            </label>
            <input
              type="text"
              name="registerNo"
              value={formData.registerNo}
              onChange={handleChange}
              placeholder="e.g. 71762405050"
              className="w-full px-3.5 py-2 bg-surface-container-low/50 hover:bg-surface-container-low focus:bg-white border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm font-mono text-on-surface focus:outline-none transition-all uppercase"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              Date of Birth (DOB) <span className="text-error">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-surface-container-low/50 hover:bg-surface-container-low focus:bg-white border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm text-on-surface focus:outline-none transition-all"
              required
            />
          </div>

          <div className="p-3 bg-secondary-fixed/30 border border-secondary/20 rounded-xl text-[11.5px] text-primary flex items-start gap-2">
            <span className="font-bold">Student Self-Signup:</span>
            <span>Pre-registers this student on the whitelist. The student will self-create their account, choose a password, and enter their email on the login page.</span>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-on-surface font-semibold transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary hover:bg-primary-container text-white rounded-xl font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? 'Pre-registering...' : 'Pre-register Student'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};
