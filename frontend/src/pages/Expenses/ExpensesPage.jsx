import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Search, Plus, FileText, Edit, Paperclip, Trash2, Download, MoreHorizontal } from 'lucide-react';
import ExpenseModal from '../Expenses/ExpenseModal';
import { Modal } from '../../components/ui/Modal';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import CategoryFilter from '../../components/CategoryFilter/CategoryFilter';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '../../components/ui/DropdownMenu';
import { BulkActionsToolbar } from '../../components/Expenses/BulkActionsToolbar';
import { RecurringBadge } from '../../components/Expenses/RecurringBadge';
import { useExpenses } from '../../context/ExpenseContext';
import { exportToCSV } from '../../utils/csvExport';
import { utils, writeFile } from 'xlsx';
import { SAMPLE_CATEGORIES } from '../../utils/expenseConstants';
import { isSearchMatch } from '../../utils/searchUtils';

const ExpensesPage = () => {
    const { expenses, deleteExpense, bulkUpdateExpenses, bulkDeleteExpenses, exportToCSV: exportFromAPI, uploadReceipt } = useExpenses();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedExpenses, setSelectedExpenses] = useState([]);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        type: 'this_month',
        startDate: '',
        endDate: '',
        specificMonth: ''
    });

    // Filter Logic
    const filteredExpenses = expenses.filter(e => {
        // Search filter
        const matchesSearch = isSearchMatch(e.title, searchTerm) ||
            isSearchMatch(e.category, searchTerm) ||
            isSearchMatch(e.paymentMethod, searchTerm) ||
            isSearchMatch(e.reference, searchTerm);

        // Date range filter
        let matchesDateRange = true;
        if (dateRange) {
            const expenseDate = new Date(e.date);
            expenseDate.setHours(0, 0, 0, 0);

            const startDate = new Date(dateRange.startDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(dateRange.endDate);
            endDate.setHours(23, 59, 59, 999);

            matchesDateRange = expenseDate >= startDate && expenseDate <= endDate;
        }

        // Category filter
        const matchesCategory = !selectedCategory || e.category === selectedCategory;

        return matchesSearch && matchesDateRange && matchesCategory;
    });

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedExpenses.length === filteredExpenses.length) {
            setSelectedExpenses([]);
        } else {
            setSelectedExpenses(filteredExpenses.map(e => e.id));
        }
    };

    const toggleSelectExpense = (id) => {
        setSelectedExpenses(prev =>
            prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
        );
    };

    // Bulk action handlers
    const handleBulkCategoryChange = async (category) => {
        try {
            await bulkUpdateExpenses(selectedExpenses, { category });
            setSelectedExpenses([]);
            setSelectedExpenses([]);
        } catch (error) {
            if (window.electron && window.electron.showAlert) {
                await window.electron.showAlert('Failed to update categories', 'error');
            } else {
                alert('Failed to update categories');
            }
        }
    };

    const handleBulkMarkRecurring = async () => {
        const frequency = prompt('Enter frequency (weekly, monthly, quarterly, yearly):');
        if (!frequency || !['weekly', 'monthly', 'quarterly', 'yearly'].includes(frequency.toLowerCase())) {
            alert('Invalid frequency');
            return;
        }

        try {
            await bulkUpdateExpenses(selectedExpenses, {
                isRecurring: true,
                frequency: frequency.toLowerCase()
            });
            setSelectedExpenses([]);
            setSelectedExpenses([]);
        } catch (error) {
            if (window.electron && window.electron.showAlert) {
                await window.electron.showAlert('Failed to mark as recurring', 'error');
            } else {
                alert('Failed to mark as recurring');
            }
        }
    };

    const handleBulkExportCSV = () => {
        const selectedExpenseData = expenses.filter(e => selectedExpenses.includes(e.id));
        exportToCSV(selectedExpenseData, `selected-expenses-${Date.now()}.csv`);
    };

    const handleBulkDelete = async () => {
        let confirmed = false;
        if (window.electron && window.electron.showConfirm) {
            confirmed = await window.electron.showConfirm(`Delete ${selectedExpenses.length} expenses?`);
        } else {
            confirmed = window.confirm(`Delete ${selectedExpenses.length} expenses?`);
        }

        if (!confirmed) return;

        try {
            await bulkDeleteExpenses(selectedExpenses);
            setSelectedExpenses([]);
        } catch (error) {
            if (window.electron && window.electron.showAlert) {
                await window.electron.showAlert('Failed to delete expenses', 'error');
            } else {
                alert('Failed to delete expenses');
            }
        }
    };

    // Individual action handlers
    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setIsViewOnly(false);
        setIsModalOpen(true);
    };

    const handleView = (expense) => {
        setEditingExpense(expense);
        setIsViewOnly(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        let confirmed = false;
        if (window.electron && window.electron.showConfirm) {
            confirmed = await window.electron.showConfirm('Delete this expense?');
        } else {
            confirmed = window.confirm('Delete this expense?');
        }

        if (!confirmed) return;

        try {
            await deleteExpense(id);
        } catch (error) {
            if (window.electron && window.electron.showAlert) {
                await window.electron.showAlert('Failed to delete expense', 'error');
            } else {
                alert('Failed to delete expense');
            }
        }
    };

    const handleAttachReceipt = async (expenseId) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await uploadReceipt(expenseId, file);
                    if (window.electron && window.electron.showAlert) {
                        await window.electron.showAlert('Receipt uploaded successfully!', 'info');
                    } else {
                        alert('Receipt uploaded successfully!');
                    }
                } catch (error) {
                    console.error('Receipt upload error:', error);
                    if (window.electron && window.electron.showAlert) {
                        await window.electron.showAlert(`Failed to upload receipt: ${error.message}`, 'error');
                    } else {
                        alert(`Failed to upload receipt: ${error.message}`);
                    }
                }
            }
        };
        input.click();
    };

    const handleConfirmExport = async () => {
        try {
            let start, end;
            const now = new Date();

            if (exportOptions.type === 'this_month') {
                const s = new Date(now.getFullYear(), now.getMonth(), 1);
                const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                start = s.getTime(); end = e.getTime();
            } else if (exportOptions.type === 'last_month') {
                const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                start = s.getTime(); end = e.getTime();
            } else if (exportOptions.type === 'specific_month' && exportOptions.specificMonth) {
                const [year, month] = exportOptions.specificMonth.split('-');
                const s = new Date(parseInt(year), parseInt(month) - 1, 1);
                const e = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
                start = s.getTime(); end = e.getTime();
            } else if (exportOptions.type === 'date_range' && exportOptions.startDate && exportOptions.endDate) {
                const s = new Date(exportOptions.startDate);
                s.setHours(0, 0, 0, 0);
                const e = new Date(exportOptions.endDate);
                e.setHours(23, 59, 59, 999);
                start = s.getTime(); end = e.getTime();
            } else if (exportOptions.type === 'all_time') {
                start = 0;
                end = Date.now() + 100000000000;
            } else {
                alert("Please select valid dates for export.");
                return;
            }

            const exportData = expenses.filter(e => {
                const createdDate = new Date(e.date).getTime();
                return createdDate >= start && createdDate <= end;
            });

            if (exportData.length === 0) {
                alert("No records found in the selected date range.");
                return;
            }

            const dataToExport = exportData.map(e => ({
                Title: e.title,
                Category: e.category,
                Date: new Date(e.date).toLocaleDateString(),
                Amount: Number(e.amount || 0).toFixed(2),
                PaymentMethod: e.paymentMethod || '-',
                Reference: e.reference || '-',
                Description: e.description || '-',
                Recurring: e.isRecurring ? `Yes (${e.frequency})` : 'No'
            }));

            const ws = utils.json_to_sheet(dataToExport);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Expenses_Export");
            writeFile(wb, `Expenses_Export_${exportOptions.type}_${new Date().toISOString().split('T')[0]}.xlsx`);
            setShowExportModal(false);
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed: " + error.message);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
        setIsViewOnly(false);
    };

    // Empty state
    if (expenses.length === 0) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No expenses yet</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        Start tracking your business expenses to get better insights into your spending patterns.
                    </p>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" /> Add First Expense
                    </Button>

                    <div className="mt-8 pt-8 border-t border-slate-200">

                        <div className="flex flex-wrap gap-2 justify-center">
                        </div>
                    </div>
                </div>

                <ExpenseModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    expense={editingExpense}
                    readOnly={isViewOnly}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowExportModal(true)}
                        variant="outline"
                        className="border-slate-300"
                    >
                        <Download className="mr-2 h-4 w-4" /> Export All
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by title, category, payment method, or reference..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <DateRangePicker
                        value={dateRange}
                        onDateRangeChange={setDateRange}
                    />
                    <CategoryFilter
                        expenses={expenses}
                        value={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                    />
                </div>
            </div>

            {/* Expenses Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                </TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-12 text-center">Receipt</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedExpenses.includes(expense.id)}
                                            onChange={() => toggleSelectExpense(expense.id)}
                                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-slate-900">{expense.title}</span>
                                            {expense.isRecurring && (
                                                <RecurringBadge
                                                    frequency={expense.frequency}
                                                    nextDueDate={expense.nextDueDate}
                                                />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${expense.category === 'Rent' ? 'bg-orange-100 text-orange-700' :
                                            expense.category === 'Salaries' ? 'bg-blue-100 text-blue-700' :
                                                expense.category === 'Utilities' ? 'bg-cyan-100 text-cyan-700' :
                                                    expense.category === 'Inventory' ? 'bg-purple-100 text-purple-700' :
                                                        expense.category === 'Marketing' ? 'bg-pink-100 text-pink-700' :
                                                            expense.category === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' :
                                                                expense.category === 'Office Supplies' ? 'bg-teal-100 text-teal-700' :
                                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {expense.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        {new Date(expense.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {expense.paymentMethod || '-'}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {expense.reference || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-red-600">
                                        -₹{Number(expense.amount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {expense.receiptUrl ? (
                                            <a
                                                href={expense.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                                                title="View Receipt"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Paperclip className="h-4 w-4" />
                                            </a>
                                        ) : (
                                            <button
                                                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                                                title="No Receipt Attached"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAttachReceipt(expense.id);
                                                }}
                                            >
                                                <Paperclip className="h-4 w-4 opacity-20" />
                                            </button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleView(expense)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    <span>View</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAttachReceipt(expense.id)}>
                                                    <Paperclip className="mr-2 h-4 w-4" />
                                                    <span>{expense.receiptUrl ? 'Change Receipt' : 'Attach Receipt'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            <BulkActionsToolbar
                selectedCount={selectedExpenses.length}
                onClearSelection={() => setSelectedExpenses([])}
                onCategoryChange={handleBulkCategoryChange}
                onMarkRecurring={handleBulkMarkRecurring}
                onExportCSV={handleBulkExportCSV}
                onDelete={handleBulkDelete}
                categories={SAMPLE_CATEGORIES}
            />

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                expense={editingExpense}
                readOnly={isViewOnly}
            />

            <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Expenses" size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Export Range</label>
                        <select
                            className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 border-slate-200"
                            value={exportOptions.type}
                            onChange={(e) => setExportOptions({ ...exportOptions, type: e.target.value })}
                        >
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="specific_month">Specific Month</option>
                            <option value="date_range">Custom Date Range</option>
                            <option value="all_time">All Time</option>
                        </select>
                    </div>

                    {exportOptions.type === 'specific_month' && (
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Select Month</label>
                            <Input
                                type="month"
                                value={exportOptions.specificMonth}
                                onChange={(e) => setExportOptions({ ...exportOptions, specificMonth: e.target.value })}
                            />
                        </div>
                    )}

                    {exportOptions.type === 'date_range' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Start Date</label>
                                <Input
                                    type="date"
                                    value={exportOptions.startDate}
                                    onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">End Date</label>
                                <Input
                                    type="date"
                                    value={exportOptions.endDate}
                                    onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                        <Button variant="outline" onClick={() => setShowExportModal(false)}>Cancel</Button>
                        <Button onClick={handleConfirmExport}>
                            Export
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ExpensesPage;