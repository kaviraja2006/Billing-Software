const analyticsDB = require('../db/analyticsDb');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.ANALYTICS_JWT_SECRET || 'your-analytics-secret-key-change-in-production';

/**
 * Record telemetry ping from client
 * @route POST /api/analytics/ping
 */
exports.recordPing = async (req, res) => {
    try {
        const { installId, userName, userEmail, appVersion, platform, lastSeen } = req.body;

        // Validate required fields
        if (!installId || !appVersion || !platform || !lastSeen) {
            return res.status(400).json({
                error: 'Missing required fields: installId, appVersion, platform, lastSeen'
            });
        }

        // Record the ping
        const result = await analyticsDB.recordPing({
            installId,
            userName: userName || null,
            userEmail: userEmail || null,
            appVersion,
            platform,
            lastSeen
        });

        res.status(200).json({
            success: true,
            message: 'Ping recorded',
            action: result.action
        });
    } catch (error) {
        console.error('Error recording ping:', error);
        res.status(500).json({
            error: 'Failed to record ping'
        });
    }
};

/**
 * Admin login
 * @route POST /api/analytics/admin/login
 */
exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password required'
            });
        }

        const admin = await analyticsDB.verifyAdmin(username, password);

        if (!admin) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            username: admin.username
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            error: 'Login failed'
        });
    }
};

/**
 * Get analytics statistics
 * @route GET /api/analytics/admin/stats
 */
exports.getStats = async (req, res) => {
    try {
        const { timeRange = 'all' } = req.query;

        const stats = await analyticsDB.getStats(timeRange);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            error: 'Failed to get statistics'
        });
    }
};

/**
 * Get all installations with user details
 * @route GET /api/analytics/admin/installations
 */
exports.getInstallations = async (req, res) => {
    try {
        const { limit = 100, offset = 0, search = '' } = req.query;

        const installations = await analyticsDB.getAllInstallations(
            parseInt(limit),
            parseInt(offset),
            search
        );

        res.json({
            success: true,
            installations,
            count: installations.length
        });
    } catch (error) {
        console.error('Error getting installations:', error);
        res.status(500).json({
            error: 'Failed to get installations'
        });
    }
};

/**
 * Create initial admin user (should be protected or run once)
 * @route POST /api/analytics/admin/create
 */
exports.createAdmin = async (req, res) => {
    try {
        const { username, password, masterKey } = req.body;

        // Protect this endpoint with a master key
        const MASTER_KEY = process.env.ANALYTICS_MASTER_KEY || 'change-this-master-key';

        if (masterKey !== MASTER_KEY) {
            return res.status(403).json({
                error: 'Invalid master key'
            });
        }

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters'
            });
        }

        const result = await analyticsDB.createAdmin(username, password);

        res.json({
            success: true,
            message: 'Admin user created',
            username: result.username
        });
    } catch (error) {
        console.error('Error creating admin:', error);

        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({
                error: 'Username already exists'
            });
        }

        res.status(500).json({
            error: 'Failed to create admin user'
        });
    }
};

/**
 * Delete an installation by install_id
 * @route DELETE /api/analytics/admin/installations/:installId
 */
exports.deleteInstallation = async (req, res) => {
    try {
        const { installId } = req.params;

        if (!installId) {
            return res.status(400).json({
                error: 'Installation ID required'
            });
        }

        const result = await analyticsDB.deleteInstallation(installId);

        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Installation not found'
            });
        }

        res.json({
            success: true,
            message: 'Installation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting installation:', error);
        res.status(500).json({
            error: 'Failed to delete installation'
        });
    }
};
