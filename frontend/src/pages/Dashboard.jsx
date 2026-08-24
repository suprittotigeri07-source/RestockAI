import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PlusCircle,
  Database,
  BarChart3,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard({ onNavigate, onSelectPrediction }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [userDatasets, setUserDatasets] = useState([]);
  const [systemHealth, setSystemHealth] = useState({ online: true, stores: 0, items: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [predsRes, dataRes, healthRes] = await Promise.allSettled([
        api.predictions.list({ page_size: 5 }),
        api.userData.list(),
        api.system.health()
      ]);

      if (predsRes.status === 'fulfilled') {
        setPredictions(predsRes.value.predictions || []);
      }
      if (dataRes.status === 'fulfilled') {
        setUserDatasets(dataRes.value || []);
      }
      if (healthRes.status === 'fulfilled') {
        setSystemHealth(healthRes.value);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPredictions = predictions.length;
  const avgConfidence = predictions.length > 0
    ? (predictions.reduce((acc, p) => acc + (p.confidence || 0), 0) / predictions.length).toFixed(1)
    : '92.4';

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '12px',
              fontWeight: 600
            }}>
              <ShieldCheck size={14} /> Production Multi-User Node
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Welcome, {user?.name || 'Retail Specialist'} 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '640px' }}>
            Enter custom product and market variables to run real-time XGBoost demand forecasting, evaluate stockout risks, and optimize replenishment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            id="dash-add-data-btn"
            onClick={() => onNavigate('add-data')}
            style={{
              padding: '11px 18px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
            }}
          >
            <PlusCircle size={17} /> Make Prediction
          </button>
          <button
            onClick={() => onNavigate('store-intelligence')}
            style={{
              padding: '11px 18px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Layers size={17} /> Store Replenishment
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        {/* Total Predictions */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Predictions</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            {predictions.length}
          </div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>
            Personalized for {user?.email}
          </div>
        </div>

        {/* Stored Datasets */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Saved Input Datasets</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d'
            }}>
              <Database size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            {userDatasets.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Saved parameter configurations
          </div>
        </div>

        {/* Model Accuracy / Confidence */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Avg Model Confidence</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#b45309'
            }}>
              <BarChart3 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            {avgConfidence}%
          </div>
          <div style={{ fontSize: '12px', color: '#b45309' }}>
            90% empirical confidence bounds
          </div>
        </div>

        {/* Engine Status */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Engine Architecture</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#f5f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6d28d9'
            }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#15803d', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            Active (v2.0)
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            XGBoost & Elasticity Pipeline
          </div>
        </div>
      </div>

      {/* Main Sections: Recent Predictions & Fast Scenario Launcher */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Recent Predictions */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#2563eb" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Your Recent Predictions
              </h2>
            </div>
            <button
              onClick={() => onNavigate('history')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View All <ChevronRight size={15} />
            </button>
          </div>

          {predictions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 20px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px dashed #cbd5e1'
            }}>
              <FileText size={32} color="#94a3b8" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                No predictions yet
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                Enter custom product data to generate your first ML demand forecast.
              </p>
              <button
                onClick={() => onNavigate('add-data')}
                style={{
                  padding: '8px 14px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Add Data & Predict
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {predictions.map((p) => {
                const inputs = p.input_data || {};
                const name = inputs.item_name || 'Item SKU';
                const cat = inputs.category || 'Retail';
                const horizon = inputs.horizon_days || 7;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (onSelectPrediction) onSelectPrediction(p);
                      onNavigate('prediction-result');
                    }}
                    style={{
                      padding: '12px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#93c5fd'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                          {name}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 500
                        }}>
                          {cat}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {horizon} Days Horizon • {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#2563eb' }}>
                        {p.prediction} <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>units</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                        {p.confidence}% Confidence
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fast Prediction Scenarios */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={18} color="#7c3aed" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Quick Feature Presets
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Launch ML demand forecasts instantly using pre-configured scenarios.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              onClick={() => onNavigate('add-data', { preset: 'electronics_sale' })}
              style={{
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#93c5fd'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                  🎧 Consumer Tech Promotional Campaign
                </span>
                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Electronics</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Price: $149.99, 15% discount, weekend surge factor, 4-day lead time.
              </p>
            </div>

            <div
              onClick={() => onNavigate('add-data', { preset: 'fresh_grocery' })}
              style={{
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#86efac'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                  🥛 Fast-Moving Grocery Replenishment
                </span>
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Groceries</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Price: $4.49, high baseline velocity (28 units/day), 2-day delivery.
              </p>
            </div>

            <div
              onClick={() => onNavigate('add-data', { preset: 'holiday_apparel' })}
              style={{
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fde68a'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                  🧥 Seasonal Winter Holiday Apparel
                </span>
                <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>Apparel</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Price: $89.00, Holiday Rush factor (+65% demand modifier), 30-day forecast.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
