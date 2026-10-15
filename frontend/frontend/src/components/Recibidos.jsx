import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { 
  getRecibidos, 
  createRecibido, 
  updateRecibido, 
  deleteRecibido, 
  downloadFile 
} from '../services/api';

const Recibidos = () => {
  const { gestion } = useGestion();
  const [recibidos, setRecibidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [formData, setFormData] = useState({
    remitente: '',
    oficio_original: '',
    asunto: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_atencion: 'Requiere respuesta',
    archivo: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getRecibidos({
        gestion,
        busqueda: busqueda || undefined
      });
      const safeList = Array.isArray(list) ? list : [];
      setRecibidos(safeList);
    } catch (err) {
      console.error('Error cargando recibidos:', err);
      setRecibidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [gestion]);

  // Toast helper
  const showToast = (title, desc) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.remitente || !formData.asunto) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('remitente', formData.remitente);
      data.append('asunto', formData.asunto);
      data.append('descripcion', formData.oficio_original ? `Oficio original: ${formData.oficio_original}` : '');
      data.append('fecha', formData.fecha);
      data.append('estado', formData.tipo_atencion.includes('Requiere') ? 'pendiente' : 'completado');
      data.append('tipo_respuesta', formData.tipo_atencion.includes('Requiere') ? 'requiere_respuesta' : 'para_conocimiento');
      if (formData.archivo) {
        data.append('archivo', formData.archivo);
      }

      const res = await createRecibido(data);
      setFormData({
        remitente: '',
        oficio_original: '',
        asunto: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo_atencion: 'Requiere respuesta',
        archivo: null
      });

      showToast(
        `Documento recibido #${String(res.nro_recibido || 1).padStart(2, '0')}/${gestion} registrado`,
        'Guardado con respaldo digital indexado en Sistemas.'
      );
      await fetchData();
    } catch (err) {
      alert('Error al registrar documento: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstado = async (doc) => {
    const nuevoEstado = doc.estado === 'completado' ? 'pendiente' : 'completado';
    try {
      await updateRecibido(doc.id, { estado: nuevoEstado });
      showToast(
        'Estado actualizado',
        `El documento #${String(doc.nro_recibido).padStart(2, '0')} ahora está ${nuevoEstado.toUpperCase()}.`
      );
      fetchData();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const handleDelete = async (id, nro) => {
    if (!window.confirm(`¿Estás seguro de eliminar el documento recibido N.º ${nro}?`)) return;
    try {
      await deleteRecibido(id);
      showToast('Registro eliminado', `Se eliminó el documento #${nro}.`);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Next number calculation with full array safety
  const safeRecibidos = Array.isArray(recibidos) ? recibidos : [];
  const highestNumber = safeRecibidos.reduce((max, r) => Math.max(max, r?.nro_recibido || 0), 0);
  const nextRecibidoNumber = highestNumber + 1;

  // Filtered & Paginated records
  const filteredRecibidos = safeRecibidos.filter(doc => {
    if (!doc) return false;
    if (!busqueda) return true;
    const term = (busqueda || '').toLowerCase().trim();
    return (
      (doc.remitente && String(doc.remitente).toLowerCase().includes(term)) ||
      (doc.asunto && String(doc.asunto).toLowerCase().includes(term)) ||
      (doc.descripcion && String(doc.descripcion).toLowerCase().includes(term)) ||
      String(doc.nro_recibido || '').includes(term)
    );
  });

  const totalItems = filteredRecibidos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecibidos = filteredRecibidos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col w-full gap-y-space-lg">
      {/* Encabezado Sub-header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-col gap-space-xs">
          <nav className="flex items-center gap-2 text-on-surface-variant font-caption text-caption uppercase tracking-wider">
            <span>Gestión documental</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-semibold">Documentos recibidos</span>
          </nav>
          <div className="flex items-center gap-space-sm mt-1">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Documentos recibidos</h1>
            <span className="inline-flex items-center px-space-sm py-0.5 rounded-full bg-surface-container-high text-secondary font-label-badge text-caption">
              SISTEMAS
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Registro de documentos externos y respaldo digital del archivo físico.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <button 
            className="inline-flex items-center gap-space-xs bg-secondary text-on-secondary px-space-lg py-2.5 rounded-lg shadow-sm hover:bg-secondary-container transition-all font-body-sm text-body-sm font-semibold" 
            onClick={() => {
              const el = document.getElementById('form-registro-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>+ Registrar recibido</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
        {/* Card 1: Dark Navy Gradient */}
        <div className="md:col-span-4 bg-primary text-on-primary p-space-lg rounded-xl shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between z-10">
            <span className="font-caption text-caption font-bold tracking-widest text-primary-fixed uppercase">
              Gestión Activa {gestion}
            </span>
            <span className="material-symbols-outlined text-secondary-fixed text-xl">tag</span>
          </div>
          <div className="my-space-md z-10">
            <div className="font-caption text-caption tracking-wider uppercase text-on-primary-container font-semibold">PRÓXIMO INTERNO</div>
            <div className="font-correlative-counter text-correlative-counter text-surface-container-lowest font-bold tracking-tight mt-1 flex items-baseline gap-1">
              <span>{String(nextRecibidoNumber).padStart(2, '0')}</span>
              <span className="text-on-primary-container font-headline-md text-headline-md">/ {gestion}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 text-primary-fixed-dim font-caption text-caption z-10">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
            <span>Secuencia correlativa reservada</span>
          </div>
        </div>

        {/* Card 2: Correlativo automático */}
        <div className="md:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-space-sm text-secondary">
            <span className="material-symbols-outlined text-2xl">sync</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">Correlativo automático</h3>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant my-space-sm leading-relaxed">
            Se asigna al registrar y reinicia en 01 cada año. No reemplaza el oficio original del remitente institucional.
          </p>
          <div className="bg-surface-container-low px-space-md py-2 rounded-lg flex items-center justify-between text-on-surface-variant font-caption text-caption font-medium">
            <span>Vigencia: Gestión {gestion}</span>
            <span className="font-label-code text-label-code text-secondary font-bold">R-SYS-{String(gestion).slice(-2)}</span>
          </div>
        </div>

        {/* Card 3: Respaldo digital */}
        <div className="md:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-space-sm text-secondary">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">Respaldo digital</h3>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant my-space-sm leading-relaxed">
            El escaneo se consulta o descarga digitalmente; su contenido original no se edita y conserva validez legal.
          </p>
          <div className="bg-surface-container-low px-space-md py-2 rounded-lg flex items-center justify-between text-on-surface-variant font-caption text-caption font-medium">
            <span>Estándar: Archivo PDF/A</span>
            <span className="material-symbols-outlined text-sm text-secondary">lock</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-space-lg py-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border-b border-outline-variant/20">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-secondary">folder_open</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Registro de correspondencia recibida</h2>
            <span className="bg-surface-container px-2 py-0.5 rounded-full text-secondary font-label-code text-label-code font-bold">
              {recibidos.length} registros
            </span>
          </div>

          <div className="flex items-center gap-space-sm w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input 
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" 
                placeholder="Filtrar por oficio, remitente..." 
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-base">search</span>
            </div>
            <button 
              onClick={fetchData}
              className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
              title="Refrescar"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant font-caption text-caption uppercase tracking-wider">
              <tr>
                <th className="py-3 px-space-lg">N.° Interno</th>
                <th className="py-3 px-space-md">Fecha recepción</th>
                <th className="py-3 px-space-md">Remitente / Oficio original</th>
                <th className="py-3 px-space-md">Asunto / Referencia documental</th>
                <th className="py-3 px-space-md">Estado</th>
                <th className="py-3 px-space-lg text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                    Cargando correspondencia recibida...
                  </td>
                </tr>
              ) : currentRecibidos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-on-surface-variant">
                    <p className="mb-2">No se encontraron documentos recibidos en la gestión {gestion}.</p>
                    <button 
                      onClick={() => {
                        const el = document.getElementById('form-registro-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-semibold"
                    >
                      Registrar recibido
                    </button>
                  </td>
                </tr>
              ) : (
                currentRecibidos.map((doc) => {
                  const esPendiente = doc.estado === 'pendiente';
                  return (
                    <tr key={doc.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-4 px-space-lg">
                        <span className="font-label-code text-label-code font-bold text-secondary bg-surface-container-high px-2 py-1 rounded">
                          #{String(doc.nro_recibido).padStart(2, '0')} / {gestion}
                        </span>
                      </td>

                      <td className="py-4 px-space-md whitespace-nowrap text-on-surface-variant font-mono text-xs">
                        {doc.fecha}
                      </td>

                      <td className="py-4 px-space-md">
                        <div className="font-semibold text-on-surface">{doc.remitente}</div>
                        {doc.descripcion && (
                          <div className="font-label-code text-caption text-on-surface-variant line-clamp-1">
                            {doc.descripcion}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-space-md max-w-xs">
                        <div className="font-medium text-on-surface">{doc.asunto}</div>
                        {esPendiente ? (
                          <div className="font-caption text-caption text-error font-medium flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-xs">priority_high</span> Requiere respuesta
                          </div>
                        ) : (
                          <div className="font-caption text-caption text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-xs">archive</span> Solo conocimiento archivado
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-space-md whitespace-nowrap">
                        {esPendiente ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-badge text-caption font-bold bg-error-container text-on-error-container">
                            <span className="w-1.5 h-1.5 rounded-full bg-error"></span> PENDIENTE
                          </span>
                        ) : doc.estado === 'en_curso' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-badge text-caption font-bold bg-secondary-fixed text-on-secondary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> EN CURSO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-badge text-caption font-bold bg-surface-container-highest text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> COMPLETADO
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-space-lg text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {doc.archivo_path ? (
                            <>
                              <button 
                                className="p-1.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors" 
                                onClick={() => setPreviewDoc(doc)}
                                title="Ver escaneo digital" 
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button 
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" 
                                onClick={() => downloadFile(`/recibidos/${doc.id}/download`, doc.nombre_archivo || 'recibido.pdf')}
                                title="Descargar documento" 
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">download</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-outline italic mr-2">Sin archivo</span>
                          )}

                          <button 
                            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold"
                            onClick={() => handleToggleEstado(doc)}
                            title={esPendiente ? "Marcar como respondido" : "Reabrir como pendiente"}
                          >
                            <span className="material-symbols-outlined text-base">
                              {esPendiente ? 'check_circle' : 'replay'}
                            </span>
                          </button>

                          <button 
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors"
                            onClick={() => handleDelete(doc.id, doc.nro_recibido)}
                            title="Eliminar registro"
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

        {/* Pagination Footer */}
        <div className="px-space-lg py-3 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-caption text-caption border-t border-outline-variant/20">
          <span>
            Mostrando {totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} documentos en gestión {gestion}
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="font-bold text-on-surface font-mono">Página {currentPage} de {totalPages}</span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* FORMULARIO REGISTRAR RECIBIDO */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-lg" id="form-registro-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md bg-surface-container-low p-space-md rounded-lg">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">post_add</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Registrar documento recibido</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Llene los datos formales para anexar al archivo oficial de Sistemas.</p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-2 rounded-lg shadow-sm">
            <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">Correlativo asignado:</span>
            <span className="font-label-code text-label-code font-bold text-secondary bg-surface-container px-2 py-0.5 rounded">
              {String(nextRecibidoNumber).padStart(2, '0')} / {gestion} (Automático)
            </span>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-space-lg">
          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-on-surface flex items-center gap-1">
              <span>Origen / Remitente</span>
              <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">corporate_fare</span>
              <input 
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" 
                placeholder="Ej. Decanatura FINI, Dirección de Carrera Civil..." 
                value={formData.remitente}
                onChange={(e) => setFormData({ ...formData, remitente: e.target.value })}
                required 
                type="text"
              />
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-on-surface flex items-center gap-1">
              <span>N.° de oficio original</span>
              <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">numbers</span>
              <input 
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-label-code text-body-md pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" 
                placeholder="Ej. OF-EXT-A/028, CITE-DIR-2026..." 
                value={formData.oficio_original}
                onChange={(e) => setFormData({ ...formData, oficio_original: e.target.value })}
                required 
                type="text"
              />
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-on-surface flex items-center gap-1">
              <span>Fecha de recepción</span>
              <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">calendar_month</span>
              <input 
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" 
                type="date" 
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-on-surface flex items-center gap-1">
              <span>Tipo de atención</span>
              <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">tune</span>
              <select 
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm appearance-none"
                value={formData.tipo_atencion}
                onChange={(e) => setFormData({ ...formData, tipo_atencion: e.target.value })}
                required
              >
                <option value="Requiere respuesta">Requiere respuesta (En trámite)</option>
                <option value="Solo conocimiento">Solo conocimiento (Para archivo institucional)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
            </div>
          </div>

          <div className="md:col-span-12 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-on-surface flex items-center gap-1">
              <span>Asunto / Referencia documental</span>
              <span className="text-error">*</span>
            </label>
            <textarea 
              className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md p-3 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" 
              placeholder="Sintetice el contenido del documento, solicitud o antecedente..." 
              value={formData.asunto}
              onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
              required 
              rows="2"
            ></textarea>
          </div>

          <div className="md:col-span-12 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-on-surface flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>Archivo escaneado (PDF o imagen digitalizada)</span>
              </span>
              <span className="font-caption text-caption text-on-surface-variant">Formatos admitidos: PDF, JPG, PNG / Máx 25 MB</span>
            </label>

            <label className="bg-surface-container-low p-space-md rounded-xl flex flex-col sm:flex-row items-center justify-between gap-space-md border-2 border-dashed border-outline-variant hover:border-secondary transition-colors cursor-pointer">
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-code text-body-sm font-bold text-on-surface">
                    {formData.archivo ? formData.archivo.name : 'Ningún archivo seleccionado'}
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {formData.archivo ? `${(formData.archivo.size / 1024 / 1024).toFixed(2)} MB` : 'Haz clic para adjuntar el escaneo oficial'}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-surface-container-highest text-secondary px-space-md py-1.5 rounded-lg font-caption text-caption font-semibold">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                {formData.archivo ? 'Cambiar archivo' : 'Seleccionar archivo'}
              </span>
              <input 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg" 
                className="hidden" 
                onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] || null })}
              />
            </label>
          </div>

          <div className="md:col-span-12 flex flex-col sm:flex-row items-center justify-end gap-space-sm pt-space-sm border-t border-outline-variant/20">
            <button 
              className="w-full sm:w-auto px-space-lg py-2.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-body-sm text-body-sm font-medium transition-colors" 
              type="reset"
              onClick={() => setFormData({
                remitente: '',
                oficio_original: '',
                asunto: '',
                fecha: new Date().toISOString().split('T')[0],
                tipo_atencion: 'Requiere respuesta',
                archivo: null
              })}
            >
              Limpiar campos
            </button>
            <button 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-xl py-2.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container shadow-md font-body-sm text-body-sm font-bold transition-all" 
              type="submit"
              disabled={submitting}
            >
              <span className="material-symbols-outlined text-lg">save</span>
              <span>{submitting ? 'Guardando...' : 'Guardar registro'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL PREVIEW DE DOCUMENTO */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-space-md bg-primary text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-fixed">description</span>
                <div>
                  <h4 className="font-headline-md text-body-lg font-bold">{previewDoc.asunto}</h4>
                  <span className="font-label-code text-caption text-primary-fixed">
                    #{String(previewDoc.nro_recibido).padStart(2, '0')} / {gestion} · {previewDoc.remitente}
                  </span>
                </div>
              </div>
              <button className="text-on-primary-container hover:text-on-primary p-1" onClick={() => setPreviewDoc(null)} type="button">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-space-xl flex flex-col items-center justify-center min-h-[280px] bg-surface-container-low text-center gap-space-md">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
              </div>
              <div className="max-w-md">
                <h5 className="font-headline-md text-headline-md text-on-surface">Visor de Respaldo Documental</h5>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Archivo original: <strong>{previewDoc.nombre_archivo || 'documento.pdf'}</strong>
                </p>
                <p className="font-caption text-caption text-on-surface-variant mt-1">
                  Este expediente digital se encuentra indexado en el servidor de archivo FINI UAGRM bajo norma de no repudio.
                </p>
              </div>

              <div className="flex items-center gap-space-sm mt-2">
                <button 
                  className="px-space-lg py-2 rounded-lg bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold hover:bg-secondary-container shadow-sm inline-flex items-center gap-1" 
                  onClick={() => downloadFile(`/recibidos/${previewDoc.id}/download`, previewDoc.nombre_archivo || 'recibido.pdf')}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Abrir / Descargar Documento</span>
                </button>
                <button 
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-body-sm text-body-sm font-semibold"
                  onClick={() => setPreviewDoc(null)}
                  type="button"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-primary text-on-primary px-space-lg py-space-md rounded-xl shadow-xl flex items-center gap-space-md">
            <span className="material-symbols-outlined text-secondary-fixed text-2xl">check_circle</span>
            <div className="flex flex-col">
              <span className="font-headline-md text-body-sm font-bold text-surface-container-lowest">{toastMessage.title}</span>
              <span className="font-body-sm text-caption text-on-primary-container">{toastMessage.desc}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recibidos;
