const MOCK_DELAY = 500;

const STORAGE_KEY = 'billing_mock_customers';

const getStoredCustomers = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    const initialCustomers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', address: '123 Main St, City', joinedDate: '2023-01-15' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '987-654-3210', address: '456 Oak Ln, Town', joinedDate: '2023-02-20' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '555-555-5555', address: '789 Pine Rd, Village', joinedDate: '2023-03-10' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialCustomers));
    return initialCustomers;
};

let mockCustomers = getStoredCustomers();

const saveCustomers = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCustomers));
};

export const mockCustomerService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ data: [...mockCustomers] });
            }, MOCK_DELAY);
        });
    },

    getById: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const customer = mockCustomers.find((c) => c.id === id);
                if (customer) {
                    resolve({ data: customer });
                } else {
                    reject({ response: { status: 404, data: { message: 'Customer not found' } } });
                }
            }, MOCK_DELAY);
        });
    },

    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newCustomer = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...data,
                    joinedDate: new Date().toISOString().split('T')[0],
                };
                mockCustomers.push(newCustomer);
                saveCustomers();
                resolve({ data: newCustomer });
            }, MOCK_DELAY);
        });
    },

    update: async (id, data) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = mockCustomers.findIndex((c) => c.id === id);
                if (index !== -1) {
                    mockCustomers[index] = { ...mockCustomers[index], ...data };
                    saveCustomers();
                    resolve({ data: mockCustomers[index] });
                } else {
                    reject({ response: { status: 404, data: { message: 'Customer not found' } } });
                }
            }, MOCK_DELAY);
        });
    },

    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = mockCustomers.findIndex((c) => c.id === id);
                if (index !== -1) {
                    mockCustomers.splice(index, 1);
                    saveCustomers();
                    resolve({ data: { message: 'Customer deleted successfully' } });
                } else {
                    reject({ response: { status: 404, data: { message: 'Customer not found' } } });
                }
            }, MOCK_DELAY);
        });
    },
};
