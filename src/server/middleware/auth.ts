import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { config } from '../config';
import { User, UserRole } from '../models';
import { AppError } from './errorHandler';

// JWT middleware
const jwtMiddleware = jwt({
  name: 'jwt',
  secret: config.jwt.secret,
  exp: config.jwt.expiresIn,
});

// Authentication middleware
export const isAuthenticated = new Elysia()
  .use(jwtMiddleware)
  .derive(async ({ headers, jwt, set }) => {
    // Get token from Authorization header
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      throw new AppError('Unauthorized: No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      throw new AppError('Unauthorized: Invalid token', 401);
    }

    // Get user from database
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      set.status = 401;
      throw new AppError('Unauthorized: User not found', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      set.status = 401;
      throw new AppError('Unauthorized: User is inactive', 401);
    }

    // Return user
    return { user };
  });

// Role-based access control middleware
export const hasRole = (roles: UserRole[]) =>
  new Elysia().derive(({ user, set }) => {
    if (!roles.includes(user.role as UserRole)) {
      set.status = 403;
      throw new AppError('Forbidden: Insufficient permissions', 403);
    }
  });

