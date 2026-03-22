const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const UserDevice = require('../models/UserDevice');
const authMiddleware = require('../config/authMiddleware');

// 1. POST /api/device/register
// Register device on startup
router.post('/register', async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId is required" });

    // Find or create device (do not overwrite existing)
    let device = await Device.findOne({ deviceId });
    if (!device) {
      device = new Device({ deviceId, status: 'offline', lastSeen: new Date() });
      await device.save();
      return res.status(201).json({ message: "Device registered", device });
    }
    
    res.json({ message: "Device already registered", device });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/device/data
// Update status and lastSeen from ESP32
router.post('/data', async (req, res) => {
  try {
    const { deviceId, heartRate, spo2, temperature } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId is required" });

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { status: 'online', lastSeen: new Date() },
      { upsert: true, new: true }
    );

    // Optional: Log health data if needed (similar to previous task)
    // For this specific task, we mainly update registry status.
    
    res.json({ message: "Status updated", device });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/device
// List all devices
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastSeen: -1 });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/device/connect
// Map a user to a device
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { userId, deviceId } = req.body;
    if (!userId || !deviceId) return res.status(400).json({ error: "userId and deviceId are required" });

    const mapping = await UserDevice.findOneAndUpdate(
      { userId, deviceId },
      { userId, deviceId },
      { upsert: true, new: true }
    );

    res.json({ message: "Device connected to user", mapping });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
