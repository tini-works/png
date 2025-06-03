import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

// JWT middleware
const jwtMiddleware = jwt({
  name: 'jwt',
  secret: config.jwt.secret,
  exp: config.jwt.expiresIn,
});

// Auth routes
export const authRoutes = new Elysia()
  .use(jwtMiddleware)
  .group('/api/auth', (app) =>
    app
      // Login route
      .post(
        '/login',
        async ({ body, jwt, set }) => {
          const { email, password } = body;

          // Find user by email
          const user = await User.findOne({ email });
          if (!user) {
            set.status = 401;
            throw new AppError('Invalid email or password', 401);
          }

          // Check if user is active
          if (!user.isActive) {
            set.status = 401;
            throw new AppError('Your account is inactive', 401);
          }

          // Check password
          const isPasswordValid = await user.comparePassword(password);
          if (!isPasswordValid) {
            set.status = 401;
            throw new AppError('Invalid email or password', 401);
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          // Generate token
          const token = await jwt.sign({
            userId: user._id,
            email: user.email,
            role: user.role,
          });

          // Return user data and token
          return {
            success: true,
            data: {
              user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                companyId: user.companyId,
              },
              token,
            },
          };
        },
        {
          body: t.Object({
            email: t.String({ format: 'email' }),
            password: t.String({ minLength: 8 }),
          }),
        }
      )
      // Register route
      .post(
        '/register',
        async ({ body, jwt, set }) => {
          const { email, password, firstName, lastName, companyId } = body;

          // Check if user already exists
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            set.status = 400;
            throw new AppError('Email already in use', 400);
          }

          // Create new user
          const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            companyId,
            role: 'user', // Default role
            isActive: true,
          });

          // Generate token
          const token = await jwt.sign({
            userId: user._id,
            email: user.email,
            role: user.role,
          });

          // Return user data and token
          return {
            success: true,
            data: {
              user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                companyId: user.companyId,
              },
              token,
            },
          };
        },
        {
          body: t.Object({
            email: t.String({ format: 'email' }),
            password: t.String({ minLength: 8 }),
            firstName: t.String(),
            lastName: t.String(),
            companyId: t.String(),
          }),
        }
      )
  );

