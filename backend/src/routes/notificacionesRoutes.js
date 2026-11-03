const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/notificacionesController');

router.use(verifyToken);
router.get('/', ctrl.getNotificaciones);

module.exports = router;

