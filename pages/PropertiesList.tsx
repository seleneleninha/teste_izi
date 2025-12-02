import React, { useState, useEffect } from 'react';
import { MOCK_PROPERTIES } from '../constants';
import { MapPin, Bed, Bath, Square, Filter, Search, Grid, List, Map as MapIcon, CheckSquare, Loader2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PropertyCard } from '../components/PropertyCard';
import { useNavigate } from 'react-router-dom';
import { PropertyMap } from '../components/PropertyMap';
import { useToast } from '../components/ToastContext';

import { useAuth } from '../components/AuthContext';
import { useLocation } from 'react-router-dom';

export const PropertiesList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

    // Filters
    const [selectedType, setSelectedType] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOperation, setSelectedOperation] = useState('');

    const isMyProperties = location.pathname === '/properties';

    // Consolidated effect to handle URL params and fetching
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const typeParam = params.get('tipo') || '';
        let qParam = params.get('q') || '';
        const viewParam = params.get('view');
        const operacaoParam = params.get('operacao') || '';
        const priceParam = params.get('price') || '';
        const cidadeParam = params.get('cidade');
        const bairroParam = params.get('bairro');

        // If city or neighborhood params exist, use them as search term if q is empty
        if (!qParam) {
            if (cidadeParam) qParam = cidadeParam;
            if (bairroParam) qParam = bairroParam;
        }

        // Update state from URL
        // For type, we might need to normalize case to match dropdown options
        // But for now, we'll just set it. The query uses ilike so it will fetch correctly.
        // The dropdown might not show selected if case differs, we'll fix that in render.
        setSelectedType(typeParam);
        setSearchTerm(qParam);
        if (viewParam === 'map') setView('map');
        setSelectedOperation(operacaoParam);
        setSelectedPriceRange(priceParam);

        // Fetch properties with these params directly to avoid race conditions
        fetchProperties(typeParam, operacaoParam, qParam, priceParam);
    }, [location.search, isMyProperties, user]);

    useEffect(() => {
        fetchPropertyTypes();
    }, []);

    const fetchPropertyTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('tipo_imovel')
                .select('tipo')
                .order('tipo');

            if (error) throw error;
            if (data) {
                setPropertyTypes(data.map(item => item.tipo));
            }
        } catch (error) {
            console.error('Error fetching property types:', error);
        }
    };

    const fetchProperties = async (
        typeOverride?: string,
        operacaoOverride?: string,
        termOverride?: string,
        priceOverride?: string
    ) => {
        setLoading(true);
        try {
            // Use overrides if provided, otherwise use state
            const type = typeOverride !== undefined ? typeOverride : selectedType;
            const operacao = operacaoOverride !== undefined ? operacaoOverride : selectedOperation;
            const term = termOverride !== undefined ? termOverride : searchTerm;
            const priceRange = priceOverride !== undefined ? priceOverride : selectedPriceRange;

            let query = supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel!inner (
                        tipo
                    ),
                    operacao (
                        tipo
                    )
                `)
                .order('created_at', { ascending: false });

            // Filter by user if on "Meus Imóveis"
            if (isMyProperties && user) {
                query = query.eq('user_id', user.id);
                query = query.neq('status_aprovacao', 'inativo');
            } else {
                query = query.neq('status_aprovacao', 'inativo');
            }

            // Apply filters using local variables
            if (type) {
                // Use ilike for case-insensitive matching
                query = query.ilike('tipo_imovel.tipo', type);
            }
            if (term) {
                const searchFilter = `titulo.ilike.%${term}%,descricao.ilike.%${term}%,bairro.ilike.%${term}%,cidade.ilike.%${term}%,uf.ilike.%${term}%`;
                query = query.or(searchFilter);
            }

            const { data, error } = await query;

            if (data) {
                let filteredData = data;

                // Client-side filtering for complex relations or logic
                if (operacao) {
                    filteredData = filteredData.filter(p => {
                        const operacaoTipo = p.operacao?.tipo?.toLowerCase();
                        if (operacao === 'venda') {
                            return operacaoTipo === 'venda' || operacaoTipo === 'venda/locação' || operacaoTipo === 'venda/locacao';
                        } else if (operacao === 'locacao') {
                            return operacaoTipo === 'locação' || operacaoTipo === 'locacao' || operacaoTipo === 'venda/locação' || operacaoTipo === 'venda/locacao';
                        }
                        return true;
                    });
                }
                if (priceRange) {
                    const [min, max] = priceRange.split('-').map(Number);
                    filteredData = filteredData.filter(p => {
                        const price = p.valor_venda || p.valor_locacao || 0;
                        return price >= min && price <= max;
                    });
                }

                const formattedProperties = filteredData.map(p => ({
                    id: p.id,
                    cod_imovel: p.cod_imovel,
                    titulo: p.titulo,
                    cidade: p.cidade,
                    bairro: p.bairro,
                    valor_venda: p.valor_venda,
                    valor_locacao: p.valor_locacao,
                    fotos: p.fotos ? p.fotos.split(',') : [],
                    operacao: p.operacao?.tipo || p.operacao,
                    tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                    quartos: p.quartos,
                    banheiros: p.banheiros,
                    vagas: p.vagas,
                    area_priv: p.area_priv,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    user_id: p.user_id
                }));
                setProperties(formattedProperties);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!confirm('Tem certeza que deseja inativar este imóvel? Ele não aparecerá mais nas buscas.')) return;

        try {
            const { error } = await supabase
                .from('anuncios')
                .update({ status_aprovacao: 'inativo' })
                .eq('id', id)
                .eq('user_id', user?.id);

            if (error) throw error;

            addToast('Imóvel inativado com sucesso!', 'success');
            fetchProperties(); // Refresh list
        } catch (error) {
            console.error('Error inactivating property:', error);
            addToast('Erro ao inativar imóvel.', 'error');
        }
    };

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedProperties.includes(id)) {
            setSelectedProperties(prev => prev.filter(p => p !== id));
        } else {
            if (selectedProperties.length < 3) {
                setSelectedProperties(prev => [...prev, id]);
            } else {
                addToast('You can compare up to 3 properties.', 'warning');
            }
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Header Controls */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isMyProperties ? 'Meus Imóveis' : 'Buscar Imóveis'}
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            {isMyProperties ? 'Gerencie seus anúncios.' : 'Encontre o imóvel ideal.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">

                        {/* Filters */}
                        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                            <select
                                value={selectedOperation}
                                onChange={e => setSelectedOperation(e.target.value)}
                                className="w-full md:w-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                                <option value="" className="dark:bg-slate-800">Operação</option>
                                <option value="venda" className="dark:bg-slate-800">Venda</option>
                                <option value="locacao" className="dark:bg-slate-800">Locação</option>
                            </select>
                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="w-full md:w-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                                <option value="" className="dark:bg-slate-800">Tipo</option>
                                {propertyTypes.map((type, idx) => (
                                    <option key={idx} value={type} className="dark:bg-slate-800">
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedPriceRange}
                                onChange={e => setSelectedPriceRange(e.target.value)}
                                className="w-full md:w-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                                <option value="" className="dark:bg-slate-800">Faixa de Preço</option>
                                <option value="0-200000" className="dark:bg-slate-800">até R$200mil</option>
                                <option value="200000-500000" className="dark:bg-slate-800">de R$200mil a R$500mil</option>
                                <option value="500000-1000000" className="dark:bg-slate-800">de R$500mil a R$1M</option>
                                <option value="1000000-2000000" className="dark:bg-slate-800">de R$1M a R$2M</option>
                                <option value="2000000-100000000" className="dark:bg-slate-800">acima de R$2M</option>
                            </select>
                            <button
                                onClick={() => fetchProperties()}
                                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                <Search size={18} />
                                BUSCAR
                            </button>
                        </div>

                        <div className="h-8 w-px bg-gray-300 dark:bg-slate-700 hidden md:block mx-2"></div>

                        {/* View Toggles */}
                        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700">
                            <button
                                onClick={() => setView('grid')}
                                className={`p-2 rounded-md transition-colors ${view === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                            >
                                <Grid size={25} />
                            </button>
                            <button
                                onClick={() => setView('map')}
                                className={`p-2 rounded-md transition-colors ${view === 'map' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                            >
                                <MapIcon size={25} />
                            </button>
                        </div>

                        {user && (
                            <button
                                onClick={() => navigate('/add-property')}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                            >
                                + Adicionar
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {view === 'map' ? (
                        <div className="h-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                            <PropertyMap properties={properties} />
                        </div>
                    ) : (
                        <div className={`grid gap-6 pb-8 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                            {loading ? (
                                <div className="col-span-full flex justify-center py-10">
                                    <Loader2 className="animate-spin text-primary-500" size={32} />
                                </div>
                            ) : properties.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-gray-500">Nenhum imóvel encontrado.</div>
                            ) : (
                                properties.map(prop => (
                                    <PropertyCard
                                        key={prop.id}
                                        property={prop}
                                        actions={
                                            (user && prop.user_id === user.id) ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/add-property?id=${prop.id}`);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-yellow-600/10 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-600/20 flex items-center justify-center transition-colors"
                                                    >
                                                        <Edit2 size={16} className="mr-1.5" /> Editar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteProperty(prop.id);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-red-600/10 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/20 flex items-center justify-center transition-colors"
                                                    >
                                                        <Trash2 size={16} className="mr-1.5" /> Inativar
                                                    </button>
                                                </>
                                            ) : undefined
                                        }
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};