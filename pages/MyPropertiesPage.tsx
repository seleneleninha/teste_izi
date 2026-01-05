import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { formatCurrency } from '../lib/formatters';
import {
    Grid, List, Map, Search, Filter, Loader2, Plus, Edit, Trash2, Eye, EyeOff,
    ChevronUp, ChevronDown, Check, X, ArrowUpDown, Home, Building, MapPin,
    Bed, Bath, Car, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MyPropertiesPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const { addToast } = useToast();

    const [view, setView] = useState<'grid' | 'list' | 'map'>('list');
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo'>('all');
    const [filterOperation, setFilterOperation] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');

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

    // Toggle property status (ativo/inativo)
    const togglePropertyStatus = async (propertyId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
        try {
            const { error } = await supabase
                .from('anuncios')
                .update({ status: newStatus })
                .eq('id', propertyId);

            if (error) throw error;
            addToast(`Imóvel ${newStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso!`, 'success');
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Meus Imóveis</h1>
                    <p className="text-slate-400">Gerencie e mantenha seus anúncios atualizados.</p>
                </div>
                <button
                    onClick={() => navigate('/add-property')}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all"
                >
                    <Plus size={20} />
                    Novo Anúncio
                </button>
            </div>

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
                            <option value="inativo">Inativos</option>
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
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedProperties.length > 0 && (
                    <div className="mt-4 flex items-center gap-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <span className="text-emerald-400 font-medium">
                            {selectedProperties.length} selecionado(s)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('activate')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Ativar
                            </button>
                            <button
                                onClick={() => handleBulkAction('deactivate')}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Inativar
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Excluir
                            </button>
                        </div>
                        <button
                            onClick={() => setSelectedProperties([])}
                            className="ml-auto text-slate-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-slate-400">
                    <span className="text-white font-bold">{filteredProperties.length}</span> imóveis encontrados
                </p>
            </div>

            {/* Content */}
            {view === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProperties.map(property => (
                        <div key={property.id} className="relative group">
                            {/* Checkbox */}
                            <div className="absolute top-3 left-3 z-10">
                                <button
                                    onClick={() => toggleSelect(property.id)}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${selectedProperties.includes(property.id)
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'bg-black/50 border-white/50 hover:border-emerald-400'
                                        }`}
                                >
                                    {selectedProperties.includes(property.id) && <Check size={14} className="text-white" />}
                                </button>
                            </div>
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3 z-10">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${property.status === 'ativo' ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'
                                    }`}>
                                    {property.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <PropertyCard property={property} />
                            {/* Quick Actions */}
                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => navigate(`/add-property?edit=${property.id}`)}
                                    className="p-2 bg-slate-900/90 hover:bg-emerald-600 rounded-lg text-white transition-all"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => togglePropertyStatus(property.id, property.status)}
                                    className="p-2 bg-slate-900/90 hover:bg-yellow-600 rounded-lg text-white transition-all"
                                    title={property.status === 'ativo' ? 'Inativar' : 'Ativar'}
                                >
                                    {property.status === 'ativo' ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
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
                                    <th className="p-3 text-left w-16">
                                        <button
                                            onClick={toggleSelectAll}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedProperties.length === filteredProperties.length && filteredProperties.length > 0
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-slate-600 hover:border-emerald-400'
                                                }`}
                                        >
                                            {selectedProperties.length === filteredProperties.length && filteredProperties.length > 0 && (
                                                <Check size={12} className="text-white" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-16">AÇÕES</th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-16">
                                        <button onClick={() => handleSort('cod_imovel')} className="flex items-center gap-1 mx-auto text-slate-400 hover:text-white">
                                            CÓD. {getSortIcon('cod_imovel')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-left text-slate-400 font-semibold min-w-[200px]">
                                        <button onClick={() => handleSort('titulo')} className="flex items-center gap-1 text-slate-400 hover:text-white">
                                            IMÓVEL {getSortIcon('titulo')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-left text-slate-400 font-semibold min-w-[140px]">
                                        <button onClick={() => handleSort('cidade')} className="flex items-center gap-1 text-slate-400 hover:text-white">
                                            LOCALIZAÇÃO {getSortIcon('cidade')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Quartos">
                                        <Bed size={14} className="mx-auto" />
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Banheiros">
                                        <Bath size={14} className="mx-auto" />
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Vagas">
                                        <Car size={14} className="mx-auto" />
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-16" title="Área">
                                        <Maximize2 size={14} className="mx-auto" />
                                    </th>
                                    <th className="p-3 text-right text-slate-400 font-semibold min-w-[120px]">
                                        <button onClick={() => handleSort('valor_venda')} className="flex items-center gap-1 ml-auto text-slate-400 hover:text-white">
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
                                            className={`border-b border-white/5 hover:bg-slate-800/50 transition-colors ${selectedProperties.includes(property.id) ? 'bg-emerald-500/10' : ''}`}
                                        >
                                            {/* Checkbox */}
                                            <td className="p-3">
                                                <button
                                                    onClick={() => toggleSelect(property.id)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedProperties.includes(property.id)
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'border-slate-600 hover:border-emerald-400'
                                                        }`}
                                                >
                                                    {selectedProperties.includes(property.id) && <Check size={12} className="text-white" />}
                                                </button>
                                            </td>

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
                                                    <button
                                                        onClick={() => navigate(`/add-property?edit=${property.id}`)}
                                                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => togglePropertyStatus(property.id, property.status)}
                                                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-yellow-400 transition-all"
                                                        title={property.status === 'ativo' ? 'Inativar' : 'Ativar'}
                                                    >
                                                        {property.status === 'ativo' ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
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
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-600 text-slate-200">
                                                                {tipoImovel}
                                                            </span>
                                                        )}
                                                        {operacao && (
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${operacao.toLowerCase().includes('venda')
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-blue-600 text-white'
                                                                }`}>
                                                                {operacao}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Localização */}
                                            <td className="p-3">
                                                <div className="flex flex-col text-slate-300">
                                                    <span className="font-medium">{property.cidade || '-'}</span>
                                                    <span className="text-xs text-slate-500">{property.bairro || '-'}</span>
                                                </div>
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
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${property.status === 'ativo'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${property.status === 'ativo' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                                    {property.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                                </span>
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
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden" style={{ height: '600px' }}>
                    <PropertyMap
                        properties={filteredProperties}
                    />
                </div>
            )}
        </div>
    );
};
