import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Elevation,
  H2,
  H4,
  Intent,
  NonIdealState,
  Spinner,
  Tab,
  Tabs,
  Tag,
  Toaster,
  Position,
} from '@blueprintjs/core';
import { useAuth } from '../../context/AuthContext';
import RoleList from './components/RoleList';
import RoleForm from './components/RoleForm';
import { SystemPermissions } from '../../../server/models/permission';

// Create toaster instance
const toaster = Toaster.create({
  position: Position.TOP,
});

const RoleManagementPage: React.FC = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  // Check if user has permission to manage roles
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // For now, only allow admin users
        // In the future, this will use the hasPermission API
        setHasPermission(user?.role === 'admin');
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [user]);

  // Fetch roles and permissions
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !hasPermission) return;

      setLoading(true);
      try {
        // Fetch roles
        const rolesResponse = await fetch('/api/v1/roles', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!rolesResponse.ok) {
          throw new Error('Failed to fetch roles');
        }

        const rolesData = await rolesResponse.json();
        setRoles(rolesData);

        // Fetch permissions
        const permissionsResponse = await fetch('/api/v1/roles/permissions/all', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!permissionsResponse.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toaster.show({
          message: 'Failed to load roles and permissions',
          intent: Intent.DANGER,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, hasPermission]);

  // Handle role selection
  const handleSelectRole = (role: any) => {
    setSelectedRole(role);
    setActiveTab('edit');
  };

  // Handle role creation
  const handleCreateRole = () => {
    setSelectedRole(null);
    setActiveTab('create');
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/v1/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete role');
      }

      // Remove role from state
      setRoles(roles.filter((role) => role._id !== roleId));
      
      // Show success message
      toaster.show({
        message: 'Role deleted successfully',
        intent: Intent.SUCCESS,
      });

      // Reset selected role if it was deleted
      if (selectedRole && selectedRole._id === roleId) {
        setSelectedRole(null);
        setActiveTab('list');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toaster.show({
        message: 'Failed to delete role',
        intent: Intent.DANGER,
      });
    }
  };

  // Handle role save (create or update)
  const handleSaveRole = async (roleData: any) => {
    if (!token) return;

    try {
      let response;
      
      if (selectedRole) {
        // Update existing role
        response = await fetch(`/api/v1/roles/${selectedRole._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(roleData),
        });
      } else {
        // Create new role
        response = await fetch('/api/v1/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(roleData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save role');
      }

      const savedRole = await response.json();
      
      // Update roles state
      if (selectedRole) {
        setRoles(roles.map((role) => (role._id === savedRole._id ? savedRole : role)));
      } else {
        setRoles([...roles, savedRole]);
      }
      
      // Show success message
      toaster.show({
        message: `Role ${selectedRole ? 'updated' : 'created'} successfully`,
        intent: Intent.SUCCESS,
      });

      // Go back to list view
      setActiveTab('list');
      setSelectedRole(null);
    } catch (error) {
      console.error('Error saving role:', error);
      toaster.show({
        message: `Failed to ${selectedRole ? 'update' : 'create'} role`,
        intent: Intent.DANGER,
      });
    }
  };

  // If user doesn't have permission, show non-ideal state
  if (!hasPermission) {
    return (
      <NonIdealState
        icon="lock"
        title="Access Denied"
        description="You don't have permission to manage roles."
      />
    );
  }

  // If loading, show spinner
  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <Card elevation={Elevation.TWO} className="page-card">
            <H2>Role Management</H2>
            <div className="spinner-container">
              <Spinner />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <Card elevation={Elevation.TWO} className="page-card">
          <div className="page-header">
            <H2>Role Management</H2>
            <div className="page-actions">
              {activeTab === 'list' && (
                <Button
                  icon="plus"
                  intent={Intent.PRIMARY}
                  onClick={handleCreateRole}
                >
                  Create Role
                </Button>
              )}
              {activeTab !== 'list' && (
                <Button
                  icon="arrow-left"
                  onClick={() => {
                    setActiveTab('list');
                    setSelectedRole(null);
                  }}
                >
                  Back to List
                </Button>
              )}
            </div>
          </div>

          <Tabs
            id="role-management-tabs"
            selectedTabId={activeTab}
            onChange={(newTabId) => setActiveTab(newTabId as string)}
            renderActiveTabPanelOnly
          >
            <Tab
              id="list"
              title="Roles"
              panel={
                <RoleList
                  roles={roles}
                  onSelectRole={handleSelectRole}
                  onDeleteRole={handleDeleteRole}
                />
              }
            />
            <Tab
              id="create"
              title="Create Role"
              panel={
                <RoleForm
                  permissions={permissions}
                  onSave={handleSaveRole}
                />
              }
            />
            <Tab
              id="edit"
              title="Edit Role"
              panel={
                <RoleForm
                  role={selectedRole}
                  permissions={permissions}
                  onSave={handleSaveRole}
                />
              }
            />
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default RoleManagementPage;

