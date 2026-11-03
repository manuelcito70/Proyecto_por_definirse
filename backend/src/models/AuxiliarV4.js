const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuxiliarV4 = sequelize.define('AuxiliarV4', {
  id_auxiliar: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id_convocatoria: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_materia: {
    type: DataTypes.UUID,
    allowNull: false
  },
  nro_registro: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  nota_examen: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pendiente',
    validate: {
      isIn: [['aprobado', 'reprobado', 'pendiente']]
    }
  },
  es_ratificacion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'auxiliares',
  timestamps: true,
  underscored: true
});

module.exports = AuxiliarV4;
