import React from 'react';
import { Button, Tag } from '@blueprintjs/core';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

interface NotificationItemProps {
  notification: {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    relatedTo?: {
      model: string;
      documentId: string;
    };
    createdAt: string;
  };
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle click
  const handleClick = () => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to related document if available
    if (notification.relatedTo) {
      const { model, documentId } = notification.relatedTo;
      switch (model) {
        case 'PaymentRequest':
          navigate(`/payment-requests/${documentId}`);
          break;
        case 'User':
          navigate(`/users/${documentId}`);
          break;
        case 'Company':
          navigate('/settings');
          break;
        default:
          break;
      }
    }

    // Close popover
    document.body.click();
  };

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification._id);
  };

  return (
    <div
      className={`notification-item ${notification.isRead ? '' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-title">{notification.title}</span>
          {!notification.isRead && <Tag className="unread-tag" minimal />}
        </div>
        <p className="notification-message">{notification.message}</p>
        <div className="notification-footer">
          <span className="notification-time">
            {formatDate(notification.createdAt)}
          </span>
          <Button
            icon="cross"
            minimal
            small
            className="delete-button"
            onClick={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;

