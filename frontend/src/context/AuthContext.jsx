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
                    // No token means no user
                    setUser(null);
                    localStorage.removeItem('user'); // Clean up potential stale data
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
            // Validate inputs before sending
            if (!email || !email.trim()) {
                throw new Error('Email is required');
            }
            if (!password) {
                throw new Error('Password is required');
            }

            const response = await services.auth.login({ email: email.trim(), password });
            const { user, token } = response.data;
            setUser(user);
            // Store token and user in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (error) {
            // Extract error message from various possible formats
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            throw new Error(errorMessage);
        }
    };

    const register = async (name, email, password, role = 'employee') => {
        try {
            // Validate inputs before sending
            if (!name || !name.trim()) {
                throw new Error('Name is required');
            }
            if (!email || !email.trim()) {
                throw new Error('Email is required');
            }
            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const response = await services.auth.register({
                name: name.trim(),
                email: email.trim(),
                password,
                role
            });
            const { user, token } = response.data;
            setUser(user);
            // Store token and user in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (error) {
            // Extract error message from various possible formats
            const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
            throw new Error(errorMessage);
        }
    };

    const logout = async () => {
        try {
            await services.auth.logout();
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            // Always clear user state and localStorage, even if API call fails
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login page
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
