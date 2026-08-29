import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  Cpu,
  ShieldCheck,
  Layers,
  SlidersHorizontal,
  BarChart2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Key,
  Database,
  Sparkles,
  Zap,
  Check,
  ChevronDown,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LandingPage({ initialTab = 'login', onNavigate }) {
  const { login, register, authError, setAuthError } = useAuth();
  const [authTab, setAuthTab] = useState(initialTab); // 'login', 'register', or 'forgot'

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Form states - Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState('');

  // Form states - Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState('');
  const [forgotError, setForgotError] = useState('');

  const authCardRef = useRef(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const emailParam = params.get('email');
    if (token) {
      setAuthTab('forgot');
      setResetToken(token);
      setForgotStep(2);
      if (emailParam) {
        setForgotEmail(emailParam);
      }
    }
  }, []);

  const scrollToAuth = (tab = 'login') => {
    setAuthTab(tab);
    setLoginError('');
    setRegError('');
    setAuthError(null);
    if (authCardRef.current) {
      authCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const switchTab = (tab) => {
    setAuthTab(tab);
    setLoginError('');
    setRegError('');
    setAuthError(null);
  };

  // Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setAuthError(null);

    if (!loginEmail.trim()) {
      setLoginError('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoginSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      // Error handled in AuthContext
      setLoginPassword('');
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setAuthError(null);

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (!/[0-9]/.test(regPassword) && !/[\W_]/.test(regPassword)) {
      setRegError('Password must contain at least one digit or special character (e.g. 1, !, @).');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Password and confirmation password do not match.');
      return;
    }

    setRegSubmitting(true);
    try {
      await register(regName.trim(), regEmail.trim(), regPassword, regConfirmPassword);
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      // Error handled in AuthContext
      setRegPassword('');
      setRegConfirmPassword('');
    } finally {
      setRegSubmitting(false);
    }
  };

  // Demo fill
  const handleDemoFill = (emailVal, pwdVal) => {
    setAuthTab('login');
    setLoginEmail(emailVal);
    setLoginPassword(pwdVal);
    setLoginError('');
    setAuthError(null);
  };

  // Forgot Password step 1
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotStatus('');

    try {
      const res = await api.auth.forgotPassword({ email: forgotEmail.trim() });
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setForgotStatus('Reset token generated! Enter your new password below.');
        setForgotStep(2);
      } else {
        setForgotStatus(res.message);
      }
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password step 2
  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await api.auth.resetPassword({
        email: forgotEmail.trim(),
        reset_token: resetToken,
        new_password: newPassword
      });
      setForgotStatus(res.message || 'Password successfully updated!');
      setTimeout(() => {
        setAuthTab('login');
        setLoginEmail(forgotEmail);
        setLoginPassword('');
        setForgotStep(1);
        setForgotStatus('');
      }, 1800);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const regHasLength = regPassword.length >= 6;
  const regHasNumberOrSpecial = /[0-9\W_]/.test(regPassword);
  const regIsMatch = regPassword && regPassword === regConfirmPassword;

  return (
    <div className="landing-bg-grid" style={{ minHeight: '100vh', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}>
              <TrendingUp size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                RestockAI
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8'
                }}>
                  v2.4 Live
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Production Demand & Replenishment Intelligence
              </div>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#features" style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
              Features
            </a>
            <a href="#workflow" style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
              Workflow
            </a>
            <a href="#architecture" style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
              Architecture
            </a>
          </nav>

          {/* Auth Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => scrollToAuth('login')}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => scrollToAuth('register')}
              style={{
                padding: '8px 16px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {/* HERO SECTION — Two-Section Layout */}
        <section className="hero-container">
          {/* Left Section — Website Information & Value Proposition */}
          <div>
            {/* Status Live Pulse Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              marginBottom: '20px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                display: 'inline-block'
              }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                XGBoost ML Engine Active
              </span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Non-Hardcoded Inferences
              </span>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: '40px',
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0f172a',
              marginBottom: '16px'
            }}>
              Predict Demand.{' '}
              <span style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Optimize Restocking.
              </span>{' '}
              Eliminate Stockouts.
            </h1>

            {/* Description */}
            <p style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#475569',
              marginBottom: '28px',
              maxWidth: '560px'
            }}>
              RestockAI transforms retail pricing, lead times, promotions, and market seasonality into high-precision demand forecasts with statistical 90% confidence bounds and automated store replenishment plans.
            </p>

            {/* Key Value Feature Highlights (3-4 points) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
                  <Cpu size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    Dynamic ML Engine
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Live XGBoost regressors & price elasticity modelling.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    Isolated Multi-Tenancy
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Bcrypt password hashing & strict per-user data sandbox.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: '#faf5ff', color: '#9333ea' }}>
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    Store Replenishment
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Automated safety stocks, reorder points & CSV export.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: '#fffbeb', color: '#d97706' }}>
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    Scenario Studio
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Save custom feature presets and replay inferences.
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs & Trust Metrics */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
              <button
                onClick={() => scrollToAuth('register')}
                style={{
                  padding: '12px 24px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                }}
              >
                Get Started Free <ArrowRight size={16} />
              </button>

              <button
                onClick={() => handleDemoFill('suprit@restockai.io', 'RestockAI2026!')}
                style={{
                  padding: '12px 20px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Zap size={16} color="#d97706" /> Try Demo Account
              </button>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>90%</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Confidence Intervals</div>
              </div>
              <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>&lt;45ms</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Inference Latency</div>
              </div>
              <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>100%</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tenant Isolation</div>
              </div>
            </div>
          </div>

          {/* Right Section — Authentication Card */}
          <div ref={authCardRef} style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: '460px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '32px 28px',
              boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}>
              {/* Card Header & Brand Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {authTab === 'forgot' ? 'Reset Password' : authTab === 'login' ? 'Sign In to RestockAI' : 'Create Workspace'}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {authTab === 'forgot'
                      ? 'Enter your registered email to receive token'
                      : authTab === 'login'
                        ? 'Enter your credentials or choose a demo profile'
                        : 'Deploy your personal prediction workspace'}
                  </p>
                </div>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0
                }}>
                  <TrendingUp size={20} color="#ffffff" />
                </div>
              </div>

              {/* Tab Switcher (Login | Sign Up) */}
              {authTab !== 'forgot' && (
                <div style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  border: '1px solid #e2e8f0'
                }}>
                  <button
                    type="button"
                    className={`auth-tab-btn ${authTab === 'login' ? 'active' : 'inactive'}`}
                    onClick={() => switchTab('login')}
                  >
                    <Lock size={14} /> Sign In
                  </button>
                  <button
                    type="button"
                    className={`auth-tab-btn ${authTab === 'register' ? 'active' : 'inactive'}`}
                    onClick={() => switchTab('register')}
                  >
                    <User size={14} /> Create Account
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {(loginError || regError || authError || forgotError) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  color: '#b91c1c',
                  fontSize: '13px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{loginError || regError || authError || forgotError}</span>
                </div>
              )}

              {/* Success Alert for Reset */}
              {forgotStatus && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  color: '#15803d',
                  fontSize: '13px'
                }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{forgotStatus}</span>
                </div>
              )}

              {/* --- LOGIN FORM --- */}
              {authTab === 'login' && (
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        id="login-email-input"
                        type="email"
                        placeholder="suprit@restockai.io"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('forgot');
                          setForgotStep(1);
                          setForgotError('');
                          setForgotStatus('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        id="login-password-input"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 38px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex'
                        }}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="login-submit-button"
                    type="submit"
                    disabled={loginSubmitting}
                    style={{
                      marginTop: '4px',
                      padding: '11px 18px',
                      background: '#2563eb',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: loginSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      opacity: loginSubmitting ? 0.75 : 1
                    }}
                  >
                    {loginSubmitting ? 'Authenticating...' : 'Sign In'}
                    {!loginSubmitting && <ArrowRight size={15} />}
                  </button>

                  {/* Fast Fill Demo Profiles */}
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                      1-Click Demo Profiles
                    </span>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDemoFill('suprit@restockai.io', 'RestockAI2026!')}
                        style={{
                          padding: '5px 8px',
                          fontSize: '11px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          color: '#1d4ed8',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Demo: Suprit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoFill('analyst@company.com', 'ForecastPass123!')}
                        style={{
                          padding: '5px 8px',
                          fontSize: '11px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          color: '#334155',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Demo: Analyst
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* --- SIGN UP / REGISTER FORM --- */}
              {authTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        id="register-name-input"
                        type="text"
                        placeholder="Alex Morgan"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 38px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Work Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        id="register-email-input"
                        type="email"
                        placeholder="alex@enterprise.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 38px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        id="register-password-input"
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 38px 9px 38px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex'
                        }}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        id="register-confirm-password-input"
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Repeat password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 38px',
                          background: '#ffffff',
                          border: `1px solid ${regConfirmPassword ? (regIsMatch ? '#86efac' : '#fca5a5') : '#cbd5e1'}`,
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Real-time badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: regHasLength ? '#f0fdf4' : '#f8fafc',
                      color: regHasLength ? '#15803d' : '#94a3b8',
                      border: `1px solid ${regHasLength ? '#bbf7d0' : '#e2e8f0'}`
                    }}>
                      ✓ 6+ Chars
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: regHasNumberOrSpecial ? '#f0fdf4' : '#f8fafc',
                      color: regHasNumberOrSpecial ? '#15803d' : '#94a3b8',
                      border: `1px solid ${regHasNumberOrSpecial ? '#bbf7d0' : '#e2e8f0'}`
                    }}>
                      ✓ Symbol/Digit
                    </span>
                    {regConfirmPassword && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: regIsMatch ? '#f0fdf4' : '#fef2f2',
                        color: regIsMatch ? '#15803d' : '#b91c1c',
                        border: `1px solid ${regIsMatch ? '#bbf7d0' : '#fecaca'}`
                      }}>
                        {regIsMatch ? '✓ Matches' : '✗ Differs'}
                      </span>
                    )}
                  </div>

                  <button
                    id="register-submit-button"
                    type="submit"
                    disabled={regSubmitting}
                    style={{
                      marginTop: '4px',
                      padding: '11px 18px',
                      background: '#2563eb',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: regSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      opacity: regSubmitting ? 0.75 : 1
                    }}
                  >
                    {regSubmitting ? 'Creating Account...' : 'Complete Registration'}
                    {!regSubmitting && <ArrowRight size={15} />}
                  </button>
                </form>
              )}

              {/* --- FORGOT PASSWORD SUB-VIEW --- */}
              {authTab === 'forgot' && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setForgotError('');
                      setForgotStatus('');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginBottom: '14px',
                      padding: 0
                    }}
                  >
                    ← Back to Sign In
                  </button>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                          Registered Email
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="email"
                            placeholder="suprit@restockai.io"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px 10px 38px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              color: '#0f172a',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        style={{
                          padding: '11px 18px',
                          background: '#2563eb',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: forgotLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {forgotLoading ? 'Generating Token...' : 'Generate Reset Token'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotReset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Reset Token
                        </label>
                        <input
                          type="text"
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            color: '#1e40af',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="password"
                            placeholder="Min. 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px 9px 38px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              color: '#0f172a',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        style={{
                          padding: '11px 18px',
                          background: '#15803d',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: forgotLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {forgotLoading ? 'Updating Password...' : 'Save & Proceed to Sign In'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION: Core Capabilities Grid */}
        <section id="features" style={{ padding: '60px 0', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 32px 24px', textAlign: 'center' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#2563eb',
              display: 'block',
              marginBottom: '8px'
            }}>
              Intelligent Inventory Platform
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Engineered for Precision Forecasting
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '620px', margin: '0 auto' }}>
              Designed to help retail operators and demand planners model real-world variables, reduce inventory carrying costs, and prevent revenue-draining stockouts.
            </p>
          </div>

          <div className="features-grid">
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Cpu size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                XGBoost Non-Linear Engine
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Leverages tree-based gradient boosting models trained on historical retail demand patterns, accounting for non-linear interactions across features.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <BarChart2 size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                90% Confidence Bounds
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Calculates upper and lower statistical uncertainty boundaries to protect operations during seasonal volatility and unexpected demand spikes.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Store Replenishment Engine
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Generates actionable reorder triggers, calculates safety stock buffer sizes, and tags replenishment urgency levels for store managers.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <SlidersHorizontal size={18} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Scenario Studio & Presets
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Save custom feature combinations into reusable dataset scenarios. Simulate holiday promotions, price changes, and supplier lead times in 1-click.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <FileSpreadsheet size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                CSV & Google Sheets Ready
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Export store recommendations and forecast distributions directly to CSV or cloud spreadsheets for logistics teams and procurement pipelines.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Strict Multi-User Security
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Bcrypt password protection with salted keys and signed JWT authorization tokens. Every user's datasets and predictions are completely sandboxed.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: 3-Step Workflow */}
        <section id="workflow" style={{ padding: '60px 0', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 36px 24px', textAlign: 'center' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#2563eb',
              display: 'block',
              marginBottom: '8px'
            }}>
              Operational Pipeline
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '10px' }}>
              From Input Parameters to In-Store Action
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '580px', margin: '0 auto' }}>
              Three simple steps to generate production-grade predictions and automated replenishment orders.
            </p>
          </div>

          <div className="workflow-steps-grid">
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '28px 24px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '24px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px'
              }}>
                STEP 1
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
                Ingest Scenario Variables
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Define unit price, supplier lead time, promotional discount depth, historical baseline volume, and upcoming holiday multipliers.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '28px 24px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '24px',
                background: '#4f46e5',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px'
              }}>
                STEP 2
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
                XGBoost ML Inference
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                The FastAPI inference pipeline normalizes features, executes regression scoring, and computes 90% confidence bands in under 50ms.
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '28px 24px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '24px',
                background: '#16a34a',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px'
              }}>
                STEP 3
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
                Execute Replenishment
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Review safety stock requirements, automated stockout warnings, and export distribution schedules to store managers and warehouse leads.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: Architecture Specs */}
        <section id="architecture" style={{ padding: '60px 0', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '20px',
              padding: '40px 36px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Production Architecture
                  </span>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    Modern, Scalable & Decoupled Stack
                  </h3>
                </div>
                <button
                  onClick={() => scrollToAuth('register')}
                  style={{
                    padding: '10px 20px',
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Deploy Your Workspace
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>API Gateway</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>FastAPI (Async Python)</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>ML Inference</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>XGBoost & Scikit-Learn</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Security & Auth</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>Bcrypt + Signed JWT</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Frontend Client</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>React 19 + Vite</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '28px 24px',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={16} color="#ffffff" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              RestockAI
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              — Production Multi-User Prediction & Inventory Platform
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              All Systems Operational
            </span>
            <span>·</span>
            <span>&copy; {new Date().getFullYear()} RestockAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
