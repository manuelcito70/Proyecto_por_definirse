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
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SuccessModal from './SuccessModal';
import FileDropzone from './FileDropzone';

const Expedidos = () => {
  const { gestion } = useGestion();
  const [expedidos, setExpedidos] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [successModalData, setSuccessModalData] = useState(null);

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
      nro_oficio: doc.nro_oficio,
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
        setSuccessModalData({
          badge: `OFICIO Nº ${String(formData.nro_oficio || editingId).padStart(2, '0')} / ${gestion}`,
          title: '¡Oficio Actualizado con Éxito!',
          message: `Los cambios realizados al oficio dirigido a "${formData.destinatario}" se guardaron correctamente.`
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
        setSuccessModalData({
          badge: `OFICIO Nº ${String(nextNumber).padStart(2, '0')} / ${gestion}`,
          title: '¡Oficio Emitido y Registrado!',
          message: `El oficio oficial dirigido a "${formData.destinatario}" fue registrado con correlativo asignado y custodia digital.`
        });
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
  const safeExpedidos = Array.isArray(expedidos) ? expedidos : [];
  const totalItems = safeExpedidos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExpedidos = safeExpedidos.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'completado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completado
          </span>
        );
      case 'en_curso':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            En curso
          </span>
        );
      case 'pendiente':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#c1121f] border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c1121f] animate-pulse"></span>
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
          <span className="font-bold text-[#c1121f]">Documentos expedidos</span>
        </nav>
        <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full text-on-surface-variant font-caption text-caption border border-slate-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Base de datos activa</span>
          <span className="text-outline-variant">•</span>
          <span className="font-label-code text-[#0b2545] font-semibold">FINI-UAGRM</span>
        </div>
      </div>

      {/* Page Header Title & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-12 bg-[#c1121f] rounded-full hidden sm:block mt-1 shadow-sm"></div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-badge text-caption tracking-widest text-[#c1121f] uppercase font-bold">
                Dirección de Carrera · Módulo 01
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-label-code text-[11px] text-[#0b2545] font-semibold uppercase">
                Registro Legal de Oficios
              </span>
            </div>
            <h1 className="font-institutional-serif text-[28px] md:text-[34px] text-[#0b2545] font-bold tracking-tight leading-tight">
              Documentos Expedidos
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Oficios elaborados en dirección y remitidos a otras dependencias bajo estricto consecutivo anual.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-sm self-start sm:self-auto bg-surface-container-lowest p-1.5 rounded-xl border border-surface-container shadow-xs">
          <div className="hidden sm:flex flex-col text-right px-2">
            <span className="font-label-code text-[10px] text-on-surface-variant uppercase font-semibold">
              Serie Vigente
            </span>
            <span className="font-label-code text-xs font-bold text-[#c1121f]">
              OF-FINI/{gestion}
            </span>
          </div>
          <button 
            className="btn-doc-fold" 
            onClick={handleOpenCreateModal}
            type="button"
          >
            <span className="material-symbols-outlined text-base text-[#c5a059]">add_circle</span>
            <span>+ Nuevo oficio</span>
          </button>
        </div>
      </div>

      {/* Correlative Running Tracker Card */}
      <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
        {/* Franjas geométricas y acento superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>
        <div className="absolute -right-8 -top-12 w-48 h-48 bg-[#c1121f]/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-space-lg min-w-0">
          {/* Big Correlative Block */}
          <div className="flex flex-col items-center justify-center bg-surface-container-low px-space-lg py-space-sm rounded-xl min-w-[120px] border border-slate-200/60 shadow-2xs">
            <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
              Próximo oficio
            </span>
            <span className="font-correlative-counter text-correlative-counter text-[#c1121f] font-bold tracking-tight">
              #{String(nextNumber).padStart(2, '0')}
            </span>
            <span className="font-label-code text-[11px] text-[#0b2545] font-bold font-mono">
              FINI-SIS/{gestion}
            </span>
          </div>

          {/* Descriptive Information */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="font-institutional-serif text-lg md:text-xl text-[#0b2545] font-bold">
                Gestión {gestion} · Numeración correlativa oficial
              </span>
              <span className="inline-flex items-center gap-1 bg-[#0b2545]/10 px-2.5 py-0.5 rounded-full text-xs font-bold text-[#0b2545] border border-[#0b2545]/20">
                <span className="material-symbols-outlined text-xs text-[#c1121f]">lock</span>
                Consecutivo estricto
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed max-w-xl">
              Correlativo legal único, ordenado de uno en uno y sin repeticiones. Último oficio expedido registrado: {' '}
              <span className="font-label-code font-bold text-[#c1121f] bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                #{nextNumber > 1 ? String(nextNumber - 1).padStart(2, '0') : '00'}
              </span>.
            </p>
          </div>
        </div>

        {/* Historical Reference Box */}
        <div className="w-full lg:w-auto flex flex-col justify-between bg-surface-container-low p-space-md rounded-xl max-w-xs border border-slate-200/70">
          <div className="flex items-center justify-between gap-space-xs text-[#0b2545] mb-1">
            <span className="font-institutional-serif text-xs uppercase tracking-wider font-bold">
              Cierre anual inmutable
            </span>
            <span className="material-symbols-outlined text-sm text-[#c5a059]">inventory_2</span>
          </div>
          <p className="font-caption text-caption text-on-surface-variant leading-snug">
            El archivo de correspondencia de cada año se preserva bajo norma de no repudio. Cada ciclo restablece la serie numérica en <strong className="text-[#0b2545]">#01</strong>.
          </p>
        </div>
      </div>

      {/* Main Document Table Container */}
      <div className="flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>

        {/* Card Head: Title, Search & Filters */}
        <div className="p-space-lg flex flex-col gap-space-md border-b border-surface-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-[#c1121f] rounded-full"></div>
              <h2 className="font-institutional-serif text-lg md:text-xl font-bold text-[#0b2545]">
                Archivo Oficial de Correspondencia
              </h2>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-code text-[11px] bg-surface-container-low px-2.5 py-1 rounded border border-surface-container">
              <span className="material-symbols-outlined text-sm text-[#0b2545]">schedule</span>
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
                className="w-full pl-10 pr-12 py-2.5 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-[#0b2545]/20 focus:outline-none transition-all border border-slate-200/80" 
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
                  className="appearance-none bg-surface-container-low pl-3 pr-8 py-2.5 rounded-lg font-body-sm text-body-sm font-medium text-on-surface hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-[#0b2545]/20 cursor-pointer border border-slate-200/80"
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
                className="p-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors flex items-center justify-center border border-slate-200/80 cursor-pointer" 
                title="Refrescar lista"
                type="button"
              >
                <span className="material-symbols-outlined text-lg leading-none">refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Table Wrapper with Institutional Theme */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0b2545] text-white font-caption text-[11px] uppercase tracking-wider">
                <th className="py-3 px-space-md font-bold">N.° de Oficio</th>
                <th className="py-3 px-space-sm font-bold">Gestión</th>
                <th className="py-3 px-space-sm font-bold">Fecha</th>
                <th className="py-3 px-space-md font-bold min-w-[280px]">Asunto</th>
                <th className="py-3 px-space-md font-bold">Destinatario</th>
                <th className="py-3 px-space-sm font-bold">Estado</th>
                <th className="py-3 px-space-md font-bold">Documento</th>
                <th className="py-3 px-space-md font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-on-surface font-body-sm text-body-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-6 px-4">
                    <LoadingState message={`Sincronizando oficios expedidos (${gestion})...`} />
                  </td>
                </tr>
              ) : currentExpedidos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-6 px-4">
                    <EmptyState
                      title={`No se encontraron oficios expedidos en ${gestion}`}
                      message={busqueda ? `No hay oficios que coincidan con la búsqueda "${busqueda}".` : "No existen oficios registrados para la gestión seleccionada."}
                      actionText="Emitir nuevo oficio"
                      onAction={handleOpenCreateModal}
                    />
                  </td>
                </tr>
              ) : (
                currentExpedidos.map((doc, idx) => (
                  <tr 
                    key={doc.id} 
                    className={`hover:bg-surface-container-low/60 transition-colors group ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-surface-container-lowest'
                    }`}
                  >
                    <td className="py-3.5 px-space-md font-label-code text-label-code font-bold">
                      <span className={`px-2 py-0.5 rounded border ${
                        doc.estado === 'pendiente'
                          ? 'bg-red-50 text-[#c1121f] border-red-200'
                          : 'bg-slate-100 text-[#0b2545] border-slate-200'
                      }`}>
                        #{String(doc.nro_oficio).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="py-3.5 px-space-sm font-label-code text-label-code text-on-surface-variant font-semibold">
                      {doc.gestion}
                    </td>
                    <td className="py-3.5 px-space-sm font-mono text-xs text-on-surface-variant">
                      {doc.fecha}
                    </td>
                    <td className="py-3.5 px-space-md">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface group-hover:text-[#0b2545] transition-colors">
                          {doc.asunto}
                        </span>
                        {doc.descripcion && (
                          <span className="font-caption text-caption text-on-surface-variant line-clamp-1">
                            {doc.descripcion}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md font-semibold text-[#0b2545]">
                      {doc.destinatario}
                    </td>
                    <td className="py-3.5 px-space-sm">
                      {getStatusBadge(doc.estado)}
                    </td>
                    <td className="py-3.5 px-space-md">
                      {doc.archivo_path ? (
                        <button 
                          onClick={() => downloadFile(`/expedidos/${doc.id}/download`, doc.nombre_archivo || 'oficio.pdf')}
                          className="inline-flex items-center gap-1.5 text-[#0b2545] hover:text-[#c1121f] font-body-sm text-body-sm font-bold transition-colors cursor-pointer"
                          title="Descargar o abrir escaneo digital"
                          type="button"
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
                          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-[#c1121f] transition-colors cursor-pointer" 
                          title="Editar oficio"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id, doc.nro_oficio)}
                          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-[#c1121f] transition-colors cursor-pointer" 
                          title="Eliminar oficio"
                          type="button"
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
        <div className="p-space-md bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-slate-200/60">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Mostrando <span className="font-bold text-[#0b2545]">{totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, totalItems)}</span> de <span className="font-bold text-[#0b2545]">{totalItems}</span> oficios registrados
          </span>
          
          {/* Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg font-body-sm text-body-sm font-bold transition-colors cursor-pointer ${
                  currentPage === page 
                    ? 'bg-[#0b2545] text-white shadow-xs' 
                    : 'text-on-surface hover:bg-surface-container-high'
                }`}
                type="button"
              >
                {page}
              </button>
            ))}

            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Legend Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-md border border-surface-container">
        <div className="flex items-center gap-space-xs text-[#0b2545] font-caption text-caption uppercase tracking-wider font-bold">
          <span className="material-symbols-outlined text-base text-[#c1121f]">policy</span>
          <span>Normativa y Estados Oficiales:</span>
        </div>
        <div className="flex flex-wrap items-center gap-space-lg font-body-sm text-body-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              Completado
            </span>
            <span className="text-on-surface-variant font-caption text-caption">Trámite concluido / archivado</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <span className="material-symbols-outlined text-xs">sync</span>
              En curso
            </span>
            <span className="text-on-surface-variant font-caption text-caption">En revisión / tratamiento</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#c1121f] border border-red-200">
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
          className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-3 sm:p-5 pt-16 sm:pt-20 pb-12 bg-black/60 backdrop-blur-md transition-all duration-300" 
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div 
            aria-labelledby="modal-title" 
            aria-modal="true" 
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#c5a059]/40 overflow-hidden transform transition-all flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4" 
            onClick={(e) => e.stopPropagation()} 
            role="dialog"
          >
            {/* Modal Top Branding Bar (Navy Blue Gradient) */}
            <div className="bg-gradient-to-r from-[#07162b] via-[#0b2545] to-[#134074] px-6 py-4 border-b border-[#c5a059]/30 flex items-center justify-between text-white relative shrink-0">
              <div className="flex items-center space-x-3 z-10">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#c5a059] shadow-inner">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-institutional-serif text-base font-bold tracking-wide text-white" id="modal-title">
                      {editingId ? 'Modificar Oficio Expedido' : 'Registro de Nuevo Oficio'}
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#c1121f] text-white border border-white/20 tracking-wider">
                      GESTIÓN {gestion}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70">Dirección de Ingeniería de Sistemas — FINI UAGRM</p>
                </div>
              </div>

              {/* Close Button */}
              <button 
                aria-label="Cerrar modal" 
                className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl border border-white/10 transition-all duration-150 cursor-pointer" 
                onClick={() => !submitting && setIsModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base leading-none block">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-white">
              {/* Correlative Assigned Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0b2545] text-[#c5a059] flex items-center justify-center text-lg shadow-md shrink-0 font-bold font-mono">
                      #
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        {editingId ? 'Oficio Registrado' : 'Correlativo Asignado'}
                      </span>
                      <span className="text-xl font-label-code font-bold text-[#0b2545] tracking-tight">
                        Oficio N.° {editingId ? String(formData.nro_oficio || editingId).padStart(2, '0') : String(nextNumber).padStart(2, '0')}{' '}
                        <span className="text-[#c1121f]">/</span> {gestion}
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center self-start sm:self-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="material-symbols-outlined text-xs text-emerald-600">lock</span>
                    <span>Consecutivo Legal</span>
                  </div>
                </div>
              </div>

              {/* Main Form Elements */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Field: Destinatario with quick suggestions chips */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1" htmlFor="destinatario-input">
                      Destinatario <span className="text-[#c1121f]">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Autoridad o Unidad</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-lg">corporate_fare</span>
                    </div>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0b2545] focus:ring-2 focus:ring-[#0b2545]/20 transition-all outline-none" 
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
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors font-semibold cursor-pointer ${
                          formData.destinatario === item
                            ? 'bg-[#0b2545] text-white border-[#0b2545]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
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
                    Asunto Principal <span className="text-[#c1121f]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0b2545] focus:ring-2 focus:ring-[#0b2545]/20 transition-all outline-none" 
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
                      Fecha de Emisión <span className="text-[#c1121f]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0b2545]">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                      </div>
                      <input 
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-[#0b2545] focus:ring-2 focus:ring-[#0b2545]/20 transition-all outline-none" 
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
                      Estado del Trámite <span className="text-[#c1121f]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </div>
                      <select 
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#0b2545] focus:ring-2 focus:ring-[#0b2545]/20 transition-all outline-none appearance-none cursor-pointer" 
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0b2545] focus:ring-2 focus:ring-[#0b2545]/20 transition-all outline-none resize-none" 
                    id="resumen-textarea" 
                    placeholder="Descripción adicional del documento remitido, antecedentes, códigos de seguimiento o referencias anexas..." 
                    rows="3"
                    maxLength={500}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  ></textarea>
                </div>

                {/* Field: Digitalización con FileDropzone */}
                <div>
                  <FileDropzone
                    file={formData.archivo}
                    onFileChange={(file) => setFormData({ ...formData, archivo: file })}
                    label="Digitalización (PDF Opcional)"
                    hint="PDF/A hasta 25 MB"
                  />
                </div>

                {/* Institutional Trust Badge */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
                  <span className="material-symbols-outlined text-amber-600 mt-0.5 text-base">shield</span>
                  <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                    Al confirmar, este oficio se registrará en el libro digital de correspondencia de la <b>UAGRM - Sede Ichilo</b> con folio legal único <b>#{editingId ? String(formData.nro_oficio || editingId).padStart(2, '0') : String(nextNumber).padStart(2, '0')}</b>.
                  </p>
                </div>

                {/* Modal Footer */}
                <footer className="pt-4 border-t border-slate-200 flex items-center justify-between gap-space-sm">
                  <button 
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider transition cursor-pointer" 
                    disabled={submitting}
                    onClick={() => setIsModalOpen(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button 
                    className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#c1121f] to-[#9e0c18] hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 border border-white/20" 
                    disabled={submitting}
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-base">
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

export default Expedidos;
