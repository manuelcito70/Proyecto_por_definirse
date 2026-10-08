import React from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

const Layout = ({ user, onLogout, children }) => {
  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="brand-title">Sistemas</h1>
          <p className="brand-subtitle">
            DIRECCIÓN DE CARRERA<br/>
            Archivo y documentación
          </p>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-group-title">ARCHIVO INSTITUCIONAL</p>
          
          <NavLink to="/expedidos" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            Documentos expedidos
          </NavLink>
          
          <NavLink to="/recibidos" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Documentos recibidos
          </NavLink>
          
          <NavLink to="/actas" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            Actas de graduación
          </NavLink>
          
          <NavLink to="/auxiliares" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Auxiliares de cátedra
          </NavLink>
          
          <NavLink to="/docentes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Docentes
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{user?.nombre?.charAt(0) || 'A'}</div>
            <div className="user-info">
              <span className="user-name">{user?.nombre || 'Ing. Alicia'}</span>
              <span className="user-role">{user?.cargo || 'Directora de carrera'}</span>
            </div>
          </div>
          <button onClick={onLogout} className="logout-link">
            Cerrar sesión ↗
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title">Sistema de Gestión de Archivos y Documentación</div>
          <div className="header-controls">
            <span className="gestion-label">Gestión</span>
            <select className="gestion-select">
              <option value="2026">2026 • Actual</option>
              <option value="2025">2025</option>
            </select>
            <span className="gestion-prev">Anterior: 2025</span>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
