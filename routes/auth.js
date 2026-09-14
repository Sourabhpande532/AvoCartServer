const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../model/User');
require('dotenv').config();

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, name: user.name, isGuest: user.isGuest },
    process.env.JWT_SECRET || "fallback_jwt_secret",
    { expiresIn: '7d' }
  );

// ─── SIGN UP ────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, provider: 'local' });
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ success: false, message: 'Signup failed.', error: err.message });
  }
});

// ─── SIGN IN ───
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = signToken(user);
    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      data: { token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } },
    });
  } catch (err) {
    console.error('Signin error:', err.message);
    return res.status(500).json({ success: false, message: 'Signin failed.', error: err.message });
  }
});

// ─── GUEST LOGIN ───
router.post('/guest', async (req, res) => {
  try {
    const guestName = `Guest_${Date.now()}`;
    const user = await User.create({ name: guestName, provider: 'guest', isGuest: true });
    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: 'Continuing as guest.',
      data: { token, user: { id: user._id, name: user.name, email: null, avatar: null, isGuest: true } },
    });
  } catch (err) {
    console.error('Guest login error:', err.message);
    return res.status(500).json({ success: false, message: 'Guest login failed.', error: err.message });
  }
});

// ─── GET CURRENT USER (me) ───
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_jwt_secret");
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({
      success: true,
      data: { user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, isGuest: user.isGuest } },
    });
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid token.' });
  }
});

// ─── GOOGLE OAUTH ────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://avo-cart-client.vercel.app';
    if (err || !user) {
      console.error("Google Auth Callback Error:", err?.message || info);
      return res.redirect(`${frontendUrl}/auth?error=google_failed`);
    }
    const token = signToken(user);
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  })(req, res, next);
});

// ─── GITHUB OAUTH ────
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, user, info) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://avo-cart-client.vercel.app';
    if (err || !user) {
      console.error("GitHub Auth Callback Error:", err?.message || info);
      return res.redirect(`${frontendUrl}/auth?error=github_failed`);
    }
    const token = signToken(user);
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  })(req, res, next);
});

module.exports = router;
