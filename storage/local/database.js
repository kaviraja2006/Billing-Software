const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

let db;

function initDatabase(userDataPath) {
    if (db) return db;

    const dbPath = path.join(userDataPath, 'billing.db');
    fs.ensureDirSync(userDataPath);

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    createTables();
    return db;
}

function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase first.');
    }
    return db;
}

function createTables() {
    // Users
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            _id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            businessName TEXT,
            createdAt TEXT,
            updatedAt TEXT
        )
    `);

    // Products
    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            _id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sku TEXT,
            category TEXT,
            price REAL,
            stock INTEGER,
            unit TEXT,
            description TEXT,
            taxRate REAL,
            userId TEXT,
            variants TEXT, -- JSON
            isActive INTEGER DEFAULT 1,
            createdAt TEXT,
            updatedAt TEXT,
            FOREIGN KEY (userId) REFERENCES users(_id)
        )
    `);

    // Customers
    db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
            _id TEXT PRIMARY KEY,
            customerId TEXT,
            firstName TEXT,
            lastName TEXT,
            email TEXT,
            phone TEXT,
            address TEXT, -- JSON
            userId TEXT,
            createdAt TEXT,
            updatedAt TEXT,
            FOREIGN KEY (userId) REFERENCES users(_id)
        )
    `);

    // Invoices
    db.exec(`
        CREATE TABLE IF NOT EXISTS invoices (
            _id TEXT PRIMARY KEY,
            invoiceNumber TEXT, -- generated or matched
            customerId TEXT,
            customerName TEXT,
            date TEXT,
            type TEXT,
            items TEXT, -- JSON
            subtotal REAL,
            tax REAL,
            discount REAL,
            total REAL,
            status TEXT,
            paymentStatus TEXT,
            paymentMethod TEXT,
            userId TEXT,
            createdAt TEXT,
            updatedAt TEXT,
            FOREIGN KEY (userId) REFERENCES users(_id)
        )
    `);

    // Settings
    db.exec(`
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

function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}

module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase
};
