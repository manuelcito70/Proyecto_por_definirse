const sequelize = require('../config/database');

// ==========================================
// MODELOS V4 (Normalizados SIGAD)
// ==========================================
const Carrera = require('./Carrera');
const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Gestion = require('./Gestion');
const Materia = require('./Materia');
const DocenteV4 = require('./DocenteV4');
const DocenteMateria = require('./DocenteMateria');
const FaseProceso = require('./FaseProceso');
const Convocatoria = require('./Convocatoria');
const ConvocatoriaFase = require('./ConvocatoriaFase');
const AuxiliarV4 = require('./AuxiliarV4');
const DocumentType = require('./DocumentType');
const Document = require('./Document');
const ActaDetalle = require('./ActaDetalle');
const DocumentAttachment = require('./DocumentAttachment');

// Asociaciones Usuarios y Roles
Usuario.belongsTo(Rol, { foreignKey: 'id_rol', as: 'rol' });
Rol.hasMany(Usuario, { foreignKey: 'id_rol', as: 'usuarios' });

Usuario.belongsTo(Carrera, { foreignKey: 'id_carrera', as: 'carrera' });
Carrera.hasMany(Usuario, { foreignKey: 'id_carrera', as: 'usuarios' });

// Materias y Carreras
Materia.belongsTo(Carrera, { foreignKey: 'id_carrera', as: 'carrera' });
Carrera.hasMany(Materia, { foreignKey: 'id_carrera', as: 'materias' });

// Docentes, Carreras y Gestiones
DocenteV4.belongsTo(Carrera, { foreignKey: 'id_carrera', as: 'carrera' });
Carrera.hasMany(DocenteV4, { foreignKey: 'id_carrera', as: 'docentes' });

DocenteV4.belongsTo(Gestion, { foreignKey: 'id_gestion_ingreso', as: 'gestion_ingreso' });
Gestion.hasMany(DocenteV4, { foreignKey: 'id_gestion_ingreso', as: 'docentes_ingresados' });

// Docentes <-> Materias (Muchos a Muchos)
DocenteV4.belongsToMany(Materia, {
  through: DocenteMateria,
  foreignKey: 'id_docente',
  otherKey: 'id_materia',
  as: 'materias'
});
Materia.belongsToMany(DocenteV4, {
  through: DocenteMateria,
  foreignKey: 'id_materia',
  otherKey: 'id_docente',
  as: 'docentes'
});
DocenteMateria.belongsTo(DocenteV4, { foreignKey: 'id_docente', as: 'docente' });
DocenteMateria.belongsTo(Materia, { foreignKey: 'id_materia', as: 'materia' });

// Convocatorias
Convocatoria.belongsTo(Carrera, { foreignKey: 'id_carrera', as: 'carrera' });
Carrera.hasMany(Convocatoria, { foreignKey: 'id_carrera', as: 'convocatorias' });

Convocatoria.belongsTo(Gestion, { foreignKey: 'id_gestion', as: 'gestion' });
Gestion.hasMany(Convocatoria, { foreignKey: 'id_gestion', as: 'convocatorias' });

// Fases de Convocatoria
ConvocatoriaFase.belongsTo(Convocatoria, { foreignKey: 'id_convocatoria', as: 'convocatoria' });
Convocatoria.hasMany(ConvocatoriaFase, { foreignKey: 'id_convocatoria', as: 'fases' });

ConvocatoriaFase.belongsTo(FaseProceso, { foreignKey: 'id_fase', as: 'fase' });
FaseProceso.hasMany(ConvocatoriaFase, { foreignKey: 'id_fase', as: 'convocatorias_fase' });

// Documento de respaldo de cada fase (opcional); si se borra el documento, la fase queda sin respaldo
ConvocatoriaFase.belongsTo(Document, { foreignKey: 'id_documento', as: 'documento', onDelete: 'SET NULL' });
Document.hasMany(ConvocatoriaFase, { foreignKey: 'id_documento', as: 'fases_convocatoria', onDelete: 'SET NULL' });

// Auxiliares
AuxiliarV4.belongsTo(Convocatoria, { foreignKey: 'id_convocatoria', as: 'convocatoria' });
Convocatoria.hasMany(AuxiliarV4, { foreignKey: 'id_convocatoria', as: 'auxiliares' });

AuxiliarV4.belongsTo(Materia, { foreignKey: 'id_materia', as: 'materia' });
Materia.hasMany(AuxiliarV4, { foreignKey: 'id_materia', as: 'auxiliares' });

// Documentos
Document.belongsTo(Carrera, { foreignKey: 'id_carrera', as: 'carrera' });
Carrera.hasMany(Document, { foreignKey: 'id_carrera', as: 'documentos' });

Document.belongsTo(DocumentType, { foreignKey: 'id_tipo_documento', as: 'tipo_documento' });
DocumentType.hasMany(Document, { foreignKey: 'id_tipo_documento', as: 'documentos' });

Document.belongsTo(Gestion, { foreignKey: 'id_gestion', as: 'gestion' });
Gestion.hasMany(Document, { foreignKey: 'id_gestion', as: 'documentos' });

Document.belongsTo(AuxiliarV4, { foreignKey: 'id_auxiliar', as: 'auxiliar' });
AuxiliarV4.hasMany(Document, { foreignKey: 'id_auxiliar', as: 'documentos' });

Document.belongsTo(DocenteV4, { foreignKey: 'id_docente', as: 'docente' });
DocenteV4.hasMany(Document, { foreignKey: 'id_docente', as: 'documentos' });

Document.belongsTo(Usuario, { foreignKey: 'created_by', as: 'creador' });
Usuario.hasMany(Document, { foreignKey: 'created_by', as: 'documentos' });

// Actas Detalles (1 a 1 con Document)
Document.hasOne(ActaDetalle, { foreignKey: 'id_documento', as: 'acta_detalle' });
ActaDetalle.belongsTo(Document, { foreignKey: 'id_documento', as: 'documento' });

// Adjuntos de Documentos
Document.hasMany(DocumentAttachment, { foreignKey: 'id_documento', as: 'adjuntos' });
DocumentAttachment.belongsTo(Document, { foreignKey: 'id_documento', as: 'documento' });

module.exports = {
  sequelize,
  // Modelos V4
  Carrera,
  Rol,
  Usuario,
  Gestion,
  Materia,
  DocenteV4,
  DocenteMateria,
  FaseProceso,
  Convocatoria,
  ConvocatoriaFase,
  AuxiliarV4,
  DocumentType,
  Document,
  ActaDetalle,
  DocumentAttachment
};
