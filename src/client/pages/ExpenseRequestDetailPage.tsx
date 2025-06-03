import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Spinner,
  NonIdealState,
  Intent,
  Tag,
  Callout,
  HTMLTable,
  Dialog,
  Classes,
  FormGroup,
  TextArea,
} from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';
import { ExpenseRequest, ExpenseRequestStatus } from '../../shared/types';
import { formatCurrency, formatDate, formatDateTime } from '../../shared/utils';

const ExpenseRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenseRequest, setExpenseRequest] = useState<ExpenseRequest | null>(null);
  
  // Status update state
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ExpenseRequestStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  // Fetch expense request
  useEffect(() => {
    const fetchExpenseRequest = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/expense-requests/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to fetch expense request');
        }

        const data = await response.json();
        setExpenseRequest(data.data.expenseRequest);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchExpenseRequest();
    }
  }, [id, token]);

  // Get status intent
  const getStatusIntent = (status: string): Intent => {
    switch (status) {
      case ExpenseRequestStatus.DRAFT:
        return Intent.NONE;
      case ExpenseRequestStatus.SUBMITTED:
        return Intent.PRIMARY;
      case ExpenseRequestStatus.APPROVED:
        return Intent.SUCCESS;
      case ExpenseRequestStatus.REJECTED:
        return Intent.DANGER;
      case ExpenseRequestStatus.PAID:
        return Intent.SUCCESS;
      case ExpenseRequestStatus.CANCELLED:
        return Intent.NONE;
      default:
        return Intent.NONE;
    }
  };

  // Format status label
  const formatStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Format category label
  const formatCategoryLabel = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    try {
      setIsUpdatingStatus(true);
      setStatusUpdateError(null);

      const response = await fetch(`/api/expense-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update status');
      }

      const data = await response.json();
      setExpenseRequest(data.data.expenseRequest);
      setIsStatusDialogOpen(false);
      setNewStatus('');
      setStatusNotes('');
    } catch (error: any) {
      setStatusUpdateError(error.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open status dialog
  const openStatusDialog = (status: ExpenseRequestStatus) => {
    setNewStatus(status);
    setStatusNotes('');
    setStatusUpdateError(null);
    setIsStatusDialogOpen(true);
  };

  // Get available status actions based on current status
  const getStatusActions = () => {
    if (!expenseRequest) return [];

    const actions = [];
    const currentStatus = expenseRequest.status;

    if (currentStatus === ExpenseRequestStatus.DRAFT) {
      actions.push({
        status: ExpenseRequestStatus.SUBMITTED,
        label: 'Submit',
        intent: Intent.PRIMARY,
      });
      actions.push({
        status: ExpenseRequestStatus.CANCELLED,
        label: 'Cancel',
        intent: Intent.DANGER,
      });
    } else if (currentStatus === ExpenseRequestStatus.SUBMITTED) {
      if (user?.role === 'admin' || user?.role === 'manager') {
        actions.push({
          status: ExpenseRequestStatus.APPROVED,
          label: 'Approve',
          intent: Intent.SUCCESS,
        });
        actions.push({
          status: ExpenseRequestStatus.REJECTED,
          label: 'Reject',
          intent: Intent.DANGER,
        });
      }
      actions.push({
        status: ExpenseRequestStatus.CANCELLED,
        label: 'Cancel',
        intent: Intent.DANGER,
      });
    } else if (currentStatus === ExpenseRequestStatus.APPROVED) {
      if (user?.role === 'admin' || user?.role === 'accountant') {
        actions.push({
          status: ExpenseRequestStatus.PAID,
          label: 'Mark as Paid',
          intent: Intent.SUCCESS,
        });
      }
      actions.push({
        status: ExpenseRequestStatus.CANCELLED,
        label: 'Cancel',
        intent: Intent.DANGER,
      });
    } else if (currentStatus === ExpenseRequestStatus.REJECTED) {
      actions.push({
        status: ExpenseRequestStatus.DRAFT,
        label: 'Reopen as Draft',
        intent: Intent.PRIMARY,
      });
      actions.push({
        status: ExpenseRequestStatus.CANCELLED,
        label: 'Cancel',
        intent: Intent.DANGER,
      });
    } else if (currentStatus === ExpenseRequestStatus.CANCELLED) {
      actions.push({
        status: ExpenseRequestStatus.DRAFT,
        label: 'Reopen as Draft',
        intent: Intent.PRIMARY,
      });
    }

    return actions;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <Spinner size={50} />
        <p>Loading expense request...</p>
      </div>
    );
  }

  // Render error state
  if (error || !expenseRequest) {
    return (
      <NonIdealState
        icon="error"
        title="Error"
        description={error || 'Expense request not found'}
        action={
          <Button
            text="Go Back"
            onClick={() => navigate('/expense-requests')}
            intent={Intent.PRIMARY}
          />
        }
      />
    );
  }

  return (
    <div className="expense-detail-page">
      <div className="page-header">
        <div className="header-left">
          <Button
            icon="arrow-left"
            text="Back to Expenses"
            minimal
            onClick={() => navigate('/expense-requests')}
          />
          <h1>{expenseRequest.title}</h1>
        </div>
        <div className="header-right">
          <Tag
            intent={getStatusIntent(expenseRequest.status)}
            large
          >
            {formatStatusLabel(expenseRequest.status)}
          </Tag>
        </div>
      </div>

      <div className="expense-detail-content">
        <Card className="expense-info-card">
          <div className="card-header">
            <h3>Expense Details</h3>
            {(expenseRequest.status === ExpenseRequestStatus.DRAFT ||
              expenseRequest.status === ExpenseRequestStatus.REJECTED) && (
              <Button
                icon="edit"
                text="Edit"
                intent={Intent.PRIMARY}
                onClick={() => navigate(`/expense-requests/${id}/edit`)}
              />
            )}
          </div>

          <div className="expense-info-grid">
            <div className="info-item">
              <div className="info-label">Request Number</div>
              <div className="info-value">{expenseRequest.requestNumber}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Status</div>
              <div className="info-value">
                <Tag intent={getStatusIntent(expenseRequest.status)}>
                  {formatStatusLabel(expenseRequest.status)}
                </Tag>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Expense Date</div>
              <div className="info-value">{formatDate(expenseRequest.expenseDate)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Category</div>
              <div className="info-value">
                {formatCategoryLabel(expenseRequest.category)}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Amount</div>
              <div className="info-value amount-value">
                {formatCurrency(expenseRequest.amount, expenseRequest.currency)}
                {expenseRequest.currency !== 'VND' && (
                  <div className="vnd-amount">
                    {formatCurrency(expenseRequest.amountInVND, 'VND')}
                  </div>
                )}
              </div>
            </div>
            {expenseRequest.vendorName && (
              <div className="info-item">
                <div className="info-label">Vendor</div>
                <div className="info-value">{expenseRequest.vendorName}</div>
              </div>
            )}
            {expenseRequest.description && (
              <div className="info-item full-width">
                <div className="info-label">Description</div>
                <div className="info-value">{expenseRequest.description}</div>
              </div>
            )}
            {expenseRequest.notes && (
              <div className="info-item full-width">
                <div className="info-label">Notes</div>
                <div className="info-value">{expenseRequest.notes}</div>
              </div>
            )}
            <div className="info-item">
              <div className="info-label">Created At</div>
              <div className="info-value">{formatDateTime(expenseRequest.createdAt)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Last Updated</div>
              <div className="info-value">{formatDateTime(expenseRequest.updatedAt)}</div>
            </div>
          </div>

          {expenseRequest.attachments && expenseRequest.attachments.length > 0 && (
            <div className="attachments-section">
              <h4>Attachments</h4>
              <div className="attachments-list">
                {expenseRequest.attachments.map((attachment, index) => (
                  <Button
                    key={index}
                    icon="paperclip"
                    text={`Attachment ${index + 1}`}
                    minimal
                    onClick={() => window.open(attachment, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="expense-actions-card">
          <h3>Actions</h3>
          <div className="status-actions">
            {getStatusActions().map((action) => (
              <Button
                key={action.status}
                text={action.label}
                intent={action.intent}
                onClick={() => openStatusDialog(action.status)}
                className="status-action-button"
              />
            ))}
          </div>
        </Card>
      </div>

      <Dialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        title={`Update Status to ${newStatus ? formatStatusLabel(newStatus) : ''}`}
        className="status-dialog"
      >
        <div className={Classes.DIALOG_BODY}>
          {statusUpdateError && (
            <Callout intent={Intent.DANGER} title="Error" className="dialog-error">
              {statusUpdateError}
            </Callout>
          )}
          <p>
            Are you sure you want to change the status from{' '}
            <strong>{formatStatusLabel(expenseRequest.status)}</strong> to{' '}
            <strong>{newStatus ? formatStatusLabel(newStatus) : ''}</strong>?
          </p>
          <FormGroup
            label="Notes (Optional)"
            labelFor="statusNotes"
          >
            <TextArea
              id="statusNotes"
              placeholder="Add notes about this status change..."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              fill
              growVertically
              rows={3}
            />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              text="Cancel"
              onClick={() => setIsStatusDialogOpen(false)}
            />
            <Button
              text="Update Status"
              intent={Intent.PRIMARY}
              onClick={handleStatusUpdate}
              loading={isUpdatingStatus}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ExpenseRequestDetailPage;

