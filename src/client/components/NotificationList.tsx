import React, { useEffect } from 'react';
import { Button, Spinner, NonIdealState } from '@blueprintjs/core';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationList: React.FC = () => {
  const {
    notifications,
    isLoading,
    error,
    fetchNotifications,
    markAllAsRead,
  } = useNotifications();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Handle view all
  const handleViewAll = () => {
    // This would typically navigate to a notifications page
    // For now, we'll just close the popover
    document.body.click();
  };

  return (
    <div className="notification-list-container">
      <div className="notification-list-header">
        <h4>Notifications</h4>
        <Button
          small
          minimal
          text="Mark all as read"
          onClick={handleMarkAllAsRead}
          disabled={isLoading}
        />
      </div>

      <div className="notification-list">
        {isLoading ? (
          <div className="notification-list-loading">
            <Spinner size={20} />
          </div>
        ) : error ? (
          <NonIdealState
            icon="error"
            title="Error"
            description={error}
            action={
              <Button
                text="Try again"
                onClick={() => fetchNotifications()}
                small
              />
            }
          />
        ) : notifications.length === 0 ? (
          <NonIdealState
            icon="notifications"
            title="No notifications"
            description="You don't have any notifications yet."
          />
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
            />
          ))
        )}
      </div>

      <div className="notification-list-footer">
        <Button
          small
          minimal
          text="View all notifications"
          onClick={handleViewAll}
        />
      </div>
    </div>
  );
};

export default NotificationList;

