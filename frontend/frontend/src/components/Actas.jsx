import React, { useState } from 'react';
import './Modules.css';

const Actas = () => {
  const [actas] = useState([
    { id: 1, estudiante: 'Maria Fernanda Rojas Pérez', registro: 'EJ-20418', codigo: 'CPD-EJ-084', codigoSub: 'N.º oficial: 084 (ejemplo)', modalidad: 'Tesis de grado', gestion: 2026 },
    { id: 2, estudiante: 'Diego Andrés Vargas Flores', registro: 'EJ-20422', codigo: 'CPD-EJ-083', codigoSub: 'N.º oficial: 083 (ejemplo)', modalidad: 'Proyecto de grado', gestion: 2026 },
    { id: 3, estudiante: 'Lucia Isabel Mendoza Rios', registro: 'EJ-20431', codigo: 'CPD-EJ-082', codigoSub: 'N.º oficial: 082 (ejemplo)', modalidad: 'Excelencia académica', gestion: 2026 },
    { id: 4, estudiante: 'Carlos Eduardo Peña Soto', registro: 'EJ-20435', codigo: 'CPD-EJ-081', codigoSub: 'N.º oficial: 081 (ejemplo)', modalidad: 'Trabajo dirigido', gestion: 2026 },
  ]);

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Actas de graduación</h2>
            <p className="module-subtitle">Registro de actas oficiales y recuperación de copias por estudiante.</p>
          </div>
          <button className="btn-primary">
            + Registrar acta
          </button>
        </div>
      </div>

      <div className="info-banner">
        <span>DATOS DE EJEMPLO · Registros ilustrativos, no extraídos del archivo institucional.</span>
        <a href="#consulta">Consulta y resguardo documental</a>
      </div>

      <div className="info-box" style={{ padding: '15px 20px', background: '#f0fdf4' }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#166534" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
          El número y el código oficiales únicos son asignados por CPD. Dirección los registra tal como se reciben; no genera ni renumera actas oficiales.
        </p>
      </div>

      <div className="filters-bar">
        <div className="search-input-container">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Buscar estudiante, registro o código CPD" />
        </div>
        <select className="filter-select">
          <option>Todas las modalidades</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>FILTRAR POR MODALIDAD</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['Excelencia académica', 'Buen rendimiento', 'Buen desempeño', 'Tesis de grado', 'Trabajo dirigido', 'Examen de grado', 'Proyecto de grado', 'Titulación vía continua'].map(mod => (
            <span key={mod} style={{ padding: '6px 15px', borderRadius: '99px', border: '1px solid var(--border-color)', fontSize: '0.8rem', cursor: 'pointer', background: 'white' }}>
              {mod}
            </span>
          ))}
        </div>
      </div>

      <div className="minimal-table-container">
        <table className="minimal-table">
          <thead>
            <tr>
              <th>ESTUDIANTE / REGISTRO</th>
              <th>CÓDIGO CPD</th>
              <th>MODALIDAD</th>
              <th>GESTIÓN</th>
              <th>CONSULTA</th>
            </tr>
          </thead>
          <tbody>
            {actas.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <span className="cell-bold">{doc.estudiante}</span>
                  <span className="cell-subtitle">Registro: {doc.registro}</span>
                </td>
                <td>
                  <span className="cell-bold">{doc.codigo}</span>
                  <span className="cell-subtitle">{doc.codigoSub}</span>
                </td>
                <td>{doc.modalidad}</td>
                <td>{doc.gestion}</td>
                <td>
                  <a className="action-link">Ver ficha ↗</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Vista ilustrativa · {actas.length} registros de ejemplo</span>
          <div className="pagination">
            <span>&lt;</span>
            <span>Página 1</span>
            <span>&gt;</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Actas;
