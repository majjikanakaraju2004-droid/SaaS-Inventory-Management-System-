// StockFlow API client utility

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_BASE_URL = isLocal
  ? "http://127.0.0.1:8000"
  : "https://saas-inventory-management-system-wn2o.onrender.com";

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Setup headers
  options.headers = {
    ...options.headers,
  };

  // Add JSON Content-Type if we're sending JSON body
  if (options.body && !(options.body instanceof FormData) && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }

  // Attach DRF Token to request if present in localStorage
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(url, options);
  
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.detail || 'An error occurred.');
  }
  
  return data;
}
