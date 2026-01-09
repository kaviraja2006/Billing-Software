const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, required: true, default: Date.now },
        category: { type: String, required: true },
        description: { type: String },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    {
        timestamps: true,
    }
);

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
