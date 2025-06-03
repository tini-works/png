import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

// Types
interface Notification {
  _id: string;
  userId: string;
  companyId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedTo?: {
    model: string;
    documentId: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  // Fetch notifications on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Fetch notifications
  const fetchNotifications = async (unreadOnly = false) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/notifications?unreadOnly=${unreadOnly}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch notifications');
      }

      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to mark notification as read'
        );
      }

      // Update notifications
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(data.data.unreadCount);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to mark all notifications as read'
        );
      }

      // Update notifications
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to delete notification'
        );
      }

      // Update notifications
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== id)
      );
      setUnreadCount(data.data.unreadCount);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook for using notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

