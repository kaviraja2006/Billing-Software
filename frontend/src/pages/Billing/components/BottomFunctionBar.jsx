import React from 'react';
import { Button } from '../../../components/ui/Button';

const BottomFunctionBar = ({ onFunctionClick }) => {
    const functions = [
        { key: 'F2', label: 'Change Quantity' },
        { key: 'F3', label: 'Item Discount' },
        { key: 'F4', label: 'Remove Item' },
        { key: 'F6', label: 'Change Unit' },
        { key: 'F8', label: 'Additional Charges' },
        { key: 'F9', label: 'Bill Discount' },
        { key: 'F10', label: 'Loyalty Points' },
        { key: 'F12', label: 'Remarks' },
    ];

    return (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 p-2 bg-slate-100 border-t">
            {functions.map((fn) => (
                <Button
                    key={fn.key}
                    variant="outline"
                    className="flex flex-col items-center justify-center h-12 bg-white hover:bg-blue-50 border-slate-300 shadow-sm"
                    onClick={() => onFunctionClick(fn.key)}
                >
                    <span className="text-xs font-medium text-slate-500">{fn.label} [{fn.key}]</span>
                </Button>
            ))}
        </div>
    );
};

export default BottomFunctionBar;
