const { getDatabase } = require('./database');
const { Repository } = require('../types');
const crypto = require('crypto');

class UserRepository extends Repository {
    constructor() {
        super();
    }

    get db() {
        return getDatabase();
    }

    create(data) {
        const _id = data._id || crypto.randomUUID();
        const now = new Date().toISOString();

        const stmt = this.db.prepare(`
            INSERT INTO users (
                _id, name, email, password, businessName, createdAt, updatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?
            )
        `);

        stmt.run(
            _id,
            data.name,
            data.email,
            data.password,
            data.businessName || '',
            now,
            now
        );

        return this.findById(_id);
    }

    findById(id) {
        const user = this.db.prepare('SELECT * FROM users WHERE _id = ?').get(id);
        return user ? this._mapDoc(user) : null;
    }

    findByEmail(email) {
        const user = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        return user ? this._mapDoc(user) : null;
    }

    _mapDoc(doc) {
        return {
            ...doc,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt)
        };
    }
}

module.exports = new UserRepository();
