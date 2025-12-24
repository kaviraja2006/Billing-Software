import React, { createContext, useState, useContext, useEffect } from 'react';
import services from '../services/api';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext();

export const useExpenses = () => {
    const context = useContext(ExpenseContext);
    if (!context) {
        throw new Error('useExpenses must be used within a ExpenseProvider');
    }
    return context;
};

export const ExpenseProvider = ({ children }) => {
    const [expenses, setExpenses] = useState([]);
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        // Only fetch if user is authenticated and auth is not loading
        if (authLoading || !user) {
            if (!user) {
                setExpenses([]);
            }
            return;
        }

        const fetchExpenses = async () => {
            try {
                const response = await services.expenses.getAll();
                setExpenses(response.data);
            } catch (error) {
                console.error("Failed to fetch expenses", error);
                setExpenses([]);
            }
        };
        fetchExpenses();
    }, [user, authLoading]);

    const addExpense = async (expenseData) => {
        try {
            const response = await services.expenses.create({
                ...expenseData,
                amount: parseFloat(expenseData.amount) || 0
            });
            const newExpense = response.data;
            setExpenses(prev => [newExpense, ...prev]);
            return newExpense;
        } catch (error) {
            console.error("Failed to add expense", error);
            throw error;
        }
    };

    const deleteExpense = async (id) => {
        try {
            await services.expenses.delete(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Failed to delete expense", error);
            throw error;
        }
    };

    const stats = {
        totalExpenses: expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        count: expenses.length
    };

    return (
        <ExpenseContext.Provider value={{
            expenses,
            addExpense,
            deleteExpense,
            stats
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};
