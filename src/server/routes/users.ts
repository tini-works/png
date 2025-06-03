import { Elysia, t } from 'elysia';
import { User, UserRole } from '../models';
import { isAuthenticated, hasRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// Create user routes
export const userRoutes = new Elysia({ prefix: '/users' })
  .use(isAuthenticated)
  // Get all users (filtered by company for non-admins)
  .get('/', async ({ user, query }) => {
    const { page = '1', limit = '10', search } = query || {};
    
    // Build query
    const queryObj: any = {};
    
    // Filter by company (admin can see all)
    if (user.role !== UserRole.ADMIN) {
      queryObj.companyId = user.companyId;
    }
    
    // Search by name or email
    if (search) {
      queryObj.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with pagination
    const [users, total] = await Promise.all([
      User.find(queryObj)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(queryObj),
    ]);
    
    return {
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  })
  // Get user by ID
  .get(
    '/:id',
    async ({ params, user }) => {
      const { id } = params;
      
      // Find user
      const foundUser = await User.findById(id).select('-password');
      
      if (!foundUser) {
        throw new AppError('User not found', 404);
      }
      
      // Check if user has access to this user
      if (
        user.role !== UserRole.ADMIN &&
        foundUser.companyId.toString() !== user.companyId.toString() &&
        foundUser._id.toString() !== user._id.toString()
      ) {
        throw new AppError('Forbidden: You do not have access to this user', 403);
      }
      
      return {
        success: true,
        data: foundUser,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Create a new user
  .post(
    '/',
    async ({ body, user, set }) => {
      // Check permissions
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        throw new AppError('Forbidden: Admin or Manager access required', 403);
      }
      
      // Non-admin users can only create users in their own company
      if (user.role !== UserRole.ADMIN && body.companyId !== user.companyId.toString()) {
        throw new AppError('Forbidden: You can only create users in your own company', 403);
      }
      
      // Non-admin users cannot create admin users
      if (user.role !== UserRole.ADMIN && body.role === UserRole.ADMIN) {
        throw new AppError('Forbidden: You cannot create admin users', 403);
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: body.email });
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }
      
      // Create new user
      const newUser = new User(body);
      await newUser.save();
      
      // Return user without password
      const userWithoutPassword = newUser.toObject();
      delete userWithoutPassword.password;
      
      set.status = 201;
      return {
        success: true,
        message: 'User created successfully',
        data: userWithoutPassword,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        firstName: t.String(),
        lastName: t.String(),
        role: t.Enum(UserRole),
        companyId: t.String(),
        phone: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  // Update user
  .put(
    '/:id',
    async ({ params, body, user }) => {
      const { id } = params;
      
      // Find user
      const userToUpdate = await User.findById(id);
      
      if (!userToUpdate) {
        throw new AppError('User not found', 404);
      }
      
      // Check permissions
      const isSelfUpdate = user._id.toString() === id;
      const isAdminOrManager = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
      const isSameCompany = userToUpdate.companyId.toString() === user.companyId.toString();
      
      if (!isSelfUpdate && (!isAdminOrManager || (user.role !== UserRole.ADMIN && !isSameCompany))) {
        throw new AppError('Forbidden: You do not have permission to update this user', 403);
      }
      
      // Non-admin users cannot change role to admin
      if (user.role !== UserRole.ADMIN && body.role === UserRole.ADMIN) {
        throw new AppError('Forbidden: You cannot assign admin role', 403);
      }
      
      // Non-admin users cannot change company
      if (user.role !== UserRole.ADMIN && body.companyId && body.companyId !== user.companyId.toString()) {
        throw new AppError('Forbidden: You cannot change company', 403);
      }
      
      // If email is being changed, check if it's unique
      if (body.email && body.email !== userToUpdate.email) {
        const existingUser = await User.findOne({ email: body.email });
        if (existingUser) {
          throw new AppError('User with this email already exists', 400);
        }
      }
      
      // Update user
      // Remove password from body if it's empty
      if (body.password === '') {
        delete body.password;
      }
      
      Object.assign(userToUpdate, body);
      await userToUpdate.save();
      
      // Return user without password
      const userWithoutPassword = userToUpdate.toObject();
      delete userWithoutPassword.password;
      
      return {
        success: true,
        message: 'User updated successfully',
        data: userWithoutPassword,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        email: t.Optional(t.String({ format: 'email' })),
        password: t.Optional(t.String()),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        role: t.Optional(t.Enum(UserRole)),
        companyId: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  // Delete user
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      const { id } = params;
      
      // Prevent self-deletion
      if (user._id.toString() === id) {
        throw new AppError('You cannot delete your own account', 400);
      }
      
      // Find user
      const userToDelete = await User.findById(id);
      
      if (!userToDelete) {
        throw new AppError('User not found', 404);
      }
      
      // Check permissions
      if (
        user.role !== UserRole.ADMIN &&
        (user.role !== UserRole.MANAGER || userToDelete.companyId.toString() !== user.companyId.toString())
      ) {
        throw new AppError('Forbidden: You do not have permission to delete this user', 403);
      }
      
      // Non-admin users cannot delete admin users
      if (user.role !== UserRole.ADMIN && userToDelete.role === UserRole.ADMIN) {
        throw new AppError('Forbidden: You cannot delete admin users', 403);
      }
      
      await User.findByIdAndDelete(id);
      
      set.status = 204;
      return {
        success: true,
        message: 'User deleted successfully',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );

