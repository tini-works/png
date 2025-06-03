import { Elysia, t } from 'elysia';
import { User, UserRole } from '../models/user';
import { isAuthenticated, hasRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcrypt';

// User routes
export const userRoutes = new Elysia().group('/api/users', (app) =>
  app
    // Get all users
    .get(
      '/',
      async ({ query, user }) => {
        const { page = 1, limit = 10, search, role } = query;
        const skip = (page - 1) * limit;

        // Build filter
        const filter: any = {
          companyId: user.companyId,
        };

        // Add role filter
        if (role) {
          filter.role = role;
        }

        // Add search filter
        if (search) {
          filter.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ];
        }

        // Get users
        const users = await User.find(filter)
          .select('-password')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 });

        // Get total count
        const total = await User.countDocuments(filter);

        return {
          success: true,
          data: {
            users,
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
          search: t.Optional(t.String()),
          role: t.Optional(t.String()),
        }),
      }
    )
    // Get user by ID
    .get(
      '/:id',
      async ({ params, user, set }) => {
        // Check if user exists
        const foundUser = await User.findOne({
          _id: params.id,
          companyId: user.companyId,
        }).select('-password');
        if (!foundUser) {
          set.status = 404;
          throw new AppError('User not found', 404);
        }

        return {
          success: true,
          data: { user: foundUser },
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    )
    // Create user
    .post(
      '/',
      async ({ body, user, set }) => {
        // Check if user has permission to create users
        if (!['admin', 'manager'].includes(user.role)) {
          set.status = 403;
          throw new AppError('Forbidden: Insufficient permissions', 403);
        }

        // Check if email is already in use
        const existingUser = await User.findOne({ email: body.email });
        if (existingUser) {
          set.status = 400;
          throw new AppError('Email already in use', 400);
        }

        // Create user
        const newUser = await User.create({
          ...body,
          companyId: user.companyId,
        });

        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return {
          success: true,
          data: { user: userResponse },
        };
      },
      {
        body: t.Object({
          email: t.String({ format: 'email' }),
          password: t.String({ minLength: 8 }),
          firstName: t.String(),
          lastName: t.String(),
          role: t.String(),
          phone: t.Optional(t.String()),
          isActive: t.Optional(t.Boolean()),
        }),
      }
    )
    // Update user
    .put(
      '/:id',
      async ({ params, body, user, set }) => {
        // Check if user exists
        const userToUpdate = await User.findOne({
          _id: params.id,
          companyId: user.companyId,
        });
        if (!userToUpdate) {
          set.status = 404;
          throw new AppError('User not found', 404);
        }

        // Check if user has permission to update users
        if (
          !['admin', 'manager'].includes(user.role) &&
          user._id.toString() !== params.id
        ) {
          set.status = 403;
          throw new AppError('Forbidden: Insufficient permissions', 403);
        }

        // Check if email is being changed and if it's already in use
        if (body.email && body.email !== userToUpdate.email) {
          const existingUser = await User.findOne({ email: body.email });
          if (existingUser && !existingUser._id.equals(userToUpdate._id)) {
            set.status = 400;
            throw new AppError('Email already in use', 400);
          }
        }

        // Hash password if it's being updated
        if (body.password) {
          const salt = await bcrypt.genSalt(10);
          body.password = await bcrypt.hash(body.password, salt);
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
          params.id,
          body,
          { new: true }
        ).select('-password');

        return {
          success: true,
          data: { user: updatedUser },
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          email: t.Optional(t.String({ format: 'email' })),
          password: t.Optional(t.String({ minLength: 8 })),
          firstName: t.Optional(t.String()),
          lastName: t.Optional(t.String()),
          role: t.Optional(t.String()),
          phone: t.Optional(t.String()),
          isActive: t.Optional(t.Boolean()),
        }),
      }
    )
    // Delete user
    .delete(
      '/:id',
      async ({ params, user, set }) => {
        // Check if user has permission to delete users
        if (!['admin', 'manager'].includes(user.role)) {
          set.status = 403;
          throw new AppError('Forbidden: Insufficient permissions', 403);
        }

        // Check if user exists
        const userToDelete = await User.findOne({
          _id: params.id,
          companyId: user.companyId,
        });
        if (!userToDelete) {
          set.status = 404;
          throw new AppError('User not found', 404);
        }

        // Prevent deleting yourself
        if (user._id.toString() === params.id) {
          set.status = 400;
          throw new AppError('Cannot delete your own account', 400);
        }

        // Delete user
        await User.findByIdAndDelete(params.id);

        return {
          success: true,
          data: null,
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    )
    // Get current user
    .get(
      '/me',
      async ({ user }) => {
        // Get user from database
        const currentUser = await User.findById(user._id).select('-password');
        if (!currentUser) {
          throw new AppError('User not found', 404);
        }

        return {
          success: true,
          data: { user: currentUser },
        };
      }
    )
    // Update current user
    .put(
      '/me',
      async ({ body, user }) => {
        // Hash password if it's being updated
        if (body.password) {
          const salt = await bcrypt.genSalt(10);
          body.password = await bcrypt.hash(body.password, salt);
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          body,
          { new: true }
        ).select('-password');

        return {
          success: true,
          data: { user: updatedUser },
        };
      },
      {
        body: t.Object({
          firstName: t.Optional(t.String()),
          lastName: t.Optional(t.String()),
          password: t.Optional(t.String({ minLength: 8 })),
          phone: t.Optional(t.String()),
        }),
      }
    )
    // Change password
    .post(
      '/change-password',
      async ({ body, user, set }) => {
        // Get user from database
        const currentUser = await User.findById(user._id);
        if (!currentUser) {
          set.status = 404;
          throw new AppError('User not found', 404);
        }

        // Check current password
        const isPasswordValid = await currentUser.comparePassword(
          body.currentPassword
        );
        if (!isPasswordValid) {
          set.status = 400;
          throw new AppError('Current password is incorrect', 400);
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(body.newPassword, salt);

        // Update password
        currentUser.password = hashedPassword;
        await currentUser.save();

        return {
          success: true,
          data: null,
        };
      },
      {
        body: t.Object({
          currentPassword: t.String(),
          newPassword: t.String({ minLength: 8 }),
        }),
      }
    )
);

