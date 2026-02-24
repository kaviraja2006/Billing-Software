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

        if (query.status) {
            const statuses = query.status.split(',');
            conditions.push(`status IN (${statuses.map(() => '?').join(',')})`);
            params.push(...statuses);
        }

        if (query.startDate && query.endDate) {
            conditions.push('date BETWEEN ? AND ?');
            params.push(query.startDate, query.endDate);
        }

        if (query.search) {
            conditions.push('(invoiceNumber LIKE ? OR customerName LIKE ?)');
            params.push(`%${query.search}%`, `%${query.search}%`);
        }

        if (query.paymentMethod && query.paymentMethod !== 'All') {
            conditions.push('paymentMethod = ?');
            params.push(query.paymentMethod);
        }

        if (query.minAmount) {
            conditions.push('total >= ?');
            params.push(query.minAmount);
        }
        if (query.maxAmount) {
            conditions.push('total <= ?');
            params.push(query.maxAmount);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY createdAt DESC';

        // Pagination
        if (query.page && query.limit) {
            const limit = parseInt(query.limit);
            const offset = (parseInt(query.page) - 1) * limit;
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }

        const stmt = this.db.prepare(sql);
        const invoices = stmt.all(...params);

        // Return structured data for pagination support if needed, but for now matching existing return
        // The frontend expects { data: [...], page, pages, total } usually, but looking at InvoicesPage.jsx:
        // setInvoices(invRes.data.data.map...
        // so the response here should probably match that structure or the ipcHandler should wrap it.
        // IPC handler just returns invoiceRepo.findAll(query).
        // Let's check what ipcResponse does. It wraps result in { data: result, ... }.
        // So invoiceRepo.findAll needs to return { data: invoices, total: count, page: ..., pages: ... }

        // We need the total count for pagination
        let countSql = 'SELECT COUNT(*) as count FROM invoices';
        if (conditions.length > 0) {
            countSql += ' WHERE ' + conditions.join(' AND ');
        }
        // distinct params for count (excluding limit/offset)
        const countParams = params.slice(0, params.length - (query.page ? 2 : 0));
        const total = this.db.prepare(countSql).get(...countParams).count;

        return {
            data: invoices.map(this._mapDoc),
            total,
            page: parseInt(query.page) || 1,
            pages: Math.ceil(total / (parseInt(query.limit) || 50))
        };
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
        // Soft delete: Mark as Cancelled instead of removing
        return this.db.prepare("UPDATE invoices SET status = 'Cancelled', updatedAt = ? WHERE _id = ?").run(new Date().toISOString(), id);
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
