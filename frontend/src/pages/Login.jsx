import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onNavigate }) {
  const { login, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientError, setClientError] = useState('');

  // Clear any stale auth errors from previous sessions when this page mounts
  useEffect(() => {
    setAuthError(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');
    setAuthError(null);

    if (!email.trim()) {
      setClientError('Please enter your email address.');
      return;
    }
    if (!password) {
      setClientError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      // Error is stored in authError
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPwd) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
    setClientError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#f8fafc'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            marginBottom: '14px'
          }}>
            <TrendingUp size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            RestockAI
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Production Prediction & Replenishment Platform
          </p>
        </div>

        {/* Error Alert */}
        {(clientError || authError) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '18px',
            color: '#b91c1c',
            fontSize: '13px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{clientError || authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="login-email-input"
                type="email"
                placeholder="suprit@restockai.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 42px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 42px 11px 42px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '6px',
              padding: '12px 20px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? 'Signing In...' : 'Sign In'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Demo Fast Fill */}
        <div style={{
          marginTop: '22px',
          padding: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Quick Demo Accounts (Or Register New)
          </span>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => handleDemoFill('suprit@restockai.io', 'RestockAI2026!')}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                color: '#1d4ed8',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Demo: Suprit
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('analyst@company.com', 'ForecastPass123!')}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Demo: Analyst
            </button>
          </div>
        </div>

        {/* Sign up prompt */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Don't have an account yet?{' '}
          <button
            id="login-to-register-link"
            type="button"
            onClick={() => onNavigate('register')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
