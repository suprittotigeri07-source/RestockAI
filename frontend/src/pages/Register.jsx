import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onNavigate }) {
  const { register, authError, setAuthError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientError, setClientError] = useState('');

  const hasLength = password.length >= 6;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[\W_]/.test(password);
  const isMatch = password && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');
    setAuthError(null);

    if (!name.trim()) {
      setClientError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setClientError('Please enter a valid email address.');
      return;
    }
    if (!hasLength) {
      setClientError('Password must be at least 6 characters long.');
      return;
    }
    if (!isMatch) {
      setClientError('Password and confirmation password do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, confirmPassword);
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      // Handled in authError
    } finally {
      setSubmitting(false);
    }
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
        maxWidth: '460px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            marginBottom: '12px'
          }}>
            <TrendingUp size={24} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Create Account
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Get started with isolated ML prediction workflows
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
            marginBottom: '16px',
            color: '#b91c1c',
            fontSize: '13px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{clientError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="register-name-input"
                type="text"
                placeholder="Suprit Tigeri"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="register-email-input"
                type="email"
                placeholder="suprit@restockai.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="register-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 42px',
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

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="register-confirm-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  background: '#ffffff',
                  border: `1px solid ${confirmPassword ? (isMatch ? '#86efac' : '#fca5a5') : '#cbd5e1'}`,
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              background: hasLength ? '#f0fdf4' : '#f8fafc',
              color: hasLength ? '#15803d' : '#94a3b8',
              border: `1px solid ${hasLength ? '#bbf7d0' : '#e2e8f0'}`
            }}>
              ✓ 6+ Characters
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              background: (hasNumber || hasSpecial) ? '#f0fdf4' : '#f8fafc',
              color: (hasNumber || hasSpecial) ? '#15803d' : '#94a3b8',
              border: `1px solid ${(hasNumber || hasSpecial) ? '#bbf7d0' : '#e2e8f0'}`
            }}>
              ✓ Number or Symbol
            </span>
            {confirmPassword && (
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isMatch ? '#f0fdf4' : '#fef2f2',
                color: isMatch ? '#15803d' : '#b91c1c',
                border: `1px solid ${isMatch ? '#bbf7d0' : '#fecaca'}`
              }}>
                {isMatch ? '✓ Passwords Match' : '✗ Differ'}
              </span>
            )}
          </div>

          <button
            id="register-submit-button"
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '8px',
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
            {submitting ? 'Creating Account...' : 'Complete Registration'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Already have an account?{' '}
          <button
            id="register-to-login-link"
            type="button"
            onClick={() => onNavigate('login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
