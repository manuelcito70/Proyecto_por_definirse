import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { getRecibidos, createRecibido, updateRecibido, deleteRecibido, downloadFile } from '../services/api';
import './Modules.css';

const Recibidos = () => {
  const { gestion } = useGestion();
  const [recibidos, setRecibidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    remitente: '',
    asunto: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'pendiente',
    tipo_respuesta: 'requiere_respuesta',
    archivo: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getRecibidos({
        gestion,
        busqueda: busqueda || undefined,
        estado: filterEstado !== 'todos' ? filterEstado : undefined
      });
      setRecibidos(list);
    } catch (err) {
      console.error('Error cargando recibidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion, filterEstado]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenModal = () => {
    setFormData({
      remitente: '',
      asunto: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
      tipo_respuesta: 'requiere_respuesta',
      archivo: null
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.remitente || !formData.asunto) {
      alert('Por favor complete remitente y asunto.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('remitente', formData.remitente);
      data.append('asunto', formData.asunto);
      data.append('descripcion', formData.descripcion || '');
      data.append('fecha', formData.fecha);
      data.append('estado', formData.estado);
      data.append('tipo_respuesta', formData.tipo_respuesta);
      if (formData.archivo) {
        data.append('archivo', formData.archivo);
      }

      await createRecibido(data);
      setIsModalOpen(false);
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
      fetchData();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const handleDelete = async (id, nro) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro recibido N.º ${nro}?`)) return;
    try {
      await deleteRecibido(id);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const pendientesCount = recibidos.filter(d => d.estado === 'pendiente').length;

  const getStatusBadge = (doc) => {
    switch (doc.estado) {
      case 'completado':
        return <span className="status-dot status-green">Respondido / Listo</span>;
      case 'en_curso':
        return <span className="status-dot status-yellow">En curso</span>;
      case 'pendiente':
      default:
        return (
          <span className="status-dot status-red" title="Requiere respuesta de Dirección">
            Requiere respuesta
          </span>
        );
    }
  };

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Documentos recibidos</h2>
            <p className="module-subtitle">Documentación externa recibida en dirección, escaneos y seguimiento de respuestas.</p>
          </div>
          <button className="btn-primary" onClick={handleOpenModal}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            + Registrar recibido
          </button>
        </div>
      </div>

      <div className="info-banner">
        <span>ARCHIVADO OFICIAL · Gestión {gestion} · Numeración independiente por año.</span>
        <span style={{ color: 'var(--text-muted)' }}>{recibidos.length} documentos recibidos</span>
      </div>

      {pendientesCount > 0 ? (
        <div className="info-box" style={{ padding: '15px 20px', background: '#fee2e2', border: '1px solid #fecaca' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#991b1b" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#991b1b', fontSize: '0.9rem' }}>
              Atención: Tienes {pendientesCount} documento(s) con respuesta pendiente en gestión {gestion}
            </strong>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#7f1d1d' }}>
              Los documentos en rojo requieren que la dirección emita un oficio o informe de respuesta. Al completarlos, puedes marcarlos como respondidos.
            </p>
          </div>
        </div>
      ) : (
        <div className="info-box" style={{ padding: '15px 20px', background: 'var(--surface-success)' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#166534" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="9 11 12 14 22 4"></polyline>
          </svg>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
            Todo al día: No hay solicitudes pendientes de respuesta en la gestión {gestion}. El archivo escaneado original se resguarda íntegro para consulta y descarga.
          </p>
        </div>
      )}

      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-container">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por remitente, asunto o correlativo... (Enter)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </form>

        <select 
          className="filter-select"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Requiere respuesta (Rojo)</option>
          <option value="en_curso">En curso (Amarillo)</option>
          <option value="completado">Respondido / Listo (Verde)</option>
        </select>
      </div>

      <div className="minimal-table-container">
        <table className="minimal-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>INTERNO</th>
              <th style={{ width: '100px' }}>FECHA</th>
              <th>REMITENTE</th>
              <th>ASUNTO</th>
              <th>ESTADO</th>
              <th>ESCANEO</th>
              <th style={{ width: '140px' }}>ACCIÓN RÁPIDA</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Cargando recibidos...
                </td>
              </tr>
            ) : recibidos.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <p>No se encontraron documentos recibidos en la gestión {gestion}.</p>
                  <button className="btn-secondary" onClick={handleOpenModal} style={{ marginTop: '10px' }}>
                    Registrar el primero
                  </button>
                </td>
              </tr>
            ) : (
              recibidos.map((doc) => (
                <tr key={doc.id} style={{ background: doc.estado === 'pendiente' ? 'rgba(254, 242, 242, 0.4)' : 'transparent' }}>
                  <td className="cell-bold">#{String(doc.nro_recibido).padStart(3, '0')}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doc.fecha}</td>
                  <td>
                    <span className="cell-bold">{doc.remitente}</span>
                    <span className="cell-subtitle">
                      {doc.tipo_respuesta === 'requiere_respuesta' ? '🔴 Requiere respuesta' : '🟢 Informativo'}
                    </span>
                  </td>
                  <td>
                    <span className="cell-bold">{doc.asunto}</span>
                    {doc.descripcion && <span className="cell-subtitle">{doc.descripcion}</span>}
                  </td>
                  <td>{getStatusBadge(doc)}</td>
                  <td>
                    {doc.archivo_path ? (
                      <button 
                        onClick={() => downloadFile(`/recibidos/${doc.id}/download`, doc.nombre_archivo)} 
                        className="action-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Ver o descargar escaneo"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Ver escaneo ↗
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin escaneo</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleEstado(doc)}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '5px 10px', whiteSpace: 'nowrap' }}
                      title="Cambiar estado del trámite"
                    >
                      {doc.estado === 'completado' ? 'Reabrir ↺' : '✓ Respondido'}
                    </button>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(doc.id, doc.nro_recibido)}
                      className="btn-danger-outline"
                      title="Eliminar registro"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="table-footer">
          <span>{recibidos.length} registros en gestión {gestion}</span>
          <div className="pagination">
            <span>Gestión activa: {gestion}</span>
          </div>
        </div>
      </div>

      {/* MODAL REGISTRAR NUEVO RECIBIDO */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Registrar Documento Recibido</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => !submitting && setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                  📋 Se asignará automáticamente el correlativo correlacionado a la gestión <strong>{gestion}</strong>.
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Remitente / Entidad *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. Decanato, CPD, Consejo Facultativo, Rectorado..."
                      value={formData.remitente}
                      onChange={(e) => setFormData({ ...formData, remitente: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha de recepción</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Asunto del documento *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Solicitud de informe de actividades, Invitación..."
                    value={formData.asunto}
                    onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo de documento</label>
                    <select 
                      className="form-select"
                      value={formData.tipo_respuesta}
                      onChange={(e) => setFormData({ ...formData, tipo_respuesta: e.target.value })}
                    >
                      <option value="requiere_respuesta">Requiere respuesta (Informe/Trámite)</option>
                      <option value="para_conocimiento">Para conocimiento (Solo informativo/Invitación)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado inicial</label>
                    <select 
                      className="form-select"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="pendiente">🔴 Pendiente (Requiere respuesta)</option>
                      <option value="en_curso">🟡 En curso (En proceso)</option>
                      <option value="completado">🟢 Respondido / Concluido</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción o notas de recepción</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Observaciones de ingreso, plazos para responder..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cargar escaneo (PDF o imagen escaneada)</label>
                  <div className="form-file-container">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] || null })}
                    />
                    {formData.archivo && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#166534', fontWeight: 500 }}>
                        ✓ Escaneo seleccionado: {formData.archivo.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Registrar recibido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recibidos;
