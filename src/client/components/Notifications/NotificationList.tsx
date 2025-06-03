import React, { useEffect } from 'react';
import { Menu, MenuItem, Button, NonIdealState, Spinner } from '@blueprintjs/core';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationList: React.FC = () => {
  const { notifications, unreadCount, loading, fetchNotifications, markAllAsRead } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  if (loading) {
    return (
      <div className="notification-list-container">
        <div className="notification-list-header">
          <h4>Notifications</h4>
        </div>
        <div className="notification-list-loading">
          <Spinner size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="notification-list-container">
      <div className="notification-list-header">
        <h4>Notifications</h4>
        {unreadCount > 0 && (
          <Button
            small
            minimal
            text="Mark all as read"
            onClick={handleMarkAllAsRead}
          />
        )}
      </div>
      
      <Menu className="notification-list">
        {notifications.length === 0 ? (
          <NonIdealState
            icon="notifications"
            title="No notifications"
            description="You don't have any notifications yet."
          />
        ) : (
          notifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} />
          ))
        )}
      </Menu>
      
      <div className="notification-list-footer">
        <Button
          small
          minimal
          text="View all notifications"
          onClick={() => {
            // This would navigate to a full notifications page
            // For now, just refresh the list
            fetchNotifications();
          }}
        />
      </div>
    </div>
  );
};

export default NotificationList;

