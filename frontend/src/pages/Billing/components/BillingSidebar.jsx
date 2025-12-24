import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Search, User, ChevronRight, Calculator } from 'lucide-react';
import { cn } from '../../../lib/utils';

const BillingSidebar = ({
    customer,
    onCustomerSearch,
    totals,
    onPaymentChange,
    paymentMode,
    amountReceived,
    onSavePrint
}) => {
    const currentDate = new Date().toLocaleDateString('en-IN'); // DD/MM/YYYY format

    return (
        <div className="w-full lg:w-96 flex flex-col gap-4 h-full">
            {/* Date Block */}
            <Card className="p-3 bg-white shadow-sm border rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">{currentDate}</span>
                <Calculator size={16} className="text-blue-600" />
            </Card>

            {/* Customer Search Block */}
            <div className="relative">
                <Input
                    placeholder="Search for a customer by name, phone [F11]"
                    className="pl-4 pr-10 py-5 border-blue-200 focus:border-blue-500 shadow-sm"
                    value={customer ? customer.name : ''}
                    readOnly={true}
                    onClick={onCustomerSearch}
                />
                {customer ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-red-500"
                        onClick={() => onCustomerSearch(null)} // Clear logic
                    >
                        X
                    </Button>
                ) : (
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                )}
            </div>

            {/* Totals Block */}
            <Card className="p-4 bg-white border-blue-100 shadow-sm space-y-2">
                <div className="flex items-center gap-3 border-b pb-3 mb-2">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">Total ₹ {totals.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">Items: 0, Quantity: 0</div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto text-blue-600 hover:text-blue-700">
                        Full Breakup <ChevronRight size={14} />
                    </Button>
                </div>
            </Card>

            {/* Payment Block */}
            <Card className="p-4 bg-white shadow-sm flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Payment Mode</label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={paymentMode}
                            onChange={(e) => onPaymentChange('mode', e.target.value)}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Amount Received</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                            <Input
                                className="pl-6 text-right font-bold"
                                value={amountReceived}
                                onChange={(e) => onPaymentChange('amount', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t flex justify-between items-end">
                    <div className="text-sm font-semibold text-slate-700">Change to Return:</div>
                    <div className="text-xl font-bold text-slate-900">₹ {(Math.max(0, amountReceived - totals.total)).toFixed(2)}</div>
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
                <Button
                    className="w-full h-12 bg-green-200 text-green-800 hover:bg-green-300 border border-green-300 font-bold text-lg shadow-sm"
                    onClick={onSavePrint}
                >
                    Save & Print Bill [Ctrl+P]
                </Button>
                <Button
                    variant="outline"
                    className="w-full h-10 text-slate-600 font-medium"
                >
                    Other/Credit Payments [Ctrl+M]
                </Button>
            </div>
        </div>
    );
};

export default BillingSidebar;
