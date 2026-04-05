/**
 * Rule-based Engine for Critical Health Condition Detection
 * This service identifies emergency-level risks that must be flagged immediately.
 */

const checkCriticalConditions = (onboardingData, sensorData = {}) => {
  const alerts = [];
  const criticalFlags = [];

  // 1. CARDIAC RISK CHECK
  if (
    onboardingData.chest_pain_side && 
    onboardingData.chest_pain_side !== 'none' && 
    onboardingData.chest_pressure === true
  ) {
    criticalFlags.push('POSSIBLE_CARDIAC_ISSUE');
    alerts.push({
      type: 'cardiac_risk',
      severity: 'high',
      message: 'Persistent chest pain combined with pressure detected. Immediate medical consultation advised.'
    });
  }

  if (onboardingData.cardiac_arrest_history === true) {
    criticalFlags.push('HISTORY_OF_CARDIAC_ARREST');
    alerts.push({
      type: 'cardiac_history',
      severity: 'moderate',
      message: 'User has a history of cardiac arrest. Regular monitoring is essential.'
    });
  }

  // 2. NEUROLOGICAL RISK CHECK
  const neuroSymptoms = onboardingData.common_symptoms || [];
  if (
    onboardingData.stroke_history === true && 
    (neuroSymptoms.includes('numbness') || neuroSymptoms.includes('tingling') || neuroSymptoms.includes('dizziness'))
  ) {
    criticalFlags.push('NEUROLOGICAL_RISK');
    alerts.push({
      type: 'neuro_risk',
      severity: 'high',
      message: 'Neurological symptoms (numbness/dizziness) detected in a user with stroke history. High stroke recurrence risk.'
    });
  }

  // 3. RESPIRATORY DISTRESS CHECK
  if (onboardingData.conditions && onboardingData.conditions.includes('asthma')) {
    if (sensorData.spo2 && sensorData.spo2 < 92) {
      criticalFlags.push('RESPIRATORY_DISTRESS');
      alerts.push({
        type: 'respiratory_risk',
        severity: 'high',
        message: 'Low oxygen levels (SpO2) detected in an asthmatic user.'
      });
    }
  }

  // 4. SENSOR THRESHOLD ALERTS (REAL-TIME)
  if (sensorData.heartRate > 120) {
    alerts.push({
      priority: 'high',
      type: 'tachycardia',
      message: 'High Heart Rate Detected (> 120 BPM)'
    });
  }

  if (sensorData.spo2 && sensorData.spo2 < 90) {
    alerts.push({
      priority: 'critical',
      type: 'hypoxia',
      message: 'Critical Low SpO2 Detected (< 90%)'
    });
  }

  if (sensorData.temperature > 39) {
    alerts.push({
      priority: 'high',
      type: 'high_fever',
      message: 'High Body Temperature Detected (> 39°C)'
    });
  }

  return {
    alerts,
    criticalFlags,
    riskLevel: alerts.some(a => a.severity === 'high' || a.priority === 'critical') ? 'high' : 
               alerts.length > 0 ? 'moderate' : 'low'
  };
};

module.exports = { checkCriticalConditions };
