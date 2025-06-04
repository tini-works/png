import React from 'react';
import {
  Button,
  Card,
  Elevation,
  H4,
  Intent,
  Tag,
  Tooltip,
} from '@blueprintjs/core';

interface RoleListProps {
  roles: any[];
  onSelectRole: (role: any) => void;
  onDeleteRole: (roleId: string) => void;
}

const RoleList: React.FC<RoleListProps> = ({
  roles,
  onSelectRole,
  onDeleteRole,
}) => {
  return (
    <div className="role-list">
      {roles.length === 0 ? (
        <div className="empty-state">
          <p>No roles found. Create a new role to get started.</p>
        </div>
      ) : (
        roles.map((role) => (
          <Card
            key={role._id}
            elevation={Elevation.ONE}
            className="role-card"
            interactive
            onClick={() => onSelectRole(role)}
          >
            <div className="role-header">
              <H4>{role.roleName}</H4>
              {role.isSystemRole && (
                <Tag intent={Intent.PRIMARY} minimal>
                  System Role
                </Tag>
              )}
            </div>
            <p className="role-description">{role.description}</p>
            <div className="role-permissions">
              <small>
                <strong>Permissions:</strong>{' '}
                {role.permissions.length} permissions assigned
              </small>
            </div>
            <div className="role-actions">
              <Button
                icon="edit"
                minimal
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole(role);
                }}
              >
                Edit
              </Button>
              {!role.isSystemRole && (
                <Tooltip content="System roles cannot be deleted">
                  <Button
                    icon="trash"
                    intent={Intent.DANGER}
                    minimal
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          'Are you sure you want to delete this role? This action cannot be undone.'
                        )
                      ) {
                        onDeleteRole(role._id);
                      }
                    }}
                    disabled={role.isSystemRole}
                  >
                    Delete
                  </Button>
                </Tooltip>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default RoleList;

