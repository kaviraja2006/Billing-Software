const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("❌ MISSING GOOGLE OAUTH CREDENTIALS in .env");
} else {
  console.log("✅ Google Strategy: Credentials found.");
  console.log("   Client ID:", process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "...");
  console.log("   Callback URL:", process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error("❌ Google Login Failed: No email in profile");
          return done(new Error("Google account has no email"));
        }

        const user = {
          name: profile.displayName || "Google User",
          email,
          googleSub: profile.id, // 🔑 used for SQLite
        };

        done(null, user);
      } catch (err) {
        console.error("❌ Google Strategy Error:", err);
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

// Restore user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});
