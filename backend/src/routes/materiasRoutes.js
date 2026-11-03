const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/materiasController');

router.use(verifyToken);
router.get('/', ctrl.getAll);

module.exports = router;
