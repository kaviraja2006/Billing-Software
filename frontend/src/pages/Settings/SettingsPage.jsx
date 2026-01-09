import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ChevronDown, ChevronUp, Store, Receipt, Calculator, Printer, Users, Plus, RotateCcw } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../lib/utils';

const SettingsPage = () => {
    const { settings, updateSettings, updateTaxSlab, addTaxSlab, resetSlabs } = useSettings();
    const [openSection, setOpenSection] = useState('tax'); // Default open tax for now

    const toggleSection = (id) => {
        setOpenSection(openSection === id ? null : id);
    };

    const handleTaxChange = (field, value) => {
        updateSettings('tax', { [field]: value });
    };

    const handleInvoiceChange = (field, value) => {
        updateSettings('invoice', { [field]: value });
    };

    const handleStoreChange = (field, value) => {
        updateSettings('store', { [field]: value });
    };

    const states = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
        "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
        "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
        "Uttarakhand", "West Bengal", "Delhi (UT)", "Chandigarh (UT)"
    ];

    const sections = [
        { id: 'store', title: 'Store Profile', icon: Store },
        { id: 'tax', title: 'Tax & GST Settings', icon: Calculator },
        { id: 'invoice', title: 'Invoice Options', icon: Receipt },
        // { id: 'printer', title: 'Printer Settings', icon: Printer },
        // { id: 'roles', title: 'User Roles', icon: Users },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

            <div className="space-y-4">
                {sections.map((section) => (
                    <Card key={section.id} className="overflow-hidden">
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between p-4 bg-card hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <section.icon className="h-5 w-5 text-body-secondary" />
                                <span className="font-semibold text-body-primary">{section.title}</span>
                            </div>
                            {openSection === section.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </button>

                        {openSection === section.id && (
                            <div className="border-t border-theme p-6 bg-slate-50/30 space-y-8">

                                {/* --- STORE PROFILE --- */}
                                {section.id === 'store' && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Store Name</label>
                                            <Input value={settings.store.name} onChange={(e) => handleStoreChange('name', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Contact Number</label>
                                            <Input value={settings.store.contact} onChange={(e) => handleStoreChange('contact', e.target.value)} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">Address</label>
                                            <Input value={settings.store.address} onChange={(e) => handleStoreChange('address', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Email</label>
                                            <Input value={settings.store.email} onChange={(e) => handleStoreChange('email', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Website</label>
                                            <Input value={settings.store.website} onChange={(e) => handleStoreChange('website', e.target.value)} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">Footer Note (Bill)</label>
                                            <Input value={settings.store.footer} onChange={(e) => handleStoreChange('footer', e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {/* --- TAX SETTINGS --- */}
                                {section.id === 'tax' && (
                                    <>
                                        {/* 1. Enable/Disable GST */}
                                        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-theme">
                                            <div>
                                                <h3 className="font-medium text-body-primary">Enable GST</h3>
                                                <p className="text-xs text-body-secondary">Turn off to hide all tax fields from the app</p>
                                            </div>
                                            <div
                                                className={cn("h-6 w-11 rounded-full relative cursor-pointer transition-colors", settings.tax.gstEnabled ? "bg-primary-main" : "bg-slate-300")}
                                                onClick={() => handleTaxChange('gstEnabled', !settings.tax.gstEnabled)}
                                            >
                                                <div className={cn("absolute top-1 h-4 w-4 bg-white rounded-full transition-all", settings.tax.gstEnabled ? "right-1" : "left-1")}></div>
                                            </div>
                                        </div>

                                        {settings.tax.gstEnabled && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">

                                                {/* 2 & 3 & 4. Basic Details */}
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">GSTIN Number</label>
                                                        <Input
                                                            value={settings.tax.gstin}
                                                            onChange={(e) => handleTaxChange('gstin', e.target.value.toUpperCase())}
                                                            placeholder="22AAAAA0000A1Z5"
                                                            maxLength={15}
                                                            className="uppercase font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Registration Type</label>
                                                        <select
                                                            className="w-full h-10 rounded-lg border border-theme px-3 bg-white text-sm"
                                                            value={settings.tax.registrationType}
                                                            onChange={(e) => handleTaxChange('registrationType', e.target.value)}
                                                        >
                                                            <option value="Regular">Regular</option>
                                                            <option value="Composition">Composition Scheme</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Business State</label>
                                                        <select
                                                            className="w-full h-10 rounded-lg border border-theme px-3 bg-white text-sm"
                                                            value={settings.tax.state}
                                                            onChange={(e) => handleTaxChange('state', e.target.value)}
                                                        >
                                                            <option value="">Select State</option>
                                                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Price Mode</label>
                                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                                            {['Inclusive', 'Exclusive'].map(mode => (
                                                                <button
                                                                    key={mode}
                                                                    onClick={() => handleTaxChange('priceMode', mode)}
                                                                    className={cn(
                                                                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                                                        settings.tax.priceMode === mode ? "bg-white shadow text-body-primary" : "text-body-secondary hover:text-body-primary"
                                                                    )}
                                                                >
                                                                    Tax {mode}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-body-secondary pt-1">
                                                            {settings.tax.priceMode === 'Inclusive' ? 'Product price includes Tax (Back-calculated).' : 'Tax is added on top of Product price.'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 6. GST Slabs */}
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-sm font-medium">GST Tax Slabs</label>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="ghost" onClick={resetSlabs}><RotateCcw size={14} className="mr-1" /> Reset</Button>
                                                            <Button size="sm" variant="outline" onClick={() => addTaxSlab({ name: 'New Slab', rate: 0, active: true })}><Plus size={14} className="mr-1" /> Add Slab</Button>
                                                        </div>
                                                    </div>
                                                    <div className="border border-theme rounded-lg bg-white overflow-hidden overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-[#E2E8F0] text-body-secondary">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left font-medium">Slab Name</th>
                                                                    <th className="px-4 py-2 text-center font-medium">Rate %</th>
                                                                    <th className="px-4 py-2 text-center font-medium">CGST</th>
                                                                    <th className="px-4 py-2 text-center font-medium">SGST</th>
                                                                    <th className="px-4 py-2 text-center font-medium">Active</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {settings.tax.slabs.map(slab => (
                                                                    <tr key={slab.id}>
                                                                        <td className="px-4 py-2">
                                                                            <Input
                                                                                className="h-8 text-sm"
                                                                                value={slab.name}
                                                                                onChange={(e) => updateTaxSlab(slab.id, { name: e.target.value })}
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            <Input
                                                                                type="number"
                                                                                className="h-8 text-sm w-20 mx-auto text-center"
                                                                                value={slab.rate}
                                                                                onChange={(e) => updateTaxSlab(slab.id, { rate: parseFloat(e.target.value) })}
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center text-slate-400">{slab.rate / 2}%</td>
                                                                        <td className="px-4 py-2 text-center text-slate-400">{slab.rate / 2}%</td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={slab.active}
                                                                                onChange={(e) => updateTaxSlab(slab.id, { active: e.target.checked })}
                                                                                className="h-4 w-4 rounded border-gray-300 text-primary-main focus:ring-blue-500"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* 7 & 8. Advanced Flags */}
                                                <div className="grid md:grid-cols-2 gap-4 pt-2">
                                                    <label className="flex items-center gap-3 p-3 bg-white border border-theme rounded-lg cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.tax.automaticTax}
                                                            onChange={(e) => handleTaxChange('automaticTax', e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary-main"
                                                        />
                                                        <div className="text-sm">
                                                            <span className="font-medium block">Automatic IGST</span>
                                                            <span className="text-body-secondary text-xs">Apply IGST when customer state ≠ store state</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* --- INVOICE OPTIONS --- */}
                                {section.id === 'invoice' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-body-primary">Display Options</h3>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.invoice.showTaxBreakup}
                                                        onChange={(e) => handleInvoiceChange('showTaxBreakup', e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300"
                                                    />
                                                    <span className="text-sm">Show Tax Breakup (CGST/SGST) table</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.invoice.showHsn}
                                                        onChange={(e) => handleInvoiceChange('showHsn', e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300"
                                                    />
                                                    <span className="text-sm">Show HSN Code column</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.invoice.showB2bGstin}
                                                        onChange={(e) => handleInvoiceChange('showB2bGstin', e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300"
                                                    />
                                                    <span className="text-sm">Show Customer GSTIN on Invoice</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <label className="text-sm font-medium">Rounding Mode</label>
                                            <select
                                                className="w-full h-10 rounded-lg border border-theme px-3 bg-white text-sm"
                                                value={settings.invoice.roundingType}
                                                onChange={(e) => handleInvoiceChange('roundingType', e.target.value)}
                                            >
                                                <option value="Nearest">Nearest Integer (Standard)</option>
                                                <option value="Down">Round Down (Floor)</option>
                                                <option value="Up">Round Up (Ceil)</option>
                                                <option value="None">No Rounding (Exact Decimal)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <label className="text-sm font-medium">Default HSN Code</label>
                                            <Input
                                                value={settings.defaults.hsnCode}
                                                onChange={(e) => updateSettings('defaults', { hsnCode: e.target.value })}
                                                placeholder="e.g. 8544"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default SettingsPage;
