const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActaDetalle = sequelize.define('ActaDetalle', {
  id_documento: {
    type: DataTypes.UUID,
    primaryKey: true,
    comment: 'Mismo id del acta en documents (relación 1 a 1)'
  },
  nombre_estudiante: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  ci: {
    type: DataTypes.STRING(20)
  },
  nro_registro: {
    type: DataTypes.STRING(50)
  },
  modalidad: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [[
        'excelencia',
        'buen_rendimiento',
        'buen_desempeno',
        'tesis',
        'trabajo_dirigido',
        'examen_grado',
        'proyecto_grado',
        'titulacion_continua'
      ]]
    }
  },
  codigo_cpd: {
    type: DataTypes.STRING(100)
  },
  nota: {
    type: DataTypes.DECIMAL(5, 2)
  }
}, {
  tableName: 'actas_detalles',
  timestamps: true,
  underscored: true
});

module.exports = ActaDetalle;
