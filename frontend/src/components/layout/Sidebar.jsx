import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Clock, FolderOpen, Settings, Users as UsersIcon } from 'lucide-react';

export const Sidebar = () => {
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        AIO<span>Space</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/tickets" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Ticket size={20} />
          Tickets
        </NavLink>
        <NavLink to="/projects" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <FolderOpen size={20} />
          Projects & Time
        </NavLink>
        <NavLink to="/users" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
           <UsersIcon size={20} />
           Users
        </NavLink>
        <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Clock size={20} />
          Reports
        </NavLink>
      </nav>
      <div className="sidebar-footer" style={{ padding: '16px 12px' }}>
         <NavLink to="/settings" className="nav-item">
          <Settings size={20} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};
