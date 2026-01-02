import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Settings, Handshake, MoreHorizontal, Heart, ShoppingCart, CheckSquare, DollarSign, CreditCard, Users } from 'lucide-react';
import { MoreMenuSheet } from './MoreMenuSheet';
import { CustomOrderModal } from './CustomOrderModal';
import { useAuth } from './AuthContext';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
}

interface MobileBottomNavProps {
    isAdmin?: boolean;
    isClient?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ isAdmin = false, isClient = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [userWhatsApp, setUserWhatsApp] = useState('');

    // Fetch user WhatsApp for prefilling
    React.useEffect(() => {
        if (user && isClient) {
            setUserWhatsApp(user.user_metadata?.telefone || '');
        }
    }, [user, isClient]);

    const isActive = (path: string) => {
        if (path.includes('?')) {
            return location.pathname + location.search === path;
        }
        if (path === '/properties') {
            return location.pathname === '/properties' && !location.search.includes('mode=market');
        }
        return location.pathname === path;
    };

    // Define navigation items logic
    let navItems: NavItem[] = [];

    if (isAdmin) {
        // Admin Nav Items
        navItems = [
            { icon: LayoutDashboard, label: 'Dash', path: '/dashboard' },
            { icon: CheckSquare, label: 'Aprov', path: '/admin/approvals' },
            { icon: CreditCard, label: 'Planos', path: '/admin/plans' },
            { icon: Heart, label: 'Benef', path: '/admin/benefits' },
        ];
    } else if (isClient) {
        // Client Nav Items
        navItems = [
            { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
            { icon: Building2, label: 'Imóveis', path: '/properties' },
            { icon: Heart, label: 'Favoritos', path: '/favorites' },
            { icon: ShoppingCart, label: 'Encomendar', path: '/dashboard' },
        ];
    } else {
        // Broker Nav Items (Default)
        navItems = [
            { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
            { icon: Building2, label: 'Imóveis', path: '/properties' },
            { icon: Handshake, label: 'Parceiros', path: '/partner-properties' },
            { icon: Users, label: 'Leads', path: '/leads' },
        ];
    }

    return (
        <>
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        // Special handling for Encomendar button
                        const isEncomendar = isClient && item.label === 'Encomendar';

                        return (
                            <button
                                key={item.path + item.label}
                                onClick={() => isEncomendar ? setShowOrderModal(true) : navigate(item.path)}
                                className={`
                                    flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                                    transition-all duration-200 min-w-[60px] min-h-[44px]
                                    active:scale-95
                                    ${active
                                        ? 'text-emerald-400 bg-emerald-500/10'
                                        : 'text-slate-400 hover:text-slate-300'
                                    }
                                `}
                                aria-label={item.label}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon
                                    size={22}
                                    className={`transition-transform ${active ? 'scale-110' : ''}`}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span className={`
                                    text-[10px] font-semibold truncate max-w-full leading-tight
                                    ${active ? 'text-emerald-400' : ''}
                                `}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={`
                            flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                            transition-all duration-200 min-w-[60px] min-h-[44px]
                            active:scale-95 text-slate-400 hover:text-slate-300
                            ${showMoreMenu ? 'text-emerald-400 bg-emerald-500/10' : ''}
                        `}
                        aria-label="Mais opções"
                    >
                        <MoreHorizontal
                            size={22}
                            className={`transition-transform ${showMoreMenu ? 'scale-110' : ''}`}
                            strokeWidth={showMoreMenu ? 2.5 : 2}
                        />
                        <span className={`
                            text-[10px] font-semibold truncate max-w-full leading-tight
                            ${showMoreMenu ? 'text-emerald-400' : ''}
                        `}>
                            Mais
                        </span>
                    </button>
                </div>
            </nav>

            {/* More Menu Sheet */}
            <MoreMenuSheet
                isOpen={showMoreMenu}
                onClose={() => setShowMoreMenu(false)}
                isClient={isClient}
                isAdmin={isAdmin}
            />

            {/* Custom Order Modal */}
            <CustomOrderModal
                isOpen={showOrderModal}
                onClose={() => setShowOrderModal(false)}
                brokerId={null}
                prefilledData={{
                    nome_cliente: user ? `${user.user_metadata?.nome || ''} ${user.user_metadata?.sobrenome || ''}`.trim() : '',
                    whatsapp: userWhatsApp
                }}
            />
        </>
    );
};
