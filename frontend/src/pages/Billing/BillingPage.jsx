import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, ShoppingCart, FileText, CreditCard, ChevronRight, ChevronLeft, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import CustomerStep from './CustomerStep';
import ProductStep from './ProductStep';
import SummaryStep from './SummaryStep';
import PaymentStep from './PaymentStep';
import { useTransactions } from '../../context/TransactionContext';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

const steps = [
    { id: 1, title: 'Customer', icon: User },
    { id: 2, title: 'Products', icon: ShoppingCart },
    { id: 3, title: 'Summary', icon: FileText },
    { id: 4, title: 'Payment', icon: CreditCard },
];

const BillingPage = () => {
    const { holdBill, heldBills, deleteHeldBill } = useTransactions();
    const [currentStep, setCurrentStep] = useState(1);
    const [billingData, setBillingData] = useState({
        customer: null,
        cart: [],
        totals: { subtotal: 0, tax: 0, discount: 0, total: 0, roundOff: 0 }
    });
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

    const nextStep = () => {
        if (currentStep < steps.length) setCurrentStep(c => c + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    const handleHoldBill = () => {
        if (!billingData.customer && billingData.cart.length === 0) {
            alert("Cannot hold an empty bill.");
            return;
        }
        holdBill({ ...billingData, step: currentStep });
        // Reset
        setBillingData({
            customer: null,
            cart: [],
            totals: { subtotal: 0, tax: 0, discount: 0, total: 0, roundOff: 0 }
        });
        setCurrentStep(1);
        alert("Bill held successfully!");
    };

    const handleResumeBill = (bill) => {
        setBillingData({
            customer: bill.customer,
            cart: bill.cart,
            totals: bill.totals
        });
        setCurrentStep(bill.step || 1);
        deleteHeldBill(bill.id);
        setIsResumeModalOpen(false);
    };

    return (
        <div className="flex h-full flex-col gap-6">
            {/* Wizard Header / Stepper */}
            <div className="w-full">
                <Card className="rounded-xl border-0 bg-white shadow-sm">
                    <div className="flex items-center justify-between p-4">
                        <h1 className="text-xl font-bold text-slate-900">New Bill / Invoice</h1>

                        {/* Steps Indicator */}
                        <div className="flex items-center gap-2">
                            {steps.map((step, index) => {
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;

                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div
                                            className={cn(
                                                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                                                isActive ? "bg-blue-600 text-white shadow-md" :
                                                    isCompleted ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-400"
                                            )}
                                        >
                                            <step.icon size={16} />
                                            <span className="hidden sm:inline">{step.title}</span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={cn("mx-2 h-0.5 w-4", isCompleted ? "bg-blue-200" : "bg-slate-200")} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsResumeModalOpen(true)}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Resume ({heldBills.length})
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleHoldBill} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                <PauseCircle className="mr-2 h-4 w-4" /> Hold Bill
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                <Card className="h-full border-0 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                        {currentStep === 1 && <CustomerStep onNext={nextStep} billingData={billingData} setBillingData={setBillingData} />}
                        {currentStep === 2 && <ProductStep billingData={billingData} setBillingData={setBillingData} />}
                        {currentStep === 3 && <SummaryStep billingData={billingData} setBillingData={setBillingData} />}
                        {currentStep === 4 && <PaymentStep billingData={billingData} />}
                    </div>

                    {/* Footer Actions - Hide on Payment Step (4) as it has its own controls */}
                    {currentStep !== 4 && (
                        <div className="border-t border-slate-100 bg-white p-4 flex justify-between items-center">
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="w-32"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back
                            </Button>

                            {currentStep < steps.length ? (
                                <Button
                                    onClick={nextStep}
                                    className="w-32"
                                    disabled={currentStep === 1 && !billingData.customer} // Require customer selection
                                >
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                /* This "Complete Sale" button was dead/unused. 
                                   Since we hide the footer on step 4, this is effectively removed, 
                                   but we keep the logic structure clean.
                                */
                                null
                            )}
                        </div>
                    )}
                </Card>
            </div>

            {/* Resume Bill Modal */}
            <Modal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} title="Held Bills">
                <div className="max-h-[60vh] overflow-y-auto">
                    {heldBills.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No held bills found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Saved At</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {heldBills.map((bill) => (
                                    <TableRow key={bill.id}>
                                        <TableCell className="text-slate-500 text-sm">{bill.savedAt}</TableCell>
                                        <TableCell className="font-medium">
                                            {bill.customer ? bill.customer.name : 'Walk-in Customer'}
                                        </TableCell>
                                        <TableCell>${bill.totals.total.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => handleResumeBill(bill)}>Resume</Button>
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => deleteHeldBill(bill.id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default BillingPage;
