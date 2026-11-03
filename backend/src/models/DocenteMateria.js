const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocenteMateria = sequelize.define('DocenteMateria', {
  id_docente_materia: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_docente: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_materia: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'docente_materias',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['id_docente', 'id_materia']
    }
  ]
});

module.exports = DocenteMateria;
