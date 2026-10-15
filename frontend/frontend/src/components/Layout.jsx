import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useGestion } from '../context/GestionContext';
import { getRecibidos } from '../services/api';
import GlobalDock from './GlobalDock';

const Layout = ({ user, onLogout, children }) => {
  const { gestion, setGestion, currentSystemYear } = useGestion();
  const [pendientesCount, setPendientesCount] = useState(0);
  const [modoEnfoque, setModoEnfoque] = useState(false);

  useEffect(() => {
    const fetchPendientes = () => {
      getRecibidos({ estado: 'pendiente' })
        .then(docs => setPendientesCount(docs.length))
        .catch(() => {});
    };
    fetchPendientes();
    const interval = setInterval(fetchPendientes, 15000);
    return () => clearInterval(interval);
  }, []);

  const navLinkClasses = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-space-xs px-space-md py-3 border-b-2 border-secondary text-secondary font-body-sm text-body-sm font-bold transition-all whitespace-nowrap'
      : 'flex items-center gap-space-xs px-space-md py-3 text-on-surface-variant hover:text-primary hover:border-b-2 hover:border-outline-variant font-body-sm text-body-sm font-medium transition-all whitespace-nowrap';

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] relative">
      {/* SUTIL RETÍCULA DE INGENIERÍA CON MÁSCARA RADIAL (TECH GRID SPOTLIGHT) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(203, 213, 225, 0.55) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(203, 213, 225, 0.55) 1px, transparent 1px)
          `,
          backgroundSize: '24px 28px',
          maskImage: 'radial-gradient(ellipse 80% 65% at 50% 0%, #000 55%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 65% at 50% 0%, #000 55%, transparent 100%)'
        }}
        aria-hidden="true"
      />

      {/* HEADER INSTITUCIONAL */}
      <header className={`sticky top-0 z-40 w-full bg-surface-container-lowest border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(11,37,69,0.04)] transition-all duration-300 ${modoEnfoque ? '-translate-y-full max-h-0 opacity-0 overflow-hidden pointer-events-none' : 'translate-y-0 max-h-[300px] opacity-100'}`}>
        {/* Top Navbar */}
        <div className="w-full px-gutter-desktop py-2.5 flex items-center justify-between border-b border-outline-variant/20 bg-primary text-on-primary">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm">
              <img 
                alt="Logo FINI Ichilo" 
                className="h-9 w-auto object-contain" 
                src="/logo-ichilo.png" 
                onError={(e) => { e.target.src = '/logo-uagrm.png'; }}
              />
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-headline-md text-base font-bold text-on-primary truncate">Dirección de Carrera</span>
                <span className="font-caption text-caption text-secondary-fixed uppercase tracking-wider truncate">
                  Ingeniería de Sistemas — FINI
                </span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-space-xs bg-primary-container px-space-sm py-1 rounded text-on-primary">
              <span className="material-symbols-outlined text-sm text-secondary-fixed">location_on</span>
              <span className="font-caption text-caption text-on-primary/70">Sede Ichilo:</span>
              <span className="font-caption text-caption font-bold text-on-primary">Yapacaní, Santa Cruz</span>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            {/* Gestión Selector */}
            <div className="flex items-center gap-space-xs bg-primary-container px-space-sm py-1 rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary-fixed text-base">calendar_month</span>
              <span className="font-body-sm text-body-sm font-semibold text-on-primary">Gestión:</span>
              <select 
                className="bg-transparent font-body-sm text-body-sm font-bold text-secondary-fixed focus:outline-none cursor-pointer pr-space-xs"
                value={gestion}
                onChange={(e) => setGestion(e.target.value)}
              >
                {[
                  { val: (currentSystemYear || new Date().getFullYear()) + 1, label: `${(currentSystemYear || new Date().getFullYear()) + 1} - Proyección` },
                  { val: currentSystemYear || new Date().getFullYear(), label: `${currentSystemYear || new Date().getFullYear()} - Actual` },
                  { val: (currentSystemYear || new Date().getFullYear()) - 1, label: `${(currentSystemYear || new Date().getFullYear()) - 1} - Archivo` },
                  { val: (currentSystemYear || new Date().getFullYear()) - 2, label: `${(currentSystemYear || new Date().getFullYear()) - 2} - Histórico` },
                  { val: (currentSystemYear || new Date().getFullYear()) - 3, label: `${(currentSystemYear || new Date().getFullYear()) - 3} - Histórico` }
                ].map(item => (
                  <option key={item.val} className="text-on-surface" value={item.val}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-space-sm pr-space-xs border-l border-outline-variant/30 pl-space-md">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-secondary/40">
                {user?.nombre?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-body-sm text-body-sm font-semibold text-on-primary leading-tight">
                  {user?.nombre || 'Dirección de Carrera'}
                </span>
                <span className="font-caption text-caption text-secondary-fixed font-mono">
                  {user?.username ? `${user.username}@uagrm.edu.bo` : 'admin@uagrm.edu.bo'}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button 
              onClick={onLogout}
              className="p-space-xs rounded-lg text-secondary-fixed hover:bg-primary-container hover:text-on-primary transition-colors duration-150 flex items-center justify-center" 
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-lg leading-none">logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="w-full px-gutter-desktop flex items-center gap-space-xs overflow-x-auto bg-surface-container-lowest">
          <NavLink to="/panel" className={navLinkClasses}>
            <span className="material-symbols-outlined text-base leading-none">dashboard</span>
            <span>Panel de control</span>
          </NavLink>

          <NavLink to="/expedidos" className={navLinkClasses}>
            <span className="material-symbols-outlined text-base leading-none">outgoing_mail</span>
            <span>Documentos expedidos</span>
          </NavLink>

          <NavLink to="/recibidos" className={navLinkClasses}>
            <span className="material-symbols-outlined text-base leading-none">move_to_inbox</span>
            <span>Documentos recibidos</span>
            {pendientesCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-error text-on-error">
                {pendientesCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/actas" className={navLinkClasses}>
            <span className="material-symbols-outlined text-base leading-none">school</span>
            <span>Actas de graduación</span>
          </NavLink>

          <NavLink to="/auxiliares" className={navLinkClasses}>
            <span className="material-symbols-outlined text-base leading-none">badge</span>
            <span>Auxiliares de cátedra</span>
          </NavLink>

          <NavLink to="/docentes" className={navLinkClasses}>
            <span className="material-symbols-outlined text-base leading-none">supervised_user_circle</span>
            <span>Docentes</span>
          </NavLink>
        </nav>
      </header>

      {/* Botón flotante para restaurar cabecera cuando está en Modo Enfoque */}
      {modoEnfoque && (
        <button 
          onClick={() => setModoEnfoque(false)}
          className="fixed top-3 right-5 z-50 bg-[#07162c]/85 hover:bg-[#07162c] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer active:scale-95"
          type="button"
          title="Restaurar barra institucional"
        >
          <span className="material-symbols-outlined text-sm text-blue-300">fullscreen_exit</span>
          <span>Restaurar Cabecera</span>
        </button>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full flex-1 px-gutter-desktop py-space-lg pb-32 relative z-10 bg-transparent">
        <div className="max-w-[1440px] mx-auto w-full">
          {children}
        </div>
      </main>

      {/* PIE DE PÁGINA INSTITUCIONAL */}
      <footer className="w-full bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_-1px_6px_rgba(11,37,69,0.03)] py-space-lg border-t border-outline-variant/20 mt-auto pb-24 relative z-10">
        <div className="max-w-[1440px] mx-auto px-gutter-desktop flex flex-col md:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-caption text-caption">
          <div>
            <span className="font-semibold text-on-surface">UAGRM — Facultad Integral del Ichilo</span> · Sistema de Gestión Documental y Archivo Institucional
          </div>
          <div className="flex items-center gap-space-md">
            <span>Carrera de Ingeniería de Sistemas</span>
            <span>·</span>
            <span>Yapacaní - Santa Cruz, Bolivia</span>
          </div>
        </div>
      </footer>

      {/* GLOBAL DOCK (OPCIÓN 2: NAVEGACIÓN FLOTANTE & PANTALLA COMPLETA) */}
      <GlobalDock 
        gestion={gestion}
        setGestion={setGestion}
        pendientesCount={pendientesCount}
        user={user}
        onLogout={onLogout}
        modoEnfoque={modoEnfoque}
        setModoEnfoque={setModoEnfoque}
      />
    </div>
  );
};

export default Layout;
