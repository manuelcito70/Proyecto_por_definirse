import React, { useRef, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import './TopNavDockTabs.css';

/**
 * TopNavDockTabs
 * Barra de pestañas superiores con efecto de magnificación dock elástico tipo macOS.
 * Las pestañas aumentan de escala y se elevan suavemente al pasar el cursor (efecto lupa/onda),
 * con diseño institucional premium, bordes redondeados tipo píldora de vidrio y alta nitidez.
 * Íconos perfectamente centrados y alineados verticalmente con el texto.
 */
const TopNavDockTabs = ({ pendientesCount = 0 }) => {
  const navRef = useRef(null);
  const itemsRef = useRef([]);
  const rafRef = useRef(null);
  const isHoveredRef = useRef(false);

  const tabs = [
    {
      to: '/panel',
      label: 'Panel de control',
      icon: 'dashboard'
    },
    {
      to: '/expedidos',
      label: 'Documentos expedidos',
      icon: 'outgoing_mail'
    },
    {
      to: '/recibidos',
      label: 'Documentos recibidos',
      icon: 'move_to_inbox',
      badge: pendientesCount > 0 ? pendientesCount : null
    },
    {
      to: '/actas',
      label: 'Actas de graduación',
      icon: 'school'
    },
    {
      to: '/auxiliares',
      label: 'Auxiliares de cátedra',
      icon: 'badge'
    },
    {
      to: '/docentes',
      label: 'Docentes',
      icon: 'supervised_user_circle'
    }
  ];

  // Cálculo de onda de magnificación continua (Física de Dock macOS)
  const handleMouseMove = useCallback((e) => {
    isHoveredRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const mouseX = e.clientX;
      const radius = 170; // Radio de alcance de la onda en píxeles (cubre ~1.5 pestañas adyacentes)
      const maxScale = 0.18; // 18% de aumento máximo (escala hasta 1.18x en el foco del mouse)
      const maxLift = 4.0; // Elevación de 4px hacia arriba tipo dock flotante

      itemsRef.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const tabCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(mouseX - tabCenterX);

        if (distance < radius) {
          // Curva coseno elástica continua
          const factor = Math.cos((distance / radius) * (Math.PI / 2));
          const scale = 1 + factor * maxScale;
          const lift = factor * maxLift;
          el.style.setProperty('--tab-scale', scale.toFixed(3));
          el.style.setProperty('--tab-lift', `${lift.toFixed(1)}px`);
          el.style.setProperty('--tab-factor', factor.toFixed(2));
          el.style.zIndex = Math.round(10 + factor * 10);
          el.classList.add('dock-tab--active-wave');
        } else {
          el.style.setProperty('--tab-scale', '1');
          el.style.setProperty('--tab-lift', '0px');
          el.style.setProperty('--tab-factor', '0');
          el.style.zIndex = '1';
          el.classList.remove('dock-tab--active-wave');
        }
      });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    itemsRef.current.forEach((el) => {
      if (!el) return;
      el.style.setProperty('--tab-scale', '1');
      el.style.setProperty('--tab-lift', '0px');
      el.style.setProperty('--tab-factor', '0');
      el.style.zIndex = '';
      el.classList.remove('dock-tab--active-wave');
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="top-dock-nav"
      aria-label="Pestañas de navegación principal"
    >
      <div className="top-dock-container">
        {tabs.map((tab, idx) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            ref={(el) => (itemsRef.current[idx] = el)}
            className={({ isActive }) =>
              `dock-tab-item ${isActive ? 'dock-tab-item--active' : ''}`
            }
          >
            {/* Cápsula de fondo interactiva tipo glassmorphism */}
            <span className="dock-tab-glass" aria-hidden="true" />

            {/* Ícono institucional perfectamente centrado con zoom focal */}
            <span className="material-symbols-outlined dock-tab-icon" aria-hidden="true">
              {tab.icon}
            </span>

            {/* Etiqueta textual alineada al centro óptico */}
            <span className="dock-tab-label">{tab.label}</span>

            {/* Contador de pendientes dinámico */}
            {tab.badge && (
              <span className="dock-tab-badge">
                {tab.badge}
              </span>
            )}

            {/* Indicador de pestaña activa (línea luminosa tipo Apple) */}
            <span className="dock-tab-active-indicator" aria-hidden="true" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default TopNavDockTabs;
