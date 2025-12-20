const asyncHandler = require('express-async-handler');
const Expense = require('../models/expenseModel');
const Joi = require('joi');

// @desc    Get all expenses
// @route   GET /expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({}).sort({ date: -1 });
    const response = expenses.map(e => ({
        id: e._id,
        title: e.title,
        amount: e.amount,
        date: e.date,
        category: e.category,
        description: e.description
    }));
    res.json(response);
});

// @desc    Create an expense
// @route   POST /expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        amount: Joi.number().required(),
        category: Joi.string().required(),
        date: Joi.date().required(),
        description: Joi.string().allow('').optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { title, amount, category, date, description } = req.body;

    const expense = await Expense.create({
        title,
        amount,
        category,
        date,
        description,
    });

    res.status(201).json({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        description: expense.description
    });
});

// @desc    Delete an expense
// @route   DELETE /expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (expense) {
        await expense.deleteOne();
        res.json({ message: 'Expense deleted successfully' });
    } else {
        res.status(404);
        throw new Error('Expense not found');
    }
});

module.exports = {
    getExpenses,
    createExpense,
    deleteExpense,
};
