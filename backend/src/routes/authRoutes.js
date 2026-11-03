const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

router.post('/login', login);
router.post('/register', verifyToken, requireRole('superadmin'), register);

module.exports = router;
