const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyAdminToken } = require('../middleware/adminAuth');
const rateLimit = require('express-rate-limit');

// Rate limiter for telemetry ping endpoint
const pingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // Max 2 requests per minute per IP
    message: 'Too many ping requests, please try again later'
});

// Public endpoint - receive telemetry pings from clients
router.post('/ping', pingLimiter, analyticsController.recordPing);

// Admin endpoints - require authentication

// Admin login (no auth required for this one obviously)
router.post('/admin/login', analyticsController.adminLogin);

// Create admin user (protected by master key)
router.post('/admin/create', analyticsController.createAdmin);

// Get statistics (requires admin auth)
router.get('/admin/stats', verifyAdminToken, analyticsController.getStats);

// Get installations list (requires admin auth)
router.get('/admin/installations', verifyAdminToken, analyticsController.getInstallations);

// Delete installation (requires admin auth)
router.delete('/admin/installations/:installId', verifyAdminToken, analyticsController.deleteInstallation);

module.exports = router;
