import React, { useState } from 'react';
import './Modules.css';

const Docentes = () => {
  const [docentes] = useState([
    { id: 1, documento: 'Hoja de vida / currículum', subDocumento: 'CV_Mario_Chocala.pdf · PDF', gestion: 'Perfil', semestre: 'Vigente' },
    { id: 2, documento: 'Certificados de formación', subDocumento: 'certificados.pdf · Escaneo', gestion: 'Perfil', semestre: 'Vigente' },
    { id: 3, documento: 'Informe final de cátedra', subDocumento: 'informe_catedra.pdf · PDF', gestion: '2026', semestre: 'I' },
    { id: 4, documento: 'Listas de asistencia', subDocumento: 'asistencia.pdf · Escaneo', gestion: '2026', semestre: 'I' },
    { id: 5, documento: 'Programa analítico archivado', subDocumento: 'programa_analitico.pdf · PDF', gestion: '2025', semestre: 'II' },
  ]);

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Docentes</h2>
            <p className="module-subtitle">Expedientes individuales y documentación académica por gestión y semestre.</p>
          </div>
          <button className="btn-primary">
            + Cargar documento
          </button>
        </div>
      </div>

      <div className="info-banner">
        <span>DATOS DE EJEMPLO · Registros ilustrativos, no extraídos del archivo institucional.</span>
        <a href="#consulta">Consulta y resguardo documental</a>
      </div>

      <div className="filters-bar">
        <div className="search-input-container">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Buscar por nombre del docente" />
        </div>
        <select className="filter-select">
          <option>Todos los semestres</option>
        </select>
        <select className="filter-select">
          <option>Todos los documentos</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Sidebar list of docentes */}
        <div style={{ width: '280px', flexShrink: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>Archivo por docente</h3>
          </div>
          <div>
            <div style={{ padding: '15px 20px', background: '#f8fafc', borderLeft: '3px solid var(--primary-red)' }}>
              <div className="cell-bold">Mario Renato Chocala</div>
              <div className="cell-subtitle">Ingeniero - Nombre mencionado</div>
            </div>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div className="cell-bold">Elena Patricia Vargas</div>
              <div className="cell-subtitle">Registro ilustrativo</div>
            </div>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div className="cell-bold">Jorge Alberto Rojas</div>
              <div className="cell-subtitle">Registro ilustrativo</div>
            </div>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div className="cell-bold">Claudia Isabel Mendoza</div>
              <div className="cell-subtitle">Registro ilustrativo</div>
            </div>
          </div>
          <div style={{ padding: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            El nombre de Mario Renato Chocala proviene de la entrevista. La documentación y los demás registros son ejemplos.
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1 }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', background: 'white', padding: '25px', marginBottom: '25px' }}>
            <div className="module-breadcrumbs" style={{ margin: 0 }}>EXPEDIENTE DOCENTE</div>
            <h2 style={{ margin: '5px 0 20px 0', fontSize: '1.5rem', fontWeight: 400 }}>Ing. Mario Renato Chocala</h2>
            
            <div style={{ display: 'flex', gap: '40px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Archivo interno - Ejemplo</div>
                <div className="cell-bold">DOC-EJ-001</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Periodo de consulta</div>
                <div className="cell-bold">Gestión 2026 · Todos los semestres</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Respaldo físico</div>
                <div className="cell-bold">Carpeta individual del docente</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <div>
                  <div className="cell-bold">Hoja de vida y certificados</div>
                  <div className="cell-subtitle" style={{ margin: 0 }}>Respaldo digital en PDF · Versión actualizable</div>
                </div>
              </div>
              <button style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Actualizar currículum
              </button>
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cargar una nueva versión actualiza el archivo; no modifica el contenido del PDF o escaneo original.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 400 }}>Documentación del expediente</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF / escaneo · Respaldo digital</span>
          </div>

          <div className="minimal-table-container">
            <table className="minimal-table">
              <thead>
                <tr>
                  <th>DOCUMENTO</th>
                  <th>GESTIÓN</th>
                  <th>SEMESTRE</th>
                  <th>VER / DESCARGAR</th>
                </tr>
              </thead>
              <tbody>
                {docentes.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="cell-bold">{doc.documento}</span>
                      <span className="cell-subtitle">{doc.subDocumento}</span>
                    </td>
                    <td>{doc.gestion}</td>
                    <td>{doc.semestre}</td>
                    <td>
                      <a className="action-link">Consultar ↓</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              <span>Vista ilustrativa · {docentes.length} registros de ejemplo</span>
              <div className="pagination">
                <span>&lt;</span>
                <span>Página 1</span>
                <span>&gt;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docentes;
