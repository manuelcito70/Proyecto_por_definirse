import React, { useState } from 'react';
import './Modules.css';

const Expedidos = () => {
  const [expedidos] = useState([
    { id: 111, nro: 111, gestion: 2026, asunto: 'Acta de graduación', subAsunto: 'Último oficio expedido confirmado', destinatario: 'CPD', estado: 'Completado', color: 'green', accion: 'Consultar' },
    { id: 110, nro: 110, gestion: 2026, asunto: 'Licencia docente', subAsunto: 'Espera de tratamiento en consejo', destinatario: 'Consejo Facultativo', estado: 'En curso', color: 'yellow', accion: 'Redactar' },
    { id: 109, nro: 109, gestion: 2026, asunto: 'Ratificación de auxiliar de cátedra', subAsunto: '', destinatario: 'Consejo Facultativo', estado: 'Completado', color: 'green', accion: 'Consultar' },
    { id: 108, nro: 108, gestion: 2026, asunto: 'Remisión de informe de cátedra', subAsunto: '', destinatario: 'Decanato', estado: 'Pendiente', color: 'red', accion: 'Redactar' },
    { id: 107, nro: 107, gestion: 2026, asunto: 'Solicitud de documentación académica', subAsunto: '', destinatario: 'CPD', estado: 'Completado', color: 'green', accion: 'Consultar' },
  ]);

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Documentos expedidos</h2>
            <p className="module-subtitle">Oficios elaborados en dirección y remitidos a otras oficinas.</p>
          </div>
          <button className="btn-primary">
            + Nuevo oficio
          </button>
        </div>
      </div>

      <div className="info-banner">
        <span>DATOS DE EJEMPLO · Registros ilustrativos, no extraídos del archivo institucional.</span>
        <a href="#consulta">Consulta y resguardo documental</a>
      </div>

      <div className="info-box">
        <div className="big-number">112</div>
        <div className="info-text">
          <h4>Siguiente oficio · Gestión 2026</h4>
          <p>Asignación automática al registrar. Último expedido: 111.</p>
        </div>
        <div className="info-extra">
          <h5>Cierre de gestión 2025: oficio 96</h5>
          <p>La numeración histórica se conserva.</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-container">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Buscar por oficio, asunto o destinatario" />
        </div>
        <select className="filter-select">
          <option>Todos los estados</option>
        </select>
        <select className="filter-select">
          <option>Todos los destinatarios</option>
        </select>
      </div>

      <div className="minimal-table-container">
        <table className="minimal-table">
          <thead>
            <tr>
              <th>OFICIO</th>
              <th>GESTIÓN</th>
              <th>ASUNTO</th>
              <th>DESTINATARIO</th>
              <th>ESTADO</th>
              <th>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {expedidos.map((doc) => (
              <tr key={doc.id}>
                <td className="cell-bold">{doc.nro}</td>
                <td>{doc.gestion}</td>
                <td>
                  <span className="cell-bold">{doc.asunto}</span>
                  {doc.subAsunto && <span className="cell-subtitle">{doc.subAsunto}</span>}
                </td>
                <td>{doc.destinatario}</td>
                <td>
                  <span className={`status-dot status-${doc.color}`}>{doc.estado}</span>
                </td>
                <td>
                  <a className="action-link">{doc.accion} ↗</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Vista ilustrativa · {expedidos.length} registros de ejemplo</span>
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

export default Expedidos;
