const MOCK_DELAY = 500;

let mockExpenses = [
    { id: '1', title: 'Office Rent', amount: 1500, date: '2023-11-01', category: 'Rent', description: 'Monthly office rent' },
    { id: '2', title: 'Internet Bill', amount: 80, date: '2023-11-05', category: 'Utilities', description: 'Fiber internet' },
    { id: '3', title: 'Team Lunch', amount: 120, date: '2023-11-10', category: 'Food', description: 'Friday team lunch' },
];

export const mockExpenseService = {
    getAll: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ data: [...mockExpenses] });
            }, MOCK_DELAY);
        });
    },

    create: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newExpense = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...data,
                };
                mockExpenses.push(newExpense);
                resolve({ data: newExpense });
            }, MOCK_DELAY);
        });
    },

    delete: async (id) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = mockExpenses.findIndex((e) => e.id === id);
                if (index !== -1) {
                    mockExpenses.splice(index, 1);
                    resolve({ data: { message: 'Expense deleted successfully' } });
                } else {
                    reject({ response: { status: 404, data: { message: 'Expense not found' } } });
                }
            }, MOCK_DELAY);
        });
    },
};
