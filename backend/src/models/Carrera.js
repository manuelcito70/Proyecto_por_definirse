const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Carrera = sequelize.define('Carrera', {
  id_carrera: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'carreras',
  timestamps: true,
  underscored: true
});

module.exports = Carrera;
