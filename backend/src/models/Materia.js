const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Materia = sequelize.define('Materia', {
  id_materia: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_carrera: {
    type: DataTypes.UUID,
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  semestre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Semestre de la carrera (1 al 10)'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'materias',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['id_carrera', 'codigo']
    }
  ]
});

module.exports = Materia;
