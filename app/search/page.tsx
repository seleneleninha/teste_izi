"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Search, Grid, Map as MapIcon, Loader2, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { supabase } from '@/lib/supabaseClient';
import { PropertyCard } from '@/components/PropertyCard';
import { HorizontalScroll } from '@/components/HorizontalScroll';
import { Footer } from '@/components/Footer';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/components/AuthContext';

// Dynamic import for PropertyMap to avoid SSR issues with Leaflet
const PropertyMap = dynamic(() => import('@/components/PropertyMap'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center rounded-2xl">Carregando mapa...</div>
});

interface Property {
    id: string;
    cod_imovel?: number;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number;
    valor_locacao: number;
    fotos: string[];
    operacao: string;
    tipo_imovel: string;
    quartos?: number;
    banheiros?: number;
    vagas?: number;
    area_priv?: number;
    latitude?: number;
    longitude?: number;
    user_id?: string;
    status_aprovacao?: string;
}

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [view, setView] = useState<'grid' | 'map'>('grid');
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

    // Filters
    const [selectedType, setSelectedType] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOperation, setSelectedOperation] = useState('');

    // Parse URL params on mount
    useEffect(() => {
        const typeParam = searchParams.get('tipo') || '';
        let qParam = searchParams.get('q') || '';
        const viewParam = searchParams.get('view');
        const operacaoParam = searchParams.get('operacao') || '';
        const priceParam = searchParams.get('price') || '';
        const cidadeParam = searchParams.get('cidade');
        const bairroParam = searchParams.get('bairro');
        const brokerParam = searchParams.get('broker') || '';

        // If city or neighborhood params exist, use them as search term if q is empty
        if (!qParam) {
            if (cidadeParam) qParam = cidadeParam;
            if (bairroParam) qParam = bairroParam;
        }

        setSelectedType(typeParam);
        setSearchTerm(qParam);
        if (viewParam === 'map') setView('map');
        setSelectedOperation(operacaoParam);
        setSelectedPriceRange(priceParam);

        // Fetch with URL params
        fetchProperties(typeParam, operacaoParam, qParam, priceParam, brokerParam);
    }, [searchParams]);

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
        priceOverride?: string,
        brokerSlugOverride?: string
    ) => {
        setLoading(true);
        try {
            const type = typeOverride !== undefined ? typeOverride : selectedType;
            const operacao = operacaoOverride !== undefined ? operacaoOverride : selectedOperation;
            const term = termOverride !== undefined ? termOverride : searchTerm;
            const priceRange = priceOverride !== undefined ? priceOverride : selectedPriceRange;
            const brokerSlug = brokerSlugOverride !== undefined ? brokerSlugOverride : '';

            // Handle broker-specific search
            if (brokerSlug) {
                const { data: brokerData, error: brokerError } = await supabase
                    .from('perfis')
                    .select('id')
                    .eq('slug', brokerSlug)
                    .single();

                if (brokerError || !brokerData) {
                    console.error('Error fetching broker:', brokerError);
                    setLoading(false);
                    return;
                }

                const brokerId = brokerData.id;

                // Fetch broker's own properties
                const ownPropertiesQuery = supabase
                    .from('anuncios')
                    .select(`*, tipo_imovel!inner (tipo), operacao (tipo)`)
                    .eq('user_id', brokerId)
                    .eq('status_aprovacao', 'aprovado')
                    .order('created_at', { ascending: false });

                // Fetch partnership properties
                const { data: partnershipsData } = await supabase
                    .from('parcerias')
                    .select('property_id')
                    .eq('user_id', brokerId);

                const partnershipPropertyIds = partnershipsData?.map(p => p.property_id) || [];

                const partnerPropertiesQuery = partnershipPropertyIds.length > 0
                    ? supabase
                        .from('anuncios')
                        .select(`*, tipo_imovel!inner (tipo), operacao (tipo)`)
                        .in('id', partnershipPropertyIds)
                        .eq('status_aprovacao', 'aprovado')
                        .order('created_at', { ascending: false })
                    : null;

                const [ownResult, partnerResult] = await Promise.all([
                    ownPropertiesQuery,
                    partnerPropertiesQuery
                ]);

                const combinedData = [
                    ...(ownResult.data || []),
                    ...(partnerResult?.data || [])
                ];

                const uniqueData = Array.from(new Map(combinedData.map(item => [item.id, item])).values());
                let filteredData = applyClientFilters(uniqueData, type, term, operacao, priceRange);

                setProperties(formatProperties(filteredData));
                setLoading(false);
                return;
            }

            // Regular query (no broker filter)
            let query = supabase
                .from('anuncios')
                .select(`*, tipo_imovel!inner (tipo), operacao (tipo)`)
                .eq('status_aprovacao', 'aprovado')
                .order('created_at', { ascending: false });

            if (type) {
                query = query.ilike('tipo_imovel.tipo', type);
            }
            if (term) {
                const searchFilter = `titulo.ilike.%${term}%,descricao.ilike.%${term}%,bairro.ilike.%${term}%,cidade.ilike.%${term}%,uf.ilike.%${term}%`;
                query = query.or(searchFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                let filteredData = applyClientFilters(data, type, term, operacao, priceRange);
                setProperties(formatProperties(filteredData));
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyClientFilters = (data: any[], type: string, term: string, operacao: string, priceRange: string) => {
        let filteredData = data;

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

        return filteredData;
    };

    const formatProperties = (data: any[]): Property[] => {
        return data.map(p => ({
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
            user_id: p.user_id,
            status_aprovacao: p.status_aprovacao
        }));
    };

    const clearFilters = () => {
        setSelectedOperation('');
        setSelectedType('');
        setSelectedPriceRange('');
        setSearchTerm('');
        fetchProperties('', '', '', '', '');
    };

    const handleSearch = () => {
        fetchProperties();
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen flex flex-col pt-20">
            <div className="container mx-auto px-4 py-8 flex-1">
                {/* Header Controls */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Buscar Imóveis
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Explore oportunidades e encontre o imóvel ideal.
                        </p>
                    </div>

                    <div className="w-full xl:w-auto flex flex-col md:flex-row gap-4">
                        {/* Filters Row */}
                        <div className="flex-1 grid grid-cols-2 md:flex gap-2">
                            <select
                                value={selectedOperation}
                                onChange={e => setSelectedOperation(e.target.value)}
                                className="col-span-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="" className="dark:bg-slate-800">Operação</option>
                                <option value="venda" className="dark:bg-slate-800">Venda</option>
                                <option value="locacao" className="dark:bg-slate-800">Locação</option>
                            </select>
                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="col-span-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
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
                                className="col-span-2 md:w-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="" className="dark:bg-slate-800">Faixa de Preço</option>
                                <option value="0-200000" className="dark:bg-slate-800">até R$200mil</option>
                                <option value="200000-500000" className="dark:bg-slate-800">R$200k - R$500k</option>
                                <option value="500000-1000000" className="dark:bg-slate-800">R$500k - R$1M</option>
                                <option value="1000000-2000000" className="dark:bg-slate-800">R$1M - R$2M</option>
                                <option value="2000000-100000000" className="dark:bg-slate-800">acima de R$2M</option>
                            </select>
                        </div>

                        {/* Actions Row */}
                        <div className="flex gap-2 items-center justify-between md:justify-start">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSearch}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    <Search size={18} />
                                    <span className="hidden sm:inline">Buscar</span>
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="bg-red-500 dark:bg-red-700 text-white hover:bg-red-600 dark:hover:bg-red-600 font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <X size={18} />
                                    <span className="hidden sm:inline ml-1">Limpar</span>
                                </button>
                            </div>

                            <div className="h-8 w-px bg-gray-300 dark:bg-slate-700 hidden md:block mx-1"></div>

                            <div className="flex gap-2">
                                <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setView('grid')}
                                        className={`p-2 rounded-md transition-all ${view === 'grid' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                        title="Visualização em Grid"
                                    >
                                        <Grid size={20} />
                                    </button>
                                    <button
                                        onClick={() => setView('map')}
                                        className={`p-2 rounded-md transition-all ${view === 'map' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                        title="Mapa"
                                    >
                                        <MapIcon size={20} />
                                    </button>
                                </div>

                                {user && (
                                    <button
                                        onClick={() => router.push('/dashboard/add-property')}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
                                    >
                                        + Anunciar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-[400px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-emerald-500" size={48} />
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Nenhum imóvel encontrado.</p>
                            <p className="text-sm">Tente ajustar seus filtros.</p>
                        </div>
                    ) : (
                        <>
                            {view === 'map' ? (
                                <div className="h-[500px] rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-lg">
                                    <PropertyMap properties={properties} />
                                </div>
                            ) : (
                                <div className="w-full">
                                    <HorizontalScroll itemsPerPage={4} itemWidth={320}>
                                        {properties.map(prop => (
                                            <div key={prop.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                                <PropertyCard property={prop} />
                                            </div>
                                        ))}
                                    </HorizontalScroll>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

// Wrap in Suspense for useSearchParams
export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
