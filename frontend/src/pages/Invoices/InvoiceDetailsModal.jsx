import React from 'react';

// If Modal.jsx exports Modal, I'll use Modal. But wait, I recall Modal.jsx was simple.
// Let's check Modal.jsx first to satisfy imports properly.
// I will assume standard Modal usage from previous steps or just create a new one based on existing UI.
// Actually, looking at previous file lists, I saw Modal.jsx. Let's stick to Modal.jsx usage.

import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { printReceipt } from '../../utils/printReceipt';
import { Printer } from 'lucide-react';

const InvoiceDetailsModal = ({ isOpen, onClose, invoice }) => {
    if (!invoice) return null;

    const parseAmount = (amt) => {
        if (typeof amt === 'number') return amt;
        if (typeof amt === 'string') return parseFloat(amt.replace(/[^0-9.-]+/g, ""));
        return 0;
    };

    const handlePrint = () => {
        printReceipt(invoice);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Invoice Details - ${invoice.id}`}>
            <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500">Customer</p>
                        <p className="font-medium text-slate-900">{invoice.customer}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Date</p>
                        <p className="font-medium text-slate-900">{invoice.date}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Payment Method</p>
                        <p className="font-medium text-slate-900">{invoice.method}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {invoice.status}
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
                                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-slate-500 py-4">
                                        No item details available.
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
                            <span className="font-medium">${invoice.totals?.subtotal?.toFixed(2) || parseAmount(invoice.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tax</span>
                            <span className="font-medium">${invoice.totals?.tax?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total</span>
                            <span>{invoice.amount}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 print:hidden">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="mr-2 h-4 w-4" /> Print Invoice
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceDetailsModal;
