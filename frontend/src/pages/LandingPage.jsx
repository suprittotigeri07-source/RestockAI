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
  const [isWarmingUp, setIsWarmingUp] = useState(false);

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

  React.useEffect(() => {
    const handleWarmingUp = () => setIsWarmingUp(true);
    const handleWarmedUp = () => setIsWarmingUp(false);
    window.addEventListener('api:warming-up', handleWarmingUp);
    window.addEventListener('api:warmed-up', handleWarmedUp);
    return () => {
      window.removeEventListener('api:warming-up', handleWarmingUp);
      window.removeEventListener('api:warmed-up', handleWarmedUp);
    };
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
      setLoginError(err.message || 'Login failed. Please check your credentials.');
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
      setRegError(err.message || 'Registration failed. Please check your network and try again.');
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
    <div className="landing-bg-grid" style={{ minHeight: '100vh', color: '#111439', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Dynamic Ambient Gradient Orbs */}
      <div className="orb-container">
        <div className="orb orb-blue" />
        <div className="orb orb-purple" />
        <div className="orb orb-cyan" />
        <div className="orb orb-pink" />
      </div>

      {/* Top Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(248, 248, 249, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(17, 20, 57, 0.08)'
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
              background: 'linear-gradient(135deg, #111439 0%, #2563eb 50%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
            }}>
              <TrendingUp size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: '#111439', display: 'flex', alignItems: 'center', gap: '8px' }}>
                RestockAI
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  color: '#2563eb'
                }}>
                  v2.4 Live
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#646c9a' }}>
                Production Demand &amp; Replenishment Intelligence
              </div>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#features" style={{ fontSize: '13px', fontWeight: 600, color: '#111439', textDecoration: 'none' }}>
              Features
            </a>
            <a href="#workflow" style={{ fontSize: '13px', fontWeight: 600, color: '#111439', textDecoration: 'none' }}>
              Workflow
            </a>
            <a href="#architecture" style={{ fontSize: '13px', fontWeight: 600, color: '#111439', textDecoration: 'none' }}>
              Architecture
            </a>
          </nav>

          {/* Auth Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => scrollToAuth('login')}
              className="btn-glass-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Sign In
            </button>
            <button
              onClick={() => scrollToAuth('register')}
              className="btn-multi-gradient"
              style={{ padding: '8px 16px', fontSize: '13px' }}
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
              border: '1px solid rgba(17, 20, 57, 0.1)',
              boxShadow: '0 2px 8px rgba(17, 20, 57, 0.04)',
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
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#111439' }}>
                XGBoost ML Engine Active
              </span>
              <span style={{ color: 'rgba(17, 20, 57, 0.2)' }}>|</span>
              <span style={{ fontSize: '12px', color: '#646c9a' }}>
                Non-Hardcoded Inferences
              </span>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: '44px',
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#111439',
              marginBottom: '18px'
            }}>
              Predict Demand.{' '}
              <span style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #06b6d4 100%)',
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
              color: '#323868',
              marginBottom: '32px',
              maxWidth: '560px'
            }}>
              RestockAI transforms retail pricing, lead times, promotions, and market seasonality into high-precision demand forecasts with statistical 90% confidence bounds and automated store replenishment plans.
            </p>

            {/* Key Value Feature Highlights (3-4 points) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div className="glass-card-dark card-glow-blue" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid rgba(17, 20, 57, 0.08)'
              }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)' }}>
                  <Cpu size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111439' }}>
                    Dynamic ML Engine
                  </div>
                  <div style={{ fontSize: '12px', color: '#474d84', marginTop: '2px' }}>
                    Live XGBoost regressors & price elasticity modelling.
                  </div>
                </div>
              </div>

              <div className="glass-card-dark card-glow-blue" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid rgba(17, 20, 57, 0.08)'
              }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.15)' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111439' }}>
                    Isolated Multi-Tenancy
                  </div>
                  <div style={{ fontSize: '12px', color: '#474d84', marginTop: '2px' }}>
                    Bcrypt password hashing & strict per-user data sandbox.
                  </div>
                </div>
              </div>

              <div className="glass-card-dark card-glow-blue" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid rgba(17, 20, 57, 0.08)'
              }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', boxShadow: '0 2px 8px rgba(6, 182, 212, 0.15)' }}>
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111439' }}>
                    Store Replenishment
                  </div>
                  <div style={{ fontSize: '12px', color: '#474d84', marginTop: '2px' }}>
                    Automated safety stocks, reorder points & CSV export.
                  </div>
                </div>
              </div>

              <div className="glass-card-dark card-glow-blue" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid rgba(17, 20, 57, 0.08)'
              }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', boxShadow: '0 2px 8px rgba(236, 72, 153, 0.15)' }}>
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111439' }}>
                    Scenario Studio
                  </div>
                  <div style={{ fontSize: '12px', color: '#474d84', marginTop: '2px' }}>
                    Save custom feature presets and replay inferences.
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs & Trust Metrics */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <button
                onClick={() => scrollToAuth('register')}
                className="btn-multi-gradient"
                style={{
                  padding: '14px 28px',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Get Started Free <ArrowRight size={18} />
              </button>

              <button
                onClick={() => handleDemoFill('suprit@restockai.io', 'RestockAI2026!')}
                className="btn-glass-secondary"
                style={{
                  padding: '14px 22px',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Zap size={18} color="#2563eb" /> Try Demo Account
              </button>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '20px', borderTop: '1px solid rgba(17, 20, 57, 0.08)' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#111439' }}>90%</div>
                <div style={{ fontSize: '11px', color: '#646c9a' }}>Confidence Bounds</div>
              </div>
              <div style={{ width: '1px', height: '28px', background: 'rgba(17, 20, 57, 0.08)' }} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>&lt;45ms</div>
                <div style={{ fontSize: '11px', color: '#646c9a' }}>Inference Latency</div>
              </div>
              <div style={{ width: '1px', height: '28px', background: 'rgba(17, 20, 57, 0.08)' }} />
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed' }}>100%</div>
                <div style={{ fontSize: '11px', color: '#646c9a' }}>Tenant Isolation</div>
              </div>
            </div>
          </div>

          {/* Right Section — Authentication Card */}
          <div ref={authCardRef} style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel-dark" style={{
              width: '100%',
              maxWidth: '460px',
              padding: '32px 28px',
              background: '#ffffff',
              border: '1px solid rgba(17, 20, 57, 0.08)',
              boxShadow: '0 20px 45px -10px rgba(17, 20, 57, 0.1), 0 4px 16px -2px rgba(17, 20, 57, 0.04)',
              position: 'relative'
            }}>
              {/* Card Header & Brand Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111439', letterSpacing: '-0.02em' }}>
                    {authTab === 'forgot' ? 'Reset Password' : authTab === 'login' ? 'Sign In to RestockAI' : 'Create Workspace'}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#646c9a', marginTop: '3px' }}>
                    {authTab === 'forgot'
                      ? 'Enter your registered email to receive token'
                      : authTab === 'login'
                        ? 'Enter your credentials or choose a demo profile'
                        : 'Deploy your personal prediction workspace'}
                  </p>
                </div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #111439 0%, #2563eb 50%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0
                }}>
                  <TrendingUp size={22} color="#ffffff" />
                </div>
              </div>

              {/* Tab Switcher (Login | Sign Up) */}
              {authTab !== 'forgot' && (
                <div style={{
                  display: 'flex',
                  background: '#f1f1f5',
                  padding: '4px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid rgba(17, 20, 57, 0.06)'
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

              {/* Warming up Alert */}
              {isWarmingUp && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  color: '#b45309',
                  fontSize: '13px'
                }}>
                  <RefreshCw size={16} style={{ flexShrink: 0, animation: 'spin 2s linear infinite' }} />
                  <span>Warming up the server, this may take up to a minute on first load...</span>
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
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#111439', marginBottom: '6px' }}>
                      Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#646c9a' }} />
                      <input
                        id="login-email-input"
                        type="email"
                        placeholder="suprit@restockai.io"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          background: '#F8F8F9',
                          border: '1px solid rgba(17, 20, 57, 0.12)',
                          borderRadius: '10px',
                          color: '#111439',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#111439' }}>
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
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#646c9a' }} />
                      <input
                        id="login-password-input"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 38px',
                          background: '#F8F8F9',
                          border: '1px solid rgba(17, 20, 57, 0.12)',
                          borderRadius: '10px',
                          color: '#111439',
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
                          color: '#646c9a',
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
                    className="btn-multi-gradient"
                    style={{
                      marginTop: '6px',
                      padding: '12px 18px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: loginSubmitting ? 0.75 : 1
                    }}
                  >
                    {loginSubmitting ? 'Authenticating...' : 'Sign In'}
                    {!loginSubmitting && <ArrowRight size={16} />}
                  </button>

                  {/* Fast Fill Demo Profiles */}
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#f1f1f5',
                    border: '1px solid rgba(17, 20, 57, 0.08)',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#646c9a', display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                      1-Click Demo Profiles
                    </span>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDemoFill('suprit@restockai.io', 'RestockAI2026!')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          background: '#ffffff',
                          border: '1px solid rgba(17, 20, 57, 0.12)',
                          borderRadius: '8px',
                          color: '#111439',
                          cursor: 'pointer',
                          fontWeight: 700,
                          boxShadow: '0 1px 4px rgba(17, 20, 57, 0.04)'
                        }}
                      >
                        Demo: Suprit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoFill('analyst@company.com', 'ForecastPass123!')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          background: '#ffffff',
                          border: '1px solid rgba(17, 20, 57, 0.12)',
                          borderRadius: '8px',
                          color: '#111439',
                          cursor: 'pointer',
                          fontWeight: 700,
                          boxShadow: '0 1px 4px rgba(17, 20, 57, 0.04)'
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
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#111439', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#646c9a' }} />
                      <input
                        id="register-name-input"
                        type="text"
                        placeholder="Alex Morgan"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          background: '#F8F8F9',
                          border: '1px solid rgba(17, 20, 57, 0.12)',
                          borderRadius: '10px',
                          color: '#111439',
                          fontSize: '13px',
                          outline: 'none',
                          fontWeight: 500
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#111439', marginBottom: '6px' }}>
                      Work Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#646c9a' }} />
                      <input
                        id="register-email-input"
                        type="email"
                        placeholder="alex@enterprise.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          background: '#F8F8F9',
                          border: '1px solid rgba(17, 20, 57, 0.12)',
                          borderRadius: '10px',
                          color: '#111439',
                          fontSize: '13px',
                          outline: 'none',
                          fontWeight: 500
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#111439', marginBottom: '6px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#646c9a' }} />
                      <input
                        id="register-password-input"
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 38px',
                          background: '#F8F8F9',
                          border: '1px solid rgba(17, 20, 57, 0.12)',
                          borderRadius: '10px',
                          color: '#111439',
                          fontSize: '13px',
                          outline: 'none',
                          fontWeight: 500
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
                          color: '#646c9a',
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#111439', marginBottom: '6px' }}>
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#646c9a' }} />
                      <input
                        id="register-confirm-password-input"
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Repeat password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          background: '#F8F8F9',
                          border: `1px solid ${regConfirmPassword ? (regIsMatch ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)') : 'rgba(17, 20, 57, 0.12)'}`,
                          borderRadius: '10px',
                          color: '#111439',
                          fontSize: '13px',
                          outline: 'none',
                          fontWeight: 500
                        }}
                      />
                    </div>
                  </div>

                  {/* Real-time badges */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: regHasLength ? 'rgba(16, 185, 129, 0.12)' : 'rgba(17, 20, 57, 0.05)',
                      color: regHasLength ? '#059669' : '#646c9a',
                      border: `1px solid ${regHasLength ? 'rgba(16, 185, 129, 0.3)' : 'rgba(17, 20, 57, 0.1)'}`,
                      fontWeight: 700
                    }}>
                      ✓ 6+ Chars
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: regHasNumberOrSpecial ? 'rgba(16, 185, 129, 0.12)' : 'rgba(17, 20, 57, 0.05)',
                      color: regHasNumberOrSpecial ? '#059669' : '#646c9a',
                      border: `1px solid ${regHasNumberOrSpecial ? 'rgba(16, 185, 129, 0.3)' : 'rgba(17, 20, 57, 0.1)'}`,
                      fontWeight: 700
                    }}>
                      ✓ Symbol/Digit
                    </span>
                    {regConfirmPassword && (
                      <span style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: regIsMatch ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: regIsMatch ? '#059669' : '#dc2626',
                        border: `1px solid ${regIsMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        fontWeight: 700
                      }}>
                        {regIsMatch ? '✓ Matches' : '✗ Differs'}
                      </span>
                    )}
                  </div>

                  <button
                    id="register-submit-button"
                    type="submit"
                    disabled={regSubmitting}
                    className="btn-multi-gradient"
                    style={{
                      marginTop: '6px',
                      padding: '12px 18px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: regSubmitting ? 0.75 : 1
                    }}
                  >
                    {regSubmitting ? 'Creating Account...' : 'Complete Registration'}
                    {!regSubmitting && <ArrowRight size={16} />}
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
                      color: '#2563eb',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: '16px',
                      padding: 0
                    }}
                  >
                    ← Back to Sign In
                  </button>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#111439', marginBottom: '6px' }}>
                          Registered Email
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#646c9a' }} />
                          <input
                            type="email"
                            placeholder="suprit@restockai.io"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px 10px 38px',
                              background: '#F8F8F9',
                              border: '1px solid rgba(17, 20, 57, 0.12)',
                              borderRadius: '10px',
                              color: '#111439',
                              fontSize: '13px',
                              outline: 'none',
                              fontWeight: 500
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="btn-multi-gradient"
                        style={{
                          padding: '12px 18px',
                          fontSize: '14px',
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
                    <form onSubmit={handleForgotReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#111439', marginBottom: '6px' }}>
                          Reset Token
                        </label>
                        <input
                          type="text"
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#eff6ff',
                            border: '1px solid rgba(37, 99, 235, 0.3)',
                            borderRadius: '10px',
                            color: '#1d4ed8',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            outline: 'none',
                            fontWeight: 700
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#111439', marginBottom: '6px' }}>
                          New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#646c9a' }} />
                          <input
                            type="password"
                            placeholder="Min. 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px 10px 38px',
                              background: '#F8F8F9',
                              border: '1px solid rgba(17, 20, 57, 0.12)',
                              borderRadius: '10px',
                              color: '#111439',
                              fontSize: '13px',
                              outline: 'none',
                              fontWeight: 500
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="btn-multi-gradient"
                        style={{
                          padding: '12px 18px',
                          fontSize: '14px',
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
        <section id="features" style={{ padding: '80px 0', borderTop: '1px solid rgba(17, 20, 57, 0.08)', background: 'transparent' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 40px 24px', textAlign: 'center' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#2563eb',
              display: 'inline-block',
              background: 'rgba(37, 99, 235, 0.08)',
              padding: '4px 14px',
              borderRadius: '20px',
              marginBottom: '12px'
            }}>
              Intelligent Inventory Platform
            </span>
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#111439', letterSpacing: '-0.02em', marginBottom: '14px' }}>
              Engineered for Precision Forecasting
            </h2>
            <p style={{ fontSize: '15px', color: '#323868', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
              Designed to help retail operators and demand planners model real-world variables, reduce inventory carrying costs, and prevent revenue-draining stockouts.
            </p>
          </div>

          <div className="features-grid">
            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12))', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <Cpu size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginBottom: '10px' }}>
                XGBoost Non-Linear Engine
              </h3>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                Leverages tree-based gradient boosting models trained on historical retail demand patterns, accounting for non-linear interactions across features.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(37, 99, 235, 0.12))', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <BarChart2 size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginBottom: '10px' }}>
                90% Confidence Bounds
              </h3>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                Calculates upper and lower statistical uncertainty boundaries to protect operations during seasonal volatility and unexpected demand spikes.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(124, 58, 237, 0.12))', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginBottom: '10px' }}>
                Store Replenishment Engine
              </h3>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                Generates actionable reorder triggers, calculates safety stock buffer sizes, and tags replenishment urgency levels for store managers.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12))', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <SlidersHorizontal size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginBottom: '10px' }}>
                Scenario Studio & Presets
              </h3>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                Save custom feature combinations into reusable dataset scenarios. Simulate holiday promotions, price changes, and supplier lead times in 1-click.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.12))', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <FileSpreadsheet size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginBottom: '10px' }}>
                CSV & Google Sheets Ready
              </h3>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                Export store recommendations and forecast distributions directly to CSV or cloud spreadsheets for logistics teams and procurement pipelines.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(37, 99, 235, 0.12))', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginBottom: '10px' }}>
                Strict Multi-User Security
              </h3>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                Bcrypt password protection with salted keys and signed JWT authorization tokens. Every user's datasets and predictions are completely sandboxed.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: 3-Step Workflow */}
        <section id="workflow" style={{ padding: '80px 0', borderTop: '1px solid rgba(17, 20, 57, 0.08)', background: 'rgba(255, 255, 255, 0.45)' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 40px 24px', textAlign: 'center' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#7c3aed',
              display: 'inline-block',
              background: 'rgba(124, 58, 237, 0.08)',
              padding: '4px 14px',
              borderRadius: '20px',
              marginBottom: '12px'
            }}>
              Operational Pipeline
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111439', letterSpacing: '-0.02em', marginBottom: '12px' }}>
              From Input Parameters to In-Store Action
            </h2>
            <p style={{ fontSize: '15px', color: '#323868', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Three simple steps to generate production-grade predictions and automated replenishment orders.
            </p>
          </div>

          <div className="workflow-steps-grid">
            <div className="glass-card" style={{ padding: '34px 28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '28px',
                background: 'var(--gradient-btn)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}>
                STEP 1
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginTop: '8px', marginBottom: '10px' }}>
                Ingest Scenario Variables
              </h4>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                Define unit price, supplier lead time, promotional discount depth, historical baseline volume, and upcoming holiday multipliers.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '34px 28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '28px',
                background: 'var(--gradient-btn)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}>
                STEP 2
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginTop: '8px', marginBottom: '10px' }}>
                XGBoost ML Inference
              </h4>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                The FastAPI inference pipeline normalizes features, executes regression scoring, and computes 90% confidence bands in under 50ms.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '34px 28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '28px',
                background: 'var(--gradient-btn)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}>
                STEP 3
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#111439', marginTop: '8px', marginBottom: '10px' }}>
                Execute Replenishment
              </h4>
              <p style={{ fontSize: '13px', color: '#474d84', lineHeight: 1.6 }}>
                Review safety stock requirements, automated stockout warnings, and export distribution schedules to store managers and warehouse leads.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: Architecture Specs */}
        <section id="architecture" style={{ padding: '80px 0', borderTop: '1px solid rgba(17, 20, 57, 0.08)', background: 'transparent' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #111439 0%, #1a1f59 55%, #2563eb 100%)',
              borderRadius: '24px',
              padding: '48px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 40px rgba(17, 20, 57, 0.15), 0 0 30px rgba(37, 99, 235, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Production Architecture
                  </span>
                  <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
                    Modern, Scalable & Decoupled Stack
                  </h3>
                </div>
                <button
                  onClick={() => scrollToAuth('register')}
                  className="btn-multi-gradient"
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px'
                  }}
                >
                  Deploy Your Workspace
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '18px 22px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>API Gateway</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>FastAPI (Async Python)</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '18px 22px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>ML Inference</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>XGBoost & Scikit-Learn</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '18px 22px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Security & Auth</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>Bcrypt + Signed JWT</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '18px 22px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Frontend Client</div>
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
        borderTop: '1px solid rgba(17, 20, 57, 0.08)',
        padding: '32px 24px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--gradient-btn)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.25)'
            }}>
              <TrendingUp size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#111439' }}>
              RestockAI
            </span>
            <span style={{ fontSize: '12px', color: '#646c9a' }}>
              — Production Multi-User Prediction & Inventory Platform
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#646c9a' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#111439', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }} />
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
