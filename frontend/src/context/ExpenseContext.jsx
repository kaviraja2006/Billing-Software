import React, { createContext, useState, useContext, useEffect } from 'react';

const ExpenseContext = createContext();

export const useExpenses = () => {
    const context = useContext(ExpenseContext);
    if (!context) {
        throw new Error('useExpenses must be used within a ExpenseProvider');
    }
    return context;
};

export const ExpenseProvider = ({ children }) => {
    const defaultExpenses = [
        { id: 1, title: 'Store Rent - Oct', category: 'Rent', amount: 1200.00, date: '2023-10-01', notes: 'Monthly rent payment' },
        { id: 2, title: 'Electricity Bill', category: 'Utilities', amount: 145.50, date: '2023-10-05', notes: 'Sept cycle' },
        { id: 3, title: 'Internet Service', category: 'Utilities', amount: 89.99, date: '2023-10-05', notes: 'Fiber connection' },
        { id: 4, title: 'Office Supplies', category: 'Supplies', amount: 45.00, date: '2023-10-10', notes: 'Paper, pens, staples' },
        { id: 5, title: 'Staff Lunch', category: 'Food', amount: 120.00, date: '2023-10-12', notes: 'Team meeting lunch' },
    ];

    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('expenses');
        return saved ? JSON.parse(saved) : defaultExpenses;
    });

    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }, [expenses]);

    const addExpense = (expenseData) => {
        const newExpense = {
            id: Date.now(),
            ...expenseData,
            amount: parseFloat(expenseData.amount) || 0
        };
        setExpenses(prev => [newExpense, ...prev]);
        return newExpense;
    };

    const deleteExpense = (id) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
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
