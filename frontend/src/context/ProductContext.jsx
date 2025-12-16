import React, { createContext, useState, useContext, useEffect } from 'react';

export const ProductContext = createContext();

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

export const ProductProvider = ({ children }) => {
    // Shared Mock Data with more fields for inventory
    const defaultProducts = [
        { id: 101, name: 'Wireless Mouse', category: 'Electronics', price: 25.50, stock: 45, barcode: '8901234567890', description: 'Ergonomic wireless mouse' },
        { id: 102, name: 'Mechanical Keyboard', category: 'Electronics', price: 85.00, stock: 12, barcode: '8901234567891', description: 'RGB mechanical keyboard' },
        { id: 103, name: 'USB-C Cable (2m)', category: 'Accessories', price: 12.00, stock: 100, barcode: '8901234567892', description: 'Fast charging cable' },
        { id: 104, name: 'Monitor Stand', category: 'Furniture', price: 45.00, stock: 8, barcode: '8901234567893', description: 'Adjustable monitor stand' },
        { id: 105, name: 'Webcam HD', category: 'Electronics', price: 55.00, stock: 20, barcode: '8901234567894', description: '1080p Web Camera' },
    ];

    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('products');
        return saved ? JSON.parse(saved) : defaultProducts;
    });

    useEffect(() => {
        localStorage.setItem('products', JSON.stringify(products));
    }, [products]);

    const addProduct = (productData) => {
        const newProduct = {
            id: Date.now(),
            ...productData,
            price: parseFloat(productData.price) || 0,
            stock: parseInt(productData.stock) || 0
        };
        setProducts(prev => [...prev, newProduct]);
        return newProduct;
    };

    const addManyProducts = (productsArray) => {
        console.log("Processing import for:", productsArray.length, "items");
        const newProducts = productsArray.map((rawP, index) => {
            // Normalize keys: trim and lowercase
            const p = {};
            Object.keys(rawP).forEach(key => {
                p[key.trim().toLowerCase()] = rawP[key];
            });

            console.log(`Row ${index} normalized keys:`, Object.keys(p));

            // Helper to get value from normalized keys
            const getVal = (keys) => {
                for (let k of keys) {
                    if (p[k] !== undefined) return p[k];
                }
                return undefined;
            };

            const name = getVal(['name', 'product name', 'productname', 'item', 'item name', 'title']) || 'Imported Product';
            const price = parseFloat(getVal(['price', 'mrp', 'rate', 'cost', 'amount', 'selling price', 'sp', 'unit price'])) || 0;

            console.log(`Row ${index} mapped: Name=${name}, Price=${price}`);

            return {
                id: Date.now() + Math.floor(Math.random() * 10000) + index,
                // Now we only need to check lowercased keys
                name: name,
                category: getVal(['category', 'group', 'type']) || 'Uncategorized',
                brand: getVal(['brand', 'company', 'make']) || '',
                price: price,
                stock: parseInt(getVal(['stock', 'qty', 'quantity', 'count', 'inventory', 'balance', 'units'])) || 0,
                barcode: getVal(['barcode', 'code', 'upc', 'ean', 'sku']) || `GEN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                description: getVal(['description', 'desc', 'details', 'specification']) || ''
            };
        });

        console.log("Final Products to Add:", newProducts);
        setProducts(prev => [...newProducts, ...prev]);
        return newProducts;
    };

    const updateProduct = (id, updatedData) => {
        setProducts(prev => prev.map(p => p.id === id ? {
            ...p,
            ...updatedData,
            price: parseFloat(updatedData.price) || p.price,
            stock: parseInt(updatedData.stock) || p.stock
        } : p));
    };

    const deleteProduct = (id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const updateStock = (id, quantityChange) => {
        setProducts(prev => prev.map(p => {
            if (p.id === id) {
                const newStock = Math.max(0, p.stock + quantityChange); // Prevent negative stock
                return { ...p, stock: newStock };
            }
            return p;
        }));
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
            getProductByBarcode
        }}>
            {children}
        </ProductContext.Provider>
    );
};
