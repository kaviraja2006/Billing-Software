const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth env variables are missing");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("GOOGLE PROFILE:", JSON.stringify(profile, null, 2));

        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : null;

        if (!email) {
          return done(new Error("Google account has no email"));
        }

        const googleId = profile.id;
        const name = profile.displayName || "Google User";

        let user = await User.findOne({
          $or: [{ email }, { googleId }],
        });

        if (!user) {
          user = await User.create({
            name,
            email,
            googleId,
            role: "employee",
          });
        } else if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
