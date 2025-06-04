import React, { useState, useEffect } from 'react';
import {
  Button,
  FormGroup,
  InputGroup,
  Intent,
  TextArea,
  Checkbox,
  H4,
  Divider,
  Callout,
} from '@blueprintjs/core';

interface RoleFormProps {
  role?: any;
  permissions: any[];
  onSave: (roleData: any) => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ role, permissions, onSave }) => {
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    permissions: [] as string[],
  });
  const [errors, setErrors] = useState({
    roleName: '',
    description: '',
  });

  // Initialize form data when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        roleName: role.roleName,
        description: role.description,
        permissions: role.permissions,
      });
    } else {
      setFormData({
        roleName: '',
        description: '',
        permissions: [],
      });
    }
  }, [role]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for the field
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Handle permission toggle
  const handlePermissionToggle = (permission: string) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter((p) => p !== permission)
      : [...formData.permissions, permission];
    
    setFormData({
      ...formData,
      permissions: newPermissions,
    });
  };

  // Handle category toggle (select/deselect all permissions in a category)
  const handleCategoryToggle = (category: string, categoryPermissions: any[]) => {
    const permissionValues = categoryPermissions.map((p) => p.value);
    const allSelected = permissionValues.every((p) => formData.permissions.includes(p));
    
    let newPermissions;
    if (allSelected) {
      // Deselect all permissions in the category
      newPermissions = formData.permissions.filter((p) => !permissionValues.includes(p));
    } else {
      // Select all permissions in the category
      const permissionsToAdd = permissionValues.filter((p) => !formData.permissions.includes(p));
      newPermissions = [...formData.permissions, ...permissionsToAdd];
    }
    
    setFormData({
      ...formData,
      permissions: newPermissions,
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {
      roleName: '',
      description: '',
    };
    
    if (!formData.roleName.trim()) {
      newErrors.roleName = 'Role name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (newErrors.roleName || newErrors.description) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="role-form">
      <FormGroup
        label="Role Name"
        labelFor="roleName"
        helperText={errors.roleName || 'Enter a unique name for this role'}
        intent={errors.roleName ? Intent.DANGER : Intent.NONE}
      >
        <InputGroup
          id="roleName"
          name="roleName"
          value={formData.roleName}
          onChange={handleInputChange}
          intent={errors.roleName ? Intent.DANGER : Intent.NONE}
          disabled={role?.isSystemRole}
        />
      </FormGroup>

      <FormGroup
        label="Description"
        labelFor="description"
        helperText={errors.description || 'Describe the purpose of this role'}
        intent={errors.description ? Intent.DANGER : Intent.NONE}
      >
        <TextArea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          intent={errors.description ? Intent.DANGER : Intent.NONE}
          fill
          growVertically
        />
      </FormGroup>

      <FormGroup label="Permissions">
        {role?.isSystemRole && (
          <Callout intent={Intent.WARNING} title="System Role" className="mb-3">
            This is a system role. You can modify its permissions, but you cannot change its name.
          </Callout>
        )}

        <div className="permissions-container">
          {permissions.map((category) => (
            <div key={category.category} className="permission-category">
              <div className="category-header">
                <H4>{category.category}</H4>
                <Checkbox
                  checked={category.permissions.every((p: any) => 
                    formData.permissions.includes(p.value)
                  )}
                  indeterminate={
                    category.permissions.some((p: any) => 
                      formData.permissions.includes(p.value)
                    ) &&
                    !category.permissions.every((p: any) => 
                      formData.permissions.includes(p.value)
                    )
                  }
                  onChange={() => handleCategoryToggle(
                    category.category, 
                    category.permissions
                  )}
                  label="Select All"
                />
              </div>
              <Divider />
              <div className="permission-list">
                {category.permissions.map((permission: any) => (
                  <Checkbox
                    key={permission.value}
                    checked={formData.permissions.includes(permission.value)}
                    onChange={() => handlePermissionToggle(permission.value)}
                    label={permission.name}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </FormGroup>

      <div className="form-actions">
        <Button
          type="submit"
          intent={Intent.PRIMARY}
          text={role ? 'Update Role' : 'Create Role'}
        />
      </div>
    </form>
  );
};

export default RoleForm;

