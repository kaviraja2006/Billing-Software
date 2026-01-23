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

      // ✅ CREATE JWT
      const token = generateToken({
        email: user.email,
        googleSub: user.googleSub,
      });

      console.log("✅ Auth Success, Redirecting to billing:// with token");
      // ✅ REDIRECT BACK TO ELECTRON
      return res.redirect(`billing://auth?token=${token}`);
    })(req, res, next);
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
