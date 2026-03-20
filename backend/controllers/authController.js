const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

exports.signup = async (req, res) => {
  try {
    const { email, password, data } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, ...data });
    await newUser.save();

    res.status(201).json({ user: { id: newUser._id, email: newUser.email, user_metadata: data } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Check onboarding
    const OnboardingData = require('../models/OnboardingData');
    const onboarding = await OnboardingData.findOne({ user_id: user._id });
    
    res.json({
      session: { access_token: token },
      user: { id: user._id, email: user.email, user_metadata: { name: user.name, phone: user.phone, age: user.age, gender: user.gender } },
      onboarding_completed: !!onboarding
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, email: user.email, user_metadata: { name: user.name, phone: user.phone, age: user.age, gender: user.gender } } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
