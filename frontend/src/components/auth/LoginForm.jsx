import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRobert } from '../../context/RobertContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { api } from '../../services/api';
import { LoginWelcomeAnimation } from '../LoginWelcomeAnimation';
import { MagneticButton } from '../MagneticButton';
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
  Calendar,
  X
} from 'lucide-react';

export const LoginForm = ({ onClose }) => {
  const { loginStudent, registerStudent, loginAdmin, completeLogin } = useAuth();
  const { setActiveField, setErrorMessage } = useRobert();
  const { initialTab } = useAuthModal();

  const [role, setRole] = useState(initialTab || 'STUDENT'); // 'STUDENT' | 'SIGNUP' | 'ADMIN'

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

  // Welcome overlay state
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);
  const timerRef = useRef(null);

  // Set initial role if passed
  useEffect(() => {
    if (initialTab) {
      setRole(initialTab);
    }
  }, [initialTab]);

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
  }, [signupRegNo, signupDob, role, setActiveField]);

  const playWelcomeThenEnter = (user) => {
    setActiveField('success');
    setWelcomeUser(user);
    setShowWelcome(true);
    timerRef.current = setTimeout(() => {
      completeLogin(user);
      if (onClose) onClose();
    }, 1450);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorMessage('');
    if (!studentRegNo.trim() || !studentPassword.trim()) {
      const msg = 'Please provide your Register Number and password.';
      setError(msg);
      setErrorMessage(msg);
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
      const msg = err.message || 'Student login failed. Check credentials.';
      setError(msg);
      setErrorMessage(msg);
      setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorMessage('');

    if (verificationStatus !== 'MATCH') {
      const msg = 'Please enter a valid Register Number and DOB matching your pre-registration record.';
      setError(msg);
      setErrorMessage(msg);
      return;
    }

    if (!signupName.trim() || signupName.trim().length < 2) {
      const msg = 'Please provide your full name (at least 2 characters).';
      setError(msg);
      setErrorMessage(msg);
      return;
    }

    if (!signupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim())) {
      const msg = 'Please provide a valid email address.';
      setError(msg);
      setErrorMessage(msg);
      return;
    }

    if (signupPassword.length < 8 || !/[A-Z]/.test(signupPassword) || !/[a-z]/.test(signupPassword) || !/[0-9]/.test(signupPassword)) {
      const msg = 'Password must be at least 8 characters with at least 1 uppercase letter, 1 lowercase letter, and 1 number.';
      setError(msg);
      setErrorMessage(msg);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      setErrorMessage(msg);
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
      const msg = err.message || 'Account creation failed.';
      setError(msg);
      setErrorMessage(msg);
      setActiveField('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorMessage('');
    if (!adminUsername.trim() || !adminPassword.trim()) {
      const msg = 'Please provide your faculty/administrator username and password.';
      setError(msg);
      setErrorMessage(msg);
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
      const msg = err.message || 'Admin login failed. Invalid username or password.';
      setError(msg);
      setErrorMessage(msg);
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
    <div className="relative w-full">
      {/* Welcome Overlay (shown after successful authentication) */}
      <LoginWelcomeAnimation
        isVisible={showWelcome}
        role={role === 'SIGNUP' ? 'STUDENT' : role}
        userName={welcomeUser?.name}
        registerNo={welcomeUser?.registerNo}
      />

      {/* Header bar of modal card */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-600 tracking-wide uppercase block">AI &amp; DS Academic Registry</span>
            <h2 className="text-xl font-black text-[#0B1B3A] tracking-tight">
              {role === 'SIGNUP' ? 'Create Student Account' : role === 'ADMIN' ? 'Faculty Portal Sign In' : 'Student Portal Sign In'}
            </h2>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        {role === 'SIGNUP'
          ? 'Enter your Register Number and DOB to verify against the department whitelist.'
          : role === 'ADMIN'
          ? 'Enter your administrative credentials to manage student registries.'
          : 'Enter your Register Number and chosen password to access your dashboard.'}
      </p>

      {/* Role / Mode switch tabs */}
      <div className="p-1 bg-gray-100/90 rounded-xl flex select-none border border-gray-200/60 text-xs mb-4">
        <button
          type="button"
          onClick={() => { setRole('STUDENT'); setError(''); setActiveField('idle'); }}
          className={`flex-1 py-2 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
            role === 'STUDENT' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => { setRole('SIGNUP'); setError(''); setActiveField('idle'); }}
          className={`flex-1 py-2 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
            role === 'SIGNUP' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Sign Up</span>
        </button>

        <button
          type="button"
          onClick={() => { setRole('ADMIN'); setError(''); setActiveField('idle'); }}
          className={`flex-1 py-2 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
            role === 'ADMIN' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Faculty</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. STUDENT LOGIN FORM */}
      {/* ============================================================ */}
      {role === 'STUDENT' && (
        <form onSubmit={handleStudentSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Register Number</label>
            <div className="relative">
              <input
                type="text"
                value={studentRegNo}
                onChange={(e) => {
                  setStudentRegNo(e.target.value.toUpperCase());
                  if (error) setError('');
                  if (setActiveField) setActiveField('reg');
                }}
                onFocus={() => setActiveField && setActiveField('reg')}
                placeholder="e.g. 71762305041"
                className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-sm uppercase transition-all bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Account Password</label>
            <div className="relative">
              <input
                type={showStudentPassword ? 'text' : 'password'}
                value={studentPassword}
                onChange={(e) => {
                  setStudentPassword(e.target.value);
                  if (error) setError('');
                  if (setActiveField) setActiveField('studentPass');
                }}
                onFocus={() => setActiveField && setActiveField('studentPass')}
                placeholder="Enter your chosen password"
                className="w-full h-11 px-3.5 pr-10 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowStudentPassword(!showStudentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                title={showStudentPassword ? 'Hide password' : 'Show password'}
              >
                {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              className="text-blue-600 font-bold hover:underline"
            >
              Create Account &rarr;
            </button>
          </div>

          <div className="pt-2">
            <MagneticButton
              type="submit"
              disabled={loading || showWelcome}
              className="w-full py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
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
        <form onSubmit={handleSignupSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Register Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Register Number</label>
            <input
              type="text"
              value={signupRegNo}
              onChange={(e) => {
                setSignupRegNo(e.target.value.toUpperCase());
                if (error) setError('');
                if (setActiveField) setActiveField('signupReg');
              }}
              onFocus={() => setActiveField && setActiveField('signupReg')}
              placeholder="e.g. 71762305041"
              className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-xs uppercase bg-white"
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={signupDob}
              onChange={(e) => {
                setSignupDob(e.target.value);
                if (error) setError('');
                if (setActiveField) setActiveField('signupDob');
              }}
              onFocus={() => setActiveField && setActiveField('signupDob')}
              className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs bg-white"
              required
            />
          </div>

          {/* LIVE VERIFICATION STATUS (under DOB) */}
          {verificationStatus && (
            <div
              aria-live="polite"
              className={`p-2.5 rounded-xl text-[11px] border flex items-start gap-2 transition-all ${
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
                    <p className="text-[10px] text-emerald-800 mt-0.5">Pre-registered record verified. Complete details to create your account.</p>
                  </div>
                </>
              )}

              {verificationStatus === 'NO_MATCH' && (
                <>
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>No matching pre-registered record.</strong>
                    <p className="text-[10px] text-rose-800 mt-0.5">
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
                    <p className="text-[10px] text-amber-800 mt-0.5">
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
                    <p className="text-[10px] text-rose-800 mt-0.5">{verificationMessage}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={signupName}
              onChange={(e) => {
                setSignupName(e.target.value);
                if (error) setError('');
                if (setActiveField) setActiveField('signupName');
              }}
              onFocus={() => setActiveField && setActiveField('signupName')}
              placeholder="As per official college records"
              className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs bg-white"
              required
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={signupEmail}
              onChange={(e) => {
                setSignupEmail(e.target.value);
                if (error) setError('');
                if (setActiveField) setActiveField('signupEmail');
              }}
              onFocus={() => setActiveField && setActiveField('signupEmail')}
              placeholder="student@example.com"
              className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs bg-white"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Choose Password</label>
            <div className="relative">
              <input
                type={showSignupPassword ? 'text' : 'password'}
                value={signupPassword}
                onChange={(e) => {
                  setSignupPassword(e.target.value);
                  if (error) setError('');
                  if (setActiveField) setActiveField('signupPass');
                }}
                onFocus={() => setActiveField && setActiveField('signupPass')}
                placeholder="Min 8 chars, 1 uppercase, 1 digit"
                className="w-full h-10 px-3 pr-9 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
              >
                {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Password strength bar */}
          {signupPassword && (
            <div className="space-y-1 px-1">
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                <span>Strength: {pwdStrength.label}</span>
                <span>Min 8 chars (A-Z, a-z, 0-9)</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${pwdStrength.color} ${pwdStrength.width}`} />
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showSignupConfirmPassword ? 'text' : 'password'}
                value={signupConfirmPassword}
                onChange={(e) => {
                  setSignupConfirmPassword(e.target.value);
                  if (error) setError('');
                  if (setActiveField) setActiveField('signupConfirmPass');
                }}
                onFocus={() => setActiveField && setActiveField('signupConfirmPass')}
                placeholder="Re-enter password"
                className="w-full h-10 px-3 pr-9 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
              >
                {showSignupConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {signupConfirmPassword && !passwordsMatch && (
            <p className="text-[11px] text-rose-600 px-1 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match.
            </p>
          )}

          <div className="pt-2">
            <MagneticButton
              type="submit"
              disabled={loading || showWelcome || !isSignupReady}
              className="w-full py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
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
              className="text-blue-600 font-bold hover:underline"
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
        <form onSubmit={handleAdminSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty / Admin Username</label>
            <input
              type="text"
              value={adminUsername}
              onChange={(e) => {
                setAdminUsername(e.target.value);
                if (error) setError('');
                if (setActiveField) setActiveField('adminUser');
              }}
              onFocus={() => setActiveField && setActiveField('adminUser')}
              placeholder="e.g. admin or faculty ID"
              className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Administrator Password</label>
            <div className="relative">
              <input
                type={showAdminPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  if (error) setError('');
                  if (setActiveField) setActiveField('adminPass');
                }}
                onFocus={() => setActiveField && setActiveField('adminPass')}
                placeholder="Enter administrator password"
                className="w-full h-11 px-3.5 pr-10 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                title={showAdminPassword ? 'Hide password' : 'Show password'}
              >
                {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <MagneticButton
              type="submit"
              disabled={loading || showWelcome}
              className="w-full py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </MagneticButton>
          </div>
        </form>
      )}

      {/* Security notice footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <div className="inline-flex items-center gap-1.5 text-[10.5px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Protected by Enterprise Encryption &bull; Dept. of AI &amp; DS</span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;