import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile sidebar on route change
    // We can add a useEffect here if needed, but the Link click in Sidebar usually handles it if we pass a closer.
    // For now, let's just toggler.

    return (
        <div className="flex h-screen bg-app overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-theme z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-main text-white shadow-sm">
                        {/* We use a simple icon or just text here if we don't want to import everything again, 
                            but Sidebar has the imports. Let's rely on Sidebar or just use text for now or duplicate import if necessary.
                            MainLayout doesn't have the icons imported. Let's just put a simple title. */}
                        <span className="font-bold text-lg">P</span>
                    </div>
                    <span className="text-xl font-bold text-body-primary tracking-tight">POS System</span>
                </div>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
                </button>
            </header>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Wrapper */}
            <div className={`
                fixed inset-y-0 left-0 z-[60] md:relative md:z-0
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isSidebarOpen ? 'md:w-64' : 'md:w-20'}
                w-64 h-full
            `}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    // New props for mobile
                    isMobile={true}
                    onCloseMobile={() => setIsMobileOpen(false)}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0">
                <main className="flex-1 overflow-auto p-4 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
