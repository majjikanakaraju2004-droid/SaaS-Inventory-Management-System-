import React, { useState } from 'react';
import { apiRequest } from '../api';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess, switchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <img src="/stockflow-logo.svg" alt="StockFlow Logo" />
          </div>
          <h1 className="auth-left-title">
            <span className="highlight">StockFlow</span> MVP
          </h1>
          <p className="auth-left-description">
            Your lightweight, real-time inventory management system. Keep track of stock levels, manage products, and never miss a low-stock alert.
          </p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-title">Product Management</div>
              <div className="auth-feature-desc">Create and manage products with SKU, pricing, and stock levels</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-title">Inventory Tracking</div>
              <div className="auth-feature-desc">Real-time visibility into your stock quantities</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-title">Low Stock Alerts</div>
              <div className="auth-feature-desc">Automatic notifications when items fall below threshold</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-title">Multi-Tenant Safe</div>
              <div className="auth-feature-desc">Each organization has isolated inventory data</div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Log in to your inventory dashboard</p>
          </div>

        {error && (
          <div className="alert-box error">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button
            onClick={switchToSignup}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-hover)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign up now
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
