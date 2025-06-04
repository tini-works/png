import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Navbar,
  Button,
  Alignment,
  Menu,
  MenuItem,
  Popover,
  Position,
  Icon,
  Tag,
} from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationList from '../components/NotificationList';
import Sidebar from '../components/Sidebar';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // User menu
  const userMenu = (
    <Menu>
      <MenuItem icon="user" text="Profile" href={`/users/${user?.id}`} />
      <MenuItem icon="cog" text="Settings" href="/settings" />
      <MenuItem icon="log-out" text="Logout" onClick={logout} />
    </Menu>
  );

  return (
    <div className="main-layout">
      <Navbar>
        <Navbar.Group align={Alignment.LEFT}>
          <Button
            icon={sidebarOpen ? 'menu-closed' : 'menu-open'}
            minimal
            onClick={toggleSidebar}
          />
          <Navbar.Divider />
          <Navbar.Heading>Payment Request System</Navbar.Heading>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <Popover
            content={<NotificationList />}
            position={Position.BOTTOM_RIGHT}
          >
            <Button icon="notifications" minimal>
              {unreadCount > 0 && (
                <Tag
                  round
                  intent="danger"
                  className="notification-badge"
                  minimal
                >
                  {unreadCount}
                </Tag>
              )}
            </Button>
          </Popover>
          <Navbar.Divider />
          <Popover content={userMenu} position={Position.BOTTOM_RIGHT}>
            <Button minimal rightIcon="caret-down">
              <Icon icon="user" />
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
            </Button>
          </Popover>
        </Navbar.Group>
      </Navbar>

      <div className="layout-container">
        <Sidebar isOpen={sidebarOpen} />
        <main
          className={`main-content ${
            !sidebarOpen ? 'sidebar-collapsed' : ''
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
