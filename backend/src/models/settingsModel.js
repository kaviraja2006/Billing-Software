const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
    {
        companyName: { type: String, default: 'My Billing Co.' },
        currency: { type: String, default: 'USD' },
        taxRate: { type: Number, default: 10 },
        address: { type: String, default: '123 Business Rd' },
        tax: {
            gstEnabled: { type: Boolean, default: true },
            gstin: { type: String, default: '' },
            state: { type: String, default: '' },
            stateCode: { type: String, default: '' },
            registrationType: { type: String, default: 'Regular' },
            priceMode: { type: String, default: 'Exclusive' },
            automaticTax: { type: Boolean, default: true },
            slabs: [
                {
                    id: String,
                    name: String,
                    rate: Number,
                    active: Boolean,
                },
            ],
        },
        invoice: {
            showTaxBreakup: { type: Boolean, default: true },
            showHsn: { type: Boolean, default: true },
            showB2bGstin: { type: Boolean, default: true },
            roundingType: { type: String, default: 'Nearest' },
        },
        store: {
            name: { type: String, default: 'My Awesome Supermarket' },
            contact: { type: String, default: '' },
            address: { type: String, default: '' },
            email: { type: String, default: '' },
            website: { type: String, default: '' },
            footer: { type: String, default: 'Thank you for shopping with us!' },
            terms: { type: Boolean, default: true },
            logo: { type: Boolean, default: true },
        },
        defaults: {
            hsnCode: { type: String, default: '' },
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true  // One settings document per user
        },
    },
    {
        timestamps: true,
    }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
