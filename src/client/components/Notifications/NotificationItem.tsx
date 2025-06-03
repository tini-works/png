import React from 'react';
import { MenuItem, Icon, Tag, Tooltip, Button } from '@blueprintjs/core';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationType } from '../../../server/models/notification';

// Helper function to get icon based on notification type
const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.PAYMENT_REQUEST_CREATED:
      return 'document';
    case NotificationType.PAYMENT_REQUEST_UPDATED:
      return 'edit';
    case NotificationType.PAYMENT_RECEIVED:
      return 'endorsed';
    case NotificationType.PAYMENT_OVERDUE:
      return 'warning-sign';
    case NotificationType.PAYMENT_REMINDER:
      return 'time';
    case NotificationType.SYSTEM:
      return 'info-sign';
    default:
      return 'notifications';
  }
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

interface NotificationItemProps {
  notification: {
    _id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedTo?: {
      model: string;
      documentId: string;
    };
  };
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to related item if available
    if (notification.relatedTo) {
      const { model, documentId } = notification.relatedTo;
      
      switch (model) {
        case 'PaymentRequest':
          window.location.href = `/payment-requests/${documentId}`;
          break;
        case 'User':
          window.location.href = `/users/${documentId}`;
          break;
        case 'Company':
          window.location.href = `/settings`;
          break;
        default:
          break;
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification._id);
  };

  return (
    <MenuItem
      icon={<Icon icon={getNotificationIcon(notification.type)} />}
      text={
        <div className="notification-content">
          <div className="notification-header">
            <span className="notification-title">{notification.title}</span>
            {!notification.isRead && (
              <Tag minimal intent="primary" round className="unread-tag" />
            )}
          </div>
          <p className="notification-message">{notification.message}</p>
          <div className="notification-footer">
            <span className="notification-time">
              {formatDate(notification.createdAt)}
            </span>
            <Tooltip content="Delete">
              <Button
                icon="cross"
                minimal
                small
                onClick={handleDelete}
                className="delete-button"
              />
            </Tooltip>
          </div>
        </div>
      }
      onClick={handleClick}
      className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
    />
  );
};

export default NotificationItem;

