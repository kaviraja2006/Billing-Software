import React, { createContext, useState, useContext, useEffect } from 'react';
import services from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const { user, isLoading: authLoading } = useAuth();
    const defaultSettings = {
        tax: {
            gstEnabled: true,
            gstin: '',
            state: '',
            stateCode: '',
            registrationType: 'Regular', // Regular, Composition
            priceMode: 'Exclusive', // Inclusive, Exclusive
            automaticTax: true, // Auto IGST vs CGST
            slabs: [
                { id: 'gst-0', name: 'GST 0%', rate: 0, active: true },
                { id: 'gst-5', name: 'GST 5%', rate: 5, active: true },
                { id: 'gst-12', name: 'GST 12%', rate: 12, active: true },
                { id: 'gst-18', name: 'GST 18%', rate: 18, active: true },
                { id: 'gst-28', name: 'GST 28%', rate: 28, active: true },
            ]
        },
        invoice: {
            showTaxBreakup: true,
            showHsn: true,
            showB2bGstin: true,
            roundingType: 'Nearest' // Nearest, Up, Down
        },
        defaults: {
            hsnCode: ''
        },
        store: {
            name: 'My Awesome Supermarket',
            contact: '+1 234 567 890',
            address: '123 Market Street, Downtown',
            email: 'store@example.com',
            website: 'www.myawesomestore.com',
            footer: 'Thank you for shopping with us!',
            terms: true,
            logo: true
        }
    };

    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only fetch if user is authenticated and auth is not loading
        if (authLoading || !user) {
            setLoading(false);
            if (!user) {
                setSettings(defaultSettings);
            }
            return;
        }

        const fetchSettings = async () => {
            try {
                const response = await services.settings.getSettings();

                // Deep merge with defaults to ensure all fields exist (even if backend is partial)
                setSettings(prev => ({
                    ...prev,
                    ...response.data,
                    store: { ...prev.store, ...response.data.store },
                    tax: { ...prev.tax, ...response.data.tax },
                    invoice: { ...prev.invoice, ...response.data.invoice },
                    defaults: { ...prev.defaults, ...response.data.defaults }
                }));
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [user, authLoading]);

    const saveSettings = async (newSettings) => {
        try {
            await services.settings.updateSettings(newSettings);
        } catch (error) {
            console.error("Failed to save settings", error);
        }
    };

    const updateSettings = (section, data) => {
        setSettings(prev => {
            const next = {
                ...prev,
                [section]: {
                    ...prev[section],
                    ...data
                }
            };
            // Side effect should ideally be outside, but inside callback ensures we have latest 'prev'.
            // To be safer/cleaner, we'll call saveSettings with the 'next' value.
            // However, doing valid side-effects from event handlers is better.
            // Since we are inside a functional update, let's keep it but move execution out of the render loop if possible?
            // Actually, best to just fire-and-forget here or use useEffect.
            // BUT simpler fix: Just call saveSettings(next) here, it works in most cases, 
            // though technically impure. 
            // BETTER APPROACH:
            // Calculate next, set it, save it.
            // But we need 'prev'.

            // Let's stick to the pattern but ensure we log.
            saveSettings(next);
            console.log("Settings Updated (Context):", next);
            return next;
        });
    };

    const updateTaxSlab = (id, updates) => {
        setSettings(prev => {
            const next = {
                ...prev,
                tax: {
                    ...prev.tax,
                    slabs: prev.tax.slabs.map(slab =>
                        slab.id === id ? { ...slab, ...updates } : slab
                    )
                }
            };
            saveSettings(next);
            return next;
        });
    };

    const addTaxSlab = (newSlab) => {
        setSettings(prev => {
            const next = {
                ...prev,
                tax: {
                    ...prev.tax,
                    slabs: [...prev.tax.slabs, { ...newSlab, id: `gst-${Date.now()}` }]
                }
            };
            saveSettings(next);
            return next;
        });
    };

    const resetSlabs = () => {
        setSettings(prev => {
            const next = {
                ...prev,
                tax: {
                    ...prev.tax,
                    slabs: defaultSettings.tax.slabs
                }
            };
            saveSettings(next);
            return next;
        });
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading settings...</div>;
    }

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSettings,
            updateTaxSlab,
            addTaxSlab,
            resetSlabs
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
