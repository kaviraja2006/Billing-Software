const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Use a separate database file for analytics
const ANALYTICS_DB_PATH = path.join(__dirname, '../../analytics.db');

class AnalyticsDB {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(ANALYTICS_DB_PATH, (err) => {
                if (err) {
                    console.error('Failed to connect to analytics database:', err);
                    reject(err);
                    return;
                }
                console.log('Connected to analytics database');
                this.createTables()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    /**
     * Create analytics tables
     */
    async createTables() {
        const installationsTable = `
            CREATE TABLE IF NOT EXISTS installations (
                install_id TEXT PRIMARY KEY,
                user_name TEXT,
                user_email TEXT,
                first_seen DATETIME NOT NULL,
                last_seen DATETIME NOT NULL,
                app_version TEXT,
                platform TEXT,
                ping_count INTEGER DEFAULT 1
            )
        `;

        const adminsTable = `
            CREATE TABLE IF NOT EXISTS analytics_admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_last_seen ON installations(last_seen)',
            'CREATE INDEX IF NOT EXISTS idx_platform ON installations(platform)',
            'CREATE INDEX IF NOT EXISTS idx_user_email ON installations(user_email)'
        ];

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(installationsTable);
                this.db.run(adminsTable);

                indices.forEach(index => {
                    this.db.run(index);
                });

                resolve();
            });
        });
    }

    /**
     * Record or update installation ping
     */
    async recordPing(data) {
        const { installId, userName, userEmail, appVersion, platform, lastSeen } = data;

        return new Promise((resolve, reject) => {
            // Check if installation exists
            this.db.get(
                'SELECT * FROM installations WHERE install_id = ?',
                [installId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (row) {
                        // Update existing installation
                        this.db.run(
                            `UPDATE installations 
                             SET user_name = ?, user_email = ?, last_seen = ?, 
                                 app_version = ?, platform = ?, ping_count = ping_count + 1
                             WHERE install_id = ?`,
                            [userName, userEmail, lastSeen, appVersion, platform, installId],
                            (err) => {
                                if (err) reject(err);
                                else resolve({ action: 'updated', installId });
                            }
                        );
                    } else {
                        // Insert new installation
                        this.db.run(
                            `INSERT INTO installations 
                             (install_id, user_name, user_email, first_seen, last_seen, app_version, platform, ping_count)
                             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                            [installId, userName, userEmail, lastSeen, lastSeen, appVersion, platform],
                            (err) => {
                                if (err) reject(err);
                                else resolve({ action: 'created', installId });
                            }
                        );
                    }
                }
            );
        });
    }

    /**
     * Get analytics statistics
     */
    async getStats(timeRange = 'all') {
        const now = new Date();
        let dateFilter = '';

        if (timeRange === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = `WHERE last_seen >= '${todayStart.toISOString()}'`;
        } else if (timeRange === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = `WHERE last_seen >= '${sevenDaysAgo.toISOString()}'`;
        } else if (timeRange === '30days') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = `WHERE last_seen >= '${thirtyDaysAgo.toISOString()}'`;
        }

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const stats = {};

                // Total installations
                this.db.get('SELECT COUNT(*) as total FROM installations', (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    stats.totalInstallations = row.total;
                });

                // Active users by time range
                this.db.get(`SELECT COUNT(*) as count FROM installations ${dateFilter}`, (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    stats.activeUsers = row.count;
                });

                // Platform distribution
                this.db.all(
                    'SELECT platform, COUNT(*) as count FROM installations GROUP BY platform',
                    (err, rows) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        stats.platformDistribution = rows;
                    }
                );

                // Version distribution
                this.db.all(
                    'SELECT app_version, COUNT(*) as count FROM installations GROUP BY app_version ORDER BY count DESC',
                    (err, rows) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        stats.versionDistribution = rows;
                        resolve(stats);
                    }
                );
            });
        });
    }

    /**
     * Get all installations with user details
     */
    async getAllInstallations(limit = 100, offset = 0, searchTerm = '') {
        let query = 'SELECT * FROM installations';
        let params = [];

        if (searchTerm) {
            query += ' WHERE user_name LIKE ? OR user_email LIKE ?';
            params = [`%${searchTerm}%`, `%${searchTerm}%`];
        }

        query += ' ORDER BY last_seen DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Create admin user
     */
    async createAdmin(username, password) {
        const passwordHash = await bcrypt.hash(password, 10);

        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO analytics_admins (username, password_hash) VALUES (?, ?)',
                [username, passwordHash],
                (err) => {
                    if (err) reject(err);
                    else resolve({ username });
                }
            );
        });
    }

    /**
     * Verify admin credentials
     */
    async verifyAdmin(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM analytics_admins WHERE username = ?',
                [username],
                async (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve(null);
                        return;
                    }

                    const isValid = await bcrypt.compare(password, row.password_hash);
                    resolve(isValid ? { id: row.id, username: row.username } : null);
                }
            );
        });
    }

    /**
     * Delete an installation by install_id
     */
    async deleteInstallation(installId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM installations WHERE install_id = ?',
                [installId],
                function (err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                }
            );
        });
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Export singleton instance
const analyticsDB = new AnalyticsDB();

module.exports = analyticsDB;
