import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Settings, LogOut, Users, X, Handshake, CreditCard, Ticket, DollarSign, CheckCircle, Search, Heart, UserCircle, Home, Globe, BarChart3 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getVerificationConfig } from '../lib/verificationHelper';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signOut, userProfile } = useAuth();
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
    return location.pathname === path;
  };

  const isAdmin = role === 'Admin' || role === 'admin';
  const isClient = role === 'Cliente';

  const navItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckCircle, label: 'Aprovar Anúncios', path: '/admin/approvals' },
    { icon: CreditCard, label: 'Planos', path: '/admin/plans' },
    { icon: Heart, label: 'Benefícios', path: '/admin/benefits' },
    { icon: Ticket, label: 'Cupons', path: '/admin/coupons' },
    { icon: Settings, label: 'Config Trial', path: '/admin/trial-settings' },
    { icon: DollarSign, label: 'Financeiro', path: '/admin/financial' },
    { icon: BarChart3, label: 'Estudo de Mercado', path: '/admin/study' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
    // Mercado removed - causes freezing issues in admin context
  ] : isClient ? [
    { icon: Home, label: 'Início', path: '/dashboard' },
    { icon: Search, label: 'Buscar Imóveis', path: '/properties' },
    { icon: Heart, label: 'Favoritos', path: '/favorites' },
    { icon: UserCircle, label: 'Meu Perfil', path: '/settings' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Building2, label: 'Meus Imóveis', path: '/myproperties' },
    { icon: Handshake, label: 'Imóveis Parceiros', path: '/partner-properties' },
    { icon: Users, label: 'Leads (CRM)', path: '/leads' },
    { icon: CheckCircle, label: 'Comparativo', path: '/favorites' },
    { icon: Globe, label: 'Mercado', path: '/market' }, // New Link
    { icon: Settings, label: 'Configurações', path: '/settings' },


  ];

  // Verification Logic - Memoized to prevent re-render issues
  const verificationConfig = React.useMemo(
    () => getVerificationConfig(userProfile?.plano_id),
    [userProfile?.plano_id]
  );

  return (
    <>
      <div className={`h-screen w-56 bg-slate-950 text-white flex flex-col fixed left-0 top-0 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden ${verificationConfig ? `p-[2px] ${verificationConfig.gradientClass} ${verificationConfig.pulseClass}` : ''}`}>
              <img
                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`}
                alt="Profile"
                className={`w-full h-full rounded-full object-cover bg-slate-800 ${verificationConfig ? 'border-2 border-slate-900' : ''}`}
              />
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate flex items-center gap-1">
                {profile.name}
                {verificationConfig && <img src={verificationConfig.badgeUrl} alt={verificationConfig.title} className="w-4 h-4 object-contain shrink-0 drop-shadow-sm" />}
              </p>
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
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-2xl transition-all duration-200 ${isActive(item.path)
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
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-2xl text-red-500 hover:bg-slate-900 transition-all duration-200">
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
