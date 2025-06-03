import React from 'react';
import { PaymentRequestStatus } from '../../../server/models/paymentRequest';

interface PaymentStatusChartProps {
  statusCounts: Record<PaymentRequestStatus, number>;
}

const PaymentStatusChart: React.FC<PaymentStatusChartProps> = ({ statusCounts }) => {
  // In a real application, we would use a charting library like Chart.js or Recharts
  // For this example, we'll create a simple visual representation

  // Define colors for each status
  const statusColors: Record<PaymentRequestStatus, string> = {
    [PaymentRequestStatus.DRAFT]: '#8a9ba8',
    [PaymentRequestStatus.PENDING]: '#d9822b',
    [PaymentRequestStatus.APPROVED]: '#669eff',
    [PaymentRequestStatus.PAID]: '#0f9960',
    [PaymentRequestStatus.PARTIALLY_PAID]: '#87d068',
    [PaymentRequestStatus.OVERDUE]: '#db3737',
    [PaymentRequestStatus.CANCELLED]: '#5c7080',
    [PaymentRequestStatus.REJECTED]: '#a82a2a',
  };

  // Get total count
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  // Calculate percentages
  const percentages: Record<PaymentRequestStatus, number> = {} as Record<PaymentRequestStatus, number>;
  Object.entries(statusCounts).forEach(([status, count]) => {
    percentages[status as PaymentRequestStatus] = total > 0 ? Math.round((count / total) * 100) : 0;
  });

  // Get status labels
  const statusLabels: Record<PaymentRequestStatus, string> = {
    [PaymentRequestStatus.DRAFT]: 'Draft',
    [PaymentRequestStatus.PENDING]: 'Pending',
    [PaymentRequestStatus.APPROVED]: 'Approved',
    [PaymentRequestStatus.PAID]: 'Paid',
    [PaymentRequestStatus.PARTIALLY_PAID]: 'Partially Paid',
    [PaymentRequestStatus.OVERDUE]: 'Overdue',
    [PaymentRequestStatus.CANCELLED]: 'Cancelled',
    [PaymentRequestStatus.REJECTED]: 'Rejected',
  };

  return (
    <div className="payment-status-chart">
      {total === 0 ? (
        <div className="no-data">No payment requests yet</div>
      ) : (
        <>
          <div className="chart-bars">
            {Object.entries(statusCounts).map(([status, count]) => {
              const typedStatus = status as PaymentRequestStatus;
              const percentage = percentages[typedStatus];
              
              if (percentage === 0) return null;
              
              return (
                <div
                  key={status}
                  className="chart-bar-container"
                  title={`${statusLabels[typedStatus]}: ${count} (${percentage}%)`}
                >
                  <div className="chart-bar-label">
                    {statusLabels[typedStatus]}
                  </div>
                  <div className="chart-bar-wrapper">
                    <div
                      className="chart-bar"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: statusColors[typedStatus],
                      }}
                    ></div>
                    <div className="chart-bar-value">
                      {count} ({percentage}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="chart-legend">
            {Object.entries(statusCounts).map(([status, count]) => {
              const typedStatus = status as PaymentRequestStatus;
              if (count === 0) return null;
              
              return (
                <div key={status} className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: statusColors[typedStatus] }}
                  ></div>
                  <div className="legend-label">
                    {statusLabels[typedStatus]}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentStatusChart;

