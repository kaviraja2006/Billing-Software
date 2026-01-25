import axios from 'axios';

// Vite uses import.meta.env for environment variables.
// Variables must start with VITE_ to be exposed to the client.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const api = axios.create({
    baseURL: "http://127.0.0.1:5000",
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear invalid token
            localStorage.removeItem('token');
            return Promise.reject(error);
        }
        console.error("API error:", error);
        return Promise.reject(error);
    }
);

// Environment Detection
const isElectron = window.electron !== undefined;

// Helper to mimic Axios Response for Electron IPC
const ipcResponse = async (promise) => {
    try {
        const data = await promise;
        return { data, status: 200, statusText: 'OK' }; // Mimic Axios structure
    } catch (error) {
        console.error('Electron IPC Error:', error);
        throw { response: { status: 500, data: { message: error.message } } };
    }
};

// Service Wrapper
const services = {
    auth: {
        login: async (credentials) => {
            if (isElectron) {
                // Mock Login for Offline Mode
                return { user: { name: 'Offline User', role: 'admin' }, token: 'offline-token' };
            }
            const response = await api.post('/auth/login', credentials);
            return response.data;
        },
        googleLogin: async (token) => {
            // Not supported offline strictly, or handled via deep link
            const response = await api.post('/auth/google', { token });
            return response.data;
        },
        register: async (userData) => {
            // Registration not supported offline? Or just create user locally?
            const response = await api.post('/auth/register', userData);
            return response.data;
        },
        logout: () => isElectron ? Promise.resolve() : api.post('/auth/logout'),
        getCurrentUser: () => isElectron ?
            Promise.resolve({ data: { user: { name: 'Offline User' } } }) :
            api.get('/auth/me'),
    },
    customers: {
        getAll: () => isElectron ? ipcResponse(window.electron.customer.findAll()) : api.get('/customers'),
        getById: (id) => isElectron ? ipcResponse(window.electron.customer.findById(id)) : api.get(`/customers/${id}`),
        create: (data) => isElectron ? ipcResponse(window.electron.customer.create(data)) : api.post('/customers', data),
        update: (id, data) => isElectron ? ipcResponse(window.electron.customer.update(id, data)) : api.put(`/customers/${id}`, data),
        delete: (id) => isElectron ? ipcResponse(window.electron.customer.delete(id)) : api.delete(`/customers/${id}`),
        searchDuplicates: (query) => isElectron ? Promise.resolve({ data: [] }) : api.get('/customers/search-duplicates', { params: { query } }),
    },
    products: {
        getAll: () => isElectron ? ipcResponse(window.electron.product.findAll()) : api.get('/products'),
        getById: (id) => isElectron ? ipcResponse(window.electron.product.findById(id)) : api.get(`/products/${id}`),
        create: (data) => isElectron ? ipcResponse(window.electron.product.create(data)) : api.post('/products', data),
        update: (id, data) => isElectron ? ipcResponse(window.electron.product.update(id, data)) : api.put(`/products/${id}`, data),
        delete: (id) => isElectron ? ipcResponse(window.electron.product.delete(id)) : api.delete(`/products/${id}`),
        getStats: (id) => isElectron ? Promise.resolve({ data: {} }) : api.get(`/products/${id}/stats`),
    },
    billing: {
        createInvoice: (data) => isElectron ? ipcResponse(window.electron.invoice.create(data)) : api.post('/invoices', data),
    },
    invoices: {
        getAll: (params) => isElectron ? ipcResponse(window.electron.invoice.findAll(params)) : api.get('/invoices', { params }),
        getStats: (params) => isElectron ? Promise.resolve({ data: {} }) : api.get('/invoices/stats', { params }),
        getById: (id) => isElectron ? ipcResponse(window.electron.invoice.findById(id)) : api.get(`/invoices/${id}`),
        update: (id, data) => isElectron ? ipcResponse(window.electron.invoice.update(id, data)) : api.put(`/invoices/${id}`, data),
        delete: (id) => isElectron ? ipcResponse(window.electron.invoice.delete(id)) : api.delete(`/invoices/${id}`),
        bulkDelete: (ids) => isElectron ? Promise.resolve({ data: {} }) : api.post('/invoices/bulk-delete', { ids }),
    },
    expenses: {
        getAll: () => api.get('/expenses'), // Not implementing offline expenses yet
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
        getDashboardStats: (params) => isElectron ? Promise.resolve({ data: { totalSales: 0, totalInvoices: 0 } }) : api.get('/reports/dashboard', { params }),
        getFinancials: (params) => api.get('/reports/financials', { params }),
        getSalesTrend: (params) => api.get('/reports/sales-trend', { params }),
        getPaymentMethodStats: (params) => api.get('/reports/payment-methods', { params }),
        getTopProducts: (params) => api.get('/reports/top-products', { params }),
        getCustomerMetrics: (params) => api.get('/reports/customers', { params }),
    },
    settings: {
        getSettings: () => isElectron ? ipcResponse(window.electron.settings.getSettings()) : api.get('/settings'),
        updateSettings: (data) => isElectron ? ipcResponse(window.electron.settings.updateSettings(data)) : api.put('/settings', data),
    },
    backup: {
        trigger: () => api.post('/backup/trigger'),
        getStatus: () => api.get('/backup/status'),
    },
};

export default services;
