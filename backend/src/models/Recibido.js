const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recibido = sequelize.define('Recibido', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nro_recibido: { type: DataTypes.INTEGER, allowNull: false },
  gestion: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  remitente: { type: DataTypes.STRING(300), allowNull: false },
  asunto: { type: DataTypes.STRING(600), allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_curso', 'completado'),
    defaultValue: 'pendiente'
  },
  tipo_respuesta: {
    type: DataTypes.ENUM('para_conocimiento', 'requiere_respuesta'),
    defaultValue: 'para_conocimiento'
  },
  archivo_path: { type: DataTypes.STRING(600) },
  nombre_archivo: { type: DataTypes.STRING(300) }
}, {
  tableName: 'Recibidos',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['nro_recibido', 'gestion'] }
  ]
});

module.exports = Recibido;
