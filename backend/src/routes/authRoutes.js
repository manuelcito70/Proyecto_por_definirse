const express = require('express');
const router = express.Router();
const { login, register, verifyEmail, resendVerification } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;
