const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  device_id: { type: String, required: true },
  status: { type: String, default: 'connected' },
}, { 
  strict: false, 
  timestamps: true 
});

// Ensure a user can't have duplicate device records for the same device_id
deviceSchema.index({ user_id: 1, device_id: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);
