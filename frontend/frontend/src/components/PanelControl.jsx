import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGestion } from '../context/GestionContext';
import { 
  getExpedidos, 
  getNextExpedidoNumber, 
  getRecibidos, 
  getActas, 
  getAuxiliares, 
  getDocentes,
  createExpedido
} from '../services/api';

const PanelControl = () => {
  const { gestion } = useGestion();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    expedidos: 0,
    recibidos: 0,
    recibidosPendientes: 0,
    actas: 0,
    auxiliares: 0,
    docentes: 0,
    nextOficio: 1
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick emit modal
  const [isQuickEmitOpen, setIsQuickEmitOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    destinatario: '',
    asunto: '',
    fecha: new Date().toISOString().split('T')[0],
    clasificacion: 'Nota Interna'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [expListRaw, nextOfRaw, recListRaw, actListRaw, auxListRaw, docListRaw] = await Promise.all([
          getExpedidos({ gestion }).catch(() => []),
          getNextExpedidoNumber(gestion).catch(() => ({ next: 1 })),
          getRecibidos({ gestion }).catch(() => []),
          getActas({ gestion }).catch(() => []),
          getAuxiliares({ gestion }).catch(() => []),
          getDocentes().catch(() => [])
        ]);

        const expList = Array.isArray(expListRaw) ? expListRaw : [];
        const recList = Array.isArray(recListRaw) ? recListRaw : [];
        const actList = Array.isArray(actListRaw) ? actListRaw : [];
        const auxList = Array.isArray(auxListRaw) ? auxListRaw : [];
        const docList = Array.isArray(docListRaw) ? docListRaw : [];
        const nextOf = (nextOfRaw && typeof nextOfRaw === 'object') ? nextOfRaw : { next: 1 };

        const pendRec = recList.filter(r => r && r.estado === 'pendiente').length;

        setMetrics({
          expedidos: expList.length,
          recibidos: recList.length,
          recibidosPendientes: pendRec,
          actas: actList.length,
          auxiliares: auxList.length,
          docentes: docList.length,
          nextOficio: nextOf.next || 1
        });

        // Combinar actividad reciente
        const activity = [
          ...expList.slice(0, 2).map(e => ({
            id: `exp-${e.id}`,
            tipo: 'expedido',
            color: 'bg-secondary',
            titulo: `Oficio N.° ${e.nro_oficio} expedido`,
            desc: `${e.asunto} · ${e.destinatario}`,
            fecha: e.fecha || 'Reciente'
          })),
          ...recList.slice(0, 2).map(r => ({
            id: `rec-${r.id}`,
            tipo: 'recibido',
            color: r.estado === 'pendiente' ? 'bg-amber-500' : 'bg-emerald-500',
            titulo: `Recepción: Interno #${String(r.nro_recibido).padStart(2, '0')}`,
            desc: `${r.asunto} · ${r.remitente}`,
            fecha: r.fecha || 'Reciente'
          })),
          ...actList.slice(0, 1).map(a => ({
            id: `act-${a.id}`,
            tipo: 'acta',
            color: 'bg-emerald-600',
            titulo: `Acta N.° ${a.nro_acta} registrada`,
            desc: `${a.nombre_estudiante} · ${a.modalidad}`,
            fecha: `${a.gestion}`
          }))
        ];

        setRecentActivity(activity);
      } catch (err) {
        console.error('Error cargando métricas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [gestion]);

  const handleQuickEmitSubmit = async (e) => {
    e.preventDefault();
    if (!quickForm.destinatario || !quickForm.asunto) {
      alert('Por favor complete destinatario y asunto.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('destinatario', quickForm.destinatario);
      data.append('asunto', `[${quickForm.clasificacion}] ${quickForm.asunto}`);
      data.append('fecha', quickForm.fecha);
      data.append('estado', 'completado');

      await createExpedido(data);
      setIsQuickEmitOpen(false);
      alert(`Oficio N.° ${metrics.nextOficio} generado exitosamente en gestión ${gestion}.`);
      navigate('/expedidos');
    } catch (err) {
      alert('Error al generar oficio: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-y-space-lg">
      {/* ENCABEZADO INSTITUCIONAL DE BIENVENIDA */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
        <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-primary-fixed/30 via-secondary/5 to-transparent blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-16 h-64 w-64 rounded-full bg-surface-container-highest/50 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-low px-space-md py-1 text-on-surface-variant font-label-badge text-caption mb-space-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-semibold text-emerald-800">Sistema en línea</span>
              <span className="text-outline-variant">·</span>
              <span>Base de datos activa FINI-UAGRM (Yapacaní)</span>
            </div>
            <h1 className="font-display text-display text-primary tracking-tight">
              Panel de Control y Archivo Documental
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
              Gestión {gestion} · Dirección de Carrera de Ingeniería de Sistemas — Facultad Integral del Ichilo
            </p>
          </div>

          {/* Quick Action / Date stamp */}
          <div className="flex items-center gap-space-md self-start lg:self-auto">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="font-label-code text-caption text-on-surface-variant uppercase tracking-wider">Período Activo</span>
              <span className="font-headline-md text-headline-md font-bold text-primary">Gestión {gestion}</span>
            </div>
            <div className="h-10 w-px bg-surface-container hidden sm:block"></div>
            <button 
              className="inline-flex items-center gap-space-xs rounded-lg bg-secondary px-space-lg py-2.5 font-body-sm font-semibold text-on-secondary shadow-md hover:bg-on-secondary-fixed-variant hover:shadow-lg transition-all duration-200" 
              onClick={() => setIsQuickEmitOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>

        {/* METRICS TICKER STRIP */}
        <div className="mt-space-xl grid grid-cols-2 md:grid-cols-4 gap-space-md pt-space-lg bg-surface-container-low/70 rounded-xl p-space-md">
          <div className="flex items-center gap-space-md px-space-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/expedidos')}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-2xl">outbox</span>
            </div>
            <div>
              <span className="block font-caption text-caption uppercase text-on-surface-variant font-semibold">Oficios Expedidos</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-correlative-counter text-correlative-counter text-primary font-bold">{metrics.expedidos}</span>
                <span className="font-label-code text-caption text-secondary font-bold">Gestión {gestion}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-md px-space-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/recibidos')}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-secondary">
              <span className="material-symbols-outlined text-2xl">move_to_inbox</span>
            </div>
            <div>
              <span className="block font-caption text-caption uppercase text-on-surface-variant font-semibold">Documentos Recibidos</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-correlative-counter text-correlative-counter text-primary font-bold">{metrics.recibidos}</span>
                <span className={`font-label-code text-caption font-bold ${metrics.recibidosPendientes > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {metrics.recibidosPendientes > 0 ? `${metrics.recibidosPendientes} Pendiente(s)` : 'Al día'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-md px-space-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/actas')}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <span className="block font-caption text-caption uppercase text-on-surface-variant font-semibold">Actas de Graduación</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-correlative-counter text-correlative-counter text-primary font-bold">{metrics.actas}</span>
                <span className="font-label-code text-caption text-emerald-700 font-bold">Copia CPD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-md px-space-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/auxiliares')}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-primary-fixed-variant">
              <span className="material-symbols-outlined text-2xl">group_work</span>
            </div>
            <div>
              <span className="block font-caption text-caption uppercase text-on-surface-variant font-semibold">Auxiliares de Cátedra</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-correlative-counter text-correlative-counter text-primary font-bold">{metrics.auxiliares}</span>
                <span className="font-label-code text-caption text-secondary font-bold">Activos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN CENTRAL: CUADRÍCULA DE TARJETAS DE ALTO IMPACTO */}
      <section className="mb-space-lg">
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Módulos Administrativos Centrales</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Acceso directo a expedientes, consecutivos institucionales y legajos oficiales</p>
          </div>
          <span className="font-label-code text-caption text-on-surface-variant uppercase tracking-wider bg-surface-container px-space-sm py-1 rounded">
            Sede Ichilo — Registro Legal
          </span>
        </div>

        {/* Dynamic 3-Column Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {/* CARD 1: DOCUMENTOS EXPEDIDOS */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary rounded-t-xl"></div>
            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">forward_to_inbox</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-space-sm py-0.5 font-label-badge text-caption font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> Consecutivo Estricto
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">Módulo 01</span>
              <h3 className="font-headline-md text-headline-md text-primary mt-0.5">Documentos Expedidos</h3>
              
              <div className="my-space-md rounded-lg bg-surface-container-low p-space-md">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Próximo Oficio a Expedir:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-secondary font-bold">N° {metrics.nextOficio}</span>
                  <span className="font-label-code text-caption text-on-surface-variant">/ GESTIÓN {gestion}</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface font-semibold">{metrics.expedidos} oficios registrados</strong>. Asignación numérica automática de uno en uno sin duplicidad.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md flex items-center justify-between gap-space-sm border-t border-outline-variant/20">
              <button 
                onClick={() => navigate('/expedidos')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-secondary hover:text-on-secondary-fixed-variant transition-colors"
              >
                <span>Entrar al módulo</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('/expedidos')}
                className="inline-flex items-center gap-1 rounded bg-secondary/10 hover:bg-secondary/20 text-secondary px-space-md py-1.5 font-label-code text-caption font-bold transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">add</span> Nuevo Oficio
              </button>
            </div>
          </div>

          {/* CARD 2: DOCUMENTOS RECIBIDOS */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-highest group-hover:bg-secondary transition-colors rounded-t-xl"></div>
            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">mark_email_unread</span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-space-sm py-0.5 font-label-badge text-caption font-bold ${metrics.recibidosPendientes > 0 ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${metrics.recibidosPendientes > 0 ? 'bg-amber-600' : 'bg-emerald-600'}`}></span> 
                  {metrics.recibidosPendientes > 0 ? `${metrics.recibidosPendientes} Requiere Acción` : 'Al día'}
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">Módulo 02</span>
              <h3 className="font-headline-md text-headline-md text-primary mt-0.5">Documentos Recibidos</h3>
              
              <div className="my-space-md rounded-lg bg-surface-container-low p-space-md">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Correlativo de Entrada:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-primary font-bold">
                    {String(metrics.recibidos + 1).padStart(2, '0')}
                  </span>
                  <span className="font-label-code text-caption text-on-surface-variant">/ {gestion} FINI-REC</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface font-semibold">{metrics.recibidos} documentos archivados</strong>. Respaldo íntegro de escaneos y control de respuestas pendientes.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md flex items-center justify-between gap-space-sm border-t border-outline-variant/20">
              <button 
                onClick={() => navigate('/recibidos')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-secondary hover:text-on-secondary-fixed-variant transition-colors"
              >
                <span>Ver recibidos</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('/recibidos')}
                className="inline-flex items-center gap-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface px-space-md py-1.5 font-label-code text-caption font-bold transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">document_scanner</span> Registrar Escaneo
              </button>
            </div>
          </div>

          {/* CARD 3: ACTAS DE GRADUACIÓN */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-highest group-hover:bg-secondary transition-colors rounded-t-xl"></div>
            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-on-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">school</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-900 px-space-sm py-0.5 font-label-badge text-caption font-bold">
                  Acreditación FINI
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">Módulo 03</span>
              <h3 className="font-headline-md text-headline-md text-primary mt-0.5">Actas de Graduación</h3>
              
              <div className="my-space-md rounded-lg bg-surface-container-low p-space-md">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Copia Oficial CPD Custodiada:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-primary font-bold">
                    {String(metrics.actas).padStart(2, '0')}
                  </span>
                  <span className="font-label-code text-caption text-secondary font-bold">Registros Certificados</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Modalidades: <strong className="text-on-surface font-semibold">Excelencia Académica</strong>, Buen Rendimiento, Tesis y Examen de Grado.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md flex items-center justify-between gap-space-sm border-t border-outline-variant/20">
              <button 
                onClick={() => navigate('/actas')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-secondary hover:text-on-secondary-fixed-variant transition-colors"
              >
                <span>Consultar actas</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <span className="font-caption text-caption text-on-surface-variant font-medium">Libro Tomo {gestion}</span>
            </div>
          </div>

          {/* CARD 4: AUXILIARES DE CÁTEDRA */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-highest group-hover:bg-secondary transition-colors rounded-t-xl"></div>
            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high text-primary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">badge</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-space-sm py-0.5 font-label-badge text-caption font-bold">
                  Convocatoria ICU
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">Módulo 04</span>
              <h3 className="font-headline-md text-headline-md text-primary mt-0.5">Auxiliares de Cátedra</h3>
              
              <div className="my-space-md rounded-lg bg-surface-container-low p-space-md">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Antecedentes Registrados:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-primary font-bold">
                    {String(metrics.auxiliares).padStart(2, '0')}
                  </span>
                  <span className="font-label-code text-caption text-on-surface-variant">Auxiliares Asignados</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Soporte y documentación para <strong className="text-on-surface font-semibold">Ratificación Semestre II</strong> y emisión de certificaciones oficiales.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md flex items-center justify-between gap-space-sm border-t border-outline-variant/20">
              <button 
                onClick={() => navigate('/auxiliares')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-secondary hover:text-on-secondary-fixed-variant transition-colors"
              >
                <span>Gestionar auxiliares</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('/auxiliares')}
                className="inline-flex items-center gap-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface px-space-md py-1.5 font-label-code text-caption font-bold transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">print</span> Emitir Constancia
              </button>
            </div>
          </div>

          {/* CARD 5: PLANTEL DOCENTE */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-highest group-hover:bg-secondary transition-colors rounded-t-xl"></div>
            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">supervisor_account</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-on-surface-variant px-space-sm py-0.5 font-label-badge text-caption font-bold">
                  Cuerpo Docente
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">Módulo 05</span>
              <h3 className="font-headline-md text-headline-md text-primary mt-0.5">Plantel Docente</h3>
              
              <div className="my-space-md rounded-lg bg-surface-container-low p-space-md">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Docentes Activos en Sede:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-primary font-bold">
                    {String(metrics.docentes).padStart(2, '0')}
                  </span>
                  <span className="font-label-code text-caption text-on-surface-variant">Titulares & Invitados</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Custodia institucional de <strong className="text-on-surface font-semibold">CVs vigentes</strong>, informes finales semestrales y listas de asistencia.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md flex items-center justify-between gap-space-sm border-t border-outline-variant/20">
              <button 
                onClick={() => navigate('/docentes')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-secondary hover:text-on-secondary-fixed-variant transition-colors"
              >
                <span>Expedientes docentes</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <span className="material-symbols-outlined text-on-surface-variant text-lg">folder_open</span>
            </div>
          </div>

          {/* CARD 6: DEPÓSITO DIGITAL SEGURO */}
          <div className="relative flex flex-col justify-between rounded-xl bg-gradient-to-br from-primary to-primary-container p-space-lg text-on-primary shadow-md hover:shadow-xl transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <span className="material-symbols-outlined text-3xl text-secondary-fixed">verified</span>
                <span className="font-label-code text-caption uppercase tracking-wider text-surface-container-highest bg-white/10 px-space-sm py-0.5 rounded">Servidor FINI</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-primary">Depósito Digital Seguro</h3>
              <p className="font-body-sm text-body-sm text-surface-container-high mt-1">
                Los expedientes cuentan con resguardo duplicado físico y digital conforme a la normativa institucional.
              </p>
              <div className="mt-space-lg space-y-space-sm">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-surface-container-high">Integridad de correlativos</span>
                  <span className="font-label-code text-caption text-secondary-fixed font-bold">100% OK</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary-fixed h-full rounded-full w-full"></div>
                </div>
                <div className="flex items-center justify-between text-body-sm pt-1">
                  <span className="text-surface-container-high">Base de Datos PostgreSQL</span>
                  <span className="font-label-code text-caption text-secondary-fixed font-bold">Conectada</span>
                </div>
              </div>
            </div>
            <div className="mt-space-xl pt-space-md flex items-center justify-between">
              <span className="font-caption text-caption text-surface-container-highest">Hash: SHA-256 Validado</span>
              <span className="inline-flex items-center gap-1 font-label-code text-caption text-secondary-fixed">
                Auditoría Activa
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE INFERIOR: ACCESOS Y AVISOS DE DIRECCIÓN */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg mb-space-lg">
        {/* REGULATORY NOTICE CARD (Span 2) */}
        <div className="lg:col-span-2 rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-space-sm text-error mb-space-xs">
              <span className="material-symbols-outlined text-xl">policy</span>
              <span className="font-label-badge text-caption uppercase tracking-wider font-bold">Normativa de Archivo Institucional</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary font-bold">
              Regla Estricta de Reinicio Anual de Correlativos
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
              Por instrucción de la Dirección de Carrera y el Decanato FINI, la numeración correlativa de oficios y recibidos se reinicia ininterrumpidamente a <strong className="text-on-surface">01</strong> al inaugurarse cada ejercicio anual. Todo documento emitido en la presente gestión <strong class="text-primary font-semibold">2026</strong> mantendrá validez bajo custodia hasta el cierre formal de actas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-md pt-space-sm">
              <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                <span className="material-symbols-outlined text-secondary text-lg mt-0.5">verified_user</span>
                <div>
                  <span className="font-body-sm font-semibold text-primary block">Salvaguarda Dual</span>
                  <span className="font-caption text-caption text-on-surface-variant">Impresión física firmada en archivo + escaneo PDF/A indexado.</span>
                </div>
              </div>
              <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                <span className="material-symbols-outlined text-secondary text-lg mt-0.5">history_edu</span>
                <div>
                  <span className="font-body-sm font-semibold text-primary block">Cierre de Gestión</span>
                  <span className="font-caption text-caption text-on-surface-variant">Numeración histórica archivada e inmutable por gestión.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-space-lg pt-space-md flex flex-wrap items-center justify-between gap-space-sm border-t border-outline-variant/20">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Servidor Local: Sede Ichilo Yapacaní</span>
            </div>
            <button 
              onClick={() => alert('Reglamento de Digitalización y Archivo Documental UAGRM: Todo documento oficial recibido en dirección debe registrarse con correlativo secuencial y resguardo en PDF/A sin alteración de contenido.')}
              className="text-secondary hover:text-on-secondary-fixed-variant font-body-sm font-semibold inline-flex items-center gap-1 transition-colors" 
              type="button"
            >
              <span>Ver reglamento documental</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* RECENT ACTIVITY SNAPSHOT (Span 1) */}
        <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <h4 className="font-headline-md text-headline-md text-primary font-bold">Actividad Reciente</h4>
              <span className="material-symbols-outlined text-on-surface-variant">notifications_active</span>
            </div>
            <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block mb-space-md">Sucesos en el archivo</span>
            
            {recentActivity.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant py-4 text-center">No hay actividad reciente registrada en {gestion}.</p>
            ) : (
              <ol className="space-y-space-md">
                {recentActivity.map((act) => (
                  <li key={act.id} className="flex items-start gap-space-sm">
                    <div className={`h-2.5 w-2.5 rounded-full ${act.color} mt-1.5 shrink-0`}></div>
                    <div>
                      <span className="font-body-sm font-semibold text-on-surface block leading-tight">{act.titulo}</span>
                      <p className="font-caption text-caption text-on-surface-variant line-clamp-1">{act.desc}</p>
                      <span className="font-label-code text-[11px] text-on-surface-variant/70">{act.fecha}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-space-lg pt-space-md border-t border-outline-variant/20">
            <button 
              onClick={() => navigate('/expedidos')}
              className="w-full flex items-center justify-center gap-space-xs py-2 rounded-lg bg-surface-container hover:bg-surface-container-high font-body-sm font-semibold text-on-surface transition-all"
            >
              <span className="material-symbols-outlined text-sm">history</span>
              <span>Ir a correspondencia oficial</span>
            </button>
          </div>
        </div>
      </section>

      {/* QUICK ACTION MODAL (Nuevo Oficio) */}
      {isQuickEmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-space-md" onClick={() => !submitting && setIsQuickEmitOpen(false)}>
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl p-space-xl shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="h-10 w-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">post_add</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Generar Nuevo Oficio</h3>
                  <span className="font-caption text-caption text-on-surface-variant font-label-code">
                    Correlativo asignado: N° {metrics.nextOficio} / {gestion}
                  </span>
                </div>
              </div>
              <button 
                className="p-1 rounded text-on-surface-variant hover:text-on-surface" 
                onClick={() => setIsQuickEmitOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickEmitSubmit} className="space-y-space-md">
              <div>
                <label className="block font-caption text-caption uppercase text-on-surface-variant font-bold mb-1">Destinatario / Entidad *</label>
                <input 
                  className="w-full rounded-lg bg-surface-container-low px-space-md py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" 
                  placeholder="Ej. Decano Fac. Integral del Ichilo - Dr. ..." 
                  value={quickForm.destinatario}
                  onChange={(e) => setQuickForm({ ...quickForm, destinatario: e.target.value })}
                  required 
                  type="text"
                />
              </div>

              <div>
                <label className="block font-caption text-caption uppercase text-on-surface-variant font-bold mb-1">Referencia / Asunto Oficial *</label>
                <input 
                  className="w-full rounded-lg bg-surface-container-low px-space-md py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" 
                  placeholder="Ej. Remisión de informes de auxiliares..." 
                  value={quickForm.asunto}
                  onChange={(e) => setQuickForm({ ...quickForm, asunto: e.target.value })}
                  required 
                  type="text"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-md">
                <div>
                  <label className="block font-caption text-caption uppercase text-on-surface-variant font-bold mb-1">Fecha de Expedición</label>
                  <input 
                    className="w-full rounded-lg bg-surface-container-low px-space-md py-2 text-body-sm text-on-surface focus:outline-none" 
                    type="date" 
                    value={quickForm.fecha}
                    onChange={(e) => setQuickForm({ ...quickForm, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-caption text-caption uppercase text-on-surface-variant font-bold mb-1">Clasificación</label>
                  <select 
                    className="w-full rounded-lg bg-surface-container-low px-space-md py-2 text-body-sm text-on-surface focus:outline-none"
                    value={quickForm.clasificacion}
                    onChange={(e) => setQuickForm({ ...quickForm, clasificacion: e.target.value })}
                  >
                    <option>Nota Interna</option>
                    <option>Oficio Rectorado</option>
                    <option>Certificación</option>
                    <option>Resolución de Carrera</option>
                  </select>
                </div>
              </div>

              <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-outline-variant/20">
                <button 
                  className="px-space-lg py-2 rounded-lg font-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all" 
                  onClick={() => setIsQuickEmitOpen(false)} 
                  type="button"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  className="px-space-lg py-2 rounded-lg bg-secondary text-on-secondary font-body-sm font-semibold shadow hover:bg-on-secondary-fixed-variant transition-all" 
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : `Reservar e Imprimir N.° ${metrics.nextOficio}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelControl;
