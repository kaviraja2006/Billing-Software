import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Printer, RefreshCcw } from 'lucide-react';

const InvoicePreviewModal = ({ isOpen, onClose, invoice }) => {
    if (!invoice) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${invoice.id}`} size="lg">
            <div className="space-y-6">
                {/* Invoice Content (Imitating a receipt) */}
                <div className="border border-slate-200 rounded-lg p-8 bg-white shadow-sm font-mono text-sm">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Store Name</h2>
                        <p className="text-slate-500">123 Market Street, City, Country</p>
                        <p className="text-slate-500">Phone: +1 234 567 890</p>
                    </div>

                    <div className="flex justify-between mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <p className="font-semibold text-slate-700">Bill To:</p>
                            <p>{invoice.customer}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-slate-700">Date: {invoice.date}</p>
                            <p className="font-semibold text-slate-700">Invoice: {invoice.id}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200">
                                <tr>
                                    <th className="py-2">Item</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Price</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Mock Items */}
                                <tr>
                                    <td className="py-2">Product A</td>
                                    <td className="py-2 text-center">2</td>
                                    <td className="py-2 text-right">$10.00</td>
                                    <td className="py-2 text-right">$20.00</td>
                                </tr>
                                <tr>
                                    <td className="py-2">Product B</td>
                                    <td className="py-2 text-center">1</td>
                                    <td className="py-2 text-right">$25.00</td>
                                    <td className="py-2 text-right">$25.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>${(invoice.amount * 0.9).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax (10%)</span>
                            <span>${(invoice.amount * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-100 mt-2">
                            <span>Total</span>
                            <span>${invoice.amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Process Return
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoicePreviewModal;
