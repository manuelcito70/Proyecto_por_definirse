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
      setExpedidos(list);
      setNextNumber(nextData.next || 1);
    } catch (err) {
      console.error('Error cargando expedidos:', err);
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

  // Pagination calculation
  const totalItems = expedidos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExpedidos = expedidos.slice(startIndex, startIndex + itemsPerPage);

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

      {/* MODAL: REGISTRO DE NUEVO OFICIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/60 backdrop-blur-sm" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary-fixed">post_add</span>
                <span className="font-headline-md text-headline-md font-bold">
                  {editingId ? 'Modificar Oficio Expedido' : 'Registro de Nuevo Oficio'}
                </span>
              </div>
              <button 
                className="text-on-primary/70 hover:text-on-primary" 
                onClick={() => !submitting && setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-space-lg flex flex-col gap-space-md">
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-caption text-caption text-on-surface-variant font-semibold">Correlativo Asignado:</span>
                  <span className="font-correlative-counter text-base text-secondary font-bold font-mono">
                    Oficio N.° {editingId ? String(formData.nro_oficio || editingId).padStart(2, '0') : String(nextNumber).padStart(2, '0')} / {gestion}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">Destinatario *</label>
                  <input 
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20" 
                    placeholder="Ej: DADSA, Decanato FINI, Consejo Facultativo..." 
                    type="text"
                    value={formData.destinatario}
                    onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">Asunto principal *</label>
                  <input 
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20" 
                    placeholder="Título o referencia del documento..." 
                    type="text"
                    value={formData.asunto}
                    onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">Fecha de emisión</label>
                    <input 
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none" 
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">Estado del trámite</label>
                    <select 
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="completado">Completado</option>
                      <option value="en_curso">En curso</option>
                      <option value="pendiente">Pendiente</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">Detalle / Resumen</label>
                  <textarea 
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none" 
                    placeholder="Descripción adicional del documento remitido..." 
                    rows="3"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  ></textarea>
                </div>

                {!editingId && (
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">Digitalización (PDF Opcional)</label>
                    <label className="border-2 border-dashed border-outline-variant hover:border-secondary rounded-lg p-space-md flex flex-col items-center justify-center gap-1 cursor-pointer bg-surface-container-low/40 transition-colors">
                      <span className="material-symbols-outlined text-2xl text-secondary">upload_file</span>
                      <span className="font-body-sm text-body-sm font-medium text-on-surface">
                        {formData.archivo ? formData.archivo.name : 'Arrastre el PDF del oficio firmado o haga clic para seleccionar'}
                      </span>
                      <span className="font-caption text-caption text-outline">Formato permitido: PDF/A hasta 20MB</span>
                      <input 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] || null })}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-end gap-space-sm border-t border-outline-variant/20">
                <button 
                  type="button"
                  className="px-space-md py-2 rounded-lg font-body-sm text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm font-semibold shadow-sm hover:bg-primary transition-colors" 
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : `Guardar y Asignar #${String(nextNumber).padStart(2, '0')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expedidos;
