import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    Receipt,
    Package,
    Users,
    FileText,
    BarChart3,
    Wallet,
    Settings,
    ScanBarcode,
    LogOut
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { label: 'Billing', icon: Receipt, path: '/billing' },
        { label: 'Products', icon: Package, path: '/products' },
        { label: 'Customers', icon: Users, path: '/customers' },
        { label: 'Invoices', icon: FileText, path: '/invoices' },
        { label: 'Reports', icon: BarChart3, path: '/reports' },
        { label: 'Expenses', icon: Wallet, path: '/expenses' },
        { label: 'Settings', icon: Settings, path: '/settings' },
        { label: 'Barcode', icon: ScanBarcode, path: '/barcode' },
    ];

    return (
        <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
            {/* Logo Area */}
            <div className="flex h-16 items-center border-b border-slate-100 px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
                        <Receipt size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">POS System</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={cn("transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User / Footer */}
            <div className="border-t border-slate-100 p-4">
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 shadow-inner">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 border-2 border-white shadow-sm">
                        {/* Placeholder Avatar */}
                        <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="User" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-slate-900">Admin User</p>
                        <p className="truncate text-xs text-slate-500">Store Manager</p>
                    </div>
                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
