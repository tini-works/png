import { Elysia } from 'elysia';
import { authRoutes } from './auth';
import { companyRoutes } from './company';
import { paymentRequestRoutes } from './paymentRequest';
import { userRoutes } from './user';
import { notificationRoutes } from './notification';

// Combine all routes
export const routes = new Elysia()
  .use(authRoutes)
  .use(companyRoutes)
  .use(paymentRequestRoutes)
  .use(userRoutes)
  .use(notificationRoutes);

