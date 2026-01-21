import React, { useState, useEffect, useRef } from 'react';
import { printReceipt } from '../../utils/printerService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, X, Settings, Minus, Plus } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useProducts } from '../../context/ProductContext';
import BillingGrid from './components/BillingGrid';
import BillingSidebar from './components/BillingSidebar';
import BottomFunctionBar from './components/BottomFunctionBar';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import { DiscountModal, RemarksModal, AdditionalChargesModal, LoyaltyPointsModal } from './components/ActionModals';
import CustomerSearchModal from './components/CustomerSearchModal';
import { useSettings } from '../../context/SettingsContext';


const BillingPage = () => {
    const { addTransaction } = useTransactions();
    const { products } = useProducts();
    const { settings } = useSettings();
    const searchInputRef = useRef(null);

    // --- State: Multi-Tab Support ---
    const [activeBills, setActiveBills] = useState([
        {
            id: 1,
            customer: null,
            cart: [],
            totals: { grossTotal: 0, itemDiscount: 0, subtotal: 0, tax: 0, discount: 0, additionalCharges: 0, roundOff: 0, total: 0 },
            paymentMode: 'Cash',
            amountReceived: 0,
            remarks: '',
            billDiscount: 0
        }
    ]);
    const [activeBillId, setActiveBillId] = useState(1);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [modals, setModals] = useState({
        itemDiscount: false,
        billDiscount: false,
        remarks: false,
        additionalCharges: false,
        loyaltyPoints: false,
        customerSearch: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [focusIndex, setFocusIndex] = useState(-1); // For keyboard navigation in grid
    const [mobileTab, setMobileTab] = useState('items'); // 'items' | 'payment'

    // Helper: Get Current Bill
    const currentBill = activeBills.find(b => b.id === activeBillId) || activeBills[0];

    // --- Actions: Tabs ---
    const addNewBill = () => {
        const newId = Math.max(...activeBills.map(b => b.id)) + 1;
        const newBill = {
            id: newId,
            customer: null,
            cart: [],
            totals: { grossTotal: 0, itemDiscount: 0, subtotal: 0, tax: 0, discount: 0, additionalCharges: 0, roundOff: 0, total: 0 },
            paymentMode: 'Cash',
            amountReceived: 0,
            remarks: '',
            billDiscount: 0,
            additionalCharges: 0,
            loyaltyPointsDiscount: 0,
            status: 'Paid' // Default status
        };
        setActiveBills([...activeBills, newBill]);
        setActiveBillId(newId);
        setSelectedItemId(null);
    };

    const closeBill = (id) => {
        if (activeBills.length === 1) {
            // Don't close the last tab, just reset it
            const freshBill = {
                id: 1,
                customer: null,
                cart: [],
                totals: { grossTotal: 0, itemDiscount: 0, subtotal: 0, tax: 0, discount: 0, additionalCharges: 0, roundOff: 0, total: 0 },
                paymentMode: 'Cash',
                amountReceived: 0,
                remarks: '',
                billDiscount: 0,
                additionalCharges: 0,
                loyaltyPointsDiscount: 0,
                status: 'Paid'
            };
            setActiveBills([freshBill]);
            setActiveBillId(1);
            setSelectedItemId(null);
            return;
        }

        const newBills = activeBills.filter(b => b.id !== id);
        setActiveBills(newBills);
        if (id === activeBillId) {
            setActiveBillId(newBills[newBills.length - 1].id);
        }
    };

    const updateCurrentBill = (updates) => {
        setActiveBills(prev => prev.map(bill =>
            bill.id === activeBillId ? { ...bill, ...updates } : bill
        ));
    };

    const calculateTotals = (cart, billDiscount = 0, additionalCharges = 0, loyaltyPointsDiscount = 0) => {
        let grossTotal = 0;
        let itemDiscount = 0;
        let totalTax = 0;

        const isInclusive = settings.tax?.defaultType === 'Inclusive' || settings.tax?.priceMode === 'Inclusive';

        // Calculate line items first
        cart.forEach(item => {
            const price = parseFloat(item.price || item.sellingPrice || 0);
            const qty = parseFloat(item.quantity || 0);
            const discount = parseFloat(item.discount || 0);
            const taxRate = parseFloat(item.taxRate || 0);

            // Base Amount (Quantity * Unit Price)
            let baseAmount = price * qty;
            let taxAmount = 0;

            if (isInclusive) {
                // If Inclusive: Price = Base + Tax
                // Base = Price / (1 + Rate/100)
                const baseUnitPrice = price / (1 + (taxRate / 100));
                baseAmount = baseUnitPrice * qty;
                taxAmount = (price * qty) - baseAmount;
            } else {
                // Exclusive: Price is Base. Tax is extra.
                // Base Amount is already price * qty
                taxAmount = baseAmount * (taxRate / 100);
            }

            grossTotal += baseAmount;
            // Discount applies to the base value usually? 
            // Standard POS: Discount is usually on selling price (inclusive or exclusive).
            // Let's assume Discount is a flat reduction on the line total.
            // If inclusive, we reduce the "Inclusive Total" then back-calculate tax? Complex.
            // Simplified: Discount reduces the Taxable Amount.
            // Adjusted Base = Base Amount - Discount
            // Adjusted Tax = Adjusted Base * Rate / 100

            // To keep simple for now without complex inclusive-discount logic:
            // We treat discount as post-tax deduction or pre-tax? 
            // Usually Pre-Tax.

            // Let's stick to simple iterative sum for now matching the existing structure but adding tax.

            // Re-logic for robustness:
            // 1. Line Total (Qty * Price)
            // 2. Less Item Discount
            // 3. Taxable Value = (1) - (2) [If exclusive]
            // 4. Tax = Taxable * Rate

            // If Inclusive:
            // 1. Line Total (Inclusive)
            // 2. Less Discount
            // 3. Taxable = (Line Total - Discount) / (1 + rate)
            // 4. Tax = (Line Total - Discount) - Taxable

            const lineTotalRaw = (price * qty);
            itemDiscount += discount;

            const effectiveTotal = Math.max(0, lineTotalRaw - discount);
            let taxableValue = effectiveTotal;
            let lineTax = 0;

            if (isInclusive) {
                taxableValue = effectiveTotal / (1 + (taxRate / 100));
                lineTax = effectiveTotal - taxableValue;
            } else {
                lineTax = taxableValue * (taxRate / 100);
            }

            totalTax += lineTax;
            // Warning: grossTotal definitions vary. Let's set it as Sum of (Price * Qty).
        });

        // Re-sum gross from scratch for clarity
        // Let's blindly trust the simple logic:
        // Gross = Sum(Price * Qty)
        // Subtotal = Gross - ItemDiscounts
        // Tax = Calculated above
        // Total = Subtotal + Tax + Charges - BillDiscount

        // Correction: If Exclusive, Subtotal usually excludes Tax.
        // If Inclusive, Subtotal includes Tax? No, cleaner to separate.

        // Let's standardize: 
        // Gross = Sum of (Qty * Unit Price). 
        // Subtotal = Taxable Value Sum (after item discounts).

        // Refined Loop for aggregates:
        let aggGross = 0;
        let aggItemDisc = 0;
        let aggTax = 0;
        let aggSubtotal = 0; // This will be Taxable Value

        cart.forEach(item => {
            const price = parseFloat(item.price || item.sellingPrice || 0);
            const qty = parseFloat(item.quantity || 0);
            const discount = parseFloat(item.discount || 0);
            const taxRate = parseFloat(item.taxRate || 0);

            aggGross += (price * qty);
            aggItemDisc += discount;

            const effectiveAmount = Math.max(0, (price * qty) - discount);

            if (isInclusive) {
                const taxable = effectiveAmount / (1 + (taxRate / 100));
                const tax = effectiveAmount - taxable;
                aggSubtotal += taxable;
                aggTax += tax;
            } else {
                aggSubtotal += effectiveAmount;
                aggTax += (effectiveAmount * (taxRate / 100));
            }
        });

        const totalBeforeDiscounts = aggSubtotal + aggTax + additionalCharges;
        const total = Math.max(0, totalBeforeDiscounts - billDiscount - loyaltyPointsDiscount);

        return {
            grossTotal: aggGross,
            itemDiscount: aggItemDisc,
            subtotal: aggSubtotal,
            tax: aggTax,
            discount: billDiscount + loyaltyPointsDiscount,
            additionalCharges,
            total,
            roundOff: 0
        };
    };

    // --- Calculations ---
    useEffect(() => {
        // Recalculate whenever cart, discounts or charges change
        const newTotals = calculateTotals(
            currentBill.cart,
            currentBill.billDiscount || 0,
            currentBill.additionalCharges || 0,
            currentBill.loyaltyPointsDiscount || 0
        );

        // Only update if numbers are different to avoid loop
        if (newTotals.total !== currentBill.totals.total || newTotals.subtotal !== currentBill.totals.subtotal) {
            updateCurrentBill({ totals: newTotals });
        }
    }, [currentBill.cart, currentBill.billDiscount, currentBill.additionalCharges, currentBill.loyaltyPointsDiscount]);

    // --- Filter products ---
    const filteredProducts = searchTerm
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 8)
        : [];

    // --- Actions: Cart ---
    const addToCart = (product) => {
        const productId = product.id || product._id;
        const price = product.price || product.sellingPrice || 0;

        let newCart = [...currentBill.cart];
        const existingIndex = newCart.findIndex(item => (item.id || item._id) === productId);

        if (existingIndex > -1) {
            newCart[existingIndex].quantity += 1;
            const itemPrice = newCart[existingIndex].price || newCart[existingIndex].sellingPrice || 0;
            newCart[existingIndex].total = (newCart[existingIndex].quantity * itemPrice) - (newCart[existingIndex].discount || 0);
        } else {
            newCart.push({ ...product, quantity: 1, total: price, discount: 0, taxRate: product.taxRate || 0 });
        }

        updateCurrentBill({ cart: newCart });
        setSearchTerm('');
        if (searchInputRef.current) searchInputRef.current.focus();
        // Auto select newly added item
        setSelectedItemId(product.id || product._id);
    };

    const updateQuantity = (id, newQty) => {
        if (newQty < 1) return;
        const newCart = currentBill.cart.map(item => {
            const itemId = item.id || item._id;
            const price = item.price || item.sellingPrice || 0;
            const discount = item.discount || 0;
            return itemId === id ? { ...item, quantity: newQty, total: (newQty * price) - discount } : item;
        });
        updateCurrentBill({ cart: newCart });
    };

    const removeItem = (id) => {
        const newCart = currentBill.cart.filter(item => (item.id || item._id) !== id);
        updateCurrentBill({ cart: newCart });
        if (id === selectedItemId) setSelectedItemId(null);
    };

    const handleRowClick = (id) => {
        setSelectedItemId(id);
    };

    // --- Actions: Key Handlers ---
    const handleF2 = () => {
        // Change Qty
        if (selectedItemId) {
            const qtyInput = document.getElementById(`qty-${selectedItemId}`);
            if (qtyInput) {
                qtyInput.focus();
                qtyInput.select();
            } else {
                // Fallback if ID scheme fails or logic differs
                // Since input is inside grid, let's use a simpler prompt/modal if focus fails
                // But simpler: just toggle a 'isEditingQty' state? 
                // For now, let's try to focus the input if we add IDs to them in Grid.
                // Alternate: Open small modal
            }
        }
    };

    const handleF3 = () => {
        // Item Discount
        if (selectedItemId) {
            setModals(prev => ({ ...prev, itemDiscount: true }));
        } else {
            alert("No item selected for discount.");
        }
    };

    const handleF4 = () => {
        // Remove Item
        if (selectedItemId) {
            removeItem(selectedItemId);
        } else if (currentBill.cart.length > 0) {
            // If nothing specifically selected, clean last?
            // Or enforce selection
            alert("Please select an item to remove.");
        }
    };

    const handleF6 = () => {
        // Change Unit - Toggle Pattern (PCS -> BOX -> PCS)
        if (selectedItemId) {
            const newCart = currentBill.cart.map(item => {
                const itemId = item.id || item._id;
                if (itemId === selectedItemId) {
                    const currentUnit = item.unit?.toLowerCase() || 'pcs';
                    const newUnit = currentUnit === 'pcs' ? 'box' : 'pcs';
                    return { ...item, unit: newUnit };
                }
                return item;
            });
            updateCurrentBill({ cart: newCart });
        } else {
            alert("No item selected. Please select an item to change its unit.");
        }
    };

    const handleF8 = () => {
        setModals(prev => ({ ...prev, additionalCharges: true }));
    };

    const handleF9 = () => {
        setModals(prev => ({ ...prev, billDiscount: true }));
    };

    const handleF10 = () => {
        setModals(prev => ({ ...prev, loyaltyPoints: true }));
    };

    const handleF12 = () => {
        setModals(prev => ({ ...prev, remarks: true }));
    };

    const handleApplyItemDiscount = (val, isPercent) => {
        if (!selectedItemId) return;
        const newCart = currentBill.cart.map(item => {
            const itemId = item.id || item._id;
            if (itemId === selectedItemId) {
                const price = item.price || item.sellingPrice || 0;
                const baseTotal = item.quantity * price;
                const discount = isPercent ? (baseTotal * val / 100) : val;
                return { ...item, discount: discount, total: Math.max(0, baseTotal - discount) };
            }
            return item;
        });
        updateCurrentBill({ cart: newCart });
    };

    const handleApplyBillDiscount = (val, isPercent) => {
        const subtotal = currentBill.cart.reduce((acc, item) => acc + item.total, 0);
        const discount = isPercent ? (subtotal * val / 100) : val;
        updateCurrentBill({ billDiscount: discount });
    };

    const handleApplyAdditionalCharges = (val) => {
        updateCurrentBill({ additionalCharges: val });
    };

    const handleApplyLoyaltyRedemption = (val) => {
        updateCurrentBill({ loyaltyPointsDiscount: val });
    };

    const handleSaveRemarks = (text) => {
        updateCurrentBill({ remarks: text });
    };

    const handleSavePrint = async (format = '80mm') => {
        if (currentBill.cart.length === 0) {
            alert("Cart is empty!");
            return;
        }
        try {
            // Prepare payload for backend
            const payload = {
                customerId: currentBill.customer ? (currentBill.customer.id || currentBill.customer._id) : '',
                customerName: currentBill.customer ? (currentBill.customer.fullName || currentBill.customer.name || `${currentBill.customer.firstName || ''} ${currentBill.customer.lastName || ''}`.trim()) : 'Walk-in Customer',
                date: new Date(),
                items: currentBill.cart
                    .filter(item => (item.id || item._id) && item.quantity > 0) // Ensure valid items
                    .map(item => ({
                        productId: item.id || item._id, // Backend expects productId
                        name: item.name,
                        quantity: parseFloat(item.quantity) || 0,
                        price: parseFloat(item.price || item.sellingPrice) || 0,
                        total: parseFloat(item.total) || 0
                    })),
                grossTotal: parseFloat(currentBill.totals.grossTotal) || 0,
                itemDiscount: parseFloat(currentBill.totals.itemDiscount) || 0,
                subtotal: parseFloat(currentBill.totals.subtotal) || 0,
                tax: parseFloat(currentBill.totals.tax) || 0,
                discount: parseFloat(currentBill.totals.discount) || 0,
                additionalCharges: parseFloat(currentBill.totals.additionalCharges) || 0,
                roundOff: parseFloat(currentBill.totals.roundOff) || 0,
                total: parseFloat(currentBill.totals.total) || 0,
                paymentMethod: currentBill.paymentMode || 'Cash',
                status: currentBill.status || 'Paid', // Send status to backend
                internalNotes: currentBill.remarks || '',
                amountReceived: parseFloat(currentBill.amountReceived) || 0, // Pass amount received
            };

            console.log("Sending Invoice Payload:", payload);
            const savedBill = await addTransaction(payload);

            // Print the receipt
            console.log("Printing with Store Settings:", settings);
            printReceipt(savedBill, format, settings);

            // alert("Bill Saved Successfully!"); // Optional, print dialog is enough feedback? Keep for now.
            closeBill(activeBillId); // Reset/Close after save
        } catch (error) {
            console.error("Save Error Details:", error);
            if (error.response) {
                console.error("Backend Error Response:", error.response.data);
            }
            const errorMessage = error.response?.data?.message || error.message || "Failed to save bill.";
            alert(`Failed to save bill: ${errorMessage}`);
        }
    };

    // --- Keyboard Map ---
    useKeyboardShortcuts({
        'F2': handleF2,
        'F3': handleF3,
        'F4': handleF4,
        'F6': handleF6,
        'F8': handleF8,
        'F9': handleF9,
        'F10': handleF10,
        'F12': handleF12,
        'Ctrl+P': handleSavePrint,
        'Control+p': handleSavePrint,
        'Alt+T': addNewBill,            // Changed from Ctrl+T to avoid browser New Tab conflict
        'Alt+t': addNewBill,
        'Alt+W': () => closeBill(activeBillId), // Changed from Ctrl+W to avoid browser Close Tab conflict
        'Alt+w': () => closeBill(activeBillId),
        'F11': () => {
            setModals(prev => ({ ...prev, customerSearch: true }));
        }
    });

    const handleFunctionClick = (key) => {
        switch (key) {
            case 'F2': handleF2(); break;
            case 'F3': handleF3(); break;
            case 'F4': handleF4(); break;
            case 'F6': handleF6(); break;
            case 'F8': handleF8(); break;
            case 'F9': handleF9(); break;
            case 'F10': handleF10(); break;
            case 'F12': handleF12(); break;
            default: break;
        }
    };

    // --- Render ---
    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col bg-slate-50">
            {/* Top Bar - Tabs & Tools */}
            <div className="flex justify-between items-center p-2 bg-white border-b shadow-sm h-12">
                <div className="flex gap-2 items-end h-full overflow-x-auto">
                    {activeBills.map(bill => (
                        <div
                            key={bill.id}
                            onClick={() => setActiveBillId(bill.id)}
                            className={`flex items-center gap-2 px-4 py-2 border-t border-x rounded-t-md text-sm font-bold cursor-pointer select-none relative -bottom-[1px] ${bill.id === activeBillId
                                ? 'bg-white border-blue-500 text-blue-600 z-10'
                                : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            <span>#{bill.id}</span>
                            {bill.id === activeBillId && <span className="text-xs text-slate-400 font-normal ml-2">Alt+W</span>}
                            <X
                                size={12}
                                className="text-slate-400 hover:text-red-500 cursor-pointer ml-2"
                                onClick={(e) => { e.stopPropagation(); closeBill(bill.id); }}
                            />
                        </div>
                    ))}
                    <button
                        onClick={addNewBill}
                        className="flex items-center gap-1 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-semibold mb-1"
                    >
                        <Plus size={14} /> New Bill [Alt+T]
                    </button>
                </div>

            </div>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden p-2 gap-2 flex-col md:flex-row relative">

                {/* Mobile Tab Toggles */}
                <div className="md:hidden flex w-full bg-slate-200 rounded-lg p-1 mb-2 shrink-0">
                    <button
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mobileTab === 'items' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                        onClick={() => setMobileTab('items')}
                    >
                        Items ({currentBill.cart.length})
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mobileTab === 'payment' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                        onClick={() => setMobileTab('payment')}
                    >
                        Payment (₹{currentBill.totals.total.toFixed(0)})
                    </button>
                </div>

                {/* Left Pane - Search & Grid */}
                <div className={`flex-1 flex flex-col gap-2 bg-transparent ${mobileTab === 'items' ? 'flex' : 'hidden md:flex'}`}>
                    {/* Item Search Bar */}
                    <div className="relative z-20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 h-5 w-5" />
                            <Input
                                ref={searchInputRef}
                                autoFocus
                                className="pl-10 h-12 text-lg border-blue-300 focus:border-blue-600 shadow-sm"
                                placeholder="Scan or search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Autocomplete Dropdown */}
                        {searchTerm && filteredProducts.length > 0 && (
                            <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg py-1 max-h-60 overflow-y-auto">
                                {filteredProducts.map(product => (
                                    <div
                                        key={product.id || product._id}
                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between border-b last:border-0"
                                        onClick={() => addToCart(product)}
                                    >
                                        <div>
                                            <span className="font-bold block text-slate-700">{product.name}</span>
                                            <span className="text-xs text-slate-400">{product.sku} | {product.category}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-medium text-blue-600">₹{product.price || product.sellingPrice}</span>
                                            <span className="block text-xs text-slate-400">Stock: {product.stock}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Data Grid */}
                    <BillingGrid
                        cart={currentBill.cart}
                        updateQuantity={updateQuantity}
                        removeItem={removeItem}
                        selectedItemId={selectedItemId}
                        onRowClick={handleRowClick}
                        onDiscountClick={(id) => {
                            setSelectedItemId(id);
                            setModals(prev => ({ ...prev, itemDiscount: true }));
                        }}
                    />

                    {/* Mobile Floating Pay Button (only on Items tab) */}
                    <div className="md:hidden mt-2">
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
                            onClick={() => setMobileTab('payment')}
                        >
                            Proceed to Pay ₹{currentBill.totals.total.toFixed(2)}
                        </Button>
                    </div>
                </div>

                {/* Right Pane - Sidebar */}
                <div className={`${mobileTab === 'payment' ? 'flex flex-1 overflow-auto' : 'hidden md:block'} w-full md:w-auto`}>
                    <BillingSidebar
                        customer={currentBill.customer}
                        onCustomerSearch={(e) => {
                            if (currentBill.customer) {
                                if (e === null) {
                                    updateCurrentBill({ customer: null });
                                } else {
                                    setModals(prev => ({ ...prev, customerSearch: true }));
                                }
                            } else {
                                setModals(prev => ({ ...prev, customerSearch: true }));
                            }
                        }}
                        totals={currentBill.totals}
                        onPaymentChange={(field, value) => {
                            if (field === 'status') {
                                // Logic for auto-setting amount received based on status could go here
                                // e.g., if status is Unpaid, amountReceived = 0
                                let updates = { status: value };
                                if (value === 'Unpaid') updates.amountReceived = 0;
                                if (value === 'Paid') updates.amountReceived = currentBill.totals.total; // Auto-fill full amount? User convenience.
                                updateCurrentBill(updates);
                            } else {
                                updateCurrentBill({
                                    [field === 'mode' ? 'paymentMode' : 'amountReceived']: value
                                });
                            }
                        }}
                        paymentMode={currentBill.paymentMode}
                        paymentStatus={currentBill.status || 'Paid'} // Pass status
                        amountReceived={currentBill.amountReceived}
                        onSavePrint={handleSavePrint}
                    />
                </div>
            </div>

            {/* Bottom Function Bar */}
            <BottomFunctionBar onFunctionClick={handleFunctionClick} />

            {/* Action Modals */}
            <DiscountModal
                isOpen={modals.itemDiscount}
                onClose={() => setModals(prev => ({ ...prev, itemDiscount: false }))}
                onApply={handleApplyItemDiscount}
                title={`Item Discount - ${currentBill.cart.find(i => (i.id || i._id) === selectedItemId)?.name || 'Unknown'}`}
            />
            <DiscountModal
                isOpen={modals.billDiscount}
                onClose={() => setModals(prev => ({ ...prev, billDiscount: false }))}
                onApply={handleApplyBillDiscount}
                title="Bill Discount"
                initialValue={currentBill.billDiscount}
            />
            <AdditionalChargesModal
                isOpen={modals.additionalCharges}
                onClose={() => setModals(prev => ({ ...prev, additionalCharges: false }))}
                onApply={handleApplyAdditionalCharges}
                initialValue={currentBill.additionalCharges}
            />
            <LoyaltyPointsModal
                isOpen={modals.loyaltyPoints}
                onClose={() => setModals(prev => ({ ...prev, loyaltyPoints: false }))}
                onApply={handleApplyLoyaltyRedemption}
                availablePoints={250} // Mock points
            />
            <RemarksModal
                isOpen={modals.remarks}
                onClose={() => setModals(prev => ({ ...prev, remarks: false }))}
                onSave={handleSaveRemarks}
                initialValue={currentBill.remarks}
            />
            <CustomerSearchModal
                isOpen={modals.customerSearch}
                onClose={() => setModals(prev => ({ ...prev, customerSearch: false }))}
                onSelect={(customer) => updateCurrentBill({ customer })}
            />

        </div>
    );
};

export default BillingPage;
