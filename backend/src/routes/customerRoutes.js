const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchDuplicates,
} = require("../controllers/customerController");


router.get("/", protect, getCustomers);
router.get("/search-duplicates", protect, searchDuplicates);
router.get("/:id", protect, getCustomerById);
router.post("/", protect, createCustomer);
router.put("/:id", protect, updateCustomer);
router.delete("/:id", protect, deleteCustomer);

module.exports = router;
