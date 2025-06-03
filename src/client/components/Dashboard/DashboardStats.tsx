import React from 'react';
import { Card, H3, Elevation } from '@blueprintjs/core';

interface DashboardStatsProps {
  stats: {
    totalPaymentRequests: number;
    pendingPayments: number;
    overduePayments: number;
    totalPaid: number;
    totalAmount: number;
    paidAmount: number;
    overdueAmount: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate collection rate
  const collectionRate = stats.totalAmount > 0
    ? Math.round((stats.paidAmount / stats.totalAmount) * 100)
    : 0;

  return (
    <div className="dashboard-stats">
      <Card elevation={Elevation.TWO} className="stat-card">
        <div className="stat-icon">
          <span className="bp4-icon-standard bp4-icon-document"></span>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalPaymentRequests}</div>
          <div className="stat-label">Total Requests</div>
        </div>
      </Card>

      <Card elevation={Elevation.TWO} className="stat-card">
        <div className="stat-icon">
          <span className="bp4-icon-standard bp4-icon-time"></span>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.pendingPayments}</div>
          <div className="stat-label">Pending Payments</div>
        </div>
      </Card>

      <Card elevation={Elevation.TWO} className="stat-card">
        <div className="stat-icon warning">
          <span className="bp4-icon-standard bp4-icon-warning-sign"></span>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.overduePayments}</div>
          <div className="stat-label">Overdue Payments</div>
        </div>
      </Card>

      <Card elevation={Elevation.TWO} className="stat-card">
        <div className="stat-icon success">
          <span className="bp4-icon-standard bp4-icon-endorsed"></span>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalPaid}</div>
          <div className="stat-label">Paid Requests</div>
        </div>
      </Card>

      <Card elevation={Elevation.TWO} className="stat-card">
        <div className="stat-icon">
          <span className="bp4-icon-standard bp4-icon-bank-account"></span>
        </div>
        <div className="stat-content">
          <div className="stat-value">{formatCurrency(stats.totalAmount)}</div>
          <div className="stat-label">Total Amount</div>
        </div>
      </Card>

      <Card elevation={Elevation.TWO} className="stat-card">
        <div className="stat-icon success">
          <span className="bp4-icon-standard bp4-icon-tick-circle"></span>
        </div>
        <div className="stat-content">
          <div className="stat-value">{formatCurrency(stats.paidAmount)}</div>
          <div className="stat-label">Paid Amount</div>
        </div>
      </Card>

      <Card elevation={Elevation.TWO} className="stat-card">
        <div className="stat-icon warning">
          <span className="bp4-icon-standard bp4-icon-error"></span>
        </div>
        <div className="stat-content">
          <div className="stat-value">{formatCurrency(stats.overdueAmount)}</div>
          <div className="stat-label">Overdue Amount</div>
        </div>
      </Card>

      <Card elevation={Elevation.TWO} className="stat-card">
        <div className="stat-icon">
          <span className="bp4-icon-standard bp4-icon-percentage"></span>
        </div>
        <div className="stat-content">
          <div className="stat-value">{collectionRate}%</div>
          <div className="stat-label">Collection Rate</div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;

