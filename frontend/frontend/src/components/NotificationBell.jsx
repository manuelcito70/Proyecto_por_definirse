import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotificaciones } from '../services/api';

const NotificationBell = () => {
  const [data, setData] = useState({
    total: 0,
    urgentes: 0,
    avisos: 0,
    notificaciones: []
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const res = await getNotificaciones();
      if (res && Array.isArray(res.notificaciones)) {
        setData({
          total: res.total || res.notificaciones.length,
          urgentes: res.urgentes || 0,
          avisos: res.avisos || 0,
          notificaciones: res.notificaciones
        });
      }
    } catch (err) {
      // Fallo no bloqueante
      console.warn('No se pudieron sincronizar las notificaciones:', err.message);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Polling cada 60 segundos
    const timer = setInterval(fetchAlerts, 60000);
    return () => clearInterval(timer);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectNotif = (notif) => {
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const hasUrgent = data.urgentes > 0;
  const hasNotifications = data.total > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de la Campana */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchAlerts();
        }}
        className={`relative p-2 rounded-lg transition-all duration-150 flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-white/20 text-[#c5a059] ring-2 ring-[#c5a059]/40'
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
        title="Centro de Alertas y Notificaciones"
        aria-label="Notificaciones"
      >
        <span className="material-symbols-outlined text-2xl leading-none">
          {hasNotifications ? 'notifications_active' : 'notifications'}
        </span>

        {/* Badge Contador */}
        {hasNotifications && (
          <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-label-code text-[10px] font-bold text-white shadow-md border border-[#07162b] ${
            hasUrgent
              ? 'bg-[#c1121f] animate-pulse'
              : 'bg-amber-600'
          }`}>
            {data.total > 99 ? '99+' : data.total}
          </span>
        )}
      </button>

      {/* Menú Desplegable (Dropdown) */}
      {isOpen && (
        <div className="fixed right-4 top-[76px] w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header del Dropdown */}
          <div className="bg-gradient-to-r from-[#07162b] via-[#0b2545] to-[#134074] p-3.5 text-white flex items-center justify-between border-b border-[#c5a059]/30 relative">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c5a059] text-xl">notifications</span>
              <div>
                <h3 className="font-institutional-serif text-sm font-bold tracking-wide">
                  Alertas y Notificaciones
                </h3>
                <p className="text-[10px] text-white/70 font-caption">
                  Dirección de Carrera FINI — UAGRM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-label-code text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white">
                {data.total} {data.total === 1 ? 'aviso' : 'avisos'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Subheader con desglose de urgencias */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-label-code">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[#c1121f] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#c1121f] animate-pulse"></span>
                {data.urgentes} urgentes
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-amber-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {data.avisos} advertencias
              </span>
            </div>
            <button
              onClick={fetchAlerts}
              className="text-[10px] text-slate-500 hover:text-[#0b2545] font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">sync</span>
              Actualizar
            </button>
          </div>

          {/* Lista de Notificaciones con Scroll */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {!hasNotifications ? (
              <div className="p-6 text-center text-slate-500">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-2xl">task_alt</span>
                </div>
                <p className="font-institutional-serif text-sm font-bold text-[#0b2545]">
                  Todos los trámites al día
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  No existen documentos recibidos ni oficios pendientes con mora de atención.
                </p>
              </div>
            ) : (
              data.notificaciones.map((item) => {
                const esUrgente = item.nivel === 'urgente';
                return (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    onClick={() => handleSelectNotif(item)}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${
                      esUrgente
                        ? 'border-l-[#c1121f] bg-red-50/20'
                        : 'border-l-amber-500 bg-amber-50/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-label-badge uppercase ${
                          esUrgente
                            ? 'bg-red-100 text-[#c1121f]'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          <span className="material-symbols-outlined text-[11px]">
                            {esUrgente ? 'warning' : 'schedule'}
                          </span>
                          {esUrgente ? 'Urgente' : 'Aviso'}
                        </span>
                        <span className="font-label-code text-[11px] font-bold text-[#0b2545]">
                          #{item.nro} ({item.gestion})
                        </span>
                      </div>

                      <span className="font-label-code text-[10px] text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {item.dias_transcurridos}d de mora
                      </span>
                    </div>

                    <p className="font-body-sm text-xs font-semibold text-slate-800 line-clamp-1 mb-0.5">
                      {item.asunto}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[200px] text-slate-600">
                        {item.origen}
                      </span>
                      <span className="font-medium text-[#0b2545] hover:underline flex items-center gap-0.5">
                        {item.modulo}
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      {item.mensaje}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del Dropdown */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center font-caption text-[10px] text-slate-500">
            Sincronización periódica · Resguardo reglamentario UAGRM
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

