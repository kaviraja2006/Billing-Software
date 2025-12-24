import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Search, UserPlus } from 'lucide-react';
import { useCustomers } from '../../../context/CustomerContext';

const CustomerSearchModal = ({ isOpen, onClose, onSelect }) => {
    const { customers } = useCustomers();
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
    ).slice(0, 10);

    const handleKeyDown = (e, customer) => {
        if (e.key === 'Enter') {
            onSelect(customer);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Search Customer">
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        ref={inputRef}
                        placeholder="Search by Name or Phone..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                    {/* Walk-in Option */}
                    <div
                        tabIndex={0}
                        className="p-3 hover:bg-green-50 cursor-pointer border-b border-slate-100 bg-green-50/30 focus:bg-green-100 focus:outline-none"
                        onClick={() => {
                            onSelect({ name: 'Walk-in Customer', phone: '', email: '' });
                            onClose();
                        }}
                    >
                        <div className="font-semibold text-green-700">Walk-in Customer</div>
                        <div className="text-xs text-green-600">Standard / Guest</div>
                    </div>

                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer, index) => (
                            <div
                                key={customer.id || customer._id}
                                tabIndex={0}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 focus:bg-blue-50 focus:outline-none"
                                onClick={() => {
                                    onSelect(customer);
                                    onClose();
                                }}
                                onKeyDown={(e) => handleKeyDown(e, customer)}
                            >
                                <div className="font-semibold text-slate-800">{customer.name}</div>
                                <div className="text-sm text-slate-500">
                                    {customer.phone} {customer.email && `| ${customer.email}`}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            No customers found.
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    {/* Placeholder for quick add feature if requested later */}
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </Modal>
    );
};

export default CustomerSearchModal;
