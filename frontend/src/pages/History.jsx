import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';

export default function HistoryPage({ onNavigate, onSelectPrediction }) {
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadPredictions();
  }, [page, category]);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.predictions.list({
        search: search.trim() || undefined,
        category: category !== 'ALL' ? category : undefined,
        page,
        page_size: pageSize
      });
      setPredictions(res.predictions || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load prediction history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadPredictions();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this prediction record?')) return;
    
    setDeletingId(id);
    try {
      await api.predictions.delete(id);
      setNotification('Prediction deleted successfully.');
      setTimeout(() => setNotification(''), 3000);
      loadPredictions();
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete prediction');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={24} color="#2563eb" />
            Prediction History
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Browse and inspect your previous ML forecasts, confidence intervals, and parameters.
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
          + New Prediction
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

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by SKU, category or features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#0f172a',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 12px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Category:
          </span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#0f172a',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="Groceries">Groceries</option>
            <option value="Beverages">Beverages</option>
            <option value="Electronics">Electronics</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Apparel">Apparel</option>
            <option value="Health & Beauty">Health & Beauty</option>
          </select>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Loading prediction records...
          </div>
        ) : predictions.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <History size={32} color="#94a3b8" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '15px', color: '#334155', marginBottom: '4px' }}>No predictions found</h3>
            <p style={{ fontSize: '13px' }}>
              {search || category !== 'ALL' ? 'Try adjusting your search criteria.' : 'Create your first ML demand prediction now.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                  <th style={{ padding: '12px 18px' }}>Date</th>
                  <th style={{ padding: '12px 18px' }}>Product / SKU</th>
                  <th style={{ padding: '12px 18px' }}>Category</th>
                  <th style={{ padding: '12px 18px' }}>Forecast Demand</th>
                  <th style={{ padding: '12px 18px' }}>Confidence</th>
                  <th style={{ padding: '12px 18px' }}>Interval Range</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => {
                  const inp = p.input_data || {};
                  const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 18px', color: '#64748b' }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0f172a' }}>
                        {inp.item_name || 'Item SKU'}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {inp.category || 'Retail'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#2563eb', fontSize: '14px' }}>
                        {p.prediction} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>units ({inp.horizon_days || 7}d)</span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>
                          {p.confidence}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', color: '#475569' }}>
                        {p.lower_bound || '—'} to {p.upper_bound || '—'}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => {
                              if (onSelectPrediction) onSelectPrediction(p);
                              onNavigate('prediction-result');
                            }}
                            style={{
                              padding: '5px 10px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              color: '#1d4ed8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 500
                            }}
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            onClick={(e) => handleDelete(p.id, e)}
                            disabled={deletingId === p.id}
                            style={{
                              padding: '5px 8px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              color: '#b91c1c',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '12px'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: '13px',
            color: '#64748b'
          }}>
            <span>Showing page {page} of {totalPages} ({total} total predictions)</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: '5px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#334155',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: '5px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#334155',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
