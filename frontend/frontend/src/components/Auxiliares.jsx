import React, { useState } from 'react';
import './Modules.css';

const Auxiliares = () => {
  const [auxiliares] = useState([
    { id: 1, nombre: 'Ana Belén Quispe', subNombre: 'Datos de ejemplo', materia: 'Programación I', semestre: 'II / 2026', nota: 86, tipo: 'Ratificación', tipoColor: 'green', consejo: 'En consejo', consejoColor: 'yellow', accion: 'Ver historial' },
    { id: 2, nombre: 'Luis Fernando Ríos', subNombre: '', materia: 'Base de Datos I', semestre: 'II / 2026', nota: 82, tipo: 'Convocatoria', tipoColor: 'green', consejo: 'Aprobado', consejoColor: 'green', accion: 'Ver historial' },
    { id: 3, nombre: 'Valeria Camila Soto', subNombre: '', materia: 'Estructura de Datos', semestre: 'II / 2026', nota: 90, tipo: 'Convocatoria', tipoColor: 'green', consejo: 'Propuesta', consejoColor: 'yellow', accion: 'Ver historial' },
    { id: 4, nombre: 'Andrés Pablo Flores', subNombre: '', materia: 'Programación II', semestre: 'II / 2026', nota: 78, tipo: 'Convocatoria', tipoColor: 'green', consejo: 'Rechazado', consejoColor: 'red', accion: 'Ver historial' },
  ]);

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Auxiliares de cátedra</h2>
            <p className="module-subtitle">Propuestas, decisiones del consejo e historial de participación.</p>
          </div>
          <button className="btn-primary">
            + Registrar propuesta
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
          <input type="text" placeholder="Buscar auxiliar o materia" />
        </div>
        <select className="filter-select">
          <option>Segundo semestre</option>
        </select>
        <select className="filter-select">
          <option>Todos los tipos</option>
        </select>
        <select className="filter-select">
          <option>Todos los estados</option>
        </select>
      </div>

      {/* Ruta de Aprobación banner from Figma mockup */}
      <div className="info-box" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RUTA DE APROBACIÓN</div>
        <div style={{ display: 'flex', gap: '40px', color: '#166534', fontSize: '0.85rem', fontWeight: 500 }}>
          <span><strong style={{ fontSize: '1.2rem', marginRight: '5px' }}>01</strong> Dirección propone</span>
          <span style={{ color: 'var(--text-muted)' }}><strong style={{ fontSize: '1.2rem', marginRight: '5px' }}>02</strong> Consejo aprueba / rechaza</span>
          <span style={{ color: 'var(--text-muted)' }}><strong style={{ fontSize: '1.2rem', marginRight: '5px' }}>03</strong> Retorno a dirección</span>
        </div>
      </div>

      <div className="minimal-table-container">
        <table className="minimal-table">
          <thead>
            <tr>
              <th>AUXILIAR</th>
              <th>MATERIA</th>
              <th>SEM. / GESTIÓN</th>
              <th>NOTA EXAMEN</th>
              <th>TIPO</th>
              <th>CONSEJO</th>
              <th>CONSULTA</th>
            </tr>
          </thead>
          <tbody>
            {auxiliares.map((aux) => (
              <tr key={aux.id}>
                <td>
                  <span className="cell-bold">{aux.nombre}</span>
                  {aux.subNombre && <span className="cell-subtitle">{aux.subNombre}</span>}
                </td>
                <td>{aux.materia}</td>
                <td>{aux.semestre}</td>
                <td>{aux.nota}</td>
                <td>
                  <span className={`status-dot status-${aux.tipoColor}`}>{aux.tipo}</span>
                </td>
                <td>
                  <span className={`status-dot status-${aux.consejoColor}`}>{aux.consejo}</span>
                </td>
                <td>
                  <a className="action-link">{aux.accion} ↗</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Vista ilustrativa · {auxiliares.length} registros de ejemplo</span>
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

export default Auxiliares;
