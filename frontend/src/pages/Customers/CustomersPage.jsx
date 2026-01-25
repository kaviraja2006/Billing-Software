import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Search, UserPlus, Filter, Eye, Phone, Mail, Trash2, X, Users, TrendingUp, AlertCircle, Award } from 'lucide-react';
import CustomerDrawer from './CustomerDrawer';
import { useCustomers } from '../../context/CustomerContext';
import { useToast } from '../../context/ToastContext';

const CustomersPage = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer, loading } = useCustomers();
    const toast = useToast();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        customerType: '',
        tags: [],
        source: ''
    });

    // Calculate customer statistics
    const stats = useMemo(() => {
        const totalCustomers = customers.length;
        const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        const totalDue = customers.reduce((sum, c) => sum + (c.due || 0), 0);
        const vipCustomers = customers.filter(c => c.tags?.includes('VIP')).length;

        return { totalCustomers, totalRevenue, totalDue, vipCustomers };
    }, [customers]);

    const filteredCustomers = customers.filter(c => {
        const fullName = c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim();
        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = !filters.customerType || c.customerType === filters.customerType;
        const matchesTags = filters.tags.length === 0 || filters.tags.some(tag => c.tags?.includes(tag));
        const matchesSource = !filters.source || c.source === filters.source;

        return matchesSearch && matchesType && matchesTags && matchesSource;
    });

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setIsDrawerOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setIsDrawerOpen(true);
    };

    const handleSaveCustomer = async (customerData, addAnother = false) => {
        try {
            if (selectedCustomer) {
                await updateCustomer(selectedCustomer.id, customerData);
            } else {
                await addCustomer(customerData);
            }
            if (!addAnother) {
                setIsDrawerOpen(false);
            }
        } catch (error) {
            toast.error('Failed to save customer');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await deleteCustomer(id);
            } catch (error) {
                toast.error('Failed to delete customer');
            }
        }
    };

    const toggleFilter = (type, value) => {
        if (type === 'tags') {
            setFilters(prev => ({
                ...prev,
                tags: prev.tags.includes(value)
                    ? prev.tags.filter(t => t !== value)
                    : [...prev.tags, value]
            }));
        } else {
            setFilters(prev => ({
                ...prev,
                [type]: prev[type] === value ? '' : value
            }));
        }
    };

    const clearFilters = () => {
        setFilters({
            customerType: '',
            tags: [],
            source: ''
        });
    };

    const hasActiveFilters = filters.customerType || filters.tags.length > 0 || filters.source;

    const getTagBadge = (tag) => {
        const colors = {
            'VIP': 'bg-purple-100 text-purple-700 border-purple-200',
            'Wholesale': 'bg-blue-100 text-blue-700 border-blue-200',
            'Credit': 'bg-orange-100 text-orange-700 border-orange-200'
        };
        return colors[tag] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getTypeBadge = (type) => {
        return type === 'Business'
            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
            : 'bg-green-100 text-green-700 border-green-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading customers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                    <p className="text-slate-600 mt-1">Manage your customer relationships</p>
                </div>
                <Button onClick={handleAddNew} variant="primary" className="shadow-lg hover:shadow-xl transition-shadow">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Total Customers</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalCustomers}</p>
                        </div>
                        <div className="bg-blue-200 p-3 rounded-lg">
                            <Users className="h-6 w-6 text-blue-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Total Revenue</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">₹{stats.totalRevenue.toFixed(0)}</p>
                        </div>
                        <div className="bg-green-200 p-3 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Outstanding Due</p>
                            <p className="text-3xl font-bold text-red-900 mt-2">₹{stats.totalDue.toFixed(0)}</p>
                        </div>
                        <div className="bg-red-200 p-3 rounded-lg">
                            <AlertCircle className="h-6 w-6 text-red-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">VIP Customers</p>
                            <p className="text-3xl font-bold text-purple-900 mt-2">{stats.vipCustomers}</p>
                        </div>
                        <div className="bg-purple-200 p-3 rounded-lg">
                            <Award className="h-6 w-6 text-purple-700" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by name, phone, or email..."
                            className="pl-11 h-11 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-11 ${hasActiveFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-300'}`}
                        >
                            <Filter className="mr-2 h-4 w-4" /> Filter
                            {hasActiveFilters && (
                                <span className="ml-2 bg-blue-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-semibold">
                                    {filters.tags.length + (filters.customerType ? 1 : 0) + (filters.source ? 1 : 0)}
                                </span>
                            )}
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="h-11 text-red-600 hover:bg-red-50 border-red-300"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Dropdown */}
                {showFilters && (
                    <div className="mt-5 p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Customer Type Filter */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-3 block">Customer Type</label>
                                <div className="space-y-2">
                                    {['Individual', 'Business'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => toggleFilter('customerType', type)}
                                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.customerType === type
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags Filter */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-3 block">Tags</label>
                                <div className="space-y-2">
                                    {['VIP', 'Wholesale', 'Credit'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleFilter('tags', tag)}
                                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.tags.includes(tag) ?
                                                tag === 'VIP' ? 'bg-purple-600 text-white shadow-md' :
                                                    tag === 'Wholesale' ? 'bg-blue-600 text-white shadow-md' :
                                                        'bg-orange-600 text-white shadow-md'
                                                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Source Filter */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-3 block">Source</label>
                                <div className="space-y-2">
                                    {['Walk-in', 'WhatsApp', 'Instagram', 'Referral', 'Other'].map(source => (
                                        <button
                                            key={source}
                                            onClick={() => toggleFilter('source', source)}
                                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.source === source
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                                                }`}
                                        >
                                            {source}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Customers Table Desktop */}
            <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold">Customer</TableHead>
                            <TableHead className="font-semibold">Contact</TableHead>
                            <TableHead className="text-center font-semibold">Type & Tags</TableHead>
                            <TableHead className="text-center font-semibold">Visits</TableHead>
                            <TableHead className="text-right font-semibold">Total Spent</TableHead>
                            <TableHead className="text-right font-semibold">Due</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map((customer) => (
                            <TableRow key={customer.id || customer._id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="font-semibold text-slate-900">
                                    {customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                                        <span className="flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400" /> {customer.phone}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Mail size={13} className="text-slate-400" /> {customer.email || '-'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                        {customer.customerType && (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeBadge(customer.customerType)}`}>
                                                {customer.customerType}
                                            </span>
                                        )}
                                        {Array.isArray(customer.tags) && customer.tags.map(tag => (
                                            <span key={tag} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTagBadge(tag)}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-sm font-medium">
                                        {customer.totalVisits || 0}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-slate-900">
                                    ₹{(customer.totalSpent || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {(customer.due || 0) > 0 ? (
                                        <span className="inline-flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                                            ₹{(customer.due || 0).toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(customer)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <Users className="h-16 w-16 text-slate-300 mb-4" />
                                        <p className="text-lg font-medium">No customers found</p>
                                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Customers List Mobile */}
            <div className="md:hidden space-y-4">
                {filteredCustomers.map((customer) => (
                    <div key={customer.id || customer._id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3">
                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-slate-900">{customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()}</h3>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Total Spent</p>
                                <p className="font-bold text-slate-900">₹{(customer.totalSpent || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-slate-400" />
                                <span>{customer.phone}</span>
                            </div>
                            {customer.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" />
                                    <span>{customer.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-b border-slate-50 my-2">
                            <div className="text-center">
                                <span className="text-xs text-slate-500 block">Visits</span>
                                <span className="font-medium text-slate-900">{customer.totalVisits || 0}</span>
                            </div>
                            <div className="text-center">
                                <span className="text-xs text-slate-500 block">Due Amount</span>
                                {(customer.due || 0) > 0 ? (
                                    <span className="text-red-600 font-bold">₹{(customer.due || 0).toFixed(2)}</span>
                                ) : (
                                    <span className="text-slate-400">-</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 text-sm">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(customer)}
                                className="h-8 text-xs"
                            >
                                <Eye className="mr-1.5 h-3 w-3" /> View Details
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(customer.id)}
                                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                            >
                                <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                            </Button>
                        </div>
                    </div>
                ))}
                {filteredCustomers.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        No customers found matching your search.
                    </div>
                )}
            </div>

            <CustomerDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                customer={selectedCustomer}
                onSave={handleSaveCustomer}
            />
        </div>
    );
};

export default CustomersPage;
