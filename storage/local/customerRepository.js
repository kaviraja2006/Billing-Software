const { getDatabase } = require('./database');
const { Repository } = require('../types');
const crypto = require('crypto');

class CustomerRepository extends Repository {
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
            INSERT INTO customers (
                _id, customerId, firstName, lastName, email, phone, 
                address, userId, createdAt, updatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?
            )
        `);

        stmt.run(
            _id,
            data.customerId,
            data.firstName,
            data.lastName || '',
            data.email,
            data.phone,
            JSON.stringify(data.address || {}),
            data.userId,
            now,
            now
        );

        return this.findById(_id);
    }

    findAll(query = {}) {
        let sql = 'SELECT * FROM customers';
        const params = [];
        const conditions = [];

        if (query.userId) {
            conditions.push('userId = ?');
            params.push(query.userId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY createdAt DESC';

        const customers = this.db.prepare(sql).all(...params);
        return customers.map(this._mapDoc);
    }

    findById(id) {
        const customer = this.db.prepare('SELECT * FROM customers WHERE _id = ?').get(id);
        return customer ? this._mapDoc(customer) : null;
    }

    update(id, data) {
        const fields = [];
        const params = [];
        const { _id, createdAt, ...updateData } = data;
        updateData.updatedAt = new Date().toISOString();

        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = ?`);
            params.push(key === 'address' ? JSON.stringify(value) : value);
        }

        if (fields.length === 0) return this.findById(id);

        params.push(id);
        this.db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
        return this.findById(id);
    }

    delete(id) {
        return this.db.prepare('DELETE FROM customers WHERE _id = ?').run(id);
    }

    _mapDoc(doc) {
        return {
            ...doc,
            address: JSON.parse(doc.address || '{}'),
            fullName: `${doc.firstName} ${doc.lastName || ''}`.trim(),
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt)
        };
    }
}

module.exports = new CustomerRepository();
