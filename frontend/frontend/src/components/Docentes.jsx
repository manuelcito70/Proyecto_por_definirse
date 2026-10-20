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
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SuccessModal from './SuccessModal';
import FileDropzone from './FileDropzone';

const Docentes = () => {
  const { gestion } = useGestion();
  const [docentes, setDocentes] = useState([]);
  const [selectedDocenteId, setSelectedDocenteId] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [successModalData, setSuccessModalData] = useState(null);

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
    return list.filter(a => a && (a.tipo === 'curriculum' || a.tipo === 'programa_analitico' || a.tipo === 'anexos_cv'));
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
      setSuccessModalData({
        badge: `DOCENTE · ${docenteForm.materia_principal || 'FINI'}`,
        title: '¡Docente Registrado con Éxito!',
        message: `El docente "${docenteForm.nombre}" ha sido dado de alta en la nómina oficial de la Carrera.`
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
      setSuccessModalData({
        badge: `${archivoForm.tipo.toUpperCase().replace(/_/g, ' ')} · ${selectedDocente.nombre}`,
        title: '¡Documento Académico Anexado!',
        message: `El archivo fue incorporado con éxito al legajo y archivo de custodia del docente.`
      });
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
      {/* 2. Banner de Cabecera Solemne con Cortes Institucionales Diagonal */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#0D2E56] to-[#081B33] text-white shadow-xl mb-space-lg border border-[#c5a059]/30">
        {/* Cortes Geométricos Diagonales inspirados en los Folders/Diplomas Institucionales */}
        <div className="absolute -right-16 -top-24 w-80 h-80 bg-[#C1121F] rotate-45 transform origin-bottom-left shadow-2xl opacity-90 pointer-events-none"></div>
        <div className="absolute -right-10 -top-24 w-80 h-80 border-4 border-[#c5a059]/40 rotate-45 transform origin-bottom-left pointer-events-none"></div>
        <div className="absolute right-36 -bottom-24 w-40 h-40 bg-[#0B2545]/80 rotate-12 pointer-events-none"></div>
        
        {/* Filigrana tenue del Escudo UAGRM */}
        <img 
          alt="Filigrana Escudo UAGRM" 
          className="absolute right-12 top-1/2 -translate-y-1/2 w-44 h-52 object-contain opacity-10 pointer-events-none filter brightness-200" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
        />

        <div className="relative z-10 px-space-xl py-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1 max-w-3xl">
            <div className="flex items-center gap-space-xs text-[#f7e7a9] font-caption text-xs uppercase tracking-widest font-semibold">
              <span className="hover:underline cursor-pointer">Gestión documental</span>
              <span className="material-symbols-outlined text-xs text-[#c5a059]">chevron_right</span>
              <span className="text-white">Expedientes Académicos</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-2.5 h-9 bg-[#C1121F] rounded-sm shadow"></div>
              <h1 className="font-institutional-serif text-2xl md:text-3xl font-extrabold tracking-wider text-white uppercase drop-shadow-sm">
                DOCENTES
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-[#c5a059]/40 text-[#f7e7a9] font-label-code text-xs font-semibold">
                PLANTEL OFICIAL FINI
              </span>
            </div>
            <p className="font-body-sm text-sm text-slate-200 mt-1 pl-5 border-l border-[#c5a059]/30 max-w-2xl">
              Archivo por docente: custodia de datos oficiales, legajos curriculares y documentos aportados para su conservación institucional permanente.
            </p>
          </div>

          <div className="flex items-center gap-space-sm self-start md:self-auto z-10">
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
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C1121F] to-[#A50E1A] text-white font-body-sm text-sm font-bold hover:shadow-lg hover:shadow-[#c1121f]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer border border-white/20" 
              type="button"
            >
              <span className="material-symbols-outlined text-xl">person_add</span>
              <span>+ Registrar docente</span>
            </button>
          </div>
        </div>

        {/* Cenefa de acento dorado institucional al pie del banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C1121F] via-[#c5a059] to-[#0B2545]"></div>
      </div>

      {/* 3. Bloques de Normativa Superior con Filigrana y Cortes Bicolor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-lg">
        {/* Tarjeta 1: Conservación Documental Auditada */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90 relative overflow-hidden flex flex-col sm:flex-row items-start gap-space-md group">
          {/* Esquina angular bicolor institucional */}
          <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-[#0B2545] via-[#1d4ed8] to-[#C1121F]"></div>
          
          {/* Filigrana UAGRM tenue en fondo */}
          <img 
            alt="Filigrana de fondo" 
            className="absolute -right-6 -bottom-10 w-36 h-44 object-contain opacity-[0.06] pointer-events-none group-hover:scale-105 transition-transform" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
          />

          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#1E3A8A] text-white flex items-center justify-center shrink-0 shadow-md ring-2 ring-[#c5a059]/40">
            <span className="material-symbols-outlined text-2xl text-[#c5a059]">verified_user</span>
          </div>

          <div className="flex flex-col gap-1.5 pr-space-md">
            <div className="flex items-center gap-2">
              <span className="font-institutional-serif text-sm font-bold tracking-wider text-[#0B2545]">
                CONSERVACIÓN DOCUMENTAL AUDITADA
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-code text-[11px] font-bold">
                NORMA ISO/FINI
              </span>
            </div>
            <p className="font-body-sm text-sm text-slate-600 leading-relaxed">
              Documentos del docente, conservados sin modificar su contenido original. La Dirección escanea o procesa archivos en formato <strong className="font-semibold text-[#0B2545] font-label-code bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">PDF/A</strong> homologado para consultar el historial de carrera y descargar respaldos íntegros de auditoría institucional.
            </p>
          </div>
        </div>

        {/* Tarjeta 2: Regla Institucional CV Actualizable */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#0B2545] to-[#07172B] text-white rounded-2xl p-6 shadow-md border border-[#c5a059]/30 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#c1121f]/20 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#c5a059]"></span>
              <span className="font-label-badge text-[11px] tracking-widest uppercase font-bold text-[#f7e7a9]">
                REGLA INSTITUCIONAL
              </span>
            </div>
            <span className="font-label-code text-xs px-2 py-0.5 rounded bg-white/10 text-white font-semibold border border-white/15">
              RES-DIR-04/26
            </span>
          </div>

          <div className="my-space-sm relative z-10">
            <div className="font-institutional-serif text-lg font-bold tracking-wider text-white flex items-center gap-2">
              <span>CV ACTUALIZABLE</span>
              <span className="material-symbols-outlined text-[#c5a059] text-lg">auto_mode</span>
            </div>
            <p className="font-body-sm text-xs text-slate-300 mt-1.5 leading-relaxed">
              No se exige una entrega nueva cada semestre lectivo ({gestion}). Se mantiene en resguardo permanente hasta actualización expresa informada a Dirección.
            </p>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1 relative z-10">
            <div className="bg-gradient-to-r from-[#c5a059] to-[#C1121F] h-full rounded-full w-full"></div>
          </div>
        </div>
      </div>

      {/* 4. Layout Principal a Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* COLUMNA IZQUIERDA: Directorio y Archivo por Docente (4 columnas) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-space-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0B2545] text-xl">folder_shared</span>
                <h2 className="font-institutional-serif text-base font-bold text-[#0B2545]">Archivo por docente</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0B2545]/10 font-label-code text-xs text-[#0B2545] font-bold">
                {docentes.length} Activos
              </span>
            </div>

            {/* Buscador */}
            <div className="relative mb-space-md">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                search
              </span>
              <input 
                className="w-full pl-9 pr-space-md py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/30 focus:border-[#0B2545] transition-all" 
                placeholder="Buscar docente o código institucional..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                type="text"
              />
            </div>

            {/* Lista Selectora de Docentes */}
            <div className="flex flex-col gap-2" id="docentes-list">
              {loading ? (
                <div className="py-2">
                  <LoadingState message="Sincronizando nómina docente..." size={44} />
                </div>
              ) : docentes.length === 0 ? (
                <div className="py-2">
                  <EmptyState
                    title="No se encontraron docentes"
                    message={busqueda ? `Sin coincidencias para "${busqueda}".` : "No existen docentes registrados en el sistema."}
                    actionText="Registrar docente"
                    onAction={() => setIsDocenteModalOpen(true)}
                    iconSize={48}
                  />
                </div>
              ) : (
                docentes.map((doc) => {
                  const isSelected = selectedDocente && String(selectedDocente.id) === String(doc.id);
                  const initials = getInitials(doc.nombre);

                  if (isSelected) {
                    return (
                      <div 
                        key={doc.id}
                        onClick={() => setSelectedDocenteId(doc.id)}
                        className="group relative flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#123661] text-white shadow-md cursor-pointer transition-all border-l-4 border-[#C1121F]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-[#c5a059]/40 flex items-center justify-center text-[#f7e7a9] font-institutional-serif text-base font-bold shrink-0 shadow-inner">
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-body-md text-sm font-bold text-white truncate">
                                {doc.nombre}
                              </span>
                              <span className="material-symbols-outlined text-[#c5a059] text-base shrink-0" title="Validado en nómina">
                                verified
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-label-code text-[11px] text-[#c5a059] font-semibold">
                                DOC-{String(doc.id).padStart(3, '0')}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="font-caption text-[11px] text-slate-300 truncate">
                                {doc.materia_principal || 'Titular · Ordinario'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[#c5a059] text-xl shrink-0">
                          check_circle
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={doc.id}
                      onClick={() => setSelectedDocenteId(doc.id)}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B2545] font-institutional-serif text-sm font-bold shrink-0 group-hover:border-[#0B2545]/30 group-hover:bg-slate-50">
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-md text-sm font-semibold text-slate-800 group-hover:text-[#0B2545] truncate transition-colors">
                            {doc.nombre}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-label-code text-[11px] text-slate-500 font-medium">
                              {doc.ci ? `CI: ${doc.ci}` : `DOC-${String(doc.id).padStart(3, '0')}`}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="font-caption text-[11px] text-slate-500 truncate">
                              {doc.materia_principal || 'Docente UAGRM'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-[#0B2545] text-lg shrink-0">
                        chevron_right
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-space-md pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 font-caption text-xs">
              <span>Total en carrera: <strong className="text-[#0B2545] font-bold">{docentes.length} docentes</strong></span>
              <button 
                onClick={() => setBusqueda('')}
                className="text-[#C1121F] hover:text-[#93000a] hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                type="button"
              >
                <span>Ver catálogo completo</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Recuadro institucional: Depósito Central FINI al pie */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-sm border-l-4 border-[#c5a059] border-r border-t border-b border-slate-200/80 relative overflow-hidden">
            <div className="flex items-center gap-2 text-[#0B2545] font-institutional-serif text-sm font-bold mb-1.5">
              <span className="material-symbols-outlined text-[#C1121F] text-xl">account_balance</span>
              <span>DEPÓSITO CENTRAL FINI</span>
            </div>
            <p className="font-body-sm text-xs text-slate-600 leading-relaxed">
              Los legajos digitales cuentan con respaldo criptográfico en el servidor local de Yapacaní. La integridad documental se verifica semestralmente ante el Honorable Consejo Facultativo de la FINI.
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-label-code">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Servidor Local OK
              </span>
              <span>Yapacaní - Santa Cruz</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Expediente Oficial Seleccionado (8 columnas) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {selectedDocente ? (
            <>
              {/* Ficha de Encabezado Oficial */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-space-lg flex flex-col gap-space-md relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-36 h-36 border-4 border-slate-100 rounded-full pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-slate-100">
                  <div className="flex items-center gap-space-md">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B2545] to-[#123661] text-[#c5a059] flex items-center justify-center font-institutional-serif text-2xl font-bold shadow-md ring-2 ring-[#c5a059]/40">
                      {getInitials(selectedDocente.nombre)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="font-institutional-serif text-xl md:text-2xl text-[#0B2545] font-extrabold tracking-tight">
                          {selectedDocente.nombre}
                        </h2>
                        <span className="material-symbols-outlined text-[#C1121F] text-xl" title="Docente validado en nómina universitaria">
                          verified
                        </span>
                      </div>
                      <span className="font-body-sm text-xs md:text-sm text-slate-600 font-medium mt-0.5">
                        Cátedras: {selectedDocente.materia_principal || 'Cátedras Oficiales de Sistemas'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2545] font-body-sm text-xs font-bold transition-all border border-slate-200 shadow-sm cursor-pointer" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base text-[#0B2545]">upload_file</span>
                      <span>Anexar archivo</span>
                    </button>
                    <button 
                      onClick={() => alert(`Expediente oficial de ${selectedDocente.nombre} con ${archivos.length} documentos indexados.`)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-[#0B2545] hover:text-white text-slate-700 transition-all border border-slate-200 shadow-sm cursor-pointer" 
                      title="Descargar expediente comprimido .ZIP" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">folder_zip</span>
                    </button>
                  </div>
                </div>

                {/* Metadatos de Legajo Oficial con acento institucional */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col">
                    <span className="font-caption text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      Registro de Archivo
                    </span>
                    <span className="font-label-code text-sm font-bold text-[#0B2545] mt-1">
                      DOC-{String(selectedDocente.id).padStart(3, '0')}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col">
                    <span className="font-caption text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      Cédula de Identidad
                    </span>
                    <span className="font-label-code text-sm font-bold text-slate-700 mt-1">
                      {selectedDocente.ci || 'No registrada'}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col">
                    <span className="font-caption text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      Condición Académica
                    </span>
                    <span className="font-body-md text-xs font-bold text-[#0B2545] mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#C1121F]"></span>
                      Ordinario / Titular
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 1: Documentación General (Conservación continua) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-space-lg flex flex-col gap-space-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-2 border-b border-slate-100">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-5 bg-[#0B2545] rounded-sm"></div>
                      <h3 className="font-institutional-serif text-base md:text-lg text-[#0B2545] font-bold">
                        DOCUMENTACIÓN GENERAL
                      </h3>
                    </div>
                    <span className="font-caption text-xs text-slate-500 pl-3">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B2545]/5 text-[#0B2545] hover:bg-[#0B2545] hover:text-white border border-[#0B2545]/20 font-body-sm text-xs font-bold transition-all cursor-pointer self-start sm:self-auto" 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg leading-none text-[#C1121F]">upload_file</span>
                    <span>Cargar PDF</span>
                  </button>
                </div>

                {/* Lista de Documentos Generales */}
                <div className="flex flex-col gap-2.5 mt-1">
                  {/* DOC ITEM 1: CV (Vigente) */}
                  {(() => {
                    const cv = generalDocs.find(a => a.tipo === 'curriculum');
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-colors gap-space-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-100 text-[#C1121F] flex items-center justify-center shrink-0 mt-0.5 border border-red-200">
                            <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-body-md text-sm font-bold text-slate-800">Curriculum vitae</span>
                              <span className="font-label-badge text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                                {cv ? 'VIGENTE' : 'PENDIENTE'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 font-label-code text-[11px] text-slate-500">
                              <span className="text-[#0B2545] font-semibold">
                                {cv ? cv.nombre_original : `cv_${selectedDocente.nombre.toLowerCase().replace(/\s+/g, '_')}_demo.pdf`}
                              </span>
                              <span>·</span>
                              <span>PDF/A-1b</span>
                              <span>·</span>
                              <span>{cv ? 'En resguardo oficial' : 'No adjunto aún'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          {cv ? (
                            <>
                              <button 
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${cv.id}/download`, cv.nombre_original)}
                                className="p-2 rounded-lg text-slate-600 hover:text-[#0B2545] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
                                title="Ver escaneo oficial" 
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button 
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${cv.id}/download`, cv.nombre_original)}
                                className="p-2 rounded-lg text-slate-600 hover:text-[#C1121F] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
                                title="Descargar archivo" 
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">download</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteArchivo(cv.id, cv.nombre_original)}
                                className="p-2 rounded-lg text-slate-400 hover:text-[#C1121F] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
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
                              className="px-3 py-1.5 bg-[#C1121F] text-white text-xs font-bold rounded-lg hover:bg-[#93000a] transition-colors cursor-pointer shadow-sm"
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-colors gap-space-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-100 text-[#C1121F] flex items-center justify-center shrink-0 mt-0.5 border border-red-200">
                            <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-body-md text-sm font-bold text-slate-800">
                                Programa analítico - {selectedDocente.materia_principal || 'Cátedra Oficial'}
                              </span>
                              <span className="font-label-badge text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#0B2545] font-bold border border-blue-200">
                                {prog ? 'HOMOLOGADO' : 'NUEVA MALLA'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 font-label-code text-[11px] text-slate-500">
                              <span className="text-[#0B2545] font-semibold">
                                {prog ? prog.nombre_original : 'programa_analitico_demo.pdf'}
                              </span>
                              <span>·</span>
                              <span>Plan 2024</span>
                              <span>·</span>
                              <span>{prog ? 'Cotejado con original' : 'Pendiente'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          {prog ? (
                            <>
                              <button 
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${prog.id}/download`, prog.nombre_original)}
                                className="p-2 rounded-lg text-slate-600 hover:text-[#0B2545] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
                                title="Ver escaneo oficial" 
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button 
                                onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${prog.id}/download`, prog.nombre_original)}
                                className="p-2 rounded-lg text-slate-600 hover:text-[#C1121F] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
                                title="Descargar archivo" 
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">download</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteArchivo(prog.id, prog.nombre_original)}
                                className="p-2 rounded-lg text-slate-400 hover:text-[#C1121F] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
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
                              className="px-3 py-1.5 bg-[#0B2545] text-white text-xs font-bold rounded-lg hover:bg-[#153e70] transition-colors cursor-pointer shadow-sm"
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-space-lg flex flex-col gap-space-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-2 border-b border-slate-100">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-5 bg-[#C1121F] rounded-sm"></div>
                      <h3 className="font-institutional-serif text-base md:text-lg text-[#0B2545] font-bold">
                        DOCUMENTACIÓN POR SEMESTRE
                      </h3>
                    </div>
                    <span className="font-caption text-xs text-slate-500 pl-3">
                      Depósitos periódicos requeridos por cada ciclo académico regular
                    </span>
                  </div>

                  {/* Selectores de Ciclo & Botón Cargar */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
                      <select 
                        className="bg-transparent font-label-code text-xs font-bold text-slate-800 px-2.5 py-1.5 outline-none cursor-pointer"
                        value={filtroGestionSemestre}
                        onChange={(e) => setFiltroGestionSemestre(e.target.value)}
                      >
                        <option value="2026">Gestión: 2026</option>
                        <option value="2025">Gestión: 2025</option>
                        <option value="2024">Gestión: 2024</option>
                      </select>
                      <div className="h-4 w-px bg-slate-300 mx-1"></div>
                      <select 
                        className="bg-transparent font-label-code text-xs font-bold text-slate-800 px-2.5 py-1.5 outline-none cursor-pointer"
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#153e70] text-white font-body-sm text-xs font-bold hover:shadow-md transition-all cursor-pointer border border-[#c5a059]/30" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base leading-none text-[#c5a059]">add_circle</span>
                      <span>Cargar documentación</span>
                    </button>
                  </div>
                </div>

                {/* Archivos Semestrales Registrados */}
                <div className="flex flex-col gap-2.5">
                  {loadingArchivos ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      Consultando archivos semestrales...
                    </div>
                  ) : semestralDocs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/70 border border-slate-200/60 rounded-xl text-slate-500 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-slate-400">folder_off</span>
                      <p className="font-body-sm text-sm">
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
                        className="px-4 py-2 rounded-xl bg-[#0B2545] text-white text-xs font-bold hover:bg-[#153e70] transition-colors cursor-pointer mt-1 shadow-sm"
                        type="button"
                      >
                        + Anexar informe o lista de asistencia
                      </button>
                    </div>
                  ) : (
                    semestralDocs.map((arc) => (
                      <div 
                        key={arc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-colors gap-space-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl ${
                            arc.tipo === 'lista_asistencia' 
                              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                              : 'bg-blue-100 text-[#0B2545] border border-blue-200'
                          } flex items-center justify-center shrink-0 mt-0.5`}>
                            <span className="material-symbols-outlined text-xl">
                              {arc.tipo === 'lista_asistencia' ? 'fact_check' : 'description'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-body-md text-sm font-bold text-slate-800">
                                {arc.tipo === 'lista_asistencia' ? 'Lista de asistencia' : 'Informe final / de cátedra'}
                              </span>
                              <span className={`font-label-badge text-[10px] px-2 py-0.5 rounded-full ${
                                arc.tipo === 'lista_asistencia'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200 font-bold'
                                  : 'bg-blue-100 text-[#0B2545] font-bold border border-blue-200'
                              }`}>
                                {arc.tipo === 'lista_asistencia' ? 'CUSTODIA' : 'ARCHIVADO'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 font-label-code text-[11px] text-slate-500">
                              <span className="text-[#0B2545] font-semibold">{arc.nombre_original}</span>
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
                            className="p-2 rounded-lg text-slate-600 hover:text-[#0B2545] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
                            title="Ver informe oficial" 
                            type="button"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button 
                            onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${arc.id}/download`, arc.nombre_original)}
                            className="p-2 rounded-lg text-slate-600 hover:text-[#C1121F] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
                            title="Descargar archivo" 
                            type="button"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteArchivo(arc.id, arc.nombre_original)}
                            className="p-2 rounded-lg text-slate-400 hover:text-[#C1121F] hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer" 
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
                <div className="mt-space-sm p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-slate-700">
                  <span className="material-symbols-outlined text-amber-700 text-xl shrink-0 mt-0.5">info</span>
                  <p className="font-caption text-xs leading-relaxed">
                    <strong className="font-bold text-slate-900">Nota aclaratoria:</strong> La lista de asistencia se conserva únicamente como documento de custodia institucional. No incluye control de asistencia de personal ni actas de notas registradas en CPD. Para calificaciones oficiales remitirse al Sistema de Procesamiento de Datos central UAGRM.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-space-lg text-center text-slate-500 border border-slate-200">
              Seleccione un docente del directorio para consultar su expediente.
            </div>
          )}
        </div>
      </div>

      {/* MODAL REGISTRAR NUEVO DOCENTE */}
      {isDocenteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col border border-[#c5a059]/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#07162b] via-[#0B2545] to-[#15418c] text-white px-space-lg py-4 flex items-center justify-between border-b border-[#c5a059]/30">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[#c5a059]">person_add</span>
                <span className="font-institutional-serif text-base font-bold">Registrar Nuevo Docente</span>
              </div>
              <button
                className="text-white/70 hover:text-white cursor-pointer"
                onClick={() => !submitting && setIsDocenteModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDocente}>
              <div className="p-space-lg flex flex-col gap-space-md">
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-slate-600">
                    Nombre Completo del Docente *
                  </label>
                  <input
                    className="w-full px-space-sm py-2 bg-slate-50 border border-slate-200 rounded-lg font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/30"
                    placeholder="Ej. Ing. Mario Renato Chocala"
                    value={docenteForm.nombre}
                    onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                    required
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-slate-600">
                      Cédula de Identidad (CI)
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-slate-50 border border-slate-200 rounded-lg font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/30"
                      placeholder="Ej. 4829102 SC"
                      value={docenteForm.ci}
                      onChange={(e) => setDocenteForm({ ...docenteForm, ci: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-slate-600">
                      Gestión de Ingreso
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-slate-50 border border-slate-200 rounded-lg font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/30"
                      value={docenteForm.gestion_ingreso}
                      onChange={(e) => setDocenteForm({ ...docenteForm, gestion_ingreso: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-slate-600">
                    Materia Principal / Cátedra Asignada
                  </label>
                  <input
                    className="w-full px-space-sm py-2 bg-slate-50 border border-slate-200 rounded-lg font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/30"
                    placeholder="Ej. Programación I · Algoritmos y Estructuras"
                    value={docenteForm.materia_principal}
                    onChange={(e) => setDocenteForm({ ...docenteForm, materia_principal: e.target.value })}
                    type="text"
                  />
                </div>
              </div>

              <div className="px-space-lg py-space-md bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-space-sm">
                <button
                  className="px-space-md py-2 rounded-lg font-body-sm text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsDocenteModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-[#C1121F] to-[#93000a] text-white rounded-xl font-body-sm text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer border border-white/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col border border-[#c5a059]/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#07162b] via-[#0B2545] to-[#15418c] text-white px-space-lg py-4 flex items-center justify-between border-b border-[#c5a059]/30">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[#c5a059]">upload_file</span>
                <span className="font-institutional-serif text-base font-bold">Cargar Documento al Expediente</span>
              </div>
              <button
                className="text-white/70 hover:text-white cursor-pointer"
                onClick={() => !submitting && setIsArchivoModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadArchivo}>
              <div className="p-space-lg flex flex-col gap-space-md">
                <div className="bg-slate-50 p-space-sm rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-caption text-caption text-slate-500 font-semibold">
                    Docente Destino:
                  </span>
                  <span className="font-label-code text-xs font-bold text-[#0B2545] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedDocente.nombre}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-slate-600">
                    Tipo de Documento *
                  </label>
                  <select
                    className="w-full px-space-sm py-2 bg-slate-50 border border-slate-200 rounded-lg font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/30 cursor-pointer"
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
                      <label className="font-caption text-caption uppercase tracking-wider font-bold text-slate-600">
                        Gestión Académica
                      </label>
                      <input
                        className="w-full px-space-sm py-2 bg-slate-50 border border-slate-200 rounded-lg font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/30"
                        value={archivoForm.gestion}
                        onChange={(e) => setArchivoForm({ ...archivoForm, gestion: e.target.value })}
                        required
                        type="number"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-caption text-caption uppercase tracking-wider font-bold text-slate-600">
                        Semestre
                      </label>
                      <select
                        className="w-full px-space-sm py-2 bg-slate-50 border border-slate-200 rounded-lg font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/30 cursor-pointer"
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
                    hint="Formatos homologados: PDF/A hasta 25MB"
                  />
                </div>
              </div>

              <div className="px-space-lg py-space-md bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-space-sm">
                <button
                  className="px-space-md py-2 rounded-lg font-body-sm text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsArchivoModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0B2545] to-[#15418c] text-white rounded-xl font-body-sm text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer border border-[#c5a059]/30"
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
