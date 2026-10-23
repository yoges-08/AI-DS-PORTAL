import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRobert } from '../../context/RobertContext';
import { api } from '../../services/api';
import { GlassCard } from './GlassCard';
import { GlassInput } from './GlassInput';
import { GlassButton } from './GlassButton';
import { RoleSwitch } from './RoleSwitch';
import { SignupStatus } from './SignupStatus';
import { LoginWelcomeAnimation } from '../LoginWelcomeAnimation';
import '../../styles/glassLogin.css';

import {
  ShieldCheck,
  AlertCircle,
  Hash,
  Lock,
  Mail,
  User,
  Calendar
} from 'lucide-react';

export const GlassLoginForm = ({ onClose, initialView = 'signin' }) => {
  const { loginStudent, registerStudent, loginAdmin, completeLogin } = useAuth();
  const { setActiveField, setErrorMessage, speak } = useRobert();

  // Navigation & morph animation phase states
  const [role, setRole] = useState(initialView === 'admin' ? 'ADMIN' : 'STUDENT');
  const [view, setView] = useState(initialView === 'admin' ? 'admin' : (initialView === 'signup' ? 'signup' : 'signin'));
  const [phase, setPhase] = useState('idle'); // 'idle' | 'out' | 'morph' | 'in'
  const morphTimeoutRef = useRef(null);

  // Student Sign In form state
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Student Self-Signup form state
  const [signupRegNo, setSignupRegNo] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Live verification state
  const [verificationStatus, setVerificationStatus] = useState(null); // null | 'CHECKING' | 'MATCH' | 'NO_MATCH' | 'ALREADY_REGISTERED' | 'RATE_LIMITED'
  const [verificationMessage, setVerificationMessage] = useState('');

  // Faculty / Admin form state
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

  // Sync initialView prop if changed
  useEffect(() => {
    if (initialView === 'admin') {
      setRole('ADMIN');
      setView('admin');
    } else if (initialView === 'signup') {
      setRole('STUDENT');
      setView('signup');
    } else {
      setRole('STUDENT');
      setView('signin');
    }
  }, [initialView]);

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
    if (setActiveField) setActiveField('verifying');

    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.verifyEligibility(reg, dob, abortController.signal);
        if (res.status === 'MATCH') {
          setVerificationStatus('MATCH');
          setVerificationMessage('Eligible for registration.');
          if (setActiveField) setActiveField('match');
        } else if (res.status === 'ALREADY_REGISTERED') {
          setVerificationStatus('ALREADY_REGISTERED');
          setVerificationMessage(res.message || 'Account already registered. Please sign in.');
          if (setActiveField) setActiveField('already_registered');
        } else {
          setVerificationStatus('NO_MATCH');
          setVerificationMessage(res.message || 'No matching pre-registered record. Contact your department.');
          if (setActiveField) setActiveField('no_match');
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
        if (setActiveField) setActiveField('error');
      }
    }, 600);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [signupRegNo, signupDob, view, setActiveField]);

  // Execute signature morph animation between Sign In and Create Student Account (~1.1s total)
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

    // Phase 1: Content blurs and fades out (0ms - 220ms)
    setPhase('out');

    // Phase 2: Card enters morph mode, geometry shifts, wedges slide, center logo reveals (220ms - 770ms)
    morphTimeoutRef.current = setTimeout(() => {
      setView(targetView);
      setPhase('morph');

      // Phase 3: Transition to incoming content (770ms - 1100ms)
      morphTimeoutRef.current = setTimeout(() => {
        setPhase('in');

        // Settle back to idle
        morphTimeoutRef.current = setTimeout(() => {
          setPhase('idle');
        }, 330);
      }, 550);
    }, 220);
  };

  // Role tab switch (Student vs Faculty)
  const handleRoleChange = (newRole) => {
    if (phase !== 'idle') return;
    setError('');
    setRole(newRole);
    if (newRole === 'ADMIN') {
      setView('admin');
      if (setActiveField) setActiveField('adminUser');
    } else {
      setView('signin');
      if (setActiveField) setActiveField('reg');
    }
  };

  // Welcome animation transition helper
  const playWelcomeThenEnter = (user) => {
    if (setActiveField) setActiveField('success');
    setWelcomeUser(user);
    setShowWelcome(true);
    welcomeTimerRef.current = setTimeout(() => {
      completeLogin(user);
      if (onClose) onClose();
    }, 1450);
  };

  // Handle Student Sign In submission
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (setErrorMessage) setErrorMessage('');

    if (!studentRegNo.trim() || !studentPassword.trim()) {
      const msg = 'Please enter your Register Number and password.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      if (setActiveField) setActiveField('error');
      return;
    }

    try {
      setLoading(true);
      if (setActiveField) setActiveField('loading');
      const res = await loginStudent(studentRegNo.trim(), studentPassword.trim(), { defer: true });
      if (res?.success && res.user) {
        playWelcomeThenEnter(res.user);
      }
    } catch (err) {
      const msg = err.message || 'Student sign in failed. Please check your credentials.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      if (setActiveField) setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Student Self-Signup submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (setErrorMessage) setErrorMessage('');

    if (verificationStatus !== 'MATCH') {
      const msg = 'Please verify your Register Number and DOB against the department whitelist first.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      return;
    }

    if (!signupName.trim() || signupName.trim().length < 2) {
      const msg = 'Please enter your full official name.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      return;
    }

    if (!signupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim())) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      return;
    }

    if (
      signupPassword.length < 8 ||
      !/[A-Z]/.test(signupPassword) ||
      !/[a-z]/.test(signupPassword) ||
      !/[0-9]/.test(signupPassword)
    ) {
      const msg = 'Password must have at least 8 chars, 1 uppercase, 1 lowercase, and 1 number.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      return;
    }

    try {
      setLoading(true);
      if (setActiveField) setActiveField('loading');
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
      const msg = err.message || 'Account registration failed.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      if (setActiveField) setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Faculty Sign In submission
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (setErrorMessage) setErrorMessage('');

    if (!adminUsername.trim() || !adminPassword.trim()) {
      const msg = 'Please enter your faculty username and password.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      if (setActiveField) setActiveField('error');
      return;
    }

    try {
      setLoading(true);
      if (setActiveField) setActiveField('loading');
      const res = await loginAdmin(adminUsername.trim(), adminPassword.trim(), { defer: true });
      if (res?.success && res.user) {
        playWelcomeThenEnter(res.user);
      }
    } catch (err) {
      const msg = err.message || 'Faculty sign in failed. Invalid username or password.';
      setError(msg);
      if (setErrorMessage) setErrorMessage(msg);
      if (setActiveField) setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

  // Password strength meter calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'bg-slate-200', width: 'w-0', valid: false };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const meetsRequirements = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);

    if (score <= 2) return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/4', valid: false };
    if (score <= 4) return { label: 'Moderate', color: 'bg-amber-500', width: 'w-2/4', valid: meetsRequirements };
    if (score === 5) return { label: 'Strong', color: 'bg-blue-600', width: 'w-3/4', valid: meetsRequirements };
    return { label: 'Very Strong', color: 'bg-emerald-600', width: 'w-full', valid: meetsRequirements };
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
    <div className="relative w-full max-w-[450px] mx-auto select-none">
      {/* Welcome Screen Overlay */}
      <LoginWelcomeAnimation
        isVisible={showWelcome}
        role={role === 'STUDENT' ? 'STUDENT' : 'ADMIN'}
        userName={welcomeUser?.name}
        registerNo={welcomeUser?.registerNo}
      />

      <GlassCard phase={phase} onClose={onClose}>
        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="mb-3.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROLE SWITCHER: Students vs Faculty                           */}
        {/* ============================================================ */}
        {(view === 'signin' || view === 'admin') && (
          <RoleSwitch role={role} onSelect={handleRoleChange} />
        )}

        {/* ============================================================ */}
        {/* 1. STUDENT SIGN IN VIEW                                      */}
        {/* ============================================================ */}
        {view === 'signin' && (
          <div className="space-y-4">
            <header className="space-y-1">
              <h1 className="text-2xl sm:text-[27px] font-bold tracking-tight text-[#0B1B3A] flex items-center gap-1.5">
                Student <span className="text-[#1E4FD8]">Sign In</span>
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                Enter your Register Number and password to access your account
              </p>
            </header>

            <form onSubmit={handleStudentSubmit} className="space-y-3.5 pt-1">
              <GlassInput
                id="studentRegNo"
                label="Register Number"
                type="text"
                icon={Hash}
                value={studentRegNo}
                onChange={(e) => {
                  setStudentRegNo(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                onFocus={() => setActiveField && setActiveField('reg')}
                onBlur={() => setActiveField && setActiveField('idle')}
                placeholder="e.g. 71762305041"
                required
              />

              <GlassInput
                id="studentPassword"
                label="Password"
                type="password"
                icon={Lock}
                value={studentPassword}
                onChange={(e) => {
                  setStudentPassword(e.target.value);
                  if (error) setError('');
                }}
                onFocus={() => setActiveField && setActiveField('studentPass')}
                onBlur={() => setActiveField && setActiveField('idle')}
                placeholder="••••••••••••"
                required
              />

              {/* Row Under Fields: Remember me checkbox & Forgot password */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-[#1E4FD8] bg-white border-slate-300 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => speak && speak("If you forgot your password, contact your department coordinator 🔑")}
                  className="text-slate-500 hover:text-[#1E4FD8] text-xs transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Action Button: Royal Blue Gradient */}
              <div className="pt-1.5">
                <GlassButton
                  type="submit"
                  loading={loading}
                >
                  Sign In
                </GlassButton>
              </div>

              {/* Divider: OR CONTINUE WITH */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2.5 text-[10px] uppercase tracking-wider text-slate-400 shrink-0 font-medium">
                  or continue with
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Social Buttons (Google & Apple) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => speak && speak("Student accounts authenticate using your registered college Register No. 🎓")}
                  className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => speak && speak("Department credentials are encrypted and managed securely 🔒")}
                  className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.83-12.04-14.28-6.19-9.24-11.16-19.86-14.91-31.85-3.75-11.99-5.63-23.32-5.63-34 0-14.44 3.73-26.4 11.19-35.88 7.46-9.48 16.78-14.31 27.97-14.49 4.35 0 9.29 1.14 14.82 3.42 5.53 2.29 9.23 3.44 11.09 3.44 1.52 0 5.34-1.21 11.45-3.64 6.11-2.42 11.16-3.53 15.16-3.32 11.33.57 20.44 4.54 27.33 11.91-9.91 6.01-14.76 14.44-14.54 25.29.22 8.44 3.47 15.54 9.76 21.3 6.29 5.76 13.82 9.12 22.59 10.08-1.96 5.88-4.37 11.85-7.23 17.91zM119.22 31.84c0-7.14 2.61-13.89 7.84-20.25 5.23-6.36 11.75-10.42 19.56-12.18.33 1.09.49 2.22.49 3.4 0 7.24-2.73 14.07-8.19 20.49-5.46 6.42-12.08 10.36-19.86 11.82-.22-1.09-.34-2.18-.34-3.28z"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </form>

            {/* Bottom Morph Trigger: Sign Up */}
            <div className="text-center text-xs text-slate-500 pt-2.5 border-t border-slate-100">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setSignupRegNo(studentRegNo);
                  startMorphTo('signup');
                }}
                className="font-bold text-[#1E4FD8] hover:text-blue-700 underline underline-offset-2 transition-colors ml-1 cursor-pointer"
              >
                Sign Up
              </button>
            </div>

            {/* Academic Registry Badge */}
            <div className="text-center text-[10.5px] text-slate-400 pt-0.5 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E4FD8]/70" />
              <span>AI &amp; DS Academic Registry &bull; Verified Portal</span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. CREATE STUDENT ACCOUNT VIEW                               */}
        {/* ============================================================ */}
        {view === 'signup' && (
          <div className="space-y-3.5">
            <header className="space-y-1">
              <h1 className="text-2xl sm:text-[27px] font-bold tracking-tight text-[#0B1B3A] flex items-center gap-1.5">
                Create <span className="text-[#1E4FD8]">Student Account</span>
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                Verify your department whitelist details and setup your student password
              </p>
            </header>

            <form onSubmit={handleSignupSubmit} className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
              {/* Full Name */}
              <GlassInput
                id="signupName"
                label="Full Name"
                type="text"
                icon={User}
                value={signupName}
                onChange={(e) => {
                  setSignupName(e.target.value);
                  if (error) setError('');
                }}
                onFocus={() => setActiveField && setActiveField('signupName')}
                onBlur={() => setActiveField && setActiveField('idle')}
                placeholder="Alex Johnson"
                required
              />

              {/* Email Address */}
              <GlassInput
                id="signupEmail"
                label="Email Address"
                type="email"
                icon={Mail}
                value={signupEmail}
                onChange={(e) => {
                  setSignupEmail(e.target.value);
                  if (error) setError('');
                }}
                onFocus={() => setActiveField && setActiveField('signupEmail')}
                onBlur={() => setActiveField && setActiveField('idle')}
                placeholder="name@domain.com"
                required
              />

              {/* Register Number & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <GlassInput
                  id="signupRegNo"
                  label="Register Number"
                  type="text"
                  icon={Hash}
                  value={signupRegNo}
                  onChange={(e) => {
                    setSignupRegNo(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  onFocus={() => setActiveField && setActiveField('signupReg')}
                  onBlur={() => setActiveField && setActiveField('idle')}
                  placeholder="e.g. 71762305041"
                  required
                />

                <GlassInput
                  id="signupDob"
                  label="Date of Birth"
                  type="date"
                  icon={Calendar}
                  value={signupDob}
                  onChange={(e) => {
                    setSignupDob(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setActiveField && setActiveField('signupDob')}
                  onBlur={() => setActiveField && setActiveField('idle')}
                  required
                />
              </div>

              {/* Live Whitelist Verification Status */}
              <SignupStatus
                status={verificationStatus}
                message={verificationMessage}
                onSwitchToLogin={() => {
                  setStudentRegNo(signupRegNo);
                  startMorphTo('signin');
                }}
              />

              {/* Password & Confirm Password side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <GlassInput
                  id="signupPassword"
                  label="Password"
                  type="password"
                  icon={Lock}
                  value={signupPassword}
                  onChange={(e) => {
                    setSignupPassword(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setActiveField && setActiveField('signupPass')}
                  onBlur={() => setActiveField && setActiveField('idle')}
                  placeholder="••••••••"
                  required
                />

                <GlassInput
                  id="signupConfirmPassword"
                  label="Confirm Password"
                  type="password"
                  icon={Lock}
                  value={signupConfirmPassword}
                  onChange={(e) => {
                    setSignupConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setActiveField && setActiveField('signupConfirmPass')}
                  onBlur={() => setActiveField && setActiveField('idle')}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Password Strength Meter */}
              {signupPassword && (
                <div className="space-y-1 px-0.5">
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                    <span>Strength: <strong className="text-[#1E4FD8]">{pwdStrength.label}</strong></span>
                    <span>Min 8 chars, 1 uppercase, 1 lowercase, 1 number</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${pwdStrength.color} ${pwdStrength.width}`} />
                  </div>
                </div>
              )}

              {/* Terms Checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-600 pt-0.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-[#1E4FD8] bg-white border-slate-300 cursor-pointer"
                />
                <span>I agree to the Terms &amp; Privacy Policy</span>
              </label>

              {/* Password Mismatch Notice */}
              {signupConfirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-rose-600 px-0.5 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match.
                </p>
              )}

              <div className="pt-1.5">
                <GlassButton
                  type="submit"
                  disabled={!isSignupReady || !agreeTerms}
                  loading={loading}
                >
                  Create Student Account
                </GlassButton>
              </div>

              {/* Divider: OR CONTINUE WITH */}
              <div className="relative my-2.5 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[10px] uppercase tracking-wider text-slate-400 shrink-0 font-medium">
                  or continue with
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.83-12.04-14.28-6.19-9.24-11.16-19.86-14.91-31.85-3.75-11.99-5.63-23.32-5.63-34 0-14.44 3.73-26.4 11.19-35.88 7.46-9.48 16.78-14.31 27.97-14.49 4.35 0 9.29 1.14 14.82 3.42 5.53 2.29 9.23 3.44 11.09 3.44 1.52 0 5.34-1.21 11.45-3.64 6.11-2.42 11.16-3.53 15.16-3.32 11.33.57 20.44 4.54 27.33 11.91-9.91 6.01-14.76 14.44-14.54 25.29.22 8.44 3.47 15.54 9.76 21.3 6.29 5.76 13.82 9.12 22.59 10.08-1.96 5.88-4.37 11.85-7.23 17.91zM119.22 31.84c0-7.14 2.61-13.89 7.84-20.25 5.23-6.36 11.75-10.42 19.56-12.18.33 1.09.49 2.22.49 3.4 0 7.24-2.73 14.07-8.19 20.49-5.46 6.42-12.08 10.36-19.86 11.82-.22-1.09-.34-2.18-.34-3.28z"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </form>

            {/* Bottom Morph Trigger: Sign In */}
            <div className="text-center text-xs text-slate-500 pt-2.5 border-t border-slate-100">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => startMorphTo('signin')}
                className="font-bold text-[#1E4FD8] hover:text-blue-700 underline underline-offset-2 transition-colors ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. FACULTY / ADMIN VIEW                                      */}
        {/* ============================================================ */}
        {view === 'admin' && (
          <div className="space-y-4">
            <header className="space-y-1">
              <h1 className="text-2xl sm:text-[27px] font-bold tracking-tight text-[#0B1B3A] flex items-center gap-1.5">
                Faculty <span className="text-[#1E4FD8]">Portal</span>
              </h1>
              <p className="text-xs text-slate-500">
                Enter your administrative credentials to manage student records
              </p>
            </header>

            <form onSubmit={handleAdminSubmit} className="space-y-3.5 pt-1">
              <GlassInput
                id="adminUsername"
                label="Faculty Username"
                type="text"
                icon={User}
                value={adminUsername}
                onChange={(e) => {
                  setAdminUsername(e.target.value);
                  if (error) setError('');
                }}
                onFocus={() => setActiveField && setActiveField('adminUser')}
                onBlur={() => setActiveField && setActiveField('idle')}
                placeholder="e.g. admin or faculty ID"
                required
              />

              <GlassInput
                id="adminPassword"
                label="Administrator Password"
                type="password"
                icon={Lock}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  if (error) setError('');
                }}
                onFocus={() => setActiveField && setActiveField('adminPass')}
                onBlur={() => setActiveField && setActiveField('idle')}
                placeholder="••••••••••••"
                required
              />

              <div className="pt-2">
                <GlassButton
                  type="submit"
                  loading={loading}
                >
                  Sign In as Faculty
                </GlassButton>
              </div>
            </form>

            <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
              Need to access student portal?{' '}
              <button
                type="button"
                onClick={() => handleRoleChange('STUDENT')}
                className="font-bold text-[#1E4FD8] hover:text-blue-700 underline underline-offset-2 transition-colors ml-1 cursor-pointer"
              >
                Switch to Student
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default GlassLoginForm;
