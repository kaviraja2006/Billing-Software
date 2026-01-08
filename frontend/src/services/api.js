import axios from 'axios';
import { mockAuthService } from './mock/auth';
import { mockCustomerService } from './mock/customers';
import { mockProductService } from './mock/products';
import { mockBillingService } from './mock/billing';
import { mockInvoiceService } from './mock/invoices';
import { mockExpenseService } from './mock/expenses';
import { mockReportService } from './mock/reports'; // Will create later
import { mockSettingsService } from './mock/settings'; // Will create later

const USE_MOCK = false; // Set to true to use mock services, false to use real API
const API_BASE_URL = 'http://localhost:5001'; // Switched to local for development
// const API_BASE_URL = 'https://billing-software-bay-seven.vercel.app'; // Placeholder for real backend

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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
            console.error('Network error: Backend server may not be running. Please ensure the backend is started on port 5001.');
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

// Mock Service Wrapper
const services = {
    auth: USE_MOCK ? mockAuthService : {
        login: (credentials) => api.post('/auth/login', credentials),
        register: (data) => api.post('/auth/register', data),
        logout: () => api.post('/auth/logout'),
        getCurrentUser: () => api.get('/auth/me'),
    },
    customers: USE_MOCK ? mockCustomerService : {
        getAll: () => api.get('/customers'),
        getById: (id) => api.get(`/customers/${id}`),
        create: (data) => api.post('/customers', data),
        update: (id, data) => api.put(`/customers/${id}`, data),
        delete: (id) => api.delete(`/customers/${id}`),
    },
    products: USE_MOCK ? mockProductService : {
        getAll: () => api.get('/products'),
        getById: (id) => api.get(`/products/${id}`),
        create: (data) => api.post('/products', data),
        update: (id, data) => api.put(`/products/${id}`, data),
        delete: (id) => api.delete(`/products/${id}`),
    },
    billing: USE_MOCK ? mockBillingService : {
        createInvoice: (data) => api.post('/invoices', data),
        // Billing usually results in an invoice creation
    },
    invoices: USE_MOCK ? mockInvoiceService : {
        getAll: () => api.get('/invoices'),
        getById: (id) => api.get(`/invoices/${id}`),
        delete: (id) => api.delete(`/invoices/${id}`),
    },
    expenses: USE_MOCK ? mockExpenseService : {
        getAll: () => api.get('/expenses'),
        create: (data) => api.post('/expenses', data),
        delete: (id) => api.delete(`/expenses/${id}`),
    },
    reports: USE_MOCK ? mockReportService : {
        getDashboardStats: () => api.get('/reports/dashboard'),
        getFinancialStats: () => api.get('/reports/financials'),
        getSalesTrend: () => api.get('/reports/sales-trend'),
        getPaymentMethodStats: () => api.get('/reports/payment-methods'),
        getTopProducts: () => api.get('/reports/top-products'),
    },
    settings: USE_MOCK ? mockSettingsService : {
        getSettings: () => api.get('/settings'),
        updateSettings: (data) => api.put('/settings', data),
    },
};

export default services;
