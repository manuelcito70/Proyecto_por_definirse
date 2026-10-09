import React, { useState } from 'react';
import './Modules.css';

const Recibidos = () => {
  const [recibidos] = useState([
    { id: '014', remitente: 'Consejo Facultativo', remitenteSub: 'Resolución recibida', asunto: 'Aprobación de propuesta de auxiliares', estado: 'Requiere respuesta', color: 'yellow' },
    { id: '013', remitente: 'Decanato', remitenteSub: 'Solicitud', asunto: 'Informe de actividades académicas', estado: 'Requiere respuesta', color: 'yellow' },
    { id: '012', remitente: 'CPD', remitenteSub: 'Comunicación', asunto: 'Entrega de documentos de auxiliares', estado: 'Respondido', color: 'green' },
    { id: '011', remitente: 'Secretaría Facultativa', remitenteSub: 'Invitación', asunto: 'Invitación a reunión de coordinación', estado: 'Para conocimiento', color: 'green' },
    { id: '010', remitente: 'Consejo Facultativo', remitenteSub: 'Resolución recibida', asunto: 'Respuesta a solicitud de licencia', estado: 'Respondido', color: 'green' },
    { id: '009', remitente: 'Decanato', remitenteSub: 'Circular', asunto: 'Comunicación institucional', estado: 'Para conocimiento', color: 'green' },
  ]);

  return (
    <div className="module-container">
      <div className="module-header-container">
        <div className="module-breadcrumbs">DIRECCIÓN DE CARRERA / SISTEMAS</div>
        <div className="module-header-main">
          <div>
            <h2 className="module-title">Documentos recibidos</h2>
            <p className="module-subtitle">Documentación externa, escaneos y seguimiento de respuestas.</p>
          </div>
          <button className="btn-primary">
            + Registrar recibido
          </button>
        </div>
      </div>

      <div className="info-banner">
        <span>DATOS DE EJEMPLO · Registros ilustrativos, no extraídos del archivo institucional.</span>
        <a href="#consulta">Consulta y resguardo documental</a>
      </div>

      <div className="info-box" style={{ padding: '15px 20px', background: 'var(--surface-success)' }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#166534" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
          Los recibidos tienen un correlativo interno independiente por gestión. El PDF o escaneo original se conserva para consulta y descarga; su contenido no se edita.
        </p>
      </div>

      <div className="filters-bar">
        <div className="search-input-container">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Buscar por correlativo, remitente o asunto" />
        </div>
        <select className="filter-select">
          <option>Todos los estados</option>
        </select>
        <select className="filter-select">
          <option>Todos los remitentes</option>
        </select>
        <button style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0 15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Cargar escaneo
        </button>
      </div>

      <div className="minimal-table-container">
        <table className="minimal-table">
          <thead>
            <tr>
              <th>INTERNO</th>
              <th>REMITENTE</th>
              <th>ASUNTO</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {recibidos.map((doc) => (
              <tr key={doc.id} style={{ background: doc.id === '014' ? 'var(--surface-alt)' : 'var(--surface)' }}>
                <td className="cell-bold">{doc.id}</td>
                <td>
                  <span className="cell-bold">{doc.remitente}</span>
                  {doc.remitenteSub && <span className="cell-subtitle">{doc.remitenteSub}</span>}
                </td>
                <td style={{ maxWidth: '300px' }}>{doc.asunto}</td>
                <td>
                  <span className={`status-dot status-${doc.color}`}>{doc.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Vista ilustrativa · {recibidos.length} registros de ejemplo</span>
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

export default Recibidos;
