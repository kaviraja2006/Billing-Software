const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: false, // Could be guest
        },
        customerName: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
                total: { type: Number, required: true },
            },
        ],
        subtotal: { type: Number, required: true },
        tax: { type: Number, required: true, default: 0 },
        discount: { type: Number, required: true, default: 0 },
        total: { type: Number, required: true },
        status: { type: String, required: true, default: 'Paid' },
        paymentMethod: { type: String, default: 'Cash' },
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

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
