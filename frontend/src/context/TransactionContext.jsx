import React, { createContext, useState, useContext, useEffect } from 'react';

const TransactionContext = createContext();

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
};

export const TransactionProvider = ({ children }) => {
    // Mock Data
    const defaultTransactions = [
        {
            id: '#INV-001', customer: 'Alice Johnson', amount: '$45.00', status: 'Completed', method: 'Card', date: '2023-10-25',
            items: [{ name: 'Milk', quantity: 2, price: 5.00 }, { name: 'Bread', quantity: 1, price: 3.50 }, { name: 'Eggs', quantity: 1, price: 4.50 }]
        },
        {
            id: '#INV-002', customer: 'Bob Smith', amount: '$120.50', status: 'Pending', method: 'UPI', date: '2023-10-25',
            items: [{ name: 'Rice 5kg', quantity: 1, price: 40.00 }, { name: 'Oil 1L', quantity: 2, price: 15.00 }, { name: 'Spices', quantity: 5, price: 5.50 }]
        },
        {
            id: '#INV-003', customer: 'Charlie Brown', amount: '$25.00', status: 'Completed', method: 'Cash', date: '2023-10-24',
            items: [{ name: 'Snacks', quantity: 5, price: 5.00 }]
        },
        {
            id: '#INV-004', customer: 'Diana Ross', amount: '$89.99', status: 'Refunded', method: 'Card', date: '2023-10-24',
            items: [{ name: 'Cosmetics', quantity: 2, price: 45.00 }]
        },
        {
            id: '#INV-005', customer: 'Edward Norton', amount: '$210.00', status: 'Completed', method: 'UPI', date: '2023-10-23',
            items: [{ name: 'Shirt', quantity: 2, price: 50.00 }, { name: 'Jeans', quantity: 1, price: 80.00 }, { name: 'Socks', quantity: 3, price: 10.00 }]
        },
    ];

    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('transactions');
        return saved ? JSON.parse(saved) : defaultTransactions;
    });

    const [heldBills, setHeldBills] = useState(() => {
        const saved = localStorage.getItem('heldBills');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('heldBills', JSON.stringify(heldBills));
    }, [heldBills]);

    const addTransaction = (transactionData) => {
        const newTransaction = {
            id: `#INV-${1000 + transactions.length + 1}`,
            date: new Date().toISOString().split('T')[0],
            status: 'Completed',
            ...transactionData
        };
        // Add to beginning of list
        setTransactions(prev => [newTransaction, ...prev]);
        return newTransaction;
    };

    const holdBill = (billData) => {
        const heldBill = {
            id: `HOLD-${Date.now()}`,
            savedAt: new Date().toLocaleString(),
            ...billData
        };
        setHeldBills(prev => [heldBill, ...prev]);
        return heldBill;
    };

    const deleteHeldBill = (id) => {
        setHeldBills(prev => prev.filter(bill => bill.id !== id));
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            addTransaction,
            heldBills,
            holdBill,
            deleteHeldBill
        }}>
            {children}
        </TransactionContext.Provider>
    );
};
