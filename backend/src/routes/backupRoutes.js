const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { triggerBackup, getBackupStatus } = require("../controllers/backupController");

router.post("/trigger", protect, triggerBackup);
router.get("/status", protect, getBackupStatus);

module.exports = router;
