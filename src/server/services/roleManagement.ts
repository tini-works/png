import mongoose from 'mongoose';
import { Role, IRole } from '../models/role';
import { User } from '../models/user';
import { DefaultRolePermissions, getAllPermissions, SystemPermissions } from '../models/permission';
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

  // Initialize custom business roles
  static async initializeCustomRoles(): Promise<void> {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Define custom roles
        const customRoles = [
          // Management roles
          {
            roleName: 'CEO',
            description: 'Chief Executive Officer with access to high-level dashboards and financial insights',
            permissions: [
              // Dashboard and reporting
              SystemPermissions.REPORT_READ,
              SystemPermissions.REPORT_READ_ALL,
              SystemPermissions.REPORT_CREATE,
              
              // Budget permissions
              SystemPermissions.BUDGET_READ,
              SystemPermissions.BUDGET_READ_ALL,
              SystemPermissions.BUDGET_APPROVE,
              
              // Payment and expense permissions
              SystemPermissions.PAYMENT_REQUEST_READ,
              SystemPermissions.PAYMENT_REQUEST_READ_ALL,
              SystemPermissions.PAYMENT_REQUEST_APPROVE,
              SystemPermissions.EXPENSE_REQUEST_READ,
              SystemPermissions.EXPENSE_REQUEST_READ_ALL,
              SystemPermissions.EXPENSE_REQUEST_APPROVE,
              
              // User permissions (limited)
              SystemPermissions.USER_READ,
              SystemPermissions.USER_READ_ALL,
              
              // Company permissions
              SystemPermissions.COMPANY_READ,
            ],
            isSystemRole: false,
          },
          {
            roleName: 'DIRECTOR',
            description: 'Director with access to financial status analysis and key trends',
            permissions: [
              // Dashboard and reporting
              SystemPermissions.REPORT_READ,
              SystemPermissions.REPORT_READ_ALL,
              SystemPermissions.REPORT_CREATE,
              
              // Budget permissions
              SystemPermissions.BUDGET_READ,
              SystemPermissions.BUDGET_READ_ALL,
              SystemPermissions.BUDGET_APPROVE,
              
              // Payment and expense permissions
              SystemPermissions.PAYMENT_REQUEST_READ,
              SystemPermissions.PAYMENT_REQUEST_READ_ALL,
              SystemPermissions.PAYMENT_REQUEST_APPROVE,
              SystemPermissions.EXPENSE_REQUEST_READ,
              SystemPermissions.EXPENSE_REQUEST_READ_ALL,
              SystemPermissions.EXPENSE_REQUEST_APPROVE,
              
              // User permissions (limited)
              SystemPermissions.USER_READ,
              SystemPermissions.USER_READ_ALL,
              
              // Company permissions
              SystemPermissions.COMPANY_READ,
            ],
            isSystemRole: false,
          },
          
          // Department Head role
          {
            roleName: 'DEPARTMENT_HEAD',
            description: 'Department Head with visibility into departmental budgets and approval capabilities',
            permissions: [
              // Dashboard and reporting (limited)
              SystemPermissions.REPORT_READ,
              
              // Budget permissions (departmental)
              SystemPermissions.BUDGET_READ,
              SystemPermissions.BUDGET_CREATE,
              SystemPermissions.BUDGET_UPDATE,
              
              // Payment and expense permissions
              SystemPermissions.PAYMENT_REQUEST_READ,
              SystemPermissions.PAYMENT_REQUEST_READ_ALL,
              SystemPermissions.PAYMENT_REQUEST_CREATE,
              SystemPermissions.PAYMENT_REQUEST_UPDATE,
              SystemPermissions.PAYMENT_REQUEST_APPROVE,
              SystemPermissions.EXPENSE_REQUEST_READ,
              SystemPermissions.EXPENSE_REQUEST_READ_ALL,
              SystemPermissions.EXPENSE_REQUEST_CREATE,
              SystemPermissions.EXPENSE_REQUEST_UPDATE,
              SystemPermissions.EXPENSE_REQUEST_APPROVE,
              
              // User permissions (very limited)
              SystemPermissions.USER_READ,
              
              // Company permissions (limited)
              SystemPermissions.COMPANY_READ,
            ],
            isSystemRole: false,
          },
          
          // Accounting roles
          {
            roleName: 'CHIEF_ACCOUNTANT',
            description: 'Chief Accountant with full access to financial management features',
            permissions: [
              // Dashboard and reporting
              SystemPermissions.REPORT_READ,
              SystemPermissions.REPORT_READ_ALL,
              SystemPermissions.REPORT_CREATE,
              
              // Budget permissions
              SystemPermissions.BUDGET_READ,
              SystemPermissions.BUDGET_READ_ALL,
              SystemPermissions.BUDGET_CREATE,
              SystemPermissions.BUDGET_UPDATE,
              
              // Payment permissions (full access)
              SystemPermissions.PAYMENT_REQUEST_CREATE,
              SystemPermissions.PAYMENT_REQUEST_READ,
              SystemPermissions.PAYMENT_REQUEST_READ_ALL,
              SystemPermissions.PAYMENT_REQUEST_UPDATE,
              SystemPermissions.PAYMENT_REQUEST_DELETE,
              SystemPermissions.PAYMENT_REQUEST_APPROVE,
              
              // Expense permissions (full access)
              SystemPermissions.EXPENSE_REQUEST_READ,
              SystemPermissions.EXPENSE_REQUEST_READ_ALL,
              SystemPermissions.EXPENSE_REQUEST_UPDATE,
              SystemPermissions.EXPENSE_REQUEST_APPROVE,
              
              // User permissions (limited)
              SystemPermissions.USER_READ,
              SystemPermissions.USER_READ_ALL,
              
              // Company permissions
              SystemPermissions.COMPANY_READ,
            ],
            isSystemRole: false,
          },
          {
            roleName: 'STAFF_ACCOUNTANT',
            description: 'Staff Accountant with access to expense categorization and invoice processing',
            permissions: [
              // Dashboard and reporting (limited)
              SystemPermissions.REPORT_READ,
              
              // Budget permissions (limited)
              SystemPermissions.BUDGET_READ,
              
              // Payment permissions
              SystemPermissions.PAYMENT_REQUEST_CREATE,
              SystemPermissions.PAYMENT_REQUEST_READ,
              SystemPermissions.PAYMENT_REQUEST_READ_ALL,
              SystemPermissions.PAYMENT_REQUEST_UPDATE,
              
              // Expense permissions
              SystemPermissions.EXPENSE_REQUEST_READ,
              SystemPermissions.EXPENSE_REQUEST_READ_ALL,
              SystemPermissions.EXPENSE_REQUEST_UPDATE,
              
              // User permissions (very limited)
              SystemPermissions.USER_READ,
              
              // Company permissions (limited)
              SystemPermissions.COMPANY_READ,
            ],
            isSystemRole: false,
          },
        ];

        // Create or update each custom role
        for (const roleData of customRoles) {
          // Check if role already exists
          const existingRole = await Role.findOne({ roleName: roleData.roleName }).session(session);
          
          if (existingRole) {
            // Update existing role
            existingRole.description = roleData.description;
            existingRole.permissions = roleData.permissions;
            await existingRole.save({ session });
            console.log(`Updated existing role: ${roleData.roleName}`);
          } else {
            // Create new role
            await Role.create([roleData], { session });
            console.log(`Created new role: ${roleData.roleName}`);
          }
        }

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error('Error initializing custom roles:', error);
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
