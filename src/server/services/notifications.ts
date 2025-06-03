import { Notification, NotificationType, INotification } from '../models/notification';
import { User, UserRole } from '../models/user';
import mongoose from 'mongoose';

// Notification service
export class NotificationService {
  // Create a notification
  static async createNotification(
    data: Omit<INotification, 'isRead' | 'createdAt' | 'updatedAt'>
  ): Promise<INotification> {
    return await Notification.create({
      ...data,
      isRead: false,
    });
  }

  // Create a notification for all users in a company
  static async notifyCompanyUsers(
    companyId: mongoose.Types.ObjectId,
    type: NotificationType,
    title: string,
    message: string,
    relatedTo?: {
      model: string;
      documentId: mongoose.Types.ObjectId;
    },
    excludeUserId?: mongoose.Types.ObjectId
  ): Promise<INotification[]> {
    // Find all active users in the company
    const users = await User.find({
      companyId,
      isActive: true,
      ...(excludeUserId && { _id: { $ne: excludeUserId } }),
    });

    // Create notifications for each user
    const notifications = await Promise.all(
      users.map((user) =>
        this.createNotification({
          userId: user._id,
          companyId,
          type,
          title,
          message,
          relatedTo,
        })
      )
    );

    return notifications;
  }

  // Create a notification for users with specific roles
  static async notifyRoleUsers(
    companyId: mongoose.Types.ObjectId,
    roles: UserRole[],
    type: NotificationType,
    title: string,
    message: string,
    relatedTo?: {
      model: string;
      documentId: mongoose.Types.ObjectId;
    },
    excludeUserId?: mongoose.Types.ObjectId
  ): Promise<INotification[]> {
    // Find all active users in the company with the specified roles
    const users = await User.find({
      companyId,
      role: { $in: roles },
      isActive: true,
      ...(excludeUserId && { _id: { $ne: excludeUserId } }),
    });

    // Create notifications for each user
    const notifications = await Promise.all(
      users.map((user) =>
        this.createNotification({
          userId: user._id,
          companyId,
          type,
          title,
          message,
          relatedTo,
        })
      )
    );

    return notifications;
  }

  // Mark a notification as read
  static async markAsRead(
    notificationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<INotification | null> {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(
    userId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount > 0;
  }

  // Delete a notification
  static async deleteNotification(
    notificationId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId,
    });
    return result.deletedCount > 0;
  }

  // Get unread notifications count for a user
  static async getUnreadCount(
    userId: mongoose.Types.ObjectId
  ): Promise<number> {
    return await Notification.countDocuments({
      userId,
      isRead: false,
    });
  }
}

