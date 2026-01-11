import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Switched to local for development
//const API_BASE_URL = 'https://billing-software-o1qb.onrender.com'; // Hosted on Render

const api = axios.create({
    baseURL: API_BASE_URL,
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
        login: (credentials) => api.post('/auth/login', credentials),
        register: (data) => api.post('/auth/register', data),
        logout: () => api.post('/auth/logout'),
        getCurrentUser: () => api.get('/auth/me'),
    },
    customers: {
        getAll: () => api.get('/customers'),
        getById: (id) => api.get(`/customers/${id}`),
        create: (data) => api.post('/customers', data),
        update: (id, data) => api.put(`/customers/${id}`, data),
        delete: (id) => api.delete(`/customers/${id}`),
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
        getById: (id) => api.get(`/invoices/${id}`),
        delete: (id) => api.delete(`/invoices/${id}`),
    },
    expenses: {
        getAll: () => api.get('/expenses'),
        create: (data) => api.post('/expenses', data),
        delete: (id) => api.delete(`/expenses/${id}`),
    },
    reports: {
        getDashboardStats: (params) => api.get('/reports/dashboard', { params }),
        getFinancials: (params) => api.get('/reports/financials', { params }),
        getSalesTrend: (params) => api.get('/reports/sales-trend', { params }),
        getPaymentMethodStats: (params) => api.get('/reports/payment-methods', { params }),
        getTopProducts: (params) => api.get('/reports/top-products', { params }),
    },
    settings: {
        getSettings: () => api.get('/settings'),
        updateSettings: (data) => api.put('/settings', data),
    },
};

export default services;
