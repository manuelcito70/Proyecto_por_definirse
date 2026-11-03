const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Convocatoria = sequelize.define('Convocatoria', {
  id_convocatoria: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nro_convocatoria: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  id_carrera: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_gestion: {
    type: DataTypes.UUID,
    allowNull: false
  },
  semestre: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: {
      isIn: [[1, 2]]
    },
    comment: 'Semestre del año académico (1 o 2)'
  },
  observaciones: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'convocatorias',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['id_carrera', 'id_gestion', 'nro_convocatoria', 'semestre']
    }
  ]
});

module.exports = Convocatoria;
