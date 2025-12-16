import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ShoppingBag, Calendar } from 'lucide-react';

const CustomerDrawer = ({ isOpen, onClose, customer, onSave }) => {
    const title = customer ? 'Customer Details' : 'Add New Customer';
    const [activeTab, setActiveTab] = useState('details'); // details, history
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || ''
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: ''
            });
        }
        setActiveTab('details');
    }, [customer, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.name || !formData.phone) {
            alert("Name and Phone are required");
            return;
        }
        onSave(formData);
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={title} width="max-w-2xl">
            <div className="h-full flex flex-col">
                {/* Tabs */}
                {customer && (
                    <div className="flex border-b border-slate-200 mb-6">
                        <button
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Profile
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('history')}
                        >
                            Purchase History
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Basic Information</h4>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Phone</label>
                                        <Input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+1 234..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Email</label>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Address</label>
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Street address"
                                    />
                                </div>
                            </div>

                            {customer && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Account Summary</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <p className="text-xs text-slate-500 uppercase">Total Visits</p>
                                            <p className="text-xl font-bold text-slate-900">{customer.totalVisits}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <p className="text-xs text-slate-500 uppercase">Total Spent</p>
                                            <p className="text-xl font-bold text-green-600">${customer.totalSpent}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <p className="text-xs text-slate-500 uppercase">Due Amount</p>
                                            <p className="text-xl font-bold text-red-600">${customer.due}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Mock Purchase History */}
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="p-4 flex justify-between items-center group hover:border-blue-300 cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Order #{1000 + i}</p>
                                            <div className="flex items-center text-xs text-slate-500 gap-2 mt-1">
                                                <Calendar size={12} /> <span>Oct {10 + i}, 2023</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-slate-900">$120.00</p>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Paid</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
                    {activeTab === 'details' && (
                        <>
                            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                                {customer ? 'Update Customer' : 'Save Customer'}
                            </Button>
                        </>
                    )}
                    {activeTab === 'history' && (
                        <Button variant="outline" className="w-full" onClick={() => setActiveTab('details')}>Back to Details</Button>
                    )}
                </div>
            </div>
        </Drawer>
    );
};

export default CustomerDrawer;
