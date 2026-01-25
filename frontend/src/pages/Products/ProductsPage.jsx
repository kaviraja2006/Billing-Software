import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus, Download, Upload, MoreHorizontal, Edit, Trash, Filter, ChevronDown, Copy, Eye, MoreVertical, ListChecks, Check } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import ProductDrawer from './ProductDrawer';

import ProductStats from './components/ProductStats';
import ProductToolbar from './components/ProductToolbar';
import ProductInsights from './components/ProductInsights';
import { read, utils, writeFile } from 'xlsx';

const ProductsPage = () => {
    const toast = useToast();
    const { products, addProduct, addManyProducts, updateProduct, deleteProduct, loading } = useProducts();

    // UI State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // For Drawer (Edit)
    const [focusedProduct, setFocusedProduct] = useState(null);   // For Insights Panel
    const [isCategoryWizardOpen, setIsCategoryWizardOpen] = useState(false);
    const [viewMode, setViewMode] = useState('comfortable'); // 'compact' | 'comfortable'

    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: null,
        brand: null,
        status: 'all' // 'all', 'active', 'inactive', 'lowStock', 'outOfStock'
    });

    // Selection State
    const [selectedRows, setSelectedRows] = useState(new Set());

    // Extract Unique Categories & Brands (Memoized)
    const { uniqueCategories, uniqueBrands } = useMemo(() => {
        const categories = new Set();
        const brands = new Set();
        products.forEach(p => {
            categories.add(p.category || 'Uncategorized');
            if (p.brand) brands.add(p.brand);
        });
        return {
            uniqueCategories: [...categories].filter(Boolean).sort(),
            uniqueBrands: [...brands].sort()
        };
    }, [products]);

    // Filtering Logic
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // Search
            const matchesSearch =
                (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.barcode && p.barcode.toString().includes(searchTerm)) ||
                (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

            if (!matchesSearch) return false;

            // Category
            if (filters.category && p.category !== filters.category) return false;

            // Brand
            if (filters.brand && p.brand !== filters.brand) return false;

            // Status / Stock Filters
            if (filters.status === 'active' && !p.isActive) return false;
            if (filters.status === 'inactive' && p.isActive) return false;
            if (filters.status === 'lowStock' && (p.stock > (p.minStock || 10) || p.stock === 0)) return false;
            if (filters.status === 'outOfStock' && p.stock > 0) return false;

            return true;
        });
    }, [products, searchTerm, filters]);

    // Handlers
    const handleEdit = (product, e) => {
        e?.stopPropagation();
        setSelectedProduct(product);
        setIsDrawerOpen(true);
    };

    const handleAddNew = () => {
        setSelectedProduct(null);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
                if (focusedProduct?.id === id) setFocusedProduct(null);
            } catch (error) {
                toast.error('Failed to delete product');
            }
        }
    };

    const handleRowClick = (product) => {
        setFocusedProduct(product);
    };

    const handleSelectionChange = (id) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(new Set(filteredProducts.map(p => p.id)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Delete ${selectedRows.size} products?`)) {
            // Sequential delete for now - ideally backend supports bulk delete
            for (const id of selectedRows) {
                await deleteProduct(id);
            }
            setSelectedRows(new Set());
        }
    };

    const handleBulkStatusChange = async (isActive) => {
        // Sequential update
        for (const id of selectedRows) {
            const product = products.find(p => p.id === id);
            if (product) {
                await updateProduct(id, { ...product, isActive });
            }
        }
        setSelectedRows(new Set());
    };

    const handleBulkExport = () => {
        const selectedProducts = products.filter(p => selectedRows.has(p.id));
        const ws = utils.json_to_sheet(selectedProducts);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Selected Products");
        writeFile(wb, "selected_products.xlsx");
        setSelectedRows(new Set());
    };

    // Import/Export Logic
    const handleFileUpload = (e) => { /* ... Reusing existing logic ... */
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const ab = evt.target.result;
                const wb = read(ab, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = utils.sheet_to_json(ws);

                if (data.length > 0) {
                    if (window.confirm(`Found ${data.length} rows. Import them?`)) {
                        const added = await addManyProducts(data);
                        if (added.length > 0) {
                            toast.success(`Successfully imported ${added.length} products!`);
                        } else {
                            toast.info('Import finished but no products were added.');
                        }
                    }
                }
            } catch (error) {
                console.error("Import Error:", error);
                toast.error('Error processing file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null;
    };

    const handleSaveProduct = async (productData) => {
        try {
            if (selectedProduct) {
                await updateProduct(selectedProduct.id, productData);
            } else {
                await addProduct(productData);
            }
            setIsDrawerOpen(false);
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to save product';
            toast.error(msg);
            throw error; // Re-throw so ProductDrawer knows to stay open
        }
    };

    // Add Product Split Button Logic
    const [showAddMenu, setShowAddMenu] = useState(false);

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (isSelectionMode) {
            setSelectedRows(new Set()); // Clear selection when exiting mode
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Header & Stats */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Products & Inventory</h1>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                {/* Import Button */}
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        title="Import Products from Excel"
                                    />
                                    <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-sm w-full sm:w-auto">
                                        <Upload className="mr-2 h-4 w-4" /> Import
                                    </Button>
                                </div>

                                {/* Selection/Export Toggle & Trigger */}
                                <Button
                                    variant={isSelectionMode ? "secondary" : "outline"}
                                    onClick={() => {
                                        if (isSelectionMode && selectedRows.size > 0) {
                                            handleBulkExport(); // Export if items selected
                                        } else {
                                            handleToggleSelectionMode(); // Toggle mode otherwise
                                        }
                                    }}
                                    className={`shadow-sm transition-all w-full sm:w-auto ${isSelectionMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                >
                                    {isSelectionMode ? (selectedRows.size > 0 ? <Download className="mr-2 h-4 w-4" /> : <ListChecks className="mr-2 h-4 w-4" />) : <ListChecks className="mr-2 h-4 w-4" />}
                                    <span className="hidden sm:inline">{isSelectionMode ? (selectedRows.size > 0 ? `Export (${selectedRows.size})` : 'Done Selecting') : 'Select / Export'}</span>
                                    <span className="sm:hidden">{isSelectionMode ? (selectedRows.size > 0 ? `Export (${selectedRows.size})` : 'Done') : 'Select'}</span>
                                </Button>

                                {/* Professional Add Product Button */}
                                <Button
                                    onClick={handleAddNew}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 w-full sm:w-auto"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Product
                                </Button>
                            </div>
                        </div>

                        <ProductStats
                            products={products}
                            currentFilter={filters.status}
                            onFilterChange={(status) => setFilters(prev => ({ ...prev, status }))}
                        />
                    </div>

                    {/* Toolbar */}
                    <ProductToolbar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        categoryFilter={filters.category}
                        onCategoryChange={(c) => setFilters(prev => ({ ...prev, category: c }))}
                        brandFilter={filters.brand}
                        onBrandChange={(b) => setFilters(prev => ({ ...prev, brand: b }))}
                        categories={uniqueCategories}
                        brands={uniqueBrands}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />

                    {/* Table Area */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        {isSelectionMode && <TableHead className="w-[40px]"></TableHead>}
                                        <TableHead className="min-w-[250px]">Product</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={isSelectionMode ? 9 : 8} className="h-32 text-center text-slate-500">
                                                Loading inventory...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isSelectionMode ? 9 : 8} className="h-32 text-center text-slate-500">
                                                No products found matching your filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map((product) => {
                                            const isSelected = selectedRows.has(product.id);
                                            const isFocused = focusedProduct?.id === product.id;
                                            const stockStatus = product.stock === 0 ? 'Out of Stock' : product.stock <= (product.minStock ?? 10) ? 'Low Stock' : 'In Stock';
                                            const py = viewMode === 'compact' ? 'py-2' : 'py-4';

                                            return (
                                                <TableRow
                                                    key={product.id}
                                                    className={`
                                                        cursor-pointer transition-colors
                                                        ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                                                        ${isFocused ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}
                                                    `}
                                                    onClick={() => handleRowClick(product)}
                                                >
                                                    {isSelectionMode && (
                                                        <TableCell className={py}>
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-slate-300"
                                                                checked={isSelected}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={() => handleSelectionChange(product.id)}
                                                            />
                                                        </TableCell>
                                                    )}
                                                    <TableCell className={py}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900">{product.name}</span>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                                <span className="font-mono bg-slate-100 px-1 rounded">{product.sku || 'NO-SKU'}</span>
                                                                {product.barcode && <span>• {product.barcode}</span>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <Badge variant="outline" className="font-normal">{product.category || 'Uncategorized'}</Badge>
                                                    </TableCell>
                                                    <TableCell className={py}>{product.brand || '-'}</TableCell>
                                                    <TableCell className={py}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">₹{product.price.toFixed(2)}</span>
                                                            {product.costPrice && viewMode === 'comfortable' && (
                                                                <span className="text-xs text-slate-400">Cost: ₹{product.costPrice}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-medium ${product.stock === 0 ? 'text-rose-600' : ''}`}>
                                                                {product.stock}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        {product.unit || '-'}
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`
                                                                ${product.isActive === false ? 'bg-slate-100 text-slate-500' :
                                                                    stockStatus === 'Out of Stock' ? 'bg-rose-100 text-rose-700' :
                                                                        stockStatus === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-green-100 text-green-700'}
                                                                border-transparent
                                                            `}
                                                        >
                                                            {product.isActive === false ? 'Inactive' : stockStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                                onClick={(e) => handleEdit(product, e)}
                                                                title="Edit Product"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={(e) => handleDelete(product.id, e)}
                                                                title="Delete Product"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

            </div>

            {/* Right Panel: Insights */}
            {focusedProduct && (
                <ProductInsights
                    product={focusedProduct}
                    onClose={() => setFocusedProduct(null)}
                />
            )}

            {/* Drawers & Modals */}
            <ProductDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                product={selectedProduct}
                onSave={handleSaveProduct}
                existingUnits={[...new Set([...products.map(p => p.unit), 'pc', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'meter', 'dozen'])].filter(Boolean).sort()}
                existingCategories={uniqueCategories}
                existingBrands={uniqueBrands}
            />


        </div>
    );
};

export default ProductsPage;
