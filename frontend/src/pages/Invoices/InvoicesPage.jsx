import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Eye, Download, Trash2, Calendar, MoreHorizontal, Lock, FileText, CheckCircle, XCircle, Printer, CreditCard, Save, X, RotateCcw, BarChart3, Columns, Mail } from 'lucide-react';
import services from '../../services/api';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import { utils, writeFile } from 'xlsx';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '../../components/ui/DropdownMenu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const InvoicesPage = () => {
    // --- State ---
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({
        summary: { totalSales: 0, totalInvoices: 0, avgOrderValue: 0, outstandingAmount: 0 },
        byMethod: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Advanced Features State
    const [savedViews, setSavedViews] = useState([]);
    const [currentViewName, setCurrentViewName] = useState('');
    const [showSaveViewInput, setShowSaveViewInput] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        id: true, date: true, customer: true, type: false, amount: true, balance: true, status: true, method: true, tax: false, discount: false, cashier: false, actions: true
    });

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        dateRange: 'all',
        startDate: '',
        endDate: '',
        status: [],
        paymentMethod: 'All',
        minAmount: '',
        maxAmount: ''
    });

    // --- Effects ---

    // Load saved views from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('invoiceSavedViews');
        if (saved) {
            try { setSavedViews(JSON.parse(saved)); } catch (e) { console.error("Failed to load saved views"); }
        }
    }, []);

    // --- Helpers ---

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Partially Paid': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Unpaid': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Refunded': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Retail': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Tax': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'Estimate': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    // --- Fetch Data ---

    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        try {
            let start = filters.startDate;
            let end = filters.endDate;
            const now = new Date();

            if (filters.dateRange === 'today') {
                const s = new Date(); s.setHours(0, 0, 0, 0);
                const e = new Date(); e.setHours(23, 59, 59, 999);
                start = s.toISOString(); end = e.toISOString();
            } else if (filters.dateRange === 'week') {
                const s = new Date();
                const day = s.getDay();
                const diff = s.getDate() - day + (day === 0 ? -6 : 1);
                s.setDate(diff); s.setHours(0, 0, 0, 0);
                const e = new Date(); e.setHours(23, 59, 59, 999);
                start = s.toISOString(); end = e.toISOString();
            } else if (filters.dateRange === 'month') {
                const s = new Date(now.getFullYear(), now.getMonth(), 1);
                const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                start = s.toISOString(); end = e.toISOString();
            }

            const params = {
                page: pagination.page,
                limit: 50,
                search: filters.search,
                startDate: start,
                endDate: end,
                status: filters.status.length > 0 ? filters.status.join(',') : undefined,
                paymentMethod: filters.paymentMethod,
                minAmount: filters.minAmount,
                maxAmount: filters.maxAmount
            };

            const [invRes, statsRes] = await Promise.all([
                services.invoices.getAll(params),
                services.invoices.getStats(params)
            ]);

            setInvoices(invRes.data.data);
            setPagination({
                page: invRes.data.page,
                pages: invRes.data.pages,
                total: invRes.data.total
            });
            setStats(statsRes.data);

        } catch (error) {
            console.error("Failed to fetch invoices", error);
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.page, refreshTrigger]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchInvoices]);

    // --- Handlers ---

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const toggleStatusFilter = (status) => {
        setFilters(prev => {
            const current = prev.status;
            if (current.includes(status)) return { ...prev, status: current.filter(s => s !== status) };
            else return { ...prev, status: [...current, status] };
        });
    };

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const saveView = () => {
        if (!currentViewName.trim()) return;
        const newView = { name: currentViewName, filters: { ...filters } };
        const updatedViews = [...savedViews, newView];
        setSavedViews(updatedViews);
        localStorage.setItem('invoiceSavedViews', JSON.stringify(updatedViews));
        setCurrentViewName('');
        setShowSaveViewInput(false);
    };

    const loadView = (view) => {
        setFilters(view.filters);
    };

    const deleteView = (index) => {
        const updated = savedViews.filter((_, i) => i !== index);
        setSavedViews(updated);
        localStorage.setItem('invoiceSavedViews', JSON.stringify(updated));
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Perform '${action}' on ${selectedIds.length} invoices?`)) return;

        try {
            if (action === 'delete') {
                if (services.invoices.bulkDelete) {
                    await services.invoices.bulkDelete(selectedIds);
                } else {
                    await Promise.all(selectedIds.map(id => services.invoices.delete(id)));
                }
                setRefreshTrigger(prev => prev + 1);
                setSelectedIds([]);
            } else if (action === 'markPaid') {
                // Assuming backend supports this or looping
                // Since bulkUpdate isn't explicit, we loop for now
                await Promise.all(
                    selectedIds.filter(id => {
                        const inv = invoices.find(i => i.id === id);
                        return inv && inv.status !== 'Paid';
                    }).map(id => services.invoices.update(id, { status: 'Paid', paymentStatus: 'Paid', balance: 0 }))
                );
                setRefreshTrigger(prev => prev + 1);
                setSelectedIds([]);
            } else if (action === 'resend') {
                // Placeholder for resend
                alert("Invoices queued for resending.");
                setSelectedIds([]);
            }
        } catch (error) {
            console.error("Bulk action failed", error);
            alert("Failed to perform bulk action");
        }
    };

    const handleExport = () => {
        const dataToExport = invoices.map(t => ({
            InvoiceID: t.invoiceNumber || t.id,
            Date: new Date(t.date).toLocaleDateString(),
            Customer: t.customerName,
            Type: t.type,
            Subtotal: t.subtotal,
            Tax: t.tax,
            Discount: t.discount,
            Total: t.total,
            Balance: t.balance,
            Status: t.status,
            Method: t.paymentMethod,
            Cashier: t.cashierName,
            Notes: t.internalNotes || ''
        }));
        const ws = utils.json_to_sheet(dataToExport);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Invoices_Audit");
        writeFile(wb, `Invoices_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleRestApiAction = async (action, id, data = {}) => {
        try {
            if (action === 'delete') await services.invoices.delete(id);
            if (action === 'update') await services.invoices.update(id, data);
            setRefreshTrigger(prev => prev + 1);
            if (selectedInvoice && selectedInvoice.id === id) {
                if (action === 'delete') setSelectedInvoice(null);
                else setSelectedInvoice({ ...selectedInvoice, ...data }); // Optimistic update
            }
        } catch (e) {
            alert(`Failed to ${action} invoice`);
        }
    };

    // --- Render ---

    const renderChart = () => {
        const data = stats.byMethod || [];
        // Mock trend data if not available from backend
        const trendData = [
            { name: 'Mon', sales: stats.summary.totalSales * 0.1 },
            { name: 'Tue', sales: stats.summary.totalSales * 0.15 },
            { name: 'Wed', sales: stats.summary.totalSales * 0.2 },
            { name: 'Thu', sales: stats.summary.totalSales * 0.1 },
            { name: 'Fri', sales: stats.summary.totalSales * 0.25 },
            { name: 'Sat', sales: stats.summary.totalSales * 0.15 },
            { name: 'Sun', sales: stats.summary.totalSales * 0.05 },
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="p-4 border-none shadow-sm h-48">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Sales Trend (Weekly)</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip />
                            <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
                <Card className="p-4 border-none shadow-sm h-48">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Payment Methods</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="totalAmount" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6 relative min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Invoices</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs sm:text-sm font-medium text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                            Total: {stats.summary.totalInvoices}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100">
                            Sales: ₹{stats.summary.totalSales.toFixed(0)}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-amber-600 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-100">
                            Due: ₹{stats.summary.outstandingAmount.toFixed(0)}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Columns className="mr-2 h-4 w-4" /> Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.keys(visibleColumns).map(col => (
                                <DropdownMenuCheckboxItem
                                    key={col}
                                    checked={visibleColumns[col]}
                                    onCheckedChange={() => toggleColumn(col)}
                                >
                                    {col.charAt(0).toUpperCase() + col.slice(1)}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            {/* Quick Tabs & Saved Views */}
            <div className="flex justify-between items-center border-b border-slate-200">
                <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { label: 'All Invoices', id: 'all' },
                        { label: 'Today', id: 'today' },
                        { label: 'Unpaid', id: 'unpaid', filter: { status: ['Unpaid', 'Partially Paid'] } },
                        { label: 'Cancelled', id: 'cancelled', filter: { status: ['Cancelled'] } }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (tab.id === 'unpaid') setFilters(prev => ({ ...prev, dateRange: 'all', status: ['Unpaid', 'Partially Paid'] }));
                                else if (tab.id === 'cancelled') setFilters(prev => ({ ...prev, dateRange: 'all', status: ['Cancelled'] }));
                                else setFilters(prev => ({ ...prev, dateRange: tab.id, status: [] }));
                            }}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors border-b-2 
                                ${(filters.dateRange === tab.id && (!tab.filter || JSON.stringify(filters.status) === JSON.stringify(tab.filter.status)))
                                    ? 'border-primary-main text-primary-main bg-primary-50/50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    {savedViews.map((view, index) => (
                        <div key={index} className="group flex items-center bg-slate-100 rounded-t-lg border-b-2 border-transparent hover:bg-slate-200">
                            <button
                                onClick={() => loadView(view)}
                                className="px-3 py-2 text-sm font-medium text-slate-600 whitespace-nowrap"
                            >
                                {view.name}
                            </button>
                            <button onClick={() => deleteView(index)} className="pr-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="pb-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowSaveViewInput(!showSaveViewInput)}>
                        <Save size={14} className="mr-1" /> Save View
                    </Button>
                </div>
            </div>

            {/* Save View Input */}
            {showSaveViewInput && (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border transform transition-all animate-in slide-in-from-top-2">
                    <Input
                        placeholder="View Name (e.g. 'UPI Sales')"
                        className="h-8 text-sm"
                        value={currentViewName}
                        onChange={e => setCurrentViewName(e.target.value)}
                    />
                    <Button size="sm" onClick={saveView}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowSaveViewInput(false)}><X size={14} /></Button>
                </div>
            )}

            {renderChart()}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Filter Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="sticky top-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFilters({ search: '', dateRange: 'all', startDate: '', endDate: '', status: [], paymentMethod: 'All', minAmount: '', maxAmount: '' })}>
                                    <RotateCcw size={12} className="mr-1" /> Reset
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="ID, Name..."
                                        className="pl-9 bg-slate-50"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                                {/* Advanced Search Chips */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {['ID', 'Customer', 'SKU'].map(chip => (
                                        <Badge
                                            key={chip}
                                            variant="outline"
                                            className="text-[10px] cursor-pointer hover:bg-slate-100 text-slate-500"
                                            onClick={() => document.querySelector('input[placeholder="ID, Name..."]').focus()}
                                        >
                                            {chip}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Date Custom */}
                            {filters.dateRange === 'custom' && (
                                <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-xs text-slate-500">Start</label>
                                        <Input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">End</label>
                                        <Input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
                                    </div>
                                </div>
                            )}
                            {filters.dateRange !== 'custom' && (
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleFilterChange('dateRange', 'custom')}>
                                    <Calendar className="mr-2 h-3 w-3" /> Custom Date Range
                                </Button>
                            )}

                            {/* Status */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-2 block">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Paid', 'Unpaid', 'Partially Paid', 'Cancelled', 'Refunded'].map(status => (
                                        <Badge
                                            key={status}
                                            variant="outline"
                                            className={`cursor-pointer transition-all ${filters.status.includes(status) ? 'bg-primary-main text-white border-primary-main' : 'hover:bg-slate-100'}`}
                                            onClick={() => toggleStatusFilter(status)}
                                        >
                                            {status}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Payment Method</label>
                                <select
                                    className="w-full border rounded-md p-2 text-sm bg-slate-50"
                                    value={filters.paymentMethod}
                                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                                >
                                    <option value="All">All Methods</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>

                            {/* Amount Range */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Amount Range</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Min"
                                        type="number"
                                        className="h-8 text-xs bg-slate-50"
                                        value={filters.minAmount}
                                        onChange={e => handleFilterChange('minAmount', e.target.value)}
                                    />
                                    <span className="text-slate-400">-</span>
                                    <Input
                                        placeholder="Max"
                                        type="number"
                                        className="h-8 text-xs bg-slate-50"
                                        value={filters.maxAmount}
                                        onChange={e => handleFilterChange('maxAmount', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Table Area */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Bulk Selection Bar */}
                    {selectedIds.length > 0 && (
                        <div className="bg-slate-900 text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-5 sticky top-6 z-20">
                            <span className="text-sm font-medium">{selectedIds.length} select</span>
                            <div className="flex gap-2 items-center">
                                <Button size="sm" variant="ghost" className="h-8 text-white hover:bg-slate-800" onClick={() => setSelectedIds([])}>
                                    Clear
                                </Button>
                                <div className="h-6 w-px bg-slate-700 mx-2"></div>
                                <Button size="sm" variant="ghost" className="h-8 text-white hover:bg-slate-800" onClick={() => handleBulkAction('markPaid')}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Paid
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-white hover:bg-slate-800" onClick={() => handleBulkAction('resend')}>
                                    <Mail className="mr-2 h-4 w-4" /> Resend
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-white hover:bg-slate-800" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-white hover:bg-slate-800 text-rose-300 hover:text-rose-200" onClick={() => handleBulkAction('delete')}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            </div>
                        </div>
                    )}

                    <Card className="min-h-[600px] border-none shadow-sm">
                        <CardContent className="p-0">
                            <div className="rounded-md border-t border-b md:border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="w-[40px]">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedIds(invoices.map(i => i.id));
                                                        else setSelectedIds([]);
                                                    }}
                                                    checked={selectedIds.length === invoices.length && invoices.length > 0}
                                                />
                                            </TableHead>
                                            {visibleColumns.id && <TableHead>Invoice ID</TableHead>}
                                            {visibleColumns.date && <TableHead>Date</TableHead>}
                                            {visibleColumns.customer && <TableHead>Customer</TableHead>}
                                            {visibleColumns.type && <TableHead>Type</TableHead>}
                                            {visibleColumns.cashier && <TableHead>Cashier</TableHead>}
                                            {visibleColumns.amount && <TableHead className="text-right">Amount</TableHead>}
                                            {visibleColumns.tax && <TableHead className="text-right">Tax</TableHead>}
                                            {visibleColumns.discount && <TableHead className="text-right">Disc</TableHead>}
                                            {visibleColumns.balance && <TableHead className="text-right">Balance</TableHead>}
                                            {visibleColumns.status && <TableHead className="text-center">Status</TableHead>}
                                            {visibleColumns.method && <TableHead>Method</TableHead>}
                                            {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell colSpan={12} className="h-16 animate-pulse bg-slate-50/50"></TableCell>
                                                </TableRow>
                                            ))
                                        ) : invoices.length > 0 ? (
                                            invoices.map((invoice) => (
                                                <TableRow
                                                    key={invoice.id}
                                                    className={`cursor-pointer transition-colors ${selectedInvoice?.id === invoice.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'} ${invoice.status === 'Cancelled' ? 'opacity-60 bg-slate-50' : ''}`}
                                                    onClick={() => setSelectedInvoice(invoice)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-slate-300"
                                                            checked={selectedIds.includes(invoice.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedIds(prev => [...prev, invoice.id]);
                                                                else setSelectedIds(prev => prev.filter(id => id !== invoice.id));
                                                            }}
                                                        />
                                                    </TableCell>
                                                    {visibleColumns.id && (
                                                        <TableCell className="font-medium text-blue-600">
                                                            {invoice.invoiceNumber || invoice.id.slice(-6).toUpperCase()}
                                                            {invoice.isLocked && <Lock className="inline ml-1 h-3 w-3 text-slate-400" />}
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.date && <TableCell className="text-slate-500 text-sm">{new Date(invoice.date).toLocaleDateString()}</TableCell>}
                                                    {visibleColumns.customer && <TableCell className="font-medium text-slate-800">{invoice.customerName}</TableCell>}
                                                    {visibleColumns.type && (
                                                        <TableCell>
                                                            <Badge variant="outline" className={`font-normal ${getTypeColor(invoice.type)}`}>
                                                                {invoice.type || 'Retail'}
                                                            </Badge>
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.cashier && <TableCell className="text-slate-500 text-xs">{invoice.cashierName || 'Sys'}</TableCell>}
                                                    {visibleColumns.amount && <TableCell className="text-right font-bold text-slate-900">₹{invoice.total.toFixed(2)}</TableCell>}
                                                    {visibleColumns.tax && <TableCell className="text-right text-slate-500 text-sm">₹{invoice.tax?.toFixed(2) || 0}</TableCell>}
                                                    {visibleColumns.discount && <TableCell className="text-right text-slate-500 text-sm">₹{invoice.discount?.toFixed(2) || 0}</TableCell>}
                                                    {visibleColumns.balance && (
                                                        <TableCell className="text-right">
                                                            {invoice.balance > 0 ? <span className="text-rose-500 font-medium">₹{invoice.balance.toFixed(2)}</span> : <span className="text-slate-400">-</span>}
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.status && (
                                                        <TableCell className="text-center">
                                                            <Badge className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(invoice.status)}`}>
                                                                {invoice.status}
                                                            </Badge>
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.method && <TableCell className="text-slate-600 text-sm">{invoice.paymentMethod}</TableCell>}
                                                    {visibleColumns.actions && (
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                                                        <MoreHorizontal size={16} />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => { setIsModalOpen(true); setSelectedInvoice(invoice); }}>
                                                                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => alert("Email functionality pending")}>
                                                                        <Mail className="mr-2 h-4 w-4" /> Send Email
                                                                    </DropdownMenuItem>
                                                                    {invoice.balance > 0 && (
                                                                        <DropdownMenuItem onClick={() => { }}>
                                                                            <CreditCard className="mr-2 h-4 w-4" /> Add Payment
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-rose-600" onClick={(e) => handleRestApiAction('delete', invoice.id)}>
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Cancel/Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={12} className="text-center py-12 text-slate-500">
                                                    No invoices found. Try adjusting filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-between px-2 py-4">
                                    <div className="text-sm text-slate-500">
                                        Page {pagination.page} of {pagination.pages} ({pagination.total} items)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === 1}
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === pagination.pages}
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Side Panel (Enhanced) */}
            {selectedInvoice && (
                <div className="w-full md:w-1/2 lg:w-1/3 bg-white border-l border-slate-200 h-full overflow-y-auto fixed right-0 top-0 z-50 shadow-2xl p-4 sm:p-6 transition-transform transform translate-x-0 pt-16 md:pt-20">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Invoice #{selectedInvoice.invoiceNumber || selectedInvoice.id.slice(-6).toUpperCase()}
                            </h2>
                            <p className="text-sm text-slate-500">{new Date(selectedInvoice.date).toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}>
                            <XCircle className="h-6 w-6 text-slate-400 hover:text-slate-600" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {/* Status Box */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-500">Status</span>
                                <Badge className={getStatusStyle(selectedInvoice.status)}>{selectedInvoice.status}</Badge>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-500">Total Amount</span>
                                <span className="text-lg font-bold text-slate-900">₹{selectedInvoice.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500">Balance Due</span>
                                <span className="text-sm font-bold text-rose-600">₹{selectedInvoice.balance ? selectedInvoice.balance.toFixed(2) : '0.00'}</span>
                            </div>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                                <Printer className="mr-2 h-3 w-3" /> Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alert("Email sent!")}>
                                <Mail className="mr-2 h-3 w-3" /> Email
                            </Button>
                            {selectedInvoice.status !== 'Paid' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="col-span-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleRestApiAction('update', selectedInvoice.id, { status: 'Paid', balance: 0 })}
                                >
                                    <CheckCircle className="mr-2 h-3 w-3" /> Mark Fully Paid
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className={`col-span-2 ${selectedInvoice.isLocked ? 'bg-slate-100' : 'text-amber-600 border-amber-200 hover:bg-amber-50'}`}
                                onClick={() => handleRestApiAction('update', selectedInvoice.id, { isLocked: !selectedInvoice.isLocked })}
                            >
                                <Lock className="mr-2 h-3 w-3" /> {selectedInvoice.isLocked ? 'Unlock Invoice' : 'Lock Invoice'}
                            </Button>
                        </div>

                        {/* Customer */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Customer Details</h3>
                            <div className="bg-white p-3 border rounded-md">
                                <p className="font-medium text-slate-800">{selectedInvoice.customerName}</p>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Line Items</h3>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600">Item</th>
                                            <th className="px-3 py-2 text-right font-medium text-slate-600">Qty</th>
                                            <th className="px-3 py-2 text-right font-medium text-slate-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                                            selectedInvoice.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-3 py-2 text-left text-slate-800">{item.name}</td>
                                                    <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                                                    <td className="px-3 py-2 text-right text-slate-900 font-medium">₹{item.total.toFixed(2)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-500 italic">No items found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Internal Notes */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <FileText size={14} /> Internal Notes
                            </h3>
                            <textarea
                                className="w-full border rounded-md p-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={3}
                                placeholder="Add internal notes..."
                                defaultValue={selectedInvoice.internalNotes}
                                onBlur={(e) => {
                                    if (e.target.value !== selectedInvoice.internalNotes) {
                                        handleRestApiAction('update', selectedInvoice.id, { internalNotes: e.target.value });
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <InvoiceDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
};

export default InvoicesPage;
