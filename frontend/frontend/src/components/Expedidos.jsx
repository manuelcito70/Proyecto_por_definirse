import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { 
  getExpedidos, 
  getNextExpedidoNumber, 
  createExpedido, 
  updateExpedido,
  deleteExpedido, 
  downloadFile 
} from '../services/api';

const Expedidos = () => {
  const { gestion } = useGestion();
  const [expedidos, setExpedidos] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    destinatario: '',
    asunto: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'completado',
    archivo: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [list, nextData] = await Promise.all([
        getExpedidos({
          gestion,
          busqueda: busqueda || undefined,
          estado: filterEstado !== 'all' ? filterEstado : undefined
        }),
        getNextExpedidoNumber(gestion)
      ]);
      setExpedidos(Array.isArray(list) ? list : []);
      setNextNumber((nextData && nextData.next) || 1);
    } catch (err) {
      console.error('Error cargando expedidos:', err);
      setExpedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [gestion, filterEstado]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      destinatario: '',
      asunto: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'completado',
      archivo: null
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc) => {
    setEditingId(doc.id);
    setFormData({
      destinatario: doc.destinatario || '',
      asunto: doc.asunto || '',
      descripcion: doc.descripcion || '',
      fecha: doc.fecha || new Date().toISOString().split('T')[0],
      estado: doc.estado || 'completado',
      archivo: null
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destinatario || !formData.asunto) {
      alert('Por favor complete destinatario y asunto.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateExpedido(editingId, {
          destinatario: formData.destinatario,
          asunto: formData.asunto,
          descripcion: formData.descripcion,
          fecha: formData.fecha,
          estado: formData.estado
        });
      } else {
        const data = new FormData();
        data.append('destinatario', formData.destinatario);
        data.append('asunto', formData.asunto);
        data.append('descripcion', formData.descripcion || '');
        data.append('fecha', formData.fecha);
        data.append('estado', formData.estado);
        data.append('gestion', gestion);
        if (formData.archivo) {
          data.append('archivo', formData.archivo);
        }
        await createExpedido(data);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Error al guardar oficio: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nro) => {
    if (!window.confirm(`¿Estás seguro de eliminar el oficio N.º ${nro}?`)) return;
    try {
      await deleteExpedido(id);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Pagination calculation with full array safety
  const safeExpedidos = Array.isArray(expedidos) ? expedidos : [];
  const totalItems = safeExpedidos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExpedidos = safeExpedidos.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'completado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completado
          </span>
        );
      case 'en_curso':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            En curso
          </span>
        );
      case 'pendiente':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full gap-y-space-lg">
      {/* Breadcrumb & Top Bar Meta */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <nav className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
          <span className="hover:text-primary transition-colors cursor-pointer">Gestión documental</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="font-bold text-secondary">Documentos expedidos</span>
        </nav>
        <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full text-on-surface-variant font-caption text-caption">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Base de datos activa</span>
          <span className="text-outline-variant">•</span>
          <span className="font-mono text-on-surface font-semibold">FINI-UAGRM</span>
        </div>
      </div>

      {/* Page Header Title & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-badge text-label-badge tracking-wider text-secondary uppercase font-bold">
              Dirección de Carrera / Sistemas
            </span>
          </div>
          <h1 className="font-display text-display text-primary tracking-tight">Documentos expedidos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Oficios elaborados en dirección y remitidos a otras oficinas y dependencias facultativas.
          </p>
        </div>

        {/* Quick Action Modal Trigger */}
        <div className="flex items-center gap-space-sm self-start sm:self-auto">
          <button 
            className="inline-flex items-center gap-space-xs bg-secondary text-on-secondary px-space-md py-2.5 rounded-lg font-body-sm text-body-sm font-semibold shadow-md hover:bg-primary transition-all duration-200" 
            onClick={handleOpenCreateModal}
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Nuevo oficio</span>
          </button>
        </div>
      </div>

      {/* Correlative Running Tracker Card */}
      <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
        <div className="absolute -right-8 -top-12 w-48 h-48 bg-secondary/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-space-lg min-w-0">
          {/* Big Correlative Block */}
          <div className="flex flex-col items-center justify-center bg-surface-container-low px-space-lg py-space-sm rounded-xl min-w-[110px]">
            <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">Próximo oficio</span>
            <span className="font-correlative-counter text-correlative-counter text-secondary font-extrabold tracking-tight">
              {String(nextNumber).padStart(2, '0')}
            </span>
            <span className="font-label-code text-label-code text-on-surface-variant font-mono">FINI-SIS/{gestion}</span>
          </div>

          {/* Descriptive Information */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="font-headline-md text-headline-md text-on-surface font-bold">
                Gestión {gestion} · Numeración correlativa automática
              </span>
              <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-xs">lock</span>
                Consecutivo estricto
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed max-w-xl">
              Correlativo único, ordenado de uno en uno y sin repeticiones ni duplicidad. Último oficio expedido registrado legalmente: {' '}
              <span className="font-mono font-bold text-on-surface">
                #{nextNumber > 1 ? String(nextNumber - 1).padStart(2, '0') : '00'}
              </span>.
            </p>
          </div>
        </div>

        {/* Historical Reference Box */}
        <div className="w-full lg:w-auto flex flex-col justify-between bg-surface-container-low/70 p-space-md rounded-xl max-w-xs">
          <div className="flex items-center justify-between gap-space-xs text-on-surface-variant mb-1">
            <span className="font-caption text-caption uppercase tracking-wider font-bold">Cierre de gestión {gestion - 1}</span>
            <span className="material-symbols-outlined text-sm text-secondary">inventory_2</span>
          </div>
          <p className="font-caption text-caption text-on-surface-variant leading-snug">
            El histórico documental se preserva cerrado e inmutable. Cada ciclo anual restablece la serie numérica correlativa en <span className="font-mono font-bold text-on-surface">001</span>.
          </p>
        </div>
      </div>

      {/* Main Document Table Container */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {/* Card Head: Title, Search & Filters */}
        <div className="p-space-lg flex flex-col gap-space-md border-b border-outline-variant/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-xl">folder_shared</span>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Archivo oficial de correspondencia</h2>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{expedidos.length} oficios registrados en Gestión {gestion}</span>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-lg">search</span>
              </span>
              <input 
                className="w-full pl-10 pr-12 py-2.5 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 focus:outline-none transition-all" 
                placeholder="Buscar por asunto, destinatario o descripción..." 
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-outline-variant font-label-code text-caption">
                Enter ↵
              </span>
            </form>

            {/* Filter Controls */}
            <div className="flex items-center gap-space-xs">
              <div className="relative">
                <select 
                  className="appearance-none bg-surface-container-low pl-3 pr-8 py-2.5 rounded-lg font-body-sm text-body-sm font-medium text-on-surface hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-secondary/20 cursor-pointer"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="completado">Completado</option>
                  <option value="en_curso">En curso</option>
                  <option value="pendiente">Pendiente</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                  filter_list
                </span>
              </div>
              <button 
                onClick={fetchData}
                className="p-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors flex items-center justify-center" 
                title="Refrescar lista"
              >
                <span className="material-symbols-outlined text-lg leading-none">refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-caption text-caption uppercase tracking-wider">
                <th className="py-3 px-space-md font-bold">N.° de oficio</th>
                <th className="py-3 px-space-sm font-bold">Gestión</th>
                <th className="py-3 px-space-sm font-bold">Fecha</th>
                <th className="py-3 px-space-md font-bold min-w-[280px]">Asunto</th>
                <th className="py-3 px-space-md font-bold">Destinatario</th>
                <th className="py-3 px-space-sm font-bold">Estado</th>
                <th className="py-3 px-space-md font-bold">Documento</th>
                <th className="py-3 px-space-md font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-on-surface font-body-sm text-body-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-on-surface-variant">
                    Cargando correspondencia oficial...
                  </td>
                </tr>
              ) : currentExpedidos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-on-surface-variant">
                    <p className="mb-2">No se encontraron oficios expedidos en la gestión {gestion}.</p>
                    <button 
                      onClick={handleOpenCreateModal}
                      className="px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-semibold"
                    >
                      Registrar el primero
                    </button>
                  </td>
                </tr>
              ) : (
                currentExpedidos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-container-low/60 transition-colors group">
                    <td className="py-3.5 px-space-md font-label-code text-label-code font-bold text-secondary">
                      #{String(doc.nro_oficio).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-space-sm font-label-code text-label-code text-on-surface-variant">
                      {doc.gestion}
                    </td>
                    <td className="py-3.5 px-space-sm font-mono text-xs text-on-surface-variant">
                      {doc.fecha}
                    </td>
                    <td className="py-3.5 px-space-md">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface group-hover:text-secondary transition-colors">
                          {doc.asunto}
                        </span>
                        {doc.descripcion && (
                          <span className="font-caption text-caption text-on-surface-variant line-clamp-1">
                            {doc.descripcion}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md font-medium text-on-surface">
                      {doc.destinatario}
                    </td>
                    <td className="py-3.5 px-space-sm">
                      {getStatusBadge(doc.estado)}
                    </td>
                    <td className="py-3.5 px-space-md">
                      {doc.archivo_path ? (
                        <button 
                          onClick={() => downloadFile(`/expedidos/${doc.id}/download`, doc.nombre_archivo || 'oficio.pdf')}
                          className="inline-flex items-center gap-1.5 text-secondary hover:text-primary font-body-sm text-body-sm font-semibold transition-colors"
                          title="Descargar o abrir escaneo digital"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          <span>Descargar PDF</span>
                        </button>
                      ) : (
                        <span className="font-caption text-caption text-outline italic">Sin archivo</span>
                      )}
                    </td>
                    <td className="py-3.5 px-space-md text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(doc)}
                          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-secondary transition-colors" 
                          title="Editar oficio"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id, doc.nro_oficio)}
                          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors" 
                          title="Eliminar oficio"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination & Records Tracker */}
        <div className="p-space-md bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-outline-variant/20">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Mostrando <span className="font-semibold text-on-surface">{totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, totalItems)}</span> de <span className="font-semibold text-on-surface">{totalItems}</span> oficios registrados
          </span>
          
          {/* Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg font-body-sm text-body-sm font-bold transition-colors ${
                  currentPage === page 
                    ? 'bg-secondary text-on-secondary shadow-sm' 
                    : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {page}
              </button>
            ))}

            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Legend Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption uppercase tracking-wider font-bold">
          <span className="material-symbols-outlined text-base text-secondary">info</span>
          <span>Seguimiento de estados:</span>
        </div>
        <div className="flex flex-wrap items-center gap-space-lg font-body-sm text-body-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              Completado
            </span>
            <span className="text-on-surface-variant font-caption text-caption">Trámite concluido / archivado</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800">
              <span className="material-symbols-outlined text-xs">sync</span>
              En curso
            </span>
            <span className="text-on-surface-variant font-caption text-caption">En revisión / tratamiento</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800">
              <span className="material-symbols-outlined text-xs">error</span>
              Pendiente
            </span>
            <span className="text-on-surface-variant font-caption text-caption">Aún se espera respuesta</span>
          </div>
        </div>
      </div>

      {/* MODAL: REGISTRO DE NUEVO OFICIO (HIGH-FIDELITY UAGRM FINI) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-[#07162c]/75 backdrop-blur-md transition-all duration-300" 
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div 
            aria-labelledby="modal-title" 
            aria-modal="true" 
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform transition-all flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()} 
            role="dialog"
          >
            {/* Modal Top Branding Bar (Navy Blue Gradient) */}
            <div className="bg-gradient-to-r from-[#07162c] via-[#0b2545] to-[#134074] px-6 py-4 border-b border-white/10 flex items-center justify-between text-white relative">
              {/* Visual Glow Effect */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center space-x-3 z-10">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base tracking-wide text-white" id="modal-title">
                      {editingId ? 'Modificar Oficio Expedido' : 'Registro de Nuevo Oficio'}
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 tracking-wider">
                      GESTIÓN {gestion}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200/80">Dirección de Ingeniería de Sistemas — Sede Ichilo</p>
                </div>
              </div>

              {/* Close Button */}
              <button 
                aria-label="Cerrar modal" 
                className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl border border-white/10 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer" 
                onClick={() => !submitting && setIsModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base leading-none block">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5 bg-gradient-to-b from-slate-50/50 to-white">
              {/* Correlative Assigned Banner (Official Folio Ticket) */}
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shadow-md shrink-0 font-bold font-mono">
                      #
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        {editingId ? 'Oficio Registrado' : 'Correlativo Oficial Reservado'}
                      </span>
                      <span className="text-xl font-mono font-extrabold text-blue-900 tracking-tight">
                        Oficio N.° {editingId ? String(formData.nro_oficio || editingId).padStart(2, '0') : String(nextNumber).padStart(2, '0')}{' '}
                        <span className="text-blue-500 font-light">/</span> {gestion}
                      </span>
                    </div>
                  </div>

                  {/* Auto-Assignment Status Pill */}
                  <div className="inline-flex items-center self-start sm:self-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="material-symbols-outlined text-xs text-emerald-600">lock</span>
                    <span>Asignación Automática e Inmutable</span>
                  </div>
                </div>
              </div>

              {/* Main Form Elements */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Field: Destinatario with quick suggestions chips */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1" htmlFor="destinatario-input">
                      Destinatario <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Autoridad o Unidad</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-lg">corporate_fare</span>
                    </div>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-150 outline-none shadow-xs" 
                      id="destinatario-input" 
                      placeholder="Ej: DADSA, Decanato FINI, Consejo Facultativo..." 
                      required 
                      type="text"
                      value={formData.destinatario}
                      onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                    />
                  </div>

                  {/* Quick Selection Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">Frecuentes:</span>
                    {['DADSA', 'Decanato FINI', 'Consejo Facultativo', 'Vicedecanatura', 'CPD'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setFormData({ ...formData, destinatario: item })}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors font-medium cursor-pointer ${
                          formData.destinatario === item
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field: Asunto Principal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="asunto-input">
                    Asunto Principal <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-150 outline-none shadow-xs" 
                      id="asunto-input" 
                      placeholder="Título descriptivo o referencia resumida del trámite..." 
                      required 
                      type="text"
                      value={formData.asunto}
                      onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row: Two columns for Date & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date Picker Element */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="fecha-input">
                      Fecha de Emisión <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                      </div>
                      <input 
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-150 outline-none shadow-xs" 
                        id="fecha-input" 
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Status Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="estado-select">
                      Estado del Trámite <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </div>
                      <select 
                        className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-150 outline-none shadow-xs appearance-none cursor-pointer" 
                        id="estado-select"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      >
                        <option value="completado">Completado (Listo para despacho)</option>
                        <option value="en_curso">En curso / Revisión preliminar</option>
                        <option value="pendiente">Pendiente de firma directiva</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-base">expand_more</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Field: Detalle / Resumen */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="resumen-textarea">
                      Detalle / Resumen del Contenido
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formData.descripcion ? `${formData.descripcion.length}/500 car.` : 'Max. 500 car.'}
                    </span>
                  </div>
                  <textarea 
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-150 outline-none shadow-xs resize-none" 
                    id="resumen-textarea" 
                    placeholder="Descripción adicional del documento remitido, antecedentes, códigos de seguimiento o referencias anexas..." 
                    rows="3"
                    maxLength={500}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  ></textarea>
                </div>

                {/* Field: Digitalización (PDF Respaldatorio) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-blue-600">cloud_upload</span>
                      <span>Digitalización (PDF Respaldo)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      PDF/A hasta 20 MB
                    </span>
                  </div>

                  {formData.archivo ? (
                    /* File Info Card State */
                    <div className="border border-blue-200/90 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/30 rounded-2xl p-3 shadow-xs flex items-center justify-between">
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                        </div>
                        <div className="truncate text-left">
                          <p className="text-xs font-bold text-slate-800 truncate" title={formData.archivo.name}>
                            {formData.archivo.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="inline-flex items-center text-emerald-600 font-semibold gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span> PDF/A Seleccionado
                            </span>
                            <span>•</span>
                            <span>{(formData.archivo.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                        <button 
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition cursor-pointer" 
                          onClick={() => {
                            const blobUrl = URL.createObjectURL(formData.archivo);
                            window.open(blobUrl, '_blank');
                          }}
                          title="Vista previa del documento" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <label 
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer" 
                          title="Reemplazar archivo"
                        >
                          <span className="material-symbols-outlined text-base">sync</span>
                          <input 
                            accept=".pdf,.png,.jpg,.jpeg" 
                            className="hidden" 
                            onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] || null })} 
                            type="file" 
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    /* Drag and drop prompt dropzone */
                    <label className="group relative border-2 border-dashed border-blue-300 hover:border-blue-500 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/30 rounded-2xl p-5 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">upload_file</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 text-center">
                        Arrastra un archivo nuevo o <span className="text-blue-600 hover:underline">examinar desde tu equipo</span>
                      </p>
                      <p className="text-[11px] text-slate-400">PDF firmado, escaneado o digitalizado (máx. 20 MB)</p>
                      <input 
                        accept=".pdf,.png,.jpg,.jpeg" 
                        className="hidden" 
                        onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] || null })} 
                        type="file" 
                      />
                    </label>
                  )}
                </div>

                {/* Institutional Trust Badge / Legal Notification */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
                  <span className="material-symbols-outlined text-amber-600 mt-0.5 text-base">shield</span>
                  <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                    Al confirmar, este oficio se registrará en el libro digital de correspondencia de la <b>UAGRM - Sede Ichilo</b> con folio legal único <b>#{editingId ? String(formData.nro_oficio || editingId).padStart(2, '0') : String(nextNumber).padStart(2, '0')}</b>. Los correlativos guardados no se pueden reiniciar.
                  </p>
                </div>

                {/* Modal Footer inside form to trigger submit */}
                <footer className="pt-4 border-t border-slate-200 flex items-center justify-between gap-space-sm">
                  <button 
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider transition duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300 active:scale-95 cursor-pointer" 
                    disabled={submitting}
                    onClick={() => setIsModalOpen(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button 
                    className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-98 transition-all duration-150 cursor-pointer disabled:opacity-50" 
                    disabled={submitting}
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform duration-150">
                      done_all
                    </span>
                    <span>
                      {submitting 
                        ? 'Guardando...' 
                        : editingId 
                          ? 'Guardar Cambios' 
                          : `Guardar y Asignar #${String(nextNumber).padStart(2, '0')}`}
                    </span>
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expedidos;
