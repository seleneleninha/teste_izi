import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Settings, LogOut, Users, X, Handshake, CreditCard, Ticket, DollarSign, CheckCircle, Search, Heart, User as UserIcon, Home, Globe } from 'lucide-react';
import { IconWrapper } from './IconWrapper';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const [profile, setProfile] = useState<{ name: string; email: string; avatar: string }>({
    name: '',
    email: '',
    avatar: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Try to fetch from 'perfis' table
      const { data } = await supabase
        .from('perfis')
        .select('nome, email, avatar')
        .eq('id', user?.id)
        .single();

      if (data) {
        setProfile({
          name: data.nome || user?.user_metadata?.name || 'Usuário',
          email: data.email || user?.email || '',
          avatar: data.avatar || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${data.nome || 'User'}`
        });
      } else {
        // Fallback
        setProfile({
          name: user?.user_metadata?.name || 'Usuário',
          email: user?.email || '',
          avatar: user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`
        });
      }
    } catch (error) {
      console.error('Erro ao buscar perfil sidebar:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar on selection (UX improvement)
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    if (path === '/properties') {
      return location.pathname === '/properties' && !location.search.includes('mode=market');
    }
    return location.pathname === path;
  };

  const isAdmin = role === 'Admin' || role === 'admin';
  const isClient = role === 'Cliente';

  const navItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckCircle, label: 'Aprovar Anúncios', path: '/admin/approvals' },
    { icon: CreditCard, label: 'Planos', path: '/admin/plans' },
    { icon: Settings, label: 'Config Trial', path: '/admin/trial-settings' },
    { icon: Ticket, label: 'Cupons', path: '/admin/coupons' },
    { icon: DollarSign, label: 'Financeiro', path: '/admin/financial' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
    { icon: Globe, label: 'Mercado', path: '/properties?mode=market' }, // New Link

  ] : isClient ? [
    { icon: Home, label: 'Início', path: '/dashboard' },
    { icon: Search, label: 'Buscar Imóveis', path: '/properties' },
    { icon: Heart, label: 'Favoritos', path: '/favorites' },
    { icon: UserIcon, label: 'Meu Perfil', path: '/settings' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Building2, label: 'Meus Imóveis', path: '/properties' },
    { icon: Handshake, label: 'Imóveis Parceiros', path: '/partner-properties' },
    { icon: Users, label: 'Leads (CRM)', path: '/leads' },
    { icon: CheckCircle, label: 'Comparativo', path: '/favorites' },
    { icon: Globe, label: 'Mercado', path: '/properties?mode=market' }, // New Link
    { icon: Settings, label: 'Configurações', path: '/settings' },


  ];

  return (
    <>
      <div className={`h-screen w-56 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="User"
                className="w-9 h-9 rounded-full border-2 border-primary-500 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-primary-500 bg-slate-800 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-500">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{profile.name}</p>
              <p className="text-[11px] text-slate-400 truncate w-28">{profile.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              data-tour={item.path === '/partner-properties' ? 'partner-properties' : undefined}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-full transition-all duration-200 ${isActive(item.path)
                ? 'bg-slate-800 text-primary-400 border-l-4 border-primary-500'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-full text-red-400 hover:bg-slate-800 transition-all duration-200">
            <LogOut size={20} />
            <span className="font-medium">SAIR</span>
          </button>
        </div>
      </div>
      {/* Mobile overlay to close sidebar when clicking outside */}
      {
        isOpen && (
          <div
            className="fixed inset-0 bg-black/30 md:hidden z-30"
            onClick={onClose}
          />
        )
      }
    </>
  );
};
