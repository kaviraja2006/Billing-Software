const { getDatabase } = require('./database');
const { Repository } = require('../types');
const crypto = require('crypto');

class InvoiceRepository extends Repository {
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
            INSERT INTO invoices (
                _id, invoiceNumber, customerId, customerName, date, type, 
                items, subtotal, tax, discount, total, status, 
                paymentStatus, paymentMethod, userId, createdAt, updatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?
            )
        `);

        stmt.run(
            _id,
            data.invoiceNumber,
            data.customerId,
            data.customerName,
            data.date ? new Date(data.date).toISOString() : now,
            data.type || 'Retail',
            JSON.stringify(data.items || []),
            data.subtotal || 0,
            data.tax || 0,
            data.discount || 0,
            data.total || 0,
            data.status || 'Paid',
            data.paymentStatus || 'Paid',
            data.paymentMethod || 'Cash',
            data.userId,
            now,
            now
        );

        return this.findById(_id);
    }

    findAll(query = {}) {
        let sql = 'SELECT * FROM invoices';
        const params = [];
        const conditions = [];

        if (query.userId) {
            conditions.push('userId = ?');
            params.push(query.userId);
        }

        // Add more filters as needed

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY createdAt DESC';

        const invoices = this.db.prepare(sql).all(...params);
        return invoices.map(this._mapDoc);
    }

    findById(id) {
        const invoice = this.db.prepare('SELECT * FROM invoices WHERE _id = ?').get(id);
        return invoice ? this._mapDoc(invoice) : null;
    }

    update(id, data) {
        const fields = [];
        const params = [];

        // Exclude immutable fields
        const { _id, createdAt, ...updateData } = data;
        updateData.updatedAt = new Date().toISOString();

        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = ?`);
            params.push(key === 'items' ? JSON.stringify(value) : value);
        }

        if (fields.length === 0) return this.findById(id);

        params.push(id);

        this.db.prepare(`UPDATE invoices SET ${fields.join(', ')} WHERE _id = ?`).run(...params);

        return this.findById(id);
    }

    delete(id) {
        return this.db.prepare('DELETE FROM invoices WHERE _id = ?').run(id);
    }

    _mapDoc(doc) {
        return {
            ...doc,
            items: JSON.parse(doc.items || '[]'),
            date: new Date(doc.date),
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt)
        };
    }
}

module.exports = new InvoiceRepository();
