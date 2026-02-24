import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
    Phone, User, Mail, CheckCircle, Printer, Calculator, X, Edit2,
    Calendar, CreditCard, Banknote, Coins, Smartphone, Landmark, ScrollText, Check, Search
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import CalculatorModal from './CalculatorModal';
import { useCustomers } from '../../../context/CustomerContext';
import InvoicePreviewModal from '../../Invoices/InvoicePreviewModal';

const BillingSidebar = ({
    customer,
    onCustomerChange,
    totals = {},
    cart = [],
    settings = {},
    onPaymentChange,
    paymentMode,
    paymentStatus,
    amountReceived,
    onSavePrint,
    onPreview,
    onRemoveDiscount,
    onEditDiscount,
    isProcessing = false,
    requireMobile = true,
    taxType = 'Intra-State', // New Prop
    onTaxTypeChange // New Prop
}) => {
    const currentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const [printFormat, setPrintFormat] = useState('80mm');
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [savedInvoice, setSavedInvoice] = useState(null);
    const { getCustomerByMobile, customers } = useCustomers();
    const amountInputRef = useRef(null);

    // Customer Capture State
    const [mobile, setMobile] = useState('');
    const [customerName, setCustomerName] = useState('');

    // Customer Lookup State
    const [customerFound, setCustomerFound] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [mobileError, setMobileError] = useState('');   
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
    const mobileInputRef = useRef(null);
    const customerNameRef = useRef(null);
    const statusRefs = useRef({});
    const modeRefs = useRef({});
    const suggestionsRef = useRef(null);
    const suggestionItemRefs = useRef([]);

    // Filter customers based on search query (by mobile or name)
    const filteredSuggestions = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        const query = searchQuery.toLowerCase();
        return customers
            .filter(c => {
                const name = (c.fullName || c.name || '').toLowerCase();
                const phone = (c.phone || '').toLowerCase();
                return name.includes(query) || phone.includes(query);
            })
            .slice(0, 5); // Limit to 5 suggestions
    }, [searchQuery, customers]);

    // Auto-focus mobile input on mount
    useEffect(() => {
        if (requireMobile && mobileInputRef.current) {
            mobileInputRef.current.focus();
        }
    }, [requireMobile]);

    // Only hydrate local state when mobile number changes (not on every customer update)
    useEffect(() => {
        if (!customer) {
            // Reset when customer is cleared
            setMobile('');
            setCustomerName('');
            setCustomerFound(false);
            setIsNewCustomer(false);
            return;
        }

        // Only update if the mobile number is different (prevents overwriting during typing)
        if (customer.phone && customer.phone !== mobile) {
            setMobile(customer.phone);
            setCustomerName(customer.fullName || customer.name || '');
            setCustomerFound(true);
            setIsNewCustomer(false);
            setMobileError('');
        }
    }, [customer?.phone]); // Only depend on phone number

    // Handle customer selection from suggestions
    const handleSelectCustomer = (selectedCustomer) => {
        setMobile(selectedCustomer.phone || '');
        setCustomerName(selectedCustomer.fullName || selectedCustomer.name || '');
        setCustomerFound(true);
        setIsNewCustomer(false);
        setShowSuggestions(false);
        setSearchQuery('');
        setMobileError('');
        setFocusedSuggestionIndex(-1);
        onCustomerChange(selectedCustomer);
    };

    // Handle mobile number change with lookup
    const handleMobileChange = async (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only digits
        setMobile(value);
        setSearchQuery(value);
        setShowSuggestions(true);

        if (value.length < 10) {
            setMobileError(value.length > 0 ? 'Must be 10 digits' : '');
            setCustomerFound(false);
            setIsNewCustomer(false);
            return;
        }

        if (value.length === 10) {
            setMobileError('');
            // Lookup customer
            try {
                const foundCustomer = await getCustomerByMobile(value);
                if (foundCustomer) {
                    // Customer exists - auto-fill
                    setCustomerName(foundCustomer.fullName || '');
                    setCustomerFound(true);
                    setIsNewCustomer(false);
                    setShowSuggestions(false);

                    // Notify parent immediately
                    onCustomerChange(foundCustomer);
                } else {
                    // New customer
                    setCustomerFound(false);
                    setIsNewCustomer(true);
                    setCustomerName('');

                    // Notify parent with mobile data immediately
                    onCustomerChange({
                        phone: value,
                        isNew: true
                    });
                }
            } catch (error) {
                console.error('Customer lookup failed:', error);
                setIsNewCustomer(true);
            }
        }

        if (value.length > 10) {
            setMobileError('Maximum 10 digits');
        }
    };

    // Handle search input focus
    const handleMobileFocus = () => {
        if (mobile.length >= 2 || searchQuery.length >= 2) {
            setShowSuggestions(true);
        }
    };

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Name change handler
    const handleNameChange = (e) => {
        setCustomerName(e.target.value);
    };

    // Update parent when customer details change - debounced to avoid infinite loops
    useEffect(() => {
        if (mobile.length === 10 && !mobileError && customerName.trim()) {
            const customerData = {
                phone: mobile,
                fullName: customerName,
                name: customerName,
                isNew: isNewCustomer,
                id: customer?.id // Preserve existing customer ID if exists
            };

            // Only update if data has actually changed
            const hasChanged =
                customer?.phone !== mobile ||
                customer?.fullName !== customerName;

            if (hasChanged || !customer) {
                onCustomerChange(customerData);
            }
        }
    }, [customerName, mobile, mobileError, isNewCustomer]);

    // Navigation Helper
    const handleArrowNavigation = (e, items, currentId, refs) => {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            const currentIndex = items.findIndex(item => item.id === currentId) !== -1
                ? items.findIndex(item => item.id === currentId)
                : 0; // Default to first if none selected

            let nextIndex = currentIndex;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % items.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
            }

            const nextId = items[nextIndex].id;
            // We can either auto-select OR just focus. User said "navigation keys for changing...". 
            // Usually implies selection? But "Enter for confirming" implies focus first.
            // "user can also use enter for confirming the mode and navigation keys for changing the payment mode"
            // This sounds like: Arrows change SELECTION immediately? OR Arrows change FOCUS?
            // Let's assume Arrows move FOCUS, Enter selects?
            // "navigation keys for changing the payment mode" -> changing the selection.
            // "enter for confirming" -> might mean confirming the selection and moving to next step.

            // Let's try: Arrows change Selection. Enter moves to next step.
            // BUT, for Status, user said "before selecting... borders black... after clicking paid... bg black".
            // This implies a "Hover/Focus" state vs "Selected" state.

            // Let's stick to standard accessibility: Arrows move FOCUS. Enter SELECTS.
            // This allows "previewing" via focus without committing.

            const nextRef = refs.current[nextId];
            nextRef?.focus();
        }
    };

    // Keyboard handler for mobile input - navigate suggestions and move to name field
    const handleMobileKeyDown = (e) => {
        if (showSuggestions && filteredSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedSuggestionIndex(prev => 
                    prev < filteredSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : filteredSuggestions.length - 1
                );
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (focusedSuggestionIndex >= 0) {
                    handleSelectCustomer(filteredSuggestions[focusedSuggestionIndex]);
                } else if (customerNameRef.current) {
                    customerNameRef.current.focus();
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
                setFocusedSuggestionIndex(-1);
            }
        } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
            // No suggestions, move to customer name field
            if (customerNameRef.current) {
                e.preventDefault();
                customerNameRef.current.focus();
            }
        }
    };

    // Keyboard handler for customer name input - navigate between mobile and payment mode buttons
    const handleNameKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (mobileInputRef.current) {
                mobileInputRef.current.focus();
            }
        } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            // Move to first payment mode button (payment mode is now before status)
            if (paymentMethods.length > 0 && modeRefs.current[paymentMethods[0].id]) {
                modeRefs.current[paymentMethods[0].id].focus();
            } else {
                // If no payment modes (Unpaid status), move to status buttons
                const firstStatusId = 'Paid';
                if (statusRefs.current[firstStatusId]) {
                    statusRefs.current[firstStatusId].focus();
                }
            }
        }
    };

    // Keyboard handler for payment mode buttons - navigate between modes and to status buttons
    const handleModeKeyDown = (e, modeId) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            handleArrowNavigation(e, paymentMethods, modeId, modeRefs);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Move back to customer name input
            if (customerNameRef.current) {
                customerNameRef.current.focus();
            }
        } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            // Select the mode on Enter
            if (e.key === 'Enter') {
                onPaymentChange('mode', modeId);
                onPaymentChange('amount', '');
            }
            // Move to status buttons (status is now after payment mode)
            const firstStatusId = 'Paid';
            if (statusRefs.current[firstStatusId]) {
                statusRefs.current[firstStatusId].focus();
            }
        }
    };

    // Keyboard handler for status buttons - navigate between status buttons and to amount input
    const handleStatusKeyDown = (e, statusId) => {
        const statusItems = [
            { id: 'Paid' },
            { id: 'Partially Paid' },
            { id: 'Unpaid' }
        ];
        
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            handleArrowNavigation(e, statusItems, statusId, statusRefs);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Move back to payment mode buttons (payment mode is now before status)
            if (paymentStatus !== 'Unpaid' && paymentMethods.length > 0 && modeRefs.current[paymentMethods[0].id]) {
                modeRefs.current[paymentMethods[0].id].focus();
            } else if (customerNameRef.current) {
                customerNameRef.current.focus();
            }
        } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            // Select the status on Enter
            if (e.key === 'Enter') {
                handleStatusChange(statusId);
            }
            // Move to amount received input
            if (statusId !== 'Unpaid') {
                const amountInput = document.getElementById('amount-received-input');
                if (amountInput) {
                    amountInput.focus();
                }
            }
        }
    };

    // Keyboard handler for amount received input - navigate back to status buttons
    const handleAmountKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Move back to status buttons (status is now before amount input)
            const firstStatusId = 'Paid';
            if (statusRefs.current[firstStatusId]) {
                statusRefs.current[firstStatusId].focus();
            }
        }
    };

    // Totals
    const safeTotal = totals?.total ?? 0;
    const safeGrossTotal = totals?.grossTotal ?? 0;
    const safeItemDiscount = totals?.itemDiscount ?? 0;
    const safeBillDiscount = totals?.discount ?? 0;
    const safeTax = totals?.tax ?? 0;
    const safeRoundOff = totals?.roundOff ?? 0;

    // Tax Breakdown Logic
    const isInterState = taxType === 'Inter-State';

    // Payment Logic
    const amtReceived = parseFloat(amountReceived) || 0;
    const balanceDue = Math.max(0, safeTotal - amtReceived);
    const changeToReturn = Math.max(0, amtReceived - safeTotal);
    const isPaid = paymentStatus === 'Paid';
    const isUnpaid = paymentStatus === 'Unpaid';

    // Determine if save should be disabled - BOTH mobile and name required
    const isSaveDisabled = requireMobile && (mobile.length !== 10 || mobileError !== '' || !customerName.trim());

    // --- New Payment Logic Handlers ---

    const handleStatusChange = (status) => {
        onPaymentChange('status', status);
        if (status === 'Paid') {
            onPaymentChange('amount', safeTotal.toString());
        } else if (status === 'Partially Paid') {
            onPaymentChange('amount', ''); // Clear to let them type
        } else if (status === 'Unpaid') {
            onPaymentChange('amount', '0');
        }
    };

    const handleKeypadAmount = (e) => {
        if (e.key === 'Enter') {
            if (!isSaveDisabled && !isProcessing) {
                handlePreviewAndSave();
            }
        }
    };

    // Build preview invoice data from current bill state
    const buildPreviewInvoice = () => {
        const customerName = customer?.fullName || customer?.name || 'Customer';
        const customerMobile = customer?.phone || mobile || '';
        
        // Map cart items to invoice items format
        const invoiceItems = (cart || []).map(item => ({
            productId: item.id || item._id,
            name: item.name,
            quantity: item.quantity,
            price: item.price || item.sellingPrice,
            total: item.total,
            discount: item.discount || 0,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate || 0,
            taxableValue: item.taxableValue || 0,
            cgst: item.cgst || 0,
            sgst: item.sgst || 0,
            igst: item.igst || 0,
            totalTax: item.totalTax || 0,
            variantId: item.variantId,
            hsnCode: item.hsnCode,
            isInclusive: item.isInclusive
        }));

        return {
            id: 'preview',
            invoiceNumber: 'PREVIEW',
            customerName,
            customerMobile,
            date: new Date(),
            items: invoiceItems,
            grossTotal: safeGrossTotal,
            itemDiscount: safeItemDiscount,
            subtotal: totals.subtotal || 0,
            tax: safeTax,
            discount: safeBillDiscount,
            additionalCharges: totals.additionalCharges || 0,
            roundOff: safeRoundOff,
            total: safeTotal,
            paymentMethod: paymentMode || 'Cash',
            status: paymentStatus,
            amountReceived: parseFloat(amountReceived) || 0,
            taxType,
            cgst: totals.cgst || 0,
            sgst: totals.sgst || 0,
            igst: totals.igst || 0
        };
    };

    // Handle preview before saving
    const handlePreviewAndSave = () => {
        if (isSaveDisabled || isProcessing) return;
        
        // Build preview invoice and pass to parent
        const invoiceData = buildPreviewInvoice();
        if (onPreview) {
            onPreview(invoiceData);
        }
    };

    // Handle confirmation from preview modal - actually save the bill
    const handleConfirmSave = async () => {
        if (!onSavePrint) return;
        
        // Close preview and trigger save
        // The parent will handle saving and printing
        setIsPreviewOpen(false);
        
        // Call the original onSavePrint from parent
        // This will save the bill and may auto-print if status is Paid
        await onSavePrint(printFormat);
        
        // Reset preview state
        setPreviewInvoice(null);
    };

    // Payment Methods Configuration (Memoized to prevent recreation)
    const paymentMethods = useMemo(() => [
        { id: 'Cash', icon: Banknote, label: 'Cash', color: 'text-white bg-zinc-900 border-zinc-900 shadow-md ring-1 ring-zinc-900' },
        { id: 'UPI', icon: Smartphone, label: 'UPI', color: 'text-white bg-zinc-900 border-zinc-900 shadow-md ring-1 ring-zinc-900' },
        { id: 'Card', icon: CreditCard, label: 'Card', color: 'text-white bg-zinc-900 border-zinc-900 shadow-md ring-1 ring-zinc-900' },
        { id: 'Bank Transfer', icon: Landmark, label: 'Bank', color: 'text-white bg-zinc-900 border-zinc-900 shadow-md ring-1 ring-zinc-900' },
        { id: 'Cheque', icon: ScrollText, label: 'Cheque', color: 'text-white bg-zinc-900 border-zinc-900 shadow-md ring-1 ring-zinc-900' },
    ], []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if input focused (except Escape)
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && 
                !['Escape'].includes(e.key)) {
                return;
            }

            if (e.key === 'Escape') {
                handleStatusChange('Unpaid');
                return;
            }

            // Handle Up/Down navigation - only if no button is currently focused
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                // Check if a status or payment mode button is focused
                const isStatusFocused = Object.values(statusRefs.current).some(ref => ref === document.activeElement);
                const isModeFocused = Object.values(modeRefs.current).some(ref => ref === document.activeElement);
                
                // If a button is focused, let the button's own onKeyDown handler deal with it
                if (isStatusFocused || isModeFocused) {
                    return;
                }
                
                e.preventDefault();
                
                // Determine current context and navigate
                if (paymentStatus !== 'Unpaid') {
                    const currentIndex = paymentMethods.findIndex(m => m.id === paymentMode);
                    let nextIndex;
                    
                    if (e.key === 'ArrowDown') {
                        nextIndex = (currentIndex + 1) % paymentMethods.length;
                    } else {
                        nextIndex = (currentIndex - 1 + paymentMethods.length) % paymentMethods.length;
                    }
                    
                    const nextMethod = paymentMethods[nextIndex];
                    onPaymentChange('mode', nextMethod.id);
                    
                    // Focus the button
                    setTimeout(() => modeRefs.current[nextMethod.id]?.focus(), 0);
                }
                return;
            }

            if (paymentStatus === 'Unpaid') return; // Disable payment shortcuts for Credit bills

            switch (e.key) {
                case '1': onPaymentChange('mode', 'Cash'); break;
                case '2': onPaymentChange('mode', 'UPI'); break;
                case '3': onPaymentChange('mode', 'Card'); break;
                case '4': onPaymentChange('mode', 'Bank Transfer'); break;
                case '5': onPaymentChange('mode', 'Cheque'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onPaymentChange, isSaveDisabled, isProcessing, printFormat, paymentMode, paymentStatus, paymentMethods, isPreviewOpen, previewInvoice, settings, handlePreviewAndSave]);

    // Handle Alt+B for printing - works when preview modal is open
    useEffect(() => {
        const handlePrintShortcut = (e) => {
            // Alt+B for printing
            if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                
                // If preview modal is open, trigger print
                if (isPreviewOpen) {
                    const printButton = document.querySelector('[data-print-button]');
                    if (printButton) {
                        printButton.click();
                    }
                } else if (!isSaveDisabled && !isProcessing) {
                    // If modal is not open, open preview first
                    handlePreviewAndSave();
                }
            }
            
            // Enter key to confirm/save when modal is open
            if (e.key === 'Enter' && isPreviewOpen) {
                e.preventDefault();
                const confirmButton = document.querySelector('[data-confirm-button]');
                if (confirmButton) {
                    confirmButton.click();
                }
            }
        };

        window.addEventListener('keydown', handlePrintShortcut);
        return () => window.removeEventListener('keydown', handlePrintShortcut);
    }, [isPreviewOpen, isSaveDisabled, isProcessing, handlePreviewAndSave]);

    return (
        <div className="flex flex-col h-full bg-zinc-50 shadow-none overflow-hidden w-full">
            {/* 1. Header & Utilities - Compact */}
            <div className="shrink-0 px-4 py-3 border-b border-zinc-200 bg-white flex justify-between items-center h-14">
                <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} />
                    <span className="text-xs font-semibold">{currentDate}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                    onClick={() => setIsCalculatorOpen(true)}
                    title="Open Calculator"
                >
                    <Calculator size={16} />
                </Button>
            </div>

            <CalculatorModal
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
            />

            {/* Main Content - Flex-1 to fill space, but compact to avoid scroll */}
            <div className="flex-1 flex flex-col p-2 space-y-2 overflow-auto min-h-0">

                {/* 2. Customer Section - Progressive Capture */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Customer {requireMobile && '*'}</label>
                        {customer && !isNewCustomer && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 text-[10px] text-slate-400 hover:text-black"
                                onClick={() => onCustomerChange(null)}
                            >
                                <X size={12} className="mr-1" /> Clear
                            </Button>
                        )}
                    </div>

                    {/* Tier 1: Mobile (Required) */}
                    <div className="relative" ref={suggestionsRef}>
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            ref={mobileInputRef}
                            type="tel"
                            placeholder="Enter 10-digit mobile *"
                            value={mobile}
                            onChange={handleMobileChange}
                            onFocus={handleMobileFocus}
                            onKeyDown={handleMobileKeyDown}
                            maxLength={10}
                            readOnly={customerFound}
                            className={cn(
                                "pl-9 h-9 text-sm",
                                mobileError && "border-red-500 focus:border-red-500",
                                customerFound && "border-green-500 bg-green-50 cursor-not-allowed"
                            )}
                        />
                        {customerFound && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" size={16} />
                        )}
                        
                        {/* Search Suggestions Dropdown */}
                        {showSuggestions && filteredSuggestions.length > 0 && !customerFound && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {filteredSuggestions.map((suggestion, index) => (
                                    <div
                                        key={suggestion.id || suggestion._id}
                                        ref={el => suggestionItemRefs.current[index] = el}
                                        className={cn(
                                            "flex items-center justify-between p-3 cursor-pointer border-b border-zinc-100 last:border-0",
                                            index === focusedSuggestionIndex 
                                                ? "bg-zinc-100 ring-1 ring-inset ring-zinc-300" 
                                                : "hover:bg-zinc-50"
                                        )}
                                        onClick={() => handleSelectCustomer(suggestion)}
                                        onMouseEnter={() => setFocusedSuggestionIndex(index)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            <span className="font-medium text-slate-800">
                                                {suggestion.fullName || suggestion.name || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Phone size={12} />
                                            <span className="text-sm font-mono">{suggestion.phone}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {mobileError && <p className="text-xs text-red-500">⚠ {mobileError}</p>}
                    {customerFound && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Existing customer</p>}
                    {isNewCustomer && mobile.length === 10 && <p className="text-xs text-blue-600">→ New customer will be created</p>}

                    {/* Tier 2: Name + Messaging Opt-ins (Required name) */}
                    {mobile.length === 10 && !mobileError && (
                        <>
                            <Input
                                ref={customerNameRef}
                                placeholder="Customer Name (required) *"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                                readOnly={customerFound}
                                className={cn(
                                    "h-9 text-sm",
                                    !customerName.trim() && "border-neutral-300 bg-neutral-100",
                                    customerFound && "bg-green-50 cursor-not-allowed border-green-500"
                                )}
                            />

                            {!customerName.trim() && (
                                <p className="text-xs text-neutral-600">⚠ Name is required to save bill</p>
                            )}
                        </>
                    )}
                </div>

                {/* 3. Bill Summary - Flexible space but mostly compact */}
                <div className="flex flex-col gap-1.5 shrink-0 bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-semibold text-slate-900">₹{safeGrossTotal.toFixed(2)}</span>
                    </div>

                    {/* Item Disc */}
                    {safeItemDiscount > 0 && (
                        <div className="flex justify-between text-sm text-black">
                            <span>Item Discount</span>
                            <span>- ₹{safeItemDiscount.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Bill Discount */}
                    <div className="flex justify-between items-center text-sm h-6">
                        <span className="text-black font-medium text-xs uppercase tracking-tight">Bill Discount</span>
                        <div className="flex items-center gap-2">
                            {safeBillDiscount > 0 ? (
                                <>
                                    <span className="font-medium text-black">- ₹{safeBillDiscount.toFixed(2)}</span>
                                    <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200 scale-90 origin-right">
                                        <button
                                            onClick={onEditDiscount}
                                            className="p-1 hover:bg-white hover:text-black rounded-sm"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                        <div className="w-px bg-slate-200 my-0.5"></div>
                                        <button
                                            onClick={onRemoveDiscount}
                                            className="p-1 hover:bg-white hover:text-black rounded-sm"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={onEditDiscount}
                                    className="text-[10px] font-bold text-black hover:text-neutral-700 hover:underline flex items-center gap-1"
                                >
                                    + ADD DISC
                                </button>
                            )}
                        </div>
                    </div>

                    {/* TAX TYPE SELECTOR & LOGIC */}
                    <div className="flex justify-between items-center py-1 mt-1 border-t border-dashed border-slate-100">
                        <div className="flex bg-slate-100 rounded p-0.5">
                            <button
                                onClick={() => onTaxTypeChange && onTaxTypeChange('Intra-State')}
                                className={cn(
                                    "px-2 py-0.5 text-[10px] font-bold rounded transition-colors",
                                    !isInterState ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Intra-State
                            </button>
                            <button
                                onClick={() => onTaxTypeChange && onTaxTypeChange('Inter-State')}
                                className={cn(
                                    "px-2 py-0.5 text-[10px] font-bold rounded transition-colors",
                                    isInterState ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Inter-State
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">
                            Tax: ₹{safeTax.toFixed(2)}
                        </div>
                    </div>


                    {/* Tax Breakdown - Dynamic based on Type */}
                    {safeTax > 0 && (
                        <div className="flex flex-col gap-0.5 px-1 bg-slate-50/50 rounded p-1 mb-1">
                            {isInterState ? (
                                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                    <span>IGST</span>
                                    <span>₹{safeTax.toFixed(2)}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                        <span>SGST</span>
                                        <span>₹{(safeTax / 2).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                        <span>CGST</span>
                                        <span>₹{(safeTax / 2).toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Round Off */}
                    <div className="flex justify-between text-[10px] text-zinc-400 px-1">
                        <span>Round Off</span>
                        <span>{safeRoundOff > 0 ? '+' : ''}{safeRoundOff.toFixed(2)}</span>
                    </div>


                    {/* Grand Total */}
                    <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between items-end">
                        <span className="font-bold text-slate-700 text-sm">Grand Total</span>
                        <span className="text-3xl font-bold tracking-tight text-zinc-900 leading-none">
                            ₹{safeTotal.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* 4. Payment Section - Refactored (Removed flex-1 to prevent layout hiding) */}
                <div className="flex flex-col gap-3 bg-white rounded-lg border border-slate-200 p-3 shadow-sm min-h-0">

                    {/* Payment Mode Toggles - Moved before Status Selector */}
                    {paymentStatus !== 'Unpaid' && (
                        <div className="flex justify-between gap-1">
                            {paymentMethods.map((method) => {
                                const isActive = paymentMode === method.id;
                                const Icon = method.icon;
                                return (
                                    <button
                                        key={method.id}
                                        ref={el => modeRefs.current[method.id] = el}
                                        tabIndex={0}
                                        onClick={() => {
                                            onPaymentChange('mode', method.id);
                                            onPaymentChange('amount', '');
                                            setTimeout(() => amountInputRef.current?.focus(), 50);
                                        }}
                                        onKeyDown={(e) => handleModeKeyDown(e, method.id)}
                                        title={method.label}
                                        className={cn(
                                            "flex-1 flex flex-col items-center justify-center py-2 rounded-lg border transition-all h-14 outline-none focus:ring-2 focus:ring-black focus:ring-offset-1",
                                            isActive
                                                ? method.color + " scale-[1.02] z-10"
                                                : "border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300",
                                            !paymentMode && "animate-pulse border-amber-200 bg-amber-50/50" // Highlight if pending selection
                                        )}
                                    >
                                        <Icon size={20} className="mb-0.5" />
                                        <span className="text-[9px] mt-1 font-semibold opacity-90">{method.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Status Selector - Accessible Buttons - Moved after Payment Mode */}
                    <div className="flex gap-2">
                        {[
                            { id: 'Paid', label: 'Paid' },
                            { id: 'Partially Paid', label: 'Partial' },
                            { id: 'Unpaid', label: 'Credit' }
                        ].map((status) => {
                            const isActive = paymentStatus === status.id;
                            return (
                                <button
                                    key={status.id}
                                    ref={el => statusRefs.current[status.id] = el}
                                    onClick={() => handleStatusChange(status.id)}
                                    onKeyDown={(e) => handleStatusKeyDown(e, status.id)}
                                    tabIndex={0}
                                    className={cn(
                                        "flex-1 text-xs font-bold py-2 rounded-md transition-all border-2 outline-none focus:ring-2 focus:ring-black focus:ring-offset-1",
                                        isActive
                                            ? "bg-black text-white border-black"
                                            : "bg-white text-zinc-900 border-zinc-900 hover:bg-zinc-100"
                                    )}
                                >
                                    {status.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Dynamic Amount / Guidance Area */}
                    <div className="flex-1 flex flex-col justify-center min-h-[60px]">
                        {isUnpaid ? (
                            <div className="flex flex-col items-center justify-center h-full text-black/80 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200 p-2">
                                <span className="text-xs font-semibold">Marked as Credit Bill</span>
                                <span className="text-xs opacity-70">Payment will be collected later</span>
                            </div>
                        ) : (
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</div>
                                <Input
                                    id="amount-received-input"
                                    ref={amountInputRef}
                                    value={amountReceived || ''}
                                    onChange={(e) => onPaymentChange('amount', e.target.value)}
                                    onKeyDown={(e) => {
                                        handleAmountKeyDown(e);
                                        handleKeypadAmount(e);
                                    }}
                                    className="pl-8 h-12 text-2xl font-bold bg-white border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 rounded-xl shadow-inner"
                                    placeholder="0.00"
                                />
                                {isPaid && parseFloat(amountReceived) >= safeTotal && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-black animate-in zoom-in">
                                        <CheckCircle size={20} fill="currentColor" className="text-emerald-500" />
                                    </div>
                                )}
                                <div className="absolute -bottom-5 left-1 text-[10px] text-slate-400 font-medium">
                                    {paymentStatus === 'Paid' ? "Enter full amount received" : "Enter amount received"}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Read-Only Outcome Panel */}
                    <div className="mt-auto pt-2 border-t border-slate-100">
                        {!isPaid && !isUnpaid && balanceDue > 0 ? (
                            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-md border border-neutral-300">
                                <span className="text-xs font-bold text-black uppercase tracking-wide">Balance Due</span>
                                <span className="text-lg font-bold text-black">₹{balanceDue.toFixed(2)}</span>
                            </div>
                        ) : changeToReturn > 0 ? (
                            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-md border border-neutral-300">
                                <span className="text-xs font-bold text-black uppercase tracking-wide">Change Return</span>
                                <span className="text-lg font-bold text-black">₹{changeToReturn.toFixed(2)}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-md border border-slate-100">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</span>
                                <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                                    {isPaid ? "Payment Complete" : "Credit Invoice"}
                                </span>
                            </div>
                        )}
                    </div>

                </div>

            </div>

            {/* 5. Fixed Actions - Compact */}
            <div className="shrink-0 p-2 border-t border-slate-200 bg-white space-y-2 z-10">
                <div className="flex gap-2 h-10">
                    <div className="relative w-24 shrink-0">
                        <select
                            value={printFormat}
                            onChange={(e) => setPrintFormat(e.target.value)}
                            className="w-full h-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black appearance-none"
                        >
                            <optgroup label="Receipt">
                                <option value="80mm">80mm</option>
                                <option value="58mm">58mm</option>
                            </optgroup>
                            <optgroup label="Sheet">
                                <option value="A4">A4</option>
                                <option value="A5">A5</option>
                            </optgroup>
                        </select>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <Printer size={12} />
                        </div>
                    </div>

                    <Button
                        className={cn(
                            "flex-1 h-12 bg-zinc-900 text-white hover:bg-black shadow-lg hover:shadow-xl transition-all font-bold text-base flex items-center justify-center gap-2 rounded-xl",
                            isSaveDisabled && "opacity-50 cursor-not-allowed bg-zinc-400 shadow-none"
                        )}
                        onClick={() => handlePreviewAndSave()}
                        disabled={isProcessing || isSaveDisabled}
                        title={isSaveDisabled ? "Please enter valid customer mobile number and name" : "Save & Print (Enter)"}
                    >
                        {isProcessing ? (
                            <>
                                <Printer size={16} className="animate-pulse" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Printer size={16} />
                                Save & Print
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Use simple React.memo without custom comparison - default is faster
export default React.memo(BillingSidebar);
