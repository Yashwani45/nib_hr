// backend/routes/auth.routes.js
const express = require('express');
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const verifyJWT = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh-token', refresh);
router.post('/logout', verifyJWT, logout);

module.exports = router;
