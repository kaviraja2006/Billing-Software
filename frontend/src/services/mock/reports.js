import { mockInvoiceService } from './invoices';
import { mockExpenseService } from './expenses';
import { mockCustomerService } from './customers';

const MOCK_DELAY = 500;

export const mockReportService = {
    getDashboardStats: async () => {
        const invoices = (await mockInvoiceService.getAll()).data;
        const customers = (await mockCustomerService.getAll()).data;

        // Dynamic stats calculation
        const totalSales = invoices.reduce((sum, i) => {
            const amount = parseFloat(i.total) || parseFloat(i.amount) || parseFloat(i.grandTotal) || 0;
            return sum + amount;
        }, 0);

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: {
                        totalSales: totalSales,
                        activeCustomers: customers.length,
                        pendingInvoices: invoices.filter(i => i.status === 'Pending').length,
                        lowStockItems: 2, // Mock
                    }
                });
            }, MOCK_DELAY);
        });
    },

    getFinancialStats: async () => {
        const invoices = (await mockInvoiceService.getAll()).data;
        const expenses = (await mockExpenseService.getAll()).data;

        const totalSales = invoices.reduce((sum, t) => {
            const amt = typeof t.amount === 'string' ? parseFloat(t.amount.replace(/[^0-9.-]+/g, "")) : t.amount;
            return sum + (amt || 0);
        }, 0);
        const totalOrders = invoices.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const netProfit = totalSales - totalExpenses;

        return new Promise(resolve => setTimeout(() => resolve({
            data: {
                totalSales,
                totalOrders,
                avgOrderValue,
                totalExpenses,
                netProfit
            }
        }), MOCK_DELAY));
    },

    getSalesTrend: async () => {
        const invoices = (await mockInvoiceService.getAll()).data;
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const salesTrend = last7Days.map(date => {
            const daySales = invoices
                .filter(t => t.date === date)
                .reduce((sum, t) => {
                    const amt = typeof t.amount === 'string' ? parseFloat(t.amount.replace(/[^0-9.-]+/g, "")) : t.amount;
                    return sum + (amt || 0);
                }, 0);
            return { date: date.slice(5), sales: daySales };
        });

        return new Promise(resolve => setTimeout(() => resolve({ data: salesTrend }), MOCK_DELAY));
    },

    getPaymentMethodStats: async () => {
        const invoices = (await mockInvoiceService.getAll()).data;
        const methods = {};
        invoices.forEach(t => {
            methods[t.method] = (methods[t.method] || 0) + 1;
        });
        const data = Object.keys(methods).map(key => ({
            name: key,
            value: methods[key]
        }));
        return new Promise(resolve => setTimeout(() => resolve({ data }), MOCK_DELAY));
    },

    getTopProducts: async () => {
        const invoices = (await mockInvoiceService.getAll()).data;
        const productMap = {};
        invoices.forEach(t => {
            if (t.items && Array.isArray(t.items)) {
                t.items.forEach(item => {
                    if (!productMap[item.name]) {
                        productMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                    }
                    productMap[item.name].quantity += item.quantity;
                    productMap[item.name].revenue += item.price * item.quantity;
                });
            }
        });
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return new Promise(resolve => setTimeout(() => resolve({ data: topProducts }), MOCK_DELAY));
    }
};
