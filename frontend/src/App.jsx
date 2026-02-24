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
import GSTReports from './pages/Reports/GSTReportsPage';
import Expenses from './pages/Expenses/ExpensesPage';
import Settings from './pages/Settings/SettingsPage';
import BarcodeGenerator from './pages/Barcode/BarcodePage';

import LoginPage from './pages/Auth/LoginPage';
import CompleteProfile from './pages/onboarding/CompleteProfile';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { TransactionProvider } from './context/TransactionContext';
import { ProductProvider } from './context/ProductContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { isProfileComplete } from './hooks/useOnboardingStatus';

// Simple waiting component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-600">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="font-medium animate-pulse">Starting Billing Software...</p>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CustomerProvider>
          <TransactionProvider>
            <ProductProvider>
              <ExpenseProvider>
                <SettingsProvider>
                  <AppContent />
                </SettingsProvider>
              </ExpenseProvider>
            </ProductProvider>
          </TransactionProvider>
        </CustomerProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

import ScrollToTop from './components/layout/ScrollToTop';

// Extract content to use Auth Context
const AppContent = () => {
  const { authStatus } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

  if (authStatus === 'loading' || settingsLoading) {
    return <LoadingScreen />;
  }

  // Check if user needs onboarding (only for authenticated users)
  if (authStatus === 'authenticated') {
    console.log("[DEBUG] App State:", {
      authStatus,
      hasSettings: !!settings,
      onboardingCompletedAt: settings?.onboardingCompletedAt,
      settingsUser: settings?.user
    });

    const needsOnboarding = !isProfileComplete(settings);

    // If profile is incomplete and not already on onboarding page, show onboarding
    if (needsOnboarding && !window.location.pathname.includes('/onboarding')) {
      console.log("[DEBUG] Redirecting to Onboarding. Needs:", needsOnboarding);
      return <CompleteProfile />;
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ScrollToTop />
      <CustomTitleBar />
      <div className="flex-1 overflow-hidden mt-8">
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
            <Route path="gst-reports" element={<GSTReports />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="barcode" element={<BarcodeGenerator />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};

export default App;
