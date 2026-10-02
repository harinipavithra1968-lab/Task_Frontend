const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

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
          return done(new Error("Google email not available"));
        }

        // -----------------------------------
        // CREATE A SAFE USERNAME
        // -----------------------------------
        let username =
          email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") || "googleuser";

        if (username.length < 3) {
          username = `user${Date.now()}`;
        }

        // -----------------------------------
        // FIND EXISTING USER
        // -----------------------------------
        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: email },
          ],
        });

        // -----------------------------------
        // EXISTING USER
        // -----------------------------------
        if (user) {
          // If old account doesn't have username,
          // create one now.
          if (!user.username || user.username.trim() === "") {
            let newUsername = username;

            let usernameExists = await User.findOne({
              username: newUsername,
              _id: { $ne: user._id },
            });

            if (usernameExists) {
              newUsername = `${username}${Date.now()
                .toString()
                .slice(-5)}`;
            }

            user.username = newUsername;
          }

          user.googleId = profile.id;

          user.profileImage =
            profile.photos?.[0]?.value ||
            user.profileImage ||
            "";

          user.authProvider = "google";

          await user.save();

          console.log("Existing Google user logged in:", {
            id: user._id,
            username: user.username,
            email: user.email,
          });

          return done(null, user);
        }

        // -----------------------------------
        // MAKE SURE USERNAME IS UNIQUE
        // -----------------------------------
        let uniqueUsername = username;

        let usernameExists = await User.findOne({
          username: uniqueUsername,
        });

        if (usernameExists) {
          uniqueUsername = `${username}${Date.now()
            .toString()
            .slice(-5)}`;
        }

        // -----------------------------------
        // CREATE NEW GOOGLE USER
        // -----------------------------------
        user = new User({
          username: uniqueUsername,
          email: email,
          googleId: profile.id,
          profileImage:
            profile.photos?.[0]?.value || "",
          authProvider: "google",
        });

        console.log("NEW GOOGLE USER:", {
          username: user.username,
          email: user.email,
          googleId: user.googleId,
          authProvider: user.authProvider,
        });

        await user.save();

        console.log("New Google user created:", {
          id: user._id,
          username: user.username,
        });

        return done(null, user);
      } catch (error) {
        console.error("Google authentication error:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;