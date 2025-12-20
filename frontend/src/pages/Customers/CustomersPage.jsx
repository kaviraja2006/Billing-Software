import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Search, UserPlus, Filter, Edit, Eye, Phone, Mail, Trash2 } from 'lucide-react';
import CustomerDrawer from './CustomerDrawer';
import { useCustomers } from '../../context/CustomerContext';

const CustomersPage = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer, loading } = useCustomers();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setIsDrawerOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setIsDrawerOpen(true);
    };

    const handleSaveCustomer = async (customerData) => {
        try {
            if (selectedCustomer) {
                await updateCustomer(selectedCustomer.id, customerData);
            } else {
                await addCustomer(customerData);
            }
            setIsDrawerOpen(false);
        } catch (error) {
            alert('Failed to save customer');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await deleteCustomer(id);
            } catch (error) {
                alert('Failed to delete customer');
            }
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading customers...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search customers by name, phone or email..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead className="text-center">Visits</TableHead>
                            <TableHead className="text-right">Total Spent</TableHead>
                            <TableHead className="text-right">Outstanding Due</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell className="font-medium text-slate-900">{customer.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>
                                        <span className="flex items-center gap-1"><Mail size={12} /> {customer.email || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">{customer.totalVisits}</TableCell>
                                <TableCell className="text-right">${customer.totalSpent.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    {customer.due > 0 ? (
                                        <span className="text-red-600 font-medium">${customer.due.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(customer)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                            <Eye size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(customer.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                    No customers found matching your search.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
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
