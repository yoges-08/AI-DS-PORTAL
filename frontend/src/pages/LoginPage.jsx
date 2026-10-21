import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Phone, 
  Mail, 
  Zap, 
  FolderLock, 
  FileCheck2, 
  GraduationCap, 
  UserCheck 
} from 'lucide-react';

export const LoginPage = () => {
  const { loginStudent, loginAdmin } = useAuth();
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' or 'ADMIN'

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

  // Pre-warm the backend while the user enters credentials to eliminate cold-start delay
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '';
    fetch(`${base}/api/health`).catch(() => {});
  }, []);

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background font-sans text-on-surface antialiased overflow-x-hidden selection:bg-secondary-fixed selection:text-primary">
      
      {/* LEFT SIDE: Apple-Style Collegiate Academic Hero */}
      <div className="relative w-full lg:w-7/12 min-h-[460px] lg:min-h-screen bg-primary text-white p-6 sm:p-10 md:p-14 lg:p-16 flex flex-col justify-between overflow-hidden">
        
        {/* Ambient Gradient Lighting & Mesh Overlays */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary opacity-30 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-container opacity-40 blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full bg-secondary-fixed opacity-15 blur-[80px] pointer-events-none"></div>
        
        {/* Subtle Geometric Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        ></div>

        {/* Top Header / Institution Brand */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md shadow-sm">
              <img 
                src="/college-logo.webp" 
                alt="AAMEC College Crest" 
                className="w-9 h-9 object-contain drop-shadow-sm" 
              />
              <img 
                src="/aids-logo.jpg" 
                alt="AI & DS Emblem" 
                className="w-9 h-9 rounded-full border border-white/80 object-cover shadow-sm" 
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-primary-fixed-dim uppercase tracking-wider block">
                Anjalai Ammal Mahalingam Engineering College
              </span>
              <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                Dept. of Artificial Intelligence & Data Science
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full frosted-pill-tag text-white/90 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-white font-medium">Core Systems Nominal</span>
          </div>
        </div>

        {/* Mid Hero Content */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white mb-5 shadow-sm text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-primary-fixed-dim" />
            <span>Academic Year 2024–2025 • Statutory UMIS Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Department Student <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-fixed to-secondary-fixed">
              Information System
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-primary-fixed-dim/90 leading-relaxed max-w-lg">
            Institutional master register for academic performance, statutory scholarship verifications (First Graduate & Post-Matric), and encrypted document compliance.
          </p>

          {/* Feature Highlights Bento-Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/15">
            <div className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col gap-2 transition hover:bg-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-primary-fixed">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-white font-semibold">Instant Verification</div>
                <div className="text-[11px] text-primary-fixed-dim/80 leading-snug mt-0.5">Automated cohort audits & record locks</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col gap-2 transition hover:bg-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-primary-fixed">
                <FolderLock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-white font-semibold">Encrypted Vault</div>
                <div className="text-[11px] text-primary-fixed-dim/80 leading-snug mt-0.5">Cloudflare R2 private document storage</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col gap-2 transition hover:bg-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-primary-fixed">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-white font-semibold">Official Reporting</div>
                <div className="text-[11px] text-primary-fixed-dim/80 leading-snug mt-0.5">A4 Gazette print dossier & Excel export</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Meta */}
        <div className="relative z-10 flex flex-wrap items-center justify-between text-xs text-primary-fixed-dim/70 gap-3 pt-4 border-t border-white/10">
          <span>AAMEC &bull; AI & DS Academic Registry</span>
          <div className="flex items-center space-x-3">
            <a href="tel:+914374245522" className="hover:text-white inline-flex items-center gap-1 transition-colors">
              <Phone className="w-3 h-3" /> +91 4374 245522
            </a>
            <span>&bull;</span>
            <a href="mailto:aids@aamec.edu.in" className="hover:text-white inline-flex items-center gap-1 transition-colors">
              <Mail className="w-3 h-3" /> aids@aamec.edu.in
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Cupertino Frosted Glass Authentication Panel */}
      <div className="w-full lg:w-5/12 bg-surface-container-low flex items-center justify-center p-6 sm:p-10 lg:p-14 relative">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-secondary-fixed opacity-40 blur-3xl pointer-events-none"></div>

        {/* Frosted Glass Card */}
        <div className="frosted-glass-card w-full max-w-md rounded-2xl p-7 sm:p-9 relative z-10 shadow-xl border border-white/80">
          
          {/* Card Header */}
          <div className="flex items-start justify-between pb-4 border-b border-outline-variant/30">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
                Sign In to SIS
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Select your credential role to access the portal
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[11px] font-semibold">Active</span>
            </div>
          </div>

          {/* Cupertino Segmented Sliding Tabs */}
          <div className="mt-6 p-1 bg-surface-variant/70 rounded-xl flex relative select-none">
            <button
              type="button"
              onClick={() => {
                setRole('STUDENT');
                setError('');
              }}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all duration-200 z-10 flex items-center justify-center gap-1.5 ${
                role === 'STUDENT'
                  ? 'bg-white text-primary shadow-[0_2px_8px_rgba(1,35,87,0.12)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setError('');
              }}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all duration-200 z-10 flex items-center justify-center gap-1.5 ${
                role === 'ADMIN'
                  ? 'bg-white text-primary shadow-[0_2px_8px_rgba(1,35,87,0.12)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faculty / Admin</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50/90 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STUDENT LOGIN FORM */}
          {role === 'STUDENT' && (
            <form onSubmit={handleStudentSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 pl-0.5">
                  Register Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-outline pointer-events-none">
                    <GraduationCap className="w-4 h-4 text-outline" />
                  </span>
                  <input
                    type="text"
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                    placeholder="e.g. 71762105001"
                    className="w-full bg-white/80 border border-outline-variant/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-outline mt-1 pl-0.5">
                  Your official university register key.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 pl-0.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">
                    Password (Date of Birth)
                  </label>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-outline pointer-events-none">
                    <Lock className="w-4 h-4 text-outline" />
                  </span>
                  <input
                    type={showStudentPassword ? "text" : "password"}
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="DDMMYYYY (e.g. 14052003)"
                    className="w-full bg-white/80 border border-outline-variant/60 rounded-xl pl-9 pr-10 py-2.5 text-sm text-on-surface font-mono placeholder:text-outline/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword((prev) => !prev)}
                    className="absolute right-3 text-outline hover:text-on-surface p-1 transition-colors"
                    title={showStudentPassword ? "Hide password" : "Show password"}
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1.5 text-[11px] text-blue-900 bg-blue-50/80 p-2 rounded-lg border border-blue-200/60 leading-tight">
                  <strong>Instruction:</strong> Enter DOB in <strong>DDMMYYYY</strong> format (e.g., if born on 14-May-2003, enter <code className="font-mono font-bold">14052003</code>).
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary-container text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ADMIN LOGIN FORM */}
          {role === 'ADMIN' && (
            <form onSubmit={handleAdminSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 pl-0.5">
                  Faculty / Admin Username
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-outline pointer-events-none">
                    <UserCheck className="w-4 h-4 text-outline" />
                  </span>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-white/80 border border-outline-variant/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 pl-0.5">
                  Admin Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-outline pointer-events-none">
                    <Lock className="w-4 h-4 text-outline" />
                  </span>
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    className="w-full bg-white/80 border border-outline-variant/60 rounded-xl pl-9 pr-10 py-2.5 text-sm text-on-surface placeholder:text-outline/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((prev) => !prev)}
                    className="absolute right-3 text-outline hover:text-on-surface p-1 transition-colors"
                    title={showAdminPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary-container text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Institutional Security Notice */}
          <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-outline text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              <span>Protected by Enterprise Encryption &bull; Dept. of AI & DS</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
