const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  heartRate: { 
    type: Number, 
    required: true 
  },
  spo2: { 
    type: Number, 
    required: true 
  },
  temperature: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Index for faster querying by user and latest first
healthDataSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('HealthData', healthDataSchema);
