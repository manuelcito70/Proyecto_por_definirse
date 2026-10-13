import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { getActas, createActa, deleteActa, downloadFile } from '../services/api';
import './Modules.css';

const MODALIDADES = [
  { id: 'excelencia', label: 'Excelencia académica', tipo: 'directa' },
  { id: 'buen_rendimiento', label: 'Buen rendimiento', tipo: 'directa' },
  { id: 'buen_desempeno', label: 'Buen desempeño', tipo: 'directa' },
  { id: 'tesis', label: 'Tesis de grado', tipo: 'grl' },
  { id: 'trabajo_dirigido', label: 'Trabajo dirigido', tipo: 'grl' },
  { id: 'examen_grado', label: 'Examen de grado', tipo: 'grl' },
  { id: 'proyecto_grado', label: 'Proyecto de grado', tipo: 'grl' },
  { id: 'titulacion_continua', label: 'Titulación vía continua', tipo: 'continua' }
];

const Actas = () => {
  const { gestion } = useGestion();
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getActas({
        gestion,
        busqueda: busqueda || undefined,
        modalidad: modalidadSeleccionada || undefined
      });
      setActas(list);
    } catch (err) {
      console.error('Error cargando actas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion, modalidadSeleccionada]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenModal = () => {
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
  };

  const handleSubmit = async (e) => {
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

      await createActa(data);
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Error al registrar acta: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el acta de ${nombre}?`)) return;
    try {
      await deleteActa(id);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const getModalidadLabel = (modId) => {
    const found = MODALIDADES.find(m => m.id === modId);
    return found ? found.label : modId;
  };

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Actas de graduación</h2>
            <p className="module-subtitle">Registro de actas oficiales emitidas por CPD y resguardo de copias digitales por estudiante.</p>
          </div>
          <button className="btn-primary" onClick={handleOpenModal}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            + Registrar acta
          </button>
        </div>
      </div>

      <div className="info-banner">
        <span>ARCHIVO Y RESGUARDO DOCUMENTAL · Gestión {gestion}</span>
        <span style={{ color: 'var(--text-muted)' }}>{actas.length} actas registradas</span>
      </div>

      <div className="info-box" style={{ padding: '15px 20px', background: 'var(--surface-success)' }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#166534" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
          El número y código oficial único son asignados por el CPD. Dirección los registra tal como se reciben para que si el graduado pierde su físico para el título, se imprima o recupere digitalmente de inmediato.
        </p>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-container">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por estudiante, CI, registro o código CPD... (Enter)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </form>

        <button 
          className="btn-secondary"
          onClick={() => { setModalidadSeleccionada(''); setBusqueda(''); }}
          style={{ whiteSpace: 'nowrap' }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* FILTER PILLS */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
          FILTRAR POR MODALIDAD DE TITULACIÓN
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span 
            className={`filter-pill ${modalidadSeleccionada === '' ? 'active' : ''}`}
            onClick={() => setModalidadSeleccionada('')}
          >
            Todas ({actas.length})
          </span>
          {MODALIDADES.map((m) => (
            <span
              key={m.id}
              className={`filter-pill ${modalidadSeleccionada === m.id ? 'active' : ''}`}
              onClick={() => setModalidadSeleccionada(m.id)}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="minimal-table-container">
        <table className="minimal-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>ACTA CPD</th>
              <th>ESTUDIANTE</th>
              <th style={{ width: '120px' }}>REGISTRO</th>
              <th style={{ width: '100px' }}>CI</th>
              <th>MODALIDAD</th>
              <th style={{ width: '80px' }}>NOTA</th>
              <th>COPIA DIGITAL</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Cargando actas...
                </td>
              </tr>
            ) : actas.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <p>No se encontraron actas de graduación para los criterios seleccionados en {gestion}.</p>
                  <button className="btn-secondary" onClick={handleOpenModal} style={{ marginTop: '10px' }}>
                    Registrar acta
                  </button>
                </td>
              </tr>
            ) : (
              actas.map((acta) => (
                <tr key={acta.id}>
                  <td>
                    <span className="cell-bold">#{acta.nro_acta}</span>
                    {acta.codigo_cpd && <span className="cell-subtitle">{acta.codigo_cpd}</span>}
                  </td>
                  <td>
                    <span className="cell-bold">{acta.nombre_estudiante}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{acta.nro_registro || '-'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{acta.ci || '-'}</span>
                  </td>
                  <td>
                    <span style={{
                      background: 'var(--surface-alt)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      border: '1px solid var(--border-color)'
                    }}>
                      {getModalidadLabel(acta.modalidad)}
                    </span>
                  </td>
                  <td className="cell-bold" style={{ color: acta.nota >= 90 ? '#166534' : 'inherit' }}>
                    {acta.nota ? acta.nota : '-'}
                  </td>
                  <td>
                    {acta.archivo_path ? (
                      <button 
                        onClick={() => downloadFile(`/actas/${acta.id}/download`, acta.nombre_archivo || 'acta.pdf')}
                        className="action-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Ver o descargar acta"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Descargar acta ↗
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin PDF adjunto</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(acta.id, acta.nombre_estudiante)}
                      className="btn-danger-outline"
                      title="Eliminar acta"
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
          <span>{actas.length} actas en gestión {gestion}</span>
          <div className="pagination">
            <span>Gestión activa: {gestion}</span>
          </div>
        </div>
      </div>

      {/* MODAL REGISTRAR NUEVA ACTA */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Registrar Acta de Graduación</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => !submitting && setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">N.º de Acta Oficial *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. 084"
                      value={formData.nro_acta}
                      onChange={(e) => setFormData({ ...formData, nro_acta: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Código único CPD</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. CPD-EJ-084"
                      value={formData.codigo_cpd}
                      onChange={(e) => setFormData({ ...formData, codigo_cpd: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre y Apellido del Estudiante *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Maria Fernanda Rojas Pérez"
                    value={formData.nombre_estudiante}
                    onChange={(e) => setFormData({ ...formData, nombre_estudiante: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">N.º de Registro universitario</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. 219045812 o EJ-20418"
                      value={formData.nro_registro}
                      onChange={(e) => setFormData({ ...formData, nro_registro: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cédula de Identidad (CI)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. 8472910 SC"
                      value={formData.ci}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Modalidad de titulación *</label>
                    <select 
                      className="form-select"
                      value={formData.modalidad}
                      onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                      required
                    >
                      <optgroup label="Graduación Directa">
                        <option value="excelencia">Excelencia académica</option>
                        <option value="buen_rendimiento">Buen rendimiento</option>
                        <option value="buen_desempeno">Buen desempeño</option>
                      </optgroup>
                      <optgroup label="GRL001 (Modalidad con Tribunal)">
                        <option value="tesis">Tesis de grado</option>
                        <option value="trabajo_dirigido">Trabajo dirigido</option>
                        <option value="examen_grado">Examen de grado</option>
                        <option value="proyecto_grado">Proyecto de grado</option>
                      </optgroup>
                      <optgroup label="Otros">
                        <option value="titulacion_continua">Titulación vía continua (Diplomado)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nota de graduación</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="51" 
                      max="100" 
                      className="form-input" 
                      placeholder="Ej. 95"
                      value={formData.nota}
                      onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cargar copia digital del acta (PDF)</label>
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
                  {submitting ? 'Guardando...' : 'Registrar acta oficial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actas;
