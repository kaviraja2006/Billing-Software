import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

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
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { TransactionProvider } from './context/TransactionContext';
import { ProductProvider } from './context/ProductContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <AuthProvider>
      <CustomerProvider>
        <TransactionProvider>
          <ProductProvider>
            <ExpenseProvider>
              <SettingsProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />

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
                </BrowserRouter>
              </SettingsProvider>
            </ExpenseProvider>
          </ProductProvider>
        </TransactionProvider>
      </CustomerProvider>
    </AuthProvider>
  );
}

export default App;
