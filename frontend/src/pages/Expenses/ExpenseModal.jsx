import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TagsInput } from '../../components/ui/TagsInput';
import { FileUpload } from '../../components/ui/FileUpload';
import { PAYMENT_METHODS, RECURRING_FREQUENCIES, SAMPLE_CATEGORIES, COMMON_TAGS } from '../../utils/expenseConstants';
import { useExpenses } from '../../context/ExpenseContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Upload, X, FileText, ExternalLink, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ExpenseModal = ({ isOpen, onClose, expense = null }) => {
    const { addExpense, updateExpense, uploadReceipt } = useExpenses();
    const isEditMode = !!expense;
    const toast = useToast();

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: 'Cash',
        reference: '',
        tags: [],
        isRecurring: false,
        frequency: 'one-time',
        nextDueDate: ''
    });

    const [receiptFile, setReceiptFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (expense) {
            setFormData({
                title: expense.title || '',
                amount: expense.amount || '',
                category: expense.category || '',
                date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                description: expense.description || '',
                paymentMethod: expense.paymentMethod || 'Cash',
                reference: expense.reference || '',
                tags: expense.tags || [],
                isRecurring: expense.isRecurring || false,
                frequency: expense.frequency || 'one-time',
                nextDueDate: expense.nextDueDate ? new Date(expense.nextDueDate).toISOString().split('T')[0] : ''
            });
        } else {
            // Reset form for new expense
            setFormData({
                title: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                paymentMethod: 'Cash',
                reference: '',
                tags: [],
                isRecurring: false,
                frequency: 'one-time',
                nextDueDate: ''
            });
            setReceiptFile(null);
        }
    }, [expense, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleReceiptChange = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,.pdf';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                setReceiptFile(file);
            }
        };
        fileInput.click();
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.amount || !formData.category) {
            toast.warning('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // Clean data - convert empty strings to undefined for optional fields
            const cleanedData = {
                title: formData.title,
                amount: formData.amount,
                category: formData.category,
                date: formData.date,
                description: formData.description || '',
                paymentMethod: formData.paymentMethod,
                reference: formData.reference || '',
                tags: formData.tags.length > 0 ? formData.tags : [],
                isRecurring: formData.isRecurring,
                frequency: formData.frequency,
                nextDueDate: formData.nextDueDate || '',
            };

            if (isEditMode) {
                // Update existing expense
                const updated = await updateExpense(expense.id, cleanedData);

                // Upload receipt if new file selected
                if (receiptFile) {
                    await uploadReceipt(updated.id, receiptFile);
                }
            } else {
                // Create new expense
                const newExpense = await addExpense(cleanedData);

                // Upload receipt if file selected
                if (receiptFile) {
                    await uploadReceipt(newExpense.id, receiptFile);
                }
            }

            onClose();
        } catch (error) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'save'} expense: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={isEditMode ? 'Edit Expense' : 'Add New Expense'}
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Expense Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Office Rent, Electricity Bill"
                        />
                    </div>

                    {/* Amount and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="amount"
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select Category</option>
                                {SAMPLE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Date</label>
                        <Input
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Payment Method and Reference */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Payment Method</label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {PAYMENT_METHODS.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Reference / Bill No.</label>
                            <Input
                                name="reference"
                                value={formData.reference}
                                onChange={handleChange}
                                placeholder="e.g. TXN123456, INV-001"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Tags</label>
                        <TagsInput
                            value={formData.tags}
                            onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                            suggestions={COMMON_TAGS}
                            placeholder="Add tags (press Enter)"
                        />
                    </div>

                    {/* Recurring Expense */}
                    <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isRecurring"
                                name="isRecurring"
                                checked={formData.isRecurring}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700">
                                Mark as Recurring Expense
                            </label>
                        </div>

                        {formData.isRecurring && (
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Frequency</label>
                                    <select
                                        name="frequency"
                                        value={formData.frequency}
                                        onChange={handleChange}
                                        className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                    >
                                        {RECURRING_FREQUENCIES.map(freq => (
                                            <option key={freq.value} value={freq.value}>{freq.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Next Due Date</label>
                                    <Input
                                        name="nextDueDate"
                                        type="date"
                                        value={formData.nextDueDate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Notes</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                            placeholder="Add additional details..."
                        />
                    </div>

                    {/* Receipt Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            Receipt Attachment
                        </label>

                        {/* Show existing receipt in edit mode */}
                        {isEditMode && expense?.receiptUrl && !receiptFile ? (
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <AlertCircle className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm font-medium">Currently Attached</span>
                                        </div>
                                        <a
                                            href={expense.receiptUrl.startsWith('http') ? expense.receiptUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${expense.receiptUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            View Original
                                        </a>
                                    </div>

                                    {/* Preview */}
                                    <div className="aspect-video bg-slate-50 rounded-md border border-slate-100 flex items-center justify-center overflow-hidden mb-4 relative group">
                                        {expense.receiptUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                            <img
                                                src={expense.receiptUrl.startsWith('http') ? expense.receiptUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${expense.receiptUrl}`}
                                                alt="Receipt preview"
                                                crossOrigin="anonymous"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <FileText className="w-12 h-12" />
                                                <span className="text-sm">PDF Document</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowReceiptConfirmation(true)}
                                        className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Replace Receipt
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* File Upload Component */
                            <div className={`transition-all duration-200 ${receiptFile ? 'scale-100 opacity-100' : 'scale-[0.99] opacity-100'}`}>
                                <FileUpload
                                    value={receiptFile}
                                    onChange={setReceiptFile}
                                    accept="image/*,.pdf"
                                    maxSize={5 * 1024 * 1024}
                                />
                                {receiptFile && (
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setReceiptFile(null)}
                                            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" />
                                            Cancel Change
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Expense' : 'Save Expense')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal for Receipt Change */}
            <ConfirmationModal
                isOpen={showReceiptConfirmation}
                onClose={() => setShowReceiptConfirmation(false)}
                onConfirm={handleReceiptChange}
                title="Replace Receipt?"
                message="Are you sure you want to replace the current receipt? The existing file will be overwritten."
                variant="danger"
            />
        </>
    );
};

export default ExpenseModal;
