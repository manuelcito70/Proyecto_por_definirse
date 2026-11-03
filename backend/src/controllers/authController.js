const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Usuario, Rol, Carrera } = require('../models');
const { SECRET_KEY } = require('../middleware/auth');

const login = async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = (email || username || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ mensaje: 'Correo electrónico y contraseña son requeridos' });
  }

  try {
    // Buscar por email exacto o por prefijo de usuario (ej. 'directora' -> 'directora@uagrm.edu.bo')
    const user = await Usuario.findOne({
      where: {
        [Op.or]: [
          { email: { [Op.iLike]: identifier } },
          { email: { [Op.iLike]: `${identifier}@%` } }
        ]
      },
      include: [
        { model: Rol, as: 'rol' },
        { model: Carrera, as: 'carrera' }
      ]
    });

    if (!user) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    if (!user.activo) {
      return res.status(401).json({ mensaje: 'Usuario inactivo. Contacte al administrador.' });
    }

    const valid = await user.verificarPassword(password);
    if (!valid) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    // Actualizar fecha de último acceso
    await user.update({ ultimo_acceso: new Date() });

    const roleName = user.rol?.nombre || 'usuario';
    const payload = {
      id: user.id_usuario,
      email: user.email,
      rol: roleName,
      id_carrera: user.id_carrera
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '12h' });

    return res.json({
      token,
      user: {
        id: user.id_usuario,
        email: user.email,
        username: user.email.split('@')[0], // Retrocompatibilidad para vistas que muestren username
        nombre: user.nombre,
        rol: roleName,
        cargo: roleName, // Retrocompatibilidad con UI previa que leía user.cargo
        carrera: user.carrera?.nombre || 'Ingeniería de Sistemas',
        id_carrera: user.id_carrera
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ mensaje: 'Error del servidor al procesar inicio de sesión' });
  }
};

const register = async (req, res) => {
  const { email, username, password, nombre, rol, id_rol, id_carrera } = req.body;
  const finalEmail = (email || (username ? (username.includes('@') ? username : `${username}@uagrm.edu.bo`) : '')).trim();

  if (!finalEmail || !password || !nombre) {
    return res.status(400).json({ mensaje: 'Correo electrónico, contraseña y nombre son requeridos' });
  }

  try {
    const existe = await Usuario.findOne({ where: { email: { [Op.iLike]: finalEmail } } });
    if (existe) {
      return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado' });
    }

    // Resolver rol
    let resolvedRolId = id_rol;
    if (!resolvedRolId) {
      const targetRol = (rol || 'director').toLowerCase();
      const rolRecord = await Rol.findOne({ where: { nombre: targetRol } }) 
                     || await Rol.findOne({ where: { nombre: 'director' } });
      resolvedRolId = rolRecord ? rolRecord.id_rol : null;
    }

    // Resolver carrera
    let resolvedCarreraId = id_carrera;
    if (!resolvedCarreraId) {
      const carreraRecord = await Carrera.findOne({ where: { nombre: 'Ingeniería de Sistemas' } })
                         || await Carrera.findOne();
      resolvedCarreraId = carreraRecord ? carreraRecord.id_carrera : null;
    }

    if (!resolvedRolId || !resolvedCarreraId) {
      return res.status(500).json({ mensaje: 'No se pudo asignar rol o carrera predeterminada' });
    }

    const newUser = await Usuario.create({
      email: finalEmail,
      password_hash: password, // El hook beforeCreate aplica bcrypt.hash
      nombre: nombre.trim(),
      id_rol: resolvedRolId,
      id_carrera: resolvedCarreraId,
      activo: true
    });

    const createdWithRels = await Usuario.findByPk(newUser.id_usuario, {
      include: [
        { model: Rol, as: 'rol' },
        { model: Carrera, as: 'carrera' }
      ]
    });

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      user: {
        id: createdWithRels.id_usuario,
        email: createdWithRels.email,
        username: createdWithRels.email.split('@')[0],
        nombre: createdWithRels.nombre,
        rol: createdWithRels.rol?.nombre,
        carrera: createdWithRels.carrera?.nombre
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ mensaje: 'Error del servidor al registrar usuario' });
  }
};

module.exports = { login, register };
