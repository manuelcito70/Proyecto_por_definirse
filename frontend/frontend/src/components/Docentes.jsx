import React, { useState, useEffect, useMemo } from 'react';
import { useGestion } from '../context/GestionContext';
import { 
  getDocentes, 
  createDocente, 
  getDocenteArchivos, 
  uploadDocenteArchivo, 
  deleteDocenteArchivo,
  downloadFile 
} from '../services/api';
import PersonalAcademicoDock from './PersonalAcademicoDock';

const Docentes = () => {
  const { gestion } = useGestion();
  const [docentes, setDocentes] = useState([]);
  const [selectedDocenteId, setSelectedDocenteId] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Semestral filter controls for Section 2
  const [filtroGestionSemestre, setFiltroGestionSemestre] = useState('2026');
  const [filtroSemestre, setFiltroSemestre] = useState('2');

  // Modals
  const [isDocenteModalOpen, setIsDocenteModalOpen] = useState(false);
  const [isArchivoModalOpen, setIsArchivoModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Docente
  const [docenteForm, setDocenteForm] = useState({
    nombre: '',
    ci: '',
    materia_principal: '',
    gestion_ingreso: gestion
  });

  // Form Archivo
  const [archivoForm, setArchivoForm] = useState({
    tipo: 'informe_final',
    gestion: gestion,
    semestre: '2',
    archivo: null
  });

  const fetchDocentes = async () => {
    try {
      setLoading(true);
      const list = await getDocentes({ busqueda: busqueda || undefined });
      const safeList = Array.isArray(list) ? list : [];
      setDocentes(safeList);
      if (safeList.length > 0 && (!selectedDocenteId || !safeList.find(d => d.id === selectedDocenteId))) {
        setSelectedDocenteId(safeList[0].id);
      }
    } catch (err) {
      console.error('Error cargando docentes:', err);
      setDocentes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivos = async (docenteId) => {
    if (!docenteId) return;
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
  }, [busqueda]);

  useEffect(() => {
    if (selectedDocenteId) {
      fetchArchivos(selectedDocenteId);
    } else {
      setArchivos([]);
    }
  }, [selectedDocenteId]);

  const selectedDocente = useMemo(() => {
    const list = Array.isArray(docentes) ? docentes : [];
    return list.find(d => d && String(d.id) === String(selectedDocenteId)) || list[0] || null;
  }, [docentes, selectedDocenteId]);

  // General documents (CV, programa analitico, anexos)
  const generalDocs = useMemo(() => {
    const list = Array.isArray(archivos) ? archivos : [];
    return list.filter(a => a && (a.tipo === 'curriculum' || a.tipo === 'programa_analitico'));
  }, [archivos]);

  // Semestral documents (informes, listas de asistencia)
  const semestralDocs = useMemo(() => {
    const list = Array.isArray(archivos) ? archivos : [];
    return list.filter(a => {
      if (!a) return false;
      const matchTipo = a.tipo === 'informe_final' || a.tipo === 'lista_asistencia' || a.tipo === 'informe_cathedra' || a.tipo === 'otro';
      const matchGestion = !filtroGestionSemestre || String(a.gestion) === String(filtroGestionSemestre);
      const matchSemestre = !filtroSemestre || String(a.semestre) === String(filtroSemestre);
      return matchTipo && matchGestion && matchSemestre;
    });
  }, [archivos, filtroGestionSemestre, filtroSemestre]);

  const getInitials = (name) => {
    if (!name) return 'DC';
    const clean = name.replace(/^(ing\.|lic\.|dr\.|dra\.|msc\.)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

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
      setIsDocenteModalOpen(false);
      await fetchDocentes();
      if (nuevo && nuevo.id) {
        setSelectedDocenteId(nuevo.id);
      }
    } catch (err) {
      alert('Error al registrar docente: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadArchivo = async (e) => {
    e.preventDefault();
    if (!selectedDocente) return;
    if (!archivoForm.archivo) {
      alert('Por favor seleccione un archivo PDF o escaneo.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('tipo', archivoForm.tipo);
      data.append('gestion', archivoForm.gestion);
      if (archivoForm.tipo !== 'curriculum') {
        data.append('semestre', archivoForm.semestre);
      }
      data.append('archivo', archivoForm.archivo);

      await uploadDocenteArchivo(selectedDocente.id, data);
      setIsArchivoModalOpen(false);
      await fetchArchivos(selectedDocente.id);
    } catch (err) {
      alert('Error al subir documento: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArchivo = async (archivoId, nombreOriginal) => {
    if (!window.confirm(`¿Estás seguro de eliminar el archivo ${nombreOriginal || ''}?`)) return;
    try {
      await deleteDocenteArchivo(selectedDocente.id, archivoId);
      fetchArchivos(selectedDocente.id);
    } catch (err) {
      alert('Error al eliminar archivo: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sub-header / Breadcrumbs & Page Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
            <span>Gestión documental</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-semibold">Docentes</span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-0.5">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Docentes</h1>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Archivo por docente: datos oficiales y documentos aportados para su conservación institucional.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            onClick={() => {
              setDocenteForm({
                nombre: '',
                ci: '',
                materia_principal: '',
                gestion_ingreso: gestion
              });
              setIsDocenteModalOpen(true);
            }}
            className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold hover:bg-on-secondary-fixed-variant shadow-md shadow-secondary/20 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-lg leading-none">person_add</span>
            <span>Registrar docente</span>
          </button>
        </div>
      </div>

      {/* Banner Informativo Superior & CV Metric Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-lg">
        <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-space-md shadow-sm flex items-start gap-space-md relative overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </div>
          <div className="flex flex-col gap-1 pr-space-md">
            <span className="font-body-sm text-body-sm font-bold text-on-surface">Conservación Documental Auditada</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Documentos del docente, conservados sin modificar su contenido. Dirección escanea o carga archivos en formato{' '}
              <strong className="font-semibold text-on-surface font-label-code text-caption">PDF/A</strong> homologado para consultar el historial de carrera y descargar respaldos auditables.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-surface-container-highest/40 pointer-events-none"></div>
        </div>

        <div className="lg:col-span-4 bg-primary-container text-on-primary rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-label-badge text-caption tracking-wider uppercase px-2 py-0.5 rounded-full bg-secondary text-on-secondary">
              Regla Institucional
            </span>
            <span className="font-label-code text-caption text-primary-fixed">RES-DIR-04/26</span>
          </div>
          <div className="my-space-xs">
            <div className="font-headline-md text-headline-md font-bold tracking-tight text-surface-container-lowest">
              CV ACTUALIZABLE
            </div>
            <p className="font-caption text-caption text-on-primary-container mt-1">
              No se exige una entrega nueva cada semestre lectivo ({gestion}). Se mantiene en resguardo permanente hasta actualización expresa.
            </p>
          </div>
          <div className="w-full bg-surface-container-lowest/10 h-1 rounded-full overflow-hidden mt-1">
            <div className="bg-secondary h-full rounded-full w-full"></div>
          </div>
        </div>
      </div>

      {/* Layout Principal a Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* COLUMNA IZQUIERDA: Directorio y Archivo por Docente (4 cols en escritorio) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-headline-md text-on-surface">Archivo por docente</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-code text-caption text-secondary font-bold">
                  {docentes.length} Activos
                </span>
              </div>
              <button
                onClick={() => setBusqueda('')}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                title="Limpiar búsqueda"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">filter_list</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="relative mb-space-md">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
                search
              </span>
              <input
                className="w-full pl-9 pr-space-md py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/40 transition-all"
                placeholder="Buscar docente o materia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                type="text"
              />
            </div>

            {/* Lista Selectora de Docentes */}
            <div className="flex flex-col gap-space-xs" id="docentes-list">
              {loading ? (
                <div className="p-4 text-center text-on-surface-variant text-sm">
                  Cargando nómina docente...
                </div>
              ) : docentes.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant text-sm">
                  No se encontraron docentes registrados.
                </div>
              ) : (
                docentes.map((doc) => {
                  const isSelected = selectedDocente && String(selectedDocente.id) === String(doc.id);
                  const initials = getInitials(doc.nombre);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocenteId(doc.id)}
                      className={`group ${
                        isSelected
                          ? 'relative bg-primary-container text-on-primary shadow-md'
                          : 'bg-surface-container-lowest hover:bg-surface-container-low text-on-surface'
                      } flex items-center justify-between p-space-md rounded-xl cursor-pointer transition-all`}
                    >
                      <div className="flex items-center gap-space-sm min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg ${
                            isSelected
                              ? 'bg-secondary text-on-secondary shadow-inner'
                              : 'bg-surface-container text-on-surface'
                          } flex items-center justify-center font-headline-md text-headline-md shrink-0`}
                        >
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`font-body-md text-body-md ${
                              isSelected
                                ? 'font-bold text-surface-container-lowest'
                                : 'font-medium text-on-surface group-hover:text-secondary'
                            } truncate transition-colors`}
                          >
                            {doc.nombre}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`font-label-code text-caption ${
                                isSelected ? 'text-secondary-fixed' : 'text-on-surface-variant'
                              }`}
                            >
                              {doc.ci ? `CI: ${doc.ci}` : `ID: DOC-${doc.id}`}
                            </span>
                            <span
                              className={`w-1 h-1 rounded-full ${
                                isSelected ? 'bg-secondary-fixed/50' : 'bg-outline-variant'
                              }`}
                            ></span>
                            <span
                              className={`font-caption text-caption ${
                                isSelected ? 'text-on-primary-container' : 'text-on-surface-variant'
                              } truncate`}
                            >
                              {doc.materia_principal || 'Docente Titular'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="material-symbols-outlined text-secondary-fixed text-lg shrink-0">
                          check_circle
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-outline-variant group-hover:text-on-surface-variant text-lg shrink-0">
                          chevron_right
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant font-caption text-caption border-t border-outline-variant/20">
              <span>
                Total registrados: <strong>{docentes.length} docentes</strong>
              </span>
              <button
                onClick={() => setBusqueda('')}
                className="text-secondary hover:underline font-semibold cursor-pointer"
                type="button"
              >
                Ver todos
              </button>
            </div>
          </div>

          {/* Card auxiliar de auditoría rápida */}
          <div className="bg-surface-container-high rounded-xl p-space-md shadow-sm">
            <div className="flex items-center gap-space-xs text-on-surface font-headline-md text-headline-md mb-1">
              <span className="material-symbols-outlined text-secondary">history_edu</span>
              <span>Depósito Central FINI</span>
            </div>
            <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
              Los legajos digitales cuentan con respaldo criptográfico en el servidor local de Yapacaní. La integridad documental se verifica semestralmente ante el Honorable Consejo Facultativo.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: Expediente Oficial Seleccionado (8 cols en escritorio) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {selectedDocente ? (
            <>
              {/* Ficha de Encabezado Oficial */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm">
                  <div className="flex items-center gap-space-md">
                    <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary font-headline-lg text-headline-lg font-bold shadow-inner">
                      {getInitials(selectedDocente.nombre)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-space-xs">
                        <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
                          {selectedDocente.nombre}
                        </h2>
                        <span className="material-symbols-outlined text-secondary text-xl" title="Docente validado en nómina">
                          verified
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Cátedras: {selectedDocente.materia_principal || 'Asignaturas de Sistemas'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-xs self-start sm:self-auto">
                    <button
                      onClick={() => {
                        setArchivoForm({
                          tipo: 'informe_final',
                          gestion: gestion,
                          semestre: '2',
                          archivo: null
                        });
                        setIsArchivoModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container font-body-sm text-body-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      <span>Anexar archivo</span>
                    </button>
                    <button
                      onClick={() => alert(`Expediente de ${selectedDocente.nombre} con ${archivos.length} archivos indexados en servidor FINI.`)}
                      className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                      title="Detalle del legajo"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">folder_zip</span>
                    </button>
                  </div>
                </div>

                {/* Metadatos de Legajo Oficial */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-xs">
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                    <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                      Registro de Archivo
                    </span>
                    <span className="font-label-code text-body-md font-bold text-secondary mt-0.5">
                      DOC-{String(selectedDocente.id).padStart(3, '0')}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                    <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                      Cédula de Identidad
                    </span>
                    <span className="font-label-code text-body-md font-semibold text-on-surface mt-0.5">
                      {selectedDocente.ci || 'No registrada'}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                    <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                      Condición Académica
                    </span>
                    <span className="font-body-md text-body-md font-semibold text-on-surface mt-0.5 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      Ordinario / Titular
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 1: Documentación General (Conservación continua) */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-xl">folder_shared</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Documentación general</h3>
                    </div>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Conservación continua · Sin obligación de renovación semestral
                    </span>
                  </div>
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
                    className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container font-body-sm text-body-sm font-semibold text-secondary hover:bg-secondary-fixed transition-colors cursor-pointer self-start sm:self-auto"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">upload_file</span>
                    <span>Cargar PDF</span>
                  </button>
                </div>

                {/* Lista de Documentos Generales */}
                <div className="flex flex-col gap-space-xs mt-1">
                  {/* DOC ITEM 1: CV */}
                  {(() => {
                    const cv = generalDocs.find(a => a.tipo === 'curriculum');
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors gap-space-sm">
                        <div className="flex items-start gap-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-body-md text-body-md font-semibold text-on-surface">Curriculum vitae</span>
                              <span className="font-label-badge text-caption px-1.5 py-0.5 rounded bg-surface-container-highest text-on-secondary-fixed font-bold">
                                {cv ? 'VIGENTE' : 'PENDIENTE'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 font-label-code text-caption text-on-surface-variant">
                              <span className="text-secondary font-medium">
                                {cv ? cv.nombre_original : `cv_${selectedDocente.nombre.toLowerCase().replace(/\s+/g, '_')}.pdf`}
                              </span>
                              <span>·</span>
                              <span>PDF/A-1b</span>
                              <span>·</span>
                              <span>{cv ? 'En resguardo' : 'No adjunto aún'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          {cv ? (
                            <>
                              <button
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${cv.id}/download`, cv.nombre_original)}
                                className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-lowest transition-colors cursor-pointer"
                                title="Ver escaneo oficial"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${cv.id}/download`, cv.nombre_original)}
                                className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-lowest transition-colors cursor-pointer"
                                title="Descargar archivo"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">download</span>
                              </button>
                              <button
                                onClick={() => handleDeleteArchivo(cv.id, cv.nombre_original)}
                                className="p-2 rounded-lg text-outline-variant hover:text-error hover:bg-surface-container-lowest transition-colors cursor-pointer"
                                title="Eliminar archivo"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </>
                          ) : (
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
                              className="px-3 py-1 bg-secondary text-on-secondary text-caption font-semibold rounded-lg hover:bg-secondary-container transition-colors cursor-pointer"
                              type="button"
                            >
                              + Cargar CV
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* DOC ITEM 2: Programa Analítico */}
                  {(() => {
                    const prog = generalDocs.find(a => a.tipo === 'programa_analitico');
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors gap-space-sm">
                        <div className="flex items-start gap-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-body-md text-body-md font-semibold text-on-surface">
                                Programa analítico - {selectedDocente.materia_principal || 'Cátedra Oficial'}
                              </span>
                              <span className="font-label-badge text-caption px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">
                                {prog ? 'HOMOLOGADO' : 'PENDIENTE'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 font-label-code text-caption text-on-surface-variant">
                              <span className="text-secondary font-medium">
                                {prog ? prog.nombre_original : 'programa_analitico_sistemas.pdf'}
                              </span>
                              <span>·</span>
                              <span>Plan UAGRM</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          {prog ? (
                            <>
                              <button
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${prog.id}/download`, prog.nombre_original)}
                                className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-lowest transition-colors cursor-pointer"
                                title="Ver escaneo oficial"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${prog.id}/download`, prog.nombre_original)}
                                className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-lowest transition-colors cursor-pointer"
                                title="Descargar archivo"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">download</span>
                              </button>
                              <button
                                onClick={() => handleDeleteArchivo(prog.id, prog.nombre_original)}
                                className="p-2 rounded-lg text-outline-variant hover:text-error hover:bg-surface-container-lowest transition-colors cursor-pointer"
                                title="Eliminar archivo"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setArchivoForm({
                                  tipo: 'programa_analitico',
                                  gestion: gestion,
                                  semestre: '1',
                                  archivo: null
                                });
                                setIsArchivoModalOpen(true);
                              }}
                              className="px-3 py-1 bg-surface-container-highest text-secondary text-caption font-semibold rounded-lg hover:bg-secondary-fixed transition-colors cursor-pointer"
                              type="button"
                            >
                              + Cargar Programa
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* SECCIÓN 2: Documentación por Semestre */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-xs">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-xl">date_range</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Documentación por semestre</h3>
                    </div>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Depósitos periódicos requeridos por cada ciclo académico regular
                    </span>
                  </div>

                  {/* Selectores de Ciclo & Botón Cargar */}
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <div className="flex items-center bg-surface-container-low rounded-lg p-1">
                      <select
                        className="bg-transparent font-label-code text-body-sm font-semibold text-on-surface px-2 py-1 outline-none cursor-pointer"
                        value={filtroGestionSemestre}
                        onChange={(e) => setFiltroGestionSemestre(e.target.value)}
                      >
                        <option value="2026">Gestión: 2026</option>
                        <option value="2025">Gestión: 2025</option>
                        <option value="2024">Gestión: 2024</option>
                      </select>
                      <div className="h-4 w-px bg-outline-variant mx-1"></div>
                      <select
                        className="bg-transparent font-label-code text-body-sm font-semibold text-on-surface px-2 py-1 outline-none cursor-pointer"
                        value={filtroSemestre}
                        onChange={(e) => setFiltroSemestre(e.target.value)}
                      >
                        <option value="2">II Semestre</option>
                        <option value="1">I Semestre</option>
                      </select>
                    </div>

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
                      className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold hover:bg-on-secondary-fixed-variant transition-colors cursor-pointer shadow-sm"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg leading-none">add_circle</span>
                      <span>Cargar documentación</span>
                    </button>
                  </div>
                </div>

                {/* Archivos Semestrales Registrados */}
                <div className="flex flex-col gap-space-xs">
                  {loadingArchivos ? (
                    <div className="p-4 text-center text-on-surface-variant text-sm">
                      Consultando archivos semestrales...
                    </div>
                  ) : semestralDocs.length === 0 ? (
                    <div className="p-6 text-center bg-surface-container-low/50 rounded-xl text-on-surface-variant flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-outline-variant">folder_off</span>
                      <p className="font-body-sm text-body-sm">
                        No hay archivos registrados para el <strong>Semestre {filtroSemestre === '1' ? 'I' : 'II'} / {filtroGestionSemestre}</strong>.
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
                        className="px-3 py-1.5 rounded-lg bg-surface-container text-secondary text-body-sm font-semibold hover:bg-surface-container-high transition-colors cursor-pointer mt-1"
                        type="button"
                      >
                        + Anexar informe o lista de asistencia
                      </button>
                    </div>
                  ) : (
                    semestralDocs.map((arc) => (
                      <div
                        key={arc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors gap-space-sm"
                      >
                        <div className="flex items-start gap-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-secondary flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-xl">
                              {arc.tipo === 'lista_asistencia' ? 'fact_check' : 'description'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-body-md text-body-md font-semibold text-on-surface">
                                {arc.tipo === 'lista_asistencia' ? 'Lista de asistencia' : 'Informe final / de cátedra'}
                              </span>
                              <span className="font-label-badge text-caption px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-bold">
                                {arc.tipo === 'lista_asistencia' ? 'CUSTODIA' : 'ARCHIVADO'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 font-label-code text-caption text-on-surface-variant">
                              <span className="text-secondary font-medium">{arc.nombre_original}</span>
                              <span>·</span>
                              <span>Semestre {arc.semestre === 1 ? 'I' : 'II'} / {arc.gestion}</span>
                              <span>·</span>
                              <span>Entregado a Dirección</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          <button
                            onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${arc.id}/download`, arc.nombre_original)}
                            className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-lowest transition-colors cursor-pointer"
                            title="Ver informe oficial"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${arc.id}/download`, arc.nombre_original)}
                            className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-lowest transition-colors cursor-pointer"
                            title="Descargar archivo"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArchivo(arc.id, arc.nombre_original)}
                            className="p-2 rounded-lg text-outline-variant hover:text-error hover:bg-surface-container-lowest transition-colors cursor-pointer"
                            title="Eliminar archivo"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Nota aclaratoria reglamentaria al pie del expediente */}
                <div className="mt-space-sm p-space-md rounded-lg bg-surface-container-low flex items-start gap-space-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-secondary text-lg shrink-0 mt-0.5">info</span>
                  <p className="font-caption text-caption leading-relaxed">
                    <strong className="font-semibold text-on-surface">Nota aclaratoria:</strong> La lista de asistencia se conserva únicamente como documento de custodia. No incluye control de asistencia ni actas de notas registradas en CPD. Para calificaciones oficiales remitirse al Sistema de Procesamiento de Datos central UAGRM.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg text-center text-on-surface-variant">
              Seleccione un docente del directorio para consultar su expediente.
            </div>
          )}
        </div>
      </div>

      {/* MODAL REGISTRAR NUEVO DOCENTE */}
      {isDocenteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary-fixed">person_add</span>
                <span className="font-headline-md text-headline-md font-bold">Registrar Nuevo Docente</span>
              </div>
              <button
                className="text-on-primary/70 hover:text-on-primary cursor-pointer"
                onClick={() => !submitting && setIsDocenteModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDocente}>
              <div className="p-space-lg flex flex-col gap-space-md">
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                    Nombre Completo del Docente *
                  </label>
                  <input
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    placeholder="Ej. Ing. Mario Renato Chocala"
                    value={docenteForm.nombre}
                    onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                    required
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Cédula de Identidad (CI)
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. 4829102 SC"
                      value={docenteForm.ci}
                      onChange={(e) => setDocenteForm({ ...docenteForm, ci: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Gestión de Ingreso
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      value={docenteForm.gestion_ingreso}
                      onChange={(e) => setDocenteForm({ ...docenteForm, gestion_ingreso: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                    Materia Principal / Cátedra Asignada
                  </label>
                  <input
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    placeholder="Ej. Programación I · Algoritmos y Estructuras"
                    value={docenteForm.materia_principal}
                    onChange={(e) => setDocenteForm({ ...docenteForm, materia_principal: e.target.value })}
                    type="text"
                  />
                </div>
              </div>

              <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-end gap-space-sm">
                <button
                  className="px-space-md py-2 rounded-lg font-body-sm text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsDocenteModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm font-semibold shadow-sm hover:bg-primary transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* MODAL CARGAR ARCHIVO AL EXPEDIENTE */}
      {isArchivoModalOpen && selectedDocente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary-fixed">upload_file</span>
                <span className="font-headline-md text-headline-md font-bold">Cargar Documento al Expediente</span>
              </div>
              <button
                className="text-on-primary/70 hover:text-on-primary cursor-pointer"
                onClick={() => !submitting && setIsArchivoModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadArchivo}>
              <div className="p-space-lg flex flex-col gap-space-md">
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-caption text-caption text-on-surface-variant font-semibold">
                    Docente Destino:
                  </span>
                  <span className="font-label-code text-label-code font-bold text-secondary bg-surface-container px-2 py-0.5 rounded">
                    {selectedDocente.nombre}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                    Tipo de Documento *
                  </label>
                  <select
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    value={archivoForm.tipo}
                    onChange={(e) => setArchivoForm({ ...archivoForm, tipo: e.target.value })}
                  >
                    <option value="informe_final">Informe final de cátedra</option>
                    <option value="lista_asistencia">Lista de asistencia (Custodia)</option>
                    <option value="curriculum">Hoja de vida / Currículum vitae</option>
                    <option value="programa_analitico">Programa analítico archivado</option>
                    <option value="otro">Otro certificado o respaldo académico</option>
                  </select>
                </div>

                {archivoForm.tipo !== 'curriculum' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-1">
                      <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                        Gestión Académica
                      </label>
                      <input
                        className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        value={archivoForm.gestion}
                        onChange={(e) => setArchivoForm({ ...archivoForm, gestion: e.target.value })}
                        required
                        type="number"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                        Semestre
                      </label>
                      <select
                        className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        value={archivoForm.semestre}
                        onChange={(e) => setArchivoForm({ ...archivoForm, semestre: e.target.value })}
                      >
                        <option value="1">Semestre I</option>
                        <option value="2">Semestre II</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                    Archivo Digital (PDF o Escaneo) *
                  </label>
                  <label className="border-2 border-dashed border-outline-variant hover:border-secondary rounded-lg p-space-md flex flex-col items-center justify-center gap-1 cursor-pointer bg-surface-container-low/40 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-secondary">upload_file</span>
                    <span className="font-body-sm text-body-sm font-medium text-on-surface">
                      {archivoForm.archivo ? archivoForm.archivo.name : 'Haga clic para seleccionar archivo PDF'}
                    </span>
                    <span className="font-caption text-caption text-outline">
                      Formatos homologados: PDF/A hasta 25MB
                    </span>
                    <input
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => setArchivoForm({ ...archivoForm, archivo: e.target.files[0] || null })}
                      required
                      type="file"
                    />
                  </label>
                </div>
              </div>

              <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-end gap-space-sm">
                <button
                  className="px-space-md py-2 rounded-lg font-body-sm text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsArchivoModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm font-semibold shadow-sm hover:bg-primary transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* Dock Flotante de Gestión de Personal Académico */}
      <PersonalAcademicoDock
        tipo="docentes"
        totalItems={Array.isArray(docentes) ? docentes.length : 0}
        onRegistrar={() => {
          setDocenteForm({
            nombre: '',
            ci: '',
            materia_principal: '',
            gestion_ingreso: gestion
          });
          setIsDocenteModalOpen(true);
        }}
        onGenerarConstancia={() => {
          const docente = selectedDocente;
          if (docente) {
            const vent = window.open('', '_blank');
            vent.document.write(`
              <!DOCTYPE html>
              <html lang="es">
                <head>
                  <meta charset="utf-8" />
                  <title>Constancia Docente - ${docente.nombre}</title>
                  <style>
                    body { font-family: sans-serif; padding: 40px; color: #0b2545; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #0b2545; padding-bottom: 15px; margin-bottom: 30px; }
                    .seal { margin-top: 50px; font-size: 11px; color: #64748b; text-align: center; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h2>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h2>
                    <h3>FACULTAD INTEGRAL DEL ICHILO — SEDE ICHILO</h3>
                    <p>DIRECCIÓN DE CARRERA DE INGENIERÍA DE SISTEMAS</p>
                  </div>
                  <h3>CERTIFICACIÓN DE DESEMPEÑO DOCENTE</h3>
                  <p>La Dirección de la Carrera de Ingeniería de Sistemas de la Facultad Integral del Ichilo (UAGRM) certifica que:</p>
                  <p style="font-size: 18px; font-weight: bold; text-align: center; margin: 25px 0;">${docente.nombre}</p>
                  <p>Con Cédula de Identidad <strong>${docente.ci || 'S/N'}</strong>, desempeña funciones como docente en la materia de <strong>${docente.materia_principal || 'Asignada por Consejo'}</strong>, constando en el archivo oficial institucional su legajo y documentación semestral reglamentaria.</p>
                  <p>Se expide la presente certificación a solicitud de la parte interesada para los fines consiguientes.</p>
                  <p style="margin-top: 40px;">Yapacaní, Gestión ${gestion}</p>
                  <div class="seal">Dirección de Carrera - Ingeniería de Sistemas FINI UAGRM · Sede Ichilo</div>
                  <script>window.onload = function() { window.print(); }</script>
                </body>
              </html>
            `);
            vent.document.close();
          } else {
            alert('Seleccione un docente para generar su certificación.');
          }
        }}
        onFiltrarCiclo={(ciclo) => {
          if (ciclo === 'I-2026') setFiltroSemestre('1');
          else if (ciclo === 'II-2026') setFiltroSemestre('2');
          else setFiltroSemestre('');
        }}
      />
    </div>
  );
};

export default Docentes;
