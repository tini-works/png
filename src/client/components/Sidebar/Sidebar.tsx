import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, MenuItem, Icon } from '@blueprintjs/core';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../../server/models/user';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Check if the current path matches the menu item
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Check if user has permission for a menu item
  const hasPermission = (requiredRoles: UserRole[]) => {
    if (!user) return false;
    return requiredRoles.includes(user.role as UserRole);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <Menu className="sidebar-menu">
        <MenuItem
          icon="dashboard"
          text={isOpen ? 'Dashboard' : ''}
          active={isActive('/dashboard')}
          className={isActive('/dashboard') ? 'active' : ''}
          href="/dashboard"
        />
        
        <MenuItem
          icon="document"
          text={isOpen ? 'Payment Requests' : ''}
          active={isActive('/payment-requests')}
          className={isActive('/payment-requests') ? 'active' : ''}
          href="/payment-requests"
        />
        
        {hasPermission([UserRole.ADMIN, UserRole.MANAGER]) && (
          <MenuItem
            icon="people"
            text={isOpen ? 'Users' : ''}
            active={isActive('/users')}
            className={isActive('/users') ? 'active' : ''}
            href="/users"
          />
        )}
        
        {/* New menu item for role management */}
        {hasPermission([UserRole.ADMIN]) && (
          <MenuItem
            icon="key"
            text={isOpen ? 'Roles & Permissions' : ''}
            active={isActive('/roles')}
            className={isActive('/roles') ? 'active' : ''}
            href="/roles"
          />
        )}
        
        {hasPermission([UserRole.ADMIN, UserRole.MANAGER]) && (
          <MenuItem
            icon="cog"
            text={isOpen ? 'Settings' : ''}
            active={isActive('/settings')}
            className={isActive('/settings') ? 'active' : ''}
            href="/settings"
          />
        )}
      </Menu>
    </div>
  );
};

export default Sidebar;
