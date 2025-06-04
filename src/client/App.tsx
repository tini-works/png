import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FocusStyleManager } from '@blueprintjs/core';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PaymentRequestsPage from './pages/PaymentRequestsPage';
import PaymentRequestDetailPage from './pages/PaymentRequestDetailPage';
import CreatePaymentRequestPage from './pages/CreatePaymentRequestPage';
import ExpenseRequestsPage from './pages/ExpenseRequestsPage';
import ExpenseRequestDetailPage from './pages/ExpenseRequestDetailPage';
import CreateExpenseRequestPage from './pages/CreateExpenseRequestPage';
import UsersPage from './pages/UsersPage';
import UserProfilePage from './pages/UserProfilePage';
import CreateUserPage from './pages/CreateUserPage';
import SettingsPage from './pages/SettingsPage';
import RoleManagementPage from './pages/RoleManagement/RoleManagementPage';
import NotFoundPage from './pages/NotFoundPage';

// Disable focus outline for mouse users
FocusStyleManager.onlyShowFocusOnTabs();

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Main routes */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/payment-requests" element={<PaymentRequestsPage />} />
            <Route
              path="/payment-requests/create"
              element={<CreatePaymentRequestPage />}
            />
            <Route
              path="/payment-requests/:id"
              element={<PaymentRequestDetailPage />}
            />
            <Route path="/expense-requests" element={<ExpenseRequestsPage />} />
            <Route
              path="/expense-requests/create"
              element={<CreateExpenseRequestPage />}
            />
            <Route
              path="/expense-requests/:id"
              element={<ExpenseRequestDetailPage />}
            />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/create" element={<CreateUserPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* New route for role management */}
            <Route path="/roles" element={<RoleManagementPage />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
