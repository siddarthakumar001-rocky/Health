const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const UserDevice = require('../models/UserDevice');
const HealthData = require('../models/HealthData');
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

    // 1. Update/Create Device status
    const device = await Device.findOneAndUpdate(
      { deviceId },
      { status: 'online', lastSeen: new Date() },
      { upsert: true, new: true }
    );

    // 2. Find associated user and save health data
    const mapping = await UserDevice.findOne({ deviceId });
    if (mapping && heartRate !== undefined && spo2 !== undefined && temperature !== undefined) {
      const newHealthRecord = new HealthData({
        userId: mapping.userId,
        heartRate,
        spo2,
        temperature
      });
      await newHealthRecord.save();
      console.log(`[IoT] Saved data for User: ${mapping.userId} via Device: ${deviceId}`);
    } else if (!mapping) {
      console.log(`[IoT] Received data for unmapped Device: ${deviceId}`);
    }
    
    res.json({ message: "Status updated", device });
  } catch (err) {
    console.error("Device data update error:", err);
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

// 5. GET /api/device/:userId
// Fetch latest health readings for a specific user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Safety check: Ensure the requester is viewing their own data
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const data = await HealthData.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    // Format for Dashboard: reverse for chart (oldest to newest)
    const formattedData = data.map(record => ({
      heart_rate: record.heartRate,
      spo2: record.spo2,
      temperature: record.temperature,
      timestamp: record.createdAt.toISOString()
    })).reverse();

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
