import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Intent } from '@blueprintjs/core';
import { PaymentRequestStatus } from '../../../server/models/paymentRequest';

interface Payment {
  _id: string;
  requestNumber: string;
  client: {
    name: string;
  };
  totalAmount: number;
  status: PaymentRequestStatus;
  dueDate: string;
  createdAt: string;
}

interface RecentPaymentsListProps {
  payments: Payment[];
}

const RecentPaymentsList: React.FC<RecentPaymentsListProps> = ({ payments }) => {
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Get status tag intent
  const getStatusIntent = (status: PaymentRequestStatus): Intent => {
    switch (status) {
      case PaymentRequestStatus.DRAFT:
        return Intent.NONE;
      case PaymentRequestStatus.PENDING:
        return Intent.WARNING;
      case PaymentRequestStatus.APPROVED:
        return Intent.PRIMARY;
      case PaymentRequestStatus.PAID:
        return Intent.SUCCESS;
      case PaymentRequestStatus.PARTIALLY_PAID:
        return Intent.SUCCESS;
      case PaymentRequestStatus.OVERDUE:
        return Intent.DANGER;
      case PaymentRequestStatus.CANCELLED:
        return Intent.NONE;
      case PaymentRequestStatus.REJECTED:
        return Intent.DANGER;
      default:
        return Intent.NONE;
    }
  };

  // Get status label
  const getStatusLabel = (status: PaymentRequestStatus): string => {
    switch (status) {
      case PaymentRequestStatus.DRAFT:
        return 'Draft';
      case PaymentRequestStatus.PENDING:
        return 'Pending';
      case PaymentRequestStatus.APPROVED:
        return 'Approved';
      case PaymentRequestStatus.PAID:
        return 'Paid';
      case PaymentRequestStatus.PARTIALLY_PAID:
        return 'Partially Paid';
      case PaymentRequestStatus.OVERDUE:
        return 'Overdue';
      case PaymentRequestStatus.CANCELLED:
        return 'Cancelled';
      case PaymentRequestStatus.REJECTED:
        return 'Rejected';
      default:
        return status;
    }
  };

  if (payments.length === 0) {
    return <div className="no-data">No payment requests yet</div>;
  }

  return (
    <div className="recent-payments-list">
      <table className="bp4-html-table bp4-html-table-striped bp4-interactive">
        <thead>
          <tr>
            <th>Request #</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment._id}>
              <td>
                <Link to={`/payment-requests/${payment._id}`}>
                  {payment.requestNumber}
                </Link>
              </td>
              <td>{payment.client.name}</td>
              <td>{formatCurrency(payment.totalAmount)}</td>
              <td>
                <Tag
                  intent={getStatusIntent(payment.status)}
                  minimal
                >
                  {getStatusLabel(payment.status)}
                </Tag>
              </td>
              <td>{formatDate(payment.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentPaymentsList;

