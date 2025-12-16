import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
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

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('app_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('app_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (section, data) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...data
            }
        }));
    };

    const updateTaxSlab = (id, updates) => {
        setSettings(prev => ({
            ...prev,
            tax: {
                ...prev.tax,
                slabs: prev.tax.slabs.map(slab =>
                    slab.id === id ? { ...slab, ...updates } : slab
                )
            }
        }));
    };

    const addTaxSlab = (newSlab) => {
        setSettings(prev => ({
            ...prev,
            tax: {
                ...prev.tax,
                slabs: [...prev.tax.slabs, { ...newSlab, id: `gst-${Date.now()}` }]
            }
        }));
    };

    const resetSlabs = () => {
        setSettings(prev => ({
            ...prev,
            tax: {
                ...prev.tax,
                slabs: defaultSettings.tax.slabs
            }
        }));
    };

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
