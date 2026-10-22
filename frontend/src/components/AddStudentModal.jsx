import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle, Calendar, Hash, User } from 'lucide-react';
import { api } from '../services/api';

export const AddStudentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    registerNo: '',
    name: '',
    dob: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.registerNo || !formData.name || !formData.dob) {
      setError('Please fill out all mandatory fields.');
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
      setError(err.message || 'Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_24px_64px_rgba(0,0,0,0.18)] rounded-3xl w-full max-w-md overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Enroll New Student</h3>
              <p className="text-[11px] text-white/70">Single Candidate Dossier Creation</p>
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
              className="w-full px-3.5 py-2 bg-surface-container-low/50 hover:bg-surface-container-low focus:bg-white border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm font-mono text-on-surface focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-secondary" />
              Student Full Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. VIJAY M"
              className="w-full px-3.5 py-2 bg-surface-container-low/50 hover:bg-surface-container-low focus:bg-white border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm text-on-surface focus:outline-none transition-all"
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
            <p className="text-[11px] text-outline mt-1.5">
              Default student password will be encrypted as DOB in DDMMYYYY format.
            </p>
          </div>

          <div className="p-3 bg-secondary-fixed/30 border border-secondary/20 rounded-xl text-[11.5px] text-primary flex items-start gap-2">
            <span className="font-bold">Note:</span>
            <span>Year of Study and Section will be selected by the student in their profile form.</span>
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
              {loading ? 'Adding...' : 'Add Student Record'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
