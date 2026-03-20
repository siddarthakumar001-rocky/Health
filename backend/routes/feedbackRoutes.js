const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const { user_id, rating, comment } = req.body;
    if (!user_id || !rating || !comment) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const feedback = new Feedback({ user_id, rating, comment });
    await feedback.save();
    res.status(201).json({ message: "Feedback saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
