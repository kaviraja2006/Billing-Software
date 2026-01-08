import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Eye, Download, Trash2 } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import { utils, writeFile } from 'xlsx';

const InvoicesPage = () => {
    const { transactions, deleteTransaction } = useTransactions();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter transactions
    const filteredTransactions = transactions.filter(t =>
        (t.id && t.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.customer && t.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await deleteTransaction(id);
            } catch (error) {
                alert('Failed to delete invoice');
            }
        }
    };

    const handleExport = () => {
        // Flatten data for report
        const dataToExport = filteredTransactions.map(t => ({
            InvoiceID: t.id,
            Date: t.date,
            Customer: t.customer,
            Amount: t.amount,
            Status: t.status,
            PaymentMethod: t.method
        }));

        const ws = utils.json_to_sheet(dataToExport);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Sales History");
        writeFile(wb, "sales_report.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Invoices & Sales History</h1>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <CardTitle>All Invoices</CardTitle>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search invoice # or customer..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium text-blue-600">{invoice.id}</TableCell>
                                            <TableCell>{invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>{invoice.customer || invoice.customerName || 'Walk-in Customer'}</TableCell>
                                            <TableCell className="font-bold">₹{(invoice.amount || invoice.total || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={invoice.status === 'Completed' || invoice.status === 'Paid' ? 'success' : invoice.status === 'Pending' ? 'warning' : 'destructive'}
                                                    className="bg-opacity-15 text-opacity-100"
                                                >
                                                    {invoice.status || 'Paid'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{invoice.method || invoice.paymentMethod || 'Cash'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewInvoice(invoice)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Eye className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(invoice.id)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            No invoices found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <InvoiceDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
};

export default InvoicesPage;
