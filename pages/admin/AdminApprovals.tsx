import React, { useState, useEffect } from 'react';
import {
    Check, X, Eye, AlertCircle, Clock, CheckCircle, XCircle, Search, ShieldCheck, History,
    DollarSign, Key, AlertTriangle, PauseCircle, Trophy, ChevronDown, List, LayoutGrid, UserCheck, UserX,
    BedDouble, Bath, Car, Ruler, ArrowUp, ArrowDown
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { sendPushNotification } from '../../lib/onesignalHelper';
import { useNavigate } from 'react-router-dom';
import { PropertyCard } from '../../components/PropertyCard';
import { generatePropertySlug } from '../../lib/formatters';

// ... (Property interface and other types remain the same) 

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
    status: 'pendente' | 'ativo' | 'reprovado' | 'venda_faturada' | 'locacao_faturada' | 'imovel_perdido' | 'imovel_espera';
    created_at: string;
    user_id: string;
    aceita_parceria: boolean;
    fotos: string;
    operacao: string;
    banheiros: number;
    vagas: number;
    slug?: string;
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

// Configuration for all statuses
const STATUS_CONFIG = {
    todos: { label: 'Todos', icon: ShieldCheck, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-700' },
    pendente: { label: 'Pendentes', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    ativo: { label: 'Ativos', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    reprovado: { label: 'Reprovados', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    venda_faturada: { label: 'Vendas', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    locacao_faturada: { label: 'Locações', icon: Key, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    imovel_perdido: { label: 'Perdidos', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    imovel_espera: { label: 'Em Espera', icon: PauseCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
};

type FilterType = keyof typeof STATUS_CONFIG;

export const AdminApprovals: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Property | ''; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });

    // Rejection State
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'scroll' | 'list'>('list');

    const handleSort = (key: keyof Property) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

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

    // Fetch properties (load ALL to calculate counts locally)
    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            // Fetch ALL properties without filtering by status in query
            let query = supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel_rel:tipo_imovel(tipo),
                    operacao_rel:operacao(tipo)
                `)
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            // Map the joined data to use labels instead of UUIDs
            const mappedData = (data || []).map(p => {
                const tipo = p.tipo_imovel_rel?.tipo || p.tipo_imovel;
                const op = p.operacao_rel?.tipo || p.operacao;
                return {
                    ...p,
                    tipo_imovel: tipo,
                    operacao: op,
                    slug: generatePropertySlug({ ...p, tipo_imovel: tipo, operacao: op })
                };
            }) as Property[];

            setAllProperties(mappedData);

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
                    status: 'ativo',
                    aprovado_por: user?.id,
                    data_aprovacao: new Date().toISOString()
                })
                .eq('id', property.id);

            if (error) throw error;

            // Send Notification
            await supabase.from('notificacoes').insert({
                user_id: property.user_id,
                titulo: 'Anúncio ativo! 🎉',
                mensagem: `Seu imóvel "${property.titulo}" foi ativo e já está publicado na plataforma e na sua página. Parabéns e vamos para o próximo!`,
                tipo: 'aprovacao',
                link: `/properties/${property.slug}`
            });

            // Push Notification
            await sendPushNotification(
                'Anúncio Aprovado! 🎉',
                `Seu imóvel "${property.titulo}" já está ativo no portal.`,
                property.user_id,
                `/properties/${property.slug}`
            );

            addToast('Anúncio ativo com sucesso!', 'success');
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
                    status: 'reprovado',
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
                link: `/properties?edit=${selectedProperty.id}` // Corrected link for editing
            });

            // Push Notification
            await sendPushNotification(
                notifTitle,
                notifMessage,
                selectedProperty.user_id,
                `/properties?edit=${selectedProperty.id}`
            );

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

    // Calculate Counts dynamically from ALL properties
    const counts = {
        todos: allProperties.length,
        pendente: allProperties.filter(p => p.status === 'pendente').length,
        ativo: allProperties.filter(p => p.status === 'ativo').length,
        reprovado: allProperties.filter(p => p.status === 'reprovado').length,
        venda_faturada: allProperties.filter(p => p.status === 'venda_faturada').length,
        locacao_faturada: allProperties.filter(p => p.status === 'locacao_faturada').length,
        imovel_perdido: allProperties.filter(p => p.status === 'imovel_perdido').length,
        imovel_espera: allProperties.filter(p => p.status === 'imovel_espera').length,
    };

    // Filter displayed list
    let filteredProperties = allProperties
        .filter(p => filter === 'todos' ? true : p.status === filter)
        .filter(p =>
            p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.bairro.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Apply Sorting
    if (sortConfig.key) {
        filteredProperties.sort((a, b) => {
            // Handle potentially undefined values safely
            const aValue = a[sortConfig.key as keyof Property];
            const bValue = b[sortConfig.key as keyof Property];

            if (aValue === bValue) return 0;
            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    return (
        <div className="min-h-screen bg-slate-900 pb-12">
            {/* Admin Header - Command Center Style */}
            <div className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 border-b border-slate-800/50 pt-8 pb-6 px-6 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                <ShieldCheck className="text-emerald-400" size={24} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Moderação de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Anúncios</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 font-medium ml-1">Mantenha a qualidade da vitrine validando os imóveis pendentes.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-700"
                        >
                            Voltar
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">

                {/* Filters and View Toggle Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">

                    {/* Status Dropdown (Mobile Optimized) */}
                    <div className="relative w-full md:w-64 z-30">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${isDropdownOpen
                                ? 'bg-slate-800 border-primary-500 ring-1 ring-primary-500'
                                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${STATUS_CONFIG[filter].bg}`}>
                                    {React.createElement(STATUS_CONFIG[filter].icon, {
                                        size: 18,
                                        className: STATUS_CONFIG[filter].color
                                    })}
                                </div>
                                <span className="font-bold text-white text-sm">
                                    {STATUS_CONFIG[filter].label} <span className="text-slate-500 ml-1">({counts[filter]})</span>
                                </span>
                            </div>
                            <ChevronDown className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''} text-slate-400`} size={16} />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl z-40 overflow-hidden max-h-[80vh] overflow-y-auto">
                                    {(Object.entries(STATUS_CONFIG) as [FilterType, typeof STATUS_CONFIG[FilterType]][]).map(([key, config]) => {
                                        const isSelected = filter === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setFilter(key);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0 ${isSelected ? 'bg-slate-700/50' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                                        <config.icon size={16} className={config.color} />
                                                    </div>
                                                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                                    {counts[key] || 0}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Search and View Toggles */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar imóvel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-white transition-all text-sm"
                            />
                        </div>

                        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'grid'
                                    ? 'bg-slate-700 text-primary-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-300'}`}
                                title="Grade"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'list'
                                    ? 'bg-slate-700 text-primary-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-300'}`}
                                title="Lista"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Properties Display */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-3xl h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                        <p className="text-slate-400 mt-4">Carregando anúncios...</p>
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-16 bg-slate-800 rounded-3xl border border-dashed border-slate-700">
                        <div className="w-16 h-16 bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Nenhum anúncio encontrado</h3>
                        <p className="text-slate-400">Tente ajustar seus filtros.</p>
                    </div>
                ) : viewMode === 'list' ? (
                    // LIST VIEW IMPLEMENTATION
                    <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700 bg-slate-900/50">
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('titulo')}>
                                            <div className="flex items-center gap-1">Imóvel {sortConfig.key === 'titulo' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('cidade')}>
                                            <div className="flex items-center gap-1">Localização {sortConfig.key === 'cidade' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                                        </th>

                                        {/* New Metric Columns (Icons Only) */}
                                        <th className="p-4 text-center cursor-pointer hover:text-white" title="Quartos" onClick={() => handleSort('quartos')}>
                                            <div className="flex justify-center items-center gap-1 text-slate-400"><BedDouble size={16} />{sortConfig.key === 'quartos' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}</div>
                                        </th>
                                        <th className="p-4 text-center cursor-pointer hover:text-white" title="Banheiros" onClick={() => handleSort('banheiros')}>
                                            <div className="flex justify-center items-center gap-1 text-slate-400"><Bath size={16} />{sortConfig.key === 'banheiros' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}</div>
                                        </th>
                                        <th className="p-4 text-center cursor-pointer hover:text-white" title="Vagas" onClick={() => handleSort('vagas')}>
                                            <div className="flex justify-center items-center gap-1 text-slate-400"><Car size={16} />{sortConfig.key === 'vagas' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}</div>
                                        </th>
                                        <th className="p-4 text-center cursor-pointer hover:text-white" title="Área Privativa" onClick={() => handleSort('area_priv')}>
                                            <div className="flex justify-center items-center gap-1 text-slate-400"><Ruler size={16} />{sortConfig.key === 'area_priv' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}</div>
                                        </th>

                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('valor_venda')}>
                                            <div className="flex items-center gap-1">Valores {sortConfig.key === 'valor_venda' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Proprietário</th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                                            <div className="flex items-center gap-1">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredProperties.map(property => {
                                        const owner = userProfiles[property.user_id];
                                        let thumb = null;
                                        try {
                                            const photos = JSON.parse(property.fotos);
                                            thumb = photos.length > 0 ? photos[0] : null;
                                        } catch (e) { }

                                        return (
                                            <tr key={property.id} className="hover:bg-slate-700/30 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg bg-slate-900 flex-shrink-0 overflow-hidden border border-slate-600">
                                                            {thumb ? (
                                                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-500"><Eye size={16} /></div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm line-clamp-1 max-w-[180px]" title={property.titulo}>
                                                                {property.titulo}
                                                            </p>
                                                            <div className="flex gap-2 text-xs text-slate-400 mt-0.5">
                                                                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{property.tipo_imovel}</span>
                                                                <span className={`px-1.5 py-0.5 rounded border font-semibold ${property.operacao === 'Venda'
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                    : property.operacao === 'Locação' || property.operacao === 'Aluguel'
                                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                        : 'bg-slate-900 border-slate-700'
                                                                    }`}>{property.operacao}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-sm text-slate-300 font-medium">{property.cidade}</p>
                                                    <p className="text-xs text-slate-500">{property.bairro}</p>
                                                </td>

                                                {/* Metric Columns Data */}
                                                <td className="p-4 text-center">
                                                    <span className="text-sm font-medium text-slate-300">{property.quartos || '-'}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-sm font-medium text-slate-300">{property.banheiros || '-'}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-sm font-medium text-slate-300">{property.vagas || '-'}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-sm font-medium text-slate-300">{property.area_priv ? `${property.area_priv}m²` : '-'}</span>
                                                </td>


                                                <td className="p-4">
                                                    <div className="text-sm font-bold text-emerald-400">
                                                        {property.valor_venda > 0 ? `R$ ${property.valor_venda.toLocaleString()}` : '-'}
                                                    </div>
                                                    {property.valor_locacao > 0 && (
                                                        <div className="text-xs font-medium text-blue-400">
                                                            Aluguel: R$ {property.valor_locacao.toLocaleString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {owner ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                                                                {owner.nome.charAt(0)}{owner.sobrenome.charAt(0)}
                                                            </div>
                                                            <div className="text-xs">
                                                                <p className="text-white hover:underline cursor-pointer" onClick={() => window.open(`https://wa.me/55${owner.whatsapp.replace(/\D/g, '')}`, '_blank')}>
                                                                    {owner.nome}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-600">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[property.status]?.bg || 'bg-slate-800'} ${STATUS_CONFIG[property.status]?.color || 'text-slate-400'} ${STATUS_CONFIG[property.status]?.border || 'border-slate-700'}`}>
                                                        {STATUS_CONFIG[property.status] && React.createElement(STATUS_CONFIG[property.status].icon, { size: 12 })}
                                                        {STATUS_CONFIG[property.status]?.label || property.status}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/properties/${property.slug}`)}
                                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="Ver Detalhes"
                                                        >
                                                            <Eye size={18} />
                                                        </button>

                                                        {property.status === 'pendente' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(property)}
                                                                    className="p-2 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-lg transition-colors"
                                                                    title="Aprovar"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => openRejectModal(property)}
                                                                    className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                                                    title="Reprovar"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // GRID VIEW (Existing)
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map(property => {
                            const owner = userProfiles[property.user_id];
                            const historyCount = property.historico_reprovacao?.length || 0;

                            // Smart Flags Logic
                            let flags = [];
                            try {
                                const photoCount = property.fotos ? JSON.parse(property.fotos).length : 0;
                                if (photoCount < 5) flags.push({ label: 'Poucas Fotos', color: 'bg-yellow-500', icon: AlertCircle });
                            } catch (e) {
                                flags.push({ label: 'Erro Fotos', color: 'bg-red-500', icon: AlertCircle });
                            }

                            if ((property.valor_venda || 0) === 0 && (property.valor_locacao || 0) === 0) {
                                flags.push({ label: 'Sem Preço', color: 'bg-red-500', icon: AlertCircle });
                            }

                            if (property.titulo.length < 10) {
                                flags.push({ label: 'Título Curto', color: 'bg-orange-500', icon: AlertCircle });
                            }

                            return (
                                <div key={property.id} className={`relative group ${viewMode === 'scroll' ? 'min-w-[320px] max-w-[340px] snap-center flex-shrink-0' : ''}`}>
                                    <PropertyCard
                                        property={property}
                                        showStatus={true}
                                        actions={
                                            property.status === 'pendente' ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(property);
                                                        }}
                                                        className="flex-1 px-3 py-2.5 bg-green-600 text-white rounded-full text-sm font-bold hover:bg-green-700 flex items-center justify-center transition-colors shadow-lg shadow-green-600/20"
                                                        title="Aprovar"
                                                    >
                                                        <Check size={18} className="mr-2" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openRejectModal(property);
                                                        }}
                                                        className="flex-1 px-3 py-2.5 bg-red-100 text-red-700 bg-red-900/30 text-red-300 rounded-full text-sm font-bold hover:bg-red-200 hover:bg-red-900/50 flex items-center justify-center transition-colors"
                                                        title="Reprovar"
                                                    >
                                                        <X size={18} className="mr-2" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/properties/${property.slug}`);
                                                    }}
                                                    className="w-full py-2.5 bg-slate-700 text-gray-300 rounded-full text-sm font-medium hover:bg-slate-600 flex items-center justify-center transition-colors"
                                                >
                                                    <Eye size={18} className="mr-2" /> Ver Detalhes
                                                </button>
                                            )
                                        }
                                    />

                                    {/* Smart Flags Badges */}
                                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                                        {flags.map((flag, idx) => (
                                            <div key={idx} className={`${flag.color} text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1`}>
                                                <flag.icon size={12} />
                                                {flag.label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* History Badge if previously rejected */}
                                    {historyCount > 0 && property.status === 'pendente' && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                <History size={12} />
                                                {historyCount}x Reprovado
                                            </div>
                                        </div>
                                    )}

                                    {/* Owner Info Tooltip/Card */}
                                    {owner && (
                                        <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                            <div className="bg-slate-900 text-white text-xs p-3 rounded-3xl shadow-xl max-w-[200px]">
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
                        <div className="bg-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-700 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 bg-red-900/30 rounded-3xl flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="text-red-600 text-red-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">
                                        Reprovar Anúncio
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        {selectedProperty.titulo}
                                    </p>
                                </div>
                            </div>

                            {/* Previous Rejection History */}
                            {selectedProperty.historico_reprovacao && selectedProperty.historico_reprovacao.length > 0 && (
                                <div className="mb-6 bg-orange-50 bg-orange-900/20 p-4 rounded-3xl border border-orange-100 border-orange-900/30">
                                    <h4 className="text-sm font-bold text-orange-800 text-orange-300 mb-2 flex items-center gap-2">
                                        <History size={14} /> Histórico de Reprovações
                                    </h4>
                                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                                        {selectedProperty.historico_reprovacao.map((item, idx) => (
                                            <div key={idx} className="text-xs text-orange-700 text-orange-400 border-b border-orange-200 border-orange-800/50 last:border-0 pb-2 last:pb-0">
                                                <p className="font-semibold">{new Date(item.data).toLocaleDateString('pt-BR')} às {new Date(item.data).toLocaleTimeString('pt-BR')}</p>
                                                <p>Motivos: {item.razoes.join(', ')}</p>
                                                {item.motivo && <p className="italic mt-1">"{item.motivo}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 mb-6">
                                <p className="text-slate-300 font-medium">Selecione os motivos:</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {REJECTION_REASONS.map(reason => (
                                        <label key={reason} className="flex items-center gap-3 p-3 rounded-3xl border border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedReasons.includes(reason)}
                                                onChange={() => toggleReason(reason)}
                                                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-slate-300">{reason}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-slate-300 font-medium mb-2">
                                    Observações adicionais (Opcional):
                                </label>
                                <textarea
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    className="w-full px-4 py-3 rounded-3xl bg-slate-900 border border-slate-600 focus:ring-2 focus:ring-red-500 outline-none text-white h-24 resize-none text-sm"
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
                                    className="flex-1 px-4 py-3 bg-slate-700 text-gray-300 rounded-full font-bold hover:bg-slate-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
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
