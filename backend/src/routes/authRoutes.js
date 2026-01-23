const express = require("express");
const passport = require("passport");
const generateToken = require("../utils/generateToken");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google callback
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err) {
        console.error("❌ Passport Auth Error:", err);
        return res.redirect("/auth/google/failure?reason=error");
      }
      if (!user) {
        console.error("❌ Passport Auth Failed: No user returned", info);
        return res.redirect("/auth/google/failure?reason=no_user");
      }

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
  const reason = req.query.reason || "unknown";
  console.error("❌ Auth Failure Route Hit. Reason:", reason);
  res.status(401).json({ message: "Google authentication failed", reason });
});

// Get current authenticated user
router.get("/me", protect, (req, res) => {
  // req.user is set by the protect middleware after verifying JWT
  res.json({
    email: req.user.email,
    googleSub: req.user.googleSub,
  });
});

// Logout endpoint
router.post("/logout", (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  // But we provide this endpoint for consistency
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
