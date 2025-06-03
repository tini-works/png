import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if menu item is active
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Navigate to path
  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`sidebar ${isOpen ? '' : 'closed'}`}>
      <Menu className="sidebar-menu">
        <MenuItem
          icon="dashboard"
          text={isOpen ? 'Dashboard' : ''}
          active={isActive('/dashboard')}
          onClick={() => navigateTo('/dashboard')}
        />
        <MenuItem
          icon="document"
          text={isOpen ? 'Payment Requests' : ''}
          active={isActive('/payment-requests')}
          onClick={() => navigateTo('/payment-requests')}
        />
        
        {/* Admin and Manager only */}
        {user?.role && ['admin', 'manager'].includes(user.role) && (
          <>
            <MenuDivider title={isOpen ? 'Administration' : ''} />
            <MenuItem
              icon="people"
              text={isOpen ? 'Users' : ''}
              active={isActive('/users')}
              onClick={() => navigateTo('/users')}
            />
          </>
        )}
        
        <MenuDivider />
        <MenuItem
          icon="cog"
          text={isOpen ? 'Settings' : ''}
          active={isActive('/settings')}
          onClick={() => navigateTo('/settings')}
        />
      </Menu>
    </div>
  );
};

export default Sidebar;

