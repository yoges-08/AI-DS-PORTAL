import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export const AddStudentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    registerNo: '',
    name: '',
    dob: '',
    year: '1',
    section: 'A'
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-gov-border rounded-md shadow-lg w-full max-w-md overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gov-navy text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wide">Add New Student</h3>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-green-50 border border-green-200 text-green-800 rounded flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Register Number <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="registerNo"
              value={formData.registerNo}
              onChange={handleChange}
              placeholder="e.g. 71762405050"
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Student Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. VIJAY M"
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Date of Birth (DOB) <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Default password will be encrypted as DOB in DDMMYYYY format.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Section</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-gov-navy text-white rounded font-semibold hover:bg-gov-navy-dark disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Student Record'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
