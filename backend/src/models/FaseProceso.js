const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FaseProceso = sequelize.define('FaseProceso', {
  id_fase: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'fases_proceso',
  timestamps: false,
  underscored: true
});

module.exports = FaseProceso;
