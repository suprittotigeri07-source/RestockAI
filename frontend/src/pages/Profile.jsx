import React, { useState } from 'react';
import { User, Mail, ShieldCheck, Key, LogOut, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile({ onNavigate }) {
  const { user, logout } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyToken = () => {
    const token = api.getToken();
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    if (onNavigate) onNavigate('login');
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          User Profile & Security
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Manage your authenticated identity, security tokens, and multi-user preferences.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '22px',
            fontWeight: 800
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
              {user?.name || 'User Name'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
              <Mail size={14} /> {user?.email}
              <span>•</span>
              <span style={{ color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> Authenticated
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              User Identifier (UUID)
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
              {user?.id || 'usr_...'}
            </span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              Account Created
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Session'}
            </span>
          </div>
        </div>

        {/* Active Session JWT Token */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={15} color="#2563eb" /> Active JWT Bearer Token
            </span>
            <button
              onClick={handleCopyToken}
              style={{
                padding: '4px 8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                color: '#1d4ed8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copiedToken ? <CheckCircle2 size={12} color="#15803d" /> : <Copy size={12} />}
              {copiedToken ? 'Copied!' : 'Copy Token'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            All prediction and user-data API requests require this signed token in the Authorization header.
          </p>
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '8px 12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#475569',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {api.getToken() || 'No active token found.'}
          </div>
        </div>

        {/* Sign Out Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleLogout}
            style={{
              padding: '9px 18px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
