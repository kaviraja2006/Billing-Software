import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Search, Plus, Filter, FileText, Calendar, DollarSign } from 'lucide-react';
import ExpenseModal from './ExpenseModal';

import { useExpenses } from '../../context/ExpenseContext';

const ExpensesPage = () => {
    const { expenses, deleteExpense, stats } = useExpenses();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter Logic
    const filteredExpenses = expenses.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
                <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search categories or titles..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Date Range</Button>
                    <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Category</Button>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredExpenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell className="font-medium text-slate-900">{expense.title}</TableCell>
                                <TableCell>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold">
                                        {expense.category}
                                    </span>
                                </TableCell>
                                <TableCell className="text-slate-500">{expense.date}</TableCell>
                                <TableCell className="text-slate-500 truncate max-w-[200px]">{expense.notes}</TableCell>
                                <TableCell className="text-right font-bold text-red-600">-${expense.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => deleteExpense(expense.id)} className="text-slate-400 hover:text-red-500">
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default ExpensesPage;
