const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentType = sequelize.define('DocumentType', {
  id_tipo_documento: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'document_types',
  timestamps: false,
  underscored: true
});

module.exports = DocumentType;
