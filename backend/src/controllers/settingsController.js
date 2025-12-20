const asyncHandler = require('express-async-handler');
const Settings = require('../models/settingsModel');

// @desc    Get settings
// @route   GET /settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();

    if (!settings) {
        // Create default settings if not exists
        settings = await Settings.create({});
    }

    res.json(settings);
});

// @desc    Update settings
// @route   PUT /settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create(req.body);
    } else {
        // Deep update or robust replacement
        // Using replace or individually setting fields is tedious for nested objects.
        // Mongoose findOneAndUpdate with $set is easier but we want to return the updated doc.
        // req.body can contain nested partial updates.

        // Simple approach: merge top level or use explicit updates.
        // Since payload structure matches schema, we can iterate or just use Object.assign for top level,
        // but for nested 'tax', 'store', etc., we need to be careful not to overwrite with partials if not intended.
        // However, usually the frontend sends the whole section or we assume deep merge.
        // Let's rely on Mongoose's findOneAndUpdate which does $set.

        settings = await Settings.findOneAndUpdate({}, { $set: req.body }, { new: true, upsert: true });
    }

    res.json(settings);
});

module.exports = {
    getSettings,
    updateSettings,
};
