import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginHeroArt } from '../components/LoginHeroArt';
import { LoginParticles } from '../components/LoginParticles';
import { LoginWelcomeAnimation } from '../components/LoginWelcomeAnimation';
import { RobertMascot } from '../components/RobertMascot';
import { MagneticButton } from '../components/MagneticButton';
import '../styles/loginAnimation.css';
import {
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  UserCheck,
  Loader2
} from 'lucide-react';

export const LoginPage = () => {
  const { loginStudent, loginAdmin, completeLogin } = useAuth();
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'ADMIN'

  // Student form state
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Admin form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Robert mascot active field state
  const [activeField, setActiveField] = useState('idle');

  // Welcome animation state
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);
  const timerRef = useRef(null);

  // Pre-warm the backend while the user enters credentials to eliminate cold-start delay
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '';
    fetch(`${base}/api/health`).catch(() => {});
    return () => clearTimeout(timerRef.current);
  }, []);

  const playWelcomeThenEnter = (user) => {
    setActiveField('success');
    setWelcomeUser(user);
    setShowWelcome(true);
    timerRef.current = setTimeout(() => {
      completeLogin(user);
    }, 1450);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!studentRegNo.trim() || !studentPassword.trim()) {
      setError('Please provide your Register Number and Date of Birth password.');
      return;
    }
    try {
      setLoading(true);
      setActiveField('loading');
      const res = await loginStudent(studentRegNo.trim(), studentPassword.trim(), { defer: true });
      if (res?.success && res.user) {
        playWelcomeThenEnter(res.user);
      }
    } catch (err) {
      setError(err.message || 'Student login failed. Check credentials.');
      setActiveField('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Please provide your faculty/administrator username and password.');
      return;
    }
    try {
      setLoading(true);
      setActiveField('loading');
      const res = await loginAdmin(adminUsername.trim(), adminPassword.trim(), { defer: true });
      if (res?.success && res.user) {
        playWelcomeThenEnter(res.user);
      }
    } catch (err) {
      setError(err.message || 'Admin login failed. Invalid username or password.');
      setActiveField('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9FE] flex items-center justify-center p-3 sm:p-6 font-sans antialiased text-[#1A1B1F] relative overflow-hidden">
      {/* Flying Robert Mascot - Freely flies anywhere across the entire webpage! */}
      <RobertMascot activeField={activeField} role={role} />

      <div className="w-full max-w-[1180px] bg-white rounded-[28px] shadow-[0_24px_70px_-20px_rgba(1,35,87,0.2)] p-3 grid lg:grid-cols-12 gap-3 border border-outline-variant/40 relative z-10">

        {/* LEFT: AAMEC INSTITUTIONAL HERO WITH BENETO ANIMATION */}
        <div className="hidden lg:block lg:col-span-7">
          <LoginHeroArt />
        </div>

        {/* RIGHT: AUTHENTICATION PANEL */}
        <div className="lg:col-span-5 relative rounded-[22px] bg-white overflow-hidden flex items-center justify-center p-6 sm:p-10 min-h-[660px]">
          <LoginParticles color="rgba(0, 90, 179, 0.35)" dotColor="rgba(56, 189, 248, 0.6)" />

          {/* Welcome Overlay (shown after login) */}
          <LoginWelcomeAnimation
            isVisible={showWelcome}
            role={role}
            userName={welcomeUser?.name}
            registerNo={welcomeUser?.registerNo}
          />

          <div className="relative z-10 w-full max-w-sm pl-2 pt-10">
            
            {/* Academic Registry Badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary tracking-wide uppercase">AI &amp; DS Academic Registry</span>
            </div>

            <h1 className="text-2xl font-black text-primary tracking-tight">
              Sign In to SIS
            </h1>
            <p className="mt-1 text-xs text-on-surface-variant">
              Select your credential role to access the portal
            </p>

            {/* Role switch tabs */}
            <div className="mt-5 p-1 bg-gray-100/90 rounded-xl flex select-none border border-outline-variant/30">
              <button
                type="button"
                onClick={() => { setRole('STUDENT'); setError(''); setActiveField('idle'); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  role === 'STUDENT' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('ADMIN'); setError(''); setActiveField('idle'); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  role === 'ADMIN' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Faculty / Admin</span>
              </button>
            </div>

            {error && (
              <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STUDENT LOGIN FORM */}
            {role === 'STUDENT' && (
              <form onSubmit={handleStudentSubmit} className="mt-6 space-y-4">
                <div className="floating-group">
                  <input
                    type="text"
                    id="studentRegNo"
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                    onFocus={() => setActiveField('reg')}
                    onBlur={() => setActiveField('idle')}
                    placeholder=" "
                    className="login-input font-mono font-medium"
                    required
                    autoFocus
                  />
                  <label htmlFor="studentRegNo">Register Number</label>
                </div>
                <p className="text-[11px] text-gray-500 -mt-2 pl-0.5">
                  Your official university register number.
                </p>

                <div className="floating-group">
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    id="studentPassword"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    onFocus={() => setActiveField('dob')}
                    onBlur={() => setActiveField('idle')}
                    placeholder=" "
                    className="login-input font-mono font-medium"
                    required
                  />
                  <label htmlFor="studentPassword">Password (Date of Birth)</label>
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-1"
                    title={showStudentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-[11px] text-blue-900 bg-blue-50/90 p-2.5 rounded-lg border border-blue-200/70 leading-tight">
                  <strong>Format:</strong> Enter DOB in <strong>DDMMYYYY</strong> format (e.g. if born 14-May-2003, enter <code className="font-mono font-bold">14052003</code>).
                </div>

                <div className="pt-2">
                  <MagneticButton
                    type="submit"
                    disabled={loading || showWelcome}
                    className="w-full py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </MagneticButton>
                </div>
              </form>
            )}

            {/* ADMIN / FACULTY LOGIN FORM */}
            {role === 'ADMIN' && (
              <form onSubmit={handleAdminSubmit} className="mt-6 space-y-4">
                <div className="floating-group">
                  <input
                    type="text"
                    id="adminUsername"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    onFocus={() => setActiveField('adminUser')}
                    onBlur={() => setActiveField('idle')}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                    autoFocus
                  />
                  <label htmlFor="adminUsername">Faculty / Admin Username</label>
                </div>

                <div className="floating-group">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    id="adminPassword"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onFocus={() => setActiveField('adminPass')}
                    onBlur={() => setActiveField('idle')}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                  />
                  <label htmlFor="adminPassword">Administrator Password</label>
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-1"
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-2">
                  <MagneticButton
                    type="submit"
                    disabled={loading || showWelcome}
                    className="w-full py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </MagneticButton>
                </div>
              </form>
            )}

            {/* Security notice footer */}
            <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                <span>Protected by Enterprise Encryption &bull; Dept. of AI &amp; DS</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
