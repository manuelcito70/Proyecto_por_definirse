import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { getAuxiliares, createAuxiliar, deleteAuxiliar } from '../services/api';
import './Modules.css';

const Auxiliares = () => {
  const { gestion } = useGestion();
  const [auxiliares, setAuxiliares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [semestre, setSemestre] = useState('todos');
  const [estado, setEstado] = useState('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    nro_registro: '',
    materia: '',
    semestre: '1',
    nota_examen: '',
    estado: 'aprobado',
    nro_convocatoria: `CONV-01/${gestion}`,
    es_ratificacion: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getAuxiliares({
        gestion,
        semestre: semestre !== 'todos' ? parseInt(semestre) : undefined,
        estado: estado !== 'todos' ? estado : undefined,
        busqueda: busqueda || undefined
      });
      setAuxiliares(list);
    } catch (err) {
      console.error('Error cargando auxiliares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion, semestre, estado]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenModal = () => {
    setFormData({
      nombre: '',
      nro_registro: '',
      materia: '',
      semestre: '1',
      nota_examen: '',
      estado: 'aprobado',
      nro_convocatoria: `CONV-01/${gestion}`,
      es_ratificacion: false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.materia) {
      alert('Por favor complete el nombre del auxiliar y la materia.');
      return;
    }

    try {
      setSubmitting(true);
      await createAuxiliar({
        ...formData,
        gestion,
        semestre: parseInt(formData.semestre),
        nota_examen: formData.nota_examen ? parseFloat(formData.nota_examen) : null
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Error al registrar auxiliar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de ${nombre}?`)) return;
    try {
      await deleteAuxiliar(id);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handlePrintCertificado = (aux) => {
    const vent = window.open('', '_blank');
    vent.document.write(`
      <html>
        <head>
          <title>Constancia de Auxiliatura - ${aux.nombre}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 20px; margin-bottom: 30px; }
            .header h2 { margin: 0; color: #991b1b; font-size: 1.4rem; }
            .header h4 { margin: 5px 0 0 0; color: #475569; font-weight: normal; }
            .content { line-height: 1.8; font-size: 1.05rem; }
            .badge { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
            .footer { margin-top: 80px; text-align: center; display: flex; justify-content: space-around; }
            .signature { border-top: 1px solid #94a3b8; width: 220px; padding-top: 8px; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h2>
            <h4>FACULTAD INTEGRAL DEL NORTE (FINI) · DIRECCIÓN DE CARRERA</h4>
            <p style="font-weight: bold; margin-top: 10px;">CERTIFICACIÓN DE AUXILIATURA DE CÁTEDRA</p>
          </div>
          <div class="content">
            <p>La Dirección de Carrera de Ingeniería de Sistemas de la Facultad Integral del Norte hace constar que:</p>
            <p style="text-align: center; font-size: 1.3rem; font-weight: bold; color: #0f172a; margin: 20px 0;">
              ${aux.nombre}
            </p>
            <p>Con Registro Universitario <strong>${aux.nro_registro || 'En trámite'}</strong>, se desempeñó como <strong>AUXILIAR DE CÁTEDRA</strong> en la materia:</p>
            <p style="text-align: center; font-size: 1.2rem; font-weight: bold; color: #991b1b;">
              ${aux.materia}
            </p>
            <p>Durante la <strong>Gestión Académica ${aux.gestion}</strong> (Semestre ${aux.semestre === 1 ? 'I' : 'II'}), habiendo obtenido la nota de examen de <strong>${aux.nota_examen || 'Aprobado'} puntos</strong> bajo la modalidad de ${aux.es_ratificacion ? 'Ratificación de segundo semestre' : 'Convocatoria y examen oficial de méritos'}.</p>
            <p>Se extiende la presente certificación a solicitud del interesado para los fines laborales y académicos que convengan.</p>
          </div>
          <div class="footer">
            <div class="signature">
              Directora de Carrera<br/>
              <strong>Ing. Alicia Serrano Rodríguez</strong>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Auxiliares de cátedra</h2>
            <p className="module-subtitle">Registro de convocatorias, designaciones, notas e historial por semestre.</p>
          </div>
          <button className="btn-primary" onClick={handleOpenModal}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            + Registrar auxiliar
          </button>
        </div>
      </div>

      <div className="info-banner">
        <span>CONTROL DE AUXILIATURAS · Gestión {gestion} · Histórico permanente para constancias laborales</span>
        <span style={{ color: 'var(--text-muted)' }}>{auxiliares.length} auxiliares registrados</span>
      </div>

      {/* Ruta de Aprobación */}
      <div className="info-box" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>FLUJO INSTITUCIONAL DE AUXILIATURAS</div>
        <div style={{ display: 'flex', gap: '30px', color: '#166534', fontSize: '0.85rem', fontWeight: 500, flexWrap: 'wrap' }}>
          <span><strong style={{ fontSize: '1.1rem', marginRight: '4px' }}>01</strong> Dirección lanza propuesta</span>
          <span style={{ color: 'var(--text-muted)' }}><strong style={{ fontSize: '1.1rem', marginRight: '4px' }}>02</strong> Consejo de Carrera aprueba cupos</span>
          <span style={{ color: 'var(--text-muted)' }}><strong style={{ fontSize: '1.1rem', marginRight: '4px' }}>03</strong> Examen y ratificación 2º semestre</span>
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
            placeholder="Buscar por auxiliar, registro o materia... (Enter)" 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </form>

        <select 
          className="filter-select"
          value={semestre}
          onChange={(e) => setSemestre(e.target.value)}
        >
          <option value="todos">Todos los semestres</option>
          <option value="1">Semestre I</option>
          <option value="2">Semestre II</option>
        </select>

        <select 
          className="filter-select"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="aprobado">Aprobado / Designado</option>
          <option value="pendiente">Pendiente</option>
          <option value="reprobado">Rechazado</option>
        </select>
      </div>

      <div className="minimal-table-container">
        <table className="minimal-table">
          <thead>
            <tr>
              <th>AUXILIAR</th>
              <th style={{ width: '120px' }}>REGISTRO</th>
              <th>MATERIA / CÁTEDRA</th>
              <th style={{ width: '110px' }}>SEMESTRE</th>
              <th style={{ width: '90px' }}>NOTA</th>
              <th>TIPO</th>
              <th>ESTADO</th>
              <th style={{ width: '130px' }}>CONSTANCIA</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Cargando auxiliares...
                </td>
              </tr>
            ) : auxiliares.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  <p>No se encontraron auxiliares para la gestión {gestion}.</p>
                  <button className="btn-secondary" onClick={handleOpenModal} style={{ marginTop: '10px' }}>
                    Registrar el primero
                  </button>
                </td>
              </tr>
            ) : (
              auxiliares.map((aux) => (
                <tr key={aux.id}>
                  <td>
                    <span className="cell-bold">{aux.nombre}</span>
                    {aux.nro_convocatoria && <span className="cell-subtitle">{aux.nro_convocatoria}</span>}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{aux.nro_registro || '-'}</span>
                  </td>
                  <td>
                    <span className="cell-bold">{aux.materia}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>Semestre {aux.semestre === 1 ? 'I' : 'II'}</span>
                  </td>
                  <td className="cell-bold" style={{ color: aux.nota_examen >= 70 ? '#166534' : 'inherit' }}>
                    {aux.nota_examen ? aux.nota_examen : '-'}
                  </td>
                  <td>
                    {aux.es_ratificacion ? (
                      <span className="status-dot status-green" style={{ fontSize: '0.78rem' }}>Ratificación</span>
                    ) : (
                      <span className="status-dot" style={{ fontSize: '0.78rem' }}>Convocatoria</span>
                    )}
                  </td>
                  <td>
                    {aux.estado === 'aprobado' ? (
                      <span className="status-dot status-green">Designado</span>
                    ) : aux.estado === 'reprobado' ? (
                      <span className="status-dot status-red">Rechazado</span>
                    ) : (
                      <span className="status-dot status-yellow">Propuesta</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => handlePrintCertificado(aux)}
                      className="action-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Emitir constancia de trabajo para el auxiliar"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                      </svg>
                      Certificar ↗
                    </button>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(aux.id, aux.nombre)}
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
          <span>{auxiliares.length} auxiliares registrados en gestión {gestion}</span>
          <div className="pagination">
            <span>Gestión activa: {gestion}</span>
          </div>
        </div>
      </div>

      {/* MODAL REGISTRAR NUEVO AUXILIAR */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Registrar Auxiliar de Cátedra</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => !submitting && setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre y Apellido del Estudiante *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Victor Daniel Guayao"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Registro Universitario</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. 219045812"
                      value={formData.nro_registro}
                      onChange={(e) => setFormData({ ...formData, nro_registro: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semestre</label>
                    <select 
                      className="form-select"
                      value={formData.semestre}
                      onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                    >
                      <option value="1">Semestre I</option>
                      <option value="2">Semestre II</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Materia / Cátedra *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. Estructuras Discretas, Cálculo I..."
                      value={formData.materia}
                      onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nota de Examen / Concurso</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="100" 
                      className="form-input" 
                      placeholder="Ej. 85.5"
                      value={formData.nota_examen}
                      onChange={(e) => setFormData({ ...formData, nota_examen: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">N.º de Convocatoria u Oficio</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. CONV-01/2026"
                      value={formData.nro_convocatoria}
                      onChange={(e) => setFormData({ ...formData, nro_convocatoria: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado de la Designación</label>
                    <select 
                      className="form-select"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="aprobado">🟢 Aprobado / Designado</option>
                      <option value="pendiente">🟡 Propuesta en Consejo</option>
                      <option value="reprobado">🔴 Rechazado / Sin cupo</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--surface-alt)', borderRadius: '4px' }}>
                  <input 
                    type="checkbox" 
                    id="es_ratificacion"
                    checked={formData.es_ratificacion}
                    onChange={(e) => setFormData({ ...formData, es_ratificacion: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="es_ratificacion" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    <strong>¿Es ratificación para el segundo semestre?</strong> (No requirió nuevo examen)
                  </label>
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
                  {submitting ? 'Guardando...' : 'Registrar auxiliar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auxiliares;
