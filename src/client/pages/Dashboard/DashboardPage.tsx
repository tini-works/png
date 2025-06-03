import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  H2,
  H4,
  Button,
  Intent,
  Spinner,
  NonIdealState,
  Tag,
  Elevation,
} from '@blueprintjs/core';
import { api } from '../../utils/api';
import { PaymentRequestStatus } from '../../../server/models/paymentRequest';
import DashboardStats from '../../components/Dashboard/DashboardStats';
import PaymentStatusChart from '../../components/Dashboard/PaymentStatusChart';
import RecentPaymentsList from '../../components/Dashboard/RecentPaymentsList';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPaymentRequests: 0,
    pendingPayments: 0,
    overduePayments: 0,
    totalPaid: 0,
    totalAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    [PaymentRequestStatus.DRAFT]: 0,
    [PaymentRequestStatus.PENDING]: 0,
    [PaymentRequestStatus.APPROVED]: 0,
    [PaymentRequestStatus.PAID]: 0,
    [PaymentRequestStatus.PARTIALLY_PAID]: 0,
    [PaymentRequestStatus.OVERDUE]: 0,
    [PaymentRequestStatus.CANCELLED]: 0,
    [PaymentRequestStatus.REJECTED]: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, we would have a dedicated endpoint for dashboard data
      // For now, we'll simulate it by fetching payment requests and calculating stats
      
      const response = await api.paymentRequests.getAll();
      const paymentRequests = response.data.paymentRequests;
      
      // Calculate stats
      const totalPaymentRequests = paymentRequests.length;
      const pendingPayments = paymentRequests.filter(
        (pr: any) => pr.status === PaymentRequestStatus.PENDING || pr.status === PaymentRequestStatus.APPROVED
      ).length;
      const overduePayments = paymentRequests.filter(
        (pr: any) => pr.status === PaymentRequestStatus.OVERDUE
      ).length;
      const paidPayments = paymentRequests.filter(
        (pr: any) => pr.status === PaymentRequestStatus.PAID
      ).length;
      
      const totalAmount = paymentRequests.reduce(
        (sum: number, pr: any) => sum + pr.totalAmount,
        0
      );
      const paidAmount = paymentRequests
        .filter((pr: any) => pr.status === PaymentRequestStatus.PAID)
        .reduce((sum: number, pr: any) => sum + pr.totalAmount, 0);
      const overdueAmount = paymentRequests
        .filter((pr: any) => pr.status === PaymentRequestStatus.OVERDUE)
        .reduce((sum: number, pr: any) => sum + pr.totalAmount, 0);
      
      // Calculate status counts
      const counts = {
        [PaymentRequestStatus.DRAFT]: 0,
        [PaymentRequestStatus.PENDING]: 0,
        [PaymentRequestStatus.APPROVED]: 0,
        [PaymentRequestStatus.PAID]: 0,
        [PaymentRequestStatus.PARTIALLY_PAID]: 0,
        [PaymentRequestStatus.OVERDUE]: 0,
        [PaymentRequestStatus.CANCELLED]: 0,
        [PaymentRequestStatus.REJECTED]: 0,
      };
      
      paymentRequests.forEach((pr: any) => {
        counts[pr.status as PaymentRequestStatus]++;
      });
      
      // Get recent payments
      const recent = paymentRequests
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);
      
      setStats({
        totalPaymentRequests,
        pendingPayments,
        overduePayments,
        totalPaid: paidPayments,
        totalAmount,
        paidAmount,
        overdueAmount,
      });
      
      setStatusCounts(counts);
      setRecentPayments(recent);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spinner />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <NonIdealState
        icon="error"
        title="Error Loading Dashboard"
        description={error}
        action={
          <Button
            text="Try Again"
            intent={Intent.PRIMARY}
            onClick={fetchDashboardData}
          />
        }
      />
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <H2>Dashboard</H2>
        <Button
          intent={Intent.PRIMARY}
          icon="add"
          text="New Payment Request"
          component={Link}
          to="/payment-requests/new"
        />
      </div>

      <DashboardStats stats={stats} />

      <div className="dashboard-content">
        <div className="dashboard-charts">
          <Card elevation={Elevation.TWO} className="chart-card">
            <H4>Payment Status Overview</H4>
            <PaymentStatusChart statusCounts={statusCounts} />
          </Card>
        </div>

        <div className="dashboard-recent">
          <Card elevation={Elevation.TWO} className="recent-card">
            <H4>Recent Payment Requests</H4>
            <RecentPaymentsList payments={recentPayments} />
            <Button
              minimal
              text="View All Payment Requests"
              rightIcon="arrow-right"
              component={Link}
              to="/payment-requests"
              className="view-all-button"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

