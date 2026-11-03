const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  console.error('FATAL: Variable de entorno SECRET_KEY no está definida. La aplicación no puede iniciar sin una clave secreta segura.');
  process.exit(1);
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  if (!token && req.query?.token) token = req.query.token;
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

module.exports = { verifyToken, SECRET_KEY };
