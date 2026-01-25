const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Configuration
const ANALYTICS_ENDPOINT = 'http://localhost:5000/api/analytics/ping';
const PING_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const ANALYTICS_FILE = 'analytics.json';

class AnalyticsService {
    constructor() {
        this.analyticsPath = null;
        this.analyticsData = null;
        this.userInfo = null;
    }

    /**
     * Initialize analytics service
     * Call this after app is ready
     */
    async initialize() {
        try {
            this.analyticsPath = path.join(app.getPath('userData'), ANALYTICS_FILE);
            await this.loadOrCreateAnalytics();
            console.log('✅ [Analytics] Initialized successfully');
            console.log('   📁 Analytics file:', this.analyticsPath);
            console.log('   🆔 Install ID:', this.analyticsData.installId);
            console.log('   ⏰ Last ping:', this.analyticsData.lastPing || 'Never');
        } catch (error) {
            console.error('❌ [Analytics] Failed to initialize:', error);
            console.error('   Error details:', error.message);
            console.error('   Stack:', error.stack);
        }
    }

    /**
     * Load existing analytics data or create new
     */
    async loadOrCreateAnalytics() {
        try {
            const data = await fs.readFile(this.analyticsPath, 'utf8');
            this.analyticsData = JSON.parse(data);
        } catch (error) {
            // File doesn't exist, create new analytics data
            this.analyticsData = {
                installId: uuidv4(),
                firstSeen: new Date().toISOString(),
                lastPing: null
            };
            await this.saveAnalytics();
        }
    }

    /**
     * Save analytics data to disk
     */
    async saveAnalytics() {
        try {
            await fs.writeFile(
                this.analyticsPath,
                JSON.stringify(this.analyticsData, null, 2),
                'utf8'
            );
        } catch (error) {
            console.error('Failed to save analytics:', error);
        }
    }

    /**
     * Set user information from authentication
     * Call this after user logs in
     */
    setUserInfo(user) {
        console.log('📊 [Analytics] Setting user info...', JSON.stringify(user, null, 2));

        if (user && user.name && user.email) {
            this.userInfo = {
                name: user.name,
                email: user.email
            };
            console.log('✅ [Analytics] User info set successfully:', this.userInfo);
        } else {
            console.error('❌ [Analytics] Invalid user data received:', user);
            console.error('   - Missing name or email');
            console.error('   - Received:', JSON.stringify(user, null, 2));
        }
    }

    /**
     * Check if we should send a ping
     */
    shouldSendPing() {
        if (!this.analyticsData.lastPing) {
            return true;
        }

        const lastPing = new Date(this.analyticsData.lastPing);
        const now = new Date();
        const timeSinceLastPing = now - lastPing;

        return timeSinceLastPing >= PING_INTERVAL_MS;
    }

    /**
     * Send telemetry ping to backend
     */
    async sendTelemetryPing() {
        // Only send if enough time has passed
        if (!this.shouldSendPing()) {
            console.log('Skipping ping - last ping was recent');
            return;
        }

        await this._executePing();
    }

    /**
     * Force send a telemetry ping (bypass time check)
     * Used when user info is updated
     */
    async forcePing() {
        console.log('Forcing telemetry ping...');
        await this._executePing();
    }

    /**
     * Internal method to execute the ping
     */
    async _executePing() {
        try {
            const payload = {
                installId: this.analyticsData.installId,
                userName: this.userInfo?.name || null,
                userEmail: this.userInfo?.email || null,
                appVersion: app.getVersion(),
                platform: process.platform,
                lastSeen: new Date().toISOString()
            };

            console.log('📤 [Analytics] Sending telemetry ping...');
            console.log('   📦 Payload:', JSON.stringify(payload, null, 2));
            console.log('   🌐 Endpoint:', ANALYTICS_ENDPOINT);

            // Send with timeout to prevent hanging
            const response = await axios.post(ANALYTICS_ENDPOINT, payload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Update last ping time
            this.analyticsData.lastPing = new Date().toISOString();
            await this.saveAnalytics();

            console.log('✅ [Analytics] Telemetry ping sent successfully');
            console.log('   📈 Response status:', response.status);
            console.log('   📊 Response data:', JSON.stringify(response.data, null, 2));
            console.log('   ⏰ Next ping allowed after:', new Date(Date.now() + PING_INTERVAL_MS).toLocaleString());
        } catch (error) {
            // Detailed error logging
            console.error('❌ [Analytics] Telemetry ping failed:');
            console.error('   Error type:', error.name);
            console.error('   Error message:', error.message);

            if (error.response) {
                console.error('   HTTP Status:', error.response.status);
                console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.error('   No response received from server');
                console.error('   Check if backend is running at:', ANALYTICS_ENDPOINT);
            } else {
                console.error('   Request setup error:', error.message);
            }

            console.error('   Full error stack:', error.stack);
        }
    }

    /**
     * Get analytics data for debugging (admin only)
     */
    getAnalyticsData() {
        return {
            ...this.analyticsData,
            userInfo: this.userInfo
        };
    }
}

// Export singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;
