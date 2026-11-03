const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentAttachment = sequelize.define('DocumentAttachment', {
  id_adjunto: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_documento: {
    type: DataTypes.UUID,
    allowNull: false
  },
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  archivo_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  archivo_tipo: {
    type: DataTypes.STRING(100)
  },
  archivo_tamano: {
    type: DataTypes.BIGINT
  }
}, {
  tableName: 'document_attachments',
  timestamps: true,
  underscored: true
});

module.exports = DocumentAttachment;
