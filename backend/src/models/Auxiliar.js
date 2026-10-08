const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Auxiliar = sequelize.define('Auxiliar', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  gestion: { type: DataTypes.INTEGER, allowNull: false },
  semestre: { type: DataTypes.INTEGER, allowNull: false }, // 1 o 2
  nombre: { type: DataTypes.STRING(250), allowNull: false },
  nro_registro: { type: DataTypes.STRING(50) },
  materia: { type: DataTypes.STRING(250), allowNull: false },
  nota_examen: { type: DataTypes.DECIMAL(5, 2) },
  estado: {
    type: DataTypes.ENUM('aprobado', 'reprobado', 'pendiente'),
    defaultValue: 'pendiente'
  },
  nro_convocatoria: { type: DataTypes.STRING(50) },
  es_ratificacion: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'Auxiliares',
  timestamps: true
});

module.exports = Auxiliar;
