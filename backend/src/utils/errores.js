// Respuestas de error comunes para los controladores.

// true si el error viene de una validación del modelo (valor fuera de los permitidos, campo vacío, etc.)
const esErrorDeValidacion = (err) => err && err.name === 'SequelizeValidationError';

// Responde 400 indicando qué campos no son válidos
const responderValidacion = (res, err) =>
  res.status(400).json({ mensaje: 'Datos no válidos: ' + err.errors.map((e) => e.path).join(', ') });

module.exports = { esErrorDeValidacion, responderValidacion };
