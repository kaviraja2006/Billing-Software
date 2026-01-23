const express = require("express");
const router = express.Router();

const {
  getExpenses,
  createExpense,
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getExpenses);
router.post("/", protect, createExpense);

module.exports = router;
