const express = require("express");
const passport = require("passport");
const generateToken = require("../utils/generateToken");
const {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Normal auth
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getUserProfile);

// ===============================
// GOOGLE OAUTH (DESKTOP / ELECTRON)
// ===============================

// Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google/failure",
  }),
  (req, res) => {
    const token = generateToken(req.user._id);

    // Check User-Agent to determine environment
    // Electron apps typically append 'Electron/...' to the UA string
    // Check for 'state' query param to determine redirect target
    // Passport google strategy usually handles state, but we can also just check req.query.state if we passed it manually in the first call?
    // Actually, getting state back from Google requires enabling it in the initial call.

    // Simpler approach for now: Check if the request origin/referrer implies web? 
    // Or we can rely on a cookie set before the auth request?

    // Let's use a simple query param on the CALLBACK itself? No, Google calls the callback.
    // We need to pass 'state' to Google.

    // For now, let's just support both by defaulting to Web if we can't tell, or checking specifically.
    // Actually, Electron user agent might be distinct?

    const userAgent = req.headers['user-agent'] || '';
    const isElectron = userAgent.includes('Electron');

    if (isElectron) {
      // Redirect back to Electron via custom protocol
      res.redirect(`billing://auth?token=${token}`);
    } else {
      // Default to Web
      // Assuming Vite dev server port 5173 or production URL
      // Better to set this in ENV, but hardcoded for now matches user context
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      // FIX: Use HashRouter syntax /#/
      res.redirect(`${frontendUrl}/#/oauth-success?token=${token}`);
    }
  }
);

router.get("/google/failure", (req, res) => {
  res.status(401).send("Google authentication failed");
});

module.exports = router;
