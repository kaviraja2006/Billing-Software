import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { printReceipt } from '../../utils/printerService';
import { Printer, Loader2 } from 'lucide-react';
import services from '../../services/api';

const InvoiceDetailsModal = ({ isOpen, onClose, invoice: initialInvoice }) => {
    const [invoice, setInvoice] = useState(initialInvoice);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialInvoice) {
            // Check if we have items. If not, fetch full details.
            if (!initialInvoice.items || initialInvoice.items.length === 0) {
                const fetchDetails = async () => {
                    setLoading(true);
                    try {
                        const res = await services.invoices.getById(initialInvoice.id);
                        setInvoice(res.data);
                    } catch (err) {
                        console.error("Failed to fetch invoice details", err);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchDetails();
            } else {
                setInvoice(initialInvoice);
            }
        } else {
            setInvoice(null);
        }
    }, [isOpen, initialInvoice]);

    if (!invoice && !loading) return null;

    const handlePrint = () => {
        printReceipt(invoice);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Invoice Details - ${invoice?.invoiceNumber || invoice?.id || ''}`}>
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin h-8 w-8 text-primary-main" />
                </div>
            ) : invoice ? (
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500">Customer</p>
                            <p className="font-medium text-slate-900">{invoice.customerName || 'Walk-in Customer'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Date</p>
                            <p className="font-medium text-slate-900">{invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Payment Method</p>
                            <p className="font-medium text-slate-900">{invoice.paymentMethod || 'Cash'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                    invoice.status === 'Unpaid' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                {invoice.status || 'Paid'}
                            </span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.items && invoice.items.length > 0 ? (
                                    invoice.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right">₹{Number(item.price).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">₹{Number(item.total).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-slate-500 py-4">
                                            No items found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-1/2 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="font-medium">₹{Number(invoice.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tax</span>
                                <span className="font-medium">₹{Number(invoice.tax).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Discount</span>
                                <span className="font-medium text-green-600">-₹{Number(invoice.discount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total</span>
                                <span>₹{Number(invoice.total).toFixed(2)}</span>
                            </div>
                            {invoice.balance > 0 && (
                                <div className="flex justify-between text-sm font-semibold text-rose-600">
                                    <span>Balance Due</span>
                                    <span>₹{Number(invoice.balance).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 print:hidden">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button onClick={handlePrint} className="bg-primary-main hover:bg-primary-hover text-white">
                            <Printer className="mr-2 h-4 w-4" /> Print Invoice
                        </Button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};

export default InvoiceDetailsModal;
