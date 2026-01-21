const { ipcMain } = require('electron');
const invoiceRepo = require('../storage/local/invoiceRepository');
const customerRepo = require('../storage/local/customerRepository');
const productRepo = require('../storage/local/productRepository');

function registerHandlers() {
    // Invoices
    ipcMain.handle('invoice:create', async (_, data) => invoiceRepo.create(data));
    ipcMain.handle('invoice:findAll', async (_, query) => invoiceRepo.findAll(query));
    ipcMain.handle('invoice:findById', async (_, id) => invoiceRepo.findById(id));
    ipcMain.handle('invoice:update', async (_, { id, data }) => invoiceRepo.update(id, data));
    ipcMain.handle('invoice:delete', async (_, id) => invoiceRepo.delete(id));

    // Customers
    ipcMain.handle('customer:create', async (_, data) => customerRepo.create(data));
    ipcMain.handle('customer:findAll', async (_, query) => customerRepo.findAll(query));
    ipcMain.handle('customer:findById', async (_, id) => customerRepo.findById(id));
    ipcMain.handle('customer:update', async (_, { id, data }) => customerRepo.update(id, data));
    ipcMain.handle('customer:delete', async (_, id) => customerRepo.delete(id));

    // Products
    ipcMain.handle('product:create', async (_, data) => productRepo.create(data));
    ipcMain.handle('product:findAll', async (_, query) => productRepo.findAll(query));
    ipcMain.handle('product:findById', async (_, id) => productRepo.findById(id));
    ipcMain.handle('product:update', async (_, { id, data }) => productRepo.update(id, data));
    ipcMain.handle('product:delete', async (_, id) => productRepo.delete(id));

    // Settings
    const settingsRepo = require('../storage/local/settingsRepository');
    ipcMain.handle('settings:get', async () => settingsRepo.findOne());
    ipcMain.handle('settings:update', async (_, data) => settingsRepo.update(null, data));
}

module.exports = { registerHandlers };
