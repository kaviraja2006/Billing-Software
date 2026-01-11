import React, { useState, useEffect, useCallback } from 'react';
import { X, Delete, Divide, X as Multiply, Minus, Plus, Equal } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const CalculatorModal = ({ isOpen, onClose }) => {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

    const handleNumber = (num) => {
        if (display === '0' || shouldResetDisplay) {
            setDisplay(num.toString());
            setShouldResetDisplay(false);
        } else {
            setDisplay(display + num.toString());
        }
    };

    const handleOperator = (op) => {
        setEquation(display + ' ' + op + ' ');
        setShouldResetDisplay(true);
    };

    const handleEqual = () => {
        try {
            // Safe evaluation of the equation
            // Combine previous equation part with current display
            // ex: "5 + " and "3" -> "5 + 3"
            const fullEquation = equation + display;

            // Replace visual operators with JS operators if needed (though we use standard symbols mostly)
            // x -> * is already handled if we store '*'

            // eslint-disable-next-line no-eval
            const result = eval(fullEquation.replace(/x/g, '*').replace(/÷/g, '/'));

            setDisplay(String(Number(result).toFixed(2)).replace(/\.00$/, '')); // Clean formatting
            setEquation('');
            setShouldResetDisplay(true);
        } catch (error) {
            setDisplay('Error');
            setShouldResetDisplay(true);
            setEquation('');
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
        setShouldResetDisplay(false);
    };

    const handleBackspace = () => {
        if (display.length === 1) {
            setDisplay('0');
        } else {
            setDisplay(display.slice(0, -1));
        }
    };

    const handleDecimal = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
            setShouldResetDisplay(false);
        }
    };

    // Keyboard support
    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return;

        const key = e.key;
        if (/[0-9]/.test(key)) handleNumber(key);
        if (['+', '-', '*', '/'].includes(key)) handleOperator(key);
        if (key === 'Enter' || key === '=') {
            e.preventDefault();
            handleEqual();
        }
        if (key === 'Escape') onClose();
        if (key === 'abackspace') handleBackspace(); // 'Backspace' lowercased check? no, e.key is 'Backspace'
        if (key === 'Backspace') handleBackspace();
        if (key === 'c' || key === 'C') handleClear();
        if (key === '.') handleDecimal();
    }, [isOpen, display, equation]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-slate-50 p-3 flex justify-between items-center border-b">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        Calculator
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Display */}
                <div className="bg-slate-900 p-6 text-right">
                    <div className="text-slate-400 text-sm h-5 font-mono">{equation}</div>
                    <div className="text-white text-4xl font-mono font-bold tracking-wider overflow-x-auto no-scrollbar">
                        {display}
                    </div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100">
                    <Btn onClick={() => handleClear()} className="col-span-2 text-red-600 bg-red-50 hover:bg-red-100">AC</Btn>
                    <Btn onClick={handleBackspace} className="text-slate-600"><Delete size={20} /></Btn>
                    <Btn onClick={() => handleOperator('/')} className="text-blue-600 bg-blue-50"><Divide size={20} /></Btn>

                    <Btn onClick={() => handleNumber(7)}>7</Btn>
                    <Btn onClick={() => handleNumber(8)}>8</Btn>
                    <Btn onClick={() => handleNumber(9)}>9</Btn>
                    <Btn onClick={() => handleOperator('*')} className="text-blue-600 bg-blue-50"><Multiply size={20} /></Btn>

                    <Btn onClick={() => handleNumber(4)}>4</Btn>
                    <Btn onClick={() => handleNumber(5)}>5</Btn>
                    <Btn onClick={() => handleNumber(6)}>6</Btn>
                    <Btn onClick={() => handleOperator('-')} className="text-blue-600 bg-blue-50"><Minus size={20} /></Btn>

                    <Btn onClick={() => handleNumber(1)}>1</Btn>
                    <Btn onClick={() => handleNumber(2)}>2</Btn>
                    <Btn onClick={() => handleNumber(3)}>3</Btn>
                    <Btn onClick={() => handleOperator('+')} className="text-blue-600 bg-blue-50"><Plus size={20} /></Btn>

                    <Btn onClick={() => handleNumber(0)} className="col-span-2">0</Btn>
                    <Btn onClick={handleDecimal}>.</Btn>
                    <Btn onClick={handleEqual} className="bg-blue-600 text-white hover:bg-blue-700 shdaow-lg shadow-blue-200"><Equal size={24} /></Btn>
                </div>
            </div>
        </div>
    );
};

const Btn = ({ children, onClick, className = "" }) => (
    <button
        onClick={onClick}
        className={`h-16 text-xl font-bold flex items-center justify-center rounded-lg active:scale-95 transition-all outline-none focus:ring-2 focus:ring-blue-500/50 ${className.includes('bg-') ? className : 'bg-white text-slate-700 hover:bg-slate-50 shadow-sm'} ${className}`}
    >
        {children}
    </button>
);

export default CalculatorModal;
