const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Docente = sequelize.define('Docente', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(250), allowNull: false },
  ci: { type: DataTypes.STRING(20) },
  materia_principal: { type: DataTypes.STRING(250) },
  gestion_ingreso: { type: DataTypes.INTEGER },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'Docentes',
  timestamps: true
});

module.exports = Docente;
