
// Simulate database in memory (reset on refresh) or localStorage (persistent)
const MOCK_DELAY = 800;

export const mockAuthService = {
    login: async (credentials) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
                    const user = {
                        id: '1',
                        name: 'Admin User',
                        email: 'admin@example.com',
                        role: 'admin',
                    };
                    const token = 'mock-jwt-token-12345';
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    resolve({ data: { user, token } });
                } else {
                    reject({ response: { data: { message: 'Invalid credentials' } } });
                }
            }, MOCK_DELAY);
        });
    },

    register: async (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    id: '2',
                    name: data.name,
                    email: data.email,
                    role: 'user',
                };
                const token = 'mock-jwt-token-67890';
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                resolve({ data: { user, token } });
            }, MOCK_DELAY);
        });
    },

    logout: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                resolve({ data: { message: 'Logged out successfully' } });
            }, 300);
        });
    },

    getCurrentUser: async () => {
        return new Promise((resolve, reject) => {
            const user = localStorage.getItem('user');
            if (user) {
                resolve({ data: JSON.parse(user) });
            } else {
                reject({ response: { status: 401 } });
            }
        })
    }
};
