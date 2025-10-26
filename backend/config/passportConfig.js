const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          // Create a new user if not found
          user = await User.create({
            githubId: profile.id,
            username: profile.username,
            avatar: profile.photos[0].value,
            accessToken: accessToken,
          });
        } else {
          // Update access token if user already exists
          user.accessToken = accessToken;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error('Error in GitHub Strategy:', err);
        done(err);
      }
    }
  )
);
