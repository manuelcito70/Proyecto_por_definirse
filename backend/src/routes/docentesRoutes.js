const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/docentesController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/docentes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.use(verifyToken);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.get('/:id/archivos', ctrl.getArchivos);
router.post('/:id/archivos', upload.single('archivo'), ctrl.uploadArchivo);
router.get('/:id/archivos/:archivoId/download', ctrl.downloadArchivo);
router.delete('/:id/archivos/:archivoId', ctrl.deleteArchivo);

module.exports = router;
