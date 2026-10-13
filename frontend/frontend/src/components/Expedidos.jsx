import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { getExpedidos, getNextExpedidoNumber, createExpedido, deleteExpedido, downloadFile } from '../services/api';
import './Modules.css';

const Expedidos = () => {
  const { gestion } = useGestion();
  const [expedidos, setExpedidos] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
          estado: filterEstado !== 'todos' ? filterEstado : undefined
        }),
        getNextExpedidoNumber(gestion)
      ]);
      setExpedidos(list);
      setNextNumber(nextData.next);
    } catch (err) {
      console.error('Error cargando expedidos:', err);
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
      destinatario: '',
      asunto: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'completado',
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

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'completado':
        return <span className="status-dot status-green">Completado</span>;
      case 'en_curso':
        return <span className="status-dot status-yellow">En curso</span>;
      case 'pendiente':
      default:
        return <span className="status-dot status-red">Pendiente</span>;
    }
  };

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Documentos expedidos</h2>
            <p className="module-subtitle">Oficios elaborados en dirección y remitidos a otras oficinas.</p>
          </div>
          <button className="btn-primary" onClick={handleOpenModal}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            + Nuevo oficio
          </button>
        </div>
      </div>

      <div className="info-banner">
        <span>ARCHIVADO OFICIAL · Gestión {gestion} · Correlativo estricto y único por año.</span>
        <span style={{ color: 'var(--text-muted)' }}>{expedidos.length} oficios registrados</span>
      </div>

      <div className="info-box">
        <div className="big-number">{String(nextNumber).padStart(2, '0')}</div>
        <div className="info-text">
          <h4>Siguiente oficio · Gestión {gestion}</h4>
          <p>Asignación automática y secuencial. Último expedido: {nextNumber > 1 ? nextNumber - 1 : 'Ninguno'}.</p>
        </div>
        <div className="info-extra">
          <h5>Cierre de gestión {gestion - 1}</h5>
          <p>La numeración histórica se conserva de forma independiente.</p>
        </div>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-container">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por asunto, destinatario o descripción... (Enter)" 
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
          <option value="completado">Completado (Verde)</option>
          <option value="en_curso">En curso (Amarillo)</option>
          <option value="pendiente">Pendiente (Rojo)</option>
        </select>
      </div>

      <div className="minimal-table-container">
        <table className="minimal-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>OFICIO</th>
              <th style={{ width: '90px' }}>GESTIÓN</th>
              <th style={{ width: '110px' }}>FECHA</th>
              <th>ASUNTO</th>
              <th>DESTINATARIO</th>
              <th>ESTADO</th>
              <th>DOCUMENTO</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Cargando expedidos...
                </td>
              </tr>
            ) : expedidos.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <p>No se encontraron oficios expedidos en la gestión {gestion}.</p>
                  <button className="btn-secondary" onClick={handleOpenModal} style={{ marginTop: '10px' }}>
                    Registrar el primero
                  </button>
                </td>
              </tr>
            ) : (
              expedidos.map((doc) => (
                <tr key={doc.id}>
                  <td className="cell-bold">#{String(doc.nro_oficio).padStart(2, '0')}</td>
                  <td>{doc.gestion}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doc.fecha}</td>
                  <td>
                    <span className="cell-bold">{doc.asunto}</span>
                    {doc.descripcion && <span className="cell-subtitle">{doc.descripcion}</span>}
                  </td>
                  <td>
                    <span className="cell-bold">{doc.destinatario}</span>
                  </td>
                  <td>{getStatusBadge(doc.estado)}</td>
                  <td>
                    {doc.archivo_path ? (
                      <button 
                        onClick={() => downloadFile(`/expedidos/${doc.id}/download`, doc.nombre_archivo)} 
                        className="action-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={doc.nombre_archivo}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Descargar PDF ↗
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin archivo</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(doc.id, doc.nro_oficio)}
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
          <span>{expedidos.length} registros en gestión {gestion}</span>
          <div className="pagination">
            <span>Gestión activa: {gestion}</span>
          </div>
        </div>
      </div>

      {/* MODAL REGISTRAR NUEVO OFICIO */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Registrar Nuevo Oficio Expedido</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => !submitting && setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '4px', fontSize: '0.85rem', color: '#166534', border: '1px solid #bbf7d0' }}>
                  ℹ️ Se asignará automáticamente el número correlativo: <strong>#{String(nextNumber).padStart(2, '0')}</strong> para la gestión <strong>{gestion}</strong>.
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Destinatario *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. CPD, Decanato, Consejo Facultativo"
                      value={formData.destinatario}
                      onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha de emisión</label>
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
                  <label className="form-label">Asunto del oficio *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Acta de graduación, Ratificación de auxiliares..."
                    value={formData.asunto}
                    onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción o notas adicionales</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Detalles sobre el trámite, resolución o expediente..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado del trámite</label>
                  <select 
                    className="form-select"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="completado">🟢 Completado (Proceso cerrado/enviado)</option>
                    <option value="en_curso">🟡 En curso (Espera de tratamiento en consejo)</option>
                    <option value="pendiente">🔴 Pendiente (Requiere seguimiento)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjuntar copia digital (PDF o escaneo)</label>
                  <div className="form-file-container">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] || null })}
                    />
                    {formData.archivo && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#166534', fontWeight: 500 }}>
                        ✓ Archivo seleccionado: {formData.archivo.name}
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
                  {submitting ? 'Guardando...' : 'Guardar y expedir oficio'}
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
