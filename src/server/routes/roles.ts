import { Elysia, t } from 'elysia';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { RoleManagementService } from '../services/roleManagement';
import { SystemPermissions } from '../models/permission';
import { AppError } from '../middleware/errorHandler';

// Role routes
export const roleRoutes = new Elysia({ prefix: '/api/v1/roles' })
  // Apply authentication middleware to all routes
  .use(isAuthenticated)

  // Get all roles
  .get(
    '/',
    async ({ user }) => {
      // Check if user has permission to view roles
      if (!(await user.hasPermission(SystemPermissions.ROLE_READ_ALL))) {
        throw new AppError('Forbidden: Insufficient permissions', 403);
      }

      return await RoleManagementService.getAllRoles();
    },
    {
      detail: {
        summary: 'Get all roles',
        tags: ['Roles'],
      },
    }
  )

  // Get role by ID
  .get(
    '/:id',
    async ({ params: { id }, user }) => {
      // Check if user has permission to view roles
      if (!(await user.hasPermission(SystemPermissions.ROLE_READ))) {
        throw new AppError('Forbidden: Insufficient permissions', 403);
      }

      return await RoleManagementService.getRoleById(id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Get role by ID',
        tags: ['Roles'],
      },
    }
  )

  // Create a new role
  .post(
    '/',
    async ({ body, user }) => {
      // Check if user has permission to create roles
      if (!(await user.hasPermission(SystemPermissions.ROLE_CREATE))) {
        throw new AppError('Forbidden: Insufficient permissions', 403);
      }

      return await RoleManagementService.createRole(body);
    },
    {
      body: t.Object({
        roleName: t.String(),
        description: t.String(),
        permissions: t.Array(t.String()),
      }),
      detail: {
        summary: 'Create a new role',
        tags: ['Roles'],
      },
    }
  )

  // Update a role
  .put(
    '/:id',
    async ({ params: { id }, body, user }) => {
      // Check if user has permission to update roles
      if (!(await user.hasPermission(SystemPermissions.ROLE_UPDATE))) {
        throw new AppError('Forbidden: Insufficient permissions', 403);
      }

      return await RoleManagementService.updateRole(id, body);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        roleName: t.Optional(t.String()),
        description: t.Optional(t.String()),
        permissions: t.Optional(t.Array(t.String())),
      }),
      detail: {
        summary: 'Update a role',
        tags: ['Roles'],
      },
    }
  )

  // Delete a role
  .delete(
    '/:id',
    async ({ params: { id }, user }) => {
      // Check if user has permission to delete roles
      if (!(await user.hasPermission(SystemPermissions.ROLE_DELETE))) {
        throw new AppError('Forbidden: Insufficient permissions', 403);
      }

      await RoleManagementService.deleteRole(id);
      return { message: 'Role deleted successfully' };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Delete a role',
        tags: ['Roles'],
      },
    }
  )

  // Get all available permissions
  .get(
    '/permissions/all',
    async ({ user }) => {
      // Check if user has permission to view permissions
      if (!(await user.hasPermission(SystemPermissions.ROLE_READ))) {
        throw new AppError('Forbidden: Insufficient permissions', 403);
      }

      return RoleManagementService.getAllPermissions();
    },
    {
      detail: {
        summary: 'Get all available permissions',
        tags: ['Roles'],
      },
    }
  )

  // Assign roles to a user
  .post(
    '/assign/:userId',
    async ({ params: { userId }, body, user }) => {
      // Check if user has permission to manage users
      if (!(await user.hasPermission(SystemPermissions.USER_MANAGE))) {
        throw new AppError('Forbidden: Insufficient permissions', 403);
      }

      await RoleManagementService.assignRolesToUser(userId, body.roleIds);
      return { message: 'Roles assigned successfully' };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      body: t.Object({
        roleIds: t.Array(t.String()),
      }),
      detail: {
        summary: 'Assign roles to a user',
        tags: ['Roles'],
      },
    }
  )

  // Get roles assigned to a user
  .get(
    '/user/:userId',
    async ({ params: { userId }, user }) => {
      // Check if user has permission to view users
      if (!(await user.hasPermission(SystemPermissions.USER_READ))) {
        throw new AppError('Forbidden: Insufficient permissions', 403);
      }

      return await RoleManagementService.getUserRoles(userId);
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        summary: 'Get roles assigned to a user',
        tags: ['Roles'],
      },
    }
  );

