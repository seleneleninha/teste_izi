import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute: React.FC = () => {
    const { user, loading } = useAuth();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Give auth context time to initialize
        const timer = setTimeout(() => {
            setChecking(false);
        }, 100);

        return () => clearTimeout(timer);
    }, [loading]);

    if (loading || checking) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
