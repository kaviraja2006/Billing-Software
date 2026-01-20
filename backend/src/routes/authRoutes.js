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

    // Redirect back to Electron via custom protocol
    res.redirect(`billing://auth?token=${token}`);

  }
);

router.get("/google/failure", (req, res) => {
  res.status(401).send("Google authentication failed");
});

module.exports = router;
