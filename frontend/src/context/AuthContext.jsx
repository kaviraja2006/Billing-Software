import React, { createContext, useState, useContext, useEffect } from 'react';
import services from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check if we have a token and try to get current user
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await services.auth.getCurrentUser();
                    setUser(response.data);
                } else {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                }
            } catch (error) {
                console.error("Auth init error:", error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await services.auth.login({ email, password });
            const { user, token } = response.data;

            setUser(user);
            // Storage is handled in mock service for simplicity, but we can double check
            if (!localStorage.getItem('token')) localStorage.setItem('token', token);
            if (!localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(user));

            return user;
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const logout = async () => {
        try {
            await services.auth.logout();
            setUser(null);
            // Redirect is handled in component or Router, but we can force it here if strictly needed
            // window.location.href = '/login'; 
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
