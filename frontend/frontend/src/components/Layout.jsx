import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useGestion } from '../context/GestionContext';
import { getRecibidos } from '../services/api';
import './Layout.css';

const Layout = ({ user, onLogout, children }) => {
  const { gestion, setGestion } = useGestion();
  const [pendientesCount, setPendientesCount] = useState(0);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    // Consultar periódicamente o al montar cuántos recibidos pendientes hay
    const fetchPendientes = () => {
      getRecibidos({ estado: 'pendiente' })
        .then(docs => setPendientesCount(docs.length))
        .catch(() => {});
    };
    fetchPendientes();
    const interval = setInterval(fetchPendientes, 15000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDark]);

  return (
    <div className="app-layout">
      {/* TOP NAVIGATION BAR */}
      <header className="top-navbar">
        <div className="navbar-brand">
          <img src="/logo-ichilo.png" alt="Ichilo" className="brand-logo" />
        </div>

        <nav className="navbar-nav">
          <NavLink to="/expedidos" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            Documentos expedidos
          </NavLink>
          
          <NavLink to="/recibidos" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Documentos recibidos
            {pendientesCount > 0 && (
              <span style={{
                background: '#dc2626',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                padding: '2px 7px',
                borderRadius: '99px',
                marginLeft: '6px'
              }} title={`${pendientesCount} documentos pendientes de respuesta`}>
                {pendientesCount}
              </span>
            )}
          </NavLink>
          
          <NavLink to="/actas" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            Actas de graduación
          </NavLink>
          
          <NavLink to="/auxiliares" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Auxiliares
          </NavLink>
          
          <NavLink to="/docentes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Docentes
          </NavLink>
        </nav>

        <div className="navbar-user">
          <label className="switch">
            <span className="sun"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="#ffd43b"><circle r="5" cy="12" cx="12"></circle><path d="m21 13h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm-17 0h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm13.66-5.66a1 1 0 0 1 -.66-.29 1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1 -.75.29zm-12.02 12.02a1 1 0 0 1 -.71-.29 1 1 0 0 1 0-1.41l.71-.66a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1 -.7.24zm6.36-14.36a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm0 17a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm-5.66-14.66a1 1 0 0 1 -.7-.29l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.29zm12.02 12.02a1 1 0 0 1 -.7-.29l-.66-.71a1 1 0 0 1 1.36-1.36l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.24z"></path></g></svg></span>
            <span className="moon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="m223.5 32c-123.5 0-223.5 100.3-223.5 224s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"></path></svg></span>   
            <input type="checkbox" className="input" checked={isDark} onChange={(e) => setIsDark(e.target.checked)} />
            <span className="slider"></span>
          </label>
          <div className="user-profile">
            <div className="user-avatar">{user?.nombre?.charAt(0) || 'A'}</div>
            <span className="user-name">{user?.nombre || 'Ing. Alicia'}</span>
          </div>
          <button onClick={onLogout} className="logout-link" title="Cerrar sesión">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {/* SUB HEADER */}
      <div className="sub-header">
        <div className="header-title">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="header-controls">
          <span className="gestion-label">Gestión</span>
          <select 
            className="gestion-select"
            value={gestion}
            onChange={(e) => setGestion(e.target.value)}
          >
            <option value="2026">2026 • Actual</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <span className="gestion-prev">Visualizando: {gestion}</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
