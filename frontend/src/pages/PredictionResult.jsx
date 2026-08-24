import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowRight,
  PlusCircle,
  History,
  FileSpreadsheet,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';

export default function PredictionResult({ prediction, onNavigate }) {
  if (!prediction) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '10px' }}>No Active Prediction Selected</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '18px' }}>
          Please create a new prediction or select one from your history.
        </p>
        <button
          onClick={() => onNavigate('add-data')}
          style={{
            padding: '10px 18px',
            background: '#2563eb',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Go to Prediction Studio
        </button>
      </div>
    );
  }

  const inputs = prediction.input_data || {};
  const metrics = prediction.metrics || {};
  const demand = prediction.prediction;
  const confidence = prediction.confidence;
  const lowerBound = prediction.lower_bound || Math.round(demand * 0.85);
  const upperBound = prediction.upper_bound || Math.round(demand * 1.15);

  const urgency = metrics.urgency || 'HEALTHY';
  const urgencyStyles = {
    CRITICAL: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
    MODERATE: { bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
    HEALTHY: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }
  };
  const uStyle = urgencyStyles[urgency] || urgencyStyles.HEALTHY;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Result Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '22px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {inputs.category || 'Retail'}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              ID: {prediction.id}
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {inputs.item_name || 'Product Demand Forecast'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigate('add-data')}
            style={{
              padding: '9px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <PlusCircle size={15} /> Make Another
          </button>
          <button
            onClick={() => onNavigate('history')}
            style={{
              padding: '9px 16px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
            }}
          >
            <History size={15} /> View History
          </button>
        </div>
      </div>

      {/* Top Banner KPI Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
      }}>
        {/* Forecast Demand */}
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
            Forecast Demand ({inputs.horizon_days || 7} Days)
          </span>
          <div style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '4px' }}>
            {demand} <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>Units</span>
          </div>
          <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
            ~{metrics.predicted_daily_rate || (demand / (inputs.horizon_days || 7)).toFixed(1)} units / day
          </div>
        </div>

        {/* Confidence Meter */}
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
            Model Confidence
          </span>
          <div style={{ fontSize: '34px', fontWeight: 800, color: '#15803d', lineHeight: 1.1, marginBottom: '4px' }}>
            {confidence}%
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            High Reliability ({inputs.season || 'Regular'})
          </div>
        </div>

        {/* 90% Confidence Interval */}
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
            90% Prediction Interval
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', lineHeight: 1.1, marginBottom: '4px', paddingTop: '6px' }}>
            {lowerBound} – {upperBound} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Units</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Statistical variance bounds
          </div>
        </div>

        {/* Urgency Status */}
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
            Stock Health Status
          </span>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            background: uStyle.bg,
            border: `1px solid ${uStyle.border}`,
            color: uStyle.text,
            fontSize: '14px',
            fontWeight: 800,
            marginTop: '2px'
          }}>
            <AlertTriangle size={16} />
            {urgency} RESTOCK
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {metrics.stockout_risk_days !== undefined ? `${metrics.stockout_risk_days} days coverage left` : 'Calculated from run rate'}
          </div>
        </div>
      </div>

      {/* Decision Metrics & Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Recommended Reorder Card */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Package size={18} color="#15803d" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Replenishment Recommendation
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Recommended Reorder</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>
                {metrics.recommended_reorder_qty !== undefined ? metrics.recommended_reorder_qty : Math.max(0, demand - (inputs.stock_on_hand || 0))} Units
              </span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Safety Stock Target</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>
                {metrics.safety_stock !== undefined ? metrics.safety_stock : 15} Units
              </span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Reorder Point (ROP)</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                {metrics.reorder_point !== undefined ? metrics.reorder_point : 35} Units
              </span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Est. Reorder Cost</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#b45309' }}>
                ${metrics.estimated_reorder_cost !== undefined ? metrics.estimated_reorder_cost : (metrics.recommended_reorder_qty * (inputs.unit_cost || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Key Model Insights & Drivers */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} color="#6d28d9" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Model Drivers & Insights
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.insights && metrics.insights.length > 0 ? (
              metrics.insights.map((insight, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#334155'
                }}>
                  <CheckCircle2 size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{insight}</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px' }}>
                Automated ML elasticity engine computed demand trajectory based on input parameters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Parameters Summary Table */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={16} color="#64748b" /> Submitted Feature Parameters
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px'
        }}>
          {Object.entries(inputs).map(([key, val]) => (
            <div key={key} style={{
              padding: '10px 12px',
              background: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                {key.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                {typeof val === 'number' && (key.includes('price') || key.includes('cost')) ? `$${val.toFixed(2)}` : String(val)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
