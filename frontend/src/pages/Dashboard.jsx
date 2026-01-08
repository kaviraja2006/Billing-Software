import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
    TrendingUp,
    Users,
    Package,
    IndianRupee,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    ScanBarcode,
    ShoppingCart,
    ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useTransactions } from '../context/TransactionContext';
import { useExpenses } from '../context/ExpenseContext';
import services from '../services/api';

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                    <div className={cn("p-3 rounded-full", color)}>
                        <Icon size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-body-secondary">{title}</p>
                        <h3 className="text-2xl font-bold text-body-primary">{value}</h3>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card >
);

const Dashboard = () => {
    // Mock Data
    const { transactions } = useTransactions();
    const { stats: expenseStats } = useExpenses();
    // const { customers } = useCustomers(); // Not needed for stats anymore
    const recentOrders = (transactions || []).slice(0, 5);
    const [statsData, setStatsData] = useState({
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        // totalExpenses: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await services.reports.getDashboardStats();
                setStatsData({
                    totalSales: response.data.totalSales,
                    totalOrders: response.data.totalOrders,
                    totalCustomers: response.data.activeCustomers,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        {
            title: 'Total Sales',
            value: `₹${statsData.totalSales.toFixed(2)}`,
            change: '+12.5%',
            icon: IndianRupee,
            color: 'bg-green-600', // Ensuring standard green
        },
        {
            title: 'Total Orders',
            value: statsData.totalOrders.toString(),
            change: '+5.2%',
            icon: ShoppingBag,
            color: 'bg-primary-main', // Use primary for generic orders
        },
        {
            title: 'Total Customers',
            value: statsData.totalCustomers.toString(),
            change: '+2.4%',
            icon: Users,
            color: 'bg-purple-600', // Keep purple for customers as distinct from finance
        },
        {
            title: 'Total Expenses',
            value: `₹${(expenseStats?.totalExpenses || 0).toFixed(2)}`,
            change: '-3.1%',
            icon: TrendingUp,
            color: 'bg-orange-500',
        },
    ];

    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <h1 className="text-2xl font-bold text-body-primary">Dashboard</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={() => navigate('/billing')} className="flex-1 md:flex-none bg-primary-main hover:bg-primary-hover text-white">
                        <ShoppingCart className="mr-2 h-4 w-4" /> New Sale
                    </Button>
                    <Button variant="outline" className="flex-1 md:flex-none">Download Report</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <StatCard
                        key={i}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        changeType={stat.change.startsWith('+') ? 'increase' : 'decrease'}
                        icon={stat.icon}
                        color={stat.color}
                    />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-7">
                {/* Recent Orders - Order 2 on Mobile, 1 on Desktop */}
                <Card className="order-2 md:order-1 md:col-span-4 lg:col-span-5 min-w-0">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.id}</TableCell>
                                            <TableCell className="whitespace-nowrap">{order.customerName || order.customer}</TableCell>
                                            <TableCell>{order.method}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={order.status === 'Completed' ? 'success' : order.status === 'Pending' ? 'warning' : 'destructive'}
                                                    className="bg-opacity-15 text-opacity-100"
                                                >
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">₹{Number(order.total || order.amount).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions - Order 1 on Mobile, 2 on Desktop */}
                <Card className="order-1 md:order-2 md:col-span-3 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 md:flex md:flex-col md:space-y-4">
                        <Button className="w-full justify-start bg-slate-100 text-primary-main hover:bg-slate-200 border border-slate-200 col-span-2 md:col-span-1" onClick={() => navigate('/billing')}>
                            <ShoppingCart className="mr-2 h-4 w-4" /> New Bill / Sale
                        </Button>
                        <Button className="w-full justify-start text-body-secondary" variant="outline" onClick={() => navigate('/products')}>
                            <Package className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                        <Button className="w-full justify-start text-body-secondary" variant="outline" onClick={() => navigate('/customers')}>
                            <Users className="mr-2 h-4 w-4" /> Add Customer
                        </Button>
                        <Button className="w-full justify-start text-body-secondary" variant="outline" onClick={() => navigate('/barcode')}>
                            <ScanBarcode className="mr-2 h-4 w-4" /> Barcode
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
