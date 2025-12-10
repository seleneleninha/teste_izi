"use client";

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

export const ConditionalNavbar = () => {
    const pathname = usePathname();

    // Hide navbar on dashboard and admin routes
    const hideNavbar = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');

    if (hideNavbar) {
        return null;
    }

    return <Navbar />;
};
