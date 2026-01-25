const express = require("express");
const router = express.Router();

const {
  getInvoices,
  createInvoice,
  getInvoiceStats,
} = require("../controllers/invoiceController");

const { protect } = require("../middleware/authMiddleware");

router.get("/stats", protect, getInvoiceStats);
router.get("/", protect, getInvoices);
router.post("/", protect, createInvoice);

module.exports = router;
