import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const DiscountModal = ({ isOpen, onClose, onApply, title = "Apply Discount", initialValue = 0, isPercentage = false }) => {
    const [value, setValue] = useState(initialValue);
    const [mode, setMode] = useState(isPercentage ? 'percent' : 'amount'); // 'percent' or 'amount'
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
            setValue(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onApply(parseFloat(value) || 0, mode === 'percent');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-md">
                    <button
                        type="button"
                        className={`flex-1 py-1 text-sm font-medium rounded-sm transition-all ${mode === 'amount' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                        onClick={() => setMode('amount')}
                    >
                        Amount (₹)
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-1 text-sm font-medium rounded-sm transition-all ${mode === 'percent' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                        onClick={() => setMode('percent')}
                    >
                        Percentage (%)
                    </button>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">Enter Value</label>
                    <Input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="text-right text-lg font-bold"
                        placeholder="0.00"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Apply</Button>
                </div>
            </form>
        </Modal>
    );
};

export const AdditionalChargesModal = ({ isOpen, onClose, onApply, initialValue = 0 }) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
            setValue(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onApply(parseFloat(value) || 0);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Additional Charges">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-700">Packing/Delivery Charges (₹)</label>
                    <Input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="text-right text-lg font-bold"
                        placeholder="0.00"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Apply Charge</Button>
                </div>
            </form>
        </Modal>
    );
};

export const LoyaltyPointsModal = ({ isOpen, onClose, onApply, availablePoints = 150 }) => {
    // Dummy available points if not provided. In real app, fetch from customer.
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const conversionRate = 1.0; // 1 Point = ₹1
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
            setPointsToRedeem(0);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const redeeem = parseInt(pointsToRedeem) || 0;
        if (redeeem > availablePoints) {
            alert(`You only have ${availablePoints} points!`);
            return;
        }
        onApply(redeeem * conversionRate);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Redeem Loyalty Points">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md flex justify-between items-center text-blue-700">
                    <span className="font-medium">Available Points</span>
                    <span className="font-bold text-xl">{availablePoints}</span>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700">Points to Redeem (1 Pt = ₹{conversionRate})</label>
                    <Input
                        ref={inputRef}
                        type="number"
                        min="0"
                        max={availablePoints}
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(e.target.value)}
                        className="text-right text-lg font-bold"
                        placeholder="0"
                    />
                    <p className="text-right text-sm text-slate-500 mt-1">
                        Discount Value: <span className="font-semibold text-green-600">₹{((parseFloat(pointsToRedeem) || 0) * conversionRate).toFixed(2)}</span>
                    </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Redeem</Button>
                </div>
            </form>
        </Modal>
    );
};

export const RemarksModal = ({ isOpen, onClose, onSave, initialValue = "" }) => {
    const [text, setText] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
            setText(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(text);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Bill Remarks">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-700">Remarks / Note</label>
                    <Input
                        ref={inputRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="h-24" // Ideally textarea but Input component used for now
                        placeholder="Enter any special instructions or notes..."
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Choice</Button>
                </div>
            </form>
        </Modal>
    );
};
