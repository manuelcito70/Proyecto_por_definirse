const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Acta = sequelize.define('Acta', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nro_acta: { type: DataTypes.STRING(50), allowNull: false },
  codigo_cpd: { type: DataTypes.STRING(100) },
  nro_registro: { type: DataTypes.STRING(50) },
  nombre_estudiante: { type: DataTypes.STRING(250), allowNull: false },
  ci: { type: DataTypes.STRING(20) },
  modalidad: {
    type: DataTypes.ENUM(
      'excelencia',
      'buen_rendimiento',
      'buen_desempeno',
      'tesis',
      'trabajo_dirigido',
      'examen_grado',
      'proyecto_grado',
      'titulacion_continua'
    ),
    allowNull: false
  },
  nota: { type: DataTypes.DECIMAL(5, 2) },
  gestion: { type: DataTypes.INTEGER, allowNull: false },
  archivo_path: { type: DataTypes.STRING(600) },
  nombre_archivo: { type: DataTypes.STRING(300) }
}, {
  tableName: 'Actas',
  timestamps: true
});

module.exports = Acta;
