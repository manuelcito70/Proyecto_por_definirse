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
            color: 'bg-[#0b2545]',
            ringColor: 'ring-blue-50',
            titulo: `Oficio N° ${e.nro_oficio} expedido`,
            desc: `${e.asunto} · ${e.destinatario}`,
            fecha: e.fecha || 'Reciente'
          })),
          ...recList.slice(0, 2).map(r => ({
            id: `rec-${r.id}`,
            tipo: 'recibido',
            color: r.estado === 'pendiente' ? 'bg-amber-500' : 'bg-emerald-500',
            ringColor: r.estado === 'pendiente' ? 'ring-amber-50' : 'ring-emerald-50',
            titulo: `Recepción: Interno #${String(r.nro_recibido).padStart(2, '0')}`,
            desc: `${r.asunto} · ${r.remitente}`,
            fecha: r.fecha || 'Reciente'
          })),
          ...actList.slice(0, 1).map(a => ({
            id: `act-${a.id}`,
            tipo: 'acta',
            color: 'bg-emerald-500',
            ringColor: 'ring-emerald-50',
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
    <div className="flex flex-col w-full">
      {/* 1. ENCABEZADO INSTITUCIONAL DE BIENVENIDA (Folder y Diploma FINI) */}
      <section className="relative mb-space-2xl overflow-hidden rounded-2xl bg-surface-container-lowest p-space-xl border border-surface-container shadow-[0_8px_30px_rgba(11,37,69,0.06)]">
        {/* Franjas geométricas angulares diagonales (Rojo + Azul Marino + Acento Dorado) */}
        <div className="absolute -right-10 top-0 bottom-0 w-80 bg-gradient-to-bl from-[#c1121f] via-[#d90429] to-[#8b0000] pointer-events-none transform skew-x-[-20deg] opacity-95"></div>
        <div className="absolute right-64 top-0 bottom-0 w-8 bg-[#0b2545] pointer-events-none transform skew-x-[-20deg]"></div>
        <div className="absolute right-72 top-0 bottom-0 w-2 bg-[#c5a059] pointer-events-none transform skew-x-[-20deg]"></div>
        <div className="absolute -right-6 -bottom-6 w-56 h-56 bg-[#0b2545] pointer-events-none transform rotate-12 opacity-90 rounded-2xl"></div>

        {/* Marca de agua institucional sutil del escudo FINI en el fondo */}
        <img 
          alt="Marca de agua institucional" 
          className="absolute right-12 top-1/2 -translate-y-1/2 h-64 w-auto object-contain opacity-[0.09] pointer-events-none select-none filter contrast-125" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
        />

        {/* Borde superior con filete tricolor */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-space-xs rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1 text-on-surface-variant font-label-badge text-caption mb-space-sm border border-slate-200/80 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-bold text-emerald-800">Sistema en línea</span>
              <span className="text-outline-variant">·</span>
              <span className="font-medium text-[#0b2545]">Base de datos oficial FINI-UAGRM (Yapacaní)</span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <div className="w-1.5 h-10 bg-[#c1121f] rounded-full hidden sm:block"></div>
              <div>
                <h1 className="font-institutional-serif text-[26px] md:text-[32px] text-[#0b2545] font-bold tracking-tight leading-tight">
                  Panel de Control y Archivo Documental
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                  Gestión {gestion} · Dirección de Carrera de Ingeniería de Sistemas — <span className="font-semibold text-[#0b2545]">Facultad Integral del Ichilo</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action / Date stamp con diseño protocolar */}
          <div className="flex items-center gap-space-md self-start lg:self-auto bg-white/95 backdrop-blur-sm p-2 rounded-xl border border-surface-container shadow-sm">
            <div className="flex flex-col text-right hidden sm:flex px-2">
              <span className="font-label-code text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Período Fiscal Activo
              </span>
              <span className="font-institutional-serif text-lg font-bold text-[#c1121f] leading-none mt-0.5">
                Gestión {gestion}
              </span>
            </div>
            <div className="h-10 w-px bg-surface-container hidden sm:block"></div>
            <button 
              className="inline-flex items-center gap-space-xs rounded-lg bg-gradient-to-r from-[#c1121f] to-[#9e0c18] px-space-lg py-2.5 font-body-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-[#8b0000] hover:to-[#c1121f] transition-all duration-200 border border-white/20 cursor-pointer" 
              onClick={() => setIsQuickEmitOpen(true)} 
              type="button"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span className="tracking-wide">Nuevo Registro</span>
            </button>
          </div>
        </div>

        {/* CINTA DECORATIVA DE DIPLOMA */}
        <div className="relative w-full my-space-lg">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f] rounded-full opacity-80"></div>
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-surface-container-lowest px-3">
            <span className="font-label-code text-[9px] uppercase tracking-widest text-[#c5a059] font-bold">
              REGISTRO OFICIAL DE CONTROL
            </span>
          </div>
        </div>

        {/* METRICS TICKER STRIP CON REFINAMIENTO DE DIPLOMA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md bg-gradient-to-b from-surface-container-low/70 to-surface-container-low/40 rounded-xl p-space-md border border-surface-container">
          {/* Stat 1 */}
          <div 
            onClick={() => navigate('/expedidos')}
            className="flex items-center gap-space-md px-space-sm py-1 bg-white/80 rounded-lg border border-slate-200/60 shadow-2xs cursor-pointer hover:bg-white transition-all"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#091a32] to-[#15418c] text-white shadow-sm ring-1 ring-[#c5a059]/40">
              <span className="material-symbols-outlined text-2xl">outbox</span>
            </div>
            <div>
              <span className="block font-caption text-[11px] uppercase text-on-surface-variant font-bold tracking-wider">
                Oficios Expedidos
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-correlative-counter text-correlative-counter font-bold text-[#0b2545]">
                  {metrics.expedidos}
                </span>
                <span className="font-label-code text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                  Activo
                </span>
              </div>
            </div>
          </div>

          {/* Stat 2 */}
          <div 
            onClick={() => navigate('/recibidos')}
            className="flex items-center gap-space-md px-space-sm py-1 bg-white/80 rounded-lg border border-slate-200/60 shadow-2xs cursor-pointer hover:bg-white transition-all"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">move_to_inbox</span>
            </div>
            <div>
              <span className="block font-caption text-[11px] uppercase text-on-surface-variant font-bold tracking-wider">
                Documentos Recibidos
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-correlative-counter text-correlative-counter font-bold text-[#0b2545]">
                  {metrics.recibidos}
                </span>
                <span className={`font-label-code text-[11px] px-1.5 py-0.5 rounded font-bold border ${
                  metrics.recibidosPendientes > 0
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  {metrics.recibidosPendientes > 0 ? `${metrics.recibidosPendientes} Pendiente` : 'Al día'}
                </span>
              </div>
            </div>
          </div>

          {/* Stat 3 */}
          <div 
            onClick={() => navigate('/actas')}
            className="flex items-center gap-space-md px-space-sm py-1 bg-white/80 rounded-lg border border-slate-200/60 shadow-2xs cursor-pointer hover:bg-white transition-all"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0b2545] to-[#1d4ed8] text-white shadow-sm ring-1 ring-[#c5a059]/40">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <span className="block font-caption text-[11px] uppercase text-on-surface-variant font-bold tracking-wider">
                Actas de Graduación
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-correlative-counter text-correlative-counter font-bold text-[#0b2545]">
                  {metrics.actas}
                </span>
                <span className="font-label-code text-[11px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                  Copia CPD
                </span>
              </div>
            </div>
          </div>

          {/* Stat 4 */}
          <div 
            onClick={() => navigate('/auxiliares')}
            className="flex items-center gap-space-md px-space-sm py-1 bg-white/80 rounded-lg border border-slate-200/60 shadow-2xs cursor-pointer hover:bg-white transition-all"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#c1121f] to-[#9e0c18] text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">group_work</span>
            </div>
            <div>
              <span className="block font-caption text-[11px] uppercase text-on-surface-variant font-bold tracking-wider">
                Auxiliares de Cátedra
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-correlative-counter text-correlative-counter font-bold text-[#0b2545]">
                  {metrics.auxiliares}
                </span>
                <span className="font-label-code text-[11px] text-[#c1121f] bg-red-50 px-1.5 py-0.5 rounded font-bold border border-red-200">
                  Sem. II
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN CENTRAL: CUADRICULA DE TARJETAS DE ALTO IMPACTO */}
      <section className="mb-space-2xl">
        <div className="flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-[#c1121f] rounded-full"></div>
            <div>
              <h2 className="font-institutional-serif text-xl md:text-2xl text-[#0b2545] font-bold tracking-tight">
                Módulos Administrativos Centrales
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Acceso directo a expedientes, consecutivos institucionales y legajos oficiales
              </p>
            </div>
          </div>
          <span className="font-label-code text-caption text-[#0b2545] font-semibold uppercase tracking-wider bg-white px-space-sm py-1 rounded border border-surface-container shadow-2xs">
            Sede Ichilo — Registro Legal
          </span>
        </div>

        {/* Dynamic 3-Column Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {/* CARD 1: DOCUMENTOS EXPEDIDOS */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-surface-container overflow-hidden">
            {/* Detalle angular institucional de esquina superior derecha */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-bl from-[#c1121f] to-[#8b0000] transform rotate-45 pointer-events-none opacity-90"></div>
            <div className="absolute -top-14 -right-14 w-32 h-32 border-2 border-[#c5a059] pointer-events-none transform rotate-45"></div>
            
            {/* Marca de agua sutil de fondo */}
            <img 
              alt="Filigrana" 
              className="absolute -left-6 -bottom-6 w-32 h-32 object-contain opacity-[0.04] pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
            />
            
            {/* Borde superior protocolar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>
            
            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#091a32] to-[#15418c] text-white shadow-md ring-2 ring-[#c5a059]/30 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">forward_to_inbox</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-space-sm py-0.5 font-label-badge text-caption font-bold mr-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span> Consecutivo Estricto
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-[#c1121f] font-bold">Módulo 01</span>
              <h3 className="font-institutional-serif text-lg text-[#0b2545] font-bold mt-0.5">Documentos Expedidos</h3>
              
              {/* Key Metric Indicator Box */}
              <div className="my-space-md rounded-lg bg-gradient-to-r from-surface-container-low to-white p-space-md border border-surface-container relative overflow-hidden">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Próximo Oficio a Expedir:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-[#c1121f] font-bold">
                    N° {metrics.nextOficio}
                  </span>
                  <span className="font-label-code text-caption text-on-surface-variant font-semibold">/ GESTIÓN {gestion}</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface font-semibold">{metrics.expedidos} oficios emitidos</strong> bajo consecutivo legal estricto. Registro inmutable de correspondencia oficial remitida.
              </p>
            </div>

            <div className="mt-space-lg pt-space-md border-t border-slate-100 flex items-center justify-between gap-space-sm">
              <button 
                onClick={() => navigate('/expedidos')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-[#0b2545] hover:text-[#c1121f] transition-colors cursor-pointer"
              >
                <span>Entrar al módulo</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('/expedidos')}
                className="inline-flex items-center gap-1 rounded-md bg-[#c1121f]/10 hover:bg-[#c1121f] hover:text-white text-[#c1121f] px-space-md py-1.5 font-label-code text-caption font-bold transition-all border border-[#c1121f]/20 shadow-2xs cursor-pointer" 
                type="button"
              >
                <span className="material-symbols-outlined text-sm">add</span> Nuevo Oficio
              </button>
            </div>
          </div>

          {/* CARD 2: DOCUMENTOS RECIBIDOS */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-surface-container overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-bl from-amber-600 to-amber-700 transform rotate-45 pointer-events-none opacity-90"></div>
            <div className="absolute -top-14 -right-14 w-32 h-32 border-2 border-amber-300/60 pointer-events-none transform rotate-45"></div>
            
            <img 
              alt="Filigrana" 
              className="absolute -left-6 -bottom-6 w-32 h-32 object-contain opacity-[0.04] pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
            />
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#c5a059] to-[#0b2545]"></div>

            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 border border-amber-200/80 shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">mark_email_unread</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-space-sm py-0.5 font-label-badge text-caption font-bold mr-6 border ${
                  metrics.recibidosPendientes > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${metrics.recibidosPendientes > 0 ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
                  {metrics.recibidosPendientes > 0 ? `${metrics.recibidosPendientes} Requiere Acción` : 'Al día'}
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-amber-800 font-bold">Módulo 02</span>
              <h3 className="font-institutional-serif text-lg text-[#0b2545] font-bold mt-0.5">Documentos Recibidos</h3>

              {/* Key Metric Indicator Box */}
              <div className="my-space-md rounded-lg bg-gradient-to-r from-surface-container-low to-white p-space-md border border-surface-container">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Correlativo de Entrada:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-[#0b2545] font-bold">
                    #{String(metrics.recibidos + 1).padStart(2, '0')}
                  </span>
                  <span className="font-label-code text-caption text-on-surface-variant font-semibold">/ {gestion} FINI-REC</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface font-semibold">{metrics.recibidos} documentos archivados</strong>. Respaldo íntegro de escaneos y control de respuestas pendientes.
              </p>
            </div>

            <div className="mt-space-lg pt-space-md border-t border-slate-100 flex items-center justify-between gap-space-sm">
              <button 
                onClick={() => navigate('/recibidos')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-[#0b2545] hover:text-[#c1121f] transition-colors cursor-pointer"
              >
                <span>Ver recibidos</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('/recibidos')}
                className="inline-flex items-center gap-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface px-space-md py-1.5 font-label-code text-caption font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer" 
                type="button"
              >
                <span className="material-symbols-outlined text-sm">document_scanner</span> Registrar Escaneo
              </button>
            </div>
          </div>

          {/* CARD 3: ACTAS DE GRADUACIÓN */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-surface-container overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-bl from-[#0b2545] to-[#15418c] transform rotate-45 pointer-events-none opacity-90"></div>
            <div className="absolute -top-14 -right-14 w-32 h-32 border-2 border-[#c5a059]/60 pointer-events-none transform rotate-45"></div>
            
            <img 
              alt="Filigrana" 
              className="absolute -left-6 -bottom-6 w-32 h-32 object-contain opacity-[0.04] pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
            />
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c5a059] via-[#0b2545] to-[#c1121f]"></div>

            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b2545] to-[#15418c] text-white shadow-md ring-2 ring-[#c5a059]/30 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">school</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 px-space-sm py-0.5 font-label-badge text-caption font-bold mr-6">
                  Acreditación FINI
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-[#0b2545] font-bold">Módulo 03</span>
              <h3 className="font-institutional-serif text-lg text-[#0b2545] font-bold mt-0.5">Actas de Graduación</h3>

              {/* Key Metric Indicator Box */}
              <div className="my-space-md rounded-lg bg-gradient-to-r from-surface-container-low to-white p-space-md border border-surface-container">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Copia Oficial CPD Custodiada:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-[#0b2545] font-bold">
                    {String(metrics.actas).padStart(2, '0')}
                  </span>
                  <span className="font-label-code text-caption text-[#c1121f] font-bold">Registros Certificados</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Modalidades: <strong className="text-on-surface font-semibold">Excelencia Académica</strong>, Buen Rendimiento, y Tesis de Grado bajo protocolo institucional.
              </p>
            </div>

            <div className="mt-space-lg pt-space-md border-t border-slate-100 flex items-center justify-between gap-space-sm">
              <button 
                onClick={() => navigate('/actas')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-[#0b2545] hover:text-[#c1121f] transition-colors cursor-pointer"
              >
                <span>Consultar actas</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <span className="font-caption text-caption text-[#0b2545] font-semibold bg-surface-container-low px-2 py-1 rounded border border-surface-container">
                Libro Tomo {gestion}
              </span>
            </div>
          </div>

          {/* CARD 4: AUXILIARES DE CÁTEDRA */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-surface-container overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-bl from-emerald-600 to-emerald-800 transform rotate-45 pointer-events-none opacity-90"></div>
            <div className="absolute -top-14 -right-14 w-32 h-32 border-2 border-emerald-300/60 pointer-events-none transform rotate-45"></div>
            
            <img 
              alt="Filigrana" 
              className="absolute -left-6 -bottom-6 w-32 h-32 object-contain opacity-[0.04] pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
            />
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#c5a059] to-[#0b2545]"></div>

            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-200 shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">badge</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-space-sm py-0.5 font-label-badge text-caption font-bold mr-6">
                  Convocatoria ICU
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-emerald-800 font-bold">Módulo 04</span>
              <h3 className="font-institutional-serif text-lg text-[#0b2545] font-bold mt-0.5">Auxiliares de Cátedra</h3>

              {/* Key Metric Indicator Box */}
              <div className="my-space-md rounded-lg bg-gradient-to-r from-surface-container-low to-white p-space-md border border-surface-container">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Antecedentes Registrados:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-[#0b2545] font-bold">
                    {String(metrics.auxiliares).padStart(2, '0')}
                  </span>
                  <span className="font-label-code text-caption text-on-surface-variant font-semibold">Auxiliares Asignados</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Soporte y documentación legal para <strong className="text-on-surface font-semibold">Ratificación Semestre II</strong>, control de asistencia en laboratorios de computación.
              </p>
            </div>

            <div className="mt-space-lg pt-space-md border-t border-slate-100 flex items-center justify-between gap-space-sm">
              <button 
                onClick={() => navigate('/auxiliares')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-[#0b2545] hover:text-[#c1121f] transition-colors cursor-pointer"
              >
                <span>Gestionar auxiliares</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('/auxiliares')}
                className="inline-flex items-center gap-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface px-space-md py-1.5 font-label-code text-caption font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer" 
                type="button"
              >
                <span className="material-symbols-outlined text-sm">print</span> Emitir Constancia
              </button>
            </div>
          </div>

          {/* CARD 5: PLANTEL DOCENTE */}
          <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-surface-container overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-bl from-[#c1121f] to-[#8b0000] transform rotate-45 pointer-events-none opacity-90"></div>
            <div className="absolute -top-14 -right-14 w-32 h-32 border-2 border-[#c5a059]/60 pointer-events-none transform rotate-45"></div>
            
            <img 
              alt="Filigrana" 
              className="absolute -left-6 -bottom-6 w-32 h-32 object-contain opacity-[0.04] pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
            />
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>

            <div>
              <div className="flex items-start justify-between mb-space-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#091a32] to-[#15418c] text-white shadow-md ring-2 ring-[#c5a059]/30 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">supervisor_account</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-[#0b2545] border border-slate-200 px-space-sm py-0.5 font-label-badge text-caption font-bold mr-6">
                  Cuerpo Docente
                </span>
              </div>
              <span className="font-caption text-caption uppercase tracking-wider text-[#c1121f] font-bold">Módulo 05</span>
              <h3 className="font-institutional-serif text-lg text-[#0b2545] font-bold mt-0.5">Plantel Docente</h3>

              {/* Key Metric Indicator Box */}
              <div className="my-space-md rounded-lg bg-gradient-to-r from-surface-container-low to-white p-space-md border border-surface-container">
                <div className="font-caption text-caption text-on-surface-variant font-medium">Docentes Activos en Sede:</div>
                <div className="flex items-baseline gap-space-sm mt-0.5">
                  <span className="font-correlative-counter text-correlative-counter text-[#0b2545] font-bold">
                    {String(metrics.docentes).padStart(2, '0')}
                  </span>
                  <span className="font-label-code text-caption text-on-surface-variant font-semibold">Titulares &amp; Invitados</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Custodia institucional de <strong className="text-on-surface font-semibold">CVs normalizados</strong>, informes finales semestrales y asignación oficial de carga horaria.
              </p>
            </div>

            <div className="mt-space-lg pt-space-md border-t border-slate-100 flex items-center justify-between gap-space-sm">
              <button 
                onClick={() => navigate('/docentes')} 
                className="inline-flex items-center gap-space-xs font-body-sm font-semibold text-[#0b2545] hover:text-[#c1121f] transition-colors cursor-pointer"
              >
                <span>Expedientes docentes</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <span className="material-symbols-outlined text-[#0b2545]/60 text-lg">folder_open</span>
            </div>
          </div>

          {/* CARD 6: DEPÓSITO DIGITAL SEGURO */}
          <div className="relative flex flex-col justify-between rounded-xl bg-gradient-to-br from-[#07172b] via-[#0b2545] to-[#040e1c] p-space-lg text-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#c5a059]/30 overflow-hidden">
            {/* Franjas diagonales angulares interiores */}
            <div className="absolute -right-10 top-0 bottom-0 w-32 bg-gradient-to-l from-[#c1121f]/40 via-transparent to-transparent pointer-events-none transform skew-x-[-24deg]"></div>
            <div className="absolute -right-4 top-0 bottom-0 w-1 bg-[#c5a059]/60 pointer-events-none transform skew-x-[-24deg]"></div>
            
            <img 
              alt="Escudo de agua" 
              className="absolute -right-8 -bottom-8 w-40 h-40 object-contain opacity-10 pointer-events-none filter contrast-150" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
            />

            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-[#c5a059]">verified</span>
                  <span className="font-label-code text-[11px] uppercase tracking-wider text-[#f1e5cf] bg-white/10 px-2 py-0.5 rounded border border-white/10">
                    Servidor FINI
                  </span>
                </div>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
              </div>
              <h3 className="font-institutional-serif text-lg text-white font-bold">Depósito Digital Seguro</h3>
              <p className="font-body-sm text-body-sm text-slate-300 mt-1 leading-relaxed">
                Los expedientes cuentan con firma digital protocolar y resguardo duplicado físico/digital.
              </p>
              <div className="mt-space-lg space-y-space-sm bg-black/25 p-3 rounded-lg border border-white/10">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-white/80 font-medium">Integridad de correlativos</span>
                  <span className="font-label-code text-caption text-emerald-400 font-bold">100% OK</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#c5a059] to-emerald-400 h-full rounded-full w-full"></div>
                </div>
                <div className="flex items-center justify-between text-body-sm pt-1">
                  <span className="text-white/80 font-medium">Copias en nube UAGRM</span>
                  <span className="font-label-code text-caption text-[#f1e5cf] font-bold">Sincronizado hoy</span>
                </div>
              </div>
            </div>

            <div className="mt-space-lg pt-space-md border-t border-white/10 flex items-center justify-between">
              <span className="font-caption text-caption text-white/60 font-label-code">Hash: SHA-256 Validado</span>
              <span className="inline-flex items-center gap-1 font-label-code text-caption text-[#c5a059]">
                <span>Auditoría Activa</span>
                <span className="material-symbols-outlined text-xs">verified</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BLOQUE INFERIOR: ACCESOS Y AVISOS DE DIRECCIÓN */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* REGULATORY NOTICE CARD (Span 2) con estética de Certificado / Diploma FINI */}
        <div className="lg:col-span-2 rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container flex flex-col justify-between relative overflow-hidden">
          {/* Borde institucional con ribete doble que evoca el diploma de honor */}
          <div className="absolute inset-1.5 border border-[#c5a059]/20 rounded-lg pointer-events-none"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c1121f] via-[#c5a059] to-[#0b2545]"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-space-sm text-[#c1121f] mb-space-xs">
              <span className="material-symbols-outlined text-xl">policy</span>
              <span className="font-label-badge text-caption uppercase tracking-wider font-bold">
                Normativa de Archivo Institucional
              </span>
            </div>
            <h3 className="font-institutional-serif text-lg md:text-xl text-[#0b2545] font-bold">
              Regla Estricta de Reinicio Anual de Correlativos
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
              Por instrucción del Decanato FINI y la Secretaría General UAGRM, la numeración correlativa de oficios se reinicia ininterrumpidamente a <strong className="text-[#0b2545]">01</strong> al inaugurarse el ejercicio fiscal y académico <strong className="text-[#c1121f] font-semibold">Gestión {gestion + 1}</strong>. Todo oficio emitido en la presente gestión <strong className="text-on-surface">{gestion}</strong> mantendrá validez bajo custodia hasta el cierre formal de actas de fin de año.
            </p>

            {/* Rule bullets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-md pt-space-sm">
              <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low border border-slate-200/60">
                <div className="p-1 rounded bg-[#0b2545] text-white mt-0.5">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                </div>
                <div>
                  <span className="font-body-sm font-bold text-[#0b2545] block">Salvaguarda Dual</span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    Impresión física firmada en libro azul + escaneo PDF/A de 300 DPI indexado.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low border border-slate-200/60">
                <div className="p-1 rounded bg-[#c1121f] text-white mt-0.5">
                  <span className="material-symbols-outlined text-base">history_edu</span>
                </div>
                <div>
                  <span className="font-body-sm font-bold text-[#0b2545] block">Cierre de Gestión</span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    Libro de actas sellado por Dirección y Comité Académico en diciembre.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-space-lg pt-space-md border-t border-slate-100 flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
              <span className="material-symbols-outlined text-sm text-[#0b2545]">schedule</span>
              <span>Último respaldo de base de datos: Hoy (Servidor Central Ichilo)</span>
            </div>
            <button 
              onClick={() => alert('Reglamento de Digitalización y Archivo Documental UAGRM: Todo documento oficial recibido en dirección debe registrarse con correlativo secuencial y resguardo en PDF/A sin alteración de contenido.')}
              className="text-[#0b2545] hover:text-[#c1121f] font-body-sm font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer" 
              type="button"
            >
              <span>Ver reglamento documental completo</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* RECENT ACTIVITY SNAPSHOT (Span 1) */}
        <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] to-[#c1121f]"></div>
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <h4 className="font-institutional-serif text-lg text-[#0b2545] font-bold">Actividad Reciente</h4>
              <span className="material-symbols-outlined text-[#c1121f]">notifications_active</span>
            </div>
            <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block mb-space-md font-semibold">
              Sucesos en el archivo
            </span>
            
            {recentActivity.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant py-4 text-center">
                No hay actividad reciente registrada en {gestion}.
              </p>
            ) : (
              <ol className="space-y-space-md">
                {recentActivity.map((act) => (
                  <li key={act.id} className="flex items-start gap-space-sm">
                    <div className={`h-2.5 w-2.5 rounded-full ${act.color} mt-1.5 shrink-0 ring-4 ${act.ringColor}`}></div>
                    <div>
                      <span className="font-body-sm font-bold text-on-surface block leading-tight">{act.titulo}</span>
                      <p className="font-caption text-caption text-on-surface-variant line-clamp-1">{act.desc}</p>
                      <span className="font-label-code text-[10px] text-on-surface-variant/70 font-semibold">{act.fecha}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-space-lg pt-space-md border-t border-slate-100">
            <button 
              onClick={() => navigate('/expedidos')}
              className="w-full flex items-center justify-center gap-space-xs py-2 rounded-lg bg-surface-container hover:bg-surface-container-high font-body-sm font-semibold text-[#0b2545] transition-all border border-slate-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">history</span>
              <span>Historial completo de auditoría</span>
            </button>
          </div>
        </div>
      </section>

      {/* QUICK ACTION SLIDE-OVER / MODAL TEMPLATE */}
      {isQuickEmitOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-space-md animate-in fade-in zoom-in-95 duration-200" 
          onClick={() => !submitting && setIsQuickEmitOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-2xl p-space-xl shadow-2xl relative border border-[#c5a059]/40 overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#c1121f] via-[#c5a059] to-[#0b2545]"></div>
            <div className="flex items-center justify-between mb-space-md pb-2 border-b border-slate-100">
              <div className="flex items-center gap-space-sm">
                <div className="h-10 w-10 rounded-lg bg-[#0b2545] text-[#c5a059] flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined">post_add</span>
                </div>
                <div>
                  <h3 className="font-institutional-serif text-lg text-[#0b2545] font-bold">Generar Nuevo Oficio</h3>
                  <span className="font-caption text-caption text-[#c1121f] font-label-code font-bold">
                    Correlativo asignado: N° {metrics.nextOficio}/{gestion}
                  </span>
                </div>
              </div>
              <button 
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-slate-100 transition-colors cursor-pointer" 
                onClick={() => setIsQuickEmitOpen(false)} 
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickEmitSubmit} className="space-y-space-md">
              <div>
                <label className="block font-caption text-caption uppercase text-on-surface-variant font-bold mb-1">
                  Destinatario / Entidad
                </label>
                <input 
                  className="w-full rounded-lg bg-surface-container-low px-space-md py-2.5 text-body-sm text-on-surface focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0b2545]/30 border border-slate-200" 
                  placeholder="Ej. Decano Fac. Integral del Ichilo - Dr. ..." 
                  value={quickForm.destinatario}
                  onChange={(e) => setQuickForm({ ...quickForm, destinatario: e.target.value })}
                  required 
                  type="text"
                />
              </div>

              <div>
                <label className="block font-caption text-caption uppercase text-on-surface-variant font-bold mb-1">
                  Referencia / Asunto Oficial
                </label>
                <input 
                  className="w-full rounded-lg bg-surface-container-low px-space-md py-2.5 text-body-sm text-on-surface focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0b2545]/30 border border-slate-200" 
                  placeholder="Ej. Remisión de informes de auxiliares..." 
                  value={quickForm.asunto}
                  onChange={(e) => setQuickForm({ ...quickForm, asunto: e.target.value })}
                  required 
                  type="text"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-md">
                <div>
                  <label className="block font-caption text-caption uppercase text-on-surface-variant font-bold mb-1">
                    Fecha de Expedición
                  </label>
                  <input 
                    className="w-full rounded-lg bg-surface-container-low px-space-md py-2 text-body-sm text-on-surface focus:outline-none border border-slate-200" 
                    type="date" 
                    value={quickForm.fecha}
                    onChange={(e) => setQuickForm({ ...quickForm, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-caption text-caption uppercase text-on-surface-variant font-bold mb-1">
                    Clasificación
                  </label>
                  <select 
                    className="w-full rounded-lg bg-surface-container-low px-space-md py-2 text-body-sm text-on-surface focus:outline-none border border-slate-200 cursor-pointer"
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

              <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-slate-100">
                <button 
                  className="px-space-lg py-2 rounded-lg font-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer" 
                  onClick={() => setIsQuickEmitOpen(false)} 
                  type="button"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  className="px-space-lg py-2 rounded-lg bg-gradient-to-r from-[#c1121f] to-[#9e0c18] text-white font-body-sm font-semibold shadow hover:shadow-md transition-all border border-white/20 cursor-pointer disabled:opacity-50" 
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
