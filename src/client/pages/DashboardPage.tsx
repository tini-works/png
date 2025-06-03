import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Button,
  Spinner,
  NonIdealState,
  Icon,
  Intent,
  HTMLTable,
} from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

interface PaymentRequestStatistics {
  totalCount: number;
  totalAmount: number;
  statusCounts: Record<string, number>;
  statusAmounts: Record<string, number>;
  overdueCount: number;
}

interface PaymentRequest {
  _id: string;
  requestNumber: string;
  client: {
    name: string;
  };
  totalAmount: number;
  currency: string;
  dueDate: string;
  status: string;
}

const DashboardPage: React.FC = () => {
  const [statistics, setStatistics] = useState<PaymentRequestStatistics | null>(
    null
  );
  const [recentPayments, setRecentPayments] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch statistics
        const statsResponse = await fetch('/api/payment-requests/statistics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!statsResponse.ok) {
          const statsData = await statsResponse.json();
          throw new Error(
            statsData.error?.message || 'Failed to fetch statistics'
          );
        }

        const statsData = await statsResponse.json();
        setStatistics(statsData.data.statistics);

        // Fetch recent payment requests
        const paymentsResponse = await fetch(
          '/api/payment-requests?limit=5&sortBy=createdAt&sortOrder=desc',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          throw new Error(
            paymentsData.error?.message ||
              'Failed to fetch recent payment requests'
          );
        }

        const paymentsData = await paymentsResponse.json();
        setRecentPayments(paymentsData.data.paymentRequests);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Get status intent
  const getStatusIntent = (status: string): Intent => {
    switch (status) {
      case 'paid':
        return Intent.SUCCESS;
      case 'approved':
        return Intent.PRIMARY;
      case 'pending':
        return Intent.WARNING;
      case 'overdue':
        return Intent.DANGER;
      case 'cancelled':
        return Intent.NONE;
      case 'rejected':
        return Intent.DANGER;
      default:
        return Intent.NONE;
    }
  };

  // Get status label
  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <Spinner size={50} />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <NonIdealState
        icon="error"
        title="Error"
        description={error}
        action={
          <Button
            text="Try again"
            onClick={() => window.location.reload()}
            intent={Intent.PRIMARY}
          />
        }
      />
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
        <Button
          intent={Intent.PRIMARY}
          icon="add"
          text="New Payment Request"
          component={Link}
          to="/payment-requests/create"
        />
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <Card className="stat-card">
          <div className="stat-icon">
            <Icon icon="document" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics?.totalCount || 0}</div>
            <div className="stat-label">Total Payment Requests</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon success">
            <Icon icon="tick-circle" />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {statistics?.statusCounts?.paid || 0}
            </div>
            <div className="stat-label">Paid Requests</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon warning">
            <Icon icon="time" />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {statistics?.statusCounts?.pending || 0}
            </div>
            <div className="stat-label">Pending Requests</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon warning">
            <Icon icon="warning-sign" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics?.overdueCount || 0}</div>
            <div className="stat-label">Overdue Requests</div>
          </div>
        </Card>
      </div>

      {/* Dashboard content */}
      <div className="dashboard-content">
        {/* Payment Status Chart */}
        <Card className="chart-card">
          <h4>Payment Status</h4>
          <div className="payment-status-chart">
            <div className="chart-bars">
              {statistics &&
                Object.entries(statistics.statusCounts).map(
                  ([status, count]) =>
                    count > 0 && (
                      <div className="chart-bar-container" key={status}>
                        <div className="chart-bar-label">
                          {getStatusLabel(status)}
                        </div>
                        <div className="chart-bar-wrapper">
                          <div
                            className="chart-bar"
                            style={{
                              width: `${
                                (count / statistics.totalCount) * 100
                              }%`,
                              backgroundColor: `var(--${getStatusIntent(
                                status
                              )})`,
                            }}
                          ></div>
                          <span className="chart-bar-value">{count}</span>
                        </div>
                      </div>
                    )
                )}
            </div>

            <div className="chart-legend">
              {statistics &&
                Object.entries(statistics.statusCounts).map(
                  ([status, count]) =>
                    count > 0 && (
                      <div className="legend-item" key={status}>
                        <div
                          className="legend-color"
                          style={{
                            backgroundColor: `var(--${getStatusIntent(
                              status
                            )})`,
                          }}
                        ></div>
                        <div className="legend-label">
                          {getStatusLabel(status)}
                        </div>
                      </div>
                    )
                )}
            </div>
          </div>
        </Card>

        {/* Recent Payment Requests */}
        <Card className="recent-card">
          <h4>Recent Payment Requests</h4>
          <div className="recent-payments-list">
            {recentPayments.length === 0 ? (
              <div className="no-data">No payment requests yet</div>
            ) : (
              <HTMLTable striped>
                <thead>
                  <tr>
                    <th>Request #</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment._id}>
                      <td>
                        <Link to={`/payment-requests/${payment._id}`}>
                          {payment.requestNumber}
                        </Link>
                      </td>
                      <td>{payment.client.name}</td>
                      <td>
                        {formatCurrency(payment.totalAmount, payment.currency)}
                      </td>
                      <td>{formatDate(payment.dueDate)}</td>
                      <td>
                        <Button
                          small
                          minimal
                          intent={getStatusIntent(payment.status)}
                          text={getStatusLabel(payment.status)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </HTMLTable>
            )}
          </div>
          <Button
            className="view-all-button"
            minimal
            text="View all payment requests"
            rightIcon="arrow-right"
            component={Link}
            to="/payment-requests"
          />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

