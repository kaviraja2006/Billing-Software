import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Search, ScanBarcode, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useProducts } from '../../context/ProductContext';
import { cn } from '../../lib/utils';

const ProductStep = ({ billingData, setBillingData }) => {
    const { products, getProductByBarcode } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [barcode, setBarcode] = useState('');

    // Filter products based on search
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );

    // Add Item to Cart
    const addToCart = (product) => {
        if (product.stock <= 0) {
            alert('Item is out of stock!');
            return;
        }

        setBillingData(prev => {
            const existingItem = prev.cart.find(item => item.id === product.id);
            let newCart;

            if (existingItem) {
                if (existingItem.quantity >= product.stock) {
                    alert(`Cannot add more. Only ${product.stock} in stock.`);
                    return prev;
                }
                newCart = prev.cart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                newCart = [...prev.cart, { ...product, quantity: 1, discount: 0, tax: 0 }];
            }

            return calculateTotals(newCart, prev);
        });
    };

    // Remove Item from Cart
    const removeFromCart = (productId) => {
        setBillingData(prev => {
            const newCart = prev.cart.filter(item => item.id !== productId);
            return calculateTotals(newCart, prev);
        });
    };

    // Update Quantity
    const updateQuantity = (productId, change) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setBillingData(prev => {
            const newCart = prev.cart.map(item => {
                if (item.id === productId) {
                    const newQty = item.quantity + change;
                    // Logic to prevent negative or zero quantity if desired, but typically we allow 1 minimum
                    if (newQty < 1) return item;
                    // Stock check
                    if (change > 0 && newQty > product.stock) {
                        alert(`Cannot add more. Only ${product.stock} in stock.`);
                        return item;
                    }
                    return { ...item, quantity: newQty };
                }
                return item;
            });
            return calculateTotals(newCart, prev);
        });
    };

    // Helper to recalculate totals
    const calculateTotals = (cart, prevState) => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Tax is calculated in SummaryStep now actually, but let's keep basic logic here if needed for live view
        // Ideally we should centralize calculation logic or just trust SummaryStep
        // For consistent UI in cart footer:
        const tax = 0; // Let SummaryStep handle global tax or item-wise tax
        // If we want item wise tax:
        // const tax = cart.reduce((sum, item) => sum + (item.price * item.quantity * (item.taxRate || 0) / 100), 0);

        const total = subtotal + tax;

        return {
            ...prevState,
            cart,
            totals: { ...prevState.totals, subtotal, tax, total }
        };
    };

    // Handle Barcode Scan
    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        const product = getProductByBarcode(barcode);
        if (product) {
            addToCart(product);
            setBarcode('');
        } else {
            alert('Product not found!');
        }
    };

    return (
        <div className="flex h-full gap-6">
            {/* LEFT: Product Selection (60%) */}
            <div className="w-[60%] flex flex-col gap-4">
                {/* Search Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search products..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <form onSubmit={handleBarcodeSubmit} className="flex gap-2 w-1/3">
                        <div className="relative flex-1">
                            <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Scan Barcode"
                                className="pl-9"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                            />
                        </div>
                    </form>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredProducts.map(product => {
                            const isLowStock = product.stock < 10;
                            const isOut = product.stock <= 0;
                            return (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className={cn(
                                        "group cursor-pointer rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-blue-400 hover:shadow-md relative",
                                        isOut && "opacity-60 cursor-not-allowed hover:border-slate-200"
                                    )}
                                >
                                    <div className="mb-2 h-24 rounded-md bg-slate-100 flex items-center justify-center text-slate-300">
                                        <ShoppingCart size={32} />
                                    </div>
                                    <h4 className="font-semibold text-slate-900 line-clamp-1">{product.name}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-bold text-blue-600">${product.price.toFixed(2)}</span>
                                        <span className={cn(
                                            "text-xs",
                                            isOut ? "text-red-500 font-bold" : isLowStock ? "text-orange-500 font-medium" : "text-slate-500"
                                        )}>
                                            {isOut ? 'Out of Stock' : `${product.stock} in stock`}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="flex h-40 items-center justify-center text-slate-500">
                            No products found.
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart (40%) */}
            <div className="w-[40%] flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <ShoppingCart size={18} /> Current Cart
                    </h3>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {billingData.cart.length} items
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {billingData.cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-white sticky top-0">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[40%]">Item</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="w-[30px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billingData.cart.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="py-3">
                                            <p className="font-medium text-slate-900 line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-slate-500">${item.price}</p>
                                        </TableCell>
                                        <TableCell className="text-center py-3">
                                            <div className="flex items-center justify-center gap-1 bg-slate-100 rounded-lg p-1 w-fit mx-auto">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                                                    className="h-6 w-6 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-blue-600"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                                                    className="h-6 w-6 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-blue-600"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium py-3">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Cart Total footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>${billingData.totals.subtotal.toFixed(2)}</span>
                    </div>
                    {/* Placeholder tax display */}
                    <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200 mt-2">
                        {/* Note: Final tax and total is calculated in Summary step, this is just subtotal preview */}
                        <span>Subtotal</span>
                        <span>${billingData.totals.subtotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ProductStep;
