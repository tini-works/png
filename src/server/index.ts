import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { config } from './config';
import { connectDatabase } from './config/database';
import { routes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { PaymentService } from './services/payments';
import { RoleManagementService } from './services/roleManagement';

// Connect to database
connectDatabase();

// Initialize system roles
const initializeSystemRoles = async () => {
  try {
    await RoleManagementService.initializeSystemRoles();
    console.log('✅ System roles initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing system roles:', error);
  }
};

// Run initialization
initializeSystemRoles();

// Create app
const app = new Elysia()
  // Add middleware
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'Payment Request System API',
        version: '1.0.0',
        description: 'API for Payment Request System for SMEs in Vietnam',
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Companies', description: 'Company management endpoints' },
        { name: 'Payment Requests', description: 'Payment request endpoints' },
        { name: 'Notifications', description: 'Notification endpoints' },
        { name: 'Roles', description: 'Role management endpoints' },
      ],
    },
  }))
  .use(errorHandler)
  // Add routes
  .use(routes)
  // Serve static files
  .get('/*', ({ set }) => {
    set.redirect = '/';
    return 'Redirecting to index';
  })
  // Start server
  .listen(config.app.port);

console.log(
  `🚀 Server running at ${app.server?.hostname}:${app.server?.port}`
);

// Schedule overdue payment check (every day at midnight)
const checkOverduePayments = async () => {
  try {
    const count = await PaymentService.checkOverduePayments();
    console.log(`✅ Checked for overdue payments: ${count} updated`);
  } catch (error) {
    console.error('❌ Error checking overdue payments:', error);
  }
};

// Run immediately on startup
checkOverduePayments();

// Schedule daily check
setInterval(checkOverduePayments, 24 * 60 * 60 * 1000);

export type App = typeof app;
