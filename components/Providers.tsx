"use client";

import React from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { ThemeProvider } from './ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
