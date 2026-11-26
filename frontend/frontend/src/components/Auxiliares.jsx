import React, { useState, useEffect, useMemo } from 'react';
import { useGestion } from '../context/GestionContext';
import { 
  getAuxiliares, 
  createAuxiliar, 
  updateAuxiliar, 
  deleteAuxiliar, 
  getMaterias,
  getConvocatorias,
  getFasesConvocatoria
} from '../services/api';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SuccessModal from './SuccessModal';
import { getUserCarrera } from '../utils/carreraHelper';
import {
  imprimirDocumentoOficial,
  abrirVentanaImpresion,
  tablaProcesoHtml,
  formatearFechaIso,
  citarRespaldo,
  FIRMAS,
  esc
} from '../utils/documentoOficial';
import AvanceConvocatoria from './AvanceConvocatoria';
import ProcesoDesignacion from './ProcesoDesignacion';

const Auxiliares = () => {
  const { gestion, setGestion } = useGestion();
  const [auxiliares, setAuxiliares] = useState([]);
  const [catalogoMaterias, setCatalogoMaterias] = useState([]);
  const [catalogoConvocatorias, setCatalogoConvocatorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [semestreFiltro, setSemestreFiltro] = useState('todos');
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  
  // Expediente seleccionado y pestaña activa
  const [selectedAuxId, setSelectedAuxId] = useState(null);
  const [activeTab, setActiveTab] = useState('constancia'); // 'constancia' | 'informe'
  const [successModalData, setSuccessModalData] = useState(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulario Crear Auxiliar
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

  // Formulario Editar Auxiliar
  const [editFormData, setEditFormData] = useState({
    id: null,
    nombre: '',
    nro_registro: '',
    materia: '',
    semestre: '1',
    nota_examen: '',
    estado: 'aprobado',
    nro_convocatoria: '',
    es_ratificacion: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { gestion };
      if (semestreFiltro !== 'todos') params.semestre = parseInt(semestreFiltro, 10);
      if (materiaFiltro !== 'todas') params.materia = materiaFiltro;
      if (busqueda && busqueda.trim()) params.busqueda = busqueda.trim();

      const list = await getAuxiliares(params);
      const safeList = Array.isArray(list) ? list : [];
      setAuxiliares(safeList);
    } catch (err) {
      console.error('Error cargando auxiliares:', err);
      setAuxiliares([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion, semestreFiltro, materiaFiltro, busqueda]);

  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [mats, convs] = await Promise.all([
          getMaterias(),
          getConvocatorias()
        ]);
        setCatalogoMaterias(Array.isArray(mats) ? mats : []);
        setCatalogoConvocatorias(Array.isArray(convs) ? convs : []);
      } catch (err) {
        console.error('Error cargando catálogos de materias/convocatorias:', err);
      }
    };
    loadCatalogos();
  }, []);

  // Lista unificada de materias para el dropdown de filtros
  const materiasDisponibles = useMemo(() => {
    const map = new Map();
    if (Array.isArray(catalogoMaterias)) {
      catalogoMaterias.forEach(m => {
        if (m && m.nombre) map.set(m.nombre, m);
      });
    }
    const list = Array.isArray(auxiliares) ? auxiliares : [];
    list.forEach(a => {
      if (a && a.materia && !map.has(a.materia)) {
        map.set(a.materia, { nombre: a.materia, codigo: a.materia_codigo || '' });
      }
    });
    return Array.from(map.values());
  }, [catalogoMaterias, auxiliares]);

  // Filtrado reactivo en cliente (instantáneo)
  const filteredAuxiliares = useMemo(() => {
    if (!Array.isArray(auxiliares)) return [];
    return auxiliares.filter((item) => {
      if (!item) return false;
      const matchMateria = materiaFiltro === 'todas' || item.materia === materiaFiltro;
      const matchSemestre = semestreFiltro === 'todos' || String(item.semestre) === String(semestreFiltro);
      const q = (busqueda || '').toLowerCase().trim();
      if (!q) return matchMateria && matchSemestre;
      const matchSearch =
        String(item.nombre || '').toLowerCase().includes(q) ||
        String(item.materia || '').toLowerCase().includes(q) ||
        String(item.nro_registro || '').toLowerCase().includes(q) ||
        String(item.nro_convocatoria || '').toLowerCase().includes(q);
      return matchMateria && matchSemestre && matchSearch;
    });
  }, [auxiliares, materiaFiltro, semestreFiltro, busqueda]);

  // Proceso (fases y respaldos) de la convocatoria del auxiliar abierto en el expediente
  const [procesoExpediente, setProcesoExpediente] = useState({ avance: null, cargando: false, error: '' });

  // Auxiliar seleccionado actualmente
  const selectedAux = useMemo(() => {
    if (!selectedAuxId) return null;
    return auxiliares.find(a => a && String(a.id) === String(selectedAuxId)) || null;
  }, [auxiliares, selectedAuxId]);

  const getInitials = (name) => {
    if (!name) return 'AX';
    const clean = name.replace(/^(univ\.|ing\.|lic\.)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const formatFecha = (dateStr) => {
    if (!dateStr) return '26/Oct/2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '26/Oct/2026';
    }
  };

  // Crear Auxiliar
  const handleCreateSubmit = async (e) => {
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
        semestre: parseInt(formData.semestre, 10),
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
        setActiveTab('constancia');
      }
    } catch (err) {
      alert('Error al registrar auxiliar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Editar Auxiliar
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nombre || !editFormData.materia) return;

    try {
      setSubmitting(true);
      await updateAuxiliar(editFormData.id, {
        ...editFormData,
        gestion,
        semestre: parseInt(editFormData.semestre, 10),
        nota_examen: editFormData.nota_examen ? parseFloat(editFormData.nota_examen) : null
      });
      setSuccessModalData({
        badge: `ANTECEDENTE ACTUALIZADO`,
        title: '¡Expediente Actualizado!',
        message: `Los datos del auxiliar de cátedra "${editFormData.nombre}" han sido actualizados con éxito.`
      });
      setIsEditModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Error al actualizar auxiliar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar Auxiliar
  const handleDelete = async (id, nombre, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el antecedente oficial de ${nombre}?`)) return;
    try {
      await deleteAuxiliar(id);
      if (selectedAuxId === id) setSelectedAuxId(null);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const ESTADOS_AUX = { aprobado: 'Aprobado', pendiente: 'Pendiente de evaluación', reprobado: 'Reprobado' };
  const semestreRomano = (s) => (Number(s) === 2 ? 'II' : 'I');
  const materiaConCodigo = (aux) => `${aux.materia}${aux.materia_codigo ? ` (${aux.materia_codigo})` : ''}`;

  const idConvocatoriaExpediente = selectedAux?.id_convocatoria || null;
  useEffect(() => {
    if (!idConvocatoriaExpediente) {
      setProcesoExpediente({ avance: null, cargando: false, error: '' });
      return;
    }
    let cancelado = false;
    setProcesoExpediente((p) => ({ ...p, cargando: true, error: '' }));
    getFasesConvocatoria(idConvocatoriaExpediente)
      .then((avance) => { if (!cancelado) setProcesoExpediente({ avance, cargando: false, error: '' }); })
      .catch((err) => { if (!cancelado) setProcesoExpediente({ avance: null, cargando: false, error: err.message }); });
    return () => { cancelado = true; };
  }, [idConvocatoriaExpediente]);

  // Si se registra una fase arriba, refrescar el expediente abierto si es de la misma convocatoria
  const handleCambioAvance = (avance) => {
    if (avance && avance.id === idConvocatoriaExpediente) {
      setProcesoExpediente({ avance, cargando: false, error: '' });
    }
  };

  // Obtiene el proceso de la convocatoria del auxiliar (usa el ya cargado si coincide)
  const obtenerProceso = async (aux) => {
    if (!aux?.id_convocatoria) return null;
    if (procesoExpediente.avance?.id === aux.id_convocatoria) return procesoExpediente.avance;
    try {
      return await getFasesConvocatoria(aux.id_convocatoria);
    } catch {
      return null;
    }
  };

  // "la propuesta de materia el 03/02/2026 (Of. Exp. N° 15/2026), ..." solo con fases cumplidas
  const resumenProceso = (avance) => {
    const hechas = (avance?.fases || []).filter((f) => f.cumplida);
    if (!hechas.length) return '';
    const items = hechas.map((f) =>
      `${esc(f.nombre.toLowerCase())} el ${esc(formatearFechaIso(f.fecha))}${f.documento ? ` (${esc(citarRespaldo(f.documento))})` : ''}`
    );
    return `<p>El proceso de la convocatoria ${esc(avance.nro_convocatoria)} registra: ${items.join('; ')}.</p>`;
  };

  // Imprimir constancia de auxiliatura con el formato oficial de la Dirección de Carrera
  const handlePrintConstancia = async (aux) => {
    if (!aux) return;
    if (aux.estado && aux.estado !== 'aprobado') {
      alert(`Solo se emite constancia para auxiliares aprobados. Estado actual: ${ESTADOS_AUX[aux.estado] || aux.estado}.`);
      return;
    }
    const ventana = abrirVentanaImpresion();
    if (!ventana) return;
    const avance = await obtenerProceso(aux);
    const anio = new Date().getFullYear();
    const condicion = aux.es_ratificacion
      ? 'por ratificación reglamentaria del semestre anterior'
      : `como ganador(a) de la convocatoria ${esc(aux.nro_convocatoria || '')} por concurso de méritos y examen de competencia${aux.nota_examen ? `, con una calificación de <strong>${esc(aux.nota_examen)}/100 puntos</strong>` : ''}`;

    imprimirDocumentoOficial({
      tituloVentana: `Constancia de Auxiliatura - ${aux.nombre}`,
      cite: `CONST. No. ______/${anio}`,
      titulo: 'CONSTANCIA',
      cuerpo: `
        <p>La suscrita Directora de la Carrera de ${esc(getUserCarrera())} de la Facultad Integral de Ichilo, de la Universidad Autónoma "Gabriel René Moreno", a solicitud del interesado(a):</p>
        <p class="destacado">HACE CONSTAR:</p>
        <p class="sin-sangria">Que el(la) universitario(a) <strong>${esc(aux.nombre.toUpperCase())}</strong>, con Registro Universitario <strong>${esc(aux.nro_registro || 'S/N')}</strong>, ejerció funciones de <strong>AUXILIAR DE DOCENCIA</strong> en la materia <strong>${esc(materiaConCodigo(aux))}</strong>, durante el Semestre ${semestreRomano(aux.semestre)} de la Gestión ${esc(aux.gestion)}, designado(a) ${condicion}.</p>
        ${resumenProceso(avance)}
        <p>Se extiende la presente constancia a solicitud del interesado(a), para los fines que viere conveniente.</p>`,
      firmas: [FIRMAS.directora, FIRMAS.vicedecano]
    }, ventana);
  };

  // Imprimir informe de antecedentes de auxiliatura dirigido al Consejo Facultativo
  const handlePrintInforme = async (aux) => {
    if (!aux) return;
    const ventana = abrirVentanaImpresion();
    if (!ventana) return;
    const avance = await obtenerProceso(aux);
    const anio = new Date().getFullYear();
    // Dos datos por fila para que el oficio quepa en una hoja
    const fila = (c1, v1, c2, v2) =>
      `<tr><td class="campo">${c1}</td><td>${esc(v1)}</td><td class="campo">${c2}</td><td>${esc(v2)}</td></tr>`;

    imprimirDocumentoOficial({
      tituloVentana: `Informe de Auxiliatura - ${aux.nombre}`,
      cite: `OF. No. ______/${anio}`,
      destinatario: { nombre: 'Honorable Consejo Facultativo', cargo: 'Facultad Integral de Ichilo – U.A.G.R.M.' },
      conRemitente: true,
      referencia: `Informe de antecedentes de auxiliatura – Univ. ${aux.nombre}`,
      cuerpo: `
        <p class="sin-sangria">Distinguidos miembros del Consejo:</p>
        <p>Mediante la presente informo los antecedentes del(la) siguiente auxiliar de docencia:</p>
        <table class="datos doble">
          ${fila('Auxiliar', aux.nombre, 'R.U.', aux.nro_registro || 'S/N')}
          ${fila('Materia', materiaConCodigo(aux), 'Ciclo', `Sem. ${semestreRomano(aux.semestre)} / ${aux.gestion}`)}
          ${fila('Designación', aux.es_ratificacion ? 'Ratificación' : 'Concurso de méritos y examen', 'Calificación', aux.nota_examen ? `${aux.nota_examen}/100` : 'Sin examen')}
          ${fila('Convocatoria', aux.nro_convocatoria || 'S/N', 'Estado', ESTADOS_AUX[aux.estado] || aux.estado || 'S/D')}
        </table>
        ${tablaProcesoHtml(avance)}
        <p>Se eleva el presente informe para su consideración y fines consiguientes. Sin otro particular, me despido con las consideraciones más distinguidas.</p>`,
      firmas: [FIRMAS.directora]
    }, ventana);
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12">
      {/* 1. BARRA SUPERIOR DE BÚSQUEDA Y FILTROS (Diseño de la Imagen 1 / Anti-fatiga visual) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Campo de búsqueda con icono */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input 
              type="text"
              placeholder="Buscar auxiliar por nombre, RU, materia o convocatoria..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] transition-all"
            />
          </div>

          {/* Selector de Materias extraídas de la tabla 'materias' */}
          <div className="relative min-w-[220px] sm:min-w-[240px]">
            <select
              value={materiaFiltro}
              onChange={(e) => setMateriaFiltro(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] cursor-pointer transition-all"
            >
              <option value="todas">Materia / Cátedra: Todas</option>
              {materiasDisponibles.map((mat) => (
                <option key={mat.nombre} value={mat.nombre}>
                  {mat.codigo ? `[${mat.codigo}] ` : ''}{mat.nombre}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">
              expand_more
            </span>
          </div>

          {/* Selector de Semestre / Ciclo */}
          <div className="relative min-w-[140px]">
            <select
              value={semestreFiltro}
              onChange={(e) => setSemestreFiltro(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] cursor-pointer transition-all"
            >
              <option value="todos">Semestre: Todos</option>
              <option value="1">Semestre I</option>
              <option value="2">Semestre II</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">
              expand_more
            </span>
          </div>

          {/* Contador en vivo & Indicador de Convocatoria ICU & Botón Registrar */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Mostrando <strong className="text-slate-900 font-bold">{filteredAuxiliares.length}</strong> de <strong className="text-slate-900 font-bold">{auxiliares.length}</strong> auxiliares
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 border-l border-slate-200 pl-4">
              <span className="material-symbols-outlined text-slate-400 text-base">verified_user</span>
              <span>Concurso ICU · Acreditación CPD</span>
            </div>

            <button
              onClick={() => {
                setFormData({
                  nombre: '',
                  nro_registro: '',
                  materia: materiaFiltro !== 'todas' ? materiaFiltro : (catalogoMaterias[0]?.nombre || ''),
                  semestre: semestreFiltro !== 'todos' ? semestreFiltro : '1',
                  nota_examen: '',
                  estado: 'aprobado',
                  nro_convocatoria: `CONV-01/${gestion}`,
                  es_ratificacion: false
                });
                setIsModalOpen(true);
              }}
              className="btn-doc-fold py-2 px-3.5 text-xs shadow-sm cursor-pointer ml-auto sm:ml-0"
              type="button"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Registrar antecedente</span>
            </button>
          </div>

        </div>
      </div>

      {/* AVANCE DE LA CONVOCATORIA POR FASES */}
      <AvanceConvocatoria convocatorias={catalogoConvocatorias} gestion={gestion} onCambio={handleCambioAvance} />

      {/* 2. CONTENEDOR PRINCIPAL CON ANIMACIÓN SUAVE DE DESPLAZAMIENTO (SPLIT VIEW) */}
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full transition-all duration-300 ease-in-out">
        
        {/* COLUMNA DE LA LISTA DE AUXILIARES (Se adapta suavemente según si hay un expediente abierto) */}
        <div className={`transition-all duration-300 ease-in-out flex flex-col gap-4 ${
          selectedAux ? 'lg:w-[58%] w-full' : 'w-full'
        }`}>
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
              <LoadingState message={`Sincronizando nómina oficial de auxiliares (${gestion})...`} size={44} />
            </div>
          ) : filteredAuxiliares.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
              <EmptyState
                title="No se encontraron auxiliares de cátedra"
                message={
                  materiaFiltro !== 'todas'
                    ? `No hay auxiliares registrados para "${materiaFiltro}".`
                    : busqueda
                    ? `Sin coincidencias para "${busqueda}".`
                    : `No existen auxiliares registrados para la gestión ${gestion}.`
                }
                actionText="Registrar antecedente"
                onAction={() => {
                  setFormData({
                    nombre: '',
                    nro_registro: '',
                    materia: materiaFiltro !== 'todas' ? materiaFiltro : (catalogoMaterias[0]?.nombre || ''),
                    semestre: semestreFiltro !== 'todos' ? semestreFiltro : '1',
                    nota_examen: '',
                    estado: 'aprobado',
                    nro_convocatoria: `CONV-01/${gestion}`,
                    es_ratificacion: false
                  });
                  setIsModalOpen(true);
                }}
                iconSize={48}
              />
            </div>
          ) : (
            filteredAuxiliares.map((aux) => {
              const isSelected = selectedAux && String(selectedAux.id) === String(aux.id);
              const initials = getInitials(aux.nombre);
              const isRatificado = Boolean(aux.es_ratificacion);
              const notaVal = aux.nota_examen ? parseFloat(aux.nota_examen) : null;

              return (
                <div
                  key={aux.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 transition-all duration-300 relative border ${
                    isSelected
                      ? 'border-l-4 border-l-[#C1121F] border-t-slate-200 border-r-slate-200 border-b-slate-200 shadow-md ring-1 ring-[#C1121F]/10'
                      : 'border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  {/* Fila Superior: Avatar + Nombre + RU + Insignias */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar con Iniciales */}
                      <div className="w-12 h-12 rounded-xl bg-[#0B2545] text-[#f7e7a9] font-institutional-serif text-base font-bold flex items-center justify-center shrink-0 shadow-inner ring-1 ring-[#c5a059]/40">
                        {initials}
                      </div>

                      {/* Nombre y Metadatos */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-institutional-serif text-base sm:text-lg font-bold text-slate-800 tracking-wide uppercase truncate">
                            {aux.nombre}
                          </h3>
                          <span 
                            className="material-symbols-outlined text-[#C1121F] text-base shrink-0" 
                            title="Auxiliar acreditado con resolución oficial de Consejo Facultativo"
                          >
                            verified
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-label-code text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                          <span className="text-[#0B2545] font-bold">RU: {aux.nro_registro || 'En trámite'}</span>
                          <span>·</span>
                          <span>Ref: {aux.nro_convocatoria || 'CONV-S/N'}</span>
                          <span>·</span>
                          <span>Gestión {aux.gestion || gestion}</span>
                        </div>
                      </div>
                    </div>

                    {/* Insignias de Condición Legal y Calificación */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold border ${
                        isRatificado
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {isRatificado ? 'Ratificación Semestral' : 'Concurso de Méritos'}
                      </span>
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                        {notaVal ? `Examen: ${notaVal}/100` : (isRatificado ? 'Ratificado' : 'Aprobado')}
                      </span>
                    </div>
                  </div>

                  {/* Fila Media: Cátedra asignada en contenedor sutil */}
                  <div className="mt-3.5 mb-4 px-3.5 py-2 rounded-xl bg-slate-50/90 border border-slate-100 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-slate-800 mr-1.5">Asignatura:</span>
                      <span className="text-slate-600 font-medium">
                        {aux.materia} {aux.materia_codigo ? `(${aux.materia_codigo})` : ''} · Semestre {aux.semestre === 1 ? 'I' : 'II'} ({aux.gestion})
                      </span>
                    </div>
                    <span className="font-label-code text-[11px] text-slate-500 font-semibold">
                      {aux.estado === 'aprobado' ? 'Designación Validada' : 'En Evaluación'}
                    </span>
                  </div>

                  {/* Fila Inferior: Los 2 Botones Interactivos y Acciones Rápidas */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 gap-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      
                      {/* BOTÓN 1: Constancia Oficial */}
                      <button
                        onClick={() => {
                          setSelectedAuxId(aux.id);
                          setActiveTab('constancia');
                        }}
                        type="button"
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected && activeTab === 'constancia'
                            ? 'bg-[#0B2545] text-white shadow-sm ring-2 ring-[#0B2545]/20'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-base ${
                          isSelected && activeTab === 'constancia' ? 'text-[#f7e7a9]' : 'text-slate-500'
                        }`}>
                          workspace_premium
                        </span>
                        <span>Constancia Oficial</span>
                      </button>

                      {/* BOTÓN 2: Informe Técnico */}
                      <button
                        onClick={() => {
                          setSelectedAuxId(aux.id);
                          setActiveTab('informe');
                        }}
                        type="button"
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected && activeTab === 'informe'
                            ? 'bg-[#0B2545] text-white shadow-sm ring-2 ring-[#0B2545]/20'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-base ${
                          isSelected && activeTab === 'informe' ? 'text-[#f7e7a9]' : 'text-slate-500'
                        }`}>
                          article
                        </span>
                        <span>Informe Técnico</span>
                      </button>
                    </div>

                    {/* Acciones Rápidas a la derecha */}
                    <div className="flex items-center gap-1">
                      {/* Imprimir Constancia Formal */}
                      <button
                        onClick={() => handlePrintConstancia(aux)}
                        className="p-2 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Imprimir constancia de auxiliatura oficial"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">print</span>
                      </button>

                      {/* Imprimir Informe */}
                      <button
                        onClick={() => handlePrintInforme(aux)}
                        className="p-2 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Imprimir informe técnico para Consejo"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">assignment</span>
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => {
                          setEditFormData({
                            id: aux.id,
                            nombre: aux.nombre,
                            nro_registro: aux.nro_registro || '',
                            materia: aux.materia || '',
                            semestre: String(aux.semestre || '1'),
                            nota_examen: aux.nota_examen !== null ? aux.nota_examen : '',
                            estado: aux.estado || 'aprobado',
                            nro_convocatoria: aux.nro_convocatoria || '',
                            es_ratificacion: Boolean(aux.es_ratificacion)
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar antecedente del auxiliar"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={(e) => handleDelete(aux.id, aux.nombre, e)}
                        className="p-2 rounded-lg text-slate-300 hover:text-[#C1121F] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Eliminar registro"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 3. PANEL DERECHO DE EXPEDIENTE DEL AUXILIAR (DRAWER EN PC / VENTANA EMERGENTE EN MÓVILES) */}
        {selectedAux && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:w-[42%] lg:shrink-0 lg:sticky lg:top-24 transition-all duration-300 ease-in-out">
            {/* Fondo oscuro para cerrar tocando afuera en móviles */}
            <div 
              className="absolute inset-0 lg:hidden" 
              onClick={() => setSelectedAuxId(null)}
              aria-hidden="true"
            />

            <div className="relative z-10 w-full max-w-lg lg:max-w-none max-h-[88vh] lg:max-h-none overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl lg:rounded-2xl shadow-2xl lg:shadow-lg border border-slate-200/90 p-5 sm:p-6 flex flex-col gap-4">
              
              {/* Barra de Acento Superior Institucional */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C1121F] via-[#c5a059] to-[#0B2545]"></div>

              {/* Cabecera del Expediente Activo */}
              <div className="flex items-start justify-between gap-2 pt-1 border-b border-slate-100 pb-3">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-label-code text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                      EXPEDIENTE DE DOCENCIA AUXILIAR #{selectedAux.nro_registro || 'AUX'}
                    </span>
                  </div>
                  <h2 className="font-institutional-serif text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide mt-1.5 truncate">
                    {selectedAux.nombre}
                  </h2>
                  <p className="font-body-sm text-xs text-slate-500 font-medium truncate mt-0.5">
                    Cátedra: {selectedAux.materia} · Convocatoria: {selectedAux.nro_convocatoria || 'CONV-S/N'}
                  </p>
                </div>

                {/* Botón Cerrar Panel ✕ */}
                <button
                  onClick={() => setSelectedAuxId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  title="Cerrar panel"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Proceso de la convocatoria por la que fue designado (fechas y oficios de respaldo) */}
              <ProcesoDesignacion
                avance={procesoExpediente.avance}
                cargando={procesoExpediente.cargando}
                error={procesoExpediente.error}
              />

              {/* Tabs de Cambio Rápido: "Constancia de Cátedra" vs "Informe Técnico" */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('constancia')}
                  type="button"
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'constancia'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base text-[#C1121F]">
                    workspace_premium
                  </span>
                  <span>Constancia de Cátedra</span>
                </button>

                <button
                  onClick={() => setActiveTab('informe')}
                  type="button"
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'informe'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base text-slate-600">
                    article
                  </span>
                  <span>Informe Técnico</span>
                </button>
              </div>

              {/* CONTENIDO DE LA PESTAÑA 1: CONSTANCIA OFICIAL DE CÁTEDRA */}
              {activeTab === 'constancia' && (
                <div className="flex flex-col gap-3">
                  <span className="font-body-sm text-xs font-bold text-slate-700 pt-1">
                    Ficha de Acreditación Docente Institucional
                  </span>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Auxiliar Designado:</span>
                      <strong className="text-slate-900">{selectedAux.nombre}</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Registro Universitario (RU):</span>
                      <span className="font-label-code font-bold text-slate-800">{selectedAux.nro_registro || 'No registrado'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Asignatura Oficial:</span>
                      <strong className="text-[#0B2545]">{selectedAux.materia}</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Ciclo Académico:</span>
                      <span className="font-label-code font-bold text-slate-800">
                        Semestre {selectedAux.semestre === 1 ? 'I' : 'II'} / {selectedAux.gestion || gestion}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Condición de Ingreso:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedAux.es_ratificacion ? 'Ratificación de Semestre Anterior' : 'Concurso de Méritos y Examen'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Convocatoria de Origen:</span>
                      <span className="font-label-code font-bold text-[#C1121F]">{selectedAux.nro_convocatoria || 'CONV-S/N'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Calificación Evaluada:</span>
                      <strong className="text-emerald-700 text-sm">
                        {selectedAux.nota_examen ? `${selectedAux.nota_examen} / 100 pts` : (selectedAux.es_ratificacion ? 'Ratificado' : 'Aprobado')}
                      </strong>
                    </div>
                  </div>

                  {/* Botón Imprimir Constancia Oficial */}
                  <button
                    onClick={() => handlePrintConstancia(selectedAux)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#15418c] hover:shadow-md text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-[#c5a059]/30 mt-1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-[#c5a059]">print</span>
                    <span>Imprimir Constancia Oficial de Auxiliatura</span>
                  </button>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA 2: INFORME TÉCNICO DE ANTECEDENTES */}
              {activeTab === 'informe' && (
                <div className="flex flex-col gap-3">
                  <span className="font-body-sm text-xs font-bold text-slate-700 pt-1">
                    Informe Reglamentario Elevado a Decanato / Consejo
                  </span>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 text-xs leading-relaxed text-slate-700">
                    <p>
                      Oficio dirigido al <strong className="text-slate-900">Honorable Consejo Facultativo</strong> con los antecedentes de <strong className="text-slate-900">{selectedAux.nombre}</strong> en la cátedra de <strong className="text-[#0B2545]">{selectedAux.materia}</strong>: datos del auxiliar, estado de su evaluación y el proceso de la convocatoria con sus documentos de respaldo.
                    </p>
                    {procesoExpediente.avance && procesoExpediente.avance.fases.some((f) => f.cumplida && !f.documento) && (
                      <p className="flex items-start gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Hay fases sin documento de respaldo. Puedes adjuntarlo en "Expediente del proceso de convocatoria", arriba.
                      </p>
                    )}
                  </div>

                  {/* Botón Imprimir Informe Técnico */}
                  <button
                    onClick={() => handlePrintInforme(selectedAux)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C1121F] to-[#93000a] hover:shadow-md text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-white/20 mt-1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">assignment</span>
                    <span>Imprimir Informe Técnico de Cátedra</span>
                  </button>
                </div>
              )}

              {/* Pie Informativo de Auditoría */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-label-code">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Servidor Yapacaní: En línea
                </span>
                <span>Última modif: {formatFecha(selectedAux.updatedAt)}</span>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL: REGISTRAR ANTECEDENTE DE AUXILIAR (CON EFECTO CRISTAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 modal-glass-backdrop transition-all duration-300">
          <div className="modal-glass-card rounded-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            <div className="modal-glass-header text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl modal-glass-badge flex items-center justify-center text-[#c5a059]">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                </div>
                <span className="font-institutional-serif text-base font-bold">Registrar Auxiliar de Cátedra</span>
              </div>
              <button
                className="text-white/70 hover:text-white modal-glass-badge p-1.5 rounded-xl cursor-pointer"
                onClick={() => !submitting && setIsModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Nombre Completo del Auxiliar *
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                    placeholder="Ej. Univ. Andrea Silvestre Paz"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Registro Universitario (RU)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. 220038471"
                      value={formData.nro_registro}
                      onChange={(e) => setFormData({ ...formData, nro_registro: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Convocatoria de Origen
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. CONV-01/2026"
                      value={formData.nro_convocatoria}
                      onChange={(e) => setFormData({ ...formData, nro_convocatoria: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Materia / Cátedra Asignada *
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                      value={formData.materia}
                      onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                      required
                    >
                      <option value="">-- Seleccionar asignatura --</option>
                      {materiasDisponibles.map((m) => (
                        <option key={m.nombre} value={m.nombre}>
                          {m.codigo ? `[${m.codigo}] ` : ''}{m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Semestre Académico *
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                      value={formData.semestre}
                      onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                    >
                      <option value="1">Semestre I</option>
                      <option value="2">Semestre II</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Nota de Examen (1-100)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. 92"
                      max="100"
                      min="51"
                      step="0.1"
                      value={formData.nota_examen}
                      onChange={(e) => setFormData({ ...formData, nota_examen: e.target.value })}
                      type="number"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Estado de Acreditación
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="aprobado">Aprobado / Designado</option>
                      <option value="pendiente">En Proceso / Pendiente</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="es_ratificacion"
                    checked={formData.es_ratificacion}
                    onChange={(e) => setFormData({ ...formData, es_ratificacion: e.target.checked })}
                    className="w-4 h-4 text-[#0B2545] rounded cursor-pointer"
                  />
                  <label htmlFor="es_ratificacion" className="text-xs text-slate-700 font-semibold cursor-pointer">
                    Es ratificación reglamentaria del semestre anterior (sin examen de concurso)
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-[#C1121F] to-[#93000a] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Guardando...' : 'Registrar Antecedente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR AUXILIAR */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-100px)] border border-[#c5a059]/40 animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            <div className="bg-gradient-to-r from-[#07162b] via-[#0B2545] to-[#15418c] text-white px-6 py-4 flex items-center justify-between border-b border-[#c5a059]/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c5a059]">edit</span>
                <span className="font-institutional-serif text-base font-bold">Editar Antecedente de Auxiliar</span>
              </div>
              <button
                className="text-white/70 hover:text-white cursor-pointer"
                onClick={() => !submitting && setIsEditModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Nombre Completo del Auxiliar *
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                    required
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Registro Universitario (RU)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      value={editFormData.nro_registro}
                      onChange={(e) => setEditFormData({ ...editFormData, nro_registro: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Convocatoria de Origen
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      value={editFormData.nro_convocatoria}
                      onChange={(e) => setEditFormData({ ...editFormData, nro_convocatoria: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Materia / Cátedra Asignada *
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                      value={editFormData.materia}
                      onChange={(e) => setEditFormData({ ...editFormData, materia: e.target.value })}
                      required
                    >
                      <option value="">-- Seleccionar asignatura --</option>
                      {materiasDisponibles.map((m) => (
                        <option key={m.nombre} value={m.nombre}>
                          {m.codigo ? `[${m.codigo}] ` : ''}{m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Semestre Académico *
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                      value={editFormData.semestre}
                      onChange={(e) => setEditFormData({ ...editFormData, semestre: e.target.value })}
                    >
                      <option value="1">Semestre I</option>
                      <option value="2">Semestre II</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Nota de Examen (1-100)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. 92"
                      max="100"
                      min="51"
                      step="0.1"
                      value={editFormData.nota_examen}
                      onChange={(e) => setEditFormData({ ...editFormData, nota_examen: e.target.value })}
                      type="number"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Estado de Acreditación
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                      value={editFormData.estado}
                      onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value })}
                    >
                      <option value="aprobado">Aprobado / Designado</option>
                      <option value="pendiente">En Proceso / Pendiente</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="edit_es_ratificacion"
                    checked={editFormData.es_ratificacion}
                    onChange={(e) => setEditFormData({ ...editFormData, es_ratificacion: e.target.checked })}
                    className="w-4 h-4 text-[#0B2545] rounded cursor-pointer"
                  />
                  <label htmlFor="edit_es_ratificacion" className="text-xs text-slate-700 font-semibold cursor-pointer">
                    Es ratificación reglamentaria del semestre anterior
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsEditModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0B2545] to-[#15418c] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Éxito con Animación */}
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
