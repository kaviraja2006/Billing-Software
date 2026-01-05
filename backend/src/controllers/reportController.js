const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const Expense = require('../models/expenseModel');
const Customer = require('../models/customerModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

// @desc    Get dashboard stats
// @route   GET /reports/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // All queries filtered by userId
    const [totalSalesResult, activetCustomers, totalOrders, pendingInvoices, lowStockResult] = await Promise.all([
        Invoice.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]),
        Customer.countDocuments({ userId }),
        Invoice.countDocuments({ userId }),
        Invoice.countDocuments({ userId, status: 'Pending' }),
        Product.countDocuments({ userId, stock: { $lt: 10 } })
    ]);

    const totalSales = totalSalesResult[0] ? totalSalesResult[0].total : 0;

    res.json({
        totalSales,
        totalOrders,
        activeCustomers,
        pendingInvoices,
        lowStockItems: lowStockResult
    });
});

// @desc    Get financials  
// @route   GET /reports/financials
// @access  Private
const getFinancials = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [salesResult, expensesResult, countResult] = await Promise.all([
        Invoice.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Expense.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        Invoice.countDocuments({ userId })
    ]);

    const totalSales = salesResult[0] ? salesResult[0].total : 0;
    const totalOrders = countResult;
    const totalExpenses = expensesResult[0] ? expensesResult[0].total : 0;

    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const netProfit = totalSales - totalExpenses;

    res.json({
        totalSales,
        totalOrders,
        avgOrderValue,
        totalExpenses,
        netProfit
    });
});

// @desc    Get sales trend
// @route   GET /reports/sales-trend
// @access  Private
const getSalesTrend = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const trend = await Invoice.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                sales: { $sum: "$total" }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                date: "$_id",
                sales: 1,
                _id: 0
            }
        }
    ]);

    res.json(trend);
});

// @desc    Get payment methods
// @route   GET /reports/payment-methods
// @access  Private
const getPaymentMethods = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const stats = await Invoice.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$paymentMethod",
                value: { $sum: "$total" }
            }
        },
        {
            $project: {
                name: { $ifNull: ["$_id", "Other"] },
                value: 1,
                _id: 0
            }
        }
    ]);
    res.json(stats);
});

// @desc    Get top products
// @route   GET /reports/top-products
// @access  Private
const getTopProducts = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const topProducts = await Invoice.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.name",
                quantity: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.total" }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
            $project: {
                name: "$_id",
                quantity: 1,
                revenue: 1,
                _id: 0
            }
        }
    ]);
    res.json(topProducts);
});

module.exports = {
    getDashboardStats,
    getFinancials,
    getSalesTrend,
    getPaymentMethods,
    getTopProducts
};
