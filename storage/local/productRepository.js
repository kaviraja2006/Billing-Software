const { getDatabase } = require('./database');
const { Repository } = require('../types');
const crypto = require('crypto');

class ProductRepository extends Repository {
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
            INSERT INTO products (
                _id, name, sku, category, price, stock, unit, 
                description, taxRate, userId, variants, isActive, 
                createdAt, updatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, 
                ?, ?
            )
        `);

        stmt.run(
            _id,
            data.name,
            data.sku,
            data.category,
            data.price,
            data.stock,
            data.unit || 'pcs',
            data.description,
            data.taxRate || 0,
            data.userId,
            JSON.stringify(data.variants || []),
            data.isActive === undefined ? 1 : (data.isActive ? 1 : 0),
            now,
            now
        );

        return this.findById(_id);
    }

    findAll(query = {}) {
        let sql = 'SELECT * FROM products';
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

        const products = this.db.prepare(sql).all(...params);
        return products.map(this._mapDoc);
    }

    findById(id) {
        const product = this.db.prepare('SELECT * FROM products WHERE _id = ?').get(id);
        return product ? this._mapDoc(product) : null;
    }

    update(id, data) {
        const fields = [];
        const params = [];
        const { _id, createdAt, ...updateData } = data;
        updateData.updatedAt = new Date().toISOString();

        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = ?`);
            let paramValue = value;
            if (key === 'variants') paramValue = JSON.stringify(value);
            if (key === 'isActive') paramValue = value ? 1 : 0;
            params.push(paramValue);
        }

        if (fields.length === 0) return this.findById(id);

        params.push(id);
        this.db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
        return this.findById(id);
    }

    delete(id) {
        return this.db.prepare('DELETE FROM products WHERE _id = ?').run(id);
    }

    _mapDoc(doc) {
        return {
            ...doc,
            variants: JSON.parse(doc.variants || '[]'),
            isActive: !!doc.isActive,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt)
        };
    }
}

module.exports = new ProductRepository();
