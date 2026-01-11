const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const Expense = require('../models/expenseModel');
const Customer = require('../models/customerModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

// Helper to build date match
const buildDateMatch = (userId, startDate, endDate) => {
    const match = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
    }
    return match;
};

// @desc    Get dashboard stats
// @route   GET /reports/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const dateMatch = buildDateMatch(userId, startDate, endDate);

    // Calculate Previous Period for Trends
    let prevStartDate, prevEndDate;
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = end - start;
        prevEndDate = new Date(start.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - duration);
    } else {
        // Default to "Previous 30 days" check if no date provided? 
        // Or if "All Time", comparison is 0?
        // Let's assume valid range is usually passed. If not, trends might be 0.
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        prevEndDate = new Date(startOfToday.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - (24 * 60 * 60 * 1000)); // Yesterday
    }

    const prevMatch = buildDateMatch(userId, prevStartDate.toISOString(), prevEndDate.toISOString());

    const orderMatch = { userId };
    if (startDate || endDate) {
        orderMatch.date = {};
        if (startDate) orderMatch.date.$gte = new Date(startDate);
        if (endDate) orderMatch.date.$lte = new Date(endDate);
    }
    const prevOrderMatch = { userId }; // Needs prev date logic if we want order trends
    if (prevStartDate) {
        prevOrderMatch.date = { $gte: prevStartDate, $lte: prevEndDate };
    }


    const [
        totalSalesResult,
        prevSalesResult,
        activeCustomers,
        totalOrders,
        prevOrders,
        pendingInvoices,
        lowStockResult
    ] = await Promise.all([
        Invoice.aggregate([
            { $match: dateMatch },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]),
        Invoice.aggregate([
            { $match: prevMatch },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]),
        Customer.countDocuments({ userId }),
        Invoice.countDocuments(orderMatch),
        Invoice.countDocuments(prevOrderMatch),
        Invoice.countDocuments({ userId, status: 'Pending' }),
        Product.countDocuments({ userId, stock: { $lt: 10 } })
    ]);

    const totalSales = totalSalesResult[0] ? totalSalesResult[0].total : 0;
    const prevSales = prevSalesResult[0] ? prevSalesResult[0].total : 0;

    // Calculate Percent Changes
    const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const salesChange = calculateChange(totalSales, prevSales);
    const ordersChange = calculateChange(totalOrders, prevOrders);

    res.json({
        totalSales,
        totalOrders,
        activeCustomers,
        pendingInvoices,
        lowStockItems: lowStockResult,
        trends: {
            sales: salesChange,
            orders: ordersChange
        }
    });
});

// @desc    Get financials  
// @route   GET /reports/financials
// @access  Private
const getFinancials = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const invoiceMatch = buildDateMatch(userId, startDate, endDate);
    const expenseMatch = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate || endDate) {
        expenseMatch.date = {};
        if (startDate) expenseMatch.date.$gte = new Date(startDate);
        if (endDate) expenseMatch.date.$lte = new Date(endDate);
    }

    const [salesResult, expensesResult, countResult] = await Promise.all([
        Invoice.aggregate([
            { $match: invoiceMatch },
            { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Expense.aggregate([
            { $match: expenseMatch },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        Invoice.countDocuments(invoiceMatch) // Use match with date for count
    ]);

    const totalSales = salesResult[0] ? salesResult[0].total : 0;
    const totalOrders = countResult; // This is now filtered
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
    const { startDate, endDate } = req.query;
    const match = buildDateMatch(userId, startDate, endDate);

    const trend = await Invoice.aggregate([
        { $match: match },
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
    const { startDate, endDate } = req.query;
    const match = buildDateMatch(userId, startDate, endDate);

    const stats = await Invoice.aggregate([
        { $match: match },
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
    const { startDate, endDate } = req.query;
    const match = buildDateMatch(userId, startDate, endDate);

    console.log("--- getTopProducts Debug ---");
    console.log("UserID:", userId);
    console.log("Date Range:", { startDate, endDate });
    console.log("Match Query:", JSON.stringify(match));

    const count = await Invoice.countDocuments(match);
    console.log("Matching Invoices Count:", count);

    const topProducts = await Invoice.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                quantity: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.total" }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "productInfo"
            }
        },
        {
            $project: {
                name: {
                    $ifNull: [
                        { $arrayElemAt: ["$productInfo.name", 0] },
                        { $concat: ["Unknown Product (", { $toString: "$_id" }, ")"] }
                    ]
                },
                quantity: 1,
                revenue: 1,
                costPrice: { $ifNull: [{ $arrayElemAt: ["$productInfo.costPrice", 0] }, 0] }
            }
        },
        {
            $addFields: {
                totalCost: { $multiply: ["$quantity", "$costPrice"] }
            }
        },
        {
            $addFields: {
                marginValue: { $subtract: ["$revenue", "$totalCost"] }
            }
        },
        {
            $addFields: {
                marginPercent: {
                    $cond: [
                        { $gt: ["$revenue", 0] },
                        { $multiply: [{ $divide: ["$marginValue", "$revenue"] }, 100] },
                        0
                    ]
                }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 100 }, // Increased limit for detailed overview
        {
            $project: {
                name: 1,
                quantity: 1,
                revenue: 1,
                marginPercent: 1,
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
