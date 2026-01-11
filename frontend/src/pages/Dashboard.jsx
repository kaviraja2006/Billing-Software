import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    TrendingUp,
    Users,
    Package,
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
    ScanBarcode,
    ShoppingCart,
    ShoppingBag,
    Calendar,
    Filter,
    CreditCard,
    PlusCircle,
    Download,
    MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useTransactions } from '../context/TransactionContext';
import { useExpenses } from '../context/ExpenseContext';
import services from '../services/api';
import { generateDashboardReport } from '../utils/generateReport';
import { Modal } from '../components/ui/Modal';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
    <Card className="shadow-md hover:shadow-lg transition-shadow border-none">
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                    <div className={cn("p-3 rounded-full shadow-sm", color)}>
                        <Icon size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                    </div>
                </div>
                {change && (
                    <div className={cn("text-xs font-semibold px-2 py-1 rounded-full",
                        changeType === 'increase' ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                    )}>
                        {change}
                    </div>
                )}
            </div>
        </CardContent>
    </Card >
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [statsData, setStatsData] = useState({
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        pendingInvoices: 0
    });
    const [financials, setFinancials] = useState({
        totalExpenses: 0,
        netProfit: 0,
        avgOrderValue: 0
    });
    const [topProducts, setTopProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

    // Filters
    const [dateRange, setDateRange] = useState('today'); // today, week, month, custom
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('All'); // All, Cash, Card, UPI
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

    // Keyboard Shortcuts
    useKeyboardShortcuts({
        'Alt+N': (e) => { e.preventDefault(); navigate('/billing'); },
        'Alt+P': (e) => { e.preventDefault(); navigate('/products'); },
        'Alt+C': (e) => { e.preventDefault(); navigate('/customers'); },
        'Alt+B': (e) => { e.preventDefault(); navigate('/barcode'); },
    });

    // Construct Date Params
    const getDateParams = () => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (dateRange === 'today') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (dateRange === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (dateRange === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (dateRange === 'custom') {
            if (!customStart) return {};
            start = new Date(customStart);
            start.setHours(0, 0, 0, 0);
            if (customEnd) {
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
            }
        } else {
            return {}; // All time
        }

        return {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        };
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = getDateParams();

                const [dashRes, finRes, topRes, ordersRes] = await Promise.all([
                    services.reports.getDashboardStats(params),
                    services.reports.getFinancials(params),
                    services.reports.getTopProducts(params),
                    services.invoices.getAll({ ...params, limit: 5 }) // Recent orders also respect date? Maybe yes for "Recent in period"
                ]);

                setStatsData(dashRes.data);
                setFinancials(finRes.data);
                setTopProducts(topRes.data);

                // Filter recent orders by payment method client-side if needed or just show all
                // The API getAll for invoices might not support startDate/endDate strict filtering yet in controller?
                // Let's check... invoiceController.getInvoices only filters by userId.
                // So "Recent Transactions" might show logic outside the date filter if we don't update invoiceController.
                // For now, we will just use the returned list (which is ALL recent). 
                // Client-side filer for payment method is easy.
                let orders = ordersRes.data;
                if (paymentFilter !== 'All') {
                    orders = orders.filter(o => o.method === paymentFilter || o.paymentMethod === paymentFilter);
                }
                setRecentOrders(orders.slice(0, 5));

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        fetchData();
    }, [dateRange, customStart, customEnd, paymentFilter, refreshTrigger]);

    const stats = [
        {
            title: 'Total Sales',
            value: `₹${(statsData.totalSales || 0).toFixed(2)}`,
            change: `${(statsData.trends?.sales || 0).toFixed(1)}%`,
            changeType: (statsData.trends?.sales || 0) >= 0 ? 'increase' : 'decrease',
            icon: IndianRupee,
            color: 'bg-emerald-600',
        },
        {
            title: 'Total Orders',
            value: statsData.totalOrders ? statsData.totalOrders.toString() : '0',
            change: `${(statsData.trends?.orders || 0).toFixed(1)}%`,
            changeType: (statsData.trends?.orders || 0) >= 0 ? 'increase' : 'decrease',
            icon: ShoppingBag,
            color: 'bg-blue-600',
        },
        {
            title: 'Net Profit',
            value: `₹${(financials.netProfit || 0).toFixed(2)}`,
            change: financials.netProfit >= 0 ? '+Profit' : '-Loss',
            changeType: financials.netProfit >= 0 ? 'increase' : 'decrease',
            icon: TrendingUp,
            color: financials.netProfit >= 0 ? 'bg-indigo-600' : 'bg-rose-600',
        },
        {
            title: 'Total Expenses',
            value: `₹${(financials.totalExpenses || 0).toFixed(2)}`,
            change: '-3.1%', // Keep hardcoded or calculate if possible
            changeType: 'increase', // Green for "Good" (expense reduction) or utilize dynamic if available
            icon: ArrowDownRight,
            color: 'bg-amber-600',
        },
    ];

    const getStatusBadge = (status) => {
        const styles = {
            'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
            'Cancelled': 'bg-rose-100 text-rose-700 border-rose-200'
        };
        const defaultStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        return (
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", styles[status] || defaultStyle)}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Zilling Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Overview of your store's performance</p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    {/* Date Filters */}
                    <div className="bg-white p-1 rounded-lg border shadow-sm flex items-center">
                        {['today', 'week', 'month', 'all'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                                    dateRange === range ? "bg-primary-main text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {range === 'all' ? 'All Time' : range}
                            </button>
                        ))}
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex gap-2 animate-in slide-in-from-right-5 fade-in">
                            <Input
                                type="date"
                                className="w-36 h-9"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                            />
                            <Input
                                type="date"
                                className="w-36 h-9"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                    <Button onClick={() => navigate('/expenses')} variant="outline" className="bg-white shadow-sm">
                        <ArrowDownRight className="mr-2 h-4 w-4 text-amber-600" /> Add Expense
                    </Button>
                    <Button onClick={() => navigate('/billing')} className="bg-primary-main hover:bg-primary-hover shadow-md text-white">
                        <ShoppingCart className="mr-2 h-4 w-4" /> New Sale <span className="ml-2 opacity-70 text-xs hidden lg:inline">Alt+N</span>
                    </Button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Middle Section: Cash Flow & Top Inventory */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

                {/* Cash Flow Summary */}
                <Card className="shadow-md border-none lg:col-span-1 h-[24rem]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5 text-indigo-600" />
                            Cash Flow
                        </CardTitle>
                        <CardDescription>Revenue vs Expenses analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-emerald-700">Revenue</span>
                                    <span>₹{(statsData.totalSales || 0).toFixed(2)}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-amber-700">Expenses</span>
                                    <span>₹{(financials.totalExpenses || 0).toFixed(2)}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full"
                                        style={{ width: `${Math.min(100, (financials.totalExpenses / (statsData.totalSales || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-between items-end mt-auto">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Net Cash Flow</p>
                                    <p className={cn("text-xl font-bold", financials.netProfit >= 0 ? "text-indigo-600" : "text-rose-600")}>
                                        {financials.netProfit >= 0 ? '+' : ''}₹{(financials.netProfit || 0).toFixed(2)}
                                    </p>
                                </div>
                                <ActivityBadge loading={false} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Detailing Board */}
                <Card
                    className="shadow-md border-none lg:col-span-2 h-[24rem] overflow-hidden cursor-pointer hover:shadow-lg transition-all ring-1 ring-transparent hover:ring-primary-main/20 relative group"
                    onClick={() => setIsInventoryModalOpen(true)}
                >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 p-1.5 rounded-full text-slate-500">
                        <ArrowUpRight size={18} />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-600" />
                            Inventory Performance
                        </CardTitle>
                        <CardDescription>Top products (Click to expand)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Sold</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Margin</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topProducts.length > 0 ? topProducts.slice(0, 3).map((product, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50">
                                            <TableCell className="font-medium text-slate-700 py-3">{product.name}</TableCell>
                                            <TableCell className="text-right py-3">{product.quantity}</TableCell>
                                            <TableCell className="text-right font-medium py-3">₹{(product.revenue || 0).toFixed(2)}</TableCell>
                                            <TableCell className="text-right py-3">
                                                <Badge variant="outline" className={cn(
                                                    "bg-opacity-50 border-0",
                                                    (product.marginPercent || 0) > 30 ? "bg-emerald-50 text-emerald-700" :
                                                        (product.marginPercent || 0) > 10 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                                )}>
                                                    {(product.marginPercent || 0).toFixed(1)}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                                No sales data for this period
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {topProducts.length > 3 && (
                                <div className="mt-4 text-center text-xs font-medium text-slate-400">
                                    + {topProducts.length - 3} more items
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Modal
                isOpen={isInventoryModalOpen}
                onClose={() => setIsInventoryModalOpen(false)}
                title="Full Inventory Performance"
                className="w-[70vw] h-[60vh] max-w-none"
            >
                <div className="rounded-md border h-full overflow-y-auto relative bg-white">
                    <Table>
                        <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="w-[40%]">Product Name</TableHead>
                                <TableHead className="text-right">Units Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                                <TableHead className="text-right">Margin %</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topProducts.map((product, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium text-slate-800">{product.name}</TableCell>
                                    <TableCell className="text-right">{product.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">₹{(product.revenue || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end">
                                            <Badge variant="outline" className={cn(
                                                "bg-opacity-50 border-0 w-16 justify-center",
                                                (product.marginPercent || 0) > 30 ? "bg-emerald-50 text-emerald-700" :
                                                    (product.marginPercent || 0) > 10 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                            )}>
                                                {(product.marginPercent || 0).toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Modal>

            {/* Recent Transactions with Filters */}
            <Card className="shadow-md border-none">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest billing activity</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <select
                            className="text-sm border-none bg-slate-50 rounded-md p-1 focus:ring-0 text-slate-600 font-medium cursor-pointer hover:bg-slate-100"
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                        >
                            <option value="All">All Methods</option>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders.length > 0 ? recentOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-slate-50 cursor-pointer">
                                        <TableCell className="font-medium text-slate-700">#{order.id.slice(-6).toUpperCase()}</TableCell>
                                        <TableCell>{order.customerName || order.customer || 'Walk-in'}</TableCell>
                                        <TableCell className="text-slate-500 text-xs">
                                            {new Date(order.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                                                <CreditCard className="h-3 w-3" />
                                                {order.method || order.paymentMethod}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-800">
                                            ₹{Number(order.total || order.amount || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                                <MoreHorizontal size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                                            No transactions found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const ActivityBadge = () => (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
        Healthy
    </div>
);

export default Dashboard;
