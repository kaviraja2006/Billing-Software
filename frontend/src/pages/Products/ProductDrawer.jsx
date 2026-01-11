import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, Loader2, Plus, X, ChevronDown, ChevronRight, Calculator, AlertTriangle, Save, Trash } from 'lucide-react';
import { fetchProductMetadata } from '../../services/barcodeService';
import { Badge } from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

const AutocompleteInput = ({ label, name, value, onChange, suggestions = [], placeholder }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filtered, setFiltered] = useState([]);

    useEffect(() => {
        if (value) {
            setFiltered(suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())));
        } else {
            setFiltered(suggestions);
        }
    }, [value, suggestions]);

    return (
        <div className="relative space-y-2">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <div className="relative">
                <Input
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoComplete="off"
                />
                {showSuggestions && filtered.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1 no-scrollbar">
                        {filtered.map(item => (
                            <li
                                key={item}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 hover:text-blue-700 transition-colors"
                                onClick={() => onChange({ target: { name, value: item } })}
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const ProductDrawer = ({ isOpen, onClose, product, onSave, existingUnits, existingCategories, existingBrands }) => {
    const title = product ? 'Edit Product' : 'Add New Product';

    // Initial State Template
    const initialState = {
        name: '',
        category: '',
        brand: '',
        price: '',
        stock: '',
        barcode: '',
        barcodeType: 'CODE128',
        taxRate: 0,
        costPrice: '',
        minStock: 10,
        unit: '',
        description: '',
        expiryDate: '',
        isActive: true,
        hasVariants: false,
        variants: []
    };

    const [formData, setFormData] = useState(initialState);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
    const priceInputRef = useRef(null);

    // Reset or Populate Form
    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData({
                    ...initialState,
                    ...product,
                    // Ensure boolean/array fields are handled if missing in old data
                    isActive: product.isActive !== undefined ? product.isActive : true,
                    hasVariants: product.variants && product.variants.length > 0,
                    variants: product.variants || []
                });
            } else {
                setFormData(initialState);
            }
        }
    }, [product, isOpen]);

    // Handle standard inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Calculate Margin
    const calculateMargin = () => {
        const cost = parseFloat(formData.costPrice) || 0;
        const selling = parseFloat(formData.price) || 0;
        if (selling === 0) return { amount: 0, percent: 0, color: 'text-slate-500', bg: 'bg-slate-100' };

        const marginInfo = selling - cost;
        const percent = ((marginInfo / selling) * 100).toFixed(1);

        let color = 'text-green-700';
        let bg = 'bg-green-100';

        if (percent < 15) {
            color = 'text-rose-700';
            bg = 'bg-rose-100';
        } else if (percent < 30) {
            color = 'text-amber-700';
            bg = 'bg-amber-100';
        }

        return { amount: marginInfo.toFixed(2), percent, color, bg };
    };

    const margin = calculateMargin();

    // Variant Helpers
    const handleAddVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    name: 'Variant',
                    options: [''],
                    price: prev.price || 0,
                    stock: 0,
                    sku: prev.sku ? `${prev.sku}-${prev.variants.length + 1}` : ''
                }
            ]
        }));
    };

    const handleRemoveVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...formData.variants];
        if (field === 'option') {
            newVariants[index].options = [value]; // We store as array based on backend, strictly 1 option for now
        } else {
            newVariants[index][field] = value;
        }
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const handleSave = async (addAnother = false) => {
        if (!formData.name) {
            alert('Product Name is required.');
            return;
        }

        // Basic validation for variants
        if (formData.hasVariants) {
            if (formData.variants.length === 0) {
                alert('Please add at least one variant or disable variants.');
                return;
            }
            // Check for empty names
            const invalidVariant = formData.variants.find(v => !v.options[0] || v.options[0].trim() === '');
            if (invalidVariant) {
                alert('All variants must have a name (e.g. Size, Color).');
                return;
            }
        }



        const payload = { ...formData };
        if (!payload.hasVariants) {
            payload.variants = [];
        }

        try {
            await onSave(payload);

            if (addAnother) {
                // Keep drawer open, reset form but keep Category/Brand for speed
                setFormData(prev => ({
                    ...initialState,
                    category: prev.category,
                    brand: prev.brand,
                    unit: prev.unit,
                    taxRate: prev.taxRate
                }));
                // Focus name field
                setTimeout(() => {
                    const nameInput = document.querySelector('input[name="name"]');
                    if (nameInput) nameInput.focus();
                }, 0);
            } else {
                onClose();
            }
        } catch (error) {
            // Stay open on error
            console.error("Error saving product:", error);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            // ESC to Close
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }

            // Ctrl + S (Save & Add Another)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave(true);
                return;
            }

            // Enter to Save (Save & Close)
            // Ignore if in textarea or if it's the specific barcode input (which has its own handler)
            if (e.key === 'Enter') {
                // If focus is on textarea, let it insert newline
                if (document.activeElement.tagName.toLowerCase() === 'textarea') return;

                // If focus is on barcode input, let it do lookup (it has its own onKeyDown)
                if (document.activeElement.name === 'barcode') return;

                e.preventDefault();
                handleSave(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, formData]);


    const handleBarcodeLookup = async () => { /* ... existing logic ... */
        const code = formData.barcode;
        if (!code) return;
        setIsLookingUp(true);
        try {
            const metadata = await fetchProductMetadata(code);
            if (metadata) {
                setFormData(prev => ({
                    ...prev,
                    name: metadata.name || prev.name,
                    brand: metadata.brand || prev.brand,
                    category: metadata.category || prev.category,
                    barcodeType: code.length === 13 ? 'EAN13' : code.length === 12 ? 'UPC' : prev.barcodeType
                }));
                setTimeout(() => priceInputRef.current?.focus(), 100);
            } else {
                alert('Product details not found.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLookingUp(false);
        }
    };

    // Min Stock Presets
    const stockPresets = [0, 5, 10, 25];

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={title} width="max-w-4xl">
            <div className="space-y-6 h-full flex flex-col relative">

                {/* Scrollable Content */}
                <div className="flex-1 space-y-6 overflow-y-auto pb-4 pr-1">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium text-slate-700">Product Name <span className="text-rose-500">*</span></label>
                                <Input
                                    name="name"
                                    placeholder="e.g. Premium Cotton Shirt"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoFocus
                                />
                            </div>
                            {/* Active Status Toggle */}
                            <div className="space-y-2 flex flex-col items-end">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    className={`relative inline-flex h-9 w-24 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-100' : 'bg-slate-100'} border ${formData.isActive ? 'border-green-200' : 'border-slate-200'}`}
                                >
                                    <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${formData.isActive ? 'translate-x-[60px] bg-green-500' : 'translate-x-1 bg-slate-400'}`} />
                                    <span className={`absolute text-xs font-semibold ${formData.isActive ? 'left-3 text-green-700' : 'right-3 text-slate-500'}`}>
                                        {formData.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <AutocompleteInput
                                label="Category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                suggestions={existingCategories}
                                placeholder="Select or Type Category"
                            />
                            <AutocompleteInput
                                label="Brand"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                suggestions={existingBrands}
                                placeholder="Brand Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Add product details, size info, or notes..."
                                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Pricing & Stock Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-sm text-slate-900">Pricing & Inventory</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">Has Variants?</span>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                    checked={formData.hasVariants}
                                    onChange={(e) => setFormData(prev => ({ ...prev, hasVariants: e.target.checked }))}
                                />
                            </div>
                        </div>

                        {/* Standard Pricing (Hidden if has Variants) */}
                        {!formData.hasVariants && (
                            <>
                                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Cost Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                            <Input
                                                name="costPrice"
                                                type="number"
                                                placeholder="0.00"
                                                value={formData.costPrice}
                                                onChange={handleChange}
                                                className="pl-7"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Selling Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                            <Input
                                                name="price"
                                                type="number"
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={handleChange}
                                                className="pl-7"
                                                ref={priceInputRef}
                                            />
                                        </div>
                                    </div>

                                    {/* Profit Readout */}
                                    <div className="col-span-2 flex justify-end">
                                        <div className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 animate-in fade-in duration-300 ${margin.bg} ${margin.color}`}>
                                            <Calculator size={14} />
                                            Margin: ₹{margin.amount} ({margin.percent}%)
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Current Stock</label>
                                        <Input
                                            name="stock"
                                            type="number"
                                            placeholder="0"
                                            value={formData.stock}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Min. Stock Alert</label>
                                        <div className="space-y-2">
                                            <Input
                                                name="minStock"
                                                type="number"
                                                placeholder="10"
                                                value={formData.minStock}
                                                onChange={handleChange}
                                            />
                                            <div className="flex gap-2">
                                                {stockPresets.map(preset => (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, minStock: preset }))}
                                                        className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                                                    >
                                                        {preset}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Variants UI */}
                        {formData.hasVariants && (
                            <div className="space-y-3">
                                <div className="flex justify-end">
                                    <Button size="sm" variant="outline" onClick={handleAddVariant}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Variant
                                    </Button>
                                </div>
                                <div className="rounded-md border border-slate-200 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Variant Name (e.g. Size)</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Stock</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {formData.variants.map((variant, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Input
                                                            placeholder="Small, Red, etc."
                                                            value={variant.options[0] || ''}
                                                            onChange={(e) => handleVariantChange(index, 'option', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={variant.price}
                                                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={variant.stock}
                                                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={variant.sku}
                                                            onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                            onClick={() => handleRemoveVariant(index)}
                                                        >
                                                            <Trash size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {formData.variants.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                                        No variants added. Click "Add Variant" to start.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Common Details (Unit, Barcode, etc) */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="relative">
                            <label className="text-sm font-medium text-slate-700">Unit</label>
                            <Input
                                name="unit"
                                placeholder="e.g. pc, kg, box"
                                value={formData.unit}
                                onChange={handleChange}
                                onFocus={() => setShowUnitSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowUnitSuggestions(false), 200)}
                                autoComplete="off"
                            />
                            {showUnitSuggestions && (
                                <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1 no-scrollbar">
                                    {(existingUnits || ['pc', 'kg']).filter(u => u.toLowerCase().includes(formData.unit.toLowerCase())).map(u => (
                                        <li
                                            key={u}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 hover:text-blue-700 transition-colors"
                                            onClick={() => setFormData(prev => ({ ...prev, unit: u }))}
                                        >
                                            {u}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Tax Rate (%)</label>
                            <Input
                                name="taxRate"
                                type="number"
                                placeholder="0"
                                value={formData.taxRate}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Barcode Section */}
                        <div className="space-y-2 col-span-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-slate-700">Barcode / SKU</label>
                                <label className="text-sm font-medium text-slate-700">Type</label>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Input
                                        name="barcode"
                                        placeholder="Scan or enter"
                                        value={formData.barcode}
                                        onChange={handleChange}
                                        autoComplete="off"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleBarcodeLookup();
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="ghost"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                        onClick={handleBarcodeLookup}
                                        disabled={!formData.barcode || isLookingUp}
                                        title="Lookup Product Details"
                                    >
                                        {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-slate-400" />}
                                    </Button>
                                </div>
                                <select
                                    name="barcodeType"
                                    value={formData.barcodeType}
                                    onChange={handleChange}
                                    className="w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="CODE128">CODE-128</option>
                                    <option value="EAN13">EAN-13</option>
                                    <option value="UPC">UPC-A</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Expiry Date</label>
                            <Input
                                name="expiryDate"
                                type="date"
                                value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex flex-col gap-3 border-t border-slate-100 bg-white z-10">
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Cancel <span className="ml-2 text-xs text-slate-400 font-normal">Esc</span>
                        </Button>
                        <Button variant="secondary" className="flex-1" onClick={() => handleSave(true)}>
                            Save & Add Another <span className="ml-2 text-xs text-blue-600/70 font-normal">Ctrl+S</span>
                        </Button>
                        <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" onClick={() => handleSave(false)}>
                            Save & Close <span className="ml-2 text-xs text-white/50 font-normal">Enter</span>
                        </Button>
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default ProductDrawer;
