import React, { useState, useEffect, useMemo } from 'react';
import { useGestion } from '../context/GestionContext';
import { getAuxiliares, createAuxiliar, deleteAuxiliar } from '../services/api';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SuccessModal from './SuccessModal';

const Auxiliares = () => {
  const { gestion, setGestion } = useGestion();
  const [auxiliares, setAuxiliares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [semestreFiltro, setSemestreFiltro] = useState('todos');
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  const [selectedAuxId, setSelectedAuxId] = useState(null);
  const [successModalData, setSuccessModalData] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    nro_registro: '',
    materia: '',
    semestre: '1',
    nota_examen: '',
    estado: 'aprobado',
    nro_convocatoria: `CONV-01/${gestion}`,
    es_ratificacion: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getAuxiliares({
        gestion,
        semestre: semestreFiltro !== 'todos' ? parseInt(semestreFiltro) : undefined,
        busqueda: busqueda || undefined
      });
      const safeList = Array.isArray(list) ? list : [];
      setAuxiliares(safeList);
      if (safeList.length > 0 && (!selectedAuxId || !safeList.find(a => a.id === selectedAuxId))) {
        setSelectedAuxId(safeList[0].id);
      }
    } catch (err) {
      console.error('Error cargando auxiliares:', err);
      setAuxiliares([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion, semestreFiltro]);

  // Extract unique subjects for the filter dropdown
  const materiasDisponibles = useMemo(() => {
    const set = new Set();
    const list = Array.isArray(auxiliares) ? auxiliares : [];
    list.forEach(a => {
      if (a && a.materia) set.add(a.materia);
    });
    return Array.from(set);
  }, [auxiliares]);

  // Client filtered with string safety
  const filteredAuxiliares = useMemo(() => {
    if (!Array.isArray(auxiliares)) return [];
    return auxiliares.filter((item) => {
      if (!item) return false;
      const matchMateria = materiaFiltro === 'todas' || item.materia === materiaFiltro;
      const q = (busqueda || '').toLowerCase().trim();
      if (!q) return matchMateria;
      const matchSearch =
        String(item.nombre || '').toLowerCase().includes(q) ||
        String(item.materia || '').toLowerCase().includes(q) ||
        String(item.nro_registro || '').toLowerCase().includes(q) ||
        String(item.nro_convocatoria || '').toLowerCase().includes(q);
      return matchMateria && matchSearch;
    });
  }, [auxiliares, materiaFiltro, busqueda]);

  const selectedAux = useMemo(() => {
    if (!filteredAuxiliares.length) return null;
    return filteredAuxiliares.find(a => a && String(a.id) === String(selectedAuxId)) || filteredAuxiliares[0] || null;
  }, [filteredAuxiliares, selectedAuxId]);

  const getInitials = (name) => {
    if (!name) return 'AX';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenModal = () => {
    setFormData({
      nombre: '',
      nro_registro: '',
      materia: '',
      semestre: '1',
      nota_examen: '',
      estado: 'aprobado',
      nro_convocatoria: `CONV-01/${gestion}`,
      es_ratificacion: false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.materia) {
      alert('Por favor complete el nombre del auxiliar y la materia.');
      return;
    }

    try {
      setSubmitting(true);
      const nuevo = await createAuxiliar({
        ...formData,
        gestion,
        semestre: parseInt(formData.semestre),
        nota_examen: formData.nota_examen ? parseFloat(formData.nota_examen) : null
      });
      setSuccessModalData({
        badge: `AUXILIAR · ${formData.materia}`,
        title: '¡Auxiliar de Cátedra Registrado!',
        message: `El registro de docencia auxiliar para "${formData.nombre}" en la materia "${formData.materia}" fue asentado con éxito.`
      });
      setIsModalOpen(false);
      await fetchData();
      if (nuevo && nuevo.id) {
        setSelectedAuxId(nuevo.id);
      }
    } catch (err) {
      alert('Error al registrar auxiliar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nombre, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el registro de ${nombre}?`)) return;
    try {
      await deleteAuxiliar(id);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handlePrintConstancia = (aux) => {
    if (!aux) return;
    const vent = window.open('', '_blank');
    vent.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Constancia de Auxiliatura - ${aux.nombre}</title>
          <style>
            @page { size: letter; margin: 25mm 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #001026; line-height: 1.7; }
            .header { text-align: center; border-bottom: 3px double #001026; padding-bottom: 15px; margin-bottom: 30px; }
            .header h2 { margin: 0; font-size: 19px; text-transform: uppercase; letter-spacing: 1.2px; color: #001026; }
            .header h3 { margin: 5px 0; font-size: 15px; color: #1d4ed8; font-weight: 600; }
            .header p { margin: 0; font-size: 12px; color: #64748b; }
            .title-box { text-align: center; margin: 30px 0; }
            .title-box h1 { font-size: 19px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 2px; }
            .content { font-size: 15px; text-align: justify; margin-bottom: 40px; }
            .highlight-name { text-align: center; font-size: 18px; font-weight: 800; color: #001026; margin: 20px 0; letter-spacing: 0.5px; }
            .highlight-materia { text-align: center; font-size: 17px; font-weight: bold; color: #1d4ed8; margin: 15px 0; }
            .footer { margin-top: 80px; display: flex; justify-content: space-around; text-align: center; }
            .signature { border-top: 1px solid #334155; width: 230px; padding-top: 8px; font-size: 12px; }
            .seal { font-family: monospace; font-size: 10px; color: #64748b; margin-top: 50px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h2>
            <h3>FACULTAD INTEGRAL DEL ICHILO (FINI)</h3>
            <p>DIRECCIÓN DE CARRERA DE INGENIERÍA DE SISTEMAS · SEDE ICHILO (YAPACANÍ)</p>
          </div>

          <div class="title-box">
            <h1>CONSTANCIA DE AUXILIATURA DE CÁTEDRA</h1>
            <p style="font-size: 12px; color: #1d4ed8; font-weight: bold; margin-top: 4px;">REF: ${aux.nro_convocatoria || `CONV-DIR-${aux.gestion}`}</p>
          </div>

          <div class="content">
            <p>La Dirección de Carrera de <strong>Ingeniería de Sistemas</strong> de la Facultad Integral del Ichilo de la Universidad Autónoma Gabriel René Moreno, a solicitud del interesado y a los fines que estime pertinentes, hace constar que:</p>

            <div class="highlight-name">${aux.nombre.toUpperCase()}</div>

            <p>Con Registro Universitario (RU) <strong>${aux.nro_registro || 'En trámite institucional'}</strong>, ejerció funciones oficiales como <strong>AUXILIAR DE DOCENCIA / CÁTEDRA</strong> en la asignatura de:</p>

            <div class="highlight-materia">${aux.materia}</div>

            <p>Durante la <strong>Gestión Académica ${aux.gestion}</strong> (Semestre ${aux.semestre === 1 ? 'I' : 'II'}), habiendo cumplido satisfactoriamente las actividades de apoyo a la docencia con una calificación evaluada de <strong>${aux.nota_examen ? `${aux.nota_examen}/100 puntos` : 'Aprobada'}</strong>, bajo la condición de <strong>${aux.es_ratificacion ? 'Ratificación reglamentaria del Semestre anterior' : 'Concurso de méritos y examen de competencia'}</strong>, conforme a resolución de Consejo Facultativo.</p>

            <p>Se expide la presente constancia para acreditar experiencia docente y antecedentes académicos y laborales.</p>
          </div>

          <div class="footer">
            <div class="signature">
              <strong>Ing. Alicia Serrano Rodríguez</strong><br/>
              Directora de Carrera<br/>
              Ingeniería de Sistemas — FINI
            </div>
            <div class="signature">
              <strong>Decanatura FINI</strong><br/>
              Facultad Integral del Ichilo<br/>
              UAGRM
            </div>
          </div>

          <div class="seal">
            Identificador único de verificación: AUX-FINI-${aux.id}-${aux.gestion} · Yapacaní, Santa Cruz, Bolivia
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  const handlePrintInforme = (aux) => {
    if (!aux) return;
    const vent = window.open('', '_blank');
    vent.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Informe de Cátedra - ${aux.nombre}</title>
          <style>
            @page { size: letter; margin: 25mm 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #001026; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #001026; padding-bottom: 12px; margin-bottom: 25px; }
            .header h2 { margin: 0; font-size: 17px; text-transform: uppercase; }
            .header h4 { margin: 4px 0; color: #1d4ed8; }
            .content { font-size: 14px; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
            th { background: #f1f5f9; text-align: left; }
            .signature { margin-top: 60px; text-align: center; border-top: 1px solid #334155; width: 230px; margin-left: auto; margin-right: auto; padding-top: 6px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h2>
            <h4>INFORME TÉCNICO DE ANTECEDENTES DE AUXILIATURA</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0;">Dirección de Carrera de Ingeniería de Sistemas — FINI Ichilo</p>
          </div>
          <div class="content">
            <p><strong>A:</strong> Honorable Consejo de Carrera / Decanatura FINI</p>
            <p><strong>DE:</strong> Ing. Alicia Serrano Rodríguez — Directora de Carrera</p>
            <p><strong>FECHA:</strong> Gestión ${aux.gestion} · Semestre ${aux.semestre === 1 ? 'I' : 'II'}</p>
            <p><strong>ASUNTO:</strong> Elevación de informe de auxiliatura y verificación de antecedentes académicos.</p>

            <table>
              <tr><th>Auxiliar Designado</th><td><strong>${aux.nombre}</strong></td></tr>
              <tr><th>Registro Universitario</th><td>${aux.nro_registro || 'S/N'}</td></tr>
              <tr><th>Materia Asignada</th><td><strong>${aux.materia}</strong></td></tr>
              <tr><th>Semestre / Gestión</th><td>Semestre ${aux.semestre === 1 ? 'I' : 'II'} / ${aux.gestion}</td></tr>
              <tr><th>Calificación de Examen</th><td>${aux.nota_examen ? `${aux.nota_examen}/100` : 'Sin examen (Ratificación)'}</td></tr>
              <tr><th>Condición Legal</th><td>${aux.es_ratificacion ? 'Ratificado del Semestre anterior' : 'Ganador de Convocatoria Pública'}</td></tr>
              <tr><th>Convocatoria de Origen</th><td>${aux.nro_convocatoria || 'CONV-01'}</td></tr>
              <tr><th>Estado Administrativo</th><td><span style="color: #166534; font-weight: bold;">DESIGNACIÓN VÁLIDA</span></td></tr>
            </table>

            <p>Se informa que el expediente del auxiliar cuenta con los respaldos de rigor: Formulario CPD, Acta notariada y Resolución de designación correspondiente, cumpliendo con la normativa del Estatuto Orgánico de la UAGRM.</p>
          </div>
          <div class="signature">
            <strong>Ing. Alicia Serrano Rodríguez</strong><br/>
            Directora de Carrera — Sistemas FINI
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Encabezado & Acciones Principales con Estilo Folder Institucional */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-space-xl border border-surface-container shadow-[0_6px_25px_rgba(11,37,69,0.06)]">
        <div className="absolute -right-8 top-0 bottom-0 w-64 bg-gradient-to-bl from-[#c1121f] via-[#d90429] to-[#8b0000] pointer-events-none transform skew-x-[-20deg] opacity-90"></div>
        <div className="absolute right-52 top-0 bottom-0 w-6 bg-[#0b2545] pointer-events-none transform skew-x-[-20deg]"></div>
        <div className="absolute right-58 top-0 bottom-0 w-1.5 bg-[#c5a059] pointer-events-none transform skew-x-[-20deg]"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>
        <img 
          alt="Filigrana UAGRM" 
          className="absolute right-10 top-1/2 -translate-y-1/2 h-44 w-auto object-contain opacity-[0.07] pointer-events-none select-none" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwDvgfNOgOLZmyF4jwM11gkjCA2NuiqNJkDBamQIZvD-x--Qb1YoPJ9Mzesy_1pTP_dbbv_hOkFsi6ze_g00Ue5RNPfbLIxnC9tZupz-ah9GofWn9r692ngG1R9Q3AXhet2N6WkwTAAsEaAo7t6Xrg2tEiGrAQjpNti3zmmF79VJj0TDnymJYIo_yQziRb9pWofcjeXQtEkycQ9MKFAlRf35R0BybpEStSY0yTO9g6GCKAytofF79WdCerCyewDfZ5" 
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col max-w-2xl">
            <nav className="flex items-center gap-space-xs text-caption font-caption text-on-surface-variant mb-1">
              <span className="hover:text-primary transition-colors cursor-pointer">Gestión documental</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-[#c1121f] font-bold uppercase tracking-wider font-label-badge">Auxiliares de Cátedra</span>
            </nav>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-[#c1121f] rounded-full hidden sm:block"></div>
              <div>
                <h1 className="font-institutional-serif text-[26px] md:text-[32px] text-[#0b2545] font-bold tracking-tight leading-tight">
                  Auxiliares de Cátedra
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                  Antecedentes oficiales por materia, gestión y semestre con respaldo jurídico institucional.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <button
              onClick={handleOpenModal}
              className="btn-doc-fold"
              type="button"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Registrar antecedente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stepper de Referencia Jurídico-Administrativa con Protocolo de Prestigio */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-space-md pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c1121f] text-xl">account_tree</span>
            <span className="font-institutional-serif text-sm uppercase text-[#0b2545] font-bold tracking-wider">
              Proceso Reglamentario para Archivo de Cátedra
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            <span className="font-label-code text-[11px] text-on-surface-variant font-medium">
              Normativa Estatuto Orgánico UAGRM · Sede Ichilo
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md relative">
          {/* Etapa 1 */}
          <div className="bg-gradient-to-b from-white to-surface-container-low/40 rounded-xl p-space-md border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#c1121f]/50 transition-all">
            <div className="absolute -top-3 -right-2 font-correlative-counter text-4xl text-[#0b2545]/10 select-none pointer-events-none group-hover:text-[#c1121f]/15 transition-colors">
              01
            </div>
            <div className="flex items-center gap-space-xs mb-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c1121f] to-[#8b0000] text-white flex items-center justify-center font-label-code text-caption font-bold shadow-xs">
                1
              </span>
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-[#c1121f]">
                Fase Inicial
              </span>
            </div>
            <div className="font-institutional-serif text-body-lg font-bold text-[#0b2545] leading-tight">
              Propuesta de materias
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Se eleva a Consejo de Carrera con detalle de plazas requeridas.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] font-label-code text-[#0b2545] font-semibold">
              <span className="material-symbols-outlined text-xs text-[#c5a059]">check_circle</span> Solicitud Depto.
            </div>
          </div>

          {/* Etapa 2 */}
          <div className="bg-gradient-to-b from-white to-surface-container-low/40 rounded-xl p-space-md border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#0b2545]/50 transition-all">
            <div className="absolute -top-3 -right-2 font-correlative-counter text-4xl text-[#0b2545]/10 select-none pointer-events-none transition-colors">
              02
            </div>
            <div className="flex items-center gap-space-xs mb-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0b2545] to-[#15418c] text-white flex items-center justify-center font-label-code text-caption font-bold shadow-xs">
                2
              </span>
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-[#0b2545]">
                Consejo Facultativo
              </span>
            </div>
            <div className="font-institutional-serif text-body-lg font-bold text-[#0b2545] leading-tight">
              Tratamiento en Consejo
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Resolución de aprobación o ratificación semestral de cátedra.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] font-label-code text-[#0b2545] font-semibold">
              <span className="material-symbols-outlined text-xs text-[#c5a059]">check_circle</span> Resolución C.C.
            </div>
          </div>

          {/* Etapa 3 */}
          <div className="bg-gradient-to-b from-white to-surface-container-low/40 rounded-xl p-space-md border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#0b2545]/50 transition-all">
            <div className="absolute -top-3 -right-2 font-correlative-counter text-4xl text-[#0b2545]/10 select-none pointer-events-none transition-colors">
              03
            </div>
            <div className="flex items-center gap-space-xs mb-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0b2545] to-[#15418c] text-white flex items-center justify-center font-label-code text-caption font-bold shadow-xs">
                3
              </span>
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-[#0b2545]">
                Convocatoria ICU
              </span>
            </div>
            <div className="font-institutional-serif text-body-lg font-bold text-[#0b2545] leading-tight">
              Convocatoria pública
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Publicación y plazos reglamentarios según calendario ICU.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] font-label-code text-[#0b2545] font-semibold">
              <span className="material-symbols-outlined text-xs text-[#c5a059]">check_circle</span> Publicación FINI
            </div>
          </div>

          {/* Etapa 4 */}
          <div className="bg-gradient-to-b from-white to-surface-container-low/40 rounded-xl p-space-md border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#c5a059]/80 transition-all">
            <div className="absolute -top-3 -right-2 font-correlative-counter text-4xl text-[#0b2545]/10 select-none pointer-events-none transition-colors">
              04
            </div>
            <div className="flex items-center gap-space-xs mb-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c5a059] to-[#8b6b23] text-white flex items-center justify-center font-label-code text-caption font-bold shadow-xs">
                4
              </span>
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-[#8b6b23]">
                Cierre Oficial
              </span>
            </div>
            <div className="font-institutional-serif text-body-lg font-bold text-[#0b2545] leading-tight">
              Evaluación y selección
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Actas notariadas de examen, cuadro de méritos y notas con CPD.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] font-label-code text-emerald-700 font-bold">
              <span className="material-symbols-outlined text-xs text-emerald-600">verified</span> Actas Custodiadas
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
        {/* Buscador */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2.5 text-body-sm font-body-sm rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-[#0b2545]/30 border border-slate-200/80 transition-all"
            placeholder="Buscador por auxiliar o registro (ej. DEMO-AUX-01, Valeria)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            type="text"
          />
        </div>

        {/* Selectores */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-sm">
          {/* Selector Gestión */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm font-semibold pl-space-md pr-8 py-2.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0b2545]/30 border border-slate-200/80"
              value={gestion}
              onChange={(e) => setGestion(e.target.value)}
            >
              <option value="2026">Gestión 2026</option>
              <option value="2025">Gestión 2025</option>
              <option value="2024">Gestión 2024</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">
              expand_more
            </span>
          </div>

          {/* Selector Semestre */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm pl-space-md pr-8 py-2.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0b2545]/30 border border-slate-200/80"
              value={semestreFiltro}
              onChange={(e) => setSemestreFiltro(e.target.value)}
            >
              <option value="todos">Ambos semestres</option>
              <option value="1">Semestre I</option>
              <option value="2">Semestre II</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">
              expand_more
            </span>
          </div>

          {/* Selector Materias */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm pl-space-md pr-8 py-2.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0b2545]/30 border border-slate-200/80"
              value={materiaFiltro}
              onChange={(e) => setMateriaFiltro(e.target.value)}
            >
              <option value="todas">Todas las materias</option>
              {materiasDisponibles.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">
              expand_more
            </span>
          </div>

          <button
            onClick={() => {
              setBusqueda('');
              setSemestreFiltro('todos');
              setMateriaFiltro('todas');
            }}
            className="p-2.5 text-on-surface-variant hover:text-[#0b2545] rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors border border-slate-200/80 cursor-pointer"
            title="Limpiar filtros"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
          </button>
        </div>
      </div>

      {/* Tabla de Antecedentes con Estilo Institucional UAGRM FINI */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden">
        <div className="px-space-lg py-space-md bg-gradient-to-r from-surface-container-low via-surface-container-low/60 to-white flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[#c1121f] text-lg">folder_shared</span>
            <span className="font-institutional-serif text-base font-bold text-[#0b2545]">
              Nómina de Antecedentes Registrados
            </span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#0b2545]/10 text-[#0b2545] font-label-badge text-caption font-bold border border-[#0b2545]/20">
              {filteredAuxiliares.length} registros activos
            </span>
          </div>
          <div className="flex items-center gap-space-xs text-caption font-caption text-on-surface-variant bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-semibold text-[#0b2545]">Sede Ichilo (Yapacaní)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-on-surface-variant text-[11px] font-label-code uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-space-lg font-bold text-[#0b2545]">Auxiliar / Cód. Registro</th>
                <th className="py-3.5 px-space-md font-bold text-[#0b2545]">Materia de Cátedra</th>
                <th className="py-3.5 px-space-md font-bold text-center text-[#0b2545]">Calificación</th>
                <th className="py-3.5 px-space-md font-bold text-center text-[#0b2545]">Periodo</th>
                <th className="py-3.5 px-space-md font-bold text-[#0b2545]">Condición Jurídica</th>
                <th className="py-3.5 px-space-lg font-bold text-right text-[#0b2545]">Respaldo Digital</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-body-sm font-body-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-6 px-4">
                    <LoadingState message={`Sincronizando antecedentes de cátedra (${gestion})...`} />
                  </td>
                </tr>
              ) : filteredAuxiliares.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 px-4">
                    <EmptyState
                      title="No se encontraron auxiliares"
                      message={busqueda ? `Sin registros para "${busqueda}".` : `No existen auxiliares registrados para la gestión ${gestion}.`}
                      actionText="Registrar auxiliar"
                      onAction={handleOpenModal}
                    />
                  </td>
                </tr>
              ) : (
                filteredAuxiliares.map((aux) => {
                  const isSelected = selectedAux && String(selectedAux.id) === String(aux.id);
                  const initials = getInitials(aux.nombre);
                  return (
                    <tr
                      key={aux.id}
                      onClick={() => setSelectedAuxId(aux.id)}
                      className={`${
                        isSelected 
                          ? 'bg-gradient-to-r from-red-50/40 via-blue-50/20 to-white border-l-4 border-l-[#c1121f]' 
                          : 'bg-surface-container-lowest hover:bg-slate-50 border-l-4 border-l-transparent'
                      } transition-colors cursor-pointer group`}
                    >
                      <td className="py-3.5 px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div
                            className={`w-9 h-9 rounded-full ${
                              isSelected 
                                ? 'bg-gradient-to-br from-[#c1121f] to-[#8b0000] text-white ring-2 ring-[#c5a059]/40' 
                                : 'bg-gradient-to-br from-[#0b2545] to-[#15418c] text-white ring-1 ring-slate-200'
                            } flex items-center justify-center font-bold text-caption shadow-sm font-institutional-serif`}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-institutional-serif font-bold text-[#0b2545] group-hover:text-[#c1121f] transition-colors text-sm">
                              {aux.nombre}
                            </span>
                            <span className={`font-label-code text-[11px] ${isSelected ? 'text-[#c1121f] font-semibold' : 'text-on-surface-variant'}`}>
                              {aux.nro_registro ? `RU ${aux.nro_registro}` : `DEMO-AUX-${String(aux.id).padStart(2, '0')}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-base ${isSelected ? 'text-[#0b2545]' : 'text-[#15418c]'}`}>terminal</span>
                          <span className="font-semibold text-primary">{aux.materia}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md text-center">
                        <span className="font-label-code text-body-sm font-bold text-[#0b2545]">
                          {aux.nota_examen != null ? aux.nota_examen : '-'}
                        </span>
                        <span className="font-label-code text-caption text-on-surface-variant font-medium">
                          {aux.nota_examen != null ? ' / 100' : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-space-md text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md ${isSelected ? 'bg-[#0b2545]/10 text-[#0b2545]' : 'bg-surface-container-highest text-on-surface'} font-label-code text-caption font-bold`}>
                          {aux.semestre === 1 ? 'I' : 'II'} / {aux.gestion}
                        </span>
                      </td>

                      <td className="py-3.5 px-space-md">
                        {aux.es_ratificacion ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-label-badge text-[11px] font-bold shadow-2xs">
                            <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                            RATIFICADO DEL I
                          </span>
                        ) : aux.estado === 'aprobado' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-label-badge text-[11px] font-bold shadow-2xs">
                            <span className="material-symbols-outlined text-xs text-blue-700">military_tech</span>
                            GANADOR DE EXAMEN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-label-badge text-[11px] font-bold shadow-2xs">
                            <span className="material-symbols-outlined text-xs text-amber-700">schedule</span>
                            PROPUESTA CONSEJO
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-space-lg text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuxId(aux.id);
                              handlePrintConstancia(aux);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-[#0b2545] border border-slate-200 shadow-2xs hover:bg-[#0b2545] hover:text-white transition-all font-label-code text-caption font-bold cursor-pointer"
                            type="button"
                            title="Emitir constancia"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Ver respaldo</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(aux.id, aux.nombre, e)}
                            className="p-1.5 rounded-lg text-outline-variant hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                            title="Eliminar antecedente"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación / Footer Tabla */}
        <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-sm text-caption font-caption text-on-surface-variant border-t border-slate-100">
          <span>
            Mostrando {filteredAuxiliares.length} de {auxiliares.length} registros históricos de cátedra oficial
          </span>
          <div className="flex items-center gap-1">
            <span className="font-label-code font-bold text-[#0b2545]">
              Gestión {gestion} · Archivo FINI UAGRM
            </span>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Dossier de Antecedente Seleccionado (Estilo Carpeta/Diploma Oficial UAGRM FINI) */}
      {selectedAux && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-lg border border-surface-container p-space-xl flex flex-col gap-space-lg relative overflow-hidden">
          {/* Ribetes angulares geométricos institucionales del folder */}
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-gradient-to-bl from-[#c1121f] to-[#8b0000] transform rotate-45 pointer-events-none opacity-90"></div>
          <div className="absolute -right-10 -top-10 w-44 h-44 border-2 border-[#c5a059] pointer-events-none transform rotate-45"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>
          
          {/* Filigrana escudo UAGRM */}
          <img 
            alt="Marca de agua escudo" 
            className="absolute -left-6 -bottom-6 w-44 h-44 object-contain opacity-[0.04] pointer-events-none" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDykYJ-CVNMB6j05IjX7kpB5rpaBNBZ89FKkK3PuiXrBRa00ad8OJ9bmTDX4PGYF0xo_QiDByufBV5nYpkiBij2eR2FOMFoHgj63-pajn9mDXCj26ttDL6Z_jv3a8mzoheg5UgMYEsKtSuC7z2joBd2Kf7L8v_ZmyzQlbZUJA5EwrDpVBaJwxW8k9IoRpS6WD18IZcWEVStAHJPDLGg0h67kIGi2EqRK4G4NNddRQiSoC3K28vQHuouuCeOTb1TT1Vn" 
          />

          {/* Header del Antecedente Activo */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md border-b border-slate-100">
            <div className="flex items-start gap-space-md">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0b2545] to-[#15418c] text-white flex items-center justify-center font-institutional-serif text-2xl font-bold shadow-md ring-2 ring-[#c5a059]/40">
                {getInitials(selectedAux.nombre)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="font-label-badge text-caption uppercase tracking-wider text-[#c1121f] font-bold">
                    Expediente Seleccionado
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-[#0b2545] font-label-code text-caption font-bold border border-slate-200">
                    ID: {selectedAux.nro_registro || `DEMO-AUX-${selectedAux.id}`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-label-badge font-bold border border-emerald-200">
                    Semestre {selectedAux.semestre === 1 ? 'I' : 'II'} / {selectedAux.gestion}
                  </span>
                </div>
                <h2 className="font-institutional-serif text-xl md:text-2xl font-bold text-[#0b2545] mt-0.5">
                  {selectedAux.nombre} — Semestre {selectedAux.semestre === 1 ? 'I' : 'II'} / {selectedAux.gestion}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Cátedra: <strong className="text-[#0b2545]">{selectedAux.materia}</strong> · Condición de designación:{' '}
                  <span className="font-semibold text-emerald-800">
                    {selectedAux.es_ratificacion ? 'Ratificado del Semestre I' : 'Convocatoria y Examen de Méritos'}
                  </span>
                </p>
              </div>
            </div>

            {/* Acciones de Impresión con Estilo Protocolar */}
            <div className="flex items-center gap-space-xs flex-wrap sm:flex-nowrap">
              <button
                onClick={() => handlePrintConstancia(selectedAux)}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-[#0b2545] hover:bg-surface-container hover:text-[#c1121f] transition-all font-body-sm text-body-sm font-semibold border border-slate-200 shadow-2xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg text-[#0b2545]">print</span>
                <span>Imprimir constancia</span>
              </button>
              <button
                onClick={() => handlePrintInforme(selectedAux)}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-gradient-to-r from-[#0b2545] to-[#15418c] text-white hover:shadow-md transition-all font-body-sm text-body-sm font-semibold border border-white/20 shadow-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg text-[#c5a059]">description</span>
                <span>Imprimir informe</span>
              </button>
            </div>
          </div>

          {/* Panel de Documentación de Respaldo con Tarjetas de Protocolo */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {/* Documento 1: Formulario CPD */}
            <div className="bg-surface-container-low/60 rounded-xl p-space-md flex flex-col justify-between hover:bg-surface-container-low hover:border-[#c5a059]/40 border border-slate-200/80 transition-all shadow-sm group">
              <div>
                <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-white text-[#0b2545] flex items-center justify-center shadow-xs border border-slate-200 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl text-[#0b2545]">assignment_turned_in</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white text-[#0b2545] font-label-code text-caption font-bold border border-slate-200 shadow-2xs">
                    CPD-{selectedAux.gestion}-088
                  </span>
                </div>
                <div className="font-institutional-serif text-body-lg font-bold text-[#0b2545]">Formulario oficial CPD</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-snug">
                  Carga horaria asignada de 32 hrs/mes. Certificación presupuestaria aprobada por la DAF.
                </p>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between border-t border-slate-200/60">
                <span className="font-caption text-caption text-on-surface-variant font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-emerald-600">verified</span> PDF firmado
                </span>
                <button
                  onClick={() => handlePrintConstancia(selectedAux)}
                  className="text-[#c1121f] hover:text-[#8b0000] font-body-sm text-caption font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  type="button"
                >
                  Descargar <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>

            {/* Documento 2: Convocatoria y evaluación */}
            <div className="bg-surface-container-low/60 rounded-xl p-space-md flex flex-col justify-between hover:bg-surface-container-low hover:border-[#c5a059]/40 border border-slate-200/80 transition-all shadow-sm group">
              <div>
                <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-white text-[#c1121f] flex items-center justify-center shadow-xs border border-slate-200 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl text-[#c1121f]">gavel</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white text-[#c1121f] font-label-code text-caption font-bold border border-slate-200 shadow-2xs">
                    {selectedAux.nro_convocatoria || 'ACTA-EX-14'}
                  </span>
                </div>
                <div className="font-institutional-serif text-body-lg font-bold text-[#0b2545]">Convocatoria y evaluación</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-snug">
                  Acta de concurso de méritos y examen de competencia. Nota certificada por tribunal: {selectedAux.nota_examen != null ? `${selectedAux.nota_examen}/100` : '86/100'}.
                </p>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between border-t border-slate-200/60">
                <span className="font-caption text-caption text-on-surface-variant font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#c5a059]">history_edu</span> Acta notariada
                </span>
                <button
                  onClick={() => handlePrintInforme(selectedAux)}
                  className="text-[#c1121f] hover:text-[#8b0000] font-body-sm text-caption font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  type="button"
                >
                  Descargar <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>

            {/* Documento 3: Carta de ratificación */}
            <div className="bg-surface-container-low/60 rounded-xl p-space-md flex flex-col justify-between hover:bg-surface-container-low hover:border-[#c5a059]/40 border border-slate-200/80 transition-all shadow-sm group">
              <div>
                <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-white text-[#15418c] flex items-center justify-center shadow-xs border border-slate-200 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl text-[#15418c]">verified_user</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white text-[#15418c] font-label-code text-caption font-bold border border-slate-200 shadow-2xs">
                    RES-CC-09/{String(selectedAux.gestion || gestion).slice(-2)}
                  </span>
                </div>
                <div className="font-institutional-serif text-body-lg font-bold text-[#0b2545]">
                  {selectedAux.es_ratificacion ? 'Carta de ratificación' : 'Resolución de designación'}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-snug">
                  Resolución de Consejo de Carrera que aprueba la designación reglamentaria para el Semestre {selectedAux.semestre === 1 ? 'I' : 'II'}.
                </p>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between border-t border-slate-200/60">
                <span className="font-caption text-caption text-on-surface-variant font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-blue-600">policy</span> Resolución CC
                </span>
                <button
                  onClick={() => handlePrintConstancia(selectedAux)}
                  className="text-[#c1121f] hover:text-[#8b0000] font-body-sm text-caption font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  type="button"
                >
                  Descargar <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Registro de Antecedente de Auxiliar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 bg-black/60 backdrop-blur-md">
          <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            {/* Header */}
            <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary-fixed">badge</span>
                <span className="font-headline-md text-headline-md font-bold">Registrar Antecedente de Auxiliar</span>
              </div>
              <button
                className="text-on-primary/70 hover:text-on-primary cursor-pointer"
                onClick={() => !submitting && setIsModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-space-lg flex flex-col gap-space-md max-h-[75vh] overflow-y-auto">
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-caption text-caption text-on-surface-variant font-semibold">
                    Período Académico:
                  </span>
                  <span className="font-label-code text-label-code font-bold text-secondary bg-surface-container px-2 py-0.5 rounded">
                    Gestión {gestion} · Carrera Sistemas
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                    Nombre Completo del Postulante / Auxiliar *
                  </label>
                  <input
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    placeholder="Ej. Valeria Méndez Soto"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Registro Universitario (RU)
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. DEMO-AUX-01"
                      value={formData.nro_registro}
                      onChange={(e) => setFormData({ ...formData, nro_registro: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Semestre de Designación
                    </label>
                    <select
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      value={formData.semestre}
                      onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                    >
                      <option value="1">Semestre I</option>
                      <option value="2">Semestre II</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Materia / Cátedra *
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. Programación I, Base de datos I..."
                      value={formData.materia}
                      onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                      required
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Calificación (0 - 100)
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. 86"
                      max="100"
                      min="0"
                      step="0.1"
                      value={formData.nota_examen}
                      onChange={(e) => setFormData({ ...formData, nota_examen: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      N.° Convocatoria / Referencia
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. CONV-01/2026"
                      value={formData.nro_convocatoria}
                      onChange={(e) => setFormData({ ...formData, nro_convocatoria: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Estado de Designación
                    </label>
                    <select
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="aprobado">🟢 Aprobado / Ganador de Examen</option>
                      <option value="pendiente">🟡 Propuesta en Consejo</option>
                      <option value="reprobado">🔴 Rechazado / Sin cupo</option>
                    </select>
                  </div>
                </div>

                <div className="bg-surface-container-low p-space-md rounded-lg flex items-center gap-space-sm">
                  <input
                    checked={formData.es_ratificacion}
                    className="w-4 h-4 rounded text-secondary focus:ring-secondary"
                    id="chk_ratificacion"
                    onChange={(e) => setFormData({ ...formData, es_ratificacion: e.target.checked })}
                    type="checkbox"
                  />
                  <label className="text-body-sm font-body-sm text-on-surface cursor-pointer select-none" htmlFor="chk_ratificacion">
                    <strong>¿Es ratificación para el Semestre II?</strong> (Continuidad reglamentaria sin nuevo examen)
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-end gap-space-sm">
                <button
                  className="px-space-md py-2 rounded-lg font-body-sm text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm font-semibold shadow-sm hover:bg-primary transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Guardando...' : 'Guardar Antecedente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Éxito con Animación Lordicon */}
      <SuccessModal
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        title={successModalData?.title}
        badge={successModalData?.badge}
        message={successModalData?.message}
      />
    </div>
  );
};

export default Auxiliares;
