import React, { createContext, useState, useContext, useEffect } from 'react';

const CustomerContext = createContext();

export const useCustomers = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomers must be used within a CustomerProvider');
    }
    return context;
};

export const CustomerProvider = ({ children }) => {
    // Shared Mock Data
    const defaultCustomers = [
        { id: 1, name: 'Alice Johnson', phone: '+1 555-0123', email: 'alice@example.com', address: '123 Main St, New York, NY', totalVisits: 12, totalSpent: 1240.50, due: 0 },
        { id: 2, name: 'Bob Smith', phone: '+1 555-0124', email: 'bob@example.com', address: '456 Oak Ave, Los Angeles, CA', totalVisits: 5, totalSpent: 450.00, due: 120.00 },
        { id: 3, name: 'Charlie Brown', phone: '+1 555-0125', email: 'charlie@example.com', address: '789 Pine Ln, Chicago, IL', totalVisits: 2, totalSpent: 89.50, due: 0 },
        { id: 4, name: 'David Lee', phone: '+1 555-0126', email: 'david@example.com', address: '321 Elm St, Miami, FL', totalVisits: 1, totalSpent: 25.00, due: 0 },
        { id: 5, name: 'Eva Green', phone: '+1 555-0127', email: 'eva@example.com', address: '654 Maple Dr, Seattle, WA', totalVisits: 20, totalSpent: 3500.00, due: 0 },
        { id: 6, name: 'Walk-in Customer', phone: '-', email: '-', address: '-', totalVisits: 0, totalSpent: 0, due: 0 },
    ];

    const [customers, setCustomers] = useState(() => {
        const saved = localStorage.getItem('customers');
        return saved ? JSON.parse(saved) : defaultCustomers;
    });

    useEffect(() => {
        localStorage.setItem('customers', JSON.stringify(customers));
    }, [customers]);

    const addCustomer = (customerData) => {
        const newCustomer = {
            id: customers.length + 1, // Simple ID generation
            ...customerData,
            totalVisits: 0,
            totalSpent: 0,
            due: 0
        };
        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    };

    const updateCustomer = (id, updatedData) => {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
    };

    return (
        <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer }}>
            {children}
        </CustomerContext.Provider>
    );
};
