import React, { useState, useEffect } from 'react';
import { Database, Play, Trash2, Calendar, FileText, PlusCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function UserDataList({ onNavigate, onRerunDataset }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const res = await api.userData.list();
      setDatasets(res || []);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved dataset?')) return;
    setDeletingId(id);
    try {
      await api.userData.delete(id);
      setNotification('Dataset removed successfully.');
      setTimeout(() => setNotification(''), 3000);
      loadDatasets();
    } catch (err) {
      alert(err.message || 'Failed to delete dataset');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} color="#15803d" />
            Saved Feature Datasets
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Manage saved parameter sets and trigger on-demand predictions with a single click.
          </p>
        </div>

        <button
          onClick={() => onNavigate('add-data')}
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
          <PlusCircle size={15} /> New Input Dataset
        </button>
      </div>

      {notification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '18px',
          color: '#15803d',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          Loading saved datasets...
        </div>
      ) : datasets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
          <FileText size={32} color="#94a3b8" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '15px', color: '#334155', marginBottom: '4px' }}>No saved datasets yet</h3>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>
            Save custom feature sets in the Prediction Studio to reuse them anytime.
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
            Create Dataset
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {datasets.map((d) => {
            const inp = d.input_data || {};
            return (
              <div key={d.id} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      {d.title || 'Untitled Dataset'}
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 600
                    }}>
                      {inp.category || 'Custom'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                    <div><strong style={{ color: '#334155' }}>Product:</strong> {inp.item_name || '—'}</div>
                    <div><strong style={{ color: '#334155' }}>Price / Cost:</strong> ${inp.price || 0} / ${inp.unit_cost || 0}</div>
                    <div><strong style={{ color: '#334155' }}>Stock / Daily Avg:</strong> {inp.stock_on_hand || 0} units / {inp.daily_sales_avg || 0} per day</div>
                    <div><strong style={{ color: '#334155' }}>Season / Promo:</strong> {inp.season || 'Regular'} ({inp.discount_pct || 0}% off)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        if (onRerunDataset) onRerunDataset(inp);
                      }}
                      style={{
                        padding: '5px 10px',
                        background: '#2563eb',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Play size={11} /> Run Model
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={deletingId === d.id}
                      style={{
                        padding: '5px 8px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#b91c1c',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
