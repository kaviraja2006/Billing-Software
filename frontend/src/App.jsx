import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import CustomTitleBar from './components/layout/CustomTitleBar';

import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing/BillingPage';
import Products from './pages/Products/ProductsPage';
import Customers from './pages/Customers/CustomersPage';
import Invoices from './pages/Invoices/InvoicesPage';
import Reports from './pages/Reports/ReportsPage';
import Expenses from './pages/Expenses/ExpensesPage';
import Settings from './pages/Settings/SettingsPage';
import BarcodeGenerator from './pages/Barcode/BarcodePage';

import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import OAuthCallback from './pages/Auth/OAuthCallback';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { TransactionProvider } from './context/TransactionContext';
import { ProductProvider } from './context/ProductContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CustomerProvider>
          <TransactionProvider>
            <ProductProvider>
              <ExpenseProvider>
                <SettingsProvider>
                  <div className="flex flex-col h-screen overflow-hidden">
                    <CustomTitleBar />
                    <div className="flex-1 overflow-hidden mt-8">
                      <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />

                        <Route path="/" element={
                          <ProtectedRoute>
                            <MainLayout />
                          </ProtectedRoute>
                        }>
                          <Route index element={<Dashboard />} />
                          <Route path="billing" element={<Billing />} />
                          <Route path="products" element={<Products />} />
                          <Route path="customers" element={<Customers />} />
                          <Route path="invoices" element={<Invoices />} />
                          <Route path="reports" element={<Reports />} />
                          <Route path="expenses" element={<Expenses />} />
                          <Route path="barcode" element={<BarcodeGenerator />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                      </Routes>
                    </div>
                  </div>
                </SettingsProvider>
              </ExpenseProvider>
            </ProductProvider>
          </TransactionProvider>
        </CustomerProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
