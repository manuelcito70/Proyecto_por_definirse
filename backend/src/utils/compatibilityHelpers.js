const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  Carrera,
  Gestion,
  DocumentType,
  Materia
} = require('../models');

// Obtener id_carrera del usuario autenticado (con fallback seguro a la carrera por defecto)
async function getCarreraId(req) {
  if (req.user && req.user.id_carrera) {
    return req.user.id_carrera;
  }
  const carrera = await Carrera.findOne({ where: { nombre: 'Ingeniería de Sistemas' } })
    || await Carrera.findOne({ where: { activo: true } })
    || await Carrera.findOne();
  return carrera ? carrera.id_carrera : null;
}

// Obtener o registrar Gestión por año numérico
async function getGestionByAnio(anio, transaction = null) {
  const anioNum = parseInt(anio, 10) || new Date().getFullYear();
  const [gestion] = await Gestion.findOrCreate({
    where: { anio: anioNum },
    defaults: { id_gestion: uuidv4(), anio: anioNum },
    transaction
  });
  return gestion;
}

// Obtener id de Tipo de Documento por su nombre oficial
async function getDocumentTypeId(nombre, transaction = null) {
  const dt = await DocumentType.findOne({ where: { nombre }, transaction });
  return dt ? dt.id_tipo_documento : null;
}

// Mapeo bidireccional de tipos de expedientes docentes (V4 <-> Legacy)
const DOCENTE_TIPO_V4_TO_LEGACY = {
  'Curriculum Vitae': 'curriculum',
  'Anexos y Títulos': 'anexos_cv',
  'Programa Analítico': 'programa_analitico',
  'Informe Final': 'informe_final',
  'Lista de Asistencia': 'lista_asistencia',
  'Informe de Cátedra': 'informe_catedra',
  'Otro': 'otro'
};

const DOCENTE_TIPO_LEGACY_TO_V4 = {
  curriculum: 'Curriculum Vitae',
  anexos_cv: 'Anexos y Títulos',
  programa_analitico: 'Programa Analítico',
  informe_final: 'Informe Final',
  lista_asistencia: 'Lista de Asistencia',
  informe_cathedra: 'Informe de Cátedra',
  informe_catedra: 'Informe de Cátedra',
  otro: 'Otro'
};

