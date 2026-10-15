import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Dock from './Dock';

/**
 * Global Navigation Dock (UAGRM FINI - Sede Ichilo)
 * Implementa la Opción 2: Dock flotante de navegación global con físicas elásticas,
 * badges en tiempo real, cambio de gestión y Modo Enfoque (Pantalla Completa).
 */
const GlobalDock = ({
  gestion,
  setGestion,
  pendientesCount = 0,
  user,
  onLogout,
  modoEnfoque,
  setModoEnfoque
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const icon = (name, className = 'text-xl') => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
  );

  const items = [
    // 1. Panel de control
    {
      icon: icon('dashboard'),
      label: 'Panel de control',
      active: pathname === '/panel' || pathname === '/',
      onClick: () => navigate('/panel'),
      menu: [
        { label: '📊 Ir al Panel de Control', onClick: () => navigate('/panel') },
        { separator: true },
        { label: `Gestión Activa: ${gestion}`, disabled: true }
      ]
    },

    // 2. Documentos expedidos
    {
      icon: icon('outgoing_mail'),
      label: 'Documentos expedidos',
      active: pathname === '/expedidos',
      onClick: () => navigate('/expedidos'),
      menu: [
        { label: '✉️ Ver Oficios Expedidos', onClick: () => navigate('/expedidos') },
        { separator: true },
        { label: 'Numeración correlativa continua', disabled: true }
      ]
    },

    // 3. Documentos recibidos (con badge dinámico)
    {
      icon: icon('move_to_inbox'),
      label: 'Documentos recibidos',
      active: pathname === '/recibidos',
      badge: pendientesCount > 0 ? pendientesCount : undefined,
      onClick: () => navigate('/recibidos'),
      menu: [
        { label: '📥 Ver Correspondencia Recibida', onClick: () => navigate('/recibidos') },
        { separator: true },
        { 
          label: `${pendientesCount} trámites requieren respuesta`, 
          disabled: pendientesCount === 0 
        }
      ]
    },

    // 4. Actas de graduación
    {
      icon: icon('school'),
      label: 'Actas de graduación',
      active: pathname === '/actas',
      onClick: () => navigate('/actas'),
      menu: [
        { label: '🎓 Ver Libro de Actas', onClick: () => navigate('/actas') },
        { separator: true },
        { label: 'Dossier de defensas y notas', disabled: true }
      ]
    },

    // 5. Auxiliares de cátedra
    {
      icon: icon('badge'),
      label: 'Auxiliares de cátedra',
      active: pathname === '/auxiliares',
      onClick: () => navigate('/auxiliares'),
      menu: [
        { label: '👥 Ver Auxiliares de Cátedra', onClick: () => navigate('/auxiliares') },
        { separator: true },
        { label: 'Convocatorias y ratificaciones', disabled: true }
      ]
    },

    // 6. Docentes
    {
      icon: icon('supervised_user_circle'),
      label: 'Plantel Docente',
      active: pathname === '/docentes',
      onClick: () => navigate('/docentes'),
      menu: [
        { label: '👨‍🏫 Ver Directorio Docente', onClick: () => navigate('/docentes') },
        { separator: true },
        { label: 'Archivos semestrales y CVs', disabled: true }
      ]
    },

    // Separador
    { separator: true },

    // 7. Modo Enfoque / Pantalla Completa
    {
      icon: icon(modoEnfoque ? 'fullscreen_exit' : 'fullscreen'),
      label: modoEnfoque ? 'Restaurar Cabecera' : 'Modo Enfoque (Pantalla Completa)',
      active: Boolean(modoEnfoque),
      onClick: () => setModoEnfoque && setModoEnfoque(m => !m),
      menu: [
        {
          label: modoEnfoque ? '🔽 Mostrar Cabecera Institucional' : '🔼 Ocultar Cabecera (100% Pantalla)',
          onClick: () => setModoEnfoque && setModoEnfoque(m => !m)
        }
      ]
    },

    // 8. Opciones, Gestión & Sesión
    {
      icon: icon('settings'),
      label: `Gestión ${gestion}`,
      menu: [
        { 
          label: `📅 Gestión ${new Date().getFullYear()} (Actual)`, 
          checked: String(gestion) === String(new Date().getFullYear()), 
          onClick: () => setGestion && setGestion(String(new Date().getFullYear())) 
        },
        { 
          label: `📁 Gestión ${new Date().getFullYear() - 1} (Archivo)`, 
          checked: String(gestion) === String(new Date().getFullYear() - 1), 
          onClick: () => setGestion && setGestion(String(new Date().getFullYear() - 1)) 
        },
        { 
          label: `🏛️ Gestión ${new Date().getFullYear() - 2} (Histórico)`, 
          checked: String(gestion) === String(new Date().getFullYear() - 2), 
          onClick: () => setGestion && setGestion(String(new Date().getFullYear() - 2)) 
        },
        { 
          label: `🏛️ Gestión ${new Date().getFullYear() - 3} (Histórico)`, 
          checked: String(gestion) === String(new Date().getFullYear() - 3), 
          onClick: () => setGestion && setGestion(String(new Date().getFullYear() - 3)) 
        },
        { separator: true },
        { 
          label: `👤 Usuario: ${user?.nombre || 'Directora de Carrera'}`, 
          disabled: true 
        },
        { 
          label: '🚪 Cerrar Sesión', 
          onClick: onLogout 
        }
      ]
    }
  ];

  return (
    <Dock
      items={items}
      position="bottom"
      theme="uagrm"
      baseItemSize={48}
      magnification={70}
      distance={190}
      panelHeight={66}
      gap={10}
      roundness={0.65}
      bounce={true}
      showLabels={true}
      showIndicators={true}
      showBadges={true}
      badgeColor="#ef4444"
      accentColor="#2563eb"
    />
  );
};

export default GlobalDock;
