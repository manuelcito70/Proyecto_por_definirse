const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocenteV4 = sequelize.define('DocenteV4', {
  id_docente: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  ci: {
    type: DataTypes.STRING(20)
  },
  id_carrera: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_gestion_ingreso: {
    type: DataTypes.UUID
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'docentes',
  timestamps: true,
  underscored: true
});

module.exports = DocenteV4;
