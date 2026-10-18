import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { loginStudent, loginAdmin } = useAuth();
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' or 'ADMIN'

  // Student form state
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Admin form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!studentRegNo.trim() || !studentPassword.trim()) {
      setError('Please provide your Register Number and Date of Birth password.');
      return;
    }

    try {
      setLoading(true);
      await loginStudent(studentRegNo.trim(), studentPassword.trim());
    } catch (err) {
      setError(err.message || 'Student login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Please provide your administrator username and password.');
      return;
    }

    try {
      setLoading(true);
      await loginAdmin(adminUsername.trim(), adminPassword.trim());
    } catch (err) {
      setError(err.message || 'Admin login failed. Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col justify-between">
      
      {/* Top Banner */}
      <div className="bg-gov-navy text-white py-3 px-4 shadow-md border-b border-gov-navy-dark">
        <div className="max-w-7xl mx-auto flex items-center space-x-3.5">
          <img 
            src="/college-logo.webp" 
            alt="AAMEC College Crest" 
            className="w-11 h-11 object-contain shrink-0 drop-shadow-sm" 
          />
          <img 
            src="/aids-logo.jpg" 
            alt="AI & DS Emblem" 
            className="w-11 h-11 rounded-full border-2 border-white/80 object-cover shrink-0 shadow-sm" 
          />
          <div className="border-l border-blue-400/40 pl-3">
            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-amber-300 leading-tight">
              Anjalai Ammal Mahalingam Engineering College
            </div>
            <div className="text-xs sm:text-base font-bold uppercase tracking-wider leading-tight text-white">
              Department of Artificial Intelligence & Data Science
            </div>
            <div className="text-[11px] text-blue-200">
              Department Student Information System (UMIS Portal)
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout Container */}
      <div className="max-w-5xl w-full mx-auto p-4 sm:p-8 my-auto">
        <div className="bg-white border border-gov-border rounded-md shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          
          {/* Left Side: Institutional Banner & Announcements */}
          <div className="md:col-span-5 bg-[#152950] text-white p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gov-navy-dark">
            <div>
              {/* Institutional Crest Showcase */}
              <div className="flex items-center space-x-3 bg-white/10 p-2.5 rounded-lg border border-white/15 backdrop-blur-sm mb-4">
                <img 
                  src="/college-logo.webp" 
                  alt="AAMEC" 
                  className="w-12 h-12 object-contain" 
                />
                <img 
                  src="/aids-logo.jpg" 
                  alt="AI&DS" 
                  className="w-12 h-12 rounded-full border border-white/80 object-cover shadow" 
                />
                <div className="text-left">
                  <div className="text-xs font-black tracking-wide text-amber-300 uppercase leading-none">
                    AAMEC
                  </div>
                  <div className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase mt-0.5">
                    Character &bull; Health &bull; Education
                  </div>
                  <div className="text-[10px] text-white font-bold tracking-tight">
                    Dept of AI & DS
                  </div>
                </div>
              </div>

              <div className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-900 border border-blue-400/40 rounded text-blue-200 mb-2">
                Official Department Portal
              </div>
              <h2 className="text-lg sm:text-xl font-bold leading-snug">
                Student Master Information & Concessions Register
              </h2>
              <p className="text-xs text-blue-200 mt-2 leading-relaxed">
                Centralized departmental database for recording personal particulars, academic performance, First Graduate, and Post Matric Scholarships.
              </p>
            </div>

            <div className="space-y-3.5 my-6">
              <div className="border-l-2 border-amber-400 pl-3 text-xs">
                <span className="font-bold text-amber-300 block">Student Instructions:</span>
                <span className="text-blue-100 text-[11px] leading-tight block">
                  Log in with your university register number. Default password is your Date of Birth in <strong>DDMMYYYY</strong> format.
                </span>
              </div>
              <div className="border-l-2 border-green-400 pl-3 text-xs">
                <span className="font-bold text-green-300 block">Required Proofs:</span>
                <span className="text-blue-100 text-[11px] leading-tight block">
                  Have digital copies of your photo, Aadhaar, marksheet, community, and bank passbook ready before final submission.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-900/60 text-[11px] text-blue-300">
              Security: Passwords are encrypted with bcrypt. Never share your credentials.
            </div>
          </div>

          {/* Right Side: Login Card */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Role Toggle Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT');
                  setError('');
                }}
                className={`flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  role === 'STUDENT'
                    ? 'border-gov-navy text-gov-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Student Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('ADMIN');
                  setError('');
                }}
                className={`flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  role === 'ADMIN'
                    ? 'border-gov-navy text-gov-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Admin Login
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STUDENT LOGIN FORM */}
            {role === 'STUDENT' && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Register Number
                  </label>
                  <input
                    type="text"
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                    placeholder="e.g. 71762105001"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
                    autoFocus
                    required
                  />
                  <span className="text-[11px] text-gray-500 mt-0.5 block">
                    Your institutional registration number.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Password (Date of Birth)
                  </label>
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="DDMMYYYY (e.g. 14052003)"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
                    required
                  />
                  <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 p-2 border border-amber-200 rounded">
                    <strong>Helper:</strong> Password is your Date of Birth in <strong>DDMMYYYY</strong> format (e.g., if born on 14-May-2003, enter 14052003).
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gov-navy text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-gov-navy-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2 text-center text-[11px] text-gray-500">
                  Default credentials demo: <strong className="text-gray-700">71762105001</strong> / <strong className="text-gray-700">14052003</strong>
                </div>
              </form>
            )}

            {/* ADMIN LOGIN FORM */}
            {role === 'ADMIN' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gov-navy text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-gov-navy-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2 text-center text-[11px] text-gray-500">
                  Default credentials: <strong className="text-gray-700">admin</strong> / <strong className="text-gray-700">Admin@123</strong>
                </div>
              </form>
            )}

          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gov-border py-3 text-center text-xs text-gov-subtle">
        Anjalai Ammal Mahalingam Engineering College (AAMEC) &bull; Department of Artificial Intelligence & Data Science &copy; 2026
      </footer>

    </div>
  );
};
