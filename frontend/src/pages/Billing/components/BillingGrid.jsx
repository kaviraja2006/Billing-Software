import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Trash2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

const BillingGrid = ({ cart, updateQuantity, removeItem, selectedItemId, onRowClick }) => {
    return (
        <div className="flex-1 overflow-auto bg-white border rounded-md shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>ITEM CODE</TableHead>
                        <TableHead className="w-1/3">ITEM NAME</TableHead>
                        <TableHead className="w-24">QTY</TableHead>
                        <TableHead>UNIT</TableHead>
                        <TableHead className="text-right">PRICE/UNIT(₹)<br /><span className="text-xs text-slate-400 font-normal">Without Tax</span></TableHead>
                        <TableHead className="text-right">DISCOUNT<br />(₹)</TableHead>
                        <TableHead className="text-right">TAX<br />APPLIED(₹)</TableHead>
                        <TableHead className="text-right">TOTAL(₹)</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.map((item, index) => {
                        const isSelected = (item.id || item._id) === selectedItemId;
                        return (
                            <TableRow
                                key={item.id || item._id || index}
                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 hover:bg-blue-200 border-l-4 border-l-blue-600' : 'hover:bg-blue-50/50'}`}
                                onClick={() => onRowClick(item.id || item._id)}
                            >
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-mono text-xs">{item.sku || item.barcode || 'N/A'}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id || item._id, parseInt(e.target.value) || 0)}
                                        className="w-16 h-8 p-1 text-center"
                                    />
                                </TableCell>
                                <TableCell>{item.unit || 'PCS'}</TableCell>
                                <TableCell className="text-right">₹{(item.price || item.sellingPrice || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right text-green-600">{item.discount > 0 ? `₹${item.discount.toFixed(2)}` : '0.00'}</TableCell>
                                <TableCell className="text-right text-slate-500">0.00</TableCell> {/* Placeholder for tax */}
                                <TableCell className="text-right font-bold">₹{item.total.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeItem(item.id || item._id)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {/* Empty Rows Fillers to look like POS */}
                    {Array.from({ length: Math.max(0, 10 - cart.length) }).map((_, i) => (
                        <TableRow key={`empty-${i}`} className="h-10 hover:bg-transparent">
                            <TableCell className="text-slate-200">{cart.length + i + 1}</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default BillingGrid;
