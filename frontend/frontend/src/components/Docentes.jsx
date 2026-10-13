import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { 
  getDocentes, 
  createDocente, 
  getDocenteArchivos, 
  uploadDocenteArchivo, 
  deleteDocenteArchivo,
  downloadFile 
} from '../services/api';
import './Modules.css';

const TIPOS_DOC = {
  curriculum: 'Hoja de vida / Currículum vitae',
  programa_analitico: 'Programa analítico archivado',
  informe_final: 'Informe final de cátedra',
  lista_asistencia: 'Lista de asistencia',
  informe_cathedra: 'Informe de avance',
  otro: 'Otro documento académico'
};

const Docentes = () => {
  const { gestion } = useGestion();
  const [docentes, setDocentes] = useState([]);
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

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
    semestre: '1',
    archivo: null
  });

  const fetchDocentes = async () => {
    try {
      setLoading(true);
      const list = await getDocentes({ busqueda: busqueda || undefined });
      setDocentes(list);
      if (list.length > 0 && (!selectedDocente || !list.find(d => d.id === selectedDocente.id))) {
        setSelectedDocente(list[0]);
      }
    } catch (err) {
      console.error('Error cargando docentes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivos = async (docenteId) => {
    if (!docenteId) return;
    try {
      setLoadingArchivos(true);
      const docs = await getDocenteArchivos(docenteId);
      setArchivos(docs);
    } catch (err) {
      console.error('Error cargando archivos del docente:', err);
    } finally {
      setLoadingArchivos(false);
    }
  };

  useEffect(() => {
    fetchDocentes();
  }, [busqueda]);

  useEffect(() => {
    if (selectedDocente) {
      fetchArchivos(selectedDocente.id);
    } else {
      setArchivos([]);
    }
  }, [selectedDocente]);

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
      setIsDocenteModalOpen(false);
      await fetchDocentes();
      setSelectedDocente(nuevo);
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

  const cvArchivo = archivos.find(a => a.tipo === 'curriculum');

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Docentes</h2>
            <p className="module-subtitle">Expedientes individuales y documentación académica por gestión y semestre.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setIsDocenteModalOpen(true)}>
              + Nuevo docente
            </button>
            <button 
              className="btn-primary" 
              onClick={() => {
                setArchivoForm({
                  tipo: 'informe_final',
                  gestion: gestion,
                  semestre: '1',
                  archivo: null
                });
                setIsArchivoModalOpen(true);
              }}
              disabled={!selectedDocente}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              + Cargar documento al expediente
            </button>
          </div>
        </div>
      </div>

      <div className="info-banner">
        <span>ARCHIVADO DIGITAL · Resguardo oficial de hojas de vida, informes de cátedra y listas de asistencia.</span>
        <span style={{ color: 'var(--text-muted)' }}>{docentes.length} docentes registrados</span>
      </div>

      <div className="filters-bar">
        <div className="search-input-container">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por nombre del docente o materia principal..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Sidebar list of docentes */}
        <div style={{ width: '300px', flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Plantel Docente</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{docentes.length}</span>
          </div>

          <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Cargando docentes...
              </div>
            ) : docentes.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay docentes registrados.
              </div>
            ) : (
              docentes.map((doc) => {
                const isSelected = selectedDocente && selectedDocente.id === doc.id;
                return (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDocente(doc)}
                    style={{ 
                      padding: '14px 18px', 
                      background: isSelected ? 'var(--surface-alt)' : 'transparent',
                      borderLeft: isSelected ? '4px solid var(--primary-red)' : '4px solid transparent',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div className="cell-bold" style={{ fontSize: '0.92rem' }}>{doc.nombre}</div>
                    <div className="cell-subtitle">
                      {doc.materia_principal || 'Docente de Carrera'} {doc.ci ? `· CI: ${doc.ci}` : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ padding: '15px 18px', background: '#f8fafc', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
            Selecciona un docente para consultar sus informes de cátedra, asistencia y CV.
          </div>
        </div>

        {/* Content area: Expediente */}
        <div style={{ flex: 1 }}>
          {selectedDocente ? (
            <>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--surface)', padding: '25px', marginBottom: '20px' }}>
                <div className="module-breadcrumbs" style={{ margin: 0 }}>EXPEDIENTE DOCENTE DIGITAL</div>
                <h2 style={{ margin: '6px 0 16px 0', fontSize: '1.6rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  {selectedDocente.nombre}
                </h2>
                
                <div style={{ display: 'flex', gap: '35px', marginBottom: '22px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>Cédula de Identidad</div>
                    <div className="cell-bold">{selectedDocente.ci || 'No registrada'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>Materia Principal</div>
                    <div className="cell-bold">{selectedDocente.materia_principal || 'Por asignar'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>Ingreso a Dirección</div>
                    <div className="cell-bold">Gestión {selectedDocente.gestion_ingreso || 'Histórica'}</div>
                  </div>
                </div>

                {/* Hoja de vida / CV destacada */}
                <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary-red)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <div>
                      <div className="cell-bold" style={{ fontSize: '0.95rem' }}>Hoja de vida / Currículum vitae</div>
                      <div className="cell-subtitle" style={{ margin: 0 }}>
                        {cvArchivo 
                          ? `Archivo: ${cvArchivo.nombre_original || 'CV.pdf'} · Actualizado en ${cvArchivo.gestion || 'vigente'}` 
                          : 'No se ha cargado currículum aún (actualizable periódicamente)'}
                      </div>
                    </div>
                  </div>
                  
                  {cvArchivo ? (
                    <button 
                      onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${cvArchivo.id}/download`, cvArchivo.nombre_original || 'CV.pdf')}
                      className="btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      Descargar CV ↗
                    </button>
                  ) : (
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setArchivoForm({
                          tipo: 'curriculum',
                          gestion: gestion,
                          semestre: '1',
                          archivo: null
                        });
                        setIsArchivoModalOpen(true);
                      }}
                    >
                      + Cargar CV
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>Documentos del expediente</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {archivos.length} archivos resguardados en digital
                </span>
              </div>

              <div className="minimal-table-container">
                <table className="minimal-table">
                  <thead>
                    <tr>
                      <th>TIPO DE DOCUMENTO</th>
                      <th style={{ width: '90px' }}>GESTIÓN</th>
                      <th style={{ width: '100px' }}>SEMESTRE</th>
                      <th>ARCHIVO ORIGINAL</th>
                      <th style={{ width: '120px' }}>DESCARGAR</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingArchivos ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '25px', color: 'var(--text-muted)' }}>
                          Cargando expediente...
                        </td>
                      </tr>
                    ) : archivos.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          <p>Este docente no tiene documentos cargados en su file digital.</p>
                          <button 
                            className="btn-secondary" 
                            onClick={() => setIsArchivoModalOpen(true)}
                            style={{ marginTop: '10px' }}
                          >
                            Cargar informe o asistencia
                          </button>
                        </td>
                      </tr>
                    ) : (
                      archivos.map((arc) => (
                        <tr key={arc.id}>
                          <td>
                            <span className="cell-bold">{TIPOS_DOC[arc.tipo] || arc.tipo}</span>
                          </td>
                          <td>{arc.gestion || 'General'}</td>
                          <td>{arc.semestre ? `Semestre ${arc.semestre === 1 ? 'I' : 'II'}` : 'Vigente'}</td>
                          <td>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {arc.nombre_original || 'documento.pdf'}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => downloadFile(`/docentes/${selectedDocente.id}/archivos/${arc.id}/download`, arc.nombre_original || 'documento.pdf')}
                              className="action-link"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              title="Descargar documento"
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              Descargar ↗
                            </button>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleDeleteArchivo(arc.id, arc.nombre_original)}
                              className="btn-danger-outline"
                              title="Eliminar archivo"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              <p>Selecciona un docente de la lista para ver su expediente o haz clic en "+ Nuevo docente".</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL NUEVO DOCENTE */}
      {isDocenteModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsDocenteModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Registrar Nuevo Docente</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => !submitting && setIsDocenteModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocente}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre y Apellido Completo *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Ing. Mario Renato Chocala"
                    value={docenteForm.nombre}
                    onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cédula de Identidad</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. 4829102 SC"
                      value={docenteForm.ci}
                      onChange={(e) => setDocenteForm({ ...docenteForm, ci: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Año de ingreso a carrera</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={docenteForm.gestion_ingreso}
                      onChange={(e) => setDocenteForm({ ...docenteForm, gestion_ingreso: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Materia Principal / Cátedra</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Sistemas de Información, Programación Web..."
                    value={docenteForm.materia_principal}
                    onChange={(e) => setDocenteForm({ ...docenteForm, materia_principal: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsDocenteModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Crear expediente de docente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CARGAR ARCHIVO AL EXPEDIENTE */}
      {isArchivoModalOpen && selectedDocente && (
        <div className="modal-overlay" onClick={() => !submitting && setIsArchivoModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Cargar Documento al Expediente</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => !submitting && setIsArchivoModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadArchivo}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '4px', fontSize: '0.85rem' }}>
                  Expediente de: <strong>{selectedDocente.nombre}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de documento *</label>
                  <select 
                    className="form-select"
                    value={archivoForm.tipo}
                    onChange={(e) => setArchivoForm({ ...archivoForm, tipo: e.target.value })}
                  >
                    <option value="informe_final">Informe final de cátedra</option>
                    <option value="lista_asistencia">Listas de asistencia de estudiantes</option>
                    <option value="curriculum">Hoja de vida / Currículum vitae</option>
                    <option value="programa_analitico">Programa analítico archivado</option>
                    <option value="otro">Otro certificado o respaldo</option>
                  </select>
                </div>

                {archivoForm.tipo !== 'curriculum' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Gestión Académica</label>
                      <input 
                        type="number" 
                        className="form-input"
                        value={archivoForm.gestion}
                        onChange={(e) => setArchivoForm({ ...archivoForm, gestion: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Semestre</label>
                      <select 
                        className="form-select"
                        value={archivoForm.semestre}
                        onChange={(e) => setArchivoForm({ ...archivoForm, semestre: e.target.value })}
                      >
                        <option value="1">Semestre I</option>
                        <option value="2">Semestre II</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Cargar archivo (PDF o escaneo) *</label>
                  <div className="form-file-container">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setArchivoForm({ ...archivoForm, archivo: e.target.files[0] || null })}
                      required
                    />
                    {archivoForm.archivo && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#166534', fontWeight: 500 }}>
                        ✓ Archivo seleccionado: {archivoForm.archivo.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsArchivoModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Subiendo...' : 'Cargar al expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Docentes;
