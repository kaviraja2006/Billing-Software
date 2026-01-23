const { getDatabase } = require('./database');
const { Repository } = require('../types');
const crypto = require('crypto');

class SettingsRepository extends Repository {
    constructor() {
        super();
        // ensureTable needs DB, so we must call it lazily or check if DB is ready?
        // Actually, initDatabase calls createTables. ensureTable in constructor is risky if DB not ready.
        // We'll rely on initDatabase to create tables, or check in create/update.
    }

    get db() {
        return getDatabase();
    }

    ensureTable() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                _id TEXT PRIMARY KEY,
                storeName TEXT,
                address TEXT, -- JSON
                contact TEXT, -- JSON
                taxInfo TEXT, -- JSON
                invoicePreferences TEXT, -- JSON
                userId TEXT,
                createdAt TEXT,
                updatedAt TEXT
            )
        `);
    }

    create(data) {
        // Settings usually just update if exist, or create one per user
        return this.update(data.userId || 'default', data);
    }

    // Settings is usually a singleton or per user. 
    // We'll mimic 'getSettings' by finding the first one or by userId
    async findOne(query = {}) {
        // For offline single user, just get the first one
        const row = this.db.prepare('SELECT * FROM settings LIMIT 1').get();
        return row ? this._mapDoc(row) : null;
    }

    update(id, data) {
        const existing = this.db.prepare('SELECT * FROM settings LIMIT 1').get();
        const now = new Date().toISOString();

        if (existing) {
            const fields = [];
            const params = [];
            const { _id, createdAt, ...updateData } = data;
            updateData.updatedAt = now;

            for (const [key, value] of Object.entries(updateData)) {
                fields.push(`${key} = ?`);
                params.push(
                    ['address', 'contact', 'taxInfo', 'invoicePreferences'].includes(key)
                        ? JSON.stringify(value)
                        : value
                );
            }

            params.push(existing._id);
            this.db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
            return this.findById(existing._id);
        } else {
            // Create new
            const _id = id || crypto.randomUUID();
            const stmt = this.db.prepare(`
                INSERT INTO settings (
                    _id, storeName, address, contact, taxInfo, invoicePreferences, userId, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                _id,
                data.storeName,
                JSON.stringify(data.address || {}),
                JSON.stringify(data.contact || {}),
                JSON.stringify(data.taxInfo || {}),
                JSON.stringify(data.invoicePreferences || {}),
                data.userId || 'offline-user',
                now,
                now
            );
            return this.findById(_id);
        }
    }

    findById(id) {
        const doc = this.db.prepare('SELECT * FROM settings WHERE _id = ?').get(id);
        return doc ? this._mapDoc(doc) : null;
    }

    _mapDoc(doc) {
        return {
            ...doc,
            address: JSON.parse(doc.address || '{}'),
            contact: JSON.parse(doc.contact || '{}'),
            taxInfo: JSON.parse(doc.taxInfo || '{}'),
            invoicePreferences: JSON.parse(doc.invoicePreferences || '{}'),
        };
    }
}

module.exports = new SettingsRepository();
