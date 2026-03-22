/**
 * Prediction Service for Health Analysis
 * Uses a weighted scoring system to mimic XGBoost logic for condition prediction.
 */

const CONDITIONS = {
  NORMAL: "Normal",
  STRESS: "High Stress",
  FATIGUE: "Fatigue",
  INFECTION: "Possible Infection",
  CARDIAC_RISK: "Cardiac Risk",
  LIFESTYLE_RISK: "Lifestyle Health Risk"
};

const predictCondition = (onboardingData, sensorData = {}) => {
  // 1. Data Cleaning & Feature Engineering
  const age = parseInt(onboardingData.age) || 30;
  const sleepHoursArr = onboardingData.sleep_hours || [7];
  const sleepHours = sleepHoursArr[0];
  const smoking = onboardingData.smoking || 'never';
  const alcohol = onboardingData.alcohol || 'never';
  const symptoms = onboardingData.common_symptoms || [];
  const existingConditions = onboardingData.conditions || [];
  
  const heartRate = sensorData.heartRate || 75;
  const spo2 = sensorData.spo2 || 98;
  const temp = sensorData.temperature || 37;

  // 2. Weighted Scoring per Condition
  let scores = {
    [CONDITIONS.NORMAL]: 10,
    [CONDITIONS.STRESS]: 0,
    [CONDITIONS.FATIGUE]: 0,
    [CONDITIONS.INFECTION]: 0,
    [CONDITIONS.CARDIAC_RISK]: 0,
    [CONDITIONS.LIFESTYLE_RISK]: 0
  };

  // Stress Feature Weights
  if (onboardingData.headache_type && onboardingData.headache_type !== 'none') scores[CONDITIONS.STRESS] += 25;
  if (onboardingData.low_energy) scores[CONDITIONS.STRESS] += 15;
  if (sleepHours < 6) scores[CONDITIONS.STRESS] += 20;
  if (heartRate > 90) scores[CONDITIONS.STRESS] += 15;
  if (symptoms.includes('Dizziness')) scores[CONDITIONS.STRESS] += 15;

  // Fatigue Feature Weights
  if (onboardingData.low_energy) scores[CONDITIONS.FATIGUE] += 30;
  if (onboardingData.physical_exhaustion) scores[CONDITIONS.FATIGUE] += 25;
  if (sleepHours < 5) scores[CONDITIONS.FATIGUE] += 30;
  if (symptoms.includes('Fatigue')) scores[CONDITIONS.FATIGUE] += 20;

  // Infection Feature Weights
  if (temp > 37.5) scores[CONDITIONS.INFECTION] += 40;
  if (symptoms.includes('Fever')) scores[CONDITIONS.INFECTION] += 30;
  if (symptoms.includes('Body Ache')) scores[CONDITIONS.INFECTION] += 15;
  if (symptoms.includes('Cough (with sputum)') || symptoms.includes('Cough (without sputum)')) scores[CONDITIONS.INFECTION] += 15;

  // Cardiac Risk Weights
  if (existingConditions.includes('Hypertension')) scores[CONDITIONS.CARDIAC_RISK] += 25;
  if (existingConditions.includes('Heart Disease')) scores[CONDITIONS.CARDIAC_RISK] += 30;
  if (onboardingData.has_bp) scores[CONDITIONS.CARDIAC_RISK] += 20;
  if (smoking === 'regularly') scores[CONDITIONS.CARDIAC_RISK] += 15;
  if (age > 50) scores[CONDITIONS.CARDIAC_RISK] += 10;
  if (onboardingData.chest_pain_side && onboardingData.chest_pain_side !== 'none') scores[CONDITIONS.CARDIAC_RISK] += 30;

  // Lifestyle Risk Weights
  if (smoking === 'regularly') scores[CONDITIONS.LIFESTYLE_RISK] += 30;
  if (alcohol === 'regularly') scores[CONDITIONS.LIFESTYLE_RISK] += 30;
  if (onboardingData.outside_food_intake === 'daily') scores[CONDITIONS.LIFESTYLE_RISK] += 20;
  if (existingConditions.includes('Diabetes')) scores[CONDITIONS.LIFESTYLE_RISK] += 20;

  // 3. Selection Logic (Highest Score Wins)
  let bestCondition = CONDITIONS.NORMAL;
  let maxScore = 0;

  for (const [condition, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCondition = condition;
    }
  }

  // Normalize severity (0-100)
  const severity = Math.min(maxScore, 100);
  
  let riskLevel = "low";
  if (severity > 70) riskLevel = "high";
  else if (severity > 40) riskLevel = "medium";

  return {
    condition: bestCondition,
    severity,
    riskLevel,
    rawScores: scores
  };
};

module.exports = { predictCondition };
