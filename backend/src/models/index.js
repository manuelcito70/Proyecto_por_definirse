const sequelize = require('../config/database');
const User = require('./User');
const Expedido = require('./Expedido');
const Recibido = require('./Recibido');
const Acta = require('./Acta');
const Auxiliar = require('./Auxiliar');
const Docente = require('./Docente');
const DocenteArchivo = require('./DocenteArchivo');

// Relación Docente → DocenteArchivo
Docente.hasMany(DocenteArchivo, { foreignKey: 'id_docente', as: 'archivos' });
DocenteArchivo.belongsTo(Docente, { foreignKey: 'id_docente', as: 'docente' });

module.exports = {
  sequelize,
  User,
  Expedido,
  Recibido,
  Acta,
  Auxiliar,
  Docente,
  DocenteArchivo
};
