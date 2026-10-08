const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocenteArchivo = sequelize.define('DocenteArchivo', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_docente: { type: DataTypes.INTEGER, allowNull: false },
  tipo: {
    type: DataTypes.ENUM(
      'curriculum',
      'programa_analitico',
      'informe_final',
      'lista_asistencia',
      'informe_cathedra',
      'otro'
    ),
    allowNull: false
  },
  gestion: { type: DataTypes.INTEGER },
  semestre: { type: DataTypes.INTEGER },
  archivo_path: { type: DataTypes.STRING(600), allowNull: false },
  nombre_original: { type: DataTypes.STRING(300) }
}, {
  tableName: 'DocenteArchivos',
  timestamps: true
});

module.exports = DocenteArchivo;
