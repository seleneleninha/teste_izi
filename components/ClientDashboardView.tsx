import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, User, LogOut, ChevronRight, Home, ShoppingCart } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CustomOrderModal } from './CustomOrderModal';

export const ClientDashboardView: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [userName, setUserName] = useState('');
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [userWhatsApp, setUserWhatsApp] = useState('');

    useEffect(() => {
        if (user) {
            setUserName(user.user_metadata?.nome || 'Cliente');
            setUserWhatsApp(user.user_metadata?.whatsapp || user.user_metadata?.telefone || '');
            fetchFavoritesCount();
        }
    }, [user]);

    const fetchFavoritesCount = async () => {
        try {
            // Count only favorites with ACTIVE properties
            const { data } = await supabase
                .from('favoritos')
                .select('anuncio_id, anuncios!inner(status)')
                .eq('user_id', user?.id)
                .eq('anuncios.status', 'ativo');

            setFavoritesCount(data?.length || 0);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    return (
        <div className="pt-6 pb-20 md:pb-0">
            {/* Hero Welcome */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-3xl -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Olá, {userName}! 👋</h2>
                    <p className="text-primary-100 text-lg">Vamos encontrar o imóvel dos seus sonhos hoje?</p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                {/* Search Card */}
                <div
                    onClick={() => navigate('/properties')}
                    className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center justify-center min-h-[160px]"
                >
                    <div className="w-16 h-16 bg-midnight-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Search size={32} className="text-midnight-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Buscar Imóveis</h3>
                    <p className="text-sm text-slate-400">Veja qual imóvel se adequa às suas necessídades</p>
                </div>

                {/* Favorites Card */}
                <div
                    onClick={() => navigate('/favorites')}
                    className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center justify-center min-h-[160px]"
                >
                    <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Heart size={32} className="text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Meus Favoritos</h3>
                    <p className="text-sm text-slate-400">{favoritesCount} imóveis salvos</p>
                </div>

                {/* Custom Order Card */}
                <div
                    onClick={() => setShowOrderModal(true)}
                    className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center justify-center min-h-[160px]"
                >
                    <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ShoppingCart size={32} className="text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Encomendar Imóvel</h3>
                    <p className="text-sm text-slate-400">Não achou? Peça para nós!</p>
                </div>

                {/* Profile Card */}
                <div
                    onClick={() => navigate('/settings')}
                    className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center justify-center min-h-[160px]"
                >
                    <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <User size={32} className="text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Meu Perfil</h3>
                    <p className="text-sm text-slate-400">Atualize seus dados</p>
                </div>
            </div>

            {/* Recommendations or Getting Started */}
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
                        Dicas para você
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-full">
                        <div className="w-8 h-8 bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <Home size={16} className="text-purple-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-white">Complete seu perfil</h4>
                            <p className="text-xs text-slate-400 mt-1">Isso ajuda os corretores a encontrarem o imóvel ideal para você.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-full">
                        <div className="w-8 h-8 bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <Search size={16} className="text-amber-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-white">Use os filtros de busca</h4>
                            <p className="text-xs text-slate-400 mt-1">Refine sua pesquisa por bairro, preço e características.</p>
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
    );
};
