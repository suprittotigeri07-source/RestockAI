import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Package,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Minus
} from 'lucide-react';
import api from '../services/api';

export default function StoreIntelligence() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('STR_001');
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [sortBy, setSortBy] = useState('urgency');

  // Quantity Overrides & Approvals
  const [customQuantities, setCustomQuantities] = useState({});
  const [approvedItems, setApprovedItems] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [exportingSheets, setExportingSheets] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      fetchRecommendations(selectedStoreId);
    }
  }, [selectedStoreId]);

  const fetchStores = async () => {
    try {
      const data = await api.stores.list();
      setStores(data || []);
      if (data && data.length > 0 && !selectedStoreId) {
        setSelectedStoreId(data[0].store_id);
      }
    } catch (err) {
      console.error('Failed to load stores:', err);
    }
  };

  const fetchRecommendations = async (storeId) => {
    setLoading(true);
    try {
      const data = await api.stores.getRecommendations(storeId);
      setRecommendationsData(data);
      const initialQty = {};
      (data.recommendations || []).forEach((r) => {
        initialQty[r.item_id] = r.recommended_reorder_qty;
      });
      setCustomQuantities(initialQty);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportGoogleSheets = async () => {
    setExportingSheets(true);
    setExportResult(null);
    try {
      const title = `RestockAI - ${recommendationsData?.store_name || selectedStoreId} - ${new Date().toISOString().split('T')[0]}`;
      const data = await api.stores.exportSheets(selectedStoreId, title);
      setExportResult(data);
    } catch (err) {
      setExportResult({
        status: 'ERROR',
        message: 'Could not connect to export service: ' + err.message
      });
    } finally {
      setExportingSheets(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.stores.triggerRetrain(50);
      await fetchRecommendations(selectedStoreId);
    } catch (err) {
      console.error('Retraining failed:', err);
    } finally {
      setRetraining(false);
    }
  };

  const handleQtyChange = (itemId, delta) => {
    setCustomQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta)
    }));
  };

  const toggleApproval = (itemId) => {
    setApprovedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const filteredRecommendations = useMemo(() => {
    if (!recommendationsData?.recommendations) return [];

    return recommendationsData.recommendations
      .filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.item_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesUrgency = selectedUrgency === 'ALL' || item.urgency === selectedUrgency;
        return matchesSearch && matchesCategory && matchesUrgency;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency') {
          const rank = { CRITICAL: 0, MODERATE: 1, HEALTHY: 2 };
          return (rank[a.urgency] ?? 3) - (rank[b.urgency] ?? 3);
        }
        if (sortBy === 'reorder_desc') {
          return (customQuantities[b.item_id] ?? b.recommended_reorder_qty) -
                 (customQuantities[a.item_id] ?? a.recommended_reorder_qty);
        }
        if (sortBy === 'days_asc') {
          return a.stockout_risk_days - b.stockout_risk_days;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [recommendationsData, searchQuery, selectedCategory, selectedUrgency, sortBy, customQuantities]);

  const totalAdjustedUnits = useMemo(() => {
    return Object.values(customQuantities).reduce((acc, q) => acc + (parseInt(q, 10) || 0), 0);
  }, [customQuantities]);

  const totalAdjustedCost = useMemo(() => {
    if (!recommendationsData?.recommendations) return 0;
    return recommendationsData.recommendations.reduce((acc, itm) => {
      const q = customQuantities[itm.item_id] ?? itm.recommended_reorder_qty;
      return acc + (q * itm.unit_cost);
    }, 0);
  }, [recommendationsData, customQuantities]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={24} color="#2563eb" />
            Retail Inventory Reorder Engine
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Multi-store replenishment decisions powered by XGBoost demand forecasts and Claude LLM reasoning.
          </p>
        </div>

        {/* Store Switcher & Retrain */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Building2 size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              style={{
                padding: '8px 12px 8px 34px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '13px',
                outline: 'none',
                fontWeight: 600
              }}
            >
              {stores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.name} ({s.region})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportGoogleSheets}
            disabled={exportingSheets}
            style={{
              padding: '8px 12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#15803d',
              fontSize: '13px',
              fontWeight: 600,
              cursor: exportingSheets ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileSpreadsheet size={15} /> {exportingSheets ? 'Exporting...' : 'Export Sheets'}
          </button>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            style={{
              padding: '8px 12px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              color: '#1d4ed8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: retraining ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} className={retraining ? 'animate-spin' : ''} /> {retraining ? 'Retraining...' : 'Retrain'}
          </button>
        </div>
      </div>

      {/* Export Result Notification */}
      {exportResult && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: exportResult.status === 'SUCCESS' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${exportResult.status === 'SUCCESS' ? '#bbf7d0' : '#fecaca'}`,
          color: exportResult.status === 'SUCCESS' ? '#15803d' : '#b91c1c',
          fontSize: '13px'
        }}>
          <span>{exportResult.message} ({exportResult.rows_exported} rows)</span>
          {exportResult.spreadsheet_url && (
            <a
              href={exportResult.spreadsheet_url}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Open Spreadsheet <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div className="glass-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Critical Stockouts</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#b91c1c' }}>
            {recommendationsData?.critical_restocks_count || 0}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Recommended Units</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb' }}>
            {totalAdjustedUnits} Units
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Estimated Reorder Cost</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309' }}>
            ${totalAdjustedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Total SKUs Monitored</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d' }}>
            {recommendationsData?.total_items || 0}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Filter by SKU or item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            style={{
              padding: '7px 10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#0f172a',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="MODERATE">Moderate</option>
            <option value="HEALTHY">Healthy</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '7px 10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#0f172a',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="urgency">Sort by Urgency</option>
            <option value="reorder_desc">Highest Reorder Units</option>
            <option value="days_asc">Lowest Days to Stockout</option>
            <option value="name">Product Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Analyzing inventory & running XGBoost pipeline...
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Stock / Coverage</th>
                  <th style={{ padding: '12px 16px' }}>7-Day Forecast</th>
                  <th style={{ padding: '12px 16px' }}>Urgency</th>
                  <th style={{ padding: '12px 16px' }}>Adjust Qty</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecommendations.map((itm) => {
                  const qty = customQuantities[itm.item_id] ?? itm.recommended_reorder_qty;
                  const isCritical = itm.urgency === 'CRITICAL';
                  const isModerate = itm.urgency === 'MODERATE';

                  return (
                    <tr
                      key={itm.item_id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: approvedItems[itm.item_id] ? '#f0fdf4' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{itm.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{itm.item_id} • Unit Cost: ${itm.unit_cost.toFixed(2)}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8' }}>
                          {itm.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: itm.stock_on_hand < 20 ? '#b91c1c' : '#0f172a' }}>
                          {itm.stock_on_hand} on hand
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {itm.stockout_risk_days} days left
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>
                        {itm.predicted_demand_7d} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>units</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isCritical ? '#fef2f2' : (isModerate ? '#fffbeb' : '#f0fdf4'),
                          border: `1px solid ${isCritical ? '#fecaca' : (isModerate ? '#fde68a' : '#bbf7d0')}`,
                          color: isCritical ? '#b91c1c' : (isModerate ? '#b45309' : '#15803d')
                        }}>
                          {itm.urgency}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => handleQtyChange(itm.item_id, -5)}
                            style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => handleQtyChange(itm.item_id, 5)}
                            style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setDetailItem(itm)}
                            style={{
                              padding: '4px 8px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              color: '#1d4ed8',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Explain
                          </button>
                          <button
                            onClick={() => toggleApproval(itm.item_id)}
                            style={{
                              padding: '4px 8px',
                              background: approvedItems[itm.item_id] ? '#dcfce7' : '#f8fafc',
                              border: `1px solid ${approvedItems[itm.item_id] ? '#86efac' : '#cbd5e1'}`,
                              borderRadius: '6px',
                              color: approvedItems[itm.item_id] ? '#15803d' : '#475569',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            {approvedItems[itm.item_id] ? 'Approved ✓' : 'Approve'}
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
      </div>

      {/* Explanation Modal */}
      {detailItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  {detailItem.category}
                </span>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  {detailItem.name}
                </h2>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#2563eb', fontWeight: 600, fontSize: '13px' }}>
                <Sparkles size={15} /> Claude LLM Restock Reasoning
              </div>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {detailItem.explanation}
              </p>
            </div>

            <button
              onClick={() => setDetailItem(null)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
