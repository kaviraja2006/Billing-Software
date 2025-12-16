import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, LogOut } from 'lucide-react';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
    const { user, logout } = useAuth();
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
                    {/* Search Bar - Global */}
                    <div className="w-96">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Global search (Ctrl + K)"
                                className="pl-10 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-slate-500 hidden md:block">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                            </div>
                            <div className="group relative">
                                <button className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                    <img src={user?.avatar} alt={user?.name} className="h-full w-full object-cover" />
                                </button>
                                {/* Simple Hover Dropdown for Logout */}
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
