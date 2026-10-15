import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dock from './Dock';

/**
 * Dock de Gestión de Personal Académico (UAGRM FINI - Sede Ichilo)
 * Implementa la Idea 4: Dock flotante con físicas elásticas, badges y menús contextuales
 * para las vistas de Auxiliares de Cátedra y Plantel Docente.
 */
const PersonalAcademicoDock = ({
  tipo = 'auxiliares', // 'auxiliares' | 'docentes'
  totalItems = 0,
  onRegistrar,
  onGenerarConstancia,
  onGenerarInforme,
  onFiltrarCiclo,
  initialPosition = 'right'
}) => {
  const navigate = useNavigate();
  const [position, setPosition] = useState(initialPosition);
  const [showNormativaModal, setShowNormativaModal] = useState(false);

  // Íconos auxiliares como elementos React
  const icon = (name, className = 'text-xl') => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
  );

  const isAuxiliares = tipo === 'auxiliares';

  const dockItems = [
    // 1. Alternar entre las dos vistas académicas
    {
      icon: isAuxiliares ? icon('badge') : icon('school'),
      label: isAuxiliares ? 'Ir a Plantel Docente' : 'Ir a Auxiliares de Cátedra',
      active: true,
      onClick: () => navigate(isAuxiliares ? '/docentes' : '/auxiliares'),
      menu: [
        { 
          label: isAuxiliares ? '👨‍🏫 Ver Plantel Docente' : '🎓 Ver Auxiliares de Cátedra', 
          onClick: () => navigate(isAuxiliares ? '/docentes' : '/auxiliares') 
        },
        { 
          label: '📜 Ver Actas de Graduación', 
          onClick: () => navigate('/actas') 
        },
        { separator: true },
        { 
          label: '📊 Panel de Control Central', 
          onClick: () => navigate('/panel') 
        }
      ]
    },

    // 2. Registro Rápido con Badge de Total
    {
      icon: icon('person_add'),
      label: isAuxiliares ? 'Nuevo Auxiliar' : 'Nuevo Docente',
      badge: totalItems > 0 ? totalItems : undefined,
      onClick: onRegistrar,
      menu: [
        {
          label: isAuxiliares ? '+ Registrar Auxiliar de Cátedra' : '+ Registrar Docente Titular/Contratado',
          onClick: onRegistrar
        },
        { separator: true },
        { label: `Gestión Activa: 2026 (Sede Ichilo)`, disabled: true }
      ]
    },

    // 3. Constancias y Certificados Oficiales
    {
      icon: icon('verified'),
      label: isAuxiliares ? 'Constancias de Auxiliatura' : 'Informes y Certificaciones',
      onClick: onGenerarConstancia,
      menu: [
        {
          label: isAuxiliares ? '📄 Constancia Oficial de Cátedra (PDF)' : '📄 Certificación de Docencia',
          onClick: onGenerarConstancia
        },
        ...(onGenerarInforme ? [
          {
            label: '📊 Informe Semestral de Desempeño',
            onClick: onGenerarInforme
          }
        ] : []),
        { separator: true },
        {
          label: '🏛️ Archivo Central FINI UAGRM',
          disabled: true
        }
      ]
    },

    // 4. Etapas del Estatuto / Semestres
    {
      icon: icon(isAuxiliares ? 'account_tree' : 'calendar_month'),
      label: isAuxiliares ? 'Etapas de Convocatoria' : 'Ciclos Semestrales',
      onClick: () => {
        if (isAuxiliares) {
          const el = document.querySelector('.bg-surface-container-low.rounded-xl');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      },
      menu: isAuxiliares ? [
        {
          label: 'Etapa 1: Formulario CPD (Requerimiento)',
          onClick: () => {
            const el = document.querySelector('.bg-surface-container-low.rounded-xl');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        },
        {
          label: 'Etapa 2: Convocatoria y Examen de Competencia',
          onClick: () => {
            const el = document.querySelector('.bg-surface-container-low.rounded-xl');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        },
        {
          label: 'Etapa 3: Ratificación Consejo Facultativo',
          onClick: () => {
            const el = document.querySelector('.bg-surface-container-low.rounded-xl');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        },
        {
          label: 'Etapa 4: Designación y Posesión Oficial',
          onClick: () => {
            const el = document.querySelector('.bg-surface-container-low.rounded-xl');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      ] : [
        {
          label: '📅 Semestre I-2026',
          onClick: () => onFiltrarCiclo && onFiltrarCiclo('I-2026')
        },
        {
          label: '📅 Semestre II-2026',
          onClick: () => onFiltrarCiclo && onFiltrarCiclo('II-2026')
        },
        { separator: true },
        {
          label: '🔄 Ver Todos los Semestres',
          onClick: () => onFiltrarCiclo && onFiltrarCiclo('todos')
        }
      ]
    },

    // 5. Separador
    { separator: true },

    // 6. Normativa & Estatuto UAGRM
    {
      icon: icon('gavel'),
      label: 'Estatuto Orgánico UAGRM',
      onClick: () => setShowNormativaModal(true),
      menu: [
        {
          label: '📖 Ver Compendio Normativo UAGRM',
          onClick: () => setShowNormativaModal(true)
        },
        {
          label: '⚖️ Art. 45-52: Régimen Auxiliares',
          onClick: () => setShowNormativaModal(true)
        },
        {
          label: '🏛️ Art. 78-85: Régimen Docente FINI',
          onClick: () => setShowNormativaModal(true)
        }
      ]
    },

    // 7. Alternar Posición (Right / Bottom)
    {
      icon: icon(position === 'right' ? 'dock_to_right' : 'dock_to_bottom'),
      label: position === 'right' ? 'Mover al Fondo' : 'Mover al Lateral',
      onClick: () => setPosition(p => p === 'right' ? 'bottom' : 'right'),
      menu: [
        {
          label: '📌 Anclar al Lateral Derecho (Recomendado)',
          checked: position === 'right',
          onClick: () => setPosition('right')
        },
        {
          label: '📌 Anclar al Fondo (Inferior)',
          checked: position === 'bottom',
          onClick: () => setPosition('bottom')
        }
      ]
    }
  ];

  return (
    <>
      {/* Dock Flotante */}
      <Dock
        items={dockItems}
        position={position}
        theme="uagrm"
        baseItemSize={46}
        magnification={66}
        distance={170}
        panelHeight={62}
        gap={8}
        roundness={0.6}
        bounce={true}
        showLabels={true}
        showIndicators={true}
        showBadges={true}
        badgeColor="#ef4444"
        accentColor="#2563eb"
      />

      {/* MODAL INFORMATIVO: ESTATUTO ORGÁNICO UAGRM */}
      {showNormativaModal && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#07162c]/80 backdrop-blur-md transition-all duration-300"
          onClick={() => setShowNormativaModal(false)}
        >
          <div 
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform transition-all flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Cabecera Azul UAGRM */}
            <div className="bg-gradient-to-r from-[#07162c] via-[#0b2545] to-[#134074] px-6 py-4 border-b border-white/10 flex items-center justify-between text-white relative">
              <div className="flex items-center space-x-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
                  <span className="material-symbols-outlined text-2xl">gavel</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base tracking-wide text-white">
                      Estatuto Orgánico & Normativa UAGRM
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 tracking-wider">
                      FINI - SISTEMAS
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200/80">Sede Ichilo: Yapacaní, Santa Cruz</p>
                </div>
              </div>
              <button 
                className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl border border-white/10 transition-all cursor-pointer" 
                onClick={() => setShowNormativaModal(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base block">close</span>
              </button>
            </div>

            {/* Contenido de la Normativa */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-4 text-slate-700 text-sm bg-gradient-to-b from-slate-50/50 to-white">
              {/* Sección Auxiliares */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <span className="material-symbols-outlined text-blue-600 text-lg">school</span>
                  <span>Título IV, Cap. II — Régimen de Auxiliares de Docencia (Cátedra)</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 leading-relaxed pl-1">
                  <li><strong>Art. 45 (Requisitos):</strong> Estudiante regular con matrícula vigente, haber aprobado la materia con nota destacada y no tener sanciones académicas ni disciplinarias.</li>
                  <li><strong>Art. 48 (Ingreso):</strong> Todo auxiliar de cátedra debe ser seleccionado por <em>Concurso de Méritos y Examen de Competencia</em>, o por <em>Propuesta del Consejo Facultativo</em>.</li>
                  <li><strong>Art. 52 (Ratificación Semestral):</strong> Para continuidad del semestre I al semestre II se requiere informe favorable de cumplimiento de horas firmado por el docente titular y la Dirección de Carrera.</li>
                  <li><strong>Art. 55 (Incompatibilidad):</strong> Queda prohibido desempeñar más de dos auxiliaturas simultáneas salvo autorización expresa de Decanato.</li>
                </ul>
              </div>

              {/* Sección Plantel Docente */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold">
                  <span className="material-symbols-outlined text-indigo-600 text-lg">badge</span>
                  <span>Título IV, Cap. I — Régimen Docente & Archivo Semestral</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 leading-relaxed pl-1">
                  <li><strong>Art. 78 (Programa Analítico):</strong> Todo docente debe consignar en Dirección de Carrera el programa analítico actualizado al inicio de cada gestión o semestre.</li>
                  <li><strong>Art. 82 (Informe Final y Asistencia):</strong> Es requisito indispensable para el cierre de semestre la entrega formal de la lista de asistencia de alumnos y el informe de avance de materia.</li>
                  <li><strong>Art. 85 (Hoja de Vida):</strong> El legajo personal y CV respaldatorio deben permanecer actualizados en el archivo físico y digital de la Carrera de Sistemas en Sede Ichilo.</li>
                </ul>
              </div>

              {/* Validez Legal */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs">
                <span className="material-symbols-outlined text-amber-600 mt-0.5 text-base">shield</span>
                <p className="text-[11px] leading-relaxed font-medium">
                  Información oficial sincronizada con el Consejo Facultativo FINI UAGRM. Los registros y constancias generados en este sistema cuentan con validez administrativa plena.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-700 shadow-md transition-all cursor-pointer"
                onClick={() => setShowNormativaModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonalAcademicoDock;
