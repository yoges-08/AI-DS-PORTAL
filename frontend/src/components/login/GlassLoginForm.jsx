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
  const { loginStudent, registerStudent, verifyEmail, loginAdmin, completeLogin } = useAuth();
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


  // Email verification view state
  const [pendingStudentId, setPendingStudentId] = useState(null);
  const [pendingEmailMasked, setPendingEmailMasked] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [codeSuccessMsg, setCodeSuccessMsg] = useState('');
  const digit0Ref = useRef(null);
  const digit1Ref = useRef(null);
  const digit2Ref = useRef(null);
  const digit3Ref = useRef(null);
  const digit4Ref = useRef(null);
  const digit5Ref = useRef(null);
  const digitRefs = [digit0Ref, digit1Ref, digit2Ref, digit3Ref, digit4Ref, digit5Ref];

  // Resend cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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


  // Digit change with paste handling
  const handleDigitChange = (index, val) => {
    setError('');
    setCodeSuccessMsg('');
    const rawVal = val.replace(/\D/g, '');

    // Multi-digit paste (e.g. 6 digits at once)
    if (rawVal.length > 1) {
      const digits = rawVal.slice(0, 6).split('');
      const newDigits = [...codeDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setCodeDigits(newDigits);
      const nextFocus = Math.min(digits.length, 5);
      digitRefs[nextFocus]?.current?.focus();
      return;
    }

    const newDigits = [...codeDigits];
    newDigits[index] = rawVal.slice(-1);
    setCodeDigits(newDigits);

    if (rawVal && index < 5) {
      digitRefs[index + 1]?.current?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      digitRefs[index - 1]?.current?.focus();
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCodeSuccessMsg('');
    const code = codeDigits.join('').trim();
    if (code.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      if (setActiveField) setActiveField('loading');
      const res = await verifyEmail(pendingStudentId, code, { defer: true });
      if (res?.success && res.user) {
        playWelcomeThenEnter(res.user);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
      if (setActiveField) setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !pendingStudentId) return;
    setError('');
    setCodeSuccessMsg('');
    try {
      setLoading(true);
      const res = await api.resendVerificationCode(pendingStudentId);
      if (res.success) {
        setCodeSuccessMsg('A new 6-digit code has been sent to your email.');
        setResendCooldown(60);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmailSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = newEmailInput.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setCodeSuccessMsg('');
    try {
      setLoading(true);
      const res = await api.changePendingEmail(pendingStudentId, cleanEmail);
      if (res.success) {
        setPendingEmailMasked(res.emailMasked);
        setIsChangingEmail(false);
        setCodeSuccessMsg('Email updated! A new code was sent to ' + res.emailMasked);
        setResendCooldown(60);
        setCodeDigits(['', '', '', '', '', '']);
      }
    } catch (err) {
      setError(err.message || 'Failed to update email address.');
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
              <h1 className="text-xl sm:text-[27px] font-bold tracking-tight text-[#0B1B3A] flex items-center gap-1.5">
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
              <h1 className="text-xl sm:text-[27px] font-bold tracking-tight text-[#0B1B3A] flex items-center gap-1.5">
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
                  disabled={loading}
                  loading={loading}
                >
                  Create Student Account
                </GlassButton>
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
              <h1 className="text-xl sm:text-[27px] font-bold tracking-tight text-[#0B1B3A] flex items-center gap-1.5">
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
