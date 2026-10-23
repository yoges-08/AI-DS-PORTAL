import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GlassScene } from '../components/login/GlassScene';
import { GlassCard } from '../components/login/GlassCard';
import { GlassInput } from '../components/login/GlassInput';
import { GlassButton } from '../components/login/GlassButton';
import { RoleSwitch } from '../components/login/RoleSwitch';
import { SignupStatus } from '../components/login/SignupStatus';
import { LoginWelcomeAnimation } from '../components/LoginWelcomeAnimation';
import '../styles/glassLogin.css';

import {
  ShieldCheck,
  AlertCircle,
  Hash,
  Lock,
  Mail,
  User,
  Calendar,
  HelpCircle
} from 'lucide-react';

export const LoginPage = () => {
  const { loginStudent, registerStudent, loginAdmin, completeLogin } = useAuth();

  // Navigation & animation phase states
  const [view, setView] = useState('signin'); // 'signin' | 'signup' | 'admin'
  const [phase, setPhase] = useState('idle'); // 'idle' | 'out' | 'morph' | 'in'
  const morphTimeoutRef = useRef(null);

  // Student Sign In form state
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Student Self-Signup form state
  const [signupRegNo, setSignupRegNo] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Live verification state
  const [verificationStatus, setVerificationStatus] = useState(null); // null | 'CHECKING' | 'MATCH' | 'NO_MATCH' | 'ALREADY_REGISTERED' | 'RATE_LIMITED'
  const [verificationMessage, setVerificationMessage] = useState('');

  // Admin form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // General form feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Post-login welcome animation state
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);
  const welcomeTimerRef = useRef(null);

  // Pre-warm backend on component mount
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '';
    fetch(`${base}/api/health`).catch(() => {});
    return () => {
      clearTimeout(morphTimeoutRef.current);
      clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  // Debounced live verification of whitelist eligibility during signup
  useEffect(() => {
    if (view !== 'signup') return;

    const reg = signupRegNo.trim();
    const dob = signupDob.trim();

    if (!reg || !dob) {
      setVerificationStatus(null);
      setVerificationMessage('');
      return;
    }

    if (reg.length < 5) {
      setVerificationStatus(null);
      return;
    }

    const abortController = new AbortController();
    setVerificationStatus('CHECKING');

    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.verifyEligibility(reg, dob, abortController.signal);
        if (res.status === 'MATCH') {
          setVerificationStatus('MATCH');
          setVerificationMessage('Eligible for registration.');
        } else if (res.status === 'ALREADY_REGISTERED') {
          setVerificationStatus('ALREADY_REGISTERED');
          setVerificationMessage(res.message || 'Account already registered. Please sign in.');
        } else {
          setVerificationStatus('NO_MATCH');
          setVerificationMessage(res.message || 'No matching pre-registered record. Contact your department.');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (err.status === 429) {
          setVerificationStatus('RATE_LIMITED');
          setVerificationMessage(err.message || 'Too many attempts. Please try again in 15 minutes.');
        } else {
          setVerificationStatus('NO_MATCH');
          setVerificationMessage(err.message || 'Verification check failed. Please verify your details.');
        }
      }
    }, 600);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [signupRegNo, signupDob, view]);

  // Execute morph transition between Sign In and Create Account (~1.2s total)
  const startMorphTo = (targetView) => {
    if (phase !== 'idle') return;
    setError('');

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setView(targetView);
      return;
    }

    // Phase 1: Content blurs and fades out (0ms - 200ms)
    setPhase('out');

    morphTimeoutRef.current = setTimeout(() => {
      // Phase 2: Chamfer expands, wedges travel to center, logo appears, ring pulses (200ms - 950ms)
      setPhase('morph');

      setTimeout(() => {
        // Swap view at the apex while content is fully obscured (~600ms into transition)
        setView(targetView);
      }, 400);

      setTimeout(() => {
        // Phase 3: Logo dissolves, new form fades in from blur to sharp (950ms - 1300ms)
        setPhase('in');

        setTimeout(() => {
          // Phase 4: Back to idle
          setPhase('idle');
        }, 350);
      }, 750);
    }, 200);
  };

  // Light crossfade for switching role between Student and Faculty (~180ms)
  const handleRoleSelect = (newRole) => {
    if (phase !== 'idle') return;
    setError('');
    const target = newRole === 'ADMIN' ? 'admin' : 'signin';
    if (view === target) return;

    setPhase('out');
    setTimeout(() => {
      setView(target);
      setPhase('in');
      setTimeout(() => {
        setPhase('idle');
      }, 200);
    }, 180);
  };

  const playWelcomeThenEnter = (user) => {
    setWelcomeUser(user);
    setShowWelcome(true);
    welcomeTimerRef.current = setTimeout(() => {
      completeLogin(user);
    }, 1500);
  };

  // Student Sign In submit handler
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!studentRegNo.trim() || !studentPassword.trim()) {
      setError('Please provide your Register Number and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginStudent(studentRegNo.trim(), studentPassword.trim(), { defer: true });
      if (res?.success && res.user) {
        playWelcomeThenEnter(res.user);
      }
    } catch (err) {
      setError(err.message || 'Student login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Faculty / Admin submit handler
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Please provide your faculty/administrator username and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginAdmin(adminUsername.trim(), adminPassword.trim(), { defer: true });
      if (res?.success && res.user) {
        playWelcomeThenEnter(res.user);
      }
    } catch (err) {
      setError(err.message || 'Admin login failed. Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Student Self-Signup submit handler
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (verificationStatus !== 'MATCH') {
      setError('Please enter a valid Register Number and DOB matching your pre-registration record.');
      return;
    }

    if (!signupName.trim() || signupName.trim().length < 2) {
      setError('Please provide your full name (at least 2 characters).');
      return;
    }

    if (!signupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (
      signupPassword.length < 8 ||
      !/[A-Z]/.test(signupPassword) ||
      !/[a-z]/.test(signupPassword) ||
      !/[0-9]/.test(signupPassword)
    ) {
      setError('Password must be at least 8 characters with at least 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        registerNo: signupRegNo.trim().toUpperCase(),
        dob: signupDob.trim(),
        name: signupName.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword
      };

      const res = await registerStudent(payload, { defer: true });
      if (res?.success && res.user) {
        playWelcomeThenEnter(res.user);
      }
    } catch (err) {
      setError(err.message || 'Account creation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'bg-slate-700', width: 'w-0', valid: false };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const meetsRequirements = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);

    if (score <= 2) return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/4', valid: false };
    if (score <= 4) return { label: 'Moderate', color: 'bg-amber-400', width: 'w-2/4', valid: meetsRequirements };
    if (score === 5) return { label: 'Strong', color: 'bg-sky-400', width: 'w-3/4', valid: meetsRequirements };
    return { label: 'Very Strong', color: 'bg-emerald-400', width: 'w-full', valid: meetsRequirements };
  };

  const pwdStrength = getPasswordStrength(signupPassword);
  const passwordsMatch = signupConfirmPassword && signupPassword === signupConfirmPassword;
  const isSignupReady =
    verificationStatus === 'MATCH' &&
    signupName.trim().length >= 2 &&
    signupEmail.trim() &&
    pwdStrength.valid &&
    passwordsMatch;

  return (
    <div className="glass-scene">
      {/* Background SVG Neon Streaks */}
      <GlassScene />

      {/* Vignette Overlay */}
      <div className="glass-vignette" />

      {/* Centered Glass Card */}
      <GlassCard phase={phase}>
        {/* Post-login welcome overlay */}
        <LoginWelcomeAnimation
          isVisible={showWelcome}
          role={view === 'admin' ? 'ADMIN' : 'STUDENT'}
          userName={welcomeUser?.name}
          registerNo={welcomeUser?.registerNo}
        />

        {/* Global Error Banner */}
        {error && (
          <div role="alert" className="mb-4 p-3 bg-rose-500/15 border border-rose-400/30 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 1: STUDENT SIGN IN                                     */}
        {/* ============================================================ */}
        {view === 'signin' && (
          <div className="space-y-4">
            <RoleSwitch role="STUDENT" onSelect={handleRoleSelect} />

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome <span className="text-sky-400 font-extrabold">Back</span>
              </h1>
              <p className="text-xs text-slate-400">
                Enter your credentials to access your secure account
              </p>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-3.5 pt-2">
              <GlassInput
                id="studentRegNo"
                label="Register Number"
                type="text"
                icon={Hash}
                value={studentRegNo}
                onChange={(e) => setStudentRegNo(e.target.value.toUpperCase())}
                placeholder="e.g. 71762305041"
                required
                autoComplete="username"
              />

              <GlassInput
                id="studentPassword"
                label="Password"
                type="password"
                icon={Lock}
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />

              {/* Forgot password hint */}
              <div className="flex items-center justify-between text-[11.5px] text-slate-400 pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Verified Identity</span>
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400/90 hover:text-slate-200 cursor-pointer" title="Contact your department office to request a password reset key">
                  <HelpCircle className="w-3 h-3 text-sky-400/80" />
                  <span>Forgot password?</span>
                </span>
              </div>

              <div className="pt-2">
                <GlassButton type="submit" loading={loading}>
                  Sign In
                </GlassButton>
              </div>
            </form>

            {/* Footer switcher to Signup */}
            <div className="text-center text-xs text-slate-400 pt-3 border-t border-white/10">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => startMorphTo('signup')}
                className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors ml-1 cursor-pointer"
              >
                Sign Up
              </button>
            </div>

            {/* Security Notice */}
            <div className="text-center text-[10.5px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400/70" />
              <span>Protected by Enterprise Encryption &bull; Dept. of AI &amp; DS</span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: FACULTY / ADMIN SIGN IN                             */}
        {/* ============================================================ */}
        {view === 'admin' && (
          <div className="space-y-4">
            <RoleSwitch role="ADMIN" onSelect={handleRoleSelect} />

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Faculty <span className="text-sky-400 font-extrabold">Access</span>
              </h1>
              <p className="text-xs text-slate-400">
                Sign in with your department administrator credentials
              </p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-3.5 pt-2">
              <GlassInput
                id="adminUsername"
                label="Faculty Username"
                type="text"
                icon={User}
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="e.g. admin or faculty.id"
                required
                autoComplete="username"
              />

              <GlassInput
                id="adminPassword"
                label="Administrator Password"
                type="password"
                icon={Lock}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />

              <div className="pt-2">
                <GlassButton type="submit" loading={loading}>
                  Sign In as Administrator
                </GlassButton>
              </div>
            </form>

            <div className="text-center text-xs text-slate-400 pt-3 border-t border-white/10">
              Need to access student portal?{' '}
              <button
                type="button"
                onClick={() => handleRoleSelect('STUDENT')}
                className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors ml-1 cursor-pointer"
              >
                Switch to Student Sign In
              </button>
            </div>

            <div className="text-center text-[10.5px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400/70" />
              <span>Protected by Enterprise Encryption &bull; Dept. of AI &amp; DS</span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: STUDENT SELF-SIGNUP (CREATE ACCOUNT)                */}
        {/* ============================================================ */}
        {view === 'signup' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Create <span className="text-sky-400 font-extrabold">Account</span>
              </h1>
              <p className="text-xs text-slate-400">
                Join us today to access your secure workspace
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  id="signupRegNo"
                  label="Register Number"
                  type="text"
                  icon={Hash}
                  value={signupRegNo}
                  onChange={(e) => setSignupRegNo(e.target.value.toUpperCase())}
                  placeholder="e.g. 71762305041"
                  required
                />

                <GlassInput
                  id="signupDob"
                  label="Date of Birth"
                  type="date"
                  icon={Calendar}
                  value={signupDob}
                  onChange={(e) => setSignupDob(e.target.value)}
                  required
                />
              </div>

              {/* Live verification status directly under DOB */}
              <SignupStatus
                status={verificationStatus}
                message={verificationMessage}
                onSwitchToLogin={() => {
                  setStudentRegNo(signupRegNo);
                  startMorphTo('signin');
                }}
              />

              <GlassInput
                id="signupName"
                label="Full Name"
                type="text"
                icon={User}
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. VIJAY M"
                required
              />

              <GlassInput
                id="signupEmail"
                label="Email Address"
                type="email"
                icon={Mail}
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="name@college.edu"
                required
              />

              {/* Password & Confirm Password side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  id="signupPassword"
                  label="Password"
                  type="password"
                  icon={Lock}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <GlassInput
                  id="signupConfirmPassword"
                  label="Confirm Password"
                  type="password"
                  icon={Lock}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Real-time Password Strength Meter */}
              {signupPassword && (
                <div className="space-y-1 px-0.5">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                    <span>Strength: <strong className="text-sky-300">{pwdStrength.label}</strong></span>
                    <span>Min 8 chars, 1 uppercase, 1 lowercase, 1 number</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${pwdStrength.color} ${pwdStrength.width}`} />
                  </div>
                </div>
              )}

              {/* Confirm password mismatch error */}
              {signupConfirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-rose-400 px-0.5 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match.
                </p>
              )}

              {!isSignupReady && (
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  Verify your Register Number and DOB to continue
                </p>
              )}

              <div className="pt-1.5">
                <GlassButton
                  type="submit"
                  disabled={!isSignupReady}
                  loading={loading}
                >
                  Create Account
                </GlassButton>
              </div>
            </form>

            {/* Footer switcher to Sign In */}
            <div className="text-center text-xs text-slate-400 pt-2.5 border-t border-white/10">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => startMorphTo('signin')}
                className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Security Notice */}
            <div className="text-center text-[10.5px] text-slate-500 flex items-center justify-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400/70" />
              <span>Protected by Enterprise Encryption &bull; Dept. of AI &amp; DS</span>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default LoginPage;
