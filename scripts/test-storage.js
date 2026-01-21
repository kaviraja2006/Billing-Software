const { initDatabase } = require('../storage/local/database');
const customerRepo = require('../storage/local/customerRepository');
const productRepo = require('../storage/local/productRepository');
const invoiceRepo = require('../storage/local/invoiceRepository');
const userRepo = require('../storage/local/userRepository');
const path = require('path');
const fs = require('fs-extra');

const TEST_DIR = path.join(__dirname, '../temp_test_db');

async function runTest() {
    try {
        console.log('--- Starting Storage Verification ---');

        // 0. Clean prior run
        if (fs.existsSync(TEST_DIR)) {
            console.log('Cleaning previous test db...');
            fs.removeSync(TEST_DIR);
        }

        // 1. Init DB
        fs.ensureDirSync(TEST_DIR);
        console.log('Initializing DB at:', TEST_DIR);
        initDatabase(TEST_DIR);

        // 1.5 Create User (Required for FK)
        console.log('Creating User...');
        const user = await userRepo.create({
            _id: 'offline-user',
            name: 'Offline User',
            email: 'admin@offline.local',
            password: 'hashed-password'
        });
        console.log('User Created:', user._id);

        // 2. Create Customer
        console.log('Creating Customer...');
        const customer = await customerRepo.create({
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            email: 'test@example.com',
            userId: 'offline-user'
        });
        console.log('Customer Created:', customer._id);

        // 3. Create Product
        console.log('Creating Product...');
        const product = await productRepo.create({
            name: 'Test Product',
            sku: 'TEST-SKU-001',
            category: 'Testing',
            price: 100,
            stock: 50,
            userId: 'offline-user'
        });
        console.log('Product Created:', product._id);

        // 4. Create Invoice
        console.log('Creating Invoice...');
        const invoice = await invoiceRepo.create({
            customerId: customer._id,
            customerName: customer.fullName,
            items: [{
                productId: product._id,
                name: product.name,
                quantity: 2,
                price: product.price,
                total: product.price * 2
            }],
            subtotal: 200,
            total: 200,
            userId: 'offline-user'
        });
        console.log('Invoice Created:', invoice._id);

        // 5. Verify Invoice Fetch
        const fetchedInvoice = await invoiceRepo.findById(invoice._id);
        if (!fetchedInvoice) throw new Error('Failed to fetch invoice');
        if (fetchedInvoice.total !== 200) throw new Error('Invoice total mismatch');
        if (fetchedInvoice.items.length !== 1) throw new Error('Invoice items mismatch');

        console.log('--- Verification SUCCESS ---');

        // Close DB to release lock
        const { closeDatabase } = require('../storage/local/database');
        closeDatabase();

        console.log('Cleaning up...');
        fs.removeSync(TEST_DIR);

    } catch (err) {
        console.error('--- Verification FAILED ---');
        console.error(err);
        process.exit(1);
    }
}

runTest();
