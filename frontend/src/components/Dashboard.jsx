import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { LayoutDashboard, Package, ShieldAlert, Layers, Plus } from 'lucide-react';

export default function Dashboard({ navigateToAddProduct }) {
  const [stats, setStats] = useState({
    total_products: 0,
    total_quantity: 0,
    low_stock_count: 0,
    low_stock_items: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/dashboard/');
      setStats(data);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading overview metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-box error">
        <ShieldAlert size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="dashboard-badge">StockFlow MVP</div>
          <h1 className="page-title">Inventory Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your products and stock levels</p>
        </div>
        <div className="dashboard-hero-visual">
          <img src="/stockflow-logo.svg" alt="StockFlow inventory logo" className="dashboard-hero-logo" />
        </div>
      </div>

      {stats.total_products === 0 ? (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <h3 className="empty-state-title">No products yet</h3>
          <p className="empty-state-description">Get started by creating your first product to see dashboard statistics.</p>
          <button className="btn btn-primary" onClick={navigateToAddProduct}>
            <Plus size={18} />
            Add Product
          </button>
        </div>
      ) : (
        <>

      {/* Stats Cards Grid */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Unique Products</span>
            <span className="stat-value">{stats.total_products}</span>
          </div>
          <div className="stat-icon primary">
            <Package size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Units in Stock</span>
            <span className="stat-value">{stats.total_quantity}</span>
          </div>
          <div className="stat-icon success">
            <Layers size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Low Stock Items</span>
            <span className="stat-value" style={{ color: stats.low_stock_count > 0 ? 'var(--warning)' : 'inherit' }}>
              {stats.low_stock_count}
            </span>
          </div>
          <div className="stat-icon warning">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* Low Stock Items Section */}
      <div className="card-section">
        <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} style={{ color: stats.low_stock_count > 0 ? 'var(--warning)' : 'var(--success)' }} />
          Low Stock Alerts
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Products where quantity on hand is less than or equal to the stock threshold.
        </p>

        {stats.low_stock_items.length === 0 ? (
          <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            🎉 All products have healthy stock levels!
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity on Hand</th>
                  <th>Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><code>{item.sku}</code></td>
                    <td style={{ fontWeight: 600, color: item.quantity_on_hand === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                      {item.quantity_on_hand}
                    </td>
                    <td>{item.low_stock_threshold}</td>
                    <td>
                      <span className={`badge-status ${item.quantity_on_hand === 0 ? 'outofstock' : 'lowstock'}`}>
                        <span className="badge-status-dot"></span>
                        {item.quantity_on_hand === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
