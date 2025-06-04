import mongoose from 'mongoose';
import { Role, IRole } from '../models/role';
import { User } from '../models/user';
import { DefaultRolePermissions, getAllPermissions } from '../models/permission';
import { AppError } from '../middleware/errorHandler';

export class RoleManagementService {
  // Initialize default system roles
  static async initializeSystemRoles(): Promise<void> {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Check if roles already exist
        const existingRoles = await Role.find({ isSystemRole: true }).session(session);
        
        // If no system roles exist, create them
        if (existingRoles.length === 0) {
          const systemRoles = [
            {
              roleName: 'ADMINISTRATOR',
              description: 'Full system access with all permissions',
              permissions: DefaultRolePermissions.ADMIN,
              isSystemRole: true,
            },
            {
              roleName: 'MANAGER',
              description: 'Department management and approval capabilities',
              permissions: DefaultRolePermissions.MANAGER,
              isSystemRole: true,
            },
            {
              roleName: 'ACCOUNTANT',
              description: 'Financial operations and reporting',
              permissions: DefaultRolePermissions.ACCOUNTANT,
              isSystemRole: true,
            },
            {
              roleName: 'EMPLOYEE',
              description: 'Basic user with limited permissions',
              permissions: DefaultRolePermissions.USER,
              isSystemRole: true,
            },
          ];

          await Role.insertMany(systemRoles, { session });
        }

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error('Error initializing system roles:', error);
      throw error;
    }
  }

  // Get all roles
  static async getAllRoles(): Promise<IRole[]> {
    try {
      return await Role.find().sort({ isSystemRole: -1, roleName: 1 });
    } catch (error) {
      console.error('Error getting all roles:', error);
      throw error;
    }
  }

  // Get role by ID
  static async getRoleById(roleId: string): Promise<IRole> {
    try {
      const role = await Role.findById(roleId);
      if (!role) {
        throw new AppError('Role not found', 404);
      }
      return role;
    } catch (error) {
      console.error(`Error getting role with ID ${roleId}:`, error);
      throw error;
    }
  }

  // Create a new role
  static async createRole(roleData: {
    roleName: string;
    description: string;
    permissions: string[];
  }): Promise<IRole> {
    try {
      // Check if role with the same name already exists
      const existingRole = await Role.findOne({ roleName: roleData.roleName });
      if (existingRole) {
        throw new AppError('Role with this name already exists', 400);
      }

      // Create new role
      const newRole = new Role({
        ...roleData,
        isSystemRole: false, // Custom roles are not system roles
      });

      return await newRole.save();
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  // Update an existing role
  static async updateRole(
    roleId: string,
    roleData: {
      roleName?: string;
      description?: string;
      permissions?: string[];
    }
  ): Promise<IRole> {
    try {
      // Get the role
      const role = await Role.findById(roleId);
      if (!role) {
        throw new AppError('Role not found', 404);
      }

      // Prevent modification of system role names
      if (role.isSystemRole && roleData.roleName && roleData.roleName !== role.roleName) {
        throw new AppError('Cannot change the name of a system role', 400);
      }

      // Check if new role name already exists (if name is being changed)
      if (roleData.roleName && roleData.roleName !== role.roleName) {
        const existingRole = await Role.findOne({ roleName: roleData.roleName });
        if (existingRole) {
          throw new AppError('Role with this name already exists', 400);
        }
      }

      // Update role
      Object.assign(role, roleData);
      return await role.save();
    } catch (error) {
      console.error(`Error updating role with ID ${roleId}:`, error);
      throw error;
    }
  }

  // Delete a role
  static async deleteRole(roleId: string): Promise<void> {
    try {
      // Get the role
      const role = await Role.findById(roleId);
      if (!role) {
        throw new AppError('Role not found', 404);
      }

      // Prevent deletion of system roles
      if (role.isSystemRole) {
        throw new AppError('Cannot delete a system role', 400);
      }

      // Check if any users are assigned to this role
      const usersWithRole = await User.countDocuments({ roleIds: roleId });
      if (usersWithRole > 0) {
        throw new AppError(
          `Cannot delete role: ${usersWithRole} user(s) are assigned to this role`,
          400
        );
      }

      // Delete the role
      await Role.findByIdAndDelete(roleId);
    } catch (error) {
      console.error(`Error deleting role with ID ${roleId}:`, error);
      throw error;
    }
  }

  // Get all available permissions (for UI display)
  static getAllPermissions() {
    return getAllPermissions();
  }

  // Assign roles to a user
  static async assignRolesToUser(userId: string, roleIds: string[]): Promise<void> {
    try {
      // Validate user
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Validate roles
      const roles = await Role.find({ _id: { $in: roleIds } });
      if (roles.length !== roleIds.length) {
        throw new AppError('One or more roles not found', 400);
      }

      // Update user's roles
      user.roleIds = roleIds.map(id => new mongoose.Types.ObjectId(id));
      await user.save();
    } catch (error) {
      console.error(`Error assigning roles to user ${userId}:`, error);
      throw error;
    }
  }

  // Get roles assigned to a user
  static async getUserRoles(userId: string): Promise<IRole[]> {
    try {
      // Validate user
      const user = await User.findById(userId).populate('roleIds');
      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user.roleIds as unknown as IRole[];
    } catch (error) {
      console.error(`Error getting roles for user ${userId}:`, error);
      throw error;
    }
  }
}

