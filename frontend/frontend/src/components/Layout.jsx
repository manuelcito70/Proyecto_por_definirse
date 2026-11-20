import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useGestion } from '../context/GestionContext';
import { getRecibidos } from '../services/api';
import TopNavDockTabs from './TopNavDockTabs';
import NotificationBell from './NotificationBell';

const Layout = ({ user, onLogout, children }) => {
  const { gestion, setGestion, currentSystemYear } = useGestion();
  const [pendientesCount, setPendientesCount] = useState(0);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] relative w-full max-w-full overflow-x-hidden">
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

      {/* HEADER INSTITUCIONAL SOLEMNE UAGRM FINI */}
      <header className="sticky top-0 z-40 w-full bg-[#07162b] shadow-[0_6px_20px_rgba(7,22,43,0.35)]">
        {/* Tricolor Ribbon Superior */}
        <div className="w-full h-1.5 flex">
          <div className="w-1/3 bg-[#c1121f]"></div>
          <div className="w-1/12 bg-[#c5a059]"></div>
          <div className="w-7/12 bg-[#15418c]"></div>
        </div>

        {/* Barra Principal Institucional */}
        <div className="w-full px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between border-b border-white/10 bg-[#07162b] text-on-primary relative overflow-hidden">
          {/* Cortes geométricos diagonales de prestigio */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-[#c1121f]/20 via-transparent to-transparent pointer-events-none transform skew-x-[-24deg] translate-x-20"></div>
          <div className="absolute right-48 top-0 bottom-0 w-2 bg-[#c5a059]/40 pointer-events-none transform skew-x-[-24deg]"></div>

          {/* Logotipos y Membrete */}
          <div className="flex items-center gap-2 sm:gap-3.5 relative z-10 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2.5 bg-white/5 py-1 px-1.5 sm:px-2.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
              <img 
                alt="Escudo UAGRM" 
                className="h-7 sm:h-9 w-auto object-contain drop-shadow" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
                onError={(e) => { e.target.src = '/logo-uagrm.png'; }}
              />
              <div className="h-5 sm:h-6 w-px bg-white/20"></div>
              <img 
                alt="Facultad Integral del Ichilo" 
                className="h-6 sm:h-8 w-auto object-contain brightness-0 invert opacity-95 hidden xs:block sm:block" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDmrHQRn9Xf0Mz9nsMwjEP_7hhFBDxX6ioB8bhTmQGRc9cwL6pD3hw6YnRdna6A3RGoFBv5QzO8xS6ybYxKhKLpbY0t9JRyxyJYcpN-7Z3l_6tkXTrko141UaGtqIuHrFBMUeF5uRM1T22Jqo5FoUk0ZOIfAMGgge4OMFBwaSxqQlczL--jwZ1T6uzx6u3sajOp5l7HVPuThTPijaa-B7Oqxmh-CcAsgyccAIbzXxCxAqd1U-U7nOsomeIGGk-Y0K_"
                onError={(e) => { e.target.src = '/logo-ichilo.png'; }}
              />
            </div>

            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-institutional-serif text-[13px] sm:text-[17px] font-bold tracking-wider leading-none text-white uppercase drop-shadow-sm truncate">
                  Dirección de Carrera
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-[#c1121f] to-[#9e0c18] text-white font-label-badge text-[10px] uppercase tracking-wider border border-white/20 shadow-sm shrink-0">
                  Sede Ichilo: Yapacaní
                </span>
              </div>
              <span className="font-caption text-[9px] sm:text-[11px] tracking-wider uppercase text-[#c5a059] font-semibold mt-0.5 truncate flex items-center gap-1">
                <span>INGENIERÍA DE SISTEMAS</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">FINI — UAGRM</span>
              </span>
            </div>
          </div>

          {/* Selector de Gestión y Perfil de Usuario */}
          <div className="flex items-center gap-2 sm:gap-space-lg relative z-10 shrink-0">
            {/* Gestión Selector con Estilo Protocolar */}
            <div className="hidden sm:flex items-center gap-space-xs bg-gradient-to-r from-[#0d223f] to-[#0a1b33] px-2.5 sm:px-space-md py-1.5 rounded-lg border border-[#c5a059]/30 text-white shadow-sm">
              <span className="material-symbols-outlined text-[#c5a059] text-base">verified</span>
              <span className="font-body-sm text-body-sm font-semibold text-white/80 mr-1">Gestión:</span>
              <select 
                className="bg-transparent font-label-code text-label-code font-bold text-white focus:outline-none cursor-pointer pr-1"
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
                  <option key={item.val} className="text-[#07162b]" value={item.val}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Perfil Oficial */}
            <div className="flex items-center gap-1.5 sm:gap-space-md pl-1.5 sm:pl-space-md border-l border-white/10">
              {/* Campana de notificaciones: oficios pendientes y alertas */}
              <NotificationBell />
              <div className="hidden lg:flex flex-col text-right">
                <span className="font-body-sm text-body-sm font-semibold text-white leading-snug">
                  {user?.nombre || 'Dirección de Carrera'}
                </span>
                <span className="font-caption text-caption text-white/60">
                  {user?.username ? `${user.username}@uagrm.edu.bo` : 'admin@uagrm.edu.bo'}
                </span>
              </div>
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#c1121f] to-[#8b0000] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-inner ring-2 ring-[#c5a059]/60 font-institutional-serif shrink-0">
                  {user?.nombre?.charAt(0) || 'D'}
                </div>
                <span className="absolute bottom-0 right-0 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#07162b]"></span>
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0" 
                title="Cerrar sesión"
                type="button"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Barra de Navegación con Dock Zoom Tabs con scroll horizontal seguro */}
        <div className="w-full bg-surface-container-lowest border-b border-surface-container shadow-xs relative overflow-hidden">
          <div className="max-w-[1440px] w-full mx-auto px-2 sm:px-6 flex items-center justify-between min-w-0">
            <TopNavDockTabs pendientesCount={pendientesCount} />
            <div className="hidden xl:flex items-center gap-2 text-[11px] font-label-code text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded border border-surface-container shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>SED-ICHILO · SRV-01 ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL (Adaptable a celular con margen inferior para el dock móvil) */}
      <main className="w-full flex-1 px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-12 relative bg-transparent min-w-0 overflow-hidden">
        <div className="max-w-[1440px] mx-auto w-full min-w-0">
          {children}
        </div>
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR PARA CELULARES (Mobile Bottom Dock) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#07162b]/95 backdrop-blur-md border-t border-[#c5a059]/30 shadow-[0_-4px_25px_rgba(7,22,43,0.4)] px-2 py-1.5 flex items-center justify-around">
        <NavLink 
          to="/panel" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${isActive ? 'text-[#c5a059] font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span>Panel</span>
        </NavLink>
        <NavLink 
          to="/expedidos" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${isActive ? 'text-[#c5a059] font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-xl">outgoing_mail</span>
          <span>Expedidos</span>
        </NavLink>
        <NavLink 
          to="/recibidos" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all relative ${isActive ? 'text-[#c5a059] font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-xl">move_to_inbox</span>
          {pendientesCount > 0 && (
            <span className="absolute top-0.5 right-1 w-3.5 h-3.5 bg-[#c1121f] text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-1 ring-[#07162b]">
              {pendientesCount}
            </span>
          )}
          <span>Recibidos</span>
        </NavLink>
        <NavLink 
          to="/docentes" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${isActive ? 'text-[#c5a059] font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-xl">supervised_user_circle</span>
          <span>Docentes</span>
        </NavLink>
        <NavLink 
          to="/auxiliares" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${isActive ? 'text-[#c5a059] font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-xl">badge</span>
          <span>Auxiliares</span>
        </NavLink>
      </nav>

      {/* PIE DE PÁGINA INSTITUCIONAL SOLEMNE UAGRM FINI */}
      <footer className="w-full bg-[#07162b] text-white py-4 sm:py-6 border-t-2 border-[#c1121f] relative mt-auto px-3 sm:px-6 mb-14 md:mb-0">
        <div className="h-0.5 w-full bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f] absolute top-0 left-0"></div>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-white/70 font-caption text-xs text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <img 
              alt="Escudo UAGRM" 
              className="h-5 w-auto object-contain opacity-80" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
              onError={(e) => { e.target.src = '/logo-uagrm.png'; }}
            />
            <span><strong className="text-white font-semibold">UAGRM — Facultad Integral del Ichilo</strong> · SIGAD</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-[11px] justify-center md:justify-end">
            <span className="text-[#c5a059]">Carrera de Ingeniería de Sistemas</span>
            <span className="text-white/40">•</span>
            <span>Yapacaní - Santa Cruz, Bolivia</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
