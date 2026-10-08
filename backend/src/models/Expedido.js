const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expedido = sequelize.define('Expedido', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nro_oficio: { type: DataTypes.INTEGER, allowNull: false },
  gestion: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  destinatario: { type: DataTypes.STRING(300), allowNull: false },
  asunto: { type: DataTypes.STRING(600), allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_curso', 'completado'),
    defaultValue: 'pendiente'
  },
  requiere_respuesta: { type: DataTypes.BOOLEAN, defaultValue: false },
  archivo_path: { type: DataTypes.STRING(600) },
  nombre_archivo: { type: DataTypes.STRING(300) }
}, {
  tableName: 'Expedidos',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['nro_oficio', 'gestion'] }
  ]
});

module.exports = Expedido;
