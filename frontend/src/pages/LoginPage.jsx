import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
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
  UserPlus,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Mail,
  User,
  Calendar
} from 'lucide-react';

export const LoginPage = () => {
  const { loginStudent, registerStudent, loginAdmin, completeLogin } = useAuth();
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'SIGNUP' | 'ADMIN'

  // Student login form state
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Student self-signup form state
  const [signupRegNo, setSignupRegNo] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Live verification state
  const [verificationStatus, setVerificationStatus] = useState(null); // null | 'CHECKING' | 'MATCH' | 'NO_MATCH' | 'ALREADY_REGISTERED' | 'RATE_LIMITED' | 'ERROR'
  const [verificationMessage, setVerificationMessage] = useState('');

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

  // Pre-warm the backend while the user enters credentials
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '';
    fetch(`${base}/api/health`).catch(() => {});
    return () => clearTimeout(timerRef.current);
  }, []);

  // Debounced live verification of whitelist eligibility
  useEffect(() => {
    if (role !== 'SIGNUP') return;

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
    setActiveField('verifying');

    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.verifyEligibility(reg, dob, abortController.signal);
        if (res.status === 'MATCH') {
          setVerificationStatus('MATCH');
          setVerificationMessage('Eligible for registration.');
          setActiveField('match');
        } else if (res.status === 'ALREADY_REGISTERED') {
          setVerificationStatus('ALREADY_REGISTERED');
          setVerificationMessage(res.message || 'Account already registered. Please sign in.');
          setActiveField('already_registered');
        } else {
          setVerificationStatus('NO_MATCH');
          setVerificationMessage(res.message || 'No matching pre-registered record. Contact your department.');
          setActiveField('no_match');
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
        setActiveField('error');
      }
    }, 600);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [signupRegNo, signupDob, role]);

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
      setError('Please provide your Register Number and password.');
      setActiveField('error');
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
      setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

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

    if (signupPassword.length < 8 || !/[A-Z]/.test(signupPassword) || !/[a-z]/.test(signupPassword) || !/[0-9]/.test(signupPassword)) {
      setError('Password must be at least 8 characters with at least 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setActiveField('loading');
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
      setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Please provide your faculty/administrator username and password.');
      setActiveField('error');
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
      setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

  // Helper for password strength indication
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'bg-gray-200', width: 'w-0', valid: false };
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
    if (score === 5) return { label: 'Strong', color: 'bg-blue-500', width: 'w-3/4', valid: meetsRequirements };
    return { label: 'Very Strong', color: 'bg-emerald-500', width: 'w-full', valid: meetsRequirements };
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
    <div className="min-h-screen w-full bg-[#FAF9FE] flex items-center justify-center p-3 sm:p-6 font-sans antialiased text-[#1A1B1F] relative overflow-hidden">
      {/* Flying Robert Mascot */}
      <RobertMascot activeField={activeField} role={role} errorMessage={error} />

      <div className="w-full max-w-[1180px] bg-white rounded-[28px] shadow-[0_24px_70px_-20px_rgba(1,35,87,0.2)] p-3 grid lg:grid-cols-12 gap-3 border border-outline-variant/40 relative z-10">

        {/* LEFT: AAMEC INSTITUTIONAL HERO WITH BENETO ANIMATION */}
        <div id="loginHeroPanel" className="hidden lg:block lg:col-span-7">
          <LoginHeroArt />
        </div>

        {/* RIGHT: AUTHENTICATION PANEL */}
        <div id="loginAuthPanel" className="lg:col-span-5 relative rounded-[22px] bg-white overflow-hidden flex items-center justify-center p-6 sm:p-8 min-h-[660px]">
          <LoginParticles color="rgba(0, 90, 179, 0.35)" dotColor="rgba(56, 189, 248, 0.6)" />

          {/* Welcome Overlay (shown after login) */}
          <LoginWelcomeAnimation
            isVisible={showWelcome}
            role={role === 'SIGNUP' ? 'STUDENT' : role}
            userName={welcomeUser?.name}
            registerNo={welcomeUser?.registerNo}
          />

          <div className="relative z-10 w-full max-w-sm pl-2 pt-6 pb-4">
            
            {/* Academic Registry Badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary tracking-wide uppercase">AI &amp; DS Academic Registry</span>
            </div>

            <h1 className="text-2xl font-black text-primary tracking-tight">
              {role === 'SIGNUP' ? 'Create Student Account' : 'Sign In to SIS'}
            </h1>
            <p className="mt-1 text-xs text-on-surface-variant">
              {role === 'SIGNUP'
                ? 'Claim your pre-registered student record'
                : 'Select your credential role to access the portal'}
            </p>

            {/* Role / Mode switch tabs */}
            <div className="mt-4 p-1 bg-gray-100/90 rounded-xl flex select-none border border-outline-variant/30 text-xs">
              <button
                type="button"
                onClick={() => { setRole('STUDENT'); setError(''); setActiveField('idle'); }}
                className={`flex-1 py-2 font-semibold rounded-lg flex items-center justify-center gap-1 transition-all duration-200 ${
                  role === 'STUDENT' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('SIGNUP'); setError(''); setActiveField('idle'); }}
                className={`flex-1 py-2 font-semibold rounded-lg flex items-center justify-center gap-1 transition-all duration-200 ${
                  role === 'SIGNUP' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('ADMIN'); setError(''); setActiveField('idle'); }}
                className={`flex-1 py-2 font-semibold rounded-lg flex items-center justify-center gap-1 transition-all duration-200 ${
                  role === 'ADMIN' ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Faculty</span>
              </button>
            </div>

            {error && (
              <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ============================================================ */}
            {/* 1. STUDENT LOGIN FORM */}
            {/* ============================================================ */}
            {role === 'STUDENT' && (
              <form onSubmit={handleStudentSubmit} className="mt-5 space-y-4">
                <div className="floating-group">
                  <input
                    type="text"
                    id="studentRegNo"
                    value={studentRegNo}
                    onChange={(e) => {
                      setStudentRegNo(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('reg');
                    }}
                    onFocus={() => setActiveField('reg')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-mono font-medium"
                    required
                  />
                  <label htmlFor="studentRegNo">Register Number</label>
                </div>

                <div className="floating-group">
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    id="studentPassword"
                    value={studentPassword}
                    onChange={(e) => {
                      setStudentPassword(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('studentPass');
                    }}
                    onFocus={() => setActiveField('studentPass')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                  />
                  <label htmlFor="studentPassword">Account Password</label>
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-1"
                    title={showStudentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-500">First time here?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('SIGNUP');
                      setSignupRegNo(studentRegNo);
                      setError('');
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    Create Account &rarr;
                  </button>
                </div>

                <div className="pt-2">
                  <MagneticButton
                    type="submit"
                    disabled={loading || showWelcome}
                    className="w-full py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </MagneticButton>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* 2. STUDENT SELF-SIGNUP FORM (WITH LIVE WHITELIST CHECK) */}
            {/* ============================================================ */}
            {role === 'SIGNUP' && (
              <form onSubmit={handleSignupSubmit} className="mt-4 space-y-3 max-h-[58vh] overflow-y-auto pr-1">
                {/* Register Number */}
                <div className="floating-group">
                  <input
                    type="text"
                    id="signupRegNo"
                    value={signupRegNo}
                    onChange={(e) => {
                      setSignupRegNo(e.target.value.toUpperCase());
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('signupReg');
                    }}
                    onFocus={() => setActiveField('signupReg')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-mono font-medium uppercase"
                    required
                  />
                  <label htmlFor="signupRegNo">Register Number</label>
                </div>

                {/* Date of Birth */}
                <div className="floating-group">
                  <input
                    type="date"
                    id="signupDob"
                    value={signupDob}
                    onChange={(e) => {
                      setSignupDob(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('signupDob');
                    }}
                    onFocus={() => setActiveField('signupDob')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                  />
                  <label htmlFor="signupDob">Date of Birth</label>
                </div>

                {/* LIVE VERIFICATION STATUS (rendered directly under DOB) */}
                {verificationStatus && (
                  <div
                    aria-live="polite"
                    className={`p-2.5 rounded-xl text-[11.5px] border flex items-start gap-2 transition-all duration-200 ${
                      verificationStatus === 'CHECKING'
                        ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                        : verificationStatus === 'MATCH'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : verificationStatus === 'ALREADY_REGISTERED'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                        : 'bg-rose-50/80 border-rose-200 text-rose-900'
                    }`}
                  >
                    {verificationStatus === 'CHECKING' && (
                      <>
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
                        <span>Checking eligibility with department whitelist...</span>
                      </>
                    )}

                    {verificationStatus === 'MATCH' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Eligible for registration!</strong>
                          <p className="text-[10.5px] text-emerald-800 mt-0.5">Pre-registered record verified. Complete the form to create your account.</p>
                        </div>
                      </>
                    )}

                    {verificationStatus === 'NO_MATCH' && (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>No matching pre-registered record.</strong>
                          <p className="text-[10.5px] text-rose-800 mt-0.5">
                            Verify your Register Number and DOB with your department administrator.
                          </p>
                        </div>
                      </>
                    )}

                    {verificationStatus === 'ALREADY_REGISTERED' && (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Account already exists!</strong>
                          <p className="text-[10.5px] text-amber-800 mt-0.5">
                            An account has already been registered for this student.{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setStudentRegNo(signupRegNo);
                                setRole('STUDENT');
                              }}
                              className="font-bold underline hover:text-amber-950"
                            >
                              Sign in here
                            </button>
                          </p>
                        </div>
                      </>
                    )}

                    {verificationStatus === 'RATE_LIMITED' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Too many attempts.</strong>
                          <p className="text-[10.5px] text-rose-800 mt-0.5">{verificationMessage}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Full Name */}
                <div className="floating-group">
                  <input
                    type="text"
                    id="signupName"
                    value={signupName}
                    onChange={(e) => {
                      setSignupName(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('signupName');
                    }}
                    onFocus={() => setActiveField('signupName')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                  />
                  <label htmlFor="signupName">Full Name</label>
                </div>

                {/* Email Address */}
                <div className="floating-group">
                  <input
                    type="email"
                    id="signupEmail"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('signupEmail');
                    }}
                    onFocus={() => setActiveField('signupEmail')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                  />
                  <label htmlFor="signupEmail">Email Address</label>
                </div>

                {/* Password */}
                <div className="floating-group">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    id="signupPassword"
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('signupPass');
                    }}
                    onFocus={() => setActiveField('signupPass')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                  />
                  <label htmlFor="signupPassword">Choose Password</label>
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-1"
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {signupPassword && (
                  <div className="space-y-1 px-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                      <span>Strength: {pwdStrength.label}</span>
                      <span>Min 8 chars, 1 upper, 1 lower, 1 digit</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${pwdStrength.color} ${pwdStrength.width}`} />
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="floating-group">
                  <input
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    id="signupConfirmPassword"
                    value={signupConfirmPassword}
                    onChange={(e) => {
                      setSignupConfirmPassword(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('signupConfirmPass');
                    }}
                    onFocus={() => setActiveField('signupConfirmPass')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                  />
                  <label htmlFor="signupConfirmPassword">Confirm Password</label>
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-1"
                    title={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {signupConfirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-rose-600 px-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match.
                  </p>
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <MagneticButton
                    type="submit"
                    disabled={loading || showWelcome || !isSignupReady}
                    className="w-full py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{loading ? 'Creating Account...' : 'Create Student Account'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </MagneticButton>
                </div>

                <div className="text-center text-xs pt-1 pb-1">
                  <span className="text-gray-500">Already registered? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('STUDENT');
                      setStudentRegNo(signupRegNo);
                      setError('');
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* 3. ADMIN / FACULTY LOGIN FORM */}
            {/* ============================================================ */}
            {role === 'ADMIN' && (
              <form onSubmit={handleAdminSubmit} className="mt-5 space-y-4">
                <div className="floating-group">
                  <input
                    type="text"
                    id="adminUsername"
                    value={adminUsername}
                    onChange={(e) => {
                      setAdminUsername(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('adminUser');
                    }}
                    onFocus={() => setActiveField('adminUser')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
                    placeholder=" "
                    className="login-input font-medium"
                    required
                  />
                  <label htmlFor="adminUsername">Faculty / Admin Username</label>
                </div>

                <div className="floating-group">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    id="adminPassword"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (error) setError('');
                      if (activeField === 'error') setActiveField('adminPass');
                    }}
                    onFocus={() => setActiveField('adminPass')}
                    onBlur={() => setActiveField((prev) => (prev === 'error' || prev === 'loading' || prev === 'success' ? prev : 'idle'))}
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
                    className="w-full py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </MagneticButton>
                </div>
              </form>
            )}

            {/* Security notice footer */}
            <div className="mt-5 pt-3 border-t border-outline-variant/30 text-center">
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
