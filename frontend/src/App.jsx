import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
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
  Building2,
  Plus,
  Minus
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export default function App() {
  // Application State
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('STR_001');
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({ online: false, latency: 0 });
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [sortBy, setSortBy] = useState('urgency');
  
  // Action Overrides & Approvals
  const [customQuantities, setCustomQuantities] = useState({});
  const [approvedItems, setApprovedItems] = useState({});
  
  // Modals & Notifications
  const [detailItem, setDetailItem] = useState(null);
  const [exportingSheets, setExportingSheets] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [retraining, setRetraining] = useState(false);

  // 1. Check System Health & Fetch Stores on Load
  useEffect(() => {
    fetchHealth();
    fetchStores();
  }, []);

  // 2. Fetch Store Recommendations when selected store changes
  useEffect(() => {
    if (selectedStoreId) {
      fetchRecommendations(selectedStoreId);
    }
  }, [selectedStoreId]);

  const fetchHealth = async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      const latency = Math.round(performance.now() - start);
      setSystemHealth({ online: data.status === 'healthy', latency });
    } catch (err) {
      setSystemHealth({ online: false, latency: 0 });
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_BASE}/stores`);
      if (res.ok) {
        const data = await res.json();
        setStores(data);
        if (data.length > 0 && !selectedStoreId) {
          setSelectedStoreId(data[0].store_id);
        }
      }
    } catch (err) {
      console.error('Failed to load stores:', err);
    }
  };

  const fetchRecommendations = async (storeId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/recommendations/${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendationsData(data);
        // Initialize quantity overrides
        const initialQty = {};
        data.recommendations.forEach(r => {
          initialQty[r.item_id] = r.recommended_reorder_qty;
        });
        setCustomQuantities(initialQty);
      }
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
      const res = await fetch(`${API_BASE}/export/sheets/${selectedStoreId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_title: `RestockAI - ${recommendationsData?.store_name || selectedStoreId} - ${new Date().toISOString().split('T')[0]}`
        })
      });
      const data = await res.json();
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
      await fetch(`${API_BASE}/forecast/train?max_pairs=50`, { method: 'POST' });
      await fetchRecommendations(selectedStoreId);
    } catch (err) {
      console.error('Retraining failed:', err);
    } finally {
      setRetraining(false);
    }
  };

  const handleQtyChange = (itemId, delta) => {
    setCustomQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta)
    }));
  };

  const toggleApproval = (itemId) => {
    setApprovedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Filtered & Sorted Recommendations
  const filteredRecommendations = useMemo(() => {
    if (!recommendationsData?.recommendations) return [];
    
    return recommendationsData.recommendations
      .filter(item => {
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

  // Derived Totals
  const categoriesList = useMemo(() => {
    if (!recommendationsData?.recommendations) return [];
    return Array.from(new Set(recommendationsData.recommendations.map(r => r.category)));
  }, [recommendationsData]);

  const totalAdjustedUnits = useMemo(() => {
    return Object.values(customQuantities).reduce((acc, q) => acc + (parseInt(q) || 0), 0);
  }, [customQuantities]);

  const totalAdjustedCost = useMemo(() => {
    if (!recommendationsData?.recommendations) return 0;
    return recommendationsData.recommendations.reduce((acc, itm) => {
      const q = customQuantities[itm.item_id] ?? itm.recommended_reorder_qty;
      return acc + (q * itm.unit_cost);
    }, 0);
  }, [recommendationsData, customQuantities]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      
      {/* ================= TOP HEADER ================= */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: '1380px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Logo & System Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              letterSpacing: '-0.5px'
            }}>
              R
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>
                  RestockAI
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569'
                }}>
                  v1.0 Production
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: systemHealth.online ? '#22c55e' : '#ef4444',
                  display: 'inline-block'
                }} />
                {systemHealth.online ? `API Online (${systemHealth.latency}ms)` : 'Connecting to API...'}
              </div>
            </div>
          </div>

          {/* Store Switcher & Export Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Store Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="#64748b" />
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.name} ({s.store_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Retrain Button */}
            <button
              onClick={handleRetrain}
              disabled={retraining}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 500,
                cursor: retraining ? 'not-allowed' : 'pointer'
              }}
              title="Recalculate demand forecasts with latest sales data"
            >
              <RefreshCw size={14} className={retraining ? 'spin-icon' : ''} />
              {retraining ? 'Retraining Models...' : 'Refresh ML'}
            </button>

            {/* Google Sheets Export */}
            <button
              onClick={handleExportGoogleSheets}
              disabled={exportingSheets}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0f766e',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: exportingSheets ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
              }}
            >
              <FileSpreadsheet size={15} />
              {exportingSheets ? 'Exporting to Sheets...' : 'Push to Google Sheets'}
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main style={{ maxWidth: '1380px', margin: '0 auto', padding: '24px' }}>
        
        {/* ================= EXPORT RESULT BANNER ================= */}
        {exportResult && (
          <div style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: '8px',
            backgroundColor: exportResult.status.includes('SUCCESS') ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${exportResult.status.includes('SUCCESS') ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} color="#166534" />
              <div>
                <strong style={{ fontSize: '13px', color: '#166534' }}>Export Completed:</strong>
                <span style={{ fontSize: '13px', color: '#1e293b', marginLeft: '6px' }}>{exportResult.message}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {exportResult.spreadsheet_url && (
                <a
                  href={exportResult.spreadsheet_url.startsWith('http') ? exportResult.spreadsheet_url : `http://localhost:8000${exportResult.spreadsheet_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f766e',
                    textDecoration: 'underline'
                  }}
                >
                  Open Export <ExternalLink size={12} />
                </a>
              )}
              <button
                onClick={() => setExportResult(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= KPI SUMMARY CARDS ================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Critical Restocks */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Critical Restocks
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#991b1b', marginTop: '4px' }}>
                  {recommendationsData?.critical_restocks_count || 0}
                </h3>
              </div>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                color: '#991b1b'
              }}>
                <AlertTriangle size={20} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              Items with &le; 2.0 days of stock on floor
            </p>
          </div>

          {/* Recommended Units to Order */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Reorder Units
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {totalAdjustedUnits.toLocaleString()}
                </h3>
              </div>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8'
              }}>
                <Package size={20} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              7-day safety buffer adjusted demand
            </p>
          </div>

          {/* Estimated Capital Outlay */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Restock Outlay
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  ${totalAdjustedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                color: '#15803d'
              }}>
                <DollarSign size={20} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              Based on wholesale unit acquisition costs
            </p>
          </div>

          {/* Catalog Coverage */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Store Catalog
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {recommendationsData?.total_items || 0} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>SKUs</span>
                </h3>
              </div>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                color: '#475569'
              }}>
                <Layers size={20} />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              Region: <strong>{recommendationsData?.region || 'Midwest'}</strong>
            </p>
          </div>
        </div>

        {/* ================= FILTER & CONTROL BAR ================= */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by SKU or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status:</span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="MODERATE">Moderate Only</option>
              <option value="HEALTHY">Healthy Only</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="urgency">Urgency Priority</option>
              <option value="reorder_desc">Highest Reorder Quantity</option>
              <option value="days_asc">Fewest Stock Days Left</option>
              <option value="name">Item Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* ================= REORDER DECISION TABLE ================= */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '14px', fontWeight: 500 }}>Generating real-time ML inventory forecasts...</p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Package size={32} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>No items match current filters</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Try clearing the search bar or changing the category filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Item Details</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Stock / Demand</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Run-Rate</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Reorder Qty</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>AI Restock Rationale</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecommendations.map((item) => {
                    const currentQty = customQuantities[item.item_id] ?? item.recommended_reorder_qty;
                    const isApproved = approvedItems[item.item_id];

                    return (
                      <tr
                        key={item.item_id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isApproved ? '#f8fafc' : '#ffffff',
                          transition: 'background-color 0.1s'
                        }}
                      >
                        {/* Status Pill */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            backgroundColor:
                              item.urgency === 'CRITICAL' ? '#fef2f2' :
                              item.urgency === 'MODERATE' ? '#fffbeb' : '#f0fdf4',
                            border: `1px solid ${
                              item.urgency === 'CRITICAL' ? '#fecaca' :
                              item.urgency === 'MODERATE' ? '#fde68a' : '#bbf7d0'
                            }`,
                            color:
                              item.urgency === 'CRITICAL' ? '#991b1b' :
                              item.urgency === 'MODERATE' ? '#92400e' : '#166534'
                          }}>
                            {item.urgency}
                          </span>
                        </td>

                        {/* Item Details */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', minWidth: '180px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span>SKU: {item.item_id}</span>
                            <span>•</span>
                            <span>{item.category}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            Cost: ${item.unit_cost.toFixed(2)} | Price: ${item.current_price.toFixed(2)}
                          </div>
                        </td>

                        {/* Stock & Demand */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', minWidth: '150px' }}>
                          <div style={{ fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>On Hand:</span>{' '}
                            <strong style={{ color: item.stock_on_hand < 20 ? '#dc2626' : '#0f172a' }}>
                              {item.stock_on_hand} units
                            </strong>
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                            7d Fcst: <strong>{item.predicted_demand_7d.toFixed(0)} units</strong>
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            30d Fcst: {item.predicted_demand_30d.toFixed(0)} units
                          </div>
                        </td>

                        {/* Stockout Run-rate */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', minWidth: '110px' }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: item.stockout_risk_days <= 2.0 ? '#b91c1c' : (item.stockout_risk_days <= 4.0 ? '#b45309' : '#15803d')
                          }}>
                            {item.stockout_risk_days.toFixed(1)} days
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>until stockout</span>
                        </td>

                        {/* Reorder Quantity with Manager Stepper */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', minWidth: '130px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => handleQtyChange(item.item_id, -5)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#f8fafc',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Minus size={12} />
                            </button>
                            <input
                              type="number"
                              value={currentQty}
                              onChange={(e) => setCustomQuantities({
                                ...customQuantities,
                                [item.item_id]: Math.max(0, parseInt(e.target.value) || 0)
                              })}
                              style={{
                                width: '56px',
                                padding: '4px 6px',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '13px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1'
                              }}
                            />
                            <button
                              onClick={() => handleQtyChange(item.item_id, 5)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#f8fafc',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            Subtotal: ${(currentQty * item.unit_cost).toFixed(2)}
                          </div>
                        </td>

                        {/* Claude LLM Explanation */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '420px' }}>
                          <div style={{
                            padding: '10px 12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            lineHeight: 1.45,
                            color: '#334155'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                              <Sparkles size={13} color="#2563eb" />
                              <strong style={{ fontSize: '11px', color: '#1e40af' }}>Restock Rationale</strong>
                              <span style={{
                                marginLeft: 'auto',
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: '#e2e8f0',
                                color: '#475569',
                                fontWeight: 600
                              }}>
                                {item.model_used}
                              </span>
                            </div>
                            {item.explanation}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right', minWidth: '120px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                            <button
                              onClick={() => toggleApproval(item.item_id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: isApproved ? '1px solid #16a34a' : '1px solid #cbd5e1',
                                backgroundColor: isApproved ? '#16a34a' : '#ffffff',
                                color: isApproved ? '#ffffff' : '#0f172a',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCircle2 size={13} />
                              {isApproved ? 'Approved' : 'Approve'}
                            </button>
                            
                            <button
                              onClick={() => setDetailItem(item)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2563eb',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              Inspect Details
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
      </main>

      {/* ================= DETAIL MODAL / DRAWER ================= */}
      {detailItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Item Forecast & Inventory Breakdown
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                  {detailItem.name} ({detailItem.item_id})
                </p>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    7-Day Forecast Horizon
                  </span>
                  <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0 0', color: '#0f172a' }}>
                    {detailItem.predicted_demand_7d.toFixed(1)} units
                  </p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    90% CI: [{detailItem.lower_bound_7d.toFixed(0)} — {detailItem.upper_bound_7d.toFixed(0)}]
                  </span>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    30-Day Monthly Forecast
                  </span>
                  <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0 0', color: '#0f172a' }}>
                    {detailItem.predicted_demand_30d.toFixed(1)} units
                  </p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Model: <strong>{detailItem.model_used}</strong>
                  </span>
                </div>
              </div>

              {/* Economic Breakdown */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Restock Unit Economics
                </h4>
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Wholesale Acquisition Cost:</span>
                    <strong>${detailItem.unit_cost.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Current Retail Shelf Price:</span>
                    <strong>${detailItem.current_price.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Gross Margin per Unit:</span>
                    <strong style={{ color: '#16a34a' }}>
                      ${(detailItem.current_price - detailItem.unit_cost).toFixed(2)} ({Math.round(((detailItem.current_price - detailItem.unit_cost) / detailItem.current_price) * 100)}%)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>Total Order Capital Requirement:</span>
                    <strong style={{ color: '#0f172a' }}>
                      ${((customQuantities[detailItem.item_id] ?? detailItem.recommended_reorder_qty) * detailItem.unit_cost).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* AI Explanation Box */}
              <div style={{
                padding: '14px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Sparkles size={15} color="#2563eb" />
                  <strong style={{ fontSize: '12px', color: '#1e40af' }}>Claude AI Demand Analysis</strong>
                </div>
                <p style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: 1.5, margin: 0 }}>
                  {detailItem.explanation}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={() => setDetailItem(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for subtle spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
