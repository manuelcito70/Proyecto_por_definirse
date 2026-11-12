const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/convocatoriasController');

router.use(verifyToken);
router.get('/', ctrl.getAll);
router.get('/:id/fases', ctrl.getFases);
router.put('/:id/fases/:idFase', ctrl.registrarFase);
router.delete('/:id/fases/:idFase', ctrl.quitarFase);

module.exports = router;
