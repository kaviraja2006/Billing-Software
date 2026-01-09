import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ShoppingBag, Calendar, AlertCircle } from 'lucide-react';
import services from '../../services/api';

const CustomerDrawer = ({ isOpen, onClose, customer, onSave }) => {
    const title = customer ? 'Customer Details' : 'Add New Customer';
    const [activeTab, setActiveTab] = useState('details'); // details, history
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

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

    useEffect(() => {
        if (customer && activeTab === 'history' && isOpen) {
            const fetchOrders = async () => {
                setLoadingOrders(true);
                try {
                    const response = await services.invoices.getAll({ customerId: customer.id });
                    setOrders(response.data);
                } catch (error) {
                    console.error("Failed to fetch customer orders", error);
                } finally {
                    setLoadingOrders(false);
                }
            };
            fetchOrders();
        }
    }, [customer, activeTab, isOpen]);

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
                    <div className="flex border-b border-theme mb-6">
                        <button
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-primary-main text-primary-main' : 'text-body-secondary hover:text-body-primary'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Profile
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-primary-main text-primary-main' : 'text-body-secondary hover:text-body-primary'}`}
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
                                            <p className="text-xl font-bold text-green-600">₹{customer.totalSpent}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <p className="text-xs text-slate-500 uppercase">Due Amount</p>
                                            <p className="text-xl font-bold text-red-600">₹{customer.due}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Purchase History */}
                            {loadingOrders ? (
                                <div className="text-center py-8 text-slate-500">Loading history...</div>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-blue-50 text-primary-main rounded-xl">
                                                <ShoppingBag size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                                                <div className="flex items-center text-xs text-slate-500 gap-2 mt-1">
                                                    <Calendar size={12} />
                                                    <span>{new Date(order.date).toLocaleDateString()}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>{order.items?.length || 0} Items</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">${(order.total || 0).toFixed(2)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                order.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {order.status || 'Paid'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 flex flex-col items-center text-slate-500">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <p>No purchase history found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
                    {activeTab === 'details' && (
                        <>
                            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                            <Button className="flex-1" variant="primary" onClick={handleSave}>
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
