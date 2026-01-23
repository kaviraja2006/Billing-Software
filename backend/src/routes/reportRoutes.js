const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  getDashboardStats,
  getFinancials,
  getTopProducts,
} = require("../controllers/reportController");

router.get("/dashboard", protect, getDashboardStats);
router.get("/financials", protect, getFinancials);
router.get("/top-products", protect, getTopProducts);

module.exports = router;
