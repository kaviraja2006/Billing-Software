import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus, Download, Upload, MoreHorizontal, Edit, Trash, Filter } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import ProductDrawer from './ProductDrawer';
import CategoryWizard from './CategoryWizard';

import { read, utils, writeFile } from 'xlsx';

const ProductsPage = () => {
    const { products, addProduct, addManyProducts, updateProduct, deleteProduct, loading } = useProducts();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Category Filter State
    const [isCategoryWizardOpen, setIsCategoryWizardOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Extract Unique Categories
    const uniqueCategories = React.useMemo(() => {
        return [...new Set(products.map(p => p.category || 'Uncategorized'))].filter(Boolean).sort();
    }, [products]);

    const filteredProducts = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.barcode && p.barcode.toString().includes(searchTerm))
    );

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setIsDrawerOpen(true);
    };

    const handleAddNew = () => {
        setSelectedProduct(null);
        setIsDrawerOpen(true);
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
            alert('Failed to save product');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
            } catch (error) {
                alert('Failed to delete product');
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const ab = evt.target.result;
                const wb = read(ab, { type: 'array' }); // Explicit type
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = utils.sheet_to_json(ws);

                console.log("Import Data Preview:", data);

                if (data.length > 0) {
                    // Check first row keys for debugging context if needed
                    const keys = Object.keys(data[0]).join(", ");

                    if (window.confirm(`Found ${data.length} rows. Columns detected: [${keys}]. Import them?`)) {
                        const added = await addManyProducts(data);
                        setSearchTerm(''); // Clear filter to show new items
                        if (added.length > 0) {
                            const sample = added[0];
                            alert(`Successfully imported ${added.length} products!\n\nCheck the top of your list.\n\nFirst item imported:\nName: ${sample.name}\nPrice: ${sample.price}\nStock: ${sample.stock}`);
                        } else {
                            alert('Import finished but no products were added (check logs).');
                        }
                    }
                } else {
                    alert('File appears to be empty or could not be parsed.');
                }
            } catch (error) {
                console.error("Import Error:", error);
                alert('Error processing file: ' + error.message);
            }
        };
        reader.onerror = () => {
            alert('Error reading the file.');
        };
        reader.readAsArrayBuffer(file);

        // Reset input so same file can be selected again if needed
        e.target.value = null;
    };

    const handleExport = () => {
        const ws = utils.json_to_sheet(products);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Products");
        writeFile(wb, "products_inventory.xlsx");
    };

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="p-10 text-center text-slate-500">Loading products...</div>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-slate-900">Products & Inventory</h1>
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
                            </div>
                            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
                            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </div>
                    </div>

                    {/* Filters Area */}
                    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search by name, barcode, category..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Filter className="mr-2 h-4 w-4" /> Category
                            </Button>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Filter className="mr-2 h-4 w-4" /> Stock Status
                            </Button>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => {
                                    const stockStatus = product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : 'In Stock';

                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium text-slate-900">
                                                {product.name}
                                                {product.barcode && <div className="text-xs text-slate-400">{product.barcode}</div>}
                                            </TableCell>
                                            <TableCell>{product.category || '-'}</TableCell>
                                            <TableCell>{product.brand || '-'}</TableCell>
                                            <TableCell>${product.price.toFixed(2)}</TableCell>
                                            <TableCell>{product.stock}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={stockStatus === 'In Stock' ? 'success' : stockStatus === 'Low Stock' ? 'warning' : 'destructive'}
                                                    className="bg-opacity-15 text-opacity-100"
                                                >
                                                    {stockStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEdit(product)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <ProductDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        product={selectedProduct}
                        onSave={handleSaveProduct}
                    />
                </>
            )}
        </div>
    );
};

export default ProductsPage;
