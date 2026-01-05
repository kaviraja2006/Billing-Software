const mongoose = require('mongoose');

const customerSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String, required: true },
        address: { type: String },
        totalVisits: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        due: { type: Number, default: 0 },
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

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
