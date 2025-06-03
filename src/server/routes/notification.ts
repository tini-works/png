import { Elysia, t } from 'elysia';
import { Notification } from '../models/notification';
import { isAuthenticated } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { NotificationService } from '../services/notifications';
import mongoose from 'mongoose';

// Notification routes
export const notificationRoutes = new Elysia().group(
  '/api/notifications',
  (app) =>
    app
      // Get all notifications
      .get(
        '/',
        async ({ query, user }) => {
          const { page = 1, limit = 10, unreadOnly = false } = query;
          const skip = (page - 1) * limit;

          // Build filter
          const filter: any = {
            userId: user._id,
          };

          // Add unread filter
          if (unreadOnly) {
            filter.isRead = false;
          }

          // Get notifications
          const notifications = await Notification.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

          // Get total count
          const total = await Notification.countDocuments(filter);

          // Get unread count
          const unreadCount = await NotificationService.getUnreadCount(user._id);

          return {
            success: true,
            data: {
              notifications,
              unreadCount,
              pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
              },
            },
          };
        },
        {
          query: t.Object({
            page: t.Optional(t.Numeric()),
            limit: t.Optional(t.Numeric()),
            unreadOnly: t.Optional(t.Boolean()),
          }),
        }
      )
      // Mark notification as read
      .patch(
        '/:id/read',
        async ({ params, user, set }) => {
          // Mark notification as read
          const notification = await NotificationService.markAsRead(
            new mongoose.Types.ObjectId(params.id),
            user._id
          );
          if (!notification) {
            set.status = 404;
            throw new AppError('Notification not found', 404);
          }

          // Get unread count
          const unreadCount = await NotificationService.getUnreadCount(user._id);

          return {
            success: true,
            data: { notification, unreadCount },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      // Mark all notifications as read
      .patch(
        '/read-all',
        async ({ user }) => {
          // Mark all notifications as read
          await NotificationService.markAllAsRead(user._id);

          return {
            success: true,
            data: { unreadCount: 0 },
          };
        }
      )
      // Delete notification
      .delete(
        '/:id',
        async ({ params, user, set }) => {
          // Delete notification
          const success = await NotificationService.deleteNotification(
            new mongoose.Types.ObjectId(params.id),
            user._id
          );
          if (!success) {
            set.status = 404;
            throw new AppError('Notification not found', 404);
          }

          // Get unread count
          const unreadCount = await NotificationService.getUnreadCount(user._id);

          return {
            success: true,
            data: { unreadCount },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      // Get unread count
      .get(
        '/unread-count',
        async ({ user }) => {
          // Get unread count
          const unreadCount = await NotificationService.getUnreadCount(user._id);

          return {
            success: true,
            data: { unreadCount },
          };
        }
      )
);

