import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout; 