import React, { useState, useEffect } from 'react';
import { Check, X, Eye, AlertCircle, Clock, CheckCircle, XCircle, Search, ShieldCheck, History, MessageSquare, LayoutGrid, List, Map } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PropertyCard } from '../../components/PropertyCard';

interface RejectionHistoryItem {
    data: string;
    motivo: string;
    razoes: string[];
    admin_id: string;
}

interface Property {
    id: string;
    titulo: string;
    tipo_imovel: string;
    subtipo_imovel: string;
    cidade: string;
    bairro: string;
    valor_venda: number;
    valor_locacao: number;
    valor_diaria?: number;   // Temporada
    valor_mensal?: number;   // Temporada
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
    historico_reprovacao?: RejectionHistoryItem[];
    motivo_reprovacao?: string;
}

interface UserProfile {
    nome: string;
    sobrenome: string;
    email: string;
    whatsapp: string;
}

const REJECTION_REASONS = [
    'Imagens em baixa resolução',
    'Imagens comprometem a reputação (infiltrações, bagunça, etc.)',
    'Valores discrepantes do mercado',
    'Título ou Descrição em desacordo com a realidade',
    'Endereço incompleto ou incorreto',
    'Dados cadastrais inconsistentes'
];

export const AdminApprovals: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [properties, setProperties] = useState<Property[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'reprovado'>('pendente');
    const [searchTerm, setSearchTerm] = useState('');

    // Rejection State
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'scroll' | 'list'>('grid');

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
                .select(`
                    *,
                    tipo_imovel_rel:tipo_imovel(tipo),
                    operacao_rel:operacao(tipo)
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'todos') {
                query = query.eq('status_aprovacao', filter);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Map the joined data to use labels instead of UUIDs
            const mappedData = (data || []).map(p => ({
                ...p,
                tipo_imovel: p.tipo_imovel_rel?.tipo || p.tipo_imovel,
                operacao: p.operacao_rel?.tipo || p.operacao
            }));

            setProperties(mappedData);

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

    const handleApprove = async (property: Property) => {
        try {
            const { error } = await supabase
                .from('anuncios')
                .update({
                    status_aprovacao: 'aprovado',
                    aprovado_por: user?.id,
                    data_aprovacao: new Date().toISOString()
                })
                .eq('id', property.id);

            if (error) throw error;

            // Send Notification
            await supabase.from('notificacoes').insert({
                user_id: property.user_id,
                titulo: 'Anúncio Aprovado! 🎉',
                mensagem: `Seu imóvel "${property.titulo}" foi aprovado e já está publicado na plataforma e na sua página. Parabéns e vamos para o próximo!`,
                tipo: 'aprovacao',
                link: `/properties/${property.id}`
            });

            addToast('Anúncio aprovado com sucesso!', 'success');
            fetchProperties();
        } catch (error: any) {
            console.error('Error approving property:', error);
            addToast('Erro ao aprovar anúncio', 'error');
        }
    };

    const handleReject = async () => {
        if (!selectedProperty) return;

        if (selectedReasons.length === 0 && !rejectComment.trim()) {
            addToast('Por favor, selecione um motivo ou descreva a razão da reprovação.', 'error');
            return;
        }

        try {
            const currentHistory = selectedProperty.historico_reprovacao || [];
            const isSecondRejection = currentHistory.length > 0;

            const newRejectionEntry: RejectionHistoryItem = {
                data: new Date().toISOString(),
                motivo: rejectComment,
                razoes: selectedReasons,
                admin_id: user?.id || ''
            };

            const updatedHistory = [...currentHistory, newRejectionEntry];

            // Update Property
            const { error } = await supabase
                .from('anuncios')
                .update({
                    status_aprovacao: 'reprovado',
                    aprovado_por: user?.id,
                    data_aprovacao: new Date().toISOString(),
                    motivo_reprovacao: rejectComment || selectedReasons.join(', '), // Legacy support
                    historico_reprovacao: updatedHistory
                })
                .eq('id', selectedProperty.id);

            if (error) throw error;

            // Notification Message Logic
            let notifTitle = 'Anúncio Reprovado ⚠️';
            let notifMessage = `Seu imóvel "${selectedProperty.titulo}" precisa de ajustes. Motivos: ${selectedReasons.join(', ')}.`;

            if (rejectComment) {
                notifMessage += ` Obs: ${rejectComment}`;
            }

            if (isSecondRejection) {
                notifTitle = 'Atenção: 2ª Reprovação 🚫';
                notifMessage = `Seu imóvel foi reprovado novamente. Por favor, entre em contato com o suporte para alinhar os ajustes necessários.`;
            }

            // Send Notification
            await supabase.from('notificacoes').insert({
                user_id: selectedProperty.user_id,
                titulo: notifTitle,
                mensagem: notifMessage,
                tipo: 'reprovacao',
                link: `/properties/${selectedProperty.id}/edit` // Assuming edit route
            });

            addToast('Anúncio reprovado e notificação enviada.', 'success');
            setShowRejectModal(false);
            setRejectComment('');
            setSelectedReasons([]);
            setSelectedProperty(null);
            fetchProperties();
        } catch (error: any) {
            console.error('Error rejecting property:', error);
            addToast('Erro ao reprovar anúncio', 'error');
        }
    };

    const openRejectModal = (property: Property) => {
        setSelectedProperty(property);
        setSelectedReasons([]);
        setRejectComment('');
        setShowRejectModal(true);
    };

    const toggleReason = (reason: string) => {
        if (selectedReasons.includes(reason)) {
            setSelectedReasons(selectedReasons.filter(r => r !== reason));
        } else {
            setSelectedReasons([...selectedReasons, reason]);
        }
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
                        <p className="text-slate-400">Gerenciamento e moderação de anúncios da Plataforma</p>
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

                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'}`}
                                title="Grade"
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('scroll')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'scroll'
                                    ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'}`}
                                title="Scroll Horizontal"
                            >
                                <List size={20} />
                            </button>
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
                    <div className={viewMode === 'scroll'
                        ? 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600'
                        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    }>
                        {filteredProperties.map(property => {
                            const owner = userProfiles[property.user_id];
                            const historyCount = property.historico_reprovacao?.length || 0;

                            return (
                                <div key={property.id} className={`relative group ${viewMode === 'scroll' ? 'min-w-[320px] max-w-[340px] snap-center flex-shrink-0' : ''}`}>
                                    <PropertyCard
                                        property={property}
                                        showStatus={true}
                                        actions={
                                            property.status_aprovacao === 'pendente' ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(property);
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

                                    {/* History Badge if previously rejected */}
                                    {historyCount > 0 && property.status_aprovacao === 'pendente' && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                                                <History size={12} />
                                                {historyCount}x Reprovado
                                            </div>
                                        </div>
                                    )}

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
                {showRejectModal && selectedProperty && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-700 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Reprovar Anúncio
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">
                                        {selectedProperty.titulo}
                                    </p>
                                </div>
                            </div>

                            {/* Previous Rejection History */}
                            {selectedProperty.historico_reprovacao && selectedProperty.historico_reprovacao.length > 0 && (
                                <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                    <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                                        <History size={14} /> Histórico de Reprovações
                                    </h4>
                                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                                        {selectedProperty.historico_reprovacao.map((item, idx) => (
                                            <div key={idx} className="text-xs text-orange-700 dark:text-orange-400 border-b border-orange-200 dark:border-orange-800/50 last:border-0 pb-2 last:pb-0">
                                                <p className="font-semibold">{new Date(item.data).toLocaleDateString('pt-BR')} às {new Date(item.data).toLocaleTimeString('pt-BR')}</p>
                                                <p>Motivos: {item.razoes.join(', ')}</p>
                                                {item.motivo && <p className="italic mt-1">"{item.motivo}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 mb-6">
                                <p className="text-gray-700 dark:text-slate-300 font-medium">Selecione os motivos:</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {REJECTION_REASONS.map(reason => (
                                        <label key={reason} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedReasons.includes(reason)}
                                                onChange={() => toggleReason(reason)}
                                                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">{reason}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 dark:text-slate-300 font-medium mb-2">
                                    Observações adicionais (Opcional):
                                </label>
                                <textarea
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white h-24 resize-none text-sm"
                                    placeholder="Descreva detalhes específicos..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectComment('');
                                        setSelectedReasons([]);
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
