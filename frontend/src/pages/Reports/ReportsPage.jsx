import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, Download, TrendingUp, TrendingDown, FileText, CreditCard, DollarSign, Wallet } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import services from '../../services/api';

const ReportsPage = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        totalExpenses: 0,
        netProfit: 0,
        salesTrend: [],
        paymentMethods: [],
        topProducts: []
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sales');

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const [financials, trend, methods, products] = await Promise.all([
                    services.reports.getFinancialStats(),
                    services.reports.getSalesTrend(),
                    services.reports.getPaymentMethodStats(),
                    services.reports.getTopProducts()
                ]);

                setStats({
                    ...financials.data,
                    salesTrend: trend.data,
                    paymentMethods: methods.data,
                    topProducts: products.data
                });
            } catch (error) {
                console.error("Failed to fetch report data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

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
