"use client";

import React, { useState } from 'react';
import { Menu, Shield } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function AdminLayout({
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
                <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg bg-slate-700 text-gray-300"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-white flex items-center gap-2">
                        <Shield className="text-red-500" size={20} />
                        Admin Panel
                    </span>
                    <div className="w-10" />
                </header>

                {/* Admin Banner */}
                <div className="hidden md:block bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3">
                    <div className="flex items-center gap-2">
                        <Shield size={20} />
                        <span className="font-semibold">Painel Administrativo</span>
                    </div>
                </div>

                {/* Page Content */}
                <main className="pt-16 md:pt-0 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
