import React, { useState, useEffect } from 'react';
import { Check, X, Eye, AlertCircle, Clock, CheckCircle, XCircle, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PropertyCard } from '../components/PropertyCard';

interface Property {
    id: string;
    titulo: string;
    tipo_imovel: string;
    subtipo_imovel: string;
    cidade: string;
    bairro: string;
    valor_venda: number;
    valor_locacao: number;
    area_priv: number;
    quartos: number;
    status_aprovacao: 'pendente' | 'aprovado' | 'reprovado';
    created_at: string;
    user_id: string;
    aceita_parceria: boolean;
    fotos: string;
    operacao: string;
    banheiros: number;
    vagas: number;
}

interface UserProfile {
    nome: string;
    sobrenome: string;
    email: string;
    whatsapp: string;
}

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [properties, setProperties] = useState<Property[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'reprovado'>('pendente');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Check if user is admin
    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                navigate('/login');
                return;
            }

            const { data, error } = await supabase
                .from('perfis')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (error || !data?.is_admin) {
                addToast('Acesso negado. Apenas administradores podem acessar esta página.', 'error');
                navigate('/dashboard');
            }
        };

        checkAdmin();
    }, [user, navigate, addToast]);

    // Fetch properties
    useEffect(() => {
        fetchProperties();
    }, [filter]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('anuncios')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'todos') {
                query = query.eq('status_aprovacao', filter);
            }

            const { data, error } = await query;

            if (error) throw error;

            setProperties(data || []);

            // Fetch user profiles
            const userIds = [...new Set(data?.map(p => p.user_id) || [])];
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('perfis')
                    .select('id, nome, sobrenome, email, whatsapp')
                    .in('id', userIds);

                const profileMap: Record<string, UserProfile> = {};
                profiles?.forEach(p => {
                    profileMap[p.id] = {
                        nome: p.nome,
                        sobrenome: p.sobrenome,
                        email: p.email,
                        whatsapp: p.whatsapp
                    };
                });
                setUserProfiles(profileMap);
            }

        } catch (error: any) {
            console.error('Error fetching properties:', error);
            addToast('Erro ao carregar anúncios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (propertyId: string) => {
        try {
            const { error } = await supabase
                .from('anuncios')
                .update({
                    status_aprovacao: 'aprovado',
                    aprovado_por: user?.id,
                    data_aprovacao: new Date().toISOString()
                })
                .eq('id', propertyId);

            if (error) throw error;

            addToast('Anúncio aprovado com sucesso!', 'success');
            fetchProperties();
        } catch (error: any) {
            console.error('Error approving property:', error);
            addToast('Erro ao aprovar anúncio', 'error');
        }
    };

    const handleReject = async () => {
        if (!selectedProperty || !rejectReason.trim()) {
            addToast('Por favor, informe o motivo da reprovação', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from('anuncios')
                .update({
                    status_aprovacao: 'reprovado',
                    aprovado_por: user?.id,
                    data_aprovacao: new Date().toISOString(),
                    motivo_reprovacao: rejectReason
                })
                .eq('id', selectedProperty.id);

            if (error) throw error;

            addToast('Anúncio reprovado', 'success');
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedProperty(null);
            fetchProperties();
        } catch (error: any) {
            console.error('Error rejecting property:', error);
            addToast('Erro ao reprovar anúncio', 'error');
        }
    };

    const openRejectModal = (property: Property) => {
        setSelectedProperty(property);
        setShowRejectModal(true);
    };

    const filteredProperties = properties.filter(p =>
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.bairro.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        pendente: properties.filter(p => p.status_aprovacao === 'pendente').length,
        aprovado: properties.filter(p => p.status_aprovacao === 'aprovado').length,
        reprovado: properties.filter(p => p.status_aprovacao === 'reprovado').length,
        total: properties.length
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-12">
            {/* Admin Header */}
            <div className="bg-slate-900 text-white py-8 px-6 shadow-lg mb-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="text-emerald-400" size={32} />
                            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
                        </div>
                        <p className="text-slate-400">Gerenciamento e moderação de anúncios da plataforma</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Pendentes</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.pendente}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                            <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Aprovados</p>
                            <p className="text-3xl font-bold text-green-600">{stats.aprovado}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Reprovados</p>
                            <p className="text-3xl font-bold text-red-600">{stats.reprovado}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <XCircle className="text-red-600 dark:text-red-400" size={24} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Total</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <AlertCircle className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl w-full md:w-auto">
                            {(['todos', 'pendente', 'aprovado', 'reprovado'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex-1 md:flex-none ${filter === status
                                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por título, cidade ou bairro..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Properties Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                        <p className="text-gray-500 dark:text-slate-400 mt-4">Carregando anúncios...</p>
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Nenhum anúncio encontrado</h3>
                        <p className="text-gray-500 dark:text-slate-400">Tente ajustar seus filtros de busca.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map(property => {
                            const owner = userProfiles[property.user_id];
                            return (
                                <div key={property.id} className="relative group">
                                    <PropertyCard
                                        property={property}
                                        showStatus={true}
                                        actions={
                                            property.status_aprovacao === 'pendente' ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(property.id);
                                                        }}
                                                        className="flex-1 px-3 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 flex items-center justify-center transition-colors shadow-lg shadow-green-600/20"
                                                    >
                                                        <Check size={18} className="mr-2" /> Aprovar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openRejectModal(property);
                                                        }}
                                                        className="flex-1 px-3 py-2.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-xl text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors"
                                                    >
                                                        <X size={18} className="mr-2" /> Reprovar
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/properties/${property.id}`);
                                                    }}
                                                    className="w-full py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                                                >
                                                    <Eye size={18} className="mr-2" /> Ver Detalhes
                                                </button>
                                            )
                                        }
                                    />
                                    {/* Owner Info Tooltip/Card */}
                                    {owner && (
                                        <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                            <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl max-w-[200px]">
                                                <p className="font-bold mb-1">{owner.nome} {owner.sobrenome}</p>
                                                <p className="text-slate-300 mb-1">{owner.email}</p>
                                                <p className="text-emerald-400 font-mono">{owner.whatsapp}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-700 transform transition-all scale-100">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Reprovar Anúncio
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Por favor, descreva o motivo da reprovação para que o corretor possa corrigir o anúncio.
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white h-32 resize-none mb-6 text-sm"
                                placeholder="Ex: Fotos de baixa qualidade, endereço incorreto..."
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectReason('');
                                        setSelectedProperty(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                >
                                    Confirmar Reprovação
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
