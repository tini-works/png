import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Card } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-logo">
          <h2>Payment Request System</h2>
          <p>For SMEs in Vietnam</p>
        </div>
        <Card className="auth-card">
          <Outlet />
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;

