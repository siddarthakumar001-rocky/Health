const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../config/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/user', authMiddleware, authController.getUser);

module.exports = router;
