exports.getHealthData = async (req, res) => {
  // Return mock data for the dashboard
  const data = Array.from({length: 50}, (_, i) => ({
    heart_rate: 65 + Math.floor(Math.random() * 20),
    spo2: 95 + Math.floor(Math.random() * 5),
    temperature: 36.5 + Math.random(),
    timestamp: new Date(Date.now() - (49 - i) * 60000).toISOString()
  }));
  res.json(data);
};
