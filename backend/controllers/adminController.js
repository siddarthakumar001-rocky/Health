const User = require('../models/User');
const Feedback = require('../models/Feedback');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

exports.adminLogin = (req, res) => {
  const { username, password } = req.body;
  console.log("Admin login attempt:", req.body);

  if (username === "admin" && password === "admin@@@123") {
    // Generate a real JWT so protected admin routes can verify it
    const token = jwt.sign(
      { id: 'admin', role: 'admin', username: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.status(200).json({
      success: true,
      token
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid admin credentials"
  });
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const users = await User.find({}, 'loginCount');
    const totalLogins = users.reduce((sum, user) => sum + (user.loginCount || 0), 0);
    const totalFeedbacks = await Feedback.countDocuments();

    res.json({ totalUsers, totalLogins, totalFeedbacks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { email, role });
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find({}, 'email role loginCount lastLogin createdAt');
    let csv = "Email,Role,Login Count,Last Login,Created At\n";
    users.forEach(u => {
      csv += `${u.email},${u.role},${u.loginCount || 0},${u.lastLogin ? u.lastLogin.toISOString() : "Never"},${u.createdAt.toISOString()}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportFeedbackCSV = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    let csv = "Username,Rating,Suggestion,Date,Time\n";
    feedbacks.forEach(f => {
      const date = new Date(f.createdAt);
      csv += `${f.username},${f.rating},"${f.comment.replace(/"/g, '""')}",${date.toLocaleDateString()},${date.toLocaleTimeString()}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=feedback.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
