const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id_documento: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_tipo_documento: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_gestion: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_carrera: {
    type: DataTypes.UUID,
    allowNull: false
  },
  nro_documento: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  correlativo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Secuencial numérico autogenerado para oficios/recibidos'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_recepcion: {
    type: DataTypes.DATEONLY
  },
  remitente: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  destinatario: {
    type: DataTypes.STRING(300)
  },
  asunto: {
    type: DataTypes.STRING(600),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  categoria: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'otro',
    validate: {
      isIn: [['carta', 'solicitud', 'informe', 'memorandum', 'otro']]
    }
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'pendiente',
    validate: {
      isIn: [['pendiente', 'en_curso', 'completado', 'archivado']]
    }
  },
  requiere_respuesta: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tipo_respuesta: {
    type: DataTypes.STRING(50)
  },
  semestre: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    validate: {
      isIn: [[1, 2]]
    },
    comment: 'Semestre académico opcional (ej. para documentación docente)'
  },
  id_auxiliar: {
    type: DataTypes.UUID,
    allowNull: true
  },
  id_docente: {
    type: DataTypes.UUID,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['id_carrera', 'id_tipo_documento', 'id_gestion', 'nro_documento']
    }
  ]
});

module.exports = Document;
