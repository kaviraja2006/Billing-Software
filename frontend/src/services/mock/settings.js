const MOCK_DELAY = 300;

let mockSettings = {
    companyName: 'My Billing Co.',
    currency: 'USD',
    taxRate: 10,
    address: '123 Business Rd',
};

export const mockSettingsService = {
    getSettings: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ data: { ...mockSettings } });
            }, MOCK_DELAY);
        });
    },

    updateSettings: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                mockSettings = { ...mockSettings, ...data };
                resolve({ data: { ...mockSettings } });
            }, MOCK_DELAY);
        });
    },
};
