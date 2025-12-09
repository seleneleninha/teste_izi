"use client";

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="md:ml-64">
                {/* Mobile Header */}
                <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white">iziBrokerz</span>
                    <div className="w-10" /> {/* Spacer for alignment */}
                </header>

                {/* Page Content */}
                <main className="pt-16 md:pt-0 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
