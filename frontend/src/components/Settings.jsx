import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { ShieldAlert } from 'lucide-react';

export default function Settings({ onOrgUpdate, showToast }) {
  const [orgName, setOrgName] = useState('');
  const [defaultThreshold, setDefaultThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/api/settings/');
        setOrgName(data.organization_name);
        setDefaultThreshold(data.default_low_stock_threshold);
      } catch (err) {
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!orgName.trim()) {
      setError('Organization name is required.');
      return;
    }

    if (parseInt(defaultThreshold) < 0) {
      setError('Low stock threshold cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const data = await apiRequest('/api/settings/', {
        method: 'PUT',
        body: JSON.stringify({
          organization_name: orgName.trim(),
          default_low_stock_threshold: parseInt(defaultThreshold) || 5
        })
      });
      setOrgName(data.organization_name);
      setDefaultThreshold(data.default_low_stock_threshold);
      if (showToast) showToast('Settings saved successfully!');
      if (onOrgUpdate) {
        onOrgUpdate(data.organization_name);
      }
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure organization profile and system preferences</p>
        </div>
      </div>

      {error && (
        <div className="alert-box error" style={{ maxWidth: '600px', marginBottom: '24px' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="card-section settings-section">
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Organization &amp; Threshold</h2>
        
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="org-name">Organization Name</label>
            <input
              id="org-name"
              type="text"
              className="form-input"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="def-threshold">Default Low Stock Threshold</label>
            <input
              id="def-threshold"
              type="number"
              min="0"
              className="form-input"
              value={defaultThreshold}
              onChange={(e) => setDefaultThreshold(e.target.value)}
              disabled={saving}
              required
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Used globally for dashboard low-stock warning calculations if a specific product threshold is not defined.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ marginTop: '10px' }}
          >
            {saving ? 'Saving changes...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
