// Define all available permissions in the system
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  READ_ALL = 'read_all',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  MANAGE = 'manage',
}

export enum PermissionResource {
  USER = 'user',
  ROLE = 'role',
  COMPANY = 'company',
  DEPARTMENT = 'department',
  EXPENSE_REQUEST = 'expense_request',
  PAYMENT_REQUEST = 'payment_request',
  BUDGET = 'budget',
  REPORT = 'report',
  SETTING = 'setting',
}

// Helper function to generate permission strings
export const generatePermission = (
  resource: PermissionResource,
  action: PermissionAction
): string => `${resource}:${action}`;

// Define all system permissions
export const SystemPermissions = {
  // User permissions
  USER_CREATE: generatePermission(PermissionResource.USER, PermissionAction.CREATE),
  USER_READ: generatePermission(PermissionResource.USER, PermissionAction.READ),
  USER_READ_ALL: generatePermission(PermissionResource.USER, PermissionAction.READ_ALL),
  USER_UPDATE: generatePermission(PermissionResource.USER, PermissionAction.UPDATE),
  USER_DELETE: generatePermission(PermissionResource.USER, PermissionAction.DELETE),
  USER_MANAGE: generatePermission(PermissionResource.USER, PermissionAction.MANAGE),

  // Role permissions
  ROLE_CREATE: generatePermission(PermissionResource.ROLE, PermissionAction.CREATE),
  ROLE_READ: generatePermission(PermissionResource.ROLE, PermissionAction.READ),
  ROLE_READ_ALL: generatePermission(PermissionResource.ROLE, PermissionAction.READ_ALL),
  ROLE_UPDATE: generatePermission(PermissionResource.ROLE, PermissionAction.UPDATE),
  ROLE_DELETE: generatePermission(PermissionResource.ROLE, PermissionAction.DELETE),
  ROLE_MANAGE: generatePermission(PermissionResource.ROLE, PermissionAction.MANAGE),

  // Company permissions
  COMPANY_CREATE: generatePermission(PermissionResource.COMPANY, PermissionAction.CREATE),
  COMPANY_READ: generatePermission(PermissionResource.COMPANY, PermissionAction.READ),
  COMPANY_READ_ALL: generatePermission(PermissionResource.COMPANY, PermissionAction.READ_ALL),
  COMPANY_UPDATE: generatePermission(PermissionResource.COMPANY, PermissionAction.UPDATE),
  COMPANY_DELETE: generatePermission(PermissionResource.COMPANY, PermissionAction.DELETE),
  COMPANY_MANAGE: generatePermission(PermissionResource.COMPANY, PermissionAction.MANAGE),

  // Department permissions
  DEPARTMENT_CREATE: generatePermission(PermissionResource.DEPARTMENT, PermissionAction.CREATE),
  DEPARTMENT_READ: generatePermission(PermissionResource.DEPARTMENT, PermissionAction.READ),
  DEPARTMENT_READ_ALL: generatePermission(PermissionResource.DEPARTMENT, PermissionAction.READ_ALL),
  DEPARTMENT_UPDATE: generatePermission(PermissionResource.DEPARTMENT, PermissionAction.UPDATE),
  DEPARTMENT_DELETE: generatePermission(PermissionResource.DEPARTMENT, PermissionAction.DELETE),
  DEPARTMENT_MANAGE: generatePermission(PermissionResource.DEPARTMENT, PermissionAction.MANAGE),

  // Expense request permissions
  EXPENSE_REQUEST_CREATE: generatePermission(PermissionResource.EXPENSE_REQUEST, PermissionAction.CREATE),
  EXPENSE_REQUEST_READ: generatePermission(PermissionResource.EXPENSE_REQUEST, PermissionAction.READ),
  EXPENSE_REQUEST_READ_ALL: generatePermission(PermissionResource.EXPENSE_REQUEST, PermissionAction.READ_ALL),
  EXPENSE_REQUEST_UPDATE: generatePermission(PermissionResource.EXPENSE_REQUEST, PermissionAction.UPDATE),
  EXPENSE_REQUEST_DELETE: generatePermission(PermissionResource.EXPENSE_REQUEST, PermissionAction.DELETE),
  EXPENSE_REQUEST_APPROVE: generatePermission(PermissionResource.EXPENSE_REQUEST, PermissionAction.APPROVE),
  EXPENSE_REQUEST_REJECT: generatePermission(PermissionResource.EXPENSE_REQUEST, PermissionAction.REJECT),

  // Payment request permissions
  PAYMENT_REQUEST_CREATE: generatePermission(PermissionResource.PAYMENT_REQUEST, PermissionAction.CREATE),
  PAYMENT_REQUEST_READ: generatePermission(PermissionResource.PAYMENT_REQUEST, PermissionAction.READ),
  PAYMENT_REQUEST_READ_ALL: generatePermission(PermissionResource.PAYMENT_REQUEST, PermissionAction.READ_ALL),
  PAYMENT_REQUEST_UPDATE: generatePermission(PermissionResource.PAYMENT_REQUEST, PermissionAction.UPDATE),
  PAYMENT_REQUEST_DELETE: generatePermission(PermissionResource.PAYMENT_REQUEST, PermissionAction.DELETE),
  PAYMENT_REQUEST_APPROVE: generatePermission(PermissionResource.PAYMENT_REQUEST, PermissionAction.APPROVE),
  PAYMENT_REQUEST_REJECT: generatePermission(PermissionResource.PAYMENT_REQUEST, PermissionAction.REJECT),

  // Budget permissions
  BUDGET_CREATE: generatePermission(PermissionResource.BUDGET, PermissionAction.CREATE),
  BUDGET_READ: generatePermission(PermissionResource.BUDGET, PermissionAction.READ),
  BUDGET_READ_ALL: generatePermission(PermissionResource.BUDGET, PermissionAction.READ_ALL),
  BUDGET_UPDATE: generatePermission(PermissionResource.BUDGET, PermissionAction.UPDATE),
  BUDGET_DELETE: generatePermission(PermissionResource.BUDGET, PermissionAction.DELETE),
  BUDGET_APPROVE: generatePermission(PermissionResource.BUDGET, PermissionAction.APPROVE),

  // Report permissions
  REPORT_CREATE: generatePermission(PermissionResource.REPORT, PermissionAction.CREATE),
  REPORT_READ: generatePermission(PermissionResource.REPORT, PermissionAction.READ),
  REPORT_READ_ALL: generatePermission(PermissionResource.REPORT, PermissionAction.READ_ALL),

  // Setting permissions
  SETTING_READ: generatePermission(PermissionResource.SETTING, PermissionAction.READ),
  SETTING_UPDATE: generatePermission(PermissionResource.SETTING, PermissionAction.UPDATE),
  SETTING_MANAGE: generatePermission(PermissionResource.SETTING, PermissionAction.MANAGE),
};

