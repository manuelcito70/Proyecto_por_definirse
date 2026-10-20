import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { getRecibidos } from '../services/api';
import TopNavDockTabs from './TopNavDockTabs';

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

      {/* HEADER INSTITUCIONAL SOLEMNE UAGRM FINI */}
      <header className="sticky top-0 z-40 w-full bg-[#07162b] shadow-[0_6px_20px_rgba(7,22,43,0.35)]">
        {/* Tricolor Ribbon Superior */}
        <div className="w-full h-1.5 flex">
          <div className="w-1/3 bg-[#c1121f]"></div>
          <div className="w-1/12 bg-[#c5a059]"></div>
          <div className="w-7/12 bg-[#15418c]"></div>
        </div>

        {/* Barra Principal Institucional */}
        <div className="w-full px-gutter-desktop py-2.5 flex items-center justify-between border-b border-white/10 bg-[#07162b] text-on-primary relative overflow-hidden">
          {/* Cortes geométricos diagonales de prestigio */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-[#c1121f]/20 via-transparent to-transparent pointer-events-none transform skew-x-[-24deg] translate-x-20"></div>
          <div className="absolute right-48 top-0 bottom-0 w-2 bg-[#c5a059]/40 pointer-events-none transform skew-x-[-24deg]"></div>

          {/* Logotipos y Membrete */}
          <div className="flex items-center gap-space-md relative z-10">
            <div className="flex items-center gap-2.5 bg-white/5 py-1 px-2.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-inner">
              <img 
                alt="Escudo UAGRM" 
                className="h-9 w-auto object-contain drop-shadow" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
                onError={(e) => { e.target.src = '/logo-uagrm.png'; }}
              />
              <div className="h-6 w-px bg-white/20"></div>
              <img 
                alt="Facultad Integral del Ichilo" 
                className="h-8 w-auto object-contain brightness-0 invert opacity-95" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDmrHQRn9Xf0Mz9nsMwjEP_7hhFBDxX6ioB8bhTmQGRc9cwL6pD3hw6YnRdna6A3RGoFBv5QzO8xS6ybYxKhKLpbY0t9JRyxyJYcpN-7Z3l_6tkXTrko141UaGtqIuHrFBMUeF5uRM1T22Jqo5FoUk0ZOIfAMGgge4OMFBwaSxqQlczL--jwZ1T6uzx6u3sajOp5l7HVPuThTPijaa-B7Oqxmh-CcAsgyccAIbzXxCxAqd1U-U7nOsomeIGGk-Y0K_"
                onError={(e) => { e.target.src = '/logo-ichilo.png'; }}
              />
            </div>

            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-space-sm">
                <span className="font-institutional-serif text-[17px] font-bold tracking-wider leading-none text-white uppercase drop-shadow-sm">
                  Dirección de Carrera
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-[#c1121f] to-[#9e0c18] text-white font-label-badge text-[10px] uppercase tracking-wider border border-white/20 shadow-sm">
                  Sede Ichilo: Yapacaní
                </span>
              </div>
              <span className="font-caption text-[11px] tracking-[0.14em] uppercase text-[#c5a059] font-semibold mt-1 flex items-center gap-1.5">
                <span>INGENIERÍA DE SISTEMAS</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">FINI — UAGRM</span>
              </span>
            </div>
          </div>

          {/* Selector de Gestión y Perfil de Usuario */}
          <div className="flex items-center gap-space-lg relative z-10">
            {/* Gestión Selector con Estilo Protocolar */}
            <div className="hidden sm:flex items-center gap-space-xs bg-gradient-to-r from-[#0d223f] to-[#0a1b33] px-space-md py-1.5 rounded-lg border border-[#c5a059]/30 text-white shadow-sm">
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
            <div className="flex items-center gap-space-md pl-space-md border-l border-white/10">
              <div className="hidden lg:flex flex-col text-right">
                <span className="font-body-sm text-body-sm font-semibold text-white leading-snug">
                  {user?.nombre || 'Dirección de Carrera'}
                </span>
                <span className="font-caption text-caption text-white/60">
                  {user?.username ? `${user.username}@uagrm.edu.bo` : 'admin@uagrm.edu.bo'}
                </span>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c1121f] to-[#8b0000] text-white flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-[#c5a059]/60 font-institutional-serif">
                  {user?.nombre?.charAt(0) || 'D'}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#07162b]"></span>
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center justify-center p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" 
                title="Cerrar sesión"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Barra de Navegación con Dock Zoom Tabs y Estado del Servidor */}
        <div className="w-full bg-surface-container-lowest border-b border-surface-container shadow-xs relative">
          <div className="max-w-[1440px] w-full mx-auto px-gutter-desktop flex items-center justify-between">
            <TopNavDockTabs pendientesCount={pendientesCount} />
            <div className="hidden xl:flex items-center gap-2 text-[11px] font-label-code text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded border border-surface-container shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>SED-ICHILO · SRV-01 ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full flex-1 px-gutter-desktop py-space-lg pb-12 relative bg-transparent">
        <div className="max-w-[1440px] mx-auto w-full">
          {children}
        </div>
      </main>

      {/* PIE DE PÁGINA INSTITUCIONAL SOLEMNE UAGRM FINI */}
      <footer className="w-full bg-[#07162b] text-white py-space-lg border-t-2 border-[#c1121f] relative mt-auto">
        <div className="h-0.5 w-full bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f] absolute top-0 left-0"></div>
        <div className="max-w-[1440px] mx-auto px-gutter-desktop flex flex-col md:flex-row items-center justify-between gap-space-sm text-white/70 font-caption text-caption">
          <div className="flex items-center gap-2">
            <img 
              alt="Escudo UAGRM" 
              className="h-5 w-auto object-contain opacity-80" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
              onError={(e) => { e.target.src = '/logo-uagrm.png'; }}
            />
            <span><strong className="text-white font-semibold">UAGRM — Facultad Integral del Ichilo</strong> · Sistema de Gestión Documental y Archivo Institucional</span>
          </div>
          <div className="flex items-center gap-space-md font-medium">
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
