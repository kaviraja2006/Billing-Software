const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.ANALYTICS_JWT_SECRET || 'your-analytics-secret-key-change-in-production';

/**
 * Middleware to verify admin JWT token
 */
const verifyAdminToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No token provided'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach admin info to request
        req.admin = decoded;

        next();
    } catch (error) {
        console.error('Token verification failed:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired'
            });
        }

        return res.status(401).json({
            error: 'Invalid token'
        });
    }
};

module.exports = { verifyAdminToken };
