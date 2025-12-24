const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const Expense = require('../models/expenseModel');
const Customer = require('../models/customerModel');
const Product = require('../models/productModel');

// @desc    Get dashboard stats
// @route   GET /reports/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    // Parallel execution for performance
    const [totalSalesResult, activeCustomers, pendingInvoices, lowStockResult] = await Promise.all([
        Invoice.aggregate([
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]),
        Customer.countDocuments({}), // Assuming all are active
        Invoice.countDocuments({ status: 'Pending' }), // If we use 'Pending' status. Default is 'Paid'.
        Product.countDocuments({ stock: { $lt: 10 } }) // Low stock threshold 10
    ]);

    const totalSales = totalSalesResult[0] ? totalSalesResult[0].total : 0;

    res.json({
        totalSales,
        activeCustomers,
        pendingInvoices,
        lowStockItems: lowStockResult
    });
});

// @desc    Get financials
// @route   GET /reports/financials
// @access  Private
const getFinancials = asyncHandler(async (req, res) => {
    const [salesResult, expensesResult, countResult] = await Promise.all([
        Invoice.aggregate([
            { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Expense.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        Invoice.countDocuments({})
    ]);

    const totalSales = salesResult[0] ? salesResult[0].total : 0;
    const totalOrders = countResult;
    const totalExpenses = expensesResult[0] ? expensesResult[0].total : 0;

    // Avg Order Value
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Net Profit
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
    // Group by YYYY-MM-DD
    const trend = await Invoice.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                sales: { $sum: "$total" }
            }
        },
        { $sort: { _id: 1 } }, // asc date
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
    const stats = await Invoice.aggregate([
        {
            $group: {
                _id: "$paymentMethod", // Requires paymentMethod in Schema (added tentatively or handling null)
                value: { $sum: "$total" } // value is total sales by method? or count? usually sales amount.
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
    const topProducts = await Invoice.aggregate([
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.name", // or productId and name
                quantity: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.total" } // item total
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
