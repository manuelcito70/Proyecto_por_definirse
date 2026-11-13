const multer = require('multer');

// Errores de la subida de archivos (multer): responde con un mensaje claro en vez de un error 500.
// Se registra después de las rutas en server.js.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ mensaje: 'El archivo supera el límite de 20 MB.' });
    }
    return res.status(400).json({ mensaje: `Error al subir el archivo: ${err.message}` });
  }
  return next(err);
};
