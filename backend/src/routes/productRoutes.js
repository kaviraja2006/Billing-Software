const express = require("express");
const router = express.Router();

const {
  getProducts,
  createProduct,
  updateStock,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getProducts);
router.post("/", protect, createProduct);
router.put("/:id/stock", protect, updateStock);

module.exports = router;
