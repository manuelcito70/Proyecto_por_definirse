const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  id_rol: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_carrera: {
    type: DataTypes.UUID,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ultimo_acceso: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2b$') && !user.password_hash.startsWith('$2a$')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && user.password_hash && !user.password_hash.startsWith('$2b$') && !user.password_hash.startsWith('$2a$')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    }
  }
});

Usuario.prototype.verificarPassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = Usuario;
