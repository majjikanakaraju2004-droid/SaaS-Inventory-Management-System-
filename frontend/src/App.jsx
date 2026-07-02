import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Settings from './components/Settings';
import { LayoutDashboard, Package, Settings as SettingsIcon, LogOut, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation: 'dashboard' | 'products' | 'settings'
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Auth navigation: 'login' | 'signup'
  const [authPage, setAuthPage] = useState('login');

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Flag to auto-open product modal on page navigation
  const [openAddProductOnLoad, setOpenAddProductOnLoad] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const navigateToAddProduct = () => {
    setOpenAddProductOnLoad(true);
    setCurrentView('products');
  };

  const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/api/auth/session/');
      if (data.authenticated) {
        setIsAuthenticated(true);
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    showToast('Successfully signed in.');
  };

  const handleSignupSuccess = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    showToast('Account created successfully.');
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout/', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      setAuthPage('login');
    }
  };

  const handleOrgUpdate = (newName) => {
    setUser(prev => prev ? {
      ...prev,
      organization_name: newName
    } : null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#080b11',
        color: '#f8fafc',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontWeight: 500, letterSpacing: '0.5px' }}>Checking session credentials...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated view
  if (!isAuthenticated) {
    if (authPage === 'signup') {
      return (
        <Signup 
          onSignupSuccess={handleSignupSuccess} 
          switchToLogin={() => setAuthPage('login')} 
        />
      );
    }
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        switchToSignup={() => setAuthPage('signup')} 
      />
    );
  }

  // Authenticated Layout & Routing
  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-wrapper">
            <img src="/stockflow-logo.svg" alt="StockFlow Logo" className="logo-img" />
            <div className="logo-brand">
              <span className="logo-text" style={{ fontSize: '14px' }}>StockFlow</span>
              <span className="logo-tagline">Inventory MVP</span>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`sidebar-link ${currentView === 'products' ? 'active' : ''}`}
            onClick={() => setCurrentView('products')}
          >
            <Package size={18} />
            <span>Products</span>
          </button>
          
          <button 
            className={`sidebar-link ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-wrapper">
        <header className="main-header">
          <div className="header-title-section">
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Hello, {user?.username}</h2>
            <div className="org-badge">{user?.organization_name || 'My Organization'}</div>
          </div>
          
          <div className="user-profile-menu">
            <div className="user-avatar" title={user?.username}>
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="content-body">
          {currentView === 'dashboard' && <Dashboard navigateToAddProduct={navigateToAddProduct} />}
          {currentView === 'products' && (
            <Products 
              openAddProductOnLoad={openAddProductOnLoad} 
              setOpenAddProductOnLoad={setOpenAddProductOnLoad}
              showToast={showToast}
            />
          )}
          {currentView === 'settings' && <Settings onOrgUpdate={handleOrgUpdate} showToast={showToast} />}
        </main>
      </div>

      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />}
              {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
              {toast.type === 'info' && <Info size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />}
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
