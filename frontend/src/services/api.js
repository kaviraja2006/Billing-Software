import axios from 'axios';

// Vite uses import.meta.env for environment variables.
// Variables must start with VITE_ to be exposed to the client.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors (server not running, connection refused, etc.)
        if (!error.response) {
            console.error('Network error: Backend server may not be reachable (CORS, server down, or invalid URL).');
        } else {
            // Log detailed API error for debugging
            console.error('API Error:', error.response.status, error.response.data);
        }

        if (error.response && error.response.status === 401) {
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Service Wrapper
const services = {
    auth: {
        login: async (credentials) => {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        },
        googleLogin: async (token) => {
            const response = await api.post('/auth/google', { token });
            return response.data;
        },
        register: async (userData) => {
            const response = await api.post('/auth/register', userData);
            return response.data;
        },
        logout: () => api.post('/auth/logout'),
        getCurrentUser: () => api.get('/auth/me'),
    },
    customers: {
        getAll: () => api.get('/customers'),
        getById: (id) => api.get(`/customers/${id}`),
        create: (data) => api.post('/customers', data),
        update: (id, data) => api.put(`/customers/${id}`, data),
        delete: (id) => api.delete(`/customers/${id}`),
        searchDuplicates: (query) => api.get('/customers/search-duplicates', { params: { query } }),
    },
    products: {
        getAll: () => api.get('/products'),
        getById: (id) => api.get(`/products/${id}`),
        create: (data) => api.post('/products', data),
        update: (id, data) => api.put(`/products/${id}`, data),
        delete: (id) => api.delete(`/products/${id}`),
        getStats: (id) => api.get(`/products/${id}/stats`),
    },
    billing: {
        createInvoice: (data) => api.post('/invoices', data),
    },
    invoices: {
        getAll: (params) => api.get('/invoices', { params }),
        getStats: (params) => api.get('/invoices/stats', { params }),
        getById: (id) => api.get(`/invoices/${id}`),
        update: (id, data) => api.put(`/invoices/${id}`, data),
        delete: (id) => api.delete(`/invoices/${id}`),
        bulkDelete: (ids) => api.post('/invoices/bulk-delete', { ids }),
    },
    expenses: {
        getAll: () => api.get('/expenses'),
        create: (data) => api.post('/expenses', data),
        update: (id, data) => api.put(`/expenses/${id}`, data),
        delete: (id) => api.delete(`/expenses/${id}`),
        bulkUpdate: (ids, updates) => api.post('/expenses/bulk-update', { ids, updates }),
        bulkDelete: (ids) => api.post('/expenses/bulk-delete', { ids }),
        exportCSV: () => api.get('/expenses/export/csv', { responseType: 'blob' }),
        uploadReceipt: (id, file) => {
            const formData = new FormData();
            formData.append('receipt', file);
            return api.post(`/expenses/${id}/receipt`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
    },
    reports: {
        getDashboardStats: (params) => api.get('/reports/dashboard', { params }),
        getFinancials: (params) => api.get('/reports/financials', { params }),
        getSalesTrend: (params) => api.get('/reports/sales-trend', { params }),
        getPaymentMethodStats: (params) => api.get('/reports/payment-methods', { params }),
        getTopProducts: (params) => api.get('/reports/top-products', { params }),
        getCustomerMetrics: (params) => api.get('/reports/customers', { params }),
    },
    settings: {
        getSettings: () => api.get('/settings'),
        updateSettings: (data) => api.put('/settings', data),
    },
};

export default services;
