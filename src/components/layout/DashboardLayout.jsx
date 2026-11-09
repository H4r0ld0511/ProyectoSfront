import { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AuthContext } from '../../context/auth/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="dashboard-layout-container">
      <Sidebar />
      <div className="dashboard-content-wrapper">
        <header className="dashboard-topbar">
          <div className="topbar-breadcrumb">
            <h3>Bienvenido, {user?.email}</h3>
          </div>
          <div className="topbar-actions">
            <div className="user-profile">
              <div className="avatar">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-role">{user?.rol || 'Administrador'}</span>
              </div>
            </div>
            <button onClick={logout} className="btn-logout">Salir</button>
          </div>
        </header>
        <main className="dashboard-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