// Define default permissions for system roles
export const DefaultRolePermissions = {
  ADMIN: Object.values(SystemPermissions),
  MANAGER: [
    // User permissions (limited)
    SystemPermissions.USER_READ,
    SystemPermissions.USER_READ_ALL,
    
    // Company permissions (limited)
    SystemPermissions.COMPANY_READ,
    
    // Department permissions
    SystemPermissions.DEPARTMENT_CREATE,
    SystemPermissions.DEPARTMENT_READ,
    SystemPermissions.DEPARTMENT_READ_ALL,
    SystemPermissions.DEPARTMENT_UPDATE,
    
    // Expense request permissions
    SystemPermissions.EXPENSE_REQUEST_CREATE,
    SystemPermissions.EXPENSE_REQUEST_READ,
    SystemPermissions.EXPENSE_REQUEST_READ_ALL,
    SystemPermissions.EXPENSE_REQUEST_UPDATE,
    SystemPermissions.EXPENSE_REQUEST_APPROVE,
    SystemPermissions.EXPENSE_REQUEST_REJECT,
    
    // Payment request permissions
    SystemPermissions.PAYMENT_REQUEST_CREATE,
    SystemPermissions.PAYMENT_REQUEST_READ,
    SystemPermissions.PAYMENT_REQUEST_READ_ALL,
    SystemPermissions.PAYMENT_REQUEST_UPDATE,
    SystemPermissions.PAYMENT_REQUEST_APPROVE,
    SystemPermissions.PAYMENT_REQUEST_REJECT,
    
    // Budget permissions
    SystemPermissions.BUDGET_CREATE,
    SystemPermissions.BUDGET_READ,
    SystemPermissions.BUDGET_READ_ALL,
    SystemPermissions.BUDGET_UPDATE,
    SystemPermissions.BUDGET_APPROVE,
    
    // Report permissions
    SystemPermissions.REPORT_CREATE,
    SystemPermissions.REPORT_READ,
    SystemPermissions.REPORT_READ_ALL,
  ],
  ACCOUNTANT: [
    // User permissions (very limited)
    SystemPermissions.USER_READ,
    
    // Company permissions (limited)
    SystemPermissions.COMPANY_READ,
    
    // Expense request permissions (limited)
    SystemPermissions.EXPENSE_REQUEST_READ,
    SystemPermissions.EXPENSE_REQUEST_READ_ALL,
    
    // Payment request permissions
    SystemPermissions.PAYMENT_REQUEST_CREATE,
    SystemPermissions.PAYMENT_REQUEST_READ,
    SystemPermissions.PAYMENT_REQUEST_READ_ALL,
    SystemPermissions.PAYMENT_REQUEST_UPDATE,
    
    // Budget permissions (limited)
    SystemPermissions.BUDGET_READ,
    SystemPermissions.BUDGET_READ_ALL,
    
    // Report permissions
    SystemPermissions.REPORT_CREATE,
    SystemPermissions.REPORT_READ,
    SystemPermissions.REPORT_READ_ALL,
  ],
  USER: [
    // User permissions (self only)
    SystemPermissions.USER_READ,
    
    // Expense request permissions (limited)
    SystemPermissions.EXPENSE_REQUEST_CREATE,
    SystemPermissions.EXPENSE_REQUEST_READ,
    
    // Payment request permissions (limited)
    SystemPermissions.PAYMENT_REQUEST_CREATE,
    SystemPermissions.PAYMENT_REQUEST_READ,
    
    // Budget permissions (very limited)
    SystemPermissions.BUDGET_READ,
    
    // Report permissions (very limited)
    SystemPermissions.REPORT_READ,
  ],
};

// Get all available permissions for UI display
export const getAllPermissions = (): { category: string; permissions: { name: string; value: string }[] }[] => {
  const permissionsByCategory: Record<string, { name: string; value: string }[]> = {};
  
  Object.entries(SystemPermissions).forEach(([key, value]) => {
    const [resource] = value.split(':');
    const displayName = key
      .split('_')
      .map((word, index) => 
        index === 0 
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() 
          : word.toLowerCase()
      )
      .join(' ');
    
    if (!permissionsByCategory[resource]) {
      permissionsByCategory[resource] = [];
    }
    
    permissionsByCategory[resource].push({
      name: displayName,
      value,
    });
  });
  
  return Object.entries(permissionsByCategory).map(([category, permissions]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
    permissions,
  }));
};

