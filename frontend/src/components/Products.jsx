import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { Search, Plus, Edit3, Trash2, ShieldAlert, Package, CheckCircle, Tag, FileText, Layers, DollarSign, Info } from 'lucide-react';

export default function Products({ openAddProductOnLoad, setOpenAddProductOnLoad, showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [threshold, setThreshold] = useState('');
  const [formError, setFormError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/products/');
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (openAddProductOnLoad) {
      handleOpenAdd();
      setOpenAddProductOnLoad(false);
    }
  }, [openAddProductOnLoad]);

  const resetForm = () => {
    setName('');
    setSku('');
    setDescription('');
    setQuantity(0);
    setCostPrice('');
    setSellingPrice('');
    setThreshold('');
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setName(product.name);
    setSku(product.sku);
    setDescription(product.description || '');
    setQuantity(product.quantity_on_hand);
    setCostPrice(product.cost_price || '');
    setSellingPrice(product.selling_price || '');
    setThreshold(product.low_stock_threshold || '');
    setFormError('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const trimmedSku = sku.trim();

    if (!trimmedName || !trimmedSku) {
      setFormError('Name and SKU are required.');
      return;
    }

    if (parseInt(quantity) < 0) {
      setFormError('Quantity cannot be negative.');
      return;
    }

    if (costPrice !== '' && parseFloat(costPrice) < 0) {
      setFormError('Cost price cannot be negative.');
      return;
    }

    if (sellingPrice !== '' && parseFloat(sellingPrice) < 0) {
      setFormError('Selling price cannot be negative.');
      return;
    }

    if (threshold !== '' && parseInt(threshold) < 0) {
      setFormError('Low stock threshold cannot be negative.');
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        sku: trimmedSku,
        description: description.trim(),
        quantity_on_hand: parseInt(quantity) || 0,
        cost_price: costPrice === '' ? null : parseFloat(costPrice),
        selling_price: sellingPrice === '' ? null : parseFloat(sellingPrice),
        low_stock_threshold: threshold === '' ? null : parseInt(threshold)
      };

      const newProduct = await apiRequest('/api/products/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setProducts([newProduct, ...products]);
      setShowAddModal(false);
      resetForm();
      showToast('Product Added Successfully');
    } catch (err) {
      setFormError(err.message || 'Failed to create product.');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const trimmedSku = sku.trim();

    if (!trimmedName || !trimmedSku) {
      setFormError('Name and SKU are required.');
      return;
    }

    if (parseInt(quantity) < 0) {
      setFormError('Quantity cannot be negative.');
      return;
    }

    if (costPrice !== '' && parseFloat(costPrice) < 0) {
      setFormError('Cost price cannot be negative.');
      return;
    }

    if (sellingPrice !== '' && parseFloat(sellingPrice) < 0) {
      setFormError('Selling price cannot be negative.');
      return;
    }

    if (threshold !== '' && parseInt(threshold) < 0) {
      setFormError('Low stock threshold cannot be negative.');
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        sku: trimmedSku,
        description: description.trim(),
        quantity_on_hand: parseInt(quantity) || 0,
        cost_price: costPrice === '' ? null : parseFloat(costPrice),
        selling_price: sellingPrice === '' ? null : parseFloat(sellingPrice),
        low_stock_threshold: threshold === '' ? null : parseInt(threshold)
      };

      const updated = await apiRequest(`/api/products/${selectedProduct.id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setProducts(products.map(p => p.id === selectedProduct.id ? updated : p));
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      showToast('Updated Successfully');
    } catch (err) {
      setFormError(err.message || 'Failed to update product.');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await apiRequest(`/api/products/${selectedProduct.id}/`, {
        method: 'DELETE'
      });
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      showToast('Deleted Successfully');
    } catch (err) {
      showToast('Failed to delete product: ' + err.message, 'error');
    }
  };

  const handleAdjustStock = async (id, adjustment) => {
    try {
      // Find the current product to make sure adjustment doesn't reduce below zero
      const target = products.find(p => p.id === id);
      if (target && target.quantity_on_hand + adjustment < 0) {
        return; // Avoid negative quantity adjustments on UI
      }

      const updated = await apiRequest(`/api/products/${id}/adjust_stock/`, {
        method: 'POST',
        body: JSON.stringify({ adjustment })
      });
      setProducts(products.map(p => p.id === id ? updated : p));
      showToast('Updated Successfully');
    } catch (err) {
      showToast('Failed to adjust stock: ' + err.message, 'error');
    }
  };

  // Client-side search matching name or SKU
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your item inventory and thresholds</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {error && (
        <div className="alert-box error" style={{ marginBottom: '24px' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading products...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state animate-fade-in" style={{ marginTop: '0' }}>
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <h3 className="empty-state-title">No products yet</h3>
          <p className="empty-state-description">Start by adding your first product to your warehouse.</p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            Add Product
          </button>
        </div>
      ) : (
        <div className="card-section">
          {/* Filter / Search Bar */}
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon-svg" />
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              No products found matching your search.
            </div>
          ) : (
            <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Adjust Stock</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  let statusClass = 'instock';
                  let statusText = 'In Stock';
                  if (p.is_low_stock) {
                    statusClass = p.quantity_on_hand === 0 ? 'outofstock' : 'lowstock';
                    statusText = p.quantity_on_hand === 0 ? 'Out of Stock' : 'Low Stock';
                  }

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><code>{p.sku}</code></td>
                      <td style={{ fontWeight: 600 }}>{p.quantity_on_hand}</td>
                      <td>
                        <div className="stock-adjust-cell">
                          <button 
                            className="stock-adjust-btn" 
                            onClick={() => handleAdjustStock(p.id, -1)}
                            title="Decrease by 1"
                            disabled={p.quantity_on_hand <= 0}
                          >
                            -
                          </button>
                          <button 
                            className="stock-adjust-btn" 
                            onClick={() => handleAdjustStock(p.id, 1)}
                            title="Increase by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{p.cost_price ? `$${parseFloat(p.cost_price).toFixed(2)}` : '—'}</td>
                      <td>{p.selling_price ? `$${parseFloat(p.selling_price).toFixed(2)}` : '—'}</td>
                      <td>
                        <span className={`badge-status ${statusClass}`}>
                          <span className="badge-status-dot"></span>
                          {statusText}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ padding: '6px' }}
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '6px' }}
                            onClick={() => handleOpenDelete(p)}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Product</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            {formError && (
              <div className="alert-box error" style={{ marginBottom: '16px' }}>
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddProduct}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <div className="input-icon-wrapper">
                    <Package size={16} className="input-icon-svg" />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Wireless Mouse"
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <div className="input-icon-wrapper">
                    <Tag size={16} className="input-icon-svg" />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. MS-WRL-01"
                      value={sku} 
                      onChange={(e) => setSku(e.target.value)} 
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <div className="input-icon-wrapper">
                  <FileText size={16} className="input-icon-svg" style={{ top: '20px', transform: 'none' }} />
                  <textarea 
                    className="form-input" 
                    placeholder="Provide short item description..."
                    style={{ height: '60px', resize: 'none', paddingLeft: '44px' }}
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity on Hand</label>
                  <div className="input-icon-wrapper">
                    <Layers size={16} className="input-icon-svg" />
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="0"
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <div className="input-icon-wrapper">
                    <Info size={16} className="input-icon-svg" />
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="Global default"
                      value={threshold} 
                      onChange={(e) => setThreshold(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cost Price ($)</label>
                  <div className="input-icon-wrapper">
                    <DollarSign size={16} className="input-icon-svg" />
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={costPrice} 
                      onChange={(e) => setCostPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price ($)</label>
                  <div className="input-icon-wrapper">
                    <DollarSign size={16} className="input-icon-svg" />
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={sellingPrice} 
                      onChange={(e) => setSellingPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Product</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            {formError && (
              <div className="alert-box error" style={{ marginBottom: '16px' }}>
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditProduct}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <div className="input-icon-wrapper">
                    <Package size={16} className="input-icon-svg" />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Wireless Mouse"
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <div className="input-icon-wrapper">
                    <Tag size={16} className="input-icon-svg" />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. MS-WRL-01"
                      value={sku} 
                      onChange={(e) => setSku(e.target.value)} 
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <div className="input-icon-wrapper">
                  <FileText size={16} className="input-icon-svg" style={{ top: '20px', transform: 'none' }} />
                  <textarea 
                    className="form-input" 
                    placeholder="Provide short item description..."
                    style={{ height: '60px', resize: 'none', paddingLeft: '44px' }}
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity on Hand</label>
                  <div className="input-icon-wrapper">
                    <Layers size={16} className="input-icon-svg" />
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="0"
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <div className="input-icon-wrapper">
                    <Info size={16} className="input-icon-svg" />
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="Global default"
                      value={threshold} 
                      onChange={(e) => setThreshold(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cost Price ($)</label>
                  <div className="input-icon-wrapper">
                    <DollarSign size={16} className="input-icon-svg" />
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={costPrice} 
                      onChange={(e) => setCostPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price ($)</label>
                  <div className="input-icon-wrapper">
                    <DollarSign size={16} className="input-icon-svg" />
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={sellingPrice} 
                      onChange={(e) => setSellingPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Delete Product</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete product <strong style={{ color: 'var(--text-primary)' }}>{selectedProduct?.name}</strong> (SKU: {selectedProduct?.sku})? This action cannot be undone.
            </p>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteProduct}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
