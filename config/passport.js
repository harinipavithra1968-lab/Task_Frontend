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
          return done(new Error('Google account email not available'));
        }

        // Check if this Google account already exists
        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: email },
          ],
        });

        if (user) {
          // Connect existing account to Google
          if (!user.googleId) {
            user.googleId = profile.id;
          }

          user.profileImage = profile.photos?.[0]?.value || user.profileImage;
          user.authProvider = 'google';

          await user.save();

          return done(null, user);
        }

        // Create username from Google name
        let username =
          profile.displayName
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 20) || 'googleuser';

        // Make username unique
        let usernameExists = await User.findOne({ username });

        if (usernameExists) {
          username = `${username}${Date.now().toString().slice(-4)}`;
        }

        // Create new Google user
        user = await User.create({
          username,
          email,
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