// Formateador de Expedidos (Documento -> JSON Contrato de API)
function formatExpedido(doc) {
  const adjunto = doc.adjuntos && doc.adjuntos.length > 0 ? doc.adjuntos[0] : null;
  return {
    id: doc.id_documento,
    nro_oficio: doc.correlativo || (doc.nro_documento && !isNaN(doc.nro_documento) ? parseInt(doc.nro_documento, 10) : doc.nro_documento),
    gestion: doc.gestion ? doc.gestion.anio : (doc.fecha ? new Date(doc.fecha).getFullYear() : null),
    fecha: doc.fecha,
    destinatario: doc.destinatario || '',
    asunto: doc.asunto || '',
    descripcion: doc.descripcion || '',
    categoria: doc.categoria || 'otro',
    estado: doc.estado || 'pendiente',
    requiere_respuesta: doc.requiere_respuesta || false,
    archivo_path: adjunto ? adjunto.archivo_path : null,
    nombre_archivo: adjunto ? adjunto.nombre_archivo : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Formateador de Recibidos (Documento -> JSON Contrato de API)
function formatRecibido(doc) {
  const adjunto = doc.adjuntos && doc.adjuntos.length > 0 ? doc.adjuntos[0] : null;
  return {
    id: doc.id_documento,
    nro_recibido: doc.correlativo || (doc.nro_documento && !isNaN(doc.nro_documento) ? parseInt(doc.nro_documento, 10) : doc.nro_documento),
    gestion: doc.gestion ? doc.gestion.anio : (doc.fecha ? new Date(doc.fecha).getFullYear() : null),
    fecha: doc.fecha,
    remitente: doc.remitente || '',
    asunto: doc.asunto || '',
    descripcion: doc.descripcion || '',
    categoria: doc.categoria || 'otro',
    estado: doc.estado || 'pendiente',
    requiere_respuesta: doc.requiere_respuesta || false,
    tipo_respuesta: doc.tipo_respuesta || 'para_conocimiento',
    archivo_path: adjunto ? adjunto.archivo_path : null,
    nombre_archivo: adjunto ? adjunto.nombre_archivo : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Formateador de Actas (Documento + Detalle -> JSON Contrato de API)
function formatActa(doc) {
  const detalle = doc.acta_detalle || {};
  const adjunto = doc.adjuntos && doc.adjuntos.length > 0 ? doc.adjuntos[0] : null;
  return {
    id: doc.id_documento,
    nro_acta: doc.nro_documento,
    codigo_cpd: detalle.codigo_cpd || null,
    nro_registro: detalle.nro_registro || null,
    nombre_estudiante: detalle.nombre_estudiante || '',
    ci: detalle.ci || null,
    modalidad: detalle.modalidad || 'excelencia',
    nota: detalle.nota !== null && detalle.nota !== undefined ? parseFloat(detalle.nota) : null,
    gestion: doc.gestion ? doc.gestion.anio : (doc.fecha ? new Date(doc.fecha).getFullYear() : null),
    archivo_path: adjunto ? adjunto.archivo_path : null,
    nombre_archivo: adjunto ? adjunto.nombre_archivo : null,
    archivo_tamano: adjunto ? adjunto.archivo_tamano : null,
    archivo_tipo: adjunto ? adjunto.archivo_tipo : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Formateador de Auxiliares (AuxiliarV4 + Convocatoria + Materia -> JSON Contrato de API)
function formatAuxiliar(aux) {
  const conv = aux.convocatoria || {};
  const mat = aux.materia || {};
  return {
    id: aux.id_auxiliar,
    gestion: conv.gestion ? conv.gestion.anio : null,
    semestre: conv.semestre || 1,
    nombre: aux.nombre,
    nro_registro: aux.nro_registro,
    materia: mat.nombre || '',
    materia_codigo: mat.codigo || null,
    nota_examen: aux.nota_examen !== null && aux.nota_examen !== undefined ? parseFloat(aux.nota_examen) : null,
    estado: aux.estado,
    nro_convocatoria: conv.nro_convocatoria || null,
    es_ratificacion: aux.es_ratificacion || false,
    createdAt: aux.createdAt,
    updatedAt: aux.updatedAt
  };
}

// Formateador de Docentes (DocenteV4 + Materias + Gestion -> JSON Contrato de API)
function formatDocente(doc) {
  const materiasList = doc.materias || [];
  const materiasArr = materiasList.map(m => m.nombre);
  const materiasDetalle = materiasList.map(m => ({
    id: m.id_materia,
    codigo: m.codigo,
    nombre: m.nombre,
    semestre: m.semestre
  }));

  let countGeneral = 0;
  let countSemestral = 0;
  if (doc.documentos && Array.isArray(doc.documentos)) {
    doc.documentos.forEach(d => {
      const tipoNom = d.tipo_documento ? d.tipo_documento.nombre : '';
      if (['Curriculum Vitae', 'Programa Analítico', 'Anexos y Títulos'].includes(tipoNom) || (!d.semestre && tipoNom === 'Curriculum Vitae')) {
        countGeneral++;
      } else {
        countSemestral++;
      }
    });
  }

  const rawId = String(doc.id_docente || '').replace(/-/g, '');
  const docCode = `DOC-${rawId.slice(0, 3).toUpperCase() || '01'}`;
  const ciFormatted = doc.ci ? `CI-${doc.ci}` : `CI-DOC-${rawId.slice(0, 4).toUpperCase()}`;

  // Formato cátedras elegante: "Programación I (INF-110) · Algoritmos y Estructuras de Datos"
  const catedrasString = materiasDetalle.length > 0
    ? materiasDetalle.map(m => m.codigo ? `${m.nombre} (${m.codigo})` : m.nombre).join(' · ')
    : (doc.materia_principal || 'Cátedras Oficiales');

  return {
    id: doc.id_docente,
    nombre: doc.nombre,
    ci: doc.ci || null,
    codigo_docente: docCode,
    ci_label: ciFormatted,
    categoria: 'Ordinario / Titular',
    materia_principal: materiasArr.length > 0 ? materiasArr[0] : '',
    materias: materiasArr,
    materias_detalle: materiasDetalle,
    catedras_str: catedrasString,
    gestion_ingreso: doc.gestion_ingreso ? doc.gestion_ingreso.anio : null,
    activo: doc.activo !== false,
    docs_general_count: countGeneral,
    docs_semestre_count: countSemestral,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Formateador de Archivos Docentes (Documento V4 -> JSON Contrato de API)
function formatDocenteArchivo(doc) {
  const adjunto = doc.adjuntos && doc.adjuntos.length > 0 ? doc.adjuntos[0] : null;
  const tipoV4 = doc.tipo_documento ? doc.tipo_documento.nombre : 'Otro';
  return {
    id: doc.id_documento,
    id_docente: doc.id_docente,
    tipo: DOCENTE_TIPO_V4_TO_LEGACY[tipoV4] || 'otro',
    tipo_nombre: tipoV4,
    gestion: doc.gestion ? doc.gestion.anio : (doc.fecha ? new Date(doc.fecha).getFullYear() : null),
    semestre: doc.semestre || null,
    archivo_path: adjunto ? adjunto.archivo_path : null,
    nombre_original: adjunto ? adjunto.nombre_archivo : 'documento.pdf',
    tamano: adjunto ? adjunto.archivo_tamano : null,
    mimetype: adjunto ? adjunto.archivo_tipo : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

module.exports = {
  getCarreraId,
  getGestionByAnio,
  getDocumentTypeId,
  DOCENTE_TIPO_V4_TO_LEGACY,
  DOCENTE_TIPO_LEGACY_TO_V4,
  formatExpedido,
  formatRecibido,
  formatActa,
  formatAuxiliar,
  formatDocente,
  formatDocenteArchivo
};
