import React, { useState, useEffect, useRef } from 'react';
import { printReceipt } from '../../utils/printer';
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


const BillingPage = () => {
    const { addTransaction } = useTransactions();
    const { products } = useProducts();
    const searchInputRef = useRef(null);

    // --- State: Multi-Tab Support ---
    const [activeBills, setActiveBills] = useState([
        {
            id: 1,
            customer: null,
            cart: [],
            totals: { subtotal: 0, tax: 0, discount: 0, total: 0, roundOff: 0 },
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

    // Helper: Get Current Bill
    const currentBill = activeBills.find(b => b.id === activeBillId) || activeBills[0];

    // --- Actions: Tabs ---
    const addNewBill = () => {
        const newId = Math.max(...activeBills.map(b => b.id)) + 1;
        const newBill = {
            id: newId,
            customer: null,
            cart: [],
            totals: { subtotal: 0, tax: 0, discount: 0, total: 0, roundOff: 0 },
            paymentMode: 'Cash',
            amountReceived: 0,
            remarks: '',
            billDiscount: 0,
            additionalCharges: 0,
            loyaltyPointsDiscount: 0
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
                totals: { subtotal: 0, tax: 0, discount: 0, total: 0, roundOff: 0 },
                paymentMode: 'Cash',
                amountReceived: 0,
                remarks: '',
                billDiscount: 0,
                additionalCharges: 0,
                loyaltyPointsDiscount: 0
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
        const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
        // Tax placeholder (e.g. 18% on subtotal) - Optional, keep simple for now or implement if needed
        const totalBeforeDiscounts = subtotal + additionalCharges;
        const total = Math.max(0, totalBeforeDiscounts - billDiscount - loyaltyPointsDiscount);
        return { subtotal, tax: 0, discount: billDiscount + loyaltyPointsDiscount, additionalCharges, total, roundOff: 0 };
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
            newCart.push({ ...product, quantity: 1, total: price, discount: 0 });
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

    const handleSavePrint = async () => {
        if (currentBill.cart.length === 0) {
            alert("Cart is empty!");
            return;
        }
        try {
            // Prepare payload for backend
            const payload = {
                customerId: currentBill.customer ? (currentBill.customer.id || currentBill.customer._id) : '',
                customerName: currentBill.customer ? currentBill.customer.name : 'Walk-in Customer',
                date: new Date(),
                items: currentBill.cart.map(item => ({
                    productId: item.id || item._id, // Backend expects productId
                    name: item.name,
                    quantity: parseInt(item.quantity) || 0,
                    price: parseFloat(item.price || item.sellingPrice) || 0,
                    total: parseFloat(item.total) || 0
                })),
                subtotal: parseFloat(currentBill.totals.subtotal) || 0,
                tax: parseFloat(currentBill.totals.tax) || 0,
                // Total discount = Bill Discount + Loyalty + (Sum of item discounts if backend logic requires separate handling, but simpler to send net values or explicit fields)
                // Backend schema has single 'discount' field usually.
                discount: parseFloat(currentBill.totals.discount) || 0,
                total: parseFloat(currentBill.totals.total) || 0,
                paymentMethod: currentBill.paymentMode || 'Cash',
                // Remarks and Additional Charges might need to be stored in comments or extra fields if backend supports them.
                // For now, sticking to known schema fields.
            };

            const savedBill = await addTransaction(payload);

            // Print the receipt
            printReceipt(savedBill);

            // alert("Bill Saved Successfully!"); // Optional, print dialog is enough feedback? Keep for now.
            closeBill(activeBillId); // Reset/Close after save
        } catch (error) {
            console.error(error);
            alert("Failed to save bill.");
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
        'Ctrl+T': addNewBill,
        'Control+t': addNewBill,
        'Ctrl+W': () => closeBill(activeBillId),
        'Control+w': () => closeBill(activeBillId),
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
                            {bill.id === activeBillId && <span className="text-xs text-slate-400 font-normal ml-2">Ctrl+W</span>}
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
                        <Plus size={14} /> New Bill [Ctrl+T]
                    </button>
                </div>

            </div>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden p-2 gap-2">

                    {/* Footer Actions - Hide on Payment Step (4) as it has its own controls */}
                    {currentStep !== 4 && (
                        <div className="border-t border-slate-100 bg-white p-4 flex justify-between items-center">
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="w-32"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back
                            </Button>

                            {currentStep < steps.length ? (
                                <Button
                                    onClick={nextStep}
                                    className="w-32"
                                    disabled={currentStep === 1 && !billingData.customer} // Require customer selection
                                >
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                /* This "Complete Sale" button was dead/unused. 
                                   Since we hide the footer on step 4, this is effectively removed, 
                                   but we keep the logic structure clean.
                                */
                                null
                            )}
                        </div>
                    )}
                </Card>
            </div>

                    {/* Data Grid */}
                    <BillingGrid
                        cart={currentBill.cart}
                        updateQuantity={updateQuantity}
                        removeItem={removeItem}
                        selectedItemId={selectedItemId}
                        onRowClick={handleRowClick}
                    />
                </div>

                {/* Right Pane - Sidebar */}
                {/* Right Pane - Sidebar */}
                <BillingSidebar
                    customer={currentBill.customer}
                    onCustomerSearch={(e) => {
                        if (currentBill.customer) {
                            // If already has customer, clear it (toggle) or ask confirmation? 
                            // Simple behavior: clicking X clears, checking input opens modal.
                            // But Sidebar input has onClick logic. 
                            // Let's assume the Sidebar handles the clearing if X is clicked (passing null), and searching if input clicked.
                            // Wait, Sidebar prop says onCustomerSearch.
                            // If argument is explicitly null (clear), clear it. Else open modal.
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
                        updateCurrentBill({
                            [field === 'mode' ? 'paymentMode' : 'amountReceived']: value
                        });
                    }}
                    paymentMode={currentBill.paymentMode}
                    amountReceived={currentBill.amountReceived}
                    onSavePrint={handleSavePrint}
                />
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
