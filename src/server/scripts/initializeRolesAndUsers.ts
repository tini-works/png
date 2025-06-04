import mongoose from 'mongoose';
import { config } from '../config';
import { User, UserRole } from '../models/user';
import { Role } from '../models/role';
import { SystemPermissions } from '../models/permission';
import bcrypt from 'bcrypt';

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

// Initialize roles and users
const initializeRolesAndUsers = async () => {
  try {
    // Connect to database
    await connectDatabase();

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
      
      // Employee role (already exists as USER, but we'll customize it)
      {
        roleName: 'EMPLOYEE',
        description: 'Regular employee with ability to submit and track expense requests',
        permissions: [
          // Expense permissions
          SystemPermissions.EXPENSE_REQUEST_CREATE,
          SystemPermissions.EXPENSE_REQUEST_READ,
          SystemPermissions.EXPENSE_REQUEST_UPDATE,
          
          // Payment request permissions (limited)
          SystemPermissions.PAYMENT_REQUEST_CREATE,
          SystemPermissions.PAYMENT_REQUEST_READ,
          
          // User permissions (self only)
          SystemPermissions.USER_READ,
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

    // Create roles
    console.log('Creating custom roles...');
    for (const roleData of customRoles) {
      // Check if role already exists
      const existingRole = await Role.findOne({ roleName: roleData.roleName });
      if (existingRole) {
        console.log(`Role ${roleData.roleName} already exists, updating...`);
        existingRole.description = roleData.description;
        existingRole.permissions = roleData.permissions;
        await existingRole.save();
      } else {
        console.log(`Creating new role: ${roleData.roleName}`);
        await Role.create(roleData);
      }
    }

    // Get all roles for reference
    const roles = await Role.find();
    const roleMap = new Map();
    roles.forEach(role => {
      roleMap.set(role.roleName, role._id);
    });

    // Create a company for the dummy users
    let companyId;
    const existingCompany = await mongoose.connection.db.collection('companies').findOne({ name: 'Demo Company' });
    if (existingCompany) {
      companyId = existingCompany._id;
    } else {
      const companyResult = await mongoose.connection.db.collection('companies').insertOne({
        name: 'Demo Company',
        taxId: '123456789',
        address: '123 Demo Street, Demo City',
        phone: '+84 123 456 789',
        email: 'info@democompany.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      companyId = companyResult.insertedId;
    }

    // Create dummy users
    const dummyUsers = [
      {
        email: 'ceo@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'CEO',
        role: UserRole.ADMIN, // Legacy role for compatibility
        roleIds: [roleMap.get('CEO'), roleMap.get('ADMINISTRATOR')], // Multiple roles
        companyId,
        phone: '+84 901 234 567',
        isActive: true,
      },
      {
        email: 'director@example.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Director',
        role: UserRole.MANAGER, // Legacy role for compatibility
        roleIds: [roleMap.get('DIRECTOR')],
        companyId,
        phone: '+84 902 234 567',
        isActive: true,
      },
      {
        email: 'department_head@example.com',
        password: 'Password123!',
        firstName: 'David',
        lastName: 'Head',
        role: UserRole.MANAGER, // Legacy role for compatibility
        roleIds: [roleMap.get('DEPARTMENT_HEAD')],
        companyId,
        phone: '+84 903 234 567',
        isActive: true,
      },
      {
        email: 'employee1@example.com',
        password: 'Password123!',
        firstName: 'Emily',
        lastName: 'Employee',
        role: UserRole.USER, // Legacy role for compatibility
        roleIds: [roleMap.get('EMPLOYEE')],
        companyId,
        phone: '+84 904 234 567',
        isActive: true,
      },
      {
        email: 'employee2@example.com',
        password: 'Password123!',
        firstName: 'Eric',
        lastName: 'Staff',
        role: UserRole.USER, // Legacy role for compatibility
        roleIds: [roleMap.get('EMPLOYEE')],
        companyId,
        phone: '+84 905 234 567',
        isActive: true,
      },
      {
        email: 'chief_accountant@example.com',
        password: 'Password123!',
        firstName: 'Catherine',
        lastName: 'Chief',
        role: UserRole.ACCOUNTANT, // Legacy role for compatibility
        roleIds: [roleMap.get('CHIEF_ACCOUNTANT')],
        companyId,
        phone: '+84 906 234 567',
        isActive: true,
      },
      {
        email: 'accountant@example.com',
        password: 'Password123!',
        firstName: 'Alex',
        lastName: 'Accountant',
        role: UserRole.ACCOUNTANT, // Legacy role for compatibility
        roleIds: [roleMap.get('STAFF_ACCOUNTANT')],
        companyId,
        phone: '+84 907 234 567',
        isActive: true,
      },
    ];

    // Create users
    console.log('Creating dummy users...');
    for (const userData of dummyUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating...`);
        existingUser.firstName = userData.firstName;
        existingUser.lastName = userData.lastName;
        existingUser.role = userData.role;
        existingUser.roleIds = userData.roleIds;
        existingUser.phone = userData.phone;
        existingUser.isActive = userData.isActive;
        await existingUser.save();
      } else {
        console.log(`Creating new user: ${userData.email}`);
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Create user with hashed password
        await User.create({
          ...userData,
          password: hashedPassword,
        });
      }
    }

    console.log('✅ Roles and users initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing roles and users:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the initialization
initializeRolesAndUsers();

