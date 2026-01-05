const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        barcode: { type: String }, // can be same as sku or separate. Contract uses sku in response but payload has sku. Implementation plan said sku/barcode.
        // Contract says: Response: { id, name, sku, category, price, stock, unit }
        // Payload: { name, sku, category, price, stock, unit }
        // Let's use 'sku' to match contract strictly, but we can alias or store barcode there.
        sku: { type: String, required: true, unique: true },
        category: { type: String, required: true },
        brand: { type: String },
        price: { type: Number, required: true, default: 0 },
        stock: { type: Number, required: true, default: 0 },
        unit: { type: String, default: 'pcs' },
        description: { type: String },
        taxRate: { type: Number, default: 0 },
        costPrice: { type: Number, default: 0 },
        minStock: { type: Number, default: 10 },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
