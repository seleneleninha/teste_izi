import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { formatCurrency } from '../lib/formatters';
import { useHeader } from '../components/HeaderContext';
import { DeactivatePropertyModal } from '../components/DeactivatePropertyModal';
import {
    Grid, List, Map, Search, Filter, Loader2, Plus, Edit, Trash2, Eye, EyeOff,
    ChevronUp, ChevronDown, Check, X, ArrowUpDown, Home, Building, MapPin,
    Bed, Bath, Car, Maximize2, AlertTriangle, DollarSign, XCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MyPropertiesPage: React.FC = () => {
    const { setHeaderContent } = useHeader();
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const { addToast } = useToast();

    const [view, setView] = useState<'grid' | 'list' | 'map'>('list');
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Status filter
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterOperation, setFilterOperation] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');

    // Inactivation Modal State
    const [inactivationModalOpen, setInactivationModalOpen] = useState(false);
    const [selectedPropertyToInactivate, setSelectedPropertyToInactivate] = useState<any>(null);

    // Set Header
    useEffect(() => {
        setHeaderContent(
            <div className="flex flex-col justify-center">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
                    Meus Imóveis
                </h1>
                <p className="text-slate-400 text-xs font-medium leading-tight">
                    Gerencie seu portfólio de imóveis
                </p>
            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent]);

    // Fetch properties
    useEffect(() => {
        if (user) {
            fetchProperties();
        }
    }, [user]);

    const fetchProperties = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel!inner (tipo),
                    operacao (tipo)
                `)
                .eq('user_id', user.id)
                .neq('status', 'excluido')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format properties: convert fotos string to array
            const formatted = (data || []).map(p => ({
                ...p,
                fotos: p.fotos ? (Array.isArray(p.fotos) ? p.fotos : p.fotos.split(',')) : [],
                operacao: typeof p.operacao === 'string' ? p.operacao : p.operacao?.tipo || ''
            }));

            setProperties(formatted);
        } catch (error) {
            console.error('Erro ao buscar imóveis:', error);
            addToast('Erro ao carregar imóveis', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Start inactivation process
    const handleInactivateClick = (property: any) => {
        setSelectedPropertyToInactivate(property);
        setInactivationModalOpen(true);
    };

    // Confirm status change (reactivate or set specific inactive status)
    const handleChangeStatus = async (propertyId: string, newStatus: string) => {
        try {
            // Se estiver reativando, volta para pendente (regras de negócio: qualquer reativação passa por aprovação)
            // Se for reprovado e o usuário editar, também deve voltar para pendente (isso deve ser feito no form de edição)
            // Aqui estamos lidando com inativação ou reativação via dashboard

            const effectiveStatus = (newStatus === 'ativo' || newStatus === 'reativar') ? 'pendente' : newStatus;

            const { error } = await supabase
                .from('anuncios')
                .update({ status: effectiveStatus })
                .eq('id', propertyId);

            if (error) throw error;

            let message = '';
            if (effectiveStatus === 'pendente') message = 'Imóvel reativado! Ele ficará como Pendente aguardando nova aprovação.';
            else if (effectiveStatus === 'venda_faturada') message = 'Parabéns pela venda! Imóvel marcado como Vendido.';
            else if (effectiveStatus === 'locacao_faturada') message = 'Parabéns pela locação! Imóvel marcado como Alugado.';
            else if (effectiveStatus === 'imovel_espera') message = 'Imóvel colocado em Standby.';
            else if (effectiveStatus === 'imovel_perdido') message = 'Imóvel marcado como Perdido.';

            addToast(message, 'success');
            setInactivationModalOpen(false);
            setSelectedPropertyToInactivate(null);
            fetchProperties();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            addToast('Erro ao atualizar status do imóvel', 'error');
        }
    };

    // Bulk actions
    const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
        if (selectedProperties.length === 0) return;

        try {
            if (action === 'delete') {
                const { error } = await supabase
                    .from('anuncios')
                    .update({ status: 'excluido' })
                    .in('id', selectedProperties);
                if (error) throw error;
                addToast(`${selectedProperties.length} imóveis excluídos`, 'success');
            } else {
                const newStatus = action === 'activate' ? 'ativo' : 'inativo';
                const { error } = await supabase
                    .from('anuncios')
                    .update({ status: newStatus })
                    .in('id', selectedProperties);
                if (error) throw error;
                addToast(`${selectedProperties.length} imóveis ${newStatus === 'ativo' ? 'ativados' : 'inativados'}`, 'success');
            }
            setSelectedProperties([]);
            fetchProperties();
        } catch (error) {
            console.error('Erro na ação em lote:', error);
            addToast('Erro ao executar ação', 'error');
        }
    };

    // Filter and sort properties
    const filteredProperties = useMemo(() => {
        let result = properties;

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.titulo?.toLowerCase().includes(term) ||
                p.bairro?.toLowerCase().includes(term) ||
                p.cidade?.toLowerCase().includes(term) ||
                p.logradouro?.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (filterStatus !== 'all') {
            result = result.filter(p => p.status === filterStatus);
        }

        // Operation filter
        if (filterOperation) {
            result = result.filter(p => p.operacao?.toLowerCase().includes(filterOperation.toLowerCase()));
        }

        // Type filter
        if (filterType) {
            result = result.filter(p => {
                const pTipo = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo;
                return pTipo?.toLowerCase().includes(filterType.toLowerCase());
            });
        }

        // Sorting
        if (sortConfig) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [properties, searchTerm, filterStatus, filterOperation, filterType, sortConfig]);

    // Toggle select all
    const toggleSelectAll = () => {
        if (selectedProperties.length === filteredProperties.length) {
            setSelectedProperties([]);
        } else {
            setSelectedProperties(filteredProperties.map(p => p.id));
        }
    };

    // Toggle single selection
    const toggleSelect = (id: string) => {
        setSelectedProperties(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    // Handle sort
    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // Get sort icon
    const getSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="text-slate-500" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="text-emerald-400" />
            : <ChevronDown size={14} className="text-emerald-400" />;
    };

    // Helper to render status badge
    const renderStatusBadge = (status: string) => {
        const config: any = {
            'ativo': { bg: 'bg-emerald-500/80', text: 'Ativo' },
            'pendente': { bg: 'bg-yellow-500/80', text: 'Pendente' },
            'reprovado': { bg: 'bg-red-500/80', text: 'Reprovado' },
            'venda_faturada': { bg: 'bg-purple-600/80', text: 'Vendido' },
            'locacao_faturada': { bg: 'bg-blue-600/80', text: 'Alugado' },
            'imovel_perdido': { bg: 'bg-slate-600/80', text: 'Perdido' },
            'imovel_espera': { bg: 'bg-orange-500/80', text: 'Standby' },
            'inativo': { bg: 'bg-slate-500/80', text: 'Inativo' }
        };
        const style = config[status] || config['inativo'];

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${style.bg}`}>
                {style.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header removido - agora via useHeader */}


            {/* Filters & View Toggle */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por título, bairro, cidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                        />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                        >
                            <option value="all">Todos Status</option>
                            <option value="ativo">Ativos</option>
                            <option value="pendente">Pendentes</option>
                            <option value="reprovado">Reprovados</option>
                            <option value="venda_faturada">Vendidos</option>
                            <option value="locacao_faturada">Alugados</option>
                            <option value="imovel_perdido">Perdidos</option>
                            <option value="imovel_espera">Standby</option>
                            <option value="inativo">Inativos (Antigo)</option>
                        </select>

                        {/* View Toggle */}
                        <div className="flex bg-slate-900 rounded-xl border border-slate-700 p-1">
                            <button
                                onClick={() => setView('grid')}
                                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Visualização em Grid"
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Visualização em Lista"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setView('map')}
                                className={`p-2 rounded-lg transition-all ${view === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Visualização no Mapa"
                            >
                                <Map size={18} />
                            </button>
                        </div>

                        {/* Add Property Button - Moved here */}
                        <button
                            onClick={() => navigate('/add-property')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            title="Novo Anúncio"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline font-bold">Anunciar</span>
                        </button>
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between mb-2 mt-4">
                    <p className="text-slate-400">
                        <span className="text-white font-bold">{filteredProperties.length}</span> imóveis encontrados
                    </p>
                </div>

                {/* Content */}
                {view === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProperties.map(property => (
                            <div key={property.id} className="relative group">
                                <PropertyCard
                                    property={property}
                                    isDashboard={true}
                                    showStatus={true}
                                    actions={
                                        <>
                                            {/* Edit Button */}
                                            {property.status !== 'excluido' && (
                                                <button
                                                    onClick={() => navigate(`/add-property?edit=${property.id}`)}
                                                    className="p-2 bg-slate-700 hover:bg-emerald-600 rounded-full text-white transition-all shadow-lg"
                                                    title={property.status === 'pendente' ? 'Editar (Aguardando Aprovação)' : 'Editar'}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}

                                            {/* Action Button: Inactivate vs Reactivate */}
                                            {property.status === 'ativo' ? (
                                                <button
                                                    onClick={() => handleInactivateClick(property)}
                                                    className="p-2 bg-slate-700 hover:bg-yellow-600 rounded-full text-white transition-all shadow-lg"
                                                    title="Inativar / Baixar"
                                                >
                                                    <EyeOff size={16} />
                                                </button>
                                            ) : (property.status !== 'pendente') && (
                                                <button
                                                    onClick={() => handleChangeStatus(property.id, 'reativar')}
                                                    className="p-2 bg-slate-700 hover:bg-emerald-600 rounded-full text-white transition-all shadow-lg"
                                                    title="Reativar e Enviar para Aprovação"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                        </>
                                    }
                                />
                            </div>
                        ))}
                    </div>
                )}

                {view === 'list' && (
                    <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-900/80 border-b border-white/10 text-xs uppercase tracking-wider">
                                        <th className="p-3 text-center text-slate-400 font-semibold w-16">AÇÕES</th>
                                        <th className="p-3 text-center text-slate-400 font-semibold w-16">
                                            <button onClick={() => handleSort('cod_imovel')} className="flex items-center gap-1 mx-auto text-slate-400 hover:text-white">
                                                CÓD. {getSortIcon('cod_imovel')}
                                            </button>
                                        </th>
                                        <th className="p-3 text-left text-slate-400 font-semibold min-w-[200px]">
                                            <button onClick={() => handleSort('titulo')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                                IMÓVEL {getSortIcon('titulo')}
                                            </button>
                                        </th>
                                        <th className="p-3 text-left text-slate-400 font-semibold min-w-[120px]">
                                            <button onClick={() => handleSort('cidade')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                                CIDADE {getSortIcon('cidade')}
                                            </button>
                                        </th>
                                        <th className="p-3 text-left text-slate-400 font-semibold min-w-[120px]">
                                            <button onClick={() => handleSort('bairro')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                                BAIRRO {getSortIcon('bairro')}
                                            </button>
                                        </th>
                                        <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Quartos">
                                            <button onClick={() => handleSort('quartos')} className="mx-auto flex items-center justify-center hover:text-white transition-colors">
                                                <Bed size={14} />
                                            </button>
                                        </th>
                                        <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Banheiros">
                                            <button onClick={() => handleSort('banheiros')} className="mx-auto flex items-center justify-center hover:text-white transition-colors">
                                                <Bath size={14} />
                                            </button>
                                        </th>
                                        <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Vagas">
                                            <button onClick={() => handleSort('vagas')} className="mx-auto flex items-center justify-center hover:text-white transition-colors">
                                                <Car size={14} />
                                            </button>
                                        </th>
                                        <th className="p-3 text-center text-slate-400 font-semibold w-16" title="Área Privativa">
                                            <button onClick={() => handleSort('area_priv')} className="mx-auto flex items-center justify-center gap-1 hover:text-white transition-colors">
                                                <Maximize2 size={14} />
                                            </button>
                                        </th>
                                        <th className="p-3 text-right text-slate-400 font-semibold min-w-[120px]">
                                            <button onClick={() => handleSort('valor_venda')} className="flex items-center gap-1 ml-auto text-slate-400 hover:text-white transition-colors">
                                                VALORES {getSortIcon('valor_venda')}
                                            </button>
                                        </th>
                                        <th className="p-3 text-center text-slate-400 font-semibold w-20">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProperties.map((property) => {
                                        const tipoImovel = typeof property.tipo_imovel === 'string' ? property.tipo_imovel : property.tipo_imovel?.tipo || '';
                                        const operacao = property.operacao || '';

                                        return (
                                            <tr
                                                key={property.id}
                                                className="border-b border-white/5 hover:bg-slate-800/50 transition-colors"
                                            >
                                                {/* Ações */}
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => navigate(`/properties/${property.slug || property.id}`)}
                                                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                                                            title="Ver Detalhes"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        {property.status !== 'excluido' && (
                                                            <button
                                                                onClick={() => navigate(`/add-property?edit=${property.id}`)}
                                                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                                                                title={property.status === 'pendente' ? 'Editar (Aguardando Aprovação)' : 'Editar'}
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                        )}
                                                        {property.status === 'ativo' ? (
                                                            <button
                                                                onClick={() => handleInactivateClick(property)}
                                                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400 transition-all"
                                                                title="Inativar"
                                                            >
                                                                <EyeOff size={14} />
                                                            </button>
                                                        ) : (property.status !== 'pendente') && (
                                                            <button
                                                                onClick={() => handleChangeStatus(property.id, 'reativar')}
                                                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                                                                title="Reativar"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Código */}
                                                <td className="p-3 text-center">
                                                    <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-mono">
                                                        {property.cod_imovel || property.id?.slice(0, 6)}
                                                    </span>
                                                </td>

                                                {/* Imóvel (Título + Badges) */}
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-white font-medium line-clamp-1">
                                                            {property.titulo || 'Sem título'}
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {tipoImovel && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-600 text-slate-200 uppercase tracking-wider">
                                                                    {tipoImovel}
                                                                </span>
                                                            )}
                                                            {operacao && (
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${(() => {
                                                                    const op = operacao.toLowerCase();
                                                                    if (op.includes('venda') && op.includes('loca')) return 'bg-emerald-600 text-white'; // Green
                                                                    if (op.includes('venda')) return 'bg-red-500 text-white'; // Red
                                                                    if (op.includes('temporada')) return 'bg-orange-500 text-white'; // Orange
                                                                    return 'bg-blue-600 text-white'; // Blue (Locacao default)
                                                                })()}`}>
                                                                    {operacao}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Cidade */}
                                                <td className="p-3 text-slate-300 font-medium">
                                                    {property.cidade || '-'}
                                                </td>

                                                {/* Bairro */}
                                                <td className="p-3 text-slate-300">
                                                    {property.bairro || '-'}
                                                </td>

                                                {/* Quartos */}
                                                <td className="p-3 text-center text-slate-300">
                                                    {property.quartos || '-'}
                                                </td>

                                                {/* Banheiros */}
                                                <td className="p-3 text-center text-slate-300">
                                                    {property.banheiros || '-'}
                                                </td>

                                                {/* Vagas */}
                                                <td className="p-3 text-center text-slate-300">
                                                    {property.vagas || '-'}
                                                </td>

                                                {/* Área */}
                                                <td className="p-3 text-center text-slate-300">
                                                    {property.area_priv ? `${property.area_priv}m²` : '-'}
                                                </td>

                                                {/* Valores */}
                                                <td className="p-3 text-right">
                                                    <span className="text-emerald-400 font-bold">
                                                        {property.valor_venda
                                                            ? formatCurrency(property.valor_venda)
                                                            : property.valor_locacao
                                                                ? formatCurrency(property.valor_locacao)
                                                                : '-'}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="p-3 text-center">
                                                    {renderStatusBadge(property.status)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredProperties.length === 0 && (
                            <div className="p-12 text-center">
                                <Home size={48} className="text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Nenhum imóvel encontrado</h3>
                                <p className="text-slate-400 mb-6">Comece adicionando seu primeiro anúncio!</p>
                                <button
                                    onClick={() => navigate('/add-property')}
                                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all"
                                >
                                    <Plus size={20} />
                                    Novo Anúncio
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {view === 'map' && (
                    <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden h-[450px] md:h-[500px]">
                        <PropertyMap
                            properties={filteredProperties}
                            isDashboard={true}
                        />
                    </div>
                )}
            </div>

            {/* Inactivation Modal */}
            <DeactivatePropertyModal
                isOpen={inactivationModalOpen}
                onClose={() => {
                    setInactivationModalOpen(false);
                    setSelectedPropertyToInactivate(null);
                }}
                propertyId={selectedPropertyToInactivate?.id || ''}
                propertyTitle={selectedPropertyToInactivate?.titulo || ''}
                onSuccess={() => {
                    fetchProperties();
                    setSelectedPropertyToInactivate(null);
                }}
            />
        </div>
    );
}

export default MyPropertiesPage;
