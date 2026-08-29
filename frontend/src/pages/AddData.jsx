import React, { useState, useEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  Save,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  RotateCcw,
  Zap,
  Upload,
  FileText,
  Download,
  FileSpreadsheet,
  Trash2,
  Table,
  Check
} from 'lucide-react';
import api from '../services/api';

export default function AddData({ onNavigate, onPredictionCreated, initialPreset }) {
  const [schema, setSchema] = useState([]);
  const [formData, setFormData] = useState({});
  const [datasetTitle, setDatasetTitle] = useState('');
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [batchPredicting, setBatchPredicting] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Device Import States
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'import'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    setLoadingSchema(true);
    try {
      const res = await api.model.getSchema();
      const fields = res.features || [];
      setSchema(fields);

      const defaults = {};
      fields.forEach((f) => {
        defaults[f.name] = f.default !== undefined ? f.default : '';
      });

      if (initialPreset === 'electronics_sale') {
        defaults.category = 'Electronics';
        defaults.item_name = 'Pro Noise-Cancelling ANC Headphones';
        defaults.price = 149.99;
        defaults.unit_cost = 85.00;
        defaults.stock_on_hand = 18;
        defaults.daily_sales_avg = 6.0;
        defaults.discount_pct = 15;
        defaults.lead_time_days = 4;
        defaults.season = 'Weekend_Peak';
        defaults.horizon_days = 7;
      } else if (initialPreset === 'fresh_grocery') {
        defaults.category = 'Groceries';
        defaults.item_name = 'Organic Farmhouse Whole Milk 1 Gal';
        defaults.price = 4.49;
        defaults.unit_cost = 2.40;
        defaults.stock_on_hand = 60;
        defaults.daily_sales_avg = 28.5;
        defaults.discount_pct = 0;
        defaults.lead_time_days = 2;
        defaults.season = 'Regular';
        defaults.horizon_days = 7;
      } else if (initialPreset === 'holiday_apparel') {
        defaults.category = 'Apparel';
        defaults.item_name = 'Thermal Wool Winter Parka';
        defaults.price = 119.00;
        defaults.unit_cost = 55.00;
        defaults.stock_on_hand = 35;
        defaults.daily_sales_avg = 8.0;
        defaults.discount_pct = 20;
        defaults.lead_time_days = 7;
        defaults.season = 'Holiday_Rush';
        defaults.horizon_days = 30;
      }

      setFormData(defaults);
    } catch (err) {
      console.error('Failed to load model schema:', err);
      setErrorMessage('Could not load ML feature schema from server.');
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const applyPreset = (presetKey) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (presetKey === 'tech') {
      setFormData((prev) => ({
        ...prev,
        category: 'Electronics',
        item_name: 'Smart 4K Ultra-HD OLED TV 55"',
        price: 499.99,
        unit_cost: 320.00,
        stock_on_hand: 12,
        daily_sales_avg: 3.5,
        discount_pct: 10,
        lead_time_days: 5,
        season: 'Weekend_Peak',
        horizon_days: 7
      }));
    } else if (presetKey === 'grocery') {
      setFormData((prev) => ({
        ...prev,
        category: 'Groceries',
        item_name: 'Fresh Organic Strawberries 1lb',
        price: 3.99,
        unit_cost: 2.10,
        stock_on_hand: 40,
        daily_sales_avg: 22.0,
        discount_pct: 0,
        lead_time_days: 2,
        season: 'Regular',
        horizon_days: 7
      }));
    } else if (presetKey === 'holiday') {
      setFormData((prev) => ({
        ...prev,
        category: 'Home & Garden',
        item_name: 'LED Holiday Ambient Lighting Kit',
        price: 34.99,
        unit_cost: 14.50,
        stock_on_hand: 25,
        daily_sales_avg: 12.0,
        discount_pct: 25,
        lead_time_days: 4,
        season: 'Holiday_Rush',
        horizon_days: 30
      }));
    }
  };

  // =========================================================
  // DEVICE FILE PARSER (CSV & JSON)
  // =========================================================
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    setErrorMessage('');
    setSuccessMessage('');
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        let parsed = [];
        if (file.name.endsWith('.json')) {
          const raw = JSON.parse(text);
          parsed = Array.isArray(raw) ? raw : [raw];
        } else {
          // Parse CSV
          parsed = parseCSVText(text);
        }

        if (parsed.length === 0) {
          throw new Error('No valid feature rows found in uploaded file.');
        }

        // Normalize each item to match schema
        const normalizedList = parsed.map((item) => normalizeUploadedRow(item));
        setParsedRows(normalizedList);
        setSelectedRowIndex(0);

        // Populate form with first row
        setFormData(normalizedList[0]);
        setSuccessMessage(`Successfully loaded ${normalizedList.length} row(s) from "${file.name}"! Explicitly edit below or run prediction.`);
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMessage(`Failed to parse file: ${err.message}`);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file from device.');
    };

    reader.readAsText(file);
  };

  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV split respecting quotes
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const obj = {};
      headers.forEach((h, idx) => {
        if (values[idx] !== undefined) {
          obj[h] = values[idx];
        }
      });
      rows.push(obj);
    }
    return rows;
  };

  const normalizeUploadedRow = (raw) => {
    const normalized = { ...formData };
    
    // Map standard alias names
    const aliasMap = {
      item_name: ['item_name', 'item', 'product', 'name', 'title', 'sku'],
      category: ['category', 'cat', 'department', 'type'],
      price: ['price', 'selling_price', 'unit_price', 'retail_price'],
      unit_cost: ['unit_cost', 'cost', 'wholesale_cost', 'purchase_cost'],
      stock_on_hand: ['stock_on_hand', 'stock', 'inventory', 'on_hand', 'qty_on_hand'],
      daily_sales_avg: ['daily_sales_avg', 'sales_avg', 'daily_velocity', 'daily_sales'],
      lead_time_days: ['lead_time_days', 'lead_time', 'delivery_days', 'supplier_lead_time'],
      discount_pct: ['discount_pct', 'discount', 'discount_percent', 'promo_pct'],
      season: ['season', 'seasonality', 'event_factor'],
      horizon_days: ['horizon_days', 'horizon', 'forecast_days', 'days'],
      store_id: ['store_id', 'store', 'location', 'branch']
    };

    for (const [field, aliases] of Object.entries(aliasMap)) {
      for (const alias of aliases) {
        // Case-insensitive key match
        const foundKey = Object.keys(raw).find((k) => k.toLowerCase().trim() === alias.toLowerCase());
        if (foundKey && raw[foundKey] !== undefined && raw[foundKey] !== '') {
          let val = raw[foundKey];
          if (['price', 'unit_cost', 'daily_sales_avg', 'discount_pct'].includes(field)) {
            val = parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0;
          } else if (['stock_on_hand', 'lead_time_days', 'horizon_days'].includes(field)) {
            val = parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 0;
          }
          normalized[field] = val;
          break;
        }
      }
    }
    return normalized;
  };

  const handleSelectRow = (idx) => {
    setSelectedRowIndex(idx);
    setFormData(parsedRows[idx]);
    setSuccessMessage(`Loaded Row #${idx + 1} ("${parsedRows[idx].item_name || 'Item'}") into the active form.`);
  };

  // Download Sample Templates
  const handleDownloadTemplate = (type) => {
    if (type === 'csv') {
      const csvContent = 'item_name,category,price,unit_cost,stock_on_hand,daily_sales_avg,lead_time_days,discount_pct,season,horizon_days,store_id\n' +
        '"Pro Wireless ANC Headphones","Electronics",149.99,85.00,18,6.0,4,15,"Weekend_Peak",7,"STR_001"\n' +
        '"Organic Farmhouse Whole Milk 1 Gal","Groceries",4.49,2.40,60,28.5,2,0,"Regular",7,"STR_001"\n' +
        '"Thermal Wool Winter Parka","Apparel",119.00,55.00,35,8.0,7,20,"Holiday_Rush",30,"STR_002"';

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'restockai_sample_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const jsonContent = JSON.stringify([
        {
          item_name: "Pro Wireless ANC Headphones",
          category: "Electronics",
          price: 149.99,
          unit_cost: 85.00,
          stock_on_hand: 18,
          daily_sales_avg: 6.0,
          lead_time_days: 4,
          discount_pct: 15,
          season: "Weekend_Peak",
          horizon_days: 7,
          store_id: "STR_001"
        },
        {
          item_name: "Organic Farmhouse Whole Milk 1 Gal",
          category: "Groceries",
          price: 4.49,
          unit_cost: 2.40,
          stock_on_hand: 60,
          daily_sales_avg: 28.5,
          lead_time_days: 2,
          discount_pct: 0,
          season: "Regular",
          horizon_days: 7,
          store_id: "STR_001"
        }
      ], null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'restockai_sample_data.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Run Batch Prediction on all rows
  const handleBatchPredict = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    setBatchPredicting(true);
    setErrorMessage('');
    try {
      const res = await api.predictions.createBatch(parsedRows);
      
      // Map predictions back into the rows
      const updatedRows = parsedRows.map((row, idx) => {
        const matchingPred = res.predictions?.[idx];
        if (matchingPred) {
          return {
            ...row,
            prediction: matchingPred.prediction,
            confidence: matchingPred.confidence,
            urgency: matchingPred.metrics?.urgency || 'HEALTHY'
          };
        }
        return row;
      });
      
      setParsedRows(updatedRows);
      setSuccessMessage(`Successfully generated predictions for all ${res.total_processed} items! View results inline below.`);
    } catch (err) {
      setErrorMessage(err.message || 'Batch prediction failed.');
    } finally {
      setBatchPredicting(false);
    }
  };

  // Submit Single Prediction
  const handleGeneratePrediction = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setPredicting(true);

    try {
      const predResponse = await api.predictions.create(formData);
      if (onPredictionCreated) {
        onPredictionCreated(predResponse);
      }
      if (onNavigate) {
        onNavigate('prediction-result');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Prediction generation failed.');
    } finally {
      setPredicting(false);
    }
  };

  // Save Data Only
  const handleSaveDataOnly = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setSavingData(true);

    const title = datasetTitle.trim() || `${formData.item_name || 'Item'} (${formData.category || 'Data'})`;
    try {
      await api.userData.save(title, formData);
      setSuccessMessage(`Dataset "${title}" saved successfully to your account!`);
      setDatasetTitle('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save dataset.');
    } finally {
      setSavingData(false);
    }
  };

  if (loadingSchema) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '14px' }} />
        <p>Loading dynamic ML feature schema...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SlidersHorizontal size={24} color="#2563eb" />
            Prediction Feature Studio & Device Data
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Upload datasets from your device or manually configure custom parameters for live ML forecasting.
          </p>
        </div>

        {/* Templates and Quick Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleDownloadTemplate('csv')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Download size={13} /> Sample CSV
          </button>
          <button
            type="button"
            onClick={() => handleDownloadTemplate('json')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Download size={13} /> Sample JSON
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'manual' ? '#eff6ff' : 'transparent',
            color: activeTab === 'manual' ? '#1d4ed8' : '#64748b',
            fontSize: '13px',
            fontWeight: activeTab === 'manual' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <SlidersHorizontal size={15} /> Explicit Parameter Form
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'import' ? '#eff6ff' : 'transparent',
            color: activeTab === 'import' ? '#1d4ed8' : '#64748b',
            fontSize: '13px',
            fontWeight: activeTab === 'import' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Upload size={15} /> Import Data from Device (CSV / JSON)
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#b91c1c',
          fontSize: '13px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#15803d',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* =========================================================
          DEVICE IMPORT PANEL
          ========================================================= */}
      {activeTab === 'import' && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
              borderRadius: '12px',
              padding: '36px 20px',
              textAlign: 'center',
              background: dragOver ? '#eff6ff' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Upload size={36} color="#2563eb" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Select or Drag & Drop Data File from Your Device
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
              Supports .csv and .json files with product/sales features (price, category, stock, daily average, discount)
            </p>
            <button
              type="button"
              style={{
                padding: '8px 16px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Browse Device Files
            </button>
          </div>

          {/* Uploaded Records Preview Table */}
          {parsedRows.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#2563eb" />
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Loaded from Device: {uploadedFileName} ({parsedRows.length} items detected)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleBatchPredict}
                  disabled={batchPredicting}
                  style={{
                    padding: '8px 16px',
                    background: '#15803d',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: batchPredicting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} /> {batchPredicting ? 'Predicting All...' : `⚡ Predict All (${parsedRows.length} Items)`}
                </button>
              </div>

              <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Product</th>
                      <th style={{ padding: '8px 12px' }}>Category</th>
                      <th style={{ padding: '8px 12px' }}>Price</th>
                      <th style={{ padding: '8px 12px' }}>Stock</th>
                      <th style={{ padding: '8px 12px' }}>Daily Avg</th>
                      <th style={{ padding: '8px 12px' }}>Prediction</th>
                      <th style={{ padding: '8px 12px' }}>Confidence</th>
                      <th style={{ padding: '8px 12px' }}>Urgency</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, idx) => {
                      const urgencyColors = {
                        CRITICAL: { bg: '#fef2f2', text: '#b91c1c' },
                        MODERATE: { bg: '#fffbeb', text: '#b45309' },
                        HEALTHY: { bg: '#f0fdf4', text: '#15803d' }
                      };
                      const uCol = r.urgency ? (urgencyColors[r.urgency] || urgencyColors.HEALTHY) : null;
                      
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: selectedRowIndex === idx ? '#eff6ff' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{r.item_name || 'SKU'}</td>
                          <td style={{ padding: '8px 12px' }}>{r.category || 'Retail'}</td>
                          <td style={{ padding: '8px 12px' }}>${r.price || 0}</td>
                          <td style={{ padding: '8px 12px' }}>{r.stock_on_hand || 0}</td>
                          <td style={{ padding: '8px 12px' }}>{r.daily_sales_avg || 0}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#2563eb' }}>
                            {r.prediction !== undefined ? `${r.prediction} units` : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16a34a' }}>
                            {r.confidence !== undefined ? `${r.confidence}%` : '—'}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {r.urgency ? (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background: uCol.bg,
                                color: uCol.text
                              }}>
                                {r.urgency}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleSelectRow(idx)}
                              style={{
                                padding: '4px 8px',
                                background: selectedRowIndex === idx ? '#2563eb' : '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                color: selectedRowIndex === idx ? '#ffffff' : '#334155',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 500
                              }}
                            >
                              {selectedRowIndex === idx ? 'Editing in Form ✓' : 'Load into Form'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          EXPLICIT MANUAL ENTRY / ACTIVE FORM
          ========================================================= */}
      <form onSubmit={handleGeneratePrediction}>
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Table size={16} color="#2563eb" /> Active Feature Parameters
            </h3>
            {uploadedFileName && (
              <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Synchronized with device row #{selectedRowIndex + 1}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {schema.map((field) => {
              const val = formData[field.name] !== undefined ? formData[field.name] : '';

              return (
                <div key={field.name} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {field.label}
                      {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>

                    {field.type === 'slider' && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        color: '#1d4ed8'
                      }}>
                        {val} {field.name.includes('pct') ? '%' : (field.name.includes('days') ? 'Days' : 'Units')}
                      </span>
                    )}
                  </div>

                  {field.type === 'select' && (
                    <select
                      id={`input-${field.name}`}
                      value={val}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      style={{
                        padding: '10px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      {field.options && field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'number' && (
                    <input
                      id={`input-${field.name}`}
                      type="number"
                      value={val}
                      min={field.min}
                      max={field.max}
                      step={field.step || 'any'}
                      onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
                      style={{
                        padding: '10px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  )}

                  {field.type === 'text' && (
                    <input
                      id={`input-${field.name}`}
                      type="text"
                      placeholder={field.placeholder || ''}
                      value={val}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      style={{
                        padding: '10px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  )}

                  {field.type === 'slider' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                      <input
                        id={`input-${field.name}`}
                        type="range"
                        min={field.min || 0}
                        max={field.max || 100}
                        step={field.step || 1}
                        value={val}
                        onChange={(e) => handleChange(field.name, parseFloat(e.target.value))}
                        style={{
                          flex: 1,
                          accentColor: '#2563eb',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  )}

                  {field.type === 'radio' && (
                    <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                      {field.options && field.options.map((opt) => (
                        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                          <input
                            type="radio"
                            name={field.name}
                            value={opt.value}
                            checked={String(val) === String(opt.value)}
                            onChange={(e) => handleChange(field.name, parseInt(e.target.value, 10) || e.target.value)}
                            style={{ accentColor: '#2563eb' }}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {field.description && (
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      {field.description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
        }}>
          {/* Save Dataset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              placeholder="Dataset Name (Optional)"
              value={datasetTitle}
              onChange={(e) => setDatasetTitle(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#0f172a',
                fontSize: '13px',
                outline: 'none',
                width: '200px'
              }}
            />
            <button
              type="button"
              onClick={handleSaveDataOnly}
              disabled={savingData}
              style={{
                padding: '8px 12px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: savingData ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={15} /> {savingData ? 'Saving...' : 'Save Dataset'}
            </button>
          </div>

          {/* Predict Primary Button */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={loadSchema}
              style={{
                padding: '10px 14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={15} /> Reset
            </button>
            <button
              id="submit-prediction-btn"
              type="submit"
              disabled={predicting}
              style={{
                padding: '10px 22px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: predicting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                opacity: predicting ? 0.7 : 1
              }}
            >
              <Sparkles size={16} /> {predicting ? 'Processing Model...' : 'Generate Prediction'}
              {!predicting && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
