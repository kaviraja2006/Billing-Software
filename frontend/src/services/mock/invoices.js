const MOCK_DELAY = 600;

let mockInvoices = [
    {
        id: 'INV-001',
        customerName: 'John Doe',
        customerId: '1',
        date: '2023-11-01',
        items: [
            { productId: '1', name: 'Wireless Mouse', quantity: 2, price: 29.99, total: 59.98 }
        ],
        subtotal: 59.98,
        tax: 5.99,
        discount: 0,
        total: 65.97,
        status: 'Paid'
    },
    {
        id: 'INV-002',
        customerName: 'Jane Smith',
        customerId: '2',
        date: '2023-11-05',
        items: [
            { productId: '3', name: 'Office Chair', quantity: 1, price: 199.99, total: 199.99 }
        ],
        subtotal: 199.99,
        tax: 19.99,
        discount: 10.00,
        total: 209.98,
        status: 'Pending'
    },
];

export const mockInvoiceService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ data: [...mockInvoices] });
            }, MOCK_DELAY);
        });
    },

    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const invoice = mockInvoices.find((i) => i.id === id);
                if (invoice) {
                    resolve({ data: invoice });
                } else {
                    reject({ response: { status: 404, data: { message: 'Invoice not found' } } });
                }
            }, MOCK_DELAY);
        });
    },
};

// Billing service is essentially creating invoices
export const mockBillingService = {
    createInvoice: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newInvoice = {
                    id: `INV-${Math.floor(Math.random() * 10000)}`,
                    ...data,
                    date: new Date().toISOString().split('T')[0],
                    status: 'Paid' // Default to paid for now
                };
                mockInvoices.push(newInvoice);
                resolve({ data: newInvoice });
            }, MOCK_DELAY);
        });
    }
}
