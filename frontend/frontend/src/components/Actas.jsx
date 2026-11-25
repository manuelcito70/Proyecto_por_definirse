import React, { useState, useEffect, useMemo } from 'react';
import { useGestion } from '../context/GestionContext';
import { getActas, createActa, updateActa, deleteActa, downloadFile } from '../services/api';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SuccessModal from './SuccessModal';
import { imprimirDocumentoOficial, FIRMAS, esc } from '../utils/documentoOficial';
import { getUserCarrera } from '../utils/carreraHelper';
import FileDropzone from './FileDropzone';

const MODALIDADES = [
  { id: '', label: 'Todas las modalidades' },
  { id: 'excelencia', label: 'Directa · Excelencia académica' },
  { id: 'buen_rendimiento', label: 'Directa · Buen rendimiento' },
  { id: 'buen_desempeno', label: 'Directa · Buen desempeño' },
  { id: 'tesis', label: 'Tesis de grado' },
  { id: 'trabajo_dirigido', label: 'Trabajo dirigido' },
  { id: 'examen_grado', label: 'Examen de grado' },
  { id: 'proyecto_grado', label: 'Proyecto de grado' },
  { id: 'titulacion_continua', label: 'Vía continua / diplomado' }
];

const Actas = () => {
  const { gestion } = useGestion();
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState('');
  
  // Expediente seleccionado y pestaña activa
  const [selectedActaId, setSelectedActaId] = useState(null);
  const [activeTab, setActiveTab] = useState('archivo'); // 'archivo' | 'certificacion'
  const [successModalData, setSuccessModalData] = useState(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulario Crear Acta
  const [formData, setFormData] = useState({
    nro_acta: '',
    codigo_cpd: '',
    nro_registro: '',
    nombre_estudiante: '',
    ci: '',
    modalidad: 'tesis',
    nota: '',
    archivo: null
  });

  // Formulario Editar Acta
  const [editFormData, setEditFormData] = useState({
    id: null,
    nro_acta: '',
    codigo_cpd: '',
    nro_registro: '',
    nombre_estudiante: '',
    ci: '',
    modalidad: 'tesis',
    nota: '',
    archivo: null
  });

  // Carga de actas
  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getActas({ gestion });
      const safeList = Array.isArray(list) ? list : [];
      setActas(safeList);
    } catch (err) {
      console.error('Error cargando actas:', err);
      setActas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion]);

  // Filtrado reactivo en cliente
  const filteredActas = useMemo(() => {
    if (!Array.isArray(actas)) return [];
    return actas.filter((item) => {
      if (!item) return false;
      const matchMod = !modalidadSeleccionada || item.modalidad === modalidadSeleccionada;
      const q = (busqueda || '').toLowerCase().trim();
      if (!q) return matchMod;
      const matchSearch =
        String(item.nombre_estudiante || '').toLowerCase().includes(q) ||
        String(item.nro_acta || '').toLowerCase().includes(q) ||
        String(item.codigo_cpd || '').toLowerCase().includes(q) ||
        String(item.nro_registro || '').toLowerCase().includes(q) ||
        String(item.ci || '').toLowerCase().includes(q);
      return matchMod && matchSearch;
    });
  }, [actas, modalidadSeleccionada, busqueda]);

  // Acta seleccionada actualmente
  const selectedActa = useMemo(() => {
    if (!selectedActaId) return null;
    return actas.find(a => a && String(a.id) === String(selectedActaId)) || null;
  }, [actas, selectedActaId]);

  const getModalidadLabel = (modId) => {
    const found = MODALIDADES.find(m => m.id === modId);
    return found ? found.label : (modId || 'No especificada');
  };

  const getInitials = (name) => {
    if (!name) return 'GR';
    const clean = name.replace(/^(ing\.|lic\.|dr\.|dra\.|msc\.)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '1.5 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  // Crear nueva acta
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nro_acta || !formData.nombre_estudiante) {
      alert('Por favor complete número de acta y nombre del estudiante.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('nro_acta', formData.nro_acta);
      data.append('codigo_cpd', formData.codigo_cpd || '');
      data.append('nro_registro', formData.nro_registro || '');
      data.append('nombre_estudiante', formData.nombre_estudiante);
      data.append('ci', formData.ci || '');
      data.append('modalidad', formData.modalidad);
      if (formData.nota) data.append('nota', formData.nota);
      data.append('gestion', gestion);
      if (formData.archivo) {
        data.append('archivo', formData.archivo);
      }

      const nueva = await createActa(data);
      setSuccessModalData({
        badge: `ACTA Nº ${formData.nro_acta} · CPD ${formData.codigo_cpd || 'CPD-FINI'}`,
        title: '¡Acta de Titulación Registrada!',
        message: `El acta de graduación de "${formData.nombre_estudiante}" ha sido protocolizada y archivada correctamente.`
      });
      setIsModalOpen(false);
      await fetchData();
      if (nueva && nueva.id) {
        setSelectedActaId(nueva.id);
        setActiveTab('archivo');
      }
    } catch (err) {
      alert('Error al registrar acta: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Editar acta
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nombre_estudiante) return;

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('nro_acta', editFormData.nro_acta);
      data.append('codigo_cpd', editFormData.codigo_cpd || '');
      data.append('nro_registro', editFormData.nro_registro || '');
      data.append('nombre_estudiante', editFormData.nombre_estudiante);
      data.append('ci', editFormData.ci || '');
      data.append('modalidad', editFormData.modalidad);
      if (editFormData.nota !== undefined && editFormData.nota !== '') {
        data.append('nota', editFormData.nota);
      }
      if (editFormData.archivo) {
        data.append('archivo', editFormData.archivo);
      }

      await updateActa(editFormData.id, data);
      setSuccessModalData({
        badge: `ACTA ACTUALIZADA`,
        title: '¡Expediente Actualizado!',
        message: `Los datos del acta de graduación de "${editFormData.nombre_estudiante}" han sido actualizados.`
      });
      setIsEditModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Error al actualizar acta: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Subir o reemplazar archivo PDF del acta seleccionada
  const handleUploadPdfSubmit = async (e) => {
    e.preventDefault();
    if (!selectedActa || !formData.archivo) {
      alert('Por favor seleccione un archivo PDF escaneado.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('archivo', formData.archivo);

      await updateActa(selectedActa.id, data);
      setSuccessModalData({
        badge: `ACTA Nº ${selectedActa.nro_acta}`,
        title: '¡Documento Anexado al Acta!',
        message: `El archivo digital "${formData.archivo.name}" ha sido incorporado al expediente protocolar de grado.`
      });
      setIsUploadPdfModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Error al adjuntar archivo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar acta
  const handleDelete = async (id, nombre, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el acta de graduación de ${nombre}?`)) return;
    try {
      await deleteActa(id);
      if (selectedActaId === id) setSelectedActaId(null);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Imprimir certificación de graduación con el formato oficial de la Dirección de Carrera
  const handlePrintConstancia = (acta) => {
    if (!acta) return;
    const anio = new Date().getFullYear();
    const fila = (campo, valor) => `<tr><td class="campo">${campo}</td><td>${esc(valor)}</td></tr>`;

    imprimirDocumentoOficial({
      tituloVentana: `Certificación de Graduación - ${acta.nombre_estudiante}`,
      cite: `CERT. No. ______/${anio}`,
      titulo: 'CERTIFICACIÓN',
      cuerpo: `
        <p>La suscrita Directora de la Carrera de ${esc(getUserCarrera())} de la Facultad Integral de Ichilo, de la Universidad Autónoma "Gabriel René Moreno", a solicitud de parte interesada y de acuerdo a los antecedentes que cursan en el archivo de esta Dirección:</p>
        <p class="destacado">CERTIFICA:</p>
        <p class="sin-sangria">Que <strong>${esc(acta.nombre_estudiante)}</strong> se encuentra registrado(a) como graduado(a) de la Carrera, con los siguientes datos:</p>
        <table class="datos">
          ${fila('Nombre completo', acta.nombre_estudiante)}
          ${fila('Registro Universitario (R.U.)', acta.nro_registro || 'No registrado')}
          ${fila('Cédula de Identidad (C.I.)', acta.ci || 'No registrada')}
          ${fila('N.° de Acta', acta.nro_acta)}
          ${fila('Código CPD', acta.codigo_cpd || 'S/N')}
          ${fila('Modalidad de graduación', getModalidadLabel(acta.modalidad))}
          ${fila('Calificación final', acta.nota ? `${acta.nota} / 100 puntos` : 'Aprobado')}
          ${fila('Gestión', acta.gestion || gestion)}
        </table>
        <p>Es cuanto se certifica en honor a la verdad, para los fines que convengan al interesado(a).</p>`,
      firmas: [FIRMAS.directora, FIRMAS.vicedecano]
    });
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12">
      {/* 1. BARRA SUPERIOR DE BÚSQUEDA Y FILTRO DE MODALIDAD (Anti-fatiga visual) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Campo de búsqueda con icono */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input 
              type="text"
              placeholder="Buscar por graduado, N.° acta, código CPD o CI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] transition-all"
            />
          </div>

          {/* Selector de Modalidad de Graduación */}
          <div className="relative min-w-[240px] sm:min-w-[270px]">
            <select
              value={modalidadSeleccionada}
              onChange={(e) => setModalidadSeleccionada(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] cursor-pointer transition-all"
            >
              {MODALIDADES.map((m) => (
                <option key={m.id || 'all'} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">
              expand_more
            </span>
          </div>

          {/* Contador en vivo & Indicador de Auditoría & Botón Registrar Acta */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Mostrando <strong className="text-slate-900 font-bold">{filteredActas.length}</strong> de <strong className="text-slate-900 font-bold">{actas.length}</strong> actas
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 border-l border-slate-200 pl-4">
              <span className="material-symbols-outlined text-slate-400 text-base">verified_user</span>
              <span>Custodia Oficial CPD / PDF/A</span>
            </div>

            <button
              onClick={() => {
                setFormData({
                  nro_acta: '',
                  codigo_cpd: '',
                  nro_registro: '',
                  nombre_estudiante: '',
                  ci: '',
                  modalidad: 'tesis',
                  nota: '',
                  archivo: null
                });
                setIsModalOpen(true);
              }}
              className="btn-doc-fold py-2 px-3.5 text-xs shadow-sm cursor-pointer ml-auto sm:ml-0"
              type="button"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Registrar acta</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. CONTENEDOR PRINCIPAL CON ANIMACIÓN SUAVE DE DESPLAZAMIENTO (SPLIT VIEW) */}
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full transition-all duration-300 ease-in-out">
        
        {/* COLUMNA DE LA LISTA DE ACTAS (Se adapta suavemente según si hay un expediente abierto) */}
        <div className={`transition-all duration-300 ease-in-out flex flex-col gap-4 ${
          selectedActa ? 'lg:w-[58%] w-full' : 'w-full'
        }`}>
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
              <LoadingState message={`Sincronizando actas de graduación (${gestion})...`} size={44} />
            </div>
          ) : filteredActas.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
              <EmptyState
                title="No se encontraron actas de graduación"
                message={
                  modalidadSeleccionada
                    ? `No hay actas registradas para la modalidad "${getModalidadLabel(modalidadSeleccionada)}".`
                    : busqueda
                    ? `Sin coincidencias para "${busqueda}".`
                    : `No existen actas registradas en la gestión ${gestion}.`
                }
                actionText="Registrar acta"
                onAction={() => {
                  setFormData({
                    nro_acta: '',
                    codigo_cpd: '',
                    nro_registro: '',
                    nombre_estudiante: '',
                    ci: '',
                    modalidad: modalidadSeleccionada || 'tesis',
                    nota: '',
                    archivo: null
                  });
                  setIsModalOpen(true);
                }}
                iconSize={48}
              />
            </div>
          ) : (
            filteredActas.map((acta) => {
              const isSelected = selectedActa && String(selectedActa.id) === String(acta.id);
              const initials = getInitials(acta.nombre_estudiante);
              const hasPdf = Boolean(acta.archivo_path || acta.nombre_archivo);
              const notaNum = parseFloat(acta.nota);

              let notaColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (!isNaN(notaNum)) {
                if (notaNum >= 90) notaColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
                else if (notaNum >= 80) notaColor = 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
                else notaColor = 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
              }

              return (
                <div
                  key={acta.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 transition-all duration-300 relative border ${
                    isSelected
                      ? 'border-l-4 border-l-[#C1121F] border-t-slate-200 border-r-slate-200 border-b-slate-200 shadow-md ring-1 ring-[#C1121F]/10'
                      : 'border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  {/* Fila Superior: Avatar + Graduado + Identificadores + Insignias */}
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
                            {acta.nombre_estudiante}
                          </h3>
                          <span 
                            className="material-symbols-outlined text-[#C1121F] text-base shrink-0" 
                            title="Graduado titulado con acta protocolar verificada"
                          >
                            school
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-label-code text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                          <span className="text-[#0B2545] font-bold">Acta Nº {acta.nro_acta}</span>
                          <span>·</span>
                          <span>{acta.codigo_cpd ? `CPD: ${acta.codigo_cpd}` : 'CPD: Pendiente'}</span>
                          <span>·</span>
                          <span>RU: {acta.nro_registro || 'S/R'}</span>
                          {acta.ci && (
                            <>
                              <span>·</span>
                              <span>CI: {acta.ci}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Insignias de Modalidad y Calificación */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200">
                        {getModalidadLabel(acta.modalidad)}
                      </span>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] border ${notaColor}`}>
                        {acta.nota ? `Nota: ${acta.nota}` : 'Aprobado'}
                      </span>
                    </div>
                  </div>

                  {/* Fila Media: Resumen de Protocolo CPD en contenedor sutil */}
                  <div className="mt-3.5 mb-4 px-3.5 py-2 rounded-xl bg-slate-50/90 border border-slate-100 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-bold text-slate-800 mr-1.5">Resguardo CPD:</span>
                      <span className="text-slate-600 font-medium">
                        {acta.codigo_cpd ? `Código Oficial ${acta.codigo_cpd}` : 'En trámite de registro central CPD'} · Gestión {acta.gestion || gestion}
                      </span>
                    </div>
                    <span className="font-label-code text-[11px] text-slate-500">
                      {hasPdf ? 'Escaneo original en custodia' : 'Pendiente de escaneo'}
                    </span>
                  </div>

                  {/* Fila Inferior: Los 2 Botones Interactivos y Acciones Rápidas */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 gap-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      
                      {/* BOTÓN 1: Acta Digital (PDF) */}
                      <button
                        onClick={() => {
                          setSelectedActaId(acta.id);
                          setActiveTab('archivo');
                        }}
                        type="button"
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected && activeTab === 'archivo'
                            ? 'bg-[#0B2545] text-white shadow-sm ring-2 ring-[#0B2545]/20'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-base ${
                          isSelected && activeTab === 'archivo' ? 'text-[#f7e7a9]' : 'text-[#C1121F]'
                        }`}>
                          picture_as_pdf
                        </span>
                        <span>Acta Digital ({hasPdf ? 'Adjunto' : 'Pendiente'})</span>
                      </button>

                      {/* BOTÓN 2: Certificación CPD */}
                      <button
                        onClick={() => {
                          setSelectedActaId(acta.id);
                          setActiveTab('certificacion');
                        }}
                        type="button"
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected && activeTab === 'certificacion'
                            ? 'bg-[#0B2545] text-white shadow-sm ring-2 ring-[#0B2545]/20'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-base ${
                          isSelected && activeTab === 'certificacion' ? 'text-[#f7e7a9]' : 'text-slate-600'
                        }`}>
                          workspace_premium
                        </span>
                        <span>Certificación CPD</span>
                      </button>
                    </div>

                    {/* Acciones Rápidas a la derecha */}
                    <div className="flex items-center gap-1">
                      {/* Imprimir Certificación */}
                      <button
                        onClick={() => handlePrintConstancia(acta)}
                        className="p-2 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Imprimir certificación formal de graduación"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">print</span>
                      </button>

                      {/* Descargar PDF (si tiene) */}
                      {hasPdf && (
                        <button
                          onClick={() => downloadFile(`/actas/${acta.id}/download`, acta.nombre_archivo, true)}
                          className="p-2 rounded-lg text-slate-500 hover:text-[#C1121F] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Descargar escaneo del acta"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                        </button>
                      )}

                      {/* Editar */}
                      <button
                        onClick={() => {
                          setEditFormData({
                            id: acta.id,
                            nro_acta: acta.nro_acta,
                            codigo_cpd: acta.codigo_cpd || '',
                            nro_registro: acta.nro_registro || '',
                            nombre_estudiante: acta.nombre_estudiante,
                            ci: acta.ci || '',
                            modalidad: acta.modalidad || 'tesis',
                            nota: acta.nota !== null ? acta.nota : '',
                            archivo: null
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar datos del acta"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={(e) => handleDelete(acta.id, acta.nombre_estudiante, e)}
                        className="p-2 rounded-lg text-slate-300 hover:text-[#C1121F] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Eliminar acta"
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

        {/* 3. PANEL DERECHO DE EXPEDIENTE DEL ACTA (DRAWER / INSPECTOR LATERAL CON ANIMACIÓN SUAVE) */}
        {selectedActa && (
          <div className="lg:w-[42%] w-full shrink-0 sticky top-24 transition-all duration-300 ease-in-out animate-in slide-in-from-right-6 fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden">
              
              {/* Barra de Acento Superior Institucional */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C1121F] via-[#c5a059] to-[#0B2545]"></div>

              {/* Cabecera del Expediente Activo */}
              <div className="flex items-start justify-between gap-2 pt-1 border-b border-slate-100 pb-3">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-label-code text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                      EXPEDIENTE DE GRADUACIÓN #ACTA-{selectedActa.nro_acta}
                    </span>
                  </div>
                  <h2 className="font-institutional-serif text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide mt-1.5 truncate">
                    {selectedActa.nombre_estudiante}
                  </h2>
                  <p className="font-body-sm text-xs text-slate-500 font-medium truncate mt-0.5">
                    CPD: {selectedActa.codigo_cpd || 'Pendiente de código'} · Modalidad: {getModalidadLabel(selectedActa.modalidad)}
                  </p>
                </div>

                {/* Botón Cerrar Panel ✕ */}
                <button
                  onClick={() => setSelectedActaId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  title="Cerrar panel"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Tabs de Cambio Rápido: "Acta Escaneada (PDF)" vs "Certificación CPD" */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('archivo')}
                  type="button"
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'archivo'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base text-[#C1121F]">
                    picture_as_pdf
                  </span>
                  <span>Acta Escaneada (PDF)</span>
                </button>

                <button
                  onClick={() => setActiveTab('certificacion')}
                  type="button"
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'certificacion'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base text-slate-600">
                    workspace_premium
                  </span>
                  <span>Certificación CPD</span>
                </button>
              </div>

              {/* CONTENIDO DE LA PESTAÑA 1: ACTA ESCANEADA (PDF) */}
              {activeTab === 'archivo' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-body-sm text-xs font-bold text-slate-700">
                      Documento oficial digitalizado (PDF/A)
                    </span>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, archivo: null });
                        setIsUploadPdfModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2545] hover:text-[#C1121F] transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      <span>{selectedActa.archivo_path ? 'Reemplazar PDF' : 'Cargar PDF'}</span>
                    </button>
                  </div>

                  {selectedActa.archivo_path || selectedActa.nombre_archivo ? (
                    <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-colors flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-red-100 text-[#C1121F] flex items-center justify-center shrink-0 border border-red-200 shadow-xs">
                            <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-body-md text-sm font-bold text-slate-800 truncate">
                                Acta de Graduación Nº {selectedActa.nro_acta}
                              </span>
                              <span className="font-label-badge text-[9px] px-2 py-0.5 rounded-full font-bold border bg-emerald-100 text-emerald-800 border-emerald-300">
                                PROTOCOLIZADO
                              </span>
                            </div>
                            <span className="font-label-code text-xs text-slate-500 truncate mt-0.5">
                              {selectedActa.nombre_archivo || 'acta_graduacion.pdf'} · {formatFileSize(selectedActa.archivo_tamano)}
                            </span>
                          </div>
                        </div>

                        {/* Botones de acción del archivo */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => downloadFile(`/actas/${selectedActa.id}/download`, selectedActa.nombre_archivo)}
                            className="p-2 rounded-lg text-slate-600 hover:text-[#0B2545] hover:bg-white transition-colors cursor-pointer"
                            title="Ver escaneo oficial"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            onClick={() => downloadFile(`/actas/${selectedActa.id}/download`, selectedActa.nombre_archivo, true)}
                            className="p-2 rounded-lg text-slate-600 hover:text-[#C1121F] hover:bg-white transition-colors cursor-pointer"
                            title="Descargar archivo al disco"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-label-code text-slate-500">
                        <span>Archivo en resguardo digital permanente</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Verificado CPD
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-slate-300">picture_as_pdf</span>
                      <p className="text-xs text-slate-500 font-medium">
                        Esta acta aún no cuenta con la digitalización escaneada del documento físico.
                      </p>
                      <button
                        onClick={() => {
                          setFormData({ ...formData, archivo: null });
                          setIsUploadPdfModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#0B2545] text-white text-xs font-bold rounded-lg hover:bg-[#153e70] transition-colors cursor-pointer mt-1 shadow-sm"
                        type="button"
                      >
                        + Cargar Escaneo del Acta (PDF)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA 2: CERTIFICACIÓN CPD */}
              {activeTab === 'certificacion' && (
                <div className="flex flex-col gap-3">
                  <span className="font-body-sm text-xs font-bold text-slate-700 pt-1">
                    Ficha Técnica Protocolar del CPD
                  </span>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Postulante Titulado:</span>
                      <strong className="text-slate-900">{selectedActa.nombre_estudiante}</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">N.° Registro Universitario:</span>
                      <span className="font-label-code font-bold text-slate-800">{selectedActa.nro_registro || 'No registrado'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Cédula de Identidad:</span>
                      <span className="font-label-code font-bold text-slate-800">{selectedActa.ci || 'No registrada'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">N.° Acta Original:</span>
                      <span className="font-label-code font-bold text-[#C1121F]">#{selectedActa.nro_acta}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Código Único CPD:</span>
                      <span className="font-label-code font-bold text-[#0B2545]">{selectedActa.codigo_cpd || 'S/N'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Modalidad de Graduación:</span>
                      <span className="font-medium text-slate-800">{getModalidadLabel(selectedActa.modalidad)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Calificación Obtenida:</span>
                      <strong className="text-emerald-700 text-sm">{selectedActa.nota ? `${selectedActa.nota} / 100` : 'Aprobado'}</strong>
                    </div>
                  </div>

                  {/* Botón Imprimir Certificación Oficial */}
                  <button
                    onClick={() => handlePrintConstancia(selectedActa)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#15418c] hover:shadow-md text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-[#c5a059]/30 mt-1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-[#c5a059]">print</span>
                    <span>Imprimir Certificación de Graduación</span>
                  </button>
                </div>
              )}

              {/* Pie Informativo de Auditoría */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-label-code">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Servidor Yapacaní: En línea
                </span>
                <span>Última modif: {formatFecha(selectedActa.updatedAt)}</span>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL: REGISTRAR NUEVA ACTA (CON EFECTO CRISTAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 modal-glass-backdrop transition-all duration-300">
          <div className="modal-glass-card rounded-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            <div className="modal-glass-header text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl modal-glass-badge flex items-center justify-center text-[#c5a059]">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                </div>
                <span className="font-institutional-serif text-base font-bold">Registrar Acta de Graduación</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      N.° de Acta Original *
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. 083"
                      value={formData.nro_acta}
                      onChange={(e) => setFormData({ ...formData, nro_acta: e.target.value })}
                      required
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Código Único CPD
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. CPD-EJ-083"
                      value={formData.codigo_cpd}
                      onChange={(e) => setFormData({ ...formData, codigo_cpd: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Nombre Completo del Postulante *
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                    placeholder="Ej. Lucía Vargas Rojas"
                    value={formData.nombre_estudiante}
                    onChange={(e) => setFormData({ ...formData, nombre_estudiante: e.target.value })}
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
                      placeholder="Ej. 26005"
                      value={formData.nro_registro}
                      onChange={(e) => setFormData({ ...formData, nro_registro: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Cédula de Identidad (CI)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. 11351545 SC"
                      value={formData.ci}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Modalidad de Titulación *
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                      value={formData.modalidad}
                      onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                      required
                    >
                      <optgroup label="Graduación Directa">
                        <option value="excelencia">Excelencia académica</option>
                        <option value="buen_rendimiento">Buen rendimiento</option>
                        <option value="buen_desempeno">Buen desempeño</option>
                      </optgroup>
                      <optgroup label="Modalidad con Tribunal">
                        <option value="tesis">Tesis de grado</option>
                        <option value="trabajo_dirigido">Trabajo dirigido</option>
                        <option value="examen_grado">Examen de grado</option>
                        <option value="proyecto_grado">Proyecto de grado</option>
                      </optgroup>
                      <optgroup label="Otros">
                        <option value="titulacion_continua">Vía continua / diplomado</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Nota de Graduación (1-100)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      placeholder="Ej. 95"
                      max="100"
                      min="51"
                      step="0.1"
                      value={formData.nota}
                      onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                <div>
                  <FileDropzone
                    file={formData.archivo}
                    onFileChange={(file) => setFormData({ ...formData, archivo: file })}
                    label="Digitalización de Acta (PDF Escaneado)"
                    hint="Formato oficial admitido: PDF hasta 20 MB"
                  />
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
                  {submitting ? 'Guardando...' : 'Guardar y Archivar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR ACTA */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-100px)] border border-[#c5a059]/40 animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            <div className="bg-gradient-to-r from-[#07162b] via-[#0B2545] to-[#15418c] text-white px-6 py-4 flex items-center justify-between border-b border-[#c5a059]/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c5a059]">edit</span>
                <span className="font-institutional-serif text-base font-bold">Editar Acta de Graduación</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      N.° de Acta Original *
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      value={editFormData.nro_acta}
                      onChange={(e) => setEditFormData({ ...editFormData, nro_acta: e.target.value })}
                      required
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Código Único CPD
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      value={editFormData.codigo_cpd}
                      onChange={(e) => setEditFormData({ ...editFormData, codigo_cpd: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                    Nombre Completo del Postulante *
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                    value={editFormData.nombre_estudiante}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre_estudiante: e.target.value })}
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
                      Cédula de Identidad (CI)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      value={editFormData.ci}
                      onChange={(e) => setEditFormData({ ...editFormData, ci: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Modalidad de Titulación *
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 cursor-pointer"
                      value={editFormData.modalidad}
                      onChange={(e) => setEditFormData({ ...editFormData, modalidad: e.target.value })}
                      required
                    >
                      <optgroup label="Graduación Directa">
                        <option value="excelencia">Excelencia académica</option>
                        <option value="buen_rendimiento">Buen rendimiento</option>
                        <option value="buen_desempeno">Buen desempeño</option>
                      </optgroup>
                      <optgroup label="Modalidad con Tribunal">
                        <option value="tesis">Tesis de grado</option>
                        <option value="trabajo_dirigido">Trabajo dirigido</option>
                        <option value="examen_grado">Examen de grado</option>
                        <option value="proyecto_grado">Proyecto de grado</option>
                      </optgroup>
                      <optgroup label="Otros">
                        <option value="titulacion_continua">Vía continua / diplomado</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-xs uppercase tracking-wider font-bold text-slate-600">
                      Nota de Graduación (1-100)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body-sm text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20"
                      max="100"
                      min="51"
                      step="0.1"
                      value={editFormData.nota}
                      onChange={(e) => setEditFormData({ ...editFormData, nota: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                <div>
                  <FileDropzone
                    file={editFormData.archivo}
                    onFileChange={(file) => setEditFormData({ ...editFormData, archivo: file })}
                    label="Reemplazar Digitalización de Acta (Opcional)"
                    hint="Suba un nuevo PDF solo si desea reemplazar el escaneo actual"
                  />
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

      {/* MODAL: SUBIR O REEMPLAZAR PDF DIRECTO */}
      {isUploadPdfModalOpen && selectedActa && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-100px)] border border-[#c5a059]/40 animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            <div className="bg-gradient-to-r from-[#07162b] via-[#0B2545] to-[#15418c] text-white px-6 py-4 flex items-center justify-between border-b border-[#c5a059]/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c5a059]">upload_file</span>
                <span className="font-institutional-serif text-base font-bold">Cargar Acta Digitalizada (PDF)</span>
              </div>
              <button
                className="text-white/70 hover:text-white cursor-pointer"
                onClick={() => !submitting && setIsUploadPdfModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadPdfSubmit}>
              <div className="p-6 flex flex-col gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-caption text-xs text-slate-500 font-semibold">
                    Postulante Titulado:
                  </span>
                  <span className="font-label-code text-xs font-bold text-[#0B2545] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedActa.nombre_estudiante} (Acta #{selectedActa.nro_acta})
                  </span>
                </div>

                <div>
                  <FileDropzone
                    file={formData.archivo}
                    onFileChange={(file) => setFormData({ ...formData, archivo: file })}
                    label="Archivo PDF Oficial *"
                    hint="Formatos admitidos: PDF/A hasta 20 MB"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsUploadPdfModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0B2545] to-[#15418c] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
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

export default Actas;
