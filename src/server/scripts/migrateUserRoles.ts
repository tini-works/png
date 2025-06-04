import mongoose from 'mongoose';
import { config } from '../config';
import { User, UserRole } from '../models/user';
import { Role } from '../models/role';
import { RoleManagementService } from '../services/roleManagement';

// Connect to database
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.db.uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Migrate user roles
const migrateUserRoles = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize system roles
    await RoleManagementService.initializeSystemRoles();
    console.log('✅ System roles initialized');

    // Get all roles
    const roles = await Role.find();
    console.log(`Found ${roles.length} roles`);

    // Create a map of role names to role IDs
    const roleMap = new Map<string, mongoose.Types.ObjectId>();
    roles.forEach(role => {
      // Map legacy role names to new role names
      if (role.roleName === 'ADMINISTRATOR') roleMap.set(UserRole.ADMIN, role._id);
      if (role.roleName === 'MANAGER') roleMap.set(UserRole.MANAGER, role._id);
      if (role.roleName === 'ACCOUNTANT') roleMap.set(UserRole.ACCOUNTANT, role._id);
      if (role.roleName === 'EMPLOYEE') roleMap.set(UserRole.USER, role._id);
    });

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} users to migrate`);

    // Update each user with the appropriate role IDs
    let updatedCount = 0;
    for (const user of users) {
      // Skip users that already have role IDs
      if (user.roleIds && user.roleIds.length > 0) {
        console.log(`User ${user._id} already has role IDs, skipping`);
        continue;
      }

      // Get the role ID for the user's legacy role
      const roleId = roleMap.get(user.role);
      if (!roleId) {
        console.warn(`No matching role found for user ${user._id} with role ${user.role}`);
        continue;
      }

      // Update the user with the role ID
      user.roleIds = [roleId];
      await user.save();
      updatedCount++;
    }

    console.log(`✅ Migration complete: ${updatedCount} users updated`);
  } catch (error) {
    console.error('❌ Error migrating user roles:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the migration
migrateUserRoles();

