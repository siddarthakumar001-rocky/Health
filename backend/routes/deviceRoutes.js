const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../config/authMiddleware');

router.get('/', authMiddleware, deviceController.getDevices);
router.post('/', authMiddleware, deviceController.upsertDevice);

module.exports = router;
