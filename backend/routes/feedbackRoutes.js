const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../config/authMiddleware');

// POST /api/feedback
router.post('/', authMiddleware, feedbackController.createFeedback);

// GET /api/feedback
router.get('/', feedbackController.getFeedback);

module.exports = router;
