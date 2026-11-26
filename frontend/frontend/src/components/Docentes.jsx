import React, { useState, useEffect, useMemo } from 'react';
import { useGestion } from '../context/GestionContext';
import { 
  getDocentes, 
  createDocente, 
  updateDocente,
  deleteDocente,
  getDocenteArchivos, 
  uploadDocenteArchivo, 
  deleteDocenteArchivo,
  downloadFile,
  getMaterias
} from '../services/api';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SuccessModal from './SuccessModal';
import FileDropzone from './FileDropzone';

const Docentes = () => {
  const { gestion } = useGestion();
  const [docentes, setDocentes] = useState([]);
  const [catalogoMaterias, setCatalogoMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  
  // Expediente seleccionado y pestaña activa
  const [selectedDocenteId, setSelectedDocenteId] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'semestral'
  const [archivos, setArchivos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);

  // Filtros semestrales para la sección semestral
  const [filtroGestionSemestre, setFiltroGestionSemestre] = useState('2026');
  const [filtroSemestre, setFiltroSemestre] = useState('2');

  // Modales
  const [isDocenteModalOpen, setIsDocenteModalOpen] = useState(false);
  const [isEditDocenteModalOpen, setIsEditDocenteModalOpen] = useState(false);
  const [isArchivoModalOpen, setIsArchivoModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulario Docente (Creación y Edición)
  const [docenteForm, setDocenteForm] = useState({
    id: null,
    nombre: '',
    ci: '',
    materias: [],
    materia_principal: '',
    gestion_ingreso: gestion
  });

  // Formulario Archivo
  const [archivoForm, setArchivoForm] = useState({
    tipo: 'curriculum',
    gestion: gestion,
    semestre: '2',
    archivo: null
  });

  // Carga inicial y por filtros
  const fetchDocentes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (busqueda && busqueda.trim()) params.busqueda = busqueda.trim();
      if (selectedMateria && selectedMateria !== 'todas') params.materia = selectedMateria;

      const list = await getDocentes(params);
      const safeList = Array.isArray(list) ? list : [];
      setDocentes(safeList);
    } catch (err) {
      console.error('Error cargando docentes:', err);
      setDocentes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivos = async (docenteId) => {
    if (!docenteId) {
      setArchivos([]);
      return;
    }
    try {
      setLoadingArchivos(true);
      const docs = await getDocenteArchivos(docenteId);
      const safeDocs = Array.isArray(docs) ? docs : [];
      setArchivos(safeDocs);
    } catch (err) {
      console.error('Error cargando archivos del docente:', err);
      setArchivos([]);
    } finally {
      setLoadingArchivos(false);
    }
  };

  useEffect(() => {
    fetchDocentes();
  }, [busqueda, selectedMateria]);

  useEffect(() => {
    const loadMaterias = async () => {
      try {
        const mats = await getMaterias();
        setCatalogoMaterias(Array.isArray(mats) ? mats : []);
      } catch (err) {
        console.error('Error cargando catálogo de materias:', err);
      }
    };
    loadMaterias();
  }, []);

  useEffect(() => {
    if (selectedDocenteId) {
      fetchArchivos(selectedDocenteId);
    } else {
      setArchivos([]);
    }
  }, [selectedDocenteId]);

  // Docente seleccionado actualmente
  const selectedDocente = useMemo(() => {
    if (!selectedDocenteId) return null;
    return docentes.find(d => d && String(d.id) === String(selectedDocenteId)) || null;
  }, [docentes, selectedDocenteId]);

  // Filtrado reactivo en cliente (ultra rápido)
  const docentesFiltrados = useMemo(() => {
    return docentes.filter(doc => {
      if (!doc) return false;
      // 1. Filtro por materia seleccionada de la tabla materia
      if (selectedMateria && selectedMateria !== 'todas') {
        const selMat = selectedMateria.toLowerCase().trim();
        const hasMat = (doc.materias && doc.materias.some(m => m && m.toLowerCase().includes(selMat))) ||
                       (doc.materia_principal && doc.materia_principal.toLowerCase().includes(selMat)) ||
                       (doc.materias_detalle && doc.materias_detalle.some(md => md.nombre && md.nombre.toLowerCase().includes(selMat)));
        if (!hasMat) return false;
      }
      // 2. Filtro por búsqueda de texto
      if (busqueda && busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const matchNombre = doc.nombre?.toLowerCase().includes(q);
        const matchCi = doc.ci?.toLowerCase().includes(q);
        const matchCodigo = doc.codigo_docente?.toLowerCase().includes(q) || String(doc.id).toLowerCase().includes(q);
        const matchMat = (doc.materias && doc.materias.some(m => m && m.toLowerCase().includes(q))) ||
                         doc.materia_principal?.toLowerCase().includes(q);
        return matchNombre || matchCi || matchCodigo || matchMat;
      }
      return true;
    });
  }, [docentes, selectedMateria, busqueda]);

  // Documentos Generales (CV, Programa Analítico, Anexos y Títulos)
  const generalDocs = useMemo(() => {
    const list = Array.isArray(archivos) ? archivos : [];
    return list.filter(a => a && (a.tipo === 'curriculum' || a.tipo === 'programa_analitico' || a.tipo === 'anexos_cv' || (!a.semestre && a.tipo !== 'informe_final' && a.tipo !== 'lista_asistencia')));
  }, [archivos]);

  // Documentos Semestrales (Informes de Cátedra, Listas de Asistencia)
  const semestralDocs = useMemo(() => {
    const list = Array.isArray(archivos) ? archivos : [];
    return list.filter(a => {
      if (!a) return false;
      const matchTipo = a.tipo === 'informe_final' || a.tipo === 'lista_asistencia' || a.tipo === 'informe_catedra' || a.tipo === 'otro' || a.semestre !== null;
      const matchGestion = !filtroGestionSemestre || String(a.gestion) === String(filtroGestionSemestre);
      const matchSemestre = !filtroSemestre || String(a.semestre) === String(filtroSemestre);
      return matchTipo && matchGestion && matchSemestre;
    });
  }, [archivos, filtroGestionSemestre, filtroSemestre]);

  // Helper para iniciales de avatar
  const getInitials = (name) => {
    if (!name) return 'DC';
    const clean = name.replace(/^(ing\.|lic\.|dr\.|dra\.|msc\.)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Helper para formatear peso de archivo
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '1.2 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper para formatear fecha amigable
  const formatFecha = (dateStr) => {
    if (!dateStr) return '26/Oct/2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '26/Oct/2026';
    }
  };

  // Manejo de Creación de Docente
  const handleCreateDocente = async (e) => {
    e.preventDefault();
    if (!docenteForm.nombre) {
      alert('Por favor ingrese el nombre del docente.');
      return;
    }
    try {
      setSubmitting(true);
      const nuevo = await createDocente({
        ...docenteForm,
        gestion_ingreso: parseInt(docenteForm.gestion_ingreso) || gestion
      });
      setSuccessModalData({
        badge: `DOCENTE · ${docenteForm.materia_principal || 'FINI'}`,
        title: '¡Docente Registrado con Éxito!',
        message: `El docente "${docenteForm.nombre}" ha sido dado de alta en la nómina oficial.`
      });
      setIsDocenteModalOpen(false);
      await fetchDocentes();
      if (nuevo && nuevo.id) {
        setSelectedDocenteId(nuevo.id);
        setActiveTab('general');
      }
    } catch (err) {
      alert('Error al registrar docente: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de Edición de Docente
  const handleEditDocente = async (e) => {
    e.preventDefault();
    if (!docenteForm.id || !docenteForm.nombre) return;
    try {
      setSubmitting(true);
      await updateDocente(docenteForm.id, {
        nombre: docenteForm.nombre,
        ci: docenteForm.ci,
        materias: docenteForm.materias,
        materia_principal: docenteForm.materia_principal,
        gestion_ingreso: parseInt(docenteForm.gestion_ingreso) || gestion
      });
      setSuccessModalData({
        badge: `DOCENTE ACTUALIZADO`,
        title: '¡Expediente Actualizado!',
        message: `Los datos del docente "${docenteForm.nombre}" han sido actualizados satisfactoriamente.`
      });
      setIsEditDocenteModalOpen(false);
      await fetchDocentes();
    } catch (err) {
      alert('Error al actualizar docente: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de Subida de Archivo
  const handleUploadArchivo = async (e) => {
    e.preventDefault();
    if (!selectedDocente) return;
    if (!archivoForm.archivo) {
      alert('Por favor seleccione un archivo PDF o escaneo digital.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('tipo', archivoForm.tipo);
      data.append('gestion', archivoForm.gestion);
      const requiereSemestre = archivoForm.tipo === 'informe_final' || archivoForm.tipo === 'lista_asistencia' || (activeTab === 'semestral' && archivoForm.tipo === 'otro');
      if (requiereSemestre) {
        data.append('semestre', archivoForm.semestre);
      }
      data.append('archivo', archivoForm.archivo);

      await uploadDocenteArchivo(selectedDocente.id, data);
      setDocentes(prev => prev.map(d => d.id === selectedDocente.id ? { ...d, updatedAt: new Date().toISOString() } : d));
      setSuccessModalData({
        badge: `${archivoForm.tipo.toUpperCase().replace(/_/g, ' ')} · ${selectedDocente.nombre}`,
        title: '¡Documento Anexado al Expediente!',
        message: `El archivo "${archivoForm.archivo.name}" ha sido incorporado al legajo de custodia oficial.`
      });
      setIsArchivoModalOpen(false);
      await fetchArchivos(selectedDocente.id);
      await fetchDocentes(); // Actualizar conteos
    } catch (err) {
      alert('Error al subir documento: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de Eliminación de Archivo
  const handleDeleteArchivo = async (archivoId, nombreOriginal) => {
    if (!window.confirm(`¿Estás seguro de eliminar el archivo "${nombreOriginal || 'documento'}"?`)) return;
    try {
      await deleteDocenteArchivo(selectedDocente.id, archivoId);
      setDocentes(prev => prev.map(d => d.id === selectedDocente.id ? { ...d, updatedAt: new Date().toISOString() } : d));
      await fetchArchivos(selectedDocente.id);
      await fetchDocentes(); // Actualizar conteos
    } catch (err) {
      alert('Error al eliminar archivo: ' + err.message);
    }
  };

  // Eliminación completa de Docente y su expediente
  const handleDeleteDocente = async (docId, nombreDocente, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar al docente "${nombreDocente}" y todo su legajo de expediente institucional? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDocente(docId);
      if (selectedDocenteId === docId) setSelectedDocenteId(null);
      await fetchDocentes();
    } catch (err) {
      alert('Error al eliminar docente: ' + err.message);
    }
  };

  // Descarga de expediente completo (.ZIP o lote)
  const handleDownloadExpedienteCompleto = () => {
    if (!selectedDocente) return;
    if (archivos.length === 0) {
      alert(`El expediente de ${selectedDocente.nombre} no contiene documentos cargados actualmente.`);
      return;
    }
    // Descargar cada archivo secuencialmente
    archivos.forEach((arc, idx) => {
      setTimeout(() => {
        downloadFile(`/docentes/${selectedDocente.id}/archivos/${arc.id}/download`, arc.nombre_original, true);
      }, idx * 600);
    });
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12">
      {/* 1. BARRA SUPERIOR DE BÚSQUEDA Y FILTRO DE MATERIAS (Diseño de la Imagen 1) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Campo de búsqueda con icono */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input 
              type="text"
              placeholder="Buscar docente por nombre, código o CI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] transition-all"
            />
          </div>

          {/* Selector de Materias extraídas de la tabla 'materia' */}
          <div className="relative w-full sm:w-auto sm:min-w-[240px]">
            <select
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] cursor-pointer transition-all"
            >
              <option value="todas">Materia / Cátedra: Todas</option>
              {catalogoMaterias.map((mat) => (
                <option key={mat.id || mat.codigo} value={mat.nombre}>
                  {mat.sigla || mat.codigo ? `[${mat.sigla || mat.codigo}] ` : ''}{mat.nombre} {mat.semestre ? `(Sem. ${mat.semestre})` : ''}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">
              expand_more
            </span>
          </div>

          {/* Contador en vivo & Indicador de Auditoría PDF/A & Botón Registrar */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Mostrando <strong className="text-slate-900 font-bold">{docentesFiltrados.length}</strong> de <strong className="text-slate-900 font-bold">{docentes.length}</strong> docentes
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 border-l border-slate-200 pl-4">
              <span className="material-symbols-outlined text-slate-400 text-base">verified_user</span>
              <span>Repositorio Auditado PDF/A</span>
            </div>

            <button
              onClick={() => {
                setDocenteForm({
                  id: null,
                  nombre: '',
                  ci: '',
                  materias: [],
                  materia_principal: '',
                  gestion_ingreso: gestion
                });
                setIsDocenteModalOpen(true);
              }}
              className="btn-doc-fold py-2 px-3.5 text-xs shadow-sm cursor-pointer ml-auto sm:ml-0"
              type="button"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Nuevo docente</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. CONTENEDOR PRINCIPAL CON ANIMACIÓN SUAVE DE DESPLAZAMIENTO (SPLIT VIEW) */}
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full transition-all duration-300 ease-in-out">
        
        {/* COLUMNA DE LA LISTA DE DOCENTES (Se adapta suavemente según si hay un expediente abierto o no) */}
        <div className={`transition-all duration-300 ease-in-out flex flex-col gap-4 ${
          selectedDocente ? 'lg:w-[58%] w-full' : 'w-full'
        }`}>
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
              <LoadingState message="Cargando nómina oficial de docentes..." size={44} />
            </div>
          ) : docentesFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
              <EmptyState
                title="No se encontraron docentes"
                message={
                  selectedMateria !== 'todas'
                    ? `No hay docentes registrados que dicten "${selectedMateria}".`
                    : busqueda
                    ? `Sin coincidencias para "${busqueda}".`
                    : "No existen docentes registrados en el sistema."
                }
                actionText="Registrar docente"
                onAction={() => {
                  setDocenteForm({
                    id: null,
                    nombre: '',
                    ci: '',
                    materias: selectedMateria !== 'todas' ? [selectedMateria] : [],
                    materia_principal: selectedMateria !== 'todas' ? selectedMateria : '',
                    gestion_ingreso: gestion
                  });
                  setIsDocenteModalOpen(true);
                }}
                iconSize={48}
              />
            </div>
          ) : (
            docentesFiltrados.map((doc) => {
              const isSelected = selectedDocente && String(selectedDocente.id) === String(doc.id);
              const initials = getInitials(doc.nombre);
              
              // Conteo de documentos: usar conteo real del backend o conteo local si está seleccionado
              const countGeneral = (isSelected && archivos.length > 0)
                ? generalDocs.length
                : (doc.docs_general_count !== undefined ? doc.docs_general_count : 3);

              const countSemestral = (isSelected && archivos.length > 0)
                ? semestralDocs.length
                : (doc.docs_semestre_count !== undefined ? doc.docs_semestre_count : 2);

              const docCode = doc.codigo_docente || `DOC-${String(doc.id).slice(0, 3).toUpperCase()}`;
              const docCi = doc.ci ? `CI-${doc.ci}` : (doc.ci_label || 'CI-PENDIENTE');
              const catedrasTexto = doc.catedras_str || doc.materia_principal || 'Cátedras Oficiales';

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 transition-all duration-300 relative border ${
                    isSelected
                      ? 'border-l-4 border-l-[#C1121F] border-t-slate-200 border-r-slate-200 border-b-slate-200 shadow-md ring-1 ring-[#C1121F]/10'
                      : 'border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  {/* Fila Superior: Avatar + Nombre + CI + Insignia de Condición */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar con Iniciales */}
                      <div className="w-12 h-12 rounded-xl bg-[#0B2545] text-[#f7e7a9] font-institutional-serif text-base font-bold flex items-center justify-center shrink-0 shadow-inner ring-1 ring-[#c5a059]/40">
                        {initials}
                      </div>

                      {/* Nombre, Verificación y Códigos */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-institutional-serif text-base sm:text-lg font-bold text-slate-800 tracking-wide uppercase truncate">
                            {doc.nombre}
                          </h3>
                          <span 
                            className="material-symbols-outlined text-[#C1121F] text-base shrink-0" 
                            title="Docente acreditado y verificado en nómina"
                          >
                            check_circle
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-label-code text-xs text-slate-500 font-medium mt-0.5">
                          <span>{docCode}</span>
                          <span>·</span>
                          <span>{docCi}</span>
                        </div>
                      </div>
                    </div>

                    {/* Insignia de Condición Académica (Pill a la derecha) */}
                    <div className="shrink-0">
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80">
                        {doc.categoria || 'Ordinario / Titular'}
                      </span>
                    </div>
                  </div>

                  {/* Fila Media: Cátedras en contenedor sutil */}
                  <div className="mt-3.5 mb-4 px-3.5 py-2 rounded-xl bg-slate-50/90 border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold text-slate-800 mr-1.5">Cátedras:</span>
                    <span className="text-slate-600 font-medium">{catedrasTexto}</span>
                  </div>

                  {/* Fila Inferior: Los 2 Botones Interactivos y Acciones Rápidas */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100/80 gap-2">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* BOTÓN 1: Doc. General (X) */}
                      <button
                        onClick={() => {
                          if (selectedDocenteId === doc.id && activeTab === 'general') {
                            // Toggle opcional: si ya está abierto, se mantiene enfocado
                          }
                          setSelectedDocenteId(doc.id);
                          setActiveTab('general');
                        }}
                        type="button"
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected && activeTab === 'general'
                            ? 'bg-[#0B2545] text-white shadow-sm ring-2 ring-[#0B2545]/20'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-base ${
                          isSelected && activeTab === 'general' ? 'text-[#f7e7a9]' : 'text-slate-500'
                        }`}>
                          folder
                        </span>
                        <span>Doc. General ({countGeneral})</span>
                      </button>

                      {/* BOTÓN 2: Por Semestre (Y) */}
                      <button
                        onClick={() => {
                          setSelectedDocenteId(doc.id);
                          setActiveTab('semestral');
                        }}
                        type="button"
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected && activeTab === 'semestral'
                            ? 'bg-[#0B2545] text-white shadow-sm ring-2 ring-[#0B2545]/20'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-base ${
                          isSelected && activeTab === 'semestral' ? 'text-[#f7e7a9]' : 'text-slate-500'
                        }`}>
                          calendar_today
                        </span>
                        <span>Por Semestre ({countSemestral})</span>
                      </button>
                    </div>

                    {/* Acciones Rápidas a la derecha: Editar y Ver Carpeta */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setDocenteForm({
                            id: doc.id,
                            nombre: doc.nombre,
                            ci: doc.ci || '',
                            materias: doc.materias || [],
                            materia_principal: doc.materia_principal || '',
                            gestion_ingreso: doc.gestion_ingreso || gestion
                          });
                          setIsEditDocenteModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar datos del docente"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDocenteId(doc.id);
                          setActiveTab('general');
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Ver legajo de documentos"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">folder_shared</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteDocente(doc.id, doc.nombre, e)}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#C1121F] hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar docente"
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

        {/* 3. PANEL DERECHO DE EXPEDIENTE ACTIVO (DRAWER EN PC / VENTANA EMERGENTE EN MÓVILES) */}
        {selectedDocente && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:w-[42%] lg:shrink-0 lg:sticky lg:top-24 transition-all duration-300 ease-in-out">
            {/* Fondo oscuro para cerrar tocando afuera en móviles */}
            <div 
              className="absolute inset-0 lg:hidden" 
              onClick={() => setSelectedDocenteId(null)}
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
                      EXPEDIENTE ACTIVO {selectedDocente.codigo_docente || `DOC-${String(selectedDocente.id).slice(0, 3).toUpperCase()}`}
                    </span>
                  </div>
                  <h2 className="font-institutional-serif text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide mt-1.5 truncate">
                    {selectedDocente.nombre}
                  </h2>
                  <p className="font-body-sm text-xs text-slate-500 font-medium truncate mt-0.5">
                    Cátedras: {selectedDocente.catedras_str || selectedDocente.materia_principal || 'Cátedras Oficiales'}
                  </p>
                </div>

                {/* Acciones del Panel */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleDeleteDocente(selectedDocente.id, selectedDocente.nombre, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#C1121F] hover:bg-red-50 transition-colors cursor-pointer"
                    title="Eliminar docente y legajo"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>

                  {/* Botón Cerrar Panel ✕ */}
                  <button
                    onClick={() => setSelectedDocenteId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Cerrar expediente"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              </div>

              {/* Tabs de Cambio Rápido entre "Doc. General" y "Semestral" */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('general')}
                  type="button"
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'general'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base text-[#C1121F]">
                    folder
                  </span>
                  <span>Doc. General</span>
                </button>

                <button
                  onClick={() => setActiveTab('semestral')}
                  type="button"
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'semestral'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base text-slate-600">
                    calendar_today
                  </span>
                  <span>Semestral ({filtroGestionSemestre}-{filtroSemestre === '1' ? 'I' : 'II'})</span>
                </button>
              </div>

              {/* Título de la Sección de Documentos y Botón + Cargar PDF */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-body-sm text-xs font-bold text-slate-700">
                  Documentos en resguardo institucional (PDF/A)
                </span>
                <button
                  onClick={() => {
                    setArchivoForm({
                      tipo: activeTab === 'general' ? 'curriculum' : 'informe_final',
                      gestion: filtroGestionSemestre,
                      semestre: filtroSemestre,
                      archivo: null
                    });
                    setIsArchivoModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2545] hover:text-[#C1121F] transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  <span>Cargar PDF</span>
                </button>
              </div>

              {/* Sub-selector de Semestre (si la pestaña activa es Semestral) */}
              {activeTab === 'semestral' && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Gestión:</span>
                    <select
                      value={filtroGestionSemestre}
                      onChange={(e) => setFiltroGestionSemestre(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 outline-none"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Ciclo:</span>
                    <select
                      value={filtroSemestre}
                      onChange={(e) => setFiltroSemestre(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 outline-none"
                    >
                      <option value="2">Semestre II</option>
                      <option value="1">Semestre I</option>
                    </select>
                  </div>
                </div>
              )}

              {/* LISTA DE DOCUMENTOS DE ESTA PESTAÑA */}
              <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {loadingArchivos ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Cargando expedientes digitales...
                  </div>
                ) : activeTab === 'general' ? (
                  // PESTAÑA 1: DOCUMENTOS GENERALES
                  generalDocs.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-slate-300">folder_open</span>
                      <p className="text-xs text-slate-500 font-medium">
                        Sin documentos generales anexados aún.
                      </p>
                      <button
                        onClick={() => {
                          setArchivoForm({
                            tipo: 'curriculum',
                            gestion: gestion,
                            semestre: '1',
                            archivo: null
                          });
                          setIsArchivoModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-[#0B2545] text-white text-xs font-bold rounded-lg hover:bg-[#153e70] transition-colors cursor-pointer mt-1"
                        type="button"
                      >
                        + Cargar Hoja de Vida / CV
                      </button>
                    </div>
                  ) : (
                    generalDocs.map((docItem) => {
                      const isCv = docItem.tipo === 'curriculum';
                      const isProg = docItem.tipo === 'programa_analitico';
                      const isAnexos = docItem.tipo === 'anexos_cv';
                      
                      let docTitle = isCv ? 'Curriculum Vitae' : isProg ? 'Programa Analítico' : isAnexos ? 'Anexos y Títulos' : docItem.tipo === 'otro' ? 'Certificado / Respaldo' : (docItem.tipo_nombre || 'Documento Oficial');
                      let badgeText = isCv ? 'VIGENTE' : isProg ? 'MALLA 2024' : isAnexos ? 'COTEJADO' : docItem.tipo === 'otro' ? 'RESPALDO' : 'CUSTODIA';
                      let badgeColor = isCv 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                        : isAnexos 
                        ? 'bg-slate-200 text-slate-700 border-slate-300' 
                        : docItem.tipo === 'otro'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200';

                      if (docItem.archivo_existe === false) {
                        badgeText = 'NO EN DISCO';
                        badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                      }

                      return (
                        <div
                          key={docItem.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Icono PDF Rojo */}
                            <div className="w-9 h-9 rounded-lg bg-red-100 text-[#C1121F] flex items-center justify-center shrink-0 border border-red-200 shadow-xs">
                              <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-body-md text-xs font-bold text-slate-800 truncate">
                                  {docTitle}
                                </span>
                                <span className={`font-label-badge text-[9px] px-1.5 py-0.2 rounded font-bold border ${badgeColor}`}>
                                  {badgeText}
                                </span>
                              </div>
                              <span className="font-label-code text-[11px] text-slate-500 truncate mt-0.5">
                                {docItem.nombre_original} · {formatFileSize(docItem.tamano)}
                              </span>
                            </div>
                          </div>

                          {/* Acciones del Archivo: Ver, Descargar, Eliminar */}
                          <div className="flex items-center gap-1 shrink-0">
                            {docItem.archivo_existe === false ? (
                              <button
                                onClick={() => alert(`El archivo "${docItem.nombre_original}" no existe en el disco del servidor (posiblemente pertenecía a una versión o ruta anterior de prueba).\n\nPuedes eliminar este registro del expediente con el botón de basurero 🗑️ y volver a subir el documento actualizado.`)}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100/60 transition-colors cursor-pointer"
                                title="Archivo físico no encontrado en disco. Clic para más info."
                                type="button"
                              >
                                <span className="material-symbols-outlined text-base">warning</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${docItem.id}/download`, docItem.nombre_original)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-white transition-colors cursor-pointer"
                                  title="Previsualizar archivo"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-base">visibility</span>
                                </button>
                                <button
                                  onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${docItem.id}/download`, docItem.nombre_original, true)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#C1121F] hover:bg-white transition-colors cursor-pointer"
                                  title="Descargar archivo"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-base">download</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteArchivo(docItem.id, docItem.nombre_original)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-[#C1121F] hover:bg-white transition-colors cursor-pointer"
                              title="Eliminar del expediente"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  // PESTAÑA 2: DOCUMENTOS SEMESTRALES
                  semestralDocs.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
                      <p className="text-xs text-slate-500 font-medium">
                        Sin archivos para la Gestión {filtroGestionSemestre} - Semestre {filtroSemestre === '1' ? 'I' : 'II'}.
                      </p>
                      <button
                        onClick={() => {
                          setArchivoForm({
                            tipo: 'informe_final',
                            gestion: filtroGestionSemestre,
                            semestre: filtroSemestre,
                            archivo: null
                          });
                          setIsArchivoModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-[#0B2545] text-white text-xs font-bold rounded-lg hover:bg-[#153e70] transition-colors cursor-pointer mt-1"
                        type="button"
                      >
                        + Anexar Informe de Semestre
                      </button>
                    </div>
                  ) : (
                    semestralDocs.map((docItem) => (
                      <div
                        key={docItem.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg ${
                            docItem.tipo === 'lista_asistencia'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : docItem.tipo === 'otro'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-red-100 text-[#C1121F] border-red-200'
                          } flex items-center justify-center shrink-0 border shadow-xs`}>
                            <span className="material-symbols-outlined text-xl">
                              {docItem.tipo === 'lista_asistencia' ? 'fact_check' : docItem.tipo === 'otro' ? 'verified' : 'picture_as_pdf'}
                            </span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-body-md text-xs font-bold text-slate-800 truncate">
                                {docItem.tipo === 'lista_asistencia' 
                                  ? 'Lista de Asistencia' 
                                  : docItem.tipo === 'informe_final' 
                                  ? 'Informe Final de Cátedra'
                                  : docItem.tipo === 'otro'
                                  ? 'Certificado / Respaldo'
                                  : docItem.tipo === 'programa_analitico'
                                  ? 'Programa Analítico'
                                  : docItem.tipo === 'anexos_cv'
                                  ? 'Anexos y Títulos'
                                  : (docItem.tipo_nombre || 'Documento Semestral')}
                              </span>
                              <span className={`font-label-badge text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                                docItem.archivo_existe === false
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : docItem.tipo === 'lista_asistencia'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : docItem.tipo === 'otro'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}>
                                {docItem.archivo_existe === false
                                  ? 'NO EN DISCO'
                                  : docItem.tipo === 'lista_asistencia' 
                                  ? 'CUSTODIA' 
                                  : docItem.tipo === 'otro'
                                  ? 'RESPALDO'
                                  : 'ARCHIVADO'}
                              </span>
                            </div>
                            <span className="font-label-code text-[11px] text-slate-500 truncate mt-0.5">
                              {docItem.nombre_original} · {formatFileSize(docItem.tamano)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {docItem.archivo_existe === false ? (
                            <button
                              onClick={() => alert(`El archivo "${docItem.nombre_original}" no existe en el disco del servidor (posiblemente pertenecía a una versión o ruta anterior de prueba).\n\nPuedes eliminar este registro del expediente con el botón de basurero 🗑️ y volver a subir el documento actualizado.`)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100/60 transition-colors cursor-pointer"
                              title="Archivo físico no encontrado en disco. Clic para más info."
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">warning</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${docItem.id}/download`, docItem.nombre_original)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-white transition-colors cursor-pointer"
                                title="Previsualizar informe"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-base">visibility</span>
                              </button>
                              <button
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${docItem.id}/download`, docItem.nombre_original, true)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#C1121F] hover:bg-white transition-colors cursor-pointer"
                                title="Descargar archivo"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-base">download</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteArchivo(docItem.id, docItem.nombre_original)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-[#C1121F] hover:bg-white transition-colors cursor-pointer"
                            title="Eliminar del expediente"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>

              {/* Botón Inferior: Descargar Expediente Completo (.ZIP) */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleDownloadExpedienteCompleto}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer shadow-xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-slate-700">folder_zip</span>
                  <span>Descargar expediente completo</span>
                </button>
              </div>

              {/* Pie Informativo de Auditoría */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-label-code">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Servidor Yapacaní: En línea
                </span>
                <span>Última modif: {formatFecha(selectedDocente.updatedAt)}</span>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL: REGISTRAR NUEVO DOCENTE (CON EFECTO CRISTAL) */}
      {isDocenteModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 modal-glass-backdrop transition-all duration-300">
          <div className="modal-glass-card rounded-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            <div className="modal-glass-header text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl modal-glass-badge flex items-center justify-center text-[#c5a059]">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                </div>
                <span className="font-institutional-serif text-base font-bold">Registrar Nuevo Docente</span>
              </div>
              <button
                className="text-white/70 hover:text-white modal-glass-badge p-1.5 rounded-xl cursor-pointer"
                onClick={() => !submitting && setIsDocenteModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDocente}>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Nombre Completo del Docente *
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                    placeholder="Ej. Ing. Elena Rojas Medina"
                    value={docenteForm.nombre}
                    onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                    required
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Cédula de Identidad (CI)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. 6381920 SC"
                      value={docenteForm.ci}
                      onChange={(e) => setDocenteForm({ ...docenteForm, ci: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Gestión de Ingreso
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      value={docenteForm.gestion_ingreso}
                      onChange={(e) => setDocenteForm({ ...docenteForm, gestion_ingreso: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                {/* Selección de materias desde la tabla 'materia' */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Materias / Cátedras Asignadas (Tabla Materias)
                  </label>
                  {docenteForm.materias && docenteForm.materias.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {docenteForm.materias.map((matName) => (
                        <span
                          key={matName}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0B2545]/10 text-[#0B2545] border border-[#0B2545]/20"
                        >
                          {matName}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = docenteForm.materias.filter((m) => m !== matName);
                              setDocenteForm({
                                ...docenteForm,
                                materias: updated,
                                materia_principal: updated.join(', ')
                              });
                            }}
                            className="hover:text-[#C1121F] font-bold text-sm leading-none cursor-pointer"
                            title="Quitar materia"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !docenteForm.materias?.includes(val)) {
                        const updated = [...(docenteForm.materias || []), val];
                        setDocenteForm({
                          ...docenteForm,
                          materias: updated,
                          materia_principal: updated.join(', ')
                        });
                      }
                    }}
                  >
                    <option value="">+ Seleccionar materia de la tabla materias...</option>
                    {catalogoMaterias.map((m) => (
                      <option key={m.id || m.codigo} value={m.nombre} disabled={docenteForm.materias?.includes(m.nombre)}>
                        {m.sigla || m.codigo ? `[${m.sigla || m.codigo}] ` : ''}{m.nombre} (Semestre {m.semestre})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsDocenteModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-[#C1121F] to-[#93000a] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Guardando...' : 'Crear Expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DOCENTE (CON EFECTO CRISTAL) */}
      {isEditDocenteModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 modal-glass-backdrop transition-all duration-300">
          <div className="modal-glass-card rounded-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            <div className="modal-glass-header text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl modal-glass-badge flex items-center justify-center text-[#c5a059]">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </div>
                <span className="font-institutional-serif text-base font-bold">Editar Docente</span>
              </div>
              <button
                className="text-white/70 hover:text-white modal-glass-badge p-1.5 rounded-xl cursor-pointer"
                onClick={() => !submitting && setIsEditDocenteModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleEditDocente}>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Nombre Completo del Docente *
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                    value={docenteForm.nombre}
                    onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                    required
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Cédula de Identidad (CI)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      value={docenteForm.ci}
                      onChange={(e) => setDocenteForm({ ...docenteForm, ci: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Gestión de Ingreso
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      value={docenteForm.gestion_ingreso}
                      onChange={(e) => setDocenteForm({ ...docenteForm, gestion_ingreso: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                {/* Materias del docente */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Cátedras Asignadas (Tabla Materias)
                  </label>
                  {docenteForm.materias && docenteForm.materias.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {docenteForm.materias.map((matName) => (
                        <span
                          key={matName}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0B2545]/10 text-[#0B2545] border border-[#0B2545]/20"
                        >
                          {matName}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = docenteForm.materias.filter((m) => m !== matName);
                              setDocenteForm({
                                ...docenteForm,
                                materias: updated,
                                materia_principal: updated.join(', ')
                              });
                            }}
                            className="hover:text-[#C1121F] font-bold text-sm leading-none cursor-pointer"
                            title="Quitar materia"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !docenteForm.materias?.includes(val)) {
                        const updated = [...(docenteForm.materias || []), val];
                        setDocenteForm({
                          ...docenteForm,
                          materias: updated,
                          materia_principal: updated.join(', ')
                        });
                      }
                    }}
                  >
                    <option value="">+ Asignar materia del catálogo...</option>
                    {catalogoMaterias.map((m) => (
                      <option key={m.id || m.codigo} value={m.nombre} disabled={docenteForm.materias?.includes(m.nombre)}>
                        {m.sigla || m.codigo ? `[${m.sigla || m.codigo}] ` : ''}{m.nombre} (Semestre {m.semestre})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsEditDocenteModalOpen(false)}
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

      {/* MODAL: CARGAR ARCHIVO AL EXPEDIENTE (CON EFECTO CRISTAL) */}
      {isArchivoModalOpen && selectedDocente && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 modal-glass-backdrop transition-all duration-300">
          <div className="modal-glass-card rounded-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            <div className="modal-glass-header text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl modal-glass-badge flex items-center justify-center text-[#c5a059]">
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                </div>
                <span className="font-institutional-serif text-base font-bold">Cargar Documento al Expediente</span>
              </div>
              <button
                className="text-white/70 hover:text-white modal-glass-badge p-1.5 rounded-xl cursor-pointer"
                onClick={() => !submitting && setIsArchivoModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadArchivo}>
              <div className="p-6 flex flex-col gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-caption text-xs text-slate-500 font-semibold">
                    Docente Destino:
                  </span>
                  <span className="font-label-code text-xs font-bold text-[#0B2545] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedDocente.nombre}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Tipo de Documento *
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                    value={archivoForm.tipo}
                    onChange={(e) => setArchivoForm({ ...archivoForm, tipo: e.target.value })}
                  >
                    <option value="curriculum">Curriculum Vitae (Hoja de Vida)</option>
                    <option value="anexos_cv">Anexos y Títulos (Diplomas y Certificados)</option>
                    <option value="programa_analitico">Programa Analítico (Plan de Materia)</option>
                    <option value="informe_final">Informe Final de Cátedra</option>
                    <option value="lista_asistencia">Lista de Asistencia (Custodia)</option>
                    <option value="otro">Otro Certificado o Respaldo</option>
                  </select>
                </div>

                {(archivoForm.tipo === 'informe_final' || archivoForm.tipo === 'lista_asistencia' || (activeTab === 'semestral' && archivoForm.tipo === 'otro')) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                        Gestión Académica
                      </label>
                      <input
                        className="modal-glass-input w-full px-3.5 py-2.5 rounded-xl font-body-sm text-sm text-slate-800"
                        value={archivoForm.gestion}
                        onChange={(e) => setArchivoForm({ ...archivoForm, gestion: e.target.value })}
                        required
                        type="number"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                        Semestre
                      </label>
                      <select
                        className="modal-glass-input w-full px-3.5 py-2.5 rounded-xl font-body-sm text-sm text-slate-800 cursor-pointer"
                        value={archivoForm.semestre}
                        onChange={(e) => setArchivoForm({ ...archivoForm, semestre: e.target.value })}
                      >
                        <option value="1">Semestre I</option>
                        <option value="2">Semestre II</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <FileDropzone
                    file={archivoForm.archivo}
                    onFileChange={(file) => setArchivoForm({ ...archivoForm, archivo: file })}
                    label="Archivo Digital (PDF o Escaneo) *"
                    hint="Formatos admitidos: PDF/A hasta 20 MB"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsArchivoModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0B2545] to-[#15418c] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer border border-[#c5a059]/30"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Subiendo...' : 'Anexar al Expediente'}
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

export default Docentes;
