const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gestion = sequelize.define('Gestion', {
  id_gestion: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'gestiones',
  timestamps: true,
  underscored: true
});

module.exports = Gestion;
