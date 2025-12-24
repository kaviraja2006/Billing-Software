import React, { createContext, useState, useContext, useEffect } from 'react';
import services from '../services/api';
import { useAuth } from './AuthContext';

const TransactionContext = createContext();

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
};

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [heldBills, setHeldBills] = useState(() => {
        const saved = localStorage.getItem('heldBills');
        return saved ? JSON.parse(saved) : [];
    });
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        // Only fetch if user is authenticated and auth is not loading
        if (authLoading || !user) {
            if (!user) {
                setTransactions([]);
            }
            return;
        }

        const fetchTransactions = async () => {
            try {
                const response = await services.invoices.getAll();
                setTransactions(response.data);
            } catch (error) {
                console.error("Failed to fetch transactions", error);
                setTransactions([]);
            }
        };
        fetchTransactions();
    }, [user, authLoading]);

    useEffect(() => {
        localStorage.setItem('heldBills', JSON.stringify(heldBills));
    }, [heldBills]);

    const addTransaction = async (transactionData) => {
        try {
            const response = await services.billing.createInvoice(transactionData);
            const newTransaction = response.data;
            setTransactions(prev => [newTransaction, ...prev]);
            return newTransaction;
        } catch (error) {
            console.error("Failed to add transaction", error);
            throw error;
        }
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

    const deleteTransaction = async (id) => {
        try {
            await services.invoices.delete(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Failed to delete transaction", error);
            throw error;
        }
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            addTransaction,
            heldBills,
            holdBill,
            deleteHeldBill,
            deleteTransaction
        }}>
            {children}
        </TransactionContext.Provider>
    );
};
