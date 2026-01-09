const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    fixIndexes
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Temp route to fix indexes - Ensure this is placed BEFORE /:id
router.get('/fix-indexes', fixIndexes);

router.route('/').get(protect, getProducts).post(protect, createProduct);
router
    .route('/:id')
    .get(protect, getProductById)
    .put(protect, updateProduct)
    .delete(protect, deleteProduct);

module.exports = router;
