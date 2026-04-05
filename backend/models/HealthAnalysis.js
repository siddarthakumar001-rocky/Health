const mongoose = require('mongoose');

const healthAnalysisSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  condition: { type: String, required: true },
  severity: { type: Number, required: true }, // 0-100
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  dominantDosha: { type: String },
  recommendations: {
    medicines: [{ name: String, benefit: String }],
    lifestyleTips: [String],
    dietTips: [String],
    doshaAdvice: String,
    disclaimer: String
  },
  alerts: [{
    type: { type: String },
    severity: String,
    message: String,
    priority: String
  }],
  criticalFlags: [String],
  sensorData: {
    heartRate: Number,
    spo2: Number,
    temperature: Number
  },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for faster lookups
healthAnalysisSchema.index({ user_id: 1, timestamp: -1 });

module.exports = mongoose.model('HealthAnalysis', healthAnalysisSchema);
