import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Printer, Check } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { printReceipt } from '../../utils/printReceipt';
import services from '../../services/api';

const InvoicePreviewModal = ({ 
    isOpen, 
    onClose, 
    invoice, 
    showConfirmButton = false, 
    onConfirm = null,
    isSaved = true
}) => {
    const { settings } = useSettings();
    const iframeRef = useRef(null);

    // Local state for paper size and template (can be changed without affecting global settings)
    const [selectedPaperSize, setSelectedPaperSize] = useState('80mm');
    const [selectedTemplate, setSelectedTemplate] = useState('Modern');

    // State for full invoice details (fetched on open to ensure freshness)
    const [fullInvoice, setFullInvoice] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Reset to default settings when modal opens
    useEffect(() => {
        if (isOpen && settings) {
            const defaultTemplate = settings?.invoice?.template || 'Express';
            setSelectedTemplate(defaultTemplate);

            // Receipt templates (Express, Streamlined, Modern, Minimal) default to 80mm
            const receiptTemplates = ['Express', 'Streamlined', 'Minimal'];
            if (receiptTemplates.includes(defaultTemplate)) {
                setSelectedPaperSize('80mm');
            } else {
                setSelectedPaperSize(settings?.invoice?.paperSize || 'A4');
            }
        }
    }, [isOpen, settings]);

    // Fetch full invoice details when modal opens
    useEffect(() => {
        if (isOpen && invoice) {
            // If it's a preview (id === 'PREVIEW'), don't try to fetch from backend
            if (invoice.id === 'PREVIEW') {
                setFullInvoice(invoice);
                return;
            }
            
            setIsLoading(true);
            services.invoices.getById(invoice.id)
                .then(res => {
                    setFullInvoice(res.data);
                })
                .catch(err => {
                    console.error("Failed to fetch full invoice details", err);
                    setFullInvoice(invoice);
                })
                .finally(() => setIsLoading(false));
        } else {
            setFullInvoice(null);
        }
    }, [isOpen, invoice]);

    // Generate the actual bill HTML using printReceipt function
    useEffect(() => {
        const targetInvoice = fullInvoice || invoice;
        if (isOpen && targetInvoice && iframeRef.current && settings && !isLoading) {
            try {
                // Generate the HTML using the actual printReceipt function
                // Note: 'Modern' maps to Express styles in printReceipt.js if not explicit
                const billHTML = printReceipt(targetInvoice, selectedPaperSize, settings, { preview: true, template: selectedTemplate });

                // Write to iframe
                const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(billHTML);
                iframeDoc.close();
            } catch (error) {
                console.error('Error generating bill preview:', error);
            }
        }
    }, [isOpen, fullInvoice, invoice, settings, selectedPaperSize, selectedTemplate, isLoading]);

    const handlePrint = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow.print();
        }
    };

    if (!invoice) return null;

    // Use fullInvoice for display if available
    const displayInvoice = fullInvoice || invoice;

    // Calculate iframe width based on selected paper size
    const iframeWidth = selectedPaperSize === '80mm' ? '320px' : '850px';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Invoice Preview - #${displayInvoice.invoiceNumber || displayInvoice.id}`} size="4xl">
            <div className="flex flex-col h-[calc(100vh-200px)]">
                {/* Info Bar with Paper Size Selector */}
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-5">
                            <div>
                                <span className="text-slate-500 font-medium">Customer:</span>
                                <span className="ml-2 text-slate-900 font-semibold">{displayInvoice.customerName || 'Guest'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-medium">Date:</span>
                                <span className="ml-2 text-slate-900">{new Date(displayInvoice.date).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-medium">Total:</span>
                                <span className="ml-2 text-slate-900 font-bold">₹{(displayInvoice.total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 ml-8">
                            <div className="flex items-center gap-2">
                                <label htmlFor="paper-size-select" className="text-xs text-slate-500 font-medium">Paper Size:</label>
                                <select
                                    id="paper-size-select"
                                    value={selectedPaperSize}
                                    onChange={(e) => setSelectedPaperSize(e.target.value)}
                                    className="text-xs px-2 py-1 border border-slate-300 rounded bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="80mm">Thermal (80mm)</option>
                                    <option value="A4">A4 Paper</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-hidden">
                                <label htmlFor="template-select" className="text-xs text-slate-500 font-medium">Template:</label>
                                <select
                                    id="template-select"
                                    value={selectedTemplate}
                                    onChange={(e) => {
                                        const newTemplate = e.target.value;
                                        setSelectedTemplate(newTemplate);
                                        // Auto-switch paper size based on template type
                                        const receiptTemplates = ['Express', 'Streamlined', 'Modern', 'Minimal'];
                                        if (receiptTemplates.includes(newTemplate)) {
                                            setSelectedPaperSize('80mm');
                                        } else {
                                            setSelectedPaperSize('A4');
                                        }
                                    }}
                                    className="text-xs px-2 py-1 border border-slate-300 rounded bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <optgroup label="Receipt (80mm)">
                                        <option value="Express">Express Receipt</option>
                                        <option value="Streamlined">Streamlined Receipt</option>
                                    </optgroup>
                                    <optgroup label="A4 Paper">
                                        <option value="Classic">Classic</option>
                                        <option value="Compact">Compact (Professional)</option>
                                        <option value="GST-Detailed">GST-Detailed</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Bill Preview - Full Width Scrollable */}
                <div className="flex-1 border rounded-lg bg-slate-100 shadow-inner overflow-x-hidden">
                    <div className="h-full w-full overflow-y-auto overflow-x-hidden flex justify-center items-start p-4">
                        <div className="bg-white shadow-lg max-w-full">
                            <iframe
                                ref={iframeRef}
                                className="bg-white"
                                style={{
                                    border: 'none',
                                    minHeight: '600px',
                                    width: iframeWidth,
                                    maxWidth: '100%',
                                    display: 'block'
                                }}
                                title="Bill Preview"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between gap-3 pt-4 mt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        {showConfirmButton ? 'Cancel' : 'Close'}
                    </Button>
                    {showConfirmButton && onConfirm ? (
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white" 
                            onClick={onConfirm}
                            data-confirm-button
                        >
                            <Check className="mr-2 h-4 w-4" /> Confirm & Save
                        </Button>
                    ) : isSaved ? (
                        <Button className="bg-black hover:bg-neutral-800 text-white" onClick={handlePrint} data-print-button>
                            <Printer className="mr-2 h-4 w-4" /> Print Receipt
                        </Button>
                    ) : (
                        <Button className="bg-black hover:bg-neutral-800 text-white" onClick={handlePrint} data-print-button>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default InvoicePreviewModal;

