import React, { useState } from 'react';
import { apiRequest } from '../api';
import { ShieldAlert, Eye, EyeOff, Check, X } from 'lucide-react';

export default function Signup({ onSignupSuccess, switchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword || !organizationName) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/signup/', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          organization_name: organizationName
        })
      });
      onSignupSuccess(data);
    } catch (err) {
      setError(err.message || 'Error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const showMatchIndicator = password && confirmPassword;

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
            Start managing your inventory today. Simple, fast, and built for small teams that need real-time stock visibility.
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
            <h2>Create Account</h2>
            <p className="auth-subtitle">Start your free trial today</p>
          </div>

        {error && (
          <div className="alert-box error">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="organization">Organization Name</label>
            <input
              id="organization"
              type="text"
              className="form-input"
              placeholder="e.g., Acme Logistics"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

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

          <div className="form-row">
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

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {showMatchIndicator && (
            <div className={`password-match-indicator ${passwordsMatch ? 'match' : 'mismatch'}`} style={{ marginBottom: '16px' }}>
              {passwordsMatch ? (
                <>
                  <Check size={14} />
                  <span>Passwords match</span>
                </>
              ) : (
                <>
                  <X size={14} />
                  <span>Passwords do not match</span>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button
            onClick={switchToLogin}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-hover)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign in
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
