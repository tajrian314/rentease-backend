const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if(!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email });
    if(exists) return res.status(400).json({ message: 'Account already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(20).toString('hex');
    const user = await User.create({ name, email, password: hashed, role, verifyToken });
    const link = `${process.env.FRONTEND_URL}/auth-verify?token=${verifyToken}`; // frontend page for verify
    await sendEmail(email, 'Verify your RentEase account', `<p>Click to verify: <a href="${link}">${link}</a></p>`);
    res.status(201).json({ message: 'Registered — verification email sent' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// verify
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verifyToken: token });
    if(!user) return res.status(400).json({ message: 'Invalid token' });
    user.isVerified = true;
    user.verifyToken = undefined;
    await user.save();
    res.json({ message: 'Email verified' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if(!email || !password) return res.status(400).json({ message: 'Missing credentials' });
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ message: 'Account not found' });
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).json({ message: 'Incorrect password' });
    if(!user.isVerified) return res.status(403).json({ message: 'Please verify your email' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// forgot password
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if(!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    if(!user) return res.json({ message: 'If email exists, reset sent' });
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail(email, 'Reset your RentEase password', `<p>Reset link: <a href="${link}">${link}</a></p>`);
    res.json({ message: 'If email exists, reset sent' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// reset
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if(!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
