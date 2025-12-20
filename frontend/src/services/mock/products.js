const MOCK_DELAY = 500;

let mockProducts = [
    { id: '1', name: 'Wireless Mouse', sku: 'WM-001', category: 'Electronics', price: 29.99, stock: 150, unit: 'pcs' },
    { id: '2', name: 'Mechanical Keyboard', sku: 'MK-002', category: 'Electronics', price: 89.99, stock: 50, unit: 'pcs' },
    { id: '3', name: 'Office Chair', sku: 'OC-003', category: 'Furniture', price: 199.99, stock: 20, unit: 'pcs' },
    { id: '4', name: 'USB-C Cable', sku: 'UC-004', category: 'Accessories', price: 12.50, stock: 500, unit: 'pcs' },
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
