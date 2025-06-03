import { Elysia, t } from 'elysia';
import { Notification, NotificationType } from '../models';
import { isAuthenticated } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// Create notification routes
export const notificationRoutes = new Elysia({ prefix: '/notifications' })
  .use(isAuthenticated)
  // Get all notifications for the current user
  .get('/', async ({ user, query }) => {
    const { page = '1', limit = '10', unreadOnly = 'false' } = query || {};
    
    // Build query
    const queryObj: any = {
      userId: user._id,
    };
    
    // Filter by unread
    if (unreadOnly === 'true') {
      queryObj.isRead = false;
    }
    
    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with pagination
    const [notifications, total] = await Promise.all([
      Notification.find(queryObj)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(queryObj),
    ]);
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      isRead: false,
    });
    
    return {
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  })
  // Mark notification as read
  .patch(
    '/:id/read',
    async ({ params, user }) => {
      const { id } = params;
      
      // Find notification
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw new AppError('Notification not found', 404);
      }
      
      // Check if notification belongs to user
      if (notification.userId.toString() !== user._id.toString()) {
        throw new AppError('Forbidden: This notification does not belong to you', 403);
      }
      
      // Mark as read
      notification.isRead = true;
      await notification.save();
      
      return {
        success: true,
        message: 'Notification marked as read',
        data: notification,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Mark all notifications as read
  .patch('/read-all', async ({ user }) => {
    // Update all unread notifications for the user
    await Notification.updateMany(
      {
        userId: user._id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );
    
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  })
  // Delete notification
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      const { id } = params;
      
      // Find notification
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw new AppError('Notification not found', 404);
      }
      
      // Check if notification belongs to user
      if (notification.userId.toString() !== user._id.toString()) {
        throw new AppError('Forbidden: This notification does not belong to you', 403);
      }
      
      await Notification.findByIdAndDelete(id);
      
      set.status = 204;
      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );

