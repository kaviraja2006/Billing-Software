const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const Product = require('../models/productModel');
const Customer = require('../models/customerModel');
const Joi = require('joi');

// @desc    Get all invoices
// @route   GET /invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({}).sort({ date: -1 });
    const response = invoices.map(inv => ({
        id: inv._id,
        customerName: inv.customerName,
        date: inv.date,
        total: inv.total,
        status: inv.status
    }));
    res.json(response);
});

// @desc    Get single invoice
// @route   GET /invoices/:id
// @access  Private
const getInvoiceById = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
        res.json({
            id: invoice._id,
            customerName: invoice.customerName,
            customerId: invoice.customerId,
            date: invoice.date,
            items: invoice.items.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            })),
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            discount: invoice.discount,
            total: invoice.total,
            status: invoice.status
        });
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});

// @desc    Create invoice
// @route   POST /invoices
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        customerId: Joi.string().allow('').optional(), // ObjectId as string or empty
        customerName: Joi.string().required(),
        date: Joi.date().required(),
        items: Joi.array().items(
            Joi.object({
                productId: Joi.string().required(),
                name: Joi.string().required(),
                quantity: Joi.number().min(1).required(),
                price: Joi.number().required(),
                total: Joi.number().required() // We verify this
            })
        ).min(1).required(),
        subtotal: Joi.number().required(),
        tax: Joi.number().required(),
        discount: Joi.number().min(0).optional(),
        total: Joi.number().required(),
        paymentMethod: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    let { customerId, customerName, date, items, subtotal, tax, discount = 0, total, paymentMethod } = req.body;

    // Recalculate totals and check stock
    let calcSubtotal = 0;
    const finalItems = [];

    // We need to process items sequentially to check stock and deduct
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            res.status(400);
            throw new Error(`Product not found: ${item.name}`);
        }

        if (product.stock < item.quantity) {
            res.status(400);
            throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}`);
        }

        // Verify item total
        const lineTotal = item.quantity * item.price; // or product.price? Frontend allowed editing price maybe? Contract checks strictly.
        // Usually price is what's sold. We'll trust price in payload BUT check logic.
        // Wait, requirements say "recalculated from items".
        // If we use payload price, we are trusting frontend price.
        // But price might be dynamic (discounted per item).
        // Let's use payload info but recalculate totals.

        calcSubtotal += lineTotal;

        finalItems.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            price: item.price,
            total: lineTotal
        });

        // Deduct Stock
        product.stock -= item.quantity;
        await product.save();
    }

    // Recalc Final Total
    // Tax is usually passed from frontend based on settings?
    // Backend doesn't know tax rules easily without fetching settings.
    // The requirement says "recalculated from items".
    // I will verify subtotal matches. I will accept tax/discount but ensure (subtotal + tax - discount) ~ total.

    // allow small float diffs
    const epsilon = 0.01;
    if (Math.abs(calcSubtotal - subtotal) > epsilon) {
        // Just warn or fix? "server-verified" implies strict.
        // Let's use calculated subtotal.
        subtotal = calcSubtotal;
    }

    const calcTotal = subtotal + tax - discount;

    const invoice = await Invoice.create({
        customerId: customerId || null,
        customerName,
        date,
        items: finalItems,
        subtotal,
        tax,
        discount,
        total: calcTotal,
        status: 'Paid',
        paymentMethod
    });

    // Update Customer Stats if customerId exists
    if (customerId) {
        const customer = await Customer.findById(customerId);
        if (customer) {
            customer.totalSpent += calcTotal;
            customer.totalVisits += 1;
            await customer.save();
        }
    }

    res.status(201).json({
        id: invoice._id,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        date: invoice.date,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod
    });
});

module.exports = {
    getInvoices,
    getInvoiceById,
    createInvoice,
};
