import React, { createContext, useState, useContext, useEffect } from 'react';
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

    useEffect(() => {
        // Only fetch if user is authenticated and auth is not loading
        if (authLoading || !user) {
            setLoading(false);
            if (!user) {
                setProducts([]);
            }
            return;
        }

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await services.products.getAll();
                setProducts(response.data);
            } catch (error) {
                console.error("Failed to fetch products", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [user, authLoading]);

    const addProduct = async (productData) => {
        try {
            // Ensure sku is present for backend compatibility (it requires unique sku)
            const payload = {
                ...productData,
                price: parseFloat(productData.price) || 0,
                stock: parseInt(productData.stock) || 0,
                sku: productData.barcode || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            };

            const response = await services.products.create(payload);
            const newProduct = response.data;
            setProducts(prev => [...prev, newProduct]);
            return newProduct;
        } catch (error) {
            console.error("Failed to add product", error);
            throw error;
        }
    };

    const addManyProducts = async (productsArray) => {
        const addedProducts = [];
        // Sequential upload to mock API
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

            const name = getVal(['name', 'product name', 'productname', 'item', 'item name', 'title']) || 'Imported Product';
            const price = parseFloat(getVal(['price', 'mrp', 'rate', 'cost', 'amount', 'selling price', 'sp', 'unit price'])) || 0;

            const barcode = getVal(['barcode', 'code', 'upc', 'ean', 'sku']) || `GEN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const productData = {
                name: name,
                category: getVal(['category', 'group', 'type']) || 'Uncategorized',
                brand: getVal(['brand', 'company', 'make']) || '',
                price: price,
                stock: parseInt(getVal(['stock', 'qty', 'quantity', 'count', 'inventory', 'balance', 'units'])) || 0,
                barcode: barcode,
                sku: barcode,
                description: getVal(['description', 'desc', 'details', 'specification']) || ''
            };

            try {
                const response = await services.products.create(productData);
                addedProducts.push(response.data);
            } catch (err) {
                console.error("Failed to import item", name, err);
            }
        }
        setProducts(prev => [...prev, ...addedProducts]);
        return addedProducts;
    };

    const updateProduct = async (id, updatedData) => {
        try {
            const response = await services.products.update(id, updatedData);
            const updatedProduct = response.data;
            setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
            return updatedProduct;
        } catch (error) {
            console.error("Failed to update product", error);
            throw error;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await services.products.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Failed to delete product", error);
            throw error;
        }
    };

    const updateStock = async (id, quantityChange) => {
        // This is tricky as we need to know current stock to update it properly via API if API is "update" style (replace).
        // Better to fetch fresh, update, then save. Or assume local state is consistent.
        // For mock, let's assume local state is close enough or fetch first.
        const product = products.find(p => p.id === id);
        if (product) {
            const newStock = Math.max(0, product.stock + quantityChange);
            await updateProduct(id, { stock: newStock });
        }
    };

    const getProductByBarcode = (code) => {
        return products.find(p => p.barcode === code);
    };

    return (
        <ProductContext.Provider value={{
            products,
            addProduct,
            addManyProducts,
            updateProduct,
            deleteProduct,
            updateStock,
            getProductByBarcode,
            loading
        }}>
            {children}
        </ProductContext.Provider>
    );
};
