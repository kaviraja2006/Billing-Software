const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Joi = require('joi');

// @desc    Get all products
// @route   GET /products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
    // Filter products by authenticated user's ID
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const response = products.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        brand: p.brand,
        price: p.price,
        stock: p.stock,
        unit: p.unit,
        description: p.description
    }));
    res.json(response);
});

// @desc    Get single product
// @route   GET /products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
    // Verify ownership
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });

    if (product) {
        res.json({
            id: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            brand: product.brand,
            price: product.price,
            stock: product.stock,
            unit: product.unit,
            description: product.description
        });
    } else {
        res.status(404);
        throw new Error('Product not found or unauthorized');
    }
});

// @desc    Create a product
// @route   POST /products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
    // Payload: { name, sku, category, price, stock, unit }
    const schema = Joi.object({
        name: Joi.string().required(),
        sku: Joi.string().required(),
        category: Joi.string().required(),
        price: Joi.number().required(),
        stock: Joi.number().required(),
        unit: Joi.string().allow('').optional(),
        brand: Joi.string().allow('').optional(),
        barcode: Joi.string().allow('').optional(),
        barcodeType: Joi.string().valid('CODE128', 'EAN13', 'UPC').default('CODE128').optional(),
        description: Joi.string().allow('').optional(),
        taxRate: Joi.number().optional(),
        costPrice: Joi.number().optional(),
        minStock: Joi.number().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { name, sku, category, price, stock, unit, brand, barcode, barcodeType, description, taxRate, costPrice, minStock } = req.body;

    // Check if sku exists for this user (SKU should be unique per user, not globally)
    const productExists = await Product.findOne({ sku, userId: req.user._id });
    if (productExists) {
        res.status(400);
        throw new Error('Product with this SKU already exists');
    }

    // Attach user ID
    const product = await Product.create({
        name,
        sku,
        category,
        price,
        stock,
        unit,
        brand,
        barcode,
        barcodeType,
        description,
        taxRate,
        costPrice,
        minStock,
        userId: req.user._id
    });

    res.status(201).json({
        id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        unit: product.unit,
        barcode: product.barcode,
        barcodeType: product.barcodeType,
        description: product.description,
        taxRate: product.taxRate,
        costPrice: product.costPrice,
        minStock: product.minStock
    });
});

// @desc    Update a product
// @route   PUT /products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
    // Verify ownership
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });

    if (product) {
        product.name = req.body.name || product.name;
        product.sku = req.body.sku || product.sku;
        product.category = req.body.category || product.category;
        product.price = req.body.price !== undefined ? req.body.price : product.price;
        product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
        product.unit = req.body.unit || product.unit;
        product.brand = req.body.brand !== undefined ? req.body.brand : product.brand;
        product.barcode = req.body.barcode !== undefined ? req.body.barcode : product.barcode;
        product.barcodeType = req.body.barcodeType || product.barcodeType;
        product.description = req.body.description !== undefined ? req.body.description : product.description;
        product.taxRate = req.body.taxRate !== undefined ? req.body.taxRate : product.taxRate;
        product.costPrice = req.body.costPrice !== undefined ? req.body.costPrice : product.costPrice;
        product.minStock = req.body.minStock !== undefined ? req.body.minStock : product.minStock;

        const updatedProduct = await product.save();
        res.json({
            id: updatedProduct._id,
            name: updatedProduct.name,
            sku: updatedProduct.sku,
            category: updatedProduct.category,
            brand: updatedProduct.brand,
            price: updatedProduct.price,
            stock: updatedProduct.stock,
            unit: updatedProduct.unit,
            barcode: updatedProduct.barcode,
            barcodeType: updatedProduct.barcodeType,
            description: updatedProduct.description
        });
    } else {
        res.status(404);
        throw new Error('Product not found or unauthorized');
    }
});

// @desc    Delete a product
// @route   DELETE /products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
    // Verify ownership
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });

    if (product) {
        await product.deleteOne();
        res.json({ message: 'Product deleted successfully' });
    } else {
        res.status(404);
        throw new Error('Product not found or unauthorized');
    }
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
