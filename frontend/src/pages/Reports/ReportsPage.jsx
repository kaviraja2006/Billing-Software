import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, Download, TrendingUp, TrendingDown, FileText, CreditCard, DollarSign, Wallet } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useExpenses } from '../../context/ExpenseContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const ReportsPage = () => {
    const { transactions } = useTransactions();
    const { expenses } = useExpenses();
    const [activeTab, setActiveTab] = useState('sales');

    // --- Calculations ---
    const stats = useMemo(() => {
        // 1. Sales
        const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.amount.replace(/[^0-9.-]+/g, "")), 0);
        const totalOrders = transactions.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // 2. Expenses
        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        // 3. Profit
        const netProfit = totalSales - totalExpenses;

        // Sales Trend (Last 7 Days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const salesTrend = last7Days.map(date => {
            const daySales = transactions
                .filter(t => t.date === date)
                .reduce((sum, t) => sum + parseFloat(t.amount.replace(/[^0-9.-]+/g, "")), 0);
            return { date: date.slice(5), sales: daySales }; // slice to show MM-DD
        });

        // Payment Method Distribution
        const methods = {};
        transactions.forEach(t => {
            methods[t.method] = (methods[t.method] || 0) + 1;
        });
        const paymentMethods = Object.keys(methods).map(key => ({
            name: key,
            value: methods[key]
        }));

        // Top Products
        const productMap = {};
        transactions.forEach(t => {
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

        return {
            totalSales,
            totalOrders,
            avgOrderValue,
            totalExpenses,
            netProfit,
            salesTrend,
            paymentMethods,
            topProducts
        };
    }, [transactions, expenses]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const tabs = [
        { id: 'sales', label: 'Financial Overview', icon: TrendingUp },
    ];

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                <div className="flex gap-2">
                    <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Last 7 Days</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Report</Button>
                </div>
            </div>

            {/* Tabs Header */}
            <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
                {tabs.map(tab => (
                    <TabButton key={tab.id} {...tab} />
                ))}
            </div>

            {/* Tab Content */}
            <div className="py-4">
                {activeTab === 'sales' && (
                    <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">

                        {/* 1. Total Sales */}
                        <Card className="bg-blue-50 border-blue-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-900">Total Sales</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-700">${stats.totalSales.toFixed(2)}</div>
                            </CardContent>
                        </Card>

                        {/* 2. Total Expenses */}
                        <Card className="bg-red-50 border-red-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-red-900">Total Expenses</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-700">${stats.totalExpenses.toFixed(2)}</div>
                            </CardContent>
                        </Card>

                        {/* 3. Net Profit */}
                        <Card className={`border ${stats.netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-sm font-medium ${stats.netProfit >= 0 ? 'text-green-900' : 'text-orange-900'}`}>Net Profit</CardTitle>
                                <Wallet className={`h-4 w-4 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                                    ${stats.netProfit.toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. Avg Order Value */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Avg Order Value</CardTitle>
                                <CreditCard className="h-4 w-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">${stats.avgOrderValue.toFixed(2)}</div>
                            </CardContent>
                        </Card>

                        {/* 5. Total Orders */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
                                <FileText className="h-4 w-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{stats.totalOrders}</div>
                            </CardContent>
                        </Card>

                        {/* Sales Trend Chart */}
                        <Card className="col-span-full md:col-span-3">
                            <CardHeader>
                                <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.salesTrend}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Payment Methods Chart */}
                        <Card className="col-span-full md:col-span-2">
                            <CardHeader>
                                <CardTitle>Payment Methods</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.paymentMethods}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats.paymentMethods.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Top Products Table */}
                        <Card className="col-span-full">
                            <CardHeader>
                                <CardTitle>Top Selling Products</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {stats.topProducts.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-slate-900">{p.name}</p>
                                                <p className="text-sm text-slate-500">{p.quantity} units sold</p>
                                            </div>
                                            <div className="font-semibold text-slate-900">
                                                ${p.revenue.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                    {stats.topProducts.length === 0 && (
                                        <p className="text-center text-slate-500 py-4">No sales data available yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
