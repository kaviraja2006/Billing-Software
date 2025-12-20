import React, { createContext, useState, useContext, useEffect } from 'react';
import services from '../services/api';

const CustomerContext = createContext();

export const useCustomers = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomers must be used within a CustomerProvider');
    }
    return context;
};

export const CustomerProvider = ({ children }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const response = await services.customers.getAll();
                setCustomers(response.data);
            } catch (error) {
                console.error("Failed to fetch customers", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const addCustomer = async (customerData) => {
        try {
            const response = await services.customers.create(customerData);
            const newCustomer = response.data;
            setCustomers(prev => [...prev, newCustomer]);
            return newCustomer;
        } catch (error) {
            console.error("Failed to add customer", error);
            throw error;
        }
    };

    const updateCustomer = async (id, updatedData) => {
        try {
            const response = await services.customers.update(id, updatedData);
            const updatedCustomer = response.data;
            setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
            return updatedCustomer;
        } catch (error) {
            console.error("Failed to update customer", error);
            throw error;
        }
    };

    const deleteCustomer = async (id) => {
        try {
            await services.customers.delete(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete customer", error);
            throw error;
        }
    };

    return (
        <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, loading }}>
            {children}
        </CustomerContext.Provider>
    );
};
