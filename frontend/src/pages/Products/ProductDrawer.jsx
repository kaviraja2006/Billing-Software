import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const ProductDrawer = ({ isOpen, onClose, product, onSave }) => {
    // Determine title based on whether we are editing or creating
    const title = product ? 'Edit Product' : 'Add New Product';

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        brand: '',
        price: '',
        stock: '',
        barcode: '',
        taxRate: 0,
        costPrice: '',
        minStock: 10,
        unit: 'pc'
    });

    // Populate form on edit
    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                name: product.name || '',
                category: product.category || '',
                brand: product.brand || '',
                price: product.price || '',
                stock: product.stock || '',
                barcode: product.barcode || '',
                taxRate: product.taxRate || 0,
                costPrice: product.costPrice || '',
                minStock: product.minStock || 10,
                unit: product.unit || 'pc'
            });
        } else if (!product && isOpen) {
            setFormData({
                name: '',
                category: '',
                brand: '',
                price: '',
                stock: '',
                barcode: '',
                taxRate: 0,
                costPrice: '',
                minStock: 10,
                unit: 'pc'
            });
        }
    }, [product, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.name || !formData.price || !formData.stock) {
            alert('Name, Price, and Stock are required.');
            return;
        }
        onSave(formData);
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={title} width="max-w-xl">
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Product Name</label>
                        <Input
                            name="name"
                            placeholder="e.g. Premium Cotton Shirt"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Category</label>
                            <Input
                                name="category"
                                placeholder="Select Category"
                                value={formData.category}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Brand</label>
                            <Input
                                name="brand"
                                placeholder="Brand Name"
                                value={formData.brand}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Unit</label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="pc">Piece (pc)</option>
                                <option value="kg">Kilogram (kg)</option>
                                <option value="g">Gram (g)</option>
                                <option value="l">Litre (l)</option>
                                <option value="ml">Millilitre (ml)</option>
                                <option value="pack">Pack</option>
                                <option value="box">Box</option>
                                <option value="dozen">Dozen</option>
                                <option value="meter">Meter</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Barcode / SKU</label>
                            <Input
                                name="barcode"
                                placeholder="Scan or enter barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Selling Price</label>
                            <Input
                                name="price"
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Cost Price</label>
                            <Input
                                name="costPrice"
                                type="number"
                                placeholder="0.00"
                                value={formData.costPrice}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-4">
                        <h4 className="font-semibold text-sm text-slate-900 mb-4">Inventory Settings</h4>
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
                                <Input
                                    name="minStock"
                                    type="number"
                                    placeholder="10"
                                    value={formData.minStock}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex gap-3 border-t border-slate-100 mt-auto">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1" variant="primary" onClick={handleSave}>
                        {product ? 'Update Product' : 'Save Product'}
                    </Button>
                </div>
            </div>
        </Drawer>
    );
};

export default ProductDrawer;
