const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(new Error('Google email not available'));
        }

        // Check existing user
        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: email },
          ],
        });

        if (user) {
          user.googleId = profile.id;
          user.profileImage =
            profile.photos?.[0]?.value || user.profileImage || '';
          user.authProvider = 'google';

          await user.save();

          return done(null, user);
        }

        // Always create username from email
        let username = email.split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        if (username.length < 3) {
          username = `user${Date.now()}`;
        }

        // Make username unique
        const usernameExists = await User.findOne({ username });

        if (usernameExists) {
          username = `${username}${Date.now().toString().slice(-5)}`;
        }

        console.log('GOOGLE USER:', {
          username,
          email,
          googleId: profile.id,
        });

        user = await User.create({
          username: username,
          email: email,
          googleId: profile.id,
          profileImage: profile.photos?.[0]?.value || '',
          authProvider: 'google',
        });

        return done(null, user);
      } catch (error) {
        console.error('Google authentication error:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;