const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
    // User identification
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userEmail: {
        type: String,
        required: true
    },

    // Store information
    store: {
        name: { type: String, required: true },
        legalName: String,
        businessType: String,
        contact: { type: String, required: true },
        email: String,
        website: String,
        address: {
            street: String,
            area: String,
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: String,
            country: { type: String, default: 'India' }
        },
        gstin: String,
        fssai: String
    },

    // Tax configuration
    tax: {
        gstEnabled: { type: Boolean, default: true },
        defaultType: String
    },

    // Owner/User information
    user: {
        fullName: { type: String, required: true },
        mobile: { type: String, required: true },
        email: String,
        role: String,
        consent: {
            analytics: Boolean,
            contact: Boolean
        }
    },

    // Metadata
    onboardingCompletedAt: {
        type: Date,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for fast userId lookups
companyProfileSchema.index({ userId: 1 });
companyProfileSchema.index({ 'store.name': 1 });
companyProfileSchema.index({ createdAt: -1 });

// Virtual for getting user's full info
companyProfileSchema.virtual('fullProfile').get(function () {
    return {
        userId: this.userId,
        userEmail: this.userEmail,
        store: this.store,
        tax: this.tax,
        user: this.user,
        onboardedAt: this.onboardingCompletedAt
    };
});

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
