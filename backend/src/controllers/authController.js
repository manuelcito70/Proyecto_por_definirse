const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ mensaje: 'Usuario y contraseña son requeridos' });
  }
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const valid = await user.verificarPassword(password);
    if (!valid) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.SECRET_KEY || 'secretkey',
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        cargo: user.cargo
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

const register = async (req, res) => {
  const { username, password, nombre, cargo } = req.body;
  if (!username || !password || !nombre) {
    return res.status(400).json({ mensaje: 'Usuario, contraseña y nombre son requeridos' });
  }
  try {
    const existe = await User.findOne({ where: { username } });
    if (existe) return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso' });

    const user = await User.create({
      username,
      password_hash: password,
      nombre,
      cargo: cargo || 'Directora'
    });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.SECRET_KEY || 'secretkey',
      { expiresIn: '12h' }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, nombre: user.nombre, cargo: user.cargo },
      mensaje: 'Usuario registrado exitosamente'
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

module.exports = { login, register };
