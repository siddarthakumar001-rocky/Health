const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const OnboardingData = require('../models/OnboardingData');
const HealthAnalysis = require('../models/HealthAnalysis');
const { checkCriticalConditions } = require('../services/ruleEngine');
const { predictCondition } = require('../services/predictionService');
const { getAyurvedicRecommendations } = require('../services/ayurvedaService');

/**
 * POST /api/ai/analyze
 * Full pipeline for health analysis
 */
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sensorData } = req.body;

    // 1. Fetch user's latest onboarding data
    const onboarding = await OnboardingData.findOne({ user_id: userId }).sort({ createdAt: -1 });

    if (!onboarding) {
      return res.status(404).json({ error: "Onboarding data not found. Please complete the assessment first." });
    }

    // 2. Run Rule Engine for critical checks
    const ruleResults = checkCriticalConditions(onboarding, sensorData);

    // 3. Run Prediction Service
    const prediction = predictCondition(onboarding, sensorData);

    // 4. Get Ayurvedic Recommendations
    const ayurveda = getAyurvedicRecommendations(prediction.condition);

    // 5. Build and Save Analysis Result
    const analysisResult = new HealthAnalysis({
      user_id: userId,
      condition: prediction.condition,
      severity: prediction.severity,
      riskLevel: prediction.riskLevel,
      recommendations: ayurveda,
      alerts: ruleResults.alerts,
      criticalFlags: ruleResults.criticalFlags,
      sensorData: sensorData || {},
      timestamp: new Date()
    });

    await analysisResult.save();

    res.json(analysisResult);
  } catch (err) {
    console.error("AI Analysis Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ai/latest
 * Fetch user's latest analysis
 */
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const analysis = await HealthAnalysis.findOne({ user_id: req.user.id }).sort({ timestamp: -1 });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ai/history
 * Fetch user's analysis history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await HealthAnalysis.find({ user_id: req.user.id }).sort({ timestamp: -1 }).limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
