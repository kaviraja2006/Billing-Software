import React, { createContext, useState, useContext, useEffect } from 'react';
import services from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

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
    const { user, isLoading: authLoading } = useAuth();
    const toast = useToast();

    useEffect(() => {
        // Only fetch if user is authenticated and auth is not loading
        if (authLoading || !user) {
            setLoading(false);
            if (!user) {
                setCustomers([]);
            }
            return;
        }

        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const response = await services.customers.getAll();
                setCustomers(response.data);
            } catch (error) {
                console.error("Failed to fetch customers", error);
                toast.error("Failed to load customers");
                setCustomers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, [user, authLoading, toast]);

    const addCustomer = async (customerData) => {
        try {
            const response = await services.customers.create(customerData);
            const newCustomer = response.data;
            setCustomers(prev => [...prev, newCustomer]);
            toast.success("Customer added successfully");
            return newCustomer;
        } catch (error) {
            console.error("Failed to add customer", error);
            const message = error.response?.data?.message || "Failed to add customer";
            toast.error(message);
            throw error;
        }
    };

    const updateCustomer = async (id, updatedData) => {
        try {
            const response = await services.customers.update(id, updatedData);
            const updatedCustomer = response.data;
            setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
            toast.success("Customer updated successfully");
            return updatedCustomer;
        } catch (error) {
            console.error("Failed to update customer", error);
            const message = error.response?.data?.message || "Failed to update customer";
            toast.error(message);
            throw error;
        }
    };

    const deleteCustomer = async (id) => {
        try {
            await services.customers.delete(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
            toast.success("Customer deleted successfully");
        } catch (error) {
            console.error("Failed to delete customer", error);
            const message = error.response?.data?.message || "Failed to delete customer";
            toast.error(message);
            throw error;
        }
    };

    return (
        <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, loading }}>
            {children}
        </CustomerContext.Provider>
    );
};
