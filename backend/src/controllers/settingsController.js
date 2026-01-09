const asyncHandler = require('express-async-handler');
const Settings = require('../models/settingsModel');

// @desc    Get settings
// @route   GET /settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
    // Get settings for authenticated user only
    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
        // Create default settings for this user
        settings = await Settings.create({ userId: req.user._id });
    }

    res.json(settings);
});

// @desc    Update settings
// @route   PUT /settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
    // Update settings for authenticated user only
    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
        settings = await Settings.create({ ...req.body, userId: req.user._id });
    } else {
        settings = await Settings.findOneAndUpdate(
            { userId: req.user._id },
            { $set: req.body },
            { new: true, upsert: false }
        );
    }

    res.json(settings);
});

module.exports = {
    getSettings,
    updateSettings,
};
