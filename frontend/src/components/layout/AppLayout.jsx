import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import '../../styles/layout.css'; // Import layout specific styles

export const AppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div className="page-content window-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
