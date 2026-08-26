import React, { useState } from 'react';
import {
  TrendingUp,
  SlidersHorizontal,
  History,
  Database,
  Layers,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  BarChart2,
  ChevronRight
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AddData from './pages/AddData';
import PredictionResult from './pages/PredictionResult';
import HistoryPage from './pages/History';
import UserDataList from './pages/UserDataList';
import StoreIntelligence from './pages/StoreIntelligence';
import Profile from './pages/Profile';

function AppContent() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activePrediction, setActivePrediction] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If initial auth check is loading
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        color: '#64748b'
      }}>
        <div style={{
          display: 'inline-block',
          width: '36px',
          height: '36px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  // Unauthenticated routing - Show Modern Landing Page with Integrated Auth Card
  if (!isAuthenticated) {
    if (currentPage === 'register') {
      return <LandingPage initialTab="register" onNavigate={(p) => setCurrentPage(p)} />;
    }
    if (currentPage === 'forgot-password') {
      return <LandingPage initialTab="forgot" onNavigate={(p) => setCurrentPage(p)} />;
    }
    return <LandingPage initialTab="login" onNavigate={(p) => setCurrentPage(p)} />;
  }

  const navigate = (page, options = {}) => {
    if (options.preset) {
      setActivePreset(options.preset);
    }
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'add-data', label: 'Prediction Studio', icon: SlidersHorizontal },
    { id: 'history', label: 'Prediction History', icon: History },
    { id: 'user-data', label: 'Saved Datasets', icon: Database },
    { id: 'store-intelligence', label: 'Store Replenishment', icon: Layers },
    { id: 'profile', label: 'Profile & Security', icon: UserIcon }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc', color: '#0f172a' }}>
      {/* Sidebar (Desktop) */}
      <aside style={{
        width: '260px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 30,
        flexShrink: 0
      }}>
        {/* Brand */}
        <div style={{
          padding: '22px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
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
            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#0f172a' }}>
              RestockAI
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              ML Prediction Engine
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div style={{ padding: '16px 16px 8px 16px' }}>
          <button
            onClick={() => navigate('add-data')}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
            }}
          >
            <PlusCircle size={16} /> New Prediction
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id || (item.id === 'add-data' && currentPage === 'prediction-result');

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: active ? '#eff6ff' : 'transparent',
                  color: active ? '#1d4ed8' : '#475569',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} color={active ? '#2563eb' : '#64748b'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff'
        }}>
          <div
            onClick={() => navigate('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              color: '#2563eb'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              setCurrentPage('login');
            }}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <header style={{
          height: '60px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              FastAPI Engine Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              fontWeight: 600
            }}>
              Active Workspace
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, paddingBottom: '40px' }}>
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={(p, opts) => navigate(p, opts)}
              onSelectPrediction={(pred) => setActivePrediction(pred)}
            />
          )}

          {currentPage === 'add-data' && (
            <AddData
              onNavigate={(p) => navigate(p)}
              onPredictionCreated={(pred) => setActivePrediction(pred)}
              initialPreset={activePreset}
            />
          )}

          {currentPage === 'prediction-result' && (
            <PredictionResult
              prediction={activePrediction}
              onNavigate={(p) => navigate(p)}
            />
          )}

          {currentPage === 'history' && (
            <HistoryPage
              onNavigate={(p) => navigate(p)}
              onSelectPrediction={(pred) => setActivePrediction(pred)}
            />
          )}

          {currentPage === 'user-data' && (
            <UserDataList
              onNavigate={(p) => navigate(p)}
              onRerunDataset={(inp) => {
                setActivePrediction(null);
                navigate('add-data');
              }}
            />
          )}

          {currentPage === 'store-intelligence' && (
            <StoreIntelligence />
          )}

          {currentPage === 'profile' && (
            <Profile onNavigate={(p) => navigate(p)} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
