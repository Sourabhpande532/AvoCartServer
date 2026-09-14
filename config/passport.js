const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../model/User');
require('dotenv').config();

// ─── GOOGLE ────
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || 'https://avo-cart-server.vercel.app/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || null;
      let user = await User.findOne({ googleId: profile.id });

      if (!user && email) {
        // Find existing user by email to link Google account instead of failing with duplicate key error
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
        }
      }

      if (!user) {
        user = await User.create({
          name: profile.displayName || "Google User",
          email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || null,
          provider: 'google',
        });
      }

      return done(null, user);
    } catch (err) {
      console.error("Google Strategy Error:", err.message);
      return done(err, null);
    }
  }
));

// ─── GITHUB ────
passport.use(new GitHubStrategy(
  {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://avo-cart-server.vercel.app/auth/github/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || null;
      let user = await User.findOne({ githubId: profile.id });

      if (!user && email) {
        user = await User.findOne({ email });
        if (user) {
          user.githubId = profile.id;
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
        }
      }

      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username || "GitHub User",
          email,
          githubId: profile.id,
          avatar: profile.photos?.[0]?.value || null,
          provider: 'github',
        });
      }

      return done(null, user);
    } catch (err) {
      console.error("GitHub Strategy Error:", err.message);
      return done(err, null);
    }
  }
));

module.exports = passport;
