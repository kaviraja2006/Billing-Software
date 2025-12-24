const MOCK_DELAY = 500;

let mockProducts = [
    // Electronics
    { id: '1', name: 'Wireless Mouse', sku: 'WM-001', category: 'Electronics', price: 450.00, stock: 150, unit: 'pcs' },
    { id: '2', name: 'Mechanical Keyboard', sku: 'MK-002', category: 'Electronics', price: 2500.00, stock: 50, unit: 'pcs' },
    { id: '3', name: '24" IPS Monitor', sku: 'MN-003', category: 'Electronics', price: 12000.00, stock: 20, unit: 'pcs' },
    { id: '4', name: 'USB-C Cable (2m)', sku: 'UC-004', category: 'Accessories', price: 350.00, stock: 500, unit: 'pcs' },
    { id: '5', name: 'Bluetooth Headphones', sku: 'BH-005', category: 'Electronics', price: 1800.00, stock: 75, unit: 'pcs' },
    // Groceries
    { id: '6', name: 'Basmati Rice (5kg)', sku: 'GR-006', category: 'Grocery', price: 850.00, stock: 200, unit: 'pkt' },
    { id: '7', name: 'Whole Wheat Atta (10kg)', sku: 'GR-007', category: 'Grocery', price: 450.00, stock: 100, unit: 'pkt' },
    { id: '8', name: 'Sunflower Oil (1L)', sku: 'GR-008', category: 'Grocery', price: 145.00, stock: 300, unit: 'btl' },
    { id: '9', name: 'Sugar (1kg)', sku: 'GR-009', category: 'Grocery', price: 42.00, stock: 500, unit: 'pkt' },
    { id: '10', name: 'Tata Salt (1kg)', sku: 'GR-010', category: 'Grocery', price: 25.00, stock: 600, unit: 'pkt' },
    // Snacks
    { id: '11', name: 'Lays Chips (Classic)', sku: 'SN-011', category: 'Snacks', price: 20.00, stock: 1000, unit: 'pkt' },
    { id: '12', name: 'Coke (750ml)', sku: 'Bev-012', category: 'Beverages', price: 40.00, stock: 200, unit: 'btl' },
    { id: '13', name: 'Dairy Milk Silk', sku: 'CH-013', category: 'Snacks', price: 80.00, stock: 300, unit: 'pcs' },
    { id: '14', name: 'Maggi Noodles (Pack of 4)', sku: 'SN-014', category: 'Grocery', price: 56.00, stock: 150, unit: 'pkt' },
    // Home
    { id: '15', name: 'Detergent Powder (1kg)', sku: 'HM-015', category: 'Household', price: 220.00, stock: 80, unit: 'pkt' },
    { id: '16', name: 'Dishwash Liquid', sku: 'HM-016', category: 'Household', price: 110.00, stock: 120, unit: 'btl' },
    { id: '17', name: 'LED Bulb 9W', sku: 'EL-017', category: 'Electronics', price: 90.00, stock: 400, unit: 'pcs' },
];

export const mockProductService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ data: [...mockProducts] });
            }, MOCK_DELAY);
        });
    },

    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const product = mockProducts.find((p) => p.id === id);
                if (product) {
                    resolve({ data: product });
                } else {
                    reject({ response: { status: 404, data: { message: 'Product not found' } } });
                }
            }, MOCK_DELAY);
        });
    },

    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newProduct = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...data,
                };
                mockProducts.push(newProduct);
                resolve({ data: newProduct });
            }, MOCK_DELAY);
        });
    },

    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = mockProducts.findIndex((p) => p.id === id);
                if (index !== -1) {
                    mockProducts[index] = { ...mockProducts[index], ...data };
                    resolve({ data: mockProducts[index] });
                } else {
                    reject({ response: { status: 404, data: { message: 'Product not found' } } });
                }
            }, MOCK_DELAY);
        });
    },

    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = mockProducts.findIndex((p) => p.id === id);
                if (index !== -1) {
                    mockProducts.splice(index, 1);
                    resolve({ data: { message: 'Product deleted successfully' } });
                } else {
                    reject({ response: { status: 404, data: { message: 'Product not found' } } });
                }
            }, MOCK_DELAY);
        });
    },
};
