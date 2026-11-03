const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConvocatoriaFase = sequelize.define('ConvocatoriaFase', {
  id_convocatoria_fase: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_convocatoria: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_fase: {
    type: DataTypes.UUID,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'convocatoria_fases',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['id_convocatoria', 'id_fase']
    }
  ]
});

module.exports = ConvocatoriaFase;
