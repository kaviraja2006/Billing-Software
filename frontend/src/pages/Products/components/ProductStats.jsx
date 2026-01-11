import React from 'react';
import { Package, CheckCircle, XCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

const StatCard = ({ label, count, icon: Icon, color, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${active
            ? `bg-${color}-50 border-${color}-200 shadow-sm ring-1 ring-${color}-200`
            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
    >
        <div className={`p-2 rounded-full bg-${color}-100 text-${color}-600`}>
            <Icon size={18} />
        </div>
        <div className="text-left">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-lg font-bold text-slate-900">{count}</p>
        </div>
    </button>
);

const ProductStats = ({ products, currentFilter, onFilterChange }) => {
    const stats = {
        total: products.length,
        active: products.filter(p => p.isActive !== false).length,
        inactive: products.filter(p => p.isActive === false).length,
        lowStock: products.filter(p => p.stock <= (p.minStock ?? 10) && p.stock > 0).length,
        outOfStock: products.filter(p => p.stock === 0).length
    };

    const filters = [
        { key: 'all', label: 'Total SKUs', icon: Package, count: stats.total, color: 'blue' },
        { key: 'active', label: 'Active', icon: CheckCircle, count: stats.active, color: 'emerald' },
        { key: 'inactive', label: 'Inactive', icon: XCircle, count: stats.inactive, color: 'slate' },
        { key: 'lowStock', label: 'Low Stock', icon: AlertTriangle, count: stats.lowStock, color: 'amber' },
        { key: 'outOfStock', label: 'Out of Stock', icon: AlertOctagon, count: stats.outOfStock, color: 'rose' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {filters.map(({ key, ...rest }) => (
                <StatCard
                    key={key}
                    {...rest}
                    active={currentFilter === key}
                    onClick={() => onFilterChange(key)}
                />
            ))}
        </div>
    );
};

export default ProductStats;
