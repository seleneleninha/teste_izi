import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Globe, Heart, Users, LogOut, ShoppingCart, User, CheckSquare, CreditCard, Clock, Percent, DollarSign, LayoutDashboard, Settings, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

interface MoreMenuSheetProps {
    isOpen: boolean;
    onClose: () => void;
    isClient?: boolean;
    isAdmin?: boolean;
}

export const MoreMenuSheet: React.FC<MoreMenuSheetProps> = ({ isOpen, onClose, isClient = false, isAdmin = false }) => {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
        onClose();
    };

    // handlePushToggle removed (Internal notification system removal)

    let menuItems = [];

    if (isAdmin) {
        menuItems = [
            { icon: Clock, label: 'Trial', path: '/admin/trial-settings', color: 'amber', onClick: null },
            { icon: Percent, label: 'Cupons', path: '/admin/coupons', color: 'emerald', onClick: null },
            { icon: Settings, label: 'Configs', path: '/settings', color: 'slate', onClick: null },
            { icon: LogOut, label: 'Sair', path: null, color: 'red', onClick: handleLogout },
        ];
    } else if (isClient) {
        menuItems = [
            { icon: User, label: 'Meu Perfil', path: '/settings', color: 'blue', onClick: null },
            { icon: LogOut, label: 'Sair', path: null, color: 'red', onClick: handleLogout },
        ];
    } else {
        // Broker (Default)
        menuItems = [
            { icon: Globe, label: 'Mercado', path: '/market', color: 'blue', onClick: null },
            { icon: CheckCircle, label: 'Comparativo', path: '/favorites', color: 'emerald', onClick: null },
            { icon: Settings, label: 'Ajustes', path: '/settings', color: 'slate', onClick: null },
            { icon: LogOut, label: 'Sair', path: null, color: 'red', onClick: handleLogout },
        ];
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div className={`fixed inset-x-0 bottom-0 z-[70] md:hidden animate-in slide-in-from-bottom duration-300`}>
                <div className="bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-700">
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-12 h-1 bg-slate-600 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white">Mais Opções</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="px-4 py-4 pb-safe-bottom">
                        <div className="grid grid-cols-3 gap-3">
                            {menuItems.map((item, idx) => {
                                const Icon = item.icon;
                                const colorClasses = {
                                    emerald: 'bg-emerald-500/10 text-emerald-400',
                                    blue: 'bg-blue-500/10 text-blue-400',
                                    red: 'bg-red-500/10 text-red-400',
                                    purple: 'bg-purple-500/10 text-purple-400',
                                    slate: 'bg-slate-500/10 text-slate-400',
                                    amber: 'bg-amber-500/10 text-amber-400',
                                };

                                // Safe color access
                                const colorClass = colorClasses[item.color as keyof typeof colorClasses] || colorClasses.slate;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => item.onClick ? item.onClick() : handleNavigate(item.path!)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:scale-95 transition-all min-h-[100px]"
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                                            <Icon size={24} />
                                        </div>
                                        <span className="text-xs font-semibold text-white text-center leading-tight">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom padding for safe area */}
                    <div className="h-5 pb-safe-bottom" />
                </div>
            </div>
        </>
    );
};
