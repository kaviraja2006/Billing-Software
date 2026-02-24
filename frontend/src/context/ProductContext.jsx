import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import services from '../services/api';
import { useAuth } from './AuthContext';

export const ProductContext = createContext();

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, isLoading: authLoading } = useAuth();

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await services.products.getAll();
            setProducts((response.data || []).filter(Boolean));
        } catch (error) {
            console.error("Failed to fetch products", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch if user is authenticated and auth is not loading
        if (authLoading || !user) {
            setLoading(false);
            if (!user) {
                setProducts([]);
            }
            return;
        }

        fetchProducts();
    }, [user, authLoading]);

    const addProduct = useCallback(async (productData) => {
        try {
            // Ensure sku is present for backend compatibility (it requires unique sku)
            // Strip UI-only fields like 'hasVariants'
            const { hasVariants, ...rest } = productData;

            const payload = {
                ...rest,
                price: parseFloat(productData.price) || 0,
                stock: parseInt(productData.stock) || 0,
                sku: productData.barcode || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                expiryDate: productData.expiryDate || null
            };

            const response = await services.products.create(payload);
            const newProduct = response.data;
            setProducts(prev => [...prev, newProduct]);
            return newProduct;
        } catch (error) {
            console.error("Failed to add product", error);
            throw error;
        }
    }, []);

    const addManyProducts = useCallback(async (productsArray) => {
        const addedProducts = [];

        // Helper for safe number conversion
        const safeFloat = (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        const safeInt = (val) => {
            const num = parseInt(val, 10);
            return isNaN(num) ? 0 : num;
        };

        // Get current products directly from state
        const currentProducts = products;

        for (const rawP of productsArray) {
            // Normalize keys: trim and lowercase
            const p = {};
            Object.keys(rawP).forEach(key => {
                p[key.trim().toLowerCase()] = rawP[key];
            });

            const getVal = (keys) => {
                for (let k of keys) {
                    if (p[k] !== undefined) return p[k];
                }
                return undefined;
            };

            const nameVal = getVal(['name', 'product name', 'productname', 'item', 'item name', 'title', 'description', 'desc', 'particulars', 'model', 'product description']);
            const name = (nameVal && nameVal.toString().trim()) ? nameVal.toString().trim() : 'Imported Product';

            // Check for duplicates
            const barcodeVal = getVal(['barcode', 'code', 'upc', 'ean', 'sku']);
            const barcode = barcodeVal || `GEN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Duplicate Check: Check against current products
            const isDuplicate = currentProducts.some(existing => {
                const sName = String(name).toLowerCase();
                const sBarcode = String(barcode).toLowerCase();

                if (barcodeVal && existing.barcode && String(existing.barcode).toLowerCase() === sBarcode) return true;
                if (!barcodeVal && existing.name && String(existing.name).toLowerCase() === sName) return true;

                return false;
            });

            if (isDuplicate) {
                console.log("Skipping duplicate:", name, barcode);
                continue;
            }

            const price = safeFloat(getVal(['price', 'mrp', 'rate', 'cost', 'amount', 'selling price', 'sp', 'unit price']));

            const productData = {
                name: name,
                category: getVal(['category', 'group', 'type']) || 'Uncategorized',
                brand: getVal(['brand', 'company', 'make']) || '',
                price: price, // Selling Price
                stock: safeInt(getVal(['stock', 'current stock', 'qty', 'quantity'])),
                barcode: barcode,
                sku: barcode,
                unit: getVal(['unit', 'uom', 'measure']) || 'pc',
                description: getVal(['description', 'desc', 'details']) || '',
                minStock: safeInt(getVal(['min stock', 'minimum stock', 'alert', 'low stock', 'min. stock alert'])),
                costPrice: safeFloat(getVal(['cost', 'cost price', 'buying price', 'cp'])),
                taxRate: safeFloat(getVal(['tax', 'tax rate', 'gst', 'tax rate (%)']))
            };

            try {
                const response = await services.products.create(productData);
                addedProducts.push(response.data);
            } catch (err) {
                console.error("Failed to import item", name, err);
            }
        }
        setProducts(prev => [...prev, ...addedProducts]);
        return { added: addedProducts, skipped: productsArray.length - addedProducts.length };
    }, []); // No dependencies - stable callback

    const updateProduct = useCallback(async (id, updatedData) => {
        try {
            const { hasVariants, ...rest } = updatedData;
            const payload = {
                ...rest,
                price: parseFloat(updatedData.price) || 0,
                stock: parseInt(updatedData.stock) || 0,
                costPrice: parseFloat(updatedData.costPrice) || 0,
                taxRate: parseFloat(updatedData.taxRate) || 0,
                minStock: parseInt(updatedData.minStock) || 0,
                expiryDate: updatedData.expiryDate || null
            };
            const response = await services.products.update(id, payload);
            const updatedProduct = response.data;
            setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p).filter(Boolean));
            return updatedProduct;
        } catch (error) {
            console.error("Failed to update product", error);
            throw error;
        }
    }, []);

    const deleteProduct = useCallback(async (id) => {
        try {
            await services.products.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Failed to delete product", error);
            throw error;
        }
    }, []);

    const updateStock = useCallback(async (id, quantityChange) => {
        // Use functional update to access current product without dependency
        let product = null;
        setProducts(prev => {
            product = prev.find(p => p.id === id);
            return prev;
        });

        if (product) {
            const newStock = Math.max(0, product.stock + quantityChange);
            await updateProduct(id, { stock: newStock });
        }
    }, [updateProduct]); // Only depend on updateProduct which is stable

    const getProductByBarcode = useCallback((code) => {
        return products.find(p => p.barcode === code);
    }, [products]);

    const value = useMemo(() => ({
        products,
        addProduct,
        addManyProducts,
        updateProduct,
        deleteProduct,
        updateStock,
        getProductByBarcode,
        refreshProducts: fetchProducts,
        loading
    }), [
        products,
        addProduct,
        addManyProducts,
        updateProduct,
        deleteProduct,
        updateStock,
        getProductByBarcode,
        fetchProducts,
        loading
    ]);

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
