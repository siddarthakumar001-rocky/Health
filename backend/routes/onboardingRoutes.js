const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const authMiddleware = require('../config/authMiddleware');

router.get('/', authMiddleware, onboardingController.getOnboarding);
router.post('/', authMiddleware, onboardingController.saveOnboarding);

module.exports = router;
