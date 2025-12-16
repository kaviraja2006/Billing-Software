import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
    TrendingUp,
    Users,
    Package,
    DollarSign,
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
import { useCustomers } from '../context/CustomerContext';

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                    <div className={cn("p-3 rounded-full", color)}>
                        <Icon size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center text-sm font-medium",
                    changeType === 'increase' ? "text-green-600" : "text-red-600"
                )}>
                    {changeType === 'increase' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                    {change}
                </div>
            </div>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    // Mock Data
    const { transactions } = useTransactions();
    const { customers } = useCustomers();
    const recentOrders = transactions.slice(0, 5); // Show only recent 5

    // Helper to extract numeric value from string amount (e.g. "$45.00" -> 45.00)
    const parseAmount = (amt) => {
        if (typeof amt === 'number') return amt;
        if (typeof amt === 'string') return parseFloat(amt.replace(/[^0-9.-]+/g, ""));
        return 0;
    };

    // Calculate Stats
    const totalSales = transactions.reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const totalOrders = transactions.length;
    const totalCustomers = customers ? customers.length : 0;

    // Stats Configuration
    const stats = [
        {
            title: 'Total Sales',
            value: `$${totalSales.toFixed(2)}`,
            change: '+12.5%',
            icon: DollarSign,
            color: 'bg-green-500', // Using bg-color for icon container as in component
        },
        {
            title: 'Total Orders',
            value: totalOrders.toString(),
            change: '+5.2%',
            icon: ShoppingBag, // Note: original used Package, but ShoppingBag was imported. Let's stick to imports
            color: 'bg-blue-500',
        },
        {
            title: 'Total Customers',
            value: totalCustomers.toString(),
            change: '+2.4%',
            icon: Users,
            color: 'bg-purple-500',
        },
        {
            title: 'Total Expenses',
            value: '$1,240',
            change: '-3.1%',
            icon: TrendingUp,
            color: 'bg-orange-500',
        },
    ];

    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/billing')} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <ShoppingCart className="mr-2 h-4 w-4" /> New Sale
                    </Button>
                    <Button variant="outline">Download Report</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            {/* Recent Orders */}
            <div className="grid gap-6 md:grid-cols-7">
                <Card className="md:col-span-4 lg:col-span-5">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                        <TableCell>{order.customer}</TableCell>
                                        <TableCell>{order.method}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={order.status === 'Completed' ? 'success' : order.status === 'Pending' ? 'warning' : 'destructive'}
                                                className="bg-opacity-15 text-opacity-100"
                                            >
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{order.amount}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Quick Actions / Side Panel */}
                <Card className="md:col-span-3 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" onClick={() => navigate('/billing')}>
                            <ShoppingCart className="mr-2 h-4 w-4" /> New Bill / Sale
                        </Button>
                        <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/products')}>
                            <Package className="mr-2 h-4 w-4" /> Add New Product
                        </Button>
                        <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/customers')}>
                            <Users className="mr-2 h-4 w-4" /> Register Customer
                        </Button>
                        <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/barcode')}>
                            <ScanBarcode className="mr-2 h-4 w-4" /> Generate Barcode
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
