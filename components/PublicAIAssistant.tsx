// Public AI Assistant for iziBrokerz
// Helps buyers/renters find properties and brokers learn about the platform

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { callGemini } from '../lib/geminiHelper';
import { supabase } from '../lib/supabaseClient';
import {
    PLATFORM_KNOWLEDGE,
    qualifyLead,
    ConversationState,
    createEmptyConversationState,
    extractInfoFromMessage,
    calculateMatchScore,
    generateSmartSearchLink
} from '../lib/platformKnowledge';
import { getOrCreateConversation, saveMessageToDb } from '../lib/izaStorage';
import { generatePropertySlug } from '../lib/propertyHelpers';
import { calculateLeadScore, shouldNotifyBroker, generateLeadSummary, getLeadEmoji, getLeadColor } from '../lib/leadScoring';
import { CustomOrderModal } from './CustomOrderModal';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    links?: { text: string; url: string }[];
    quickActions?: QuickAction[];
}

interface QuickAction {
    id: string;
    text: string;
    actionText: string;
    category: 'operation' | 'type' | 'neighborhood' | 'price' | 'broker';
    icon?: string;
    count?: number;
}

interface PropertyMatch {
    id: string;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    valor_diaria: number | null;
    valor_mensal: number | null;
    operacao: string;
    tipo_imovel: string;
    slug: string;
    cod_imovel: number;
    quartos?: number;
    vagas?: number;
    area_priv?: number;
}

export const PublicAIAssistant: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: PLATFORM_KNOWLEDGE.voiceTone.responseVariations.greetings[Math.floor(Math.random() * PLATFORM_KNOWLEDGE.voiceTone.responseVariations.greetings.length)],
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversationState, setConversationState] = useState<ConversationState>(createEmptyConversationState());
    const [customOrderModalOpen, setCustomOrderModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Quick questions - Just 3 options
    const quickQuestions = [
        "Quero ALUGAR um imóvel",
        "Quero COMPRAR um imóvel",
        "Sou CORRETOR e quero virar PARCEIRO"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize conversation session
    useEffect(() => {
        const initSession = async () => {
            const id = await getOrCreateConversation();
            setConversationId(id);
        };
        initSession();
    }, []);

    // Get available cities and neighborhoods from database
    const getAvailableLocations = async (): Promise<{ cities: string[], neighborhoods: string[] }> => {
        try {
            const { data } = await supabase
                .from('anuncios')
                .select('cidade, bairro')
                .eq('status_aprovacao', 'aprovado');

            if (data) {
                const cities = [...new Set(data.map(p => p.cidade).filter(Boolean))];
                const neighborhoods = [...new Set(data.map(p => p.bairro).filter(Boolean))];
                return { cities, neighborhoods };
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
        return { cities: [], neighborhoods: [] };
    };

    // Search properties matching conversation state
    const searchMatchingProperties = async (state: ConversationState): Promise<PropertyMatch[]> => {
        try {
            console.log('🔍 SEARCH DEBUG - Starting search with state:', {
                operacao: state.operacao,
                tipoImovel: state.tipoImovel,
                cidade: state.cidade,
                bairro: state.bairro,
                bairros: state.bairros,
                valorMax: state.valorMax
            });

            // Helper to execute query
            const executeQuery = async (queryBairros: string[], maxPrice: number | undefined) => {
                console.log('🔍 SEARCH DEBUG - executeQuery called with:', { queryBairros, maxPrice });

                let query = supabase
                    .from('anuncios')
                    .select(`
                        id, 
                        titulo, 
                        cidade, 
                        bairro, 
                        valor_venda, 
                        valor_locacao, 
                        valor_diaria, 
                        valor_mensal,
                        cod_imovel,
                        quartos,
                        vagas,
                        area_priv,
                        operacao_rel:operacao(tipo),
                        tipo_imovel_rel:tipo_imovel(tipo)
                    `)
                    .eq('status_aprovacao', 'aprovado')
                    .limit(5);

                // Exclude properties already shown
                if (state.shownPropertyIds && state.shownPropertyIds.length > 0) {
                    query = query.not('id', 'in', `(${state.shownPropertyIds.join(',')})`);
                    console.log('🚫 EXCLUDING already shown properties:', state.shownPropertyIds);
                }

                if (state.cidade) {
                    query = query.ilike('cidade', `%${state.cidade}%`);
                    console.log('🔍 SEARCH DEBUG - Added cidade filter:', state.cidade);
                }

                // Handle multiple neighborhoods
                if (queryBairros.length === 1) {
                    query = query.ilike('bairro', `%${queryBairros[0]}%`);
                    console.log('🔍 SEARCH DEBUG - Added single bairro filter:', queryBairros[0]);
                } else if (queryBairros.length > 1) {
                    const orCondition = queryBairros.map(b => `bairro.ilike.%${b}%`).join(',');
                    query = query.or(orCondition);
                    console.log('🔍 SEARCH DEBUG - Added multiple bairros filter:', orCondition);
                }

                if (maxPrice) {
                    if (state.operacao === 'venda') {
                        query = query.lte('valor_venda', maxPrice);
                    } else if (state.operacao === 'locacao' || state.operacao === 'aluguel') {
                        query = query.lte('valor_locacao', maxPrice);
                    } else if (state.operacao === 'temporada') {
                        query = query.lte('valor_mensal', maxPrice);
                    }
                    console.log('🔍 SEARCH DEBUG - Added price filter:', { operacao: state.operacao, maxPrice });
                }

                const result = await query;
                console.log('🔍 SEARCH DEBUG - Query result:', {
                    error: result.error,
                    count: result.data?.length || 0,
                    data: result.data
                });

                return result;
            };

            // 1. First attempt: Strict match
            let searchBairros = (state.bairros || (state.bairro ? [state.bairro] : [])).filter(b => b && b.trim().length > 0);
            console.log('🔍 SEARCH DEBUG - Attempt 1: Strict match with bairros:', searchBairros);
            let { data, error } = await executeQuery(searchBairros, state.valorMax);

            // 2. Second attempt: Flexible Budget (+20%)
            if ((!data || data.length === 0) && state.valorMax) {
                const flexiblePrice = state.valorMax * 1.2;
                console.log('🔍 SEARCH DEBUG - Attempt 2: Flexible budget', flexiblePrice);
                const result = await executeQuery(searchBairros, flexiblePrice);
                data = result.data;
                error = result.error;
            }

            // 3. Third attempt: Same City, ANY Neighborhood
            if ((!data || data.length === 0) && state.cidade && searchBairros.length > 0) {
                console.log('🔍 SEARCH DEBUG - Attempt 3: City-wide search');
                const result = await executeQuery([], state.valorMax);
                data = result.data;
                error = result.error;
            }

            if (error) {
                console.error('🔍 SEARCH DEBUG - Query error:', error);
                return [];
            }

            if (!data || data.length === 0) {
                console.log('🔍 SEARCH DEBUG - No properties found');
                return [];
            }

            console.log('🔍 SEARCH DEBUG - Raw data received:', data.length, 'properties');

            // Map and filter results - extract nested objects from JOIN
            const mapped = data.map(p => {
                const operacaoTipo = (p as any).operacao_rel?.tipo || '';
                const tipoImovel = (p as any).tipo_imovel_rel?.tipo || '';

                console.log(`🔍 Mapping property "${p.titulo}":`, {
                    operacao_rel: (p as any).operacao_rel,
                    tipo_imovel_rel: (p as any).tipo_imovel_rel,
                    operacaoTipo,
                    tipoImovel,
                    cod_imovel: p.cod_imovel
                });

                return {
                    id: p.id,
                    titulo: p.titulo || '',
                    cidade: p.cidade || '',
                    bairro: p.bairro || '',
                    valor_venda: p.valor_venda,
                    valor_locacao: p.valor_locacao,
                    valor_diaria: p.valor_diaria,
                    valor_mensal: p.valor_mensal,
                    cod_imovel: p.cod_imovel,
                    quartos: p.quartos,
                    vagas: p.vagas,
                    area_priv: p.area_priv,
                    operacao: operacaoTipo,
                    tipo_imovel: tipoImovel,
                    slug: '' // Not in database, will generate from other fields
                };
            });

            console.log('🔍 SEARCH DEBUG - Mapped properties:', mapped);

            const filtered = mapped.filter(p => {
                // Filter by operacao if specified
                if (state.operacao) {
                    const opLower = p.operacao.toLowerCase();
                    console.log(`🔍 Checking property "${p.titulo}" - operacao in DB: "${p.operacao}" | searching for: "${state.operacao}"`);

                    if (state.operacao === 'venda' && !opLower.includes('venda')) {
                        console.log('🔍 SEARCH DEBUG - Filtered out (operacao):', p.titulo);
                        return false;
                    }
                    if ((state.operacao === 'locacao' || state.operacao === 'aluguel') &&
                        !opLower.includes('locação') && !opLower.includes('locacao') && !opLower.includes('aluguel')) {
                        console.log('🔍 SEARCH DEBUG - Filtered out (operacao):', p.titulo);
                        return false;
                    }
                    if (state.operacao === 'temporada' && !opLower.includes('temporada')) {
                        console.log('🔍 SEARCH DEBUG - Filtered out (operacao):', p.titulo);
                        return false;
                    }
                }
                // Filter by tipo if specified
                if (state.tipoImovel) {
                    const tipoLower = p.tipo_imovel.toLowerCase();
                    if (!tipoLower.includes(state.tipoImovel)) {
                        console.log('🔍 SEARCH DEBUG - Filtered out (tipo):', p.titulo);
                        return false;
                    }
                }
                console.log('✅ SEARCH DEBUG - Property passed filters:', p.titulo);
                return true;
            });

            console.log('🔍 SEARCH DEBUG - Final filtered count:', filtered.length);
            return filtered as PropertyMatch[];
        } catch (error) {
            console.error('🔍 SEARCH DEBUG - Exception:', error);
            return [];
        }
    };

    // Generate property link using the official slug generator
    const generatePropertyLink = (property: PropertyMatch): string => {
        // Use the centralized slug generation function
        const slug = generatePropertySlug({
            tipo_imovel: property.tipo_imovel,
            quartos: property.quartos,
            bairro: property.bairro,
            cidade: property.cidade,
            vagas: property.vagas,
            area_priv: property.area_priv,
            operacao: property.operacao,
            valor_venda: property.valor_venda,
            valor_locacao: property.valor_locacao,
            cod_imovel: property.cod_imovel
        });

        console.log('🔗 Generated slug for property:', {
            titulo: property.titulo,
            cod_imovel: property.cod_imovel,
            slug
        });

        return `/${slug}`;
    };

    // Format currency
    const formatCurrency = (value: number): string => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
    };

    // Price ranges for quick actions
    const RENTAL_PRICE_RANGES = [
        { label: 'Até R$1mil', min: 0, max: 1000 },
        { label: 'R$1mil - R$2mil', min: 1000, max: 2000 },
        { label: 'R$2mil - R$3mil', min: 2000, max: 3000 },
        { label: 'R$3mil - R$4mil', min: 3000, max: 4000 },
        { label: 'R$4mil - R$5mil', min: 4000, max: 5000 },
        { label: 'R$5mil - R$7mil', min: 5000, max: 7000 },
        { label: 'R$7mil - R$10mil', min: 7000, max: 10000 },
        { label: 'Acima de R$10mil', min: 10000, max: 999999999 }
    ];

    const SALE_PRICE_RANGES = [
        { label: 'Até R$200mil', min: 0, max: 200000 },
        { label: 'R$200mil - R$300mil', min: 200000, max: 300000 },
        { label: 'R$300mil - R$500mil', min: 300000, max: 500000 },
        { label: 'R$500mil - R$700mil', min: 500000, max: 700000 },
        { label: 'R$700mil - R$1M', min: 700000, max: 1000000 },
        { label: 'Acima de R$1M', min: 1000000, max: 999999999 }
    ];

    // Generate Quick Actions based on conversation state
    const generateQuickActions = async (state: ConversationState, properties: PropertyMatch[]): Promise<QuickAction[]> => {
        const actions: QuickAction[] = [];

        // BROKER FLOW
        if (state.clientType === 'broker') {
            console.log('🎯 Generating BROKER badges');
            return [
                { id: 'broker-advertise', text: '📝 Anunciar Imóvel', actionText: 'Quero anunciar imóvel', category: 'broker', icon: '📝' },
                { id: 'broker-partner', text: '🤝 Ser Parceiro', actionText: 'Quero ser parceiro', category: 'broker', icon: '🤝' },
                { id: 'broker-plans', text: '💰 Ver Planos', actionText: 'Quais são os planos', category: 'broker', icon: '💰' },
                { id: 'broker-features', text: '✨ Funcionalidades', actionText: 'Quais funcionalidades da plataforma', category: 'broker', icon: '✨' }
            ];
        }

        // BUYER FLOW - Progressive funnel

        // 1. NO OPERATION → Show operation options + broker option
        if (!state.operacao) {
            console.log('🎯 Step 1: No operation - showing operation badges');
            return [
                { id: 'op-rent', text: 'Alugar', actionText: 'Quero alugar', category: 'operation', icon: '🔑' },
                { id: 'op-buy', text: 'Comprar', actionText: 'Quero comprar', category: 'operation', icon: '🏠' },
                { id: 'op-season', text: 'Temporada', actionText: 'Quero para temporada', category: 'operation', icon: '🏖️' },
                { id: 'broker', text: 'Sou Corretor', actionText: 'Sou corretor', category: 'broker', icon: '💼' }
            ];
        }

        // 2. HAS OPERATION, NO TYPE → Fetch and show available types
        if (state.operacao && !state.tipoImovel) {
            console.log('🎯 Step 2: Has operation, fetching types from DB');
            try {
                const operacaoMap: Record<string, string> = {
                    'locacao': 'Locação',
                    'venda': 'Venda',
                    'temporada': 'Temporada'
                };

                // Query to get available property types for this operation
                const { data: tiposData } = await supabase
                    .from('anuncios')
                    .select('tipo_imovel(tipo)')
                    .eq('status_aprovacao', 'aprovado')
                    .not('tipo_imovel', 'is', null);

                if (tiposData && tiposData.length > 0) {
                    const typeCounts: Record<string, number> = {};
                    tiposData.forEach((item: any) => {
                        const tipo = item.tipo_imovel?.tipo;
                        if (tipo) {
                            typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
                        }
                    });

                    const typeIcons: Record<string, string> = {
                        'Apartamento': '🏢',
                        'Casa': '🏡',
                        'Terreno': '🏗️',
                        'Comercial': '🏪',
                        'Rural': '🌾'
                    };

                    Object.entries(typeCounts).forEach(([tipo, count]) => {
                        actions.push({
                            id: `type-${tipo}`,
                            text: tipo,
                            actionText: tipo,
                            category: 'type',
                            icon: typeIcons[tipo] || '🏘️',
                            count
                        });
                    });

                    return actions;
                }
            } catch (error) {
                console.error('Error fetching types:', error);
            }

            // Fallback if DB query fails
            return [
                { id: 'type-apt', text: 'Apartamento', actionText: 'Apartamento', category: 'type', icon: '🏢' },
                { id: 'type-house', text: 'Casa', actionText: 'Casa', category: 'type', icon: '🏡' },
                { id: 'type-land', text: 'Terreno', actionText: 'Terreno', category: 'type', icon: '🏗️' }
            ];
        }

        // 3. HAS TYPE, NO BAIRRO → Fetch neighborhoods from DB
        if (state.tipoImovel && !state.bairro) {
            console.log('🎯 Step 3: Has type, fetching neighborhoods from DB');
            console.log('🔍 Searching for:', { operacao: state.operacao, tipoImovel: state.tipoImovel });
            try {
                // Query to get neighborhoods for this operation + type
                const { data: bairrosData } = await supabase
                    .from('anuncios')
                    .select('bairro, operacao(tipo), tipo_imovel(tipo)')
                    .eq('status_aprovacao', 'aprovado')
                    .not('bairro', 'is', null);

                if (bairrosData && bairrosData.length > 0) {
                    const neighborhoodCounts: Record<string, number> = {};

                    bairrosData.forEach((item: any) => {
                        const operacaoTipo = item.operacao?.tipo;
                        const tipoImovel = item.tipo_imovel?.tipo;
                        const bairro = item.bairro;

                        // Filter by current state
                        const matchesOperacao = !state.operacao ||
                            operacaoTipo?.toLowerCase().includes(state.operacao.toLowerCase()) ||
                            operacaoTipo?.includes('/'); // Venda/Locação matches both

                        const matchesTipo = tipoImovel?.toLowerCase() === state.tipoImovel?.toLowerCase();

                        if (matchesOperacao && matchesTipo && bairro) {
                            neighborhoodCounts[bairro] = (neighborhoodCounts[bairro] || 0) + 1;
                        }
                    });

                    if (Object.keys(neighborhoodCounts).length > 0) {
                        Object.entries(neighborhoodCounts)
                            .sort(([a], [b]) => a.localeCompare(b))  // Sort alphabetically
                            .forEach(([bairro, count]) => {
                                actions.push({
                                    id: `bairro-${bairro}`,
                                    text: `${bairro} (${count})`,
                                    actionText: bairro,
                                    category: 'neighborhood',
                                    icon: '📍',
                                    count
                                });
                            });

                        return actions;
                    }
                }
            } catch (error) {
                console.error('Error fetching neighborhoods:', error);
            }
        }

        // 4. HAS BAIRRO → Check property count to decide next step
        if (state.bairro && properties.length > 0) {
            console.log('🎯 Step 4: Has bairro, checking property count:', properties.length);

            // 4a. If ≤3 properties → Don't show price badges, just show property links directly
            if (properties.length <= 3) {
                console.log('✅ ≤3 properties found - showing links directly without price filter');
                return []; // No quick actions needed, links will be shown
            }

            // 4b. If >3 properties → Show price range badges to filter
            console.log('📊 >3 properties found - showing price ranges');
            const ranges = state.operacao === 'locacao' ? RENTAL_PRICE_RANGES : SALE_PRICE_RANGES;
            const priceField = state.operacao === 'locacao' ? 'valor_locacao' : 'valor_venda';

            ranges.forEach(range => {
                const count = properties.filter(p => {
                    const price = priceField === 'valor_locacao' ? p.valor_locacao : p.valor_venda;
                    return price && price >= range.min && price <= range.max;
                }).length;

                if (count > 0) {
                    actions.push({
                        id: `price-${range.min}-${range.max}`,
                        text: `${range.label} (${count})`,
                        actionText: `até ${range.max}`,
                        category: 'price',
                        icon: '💰',
                        count
                    });
                }
            });

            return actions;
        }

        // 5. NO PROPERTIES FOUND → Offer alternatives
        if (state.bairro && properties.length === 0) {
            console.log('🚨 No properties found - offering alternatives');

            // Option 1: Suggest searching nearby or expanding search
            actions.push({
                id: 'expand-search',
                text: '🔍 Ver bairros próximos',
                actionText: 'Mostrar bairros próximos',
                category: 'neighborhood',
                icon: '🔍'
            });

            // Option 2: Custom order (lead generation)
            actions.push({
                id: 'custom-order',
                text: '📝 Encomendar imóvel personalizado',
                actionText: 'Quero encomendar um im óvel',
                category: 'broker',
                icon: '📝'
            });

            return actions;
        }

        return actions;
    };

    // Get property context for AI
    const getPropertyContext = async (state: ConversationState): Promise<string> => {
        try {
            const { data: properties } = await supabase
                .from('anuncios')
                .select(`
                    id, titulo, cidade, bairro, valor_venda, valor_locacao, quartos,
                    operacao(tipo), tipo_imovel(tipo)
                `)
                .eq('status_aprovacao', 'aprovado')
                .limit(30);

            if (!properties) return '';

            const cities = [...new Set(properties.map(p => p.cidade))].filter(Boolean);
            const neighborhoods = [...new Set(properties.map(p => p.bairro))].filter(Boolean);

            const forSale = properties.filter(p => (p.operacao as any)?.tipo?.toLowerCase().includes('venda')).length;
            const forRent = properties.filter(p => (p.operacao as any)?.tipo?.toLowerCase().includes('locação')).length;
            const forSeasonal = properties.filter(p => (p.operacao as any)?.tipo?.toLowerCase().includes('temporada')).length;

            return `
DADOS DA PLATAFORMA:
- Total de imóveis: ${properties.length}
- Cidades: ${cities.join(', ')}
- Bairros: ${neighborhoods.slice(0, 15).join(', ')}
- À venda: ${forSale} | Para locação: ${forRent} | Para temporada: ${forSeasonal}

INFORMAÇÕES JÁ COLETADAS DO CLIENTE:
- Operação: ${state.operacao || 'Não informada'}
- Tipo de imóvel: ${state.tipoImovel || 'Não informado'}
- Cidade: ${state.cidade || 'Não informada'}
- Bairro: ${state.bairro || 'Não informado'}
- Valor máximo: ${state.valorMax ? formatCurrency(state.valorMax) : 'Não informado'}
- Quartos: ${state.quartos || 'Não informado'}
- Perguntas já respondidas: ${state.answeredQuestions.join(', ') || 'Nenhuma'}
`;
        } catch (error) {
            console.error('Error getting property context:', error);
            return '';
        }
    };

    // Detect location from message
    const detectLocation = async (message: string, state: ConversationState): Promise<ConversationState> => {
        const lowerMessage = message.toLowerCase();
        const newState = { ...state };

        // Initialize bairros array if not exists
        if (!newState.bairros) newState.bairros = [];

        const { cities, neighborhoods } = await getAvailableLocations();

        // Check for city match
        for (const city of cities) {
            if (lowerMessage.includes(city.toLowerCase())) {
                newState.cidade = city;
                if (!newState.answeredQuestions.includes('cidade')) {
                    newState.answeredQuestions.push('cidade');
                }
                break;
            }
        }

        // Check for neighborhood matches (collect ALL matches)
        const foundBairros: string[] = [];
        for (const neighborhood of neighborhoods) {
            // Check if neighborhood name is explicitly in the message
            // Use regex to ensure word boundary to avoid partial matches (e.g. "Sul" matching inside "Consulado")
            // specific simple check for now:
            if (lowerMessage.includes(neighborhood.toLowerCase())) {
                foundBairros.push(neighborhood);
            }
        }

        if (foundBairros.length > 0) {
            // Merge with existing found bairros, avoiding duplicates
            const allBairros = Array.from(new Set([...(newState.bairros || []), ...foundBairros]));
            newState.bairros = allBairros;
            newState.bairro = allBairros[0]; // Keep primary for compatibility

            if (!newState.answeredQuestions.includes('bairro')) {
                newState.answeredQuestions.push('bairro');
            }
        }

        return newState;
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : input;

        if (!textToSend.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);

        // Persist User Message
        if (conversationId) {
            saveMessageToDb(conversationId, 'user', textToSend);
        }

        if (!textOverride) setInput('');
        setLoading(true);

        try {
            console.log('💬 HANDLE SEND - Input:', textToSend);

            // Extract information from user message
            let newState = extractInfoFromMessage(textToSend, conversationState);
            console.log('📊 STATE AFTER extractInfoFromMessage:', newState);

            // Detect "other options" phrases - expand search by removing specific neighborhood
            const expandSearchPhrases = ['outras opções', 'outras opcoes', 'mais opções', 'mais opcoes', 'outras alternativas', 'mais alternativas', 'outras propriedades'];
            const isRequestingMoreOptions = expandSearchPhrases.some(phrase => textToSend.toLowerCase().includes(phrase));

            if (isRequestingMoreOptions && newState.bairro) {
                console.log('🔄 EXPANDING SEARCH: User wants other options, clearing specific bairro:', newState.bairro);
                // Clear specific neighborhood to search city-wide
                newState.bairro = null;
                newState.bairros = [];
            }

            // Detect client type from quick questions
            const lowerInput = textToSend.toLowerCase();
            if (lowerInput.includes('comprar') || lowerInput.includes('alugar') || lowerInput.includes('imóvel')) {
                newState.clientType = 'buyer';
                console.log('👤 CLIENT TYPE: buyer (from keywords)');
            } else if (lowerInput.includes('corretor') || lowerInput.includes('parceiro')) {
                newState.clientType = 'broker';
                console.log('👤 CLIENT TYPE: broker');
            }

            // Detect location from database
            newState = await detectLocation(textToSend, newState);
            console.log('📍 STATE AFTER detectLocation:', newState);

            setConversationState(newState);

            // Calculate match score for buyers
            const matchScore = calculateMatchScore(newState);
            console.log('🎯 MATCH SCORE:', matchScore, '(threshold: 0.6)');

            // Search for matching properties if buyer and has some info
            let matchingProperties: PropertyMatch[] = [];
            let propertyLinks: { text: string; url: string }[] = [];
            let searchAttempted = false;
            let propertyContext = '';  // Declare early to avoid ReferenceError

            if (newState.clientType === 'buyer' && matchScore >= 0.6) {
                searchAttempted = true;
                console.log('🔎 STARTING PROPERTY SEARCH...');
                matchingProperties = await searchMatchingProperties(newState);
                console.log('✅ SEARCH COMPLETE - Found:', matchingProperties.length, 'properties');
                console.log('📦 Properties data:', matchingProperties);

                if (matchingProperties.length > 0) {
                    // SMART FUNNEL: If searching city-wide and found multiple neighborhoods, ask first
                    const uniqueBairros = [...new Set(matchingProperties.map(p => p.bairro))];
                    const isSearchingCityWide = !newState.bairro || newState.bairros?.length === 0;
                    const hasMultipleNeighborhoods = uniqueBairros.length > 1;

                    console.log('🎯 FUNNEL DECISION:', {
                        isSearchingCityWide,
                        hasMultipleNeighborhoods,
                        uniqueBairros,
                        totalProperties: matchingProperties.length
                    });

                    if (isSearchingCityWide && hasMultipleNeighborhoods) {
                        // Don't show properties yet - ask user to choose neighborhood first
                        console.log('📍 ASKING USER TO CHOOSE NEIGHBORHOOD');
                        propertyContext = `ENCONTRAMOS ${matchingProperties.length} IMÓVEIS em ${uniqueBairros.length} BAIRROS DIFERENTES.
                        
BAIRROS COM OPÇÕES:
${uniqueBairros.map(b => `- ${b}`).join('\n')}

INSTRUÇÃO IMPORTANTE:
- NÃO mostre os links ainda
- PERGUNTE ao cliente qual bairro ele prefere
- Mencione quantos imóveis tem em cada bairro se possível
- Use um tom consultivo: "Temos X opções em ${uniqueBairros.length} bairros: ${uniqueBairros.join(', ')}. Qual desses bairros você prefere?"`;

                        // Don't create links yet - wait for user to choose
                        propertyLinks = [];
                    } else {
                        // Show properties directly if specific neighborhood or single option
                        console.log('✅ SHOWING PROPERTIES DIRECTLY');
                        propertyLinks = matchingProperties.map(p => {
                            const link = {
                                text: `${p.tipo_imovel} em ${p.bairro} - ${formatCurrency(p.valor_venda || p.valor_locacao || 0)}`,
                                url: generatePropertyLink(p)
                            };
                            console.log('🔗 Generated link:', link);
                            return link;
                        });
                        console.log('🔗 TOTAL LINKS CREATED:', propertyLinks.length);

                        // Track shown property IDs to avoid repetition in future searches
                        const newShownIds = matchingProperties.map(p => p.id);
                        newState.shownPropertyIds = [
                            ...(newState.shownPropertyIds || []),
                            ...newShownIds
                        ];
                        console.log('📝 TRACKING shown properties:', newShownIds);
                        console.log('📝 TOTAL tracked:', newState.shownPropertyIds);
                    }
                } else {
                    console.log('⚠️ No properties found, so no links created');
                }
            } else {
                console.log('❌ SEARCH SKIPPED - Reason:', {
                    clientType: newState.clientType,
                    matchScore,
                    isBuyer: newState.clientType === 'buyer',
                    meetsThreshold: matchScore >= 0.6
                });
            }

            // Get context for AI (or use funnel-generated context)
            if (!propertyContext) {
                propertyContext = await getPropertyContext(newState);
            }

            if (searchAttempted && matchingProperties.length === 0) {
                // CLEAR generic context to prevent hallucination
                console.log('🚫 HALUCINATION PREVENTION: Clearing context');
                propertyContext = "RESULTADO DA BUSCA: Nenhum imóvel encontrado com esses critérios exatos. NÃO invente opções. Sugira ajustar os filtros (ex: outros bairros).";
            }

            const conversationHistory = messages
                .slice(-6)
                .map(m => `${m.role === 'user' ? 'Cliente' : 'IzA'}: ${m.content}`)
                .join('\n');

            // Build prompt based on client type
            let specificInstructions = '';

            if (newState.clientType === 'broker') {
                // Check interaction count (passed in state or calculated from history length)
                // Start soft, then get harder. 
                const msgCount = messages.filter(m => m.role === 'user').length;
                const shouldAggressivelySell = msgCount === 1 || msgCount % 4 === 0;

                if (shouldAggressivelySell) {
                    specificInstructions = `
CLIENTE É CORRETOR - use o pitch de vendas:
${PLATFORM_KNOWLEDGE.brokerPitch.headline}

PRINCIPAIS BENEFÍCIOS para enfatizar (escolha 1 ou 2 por vez, não todos):
${PLATFORM_KNOWLEDGE.brokerPitch.mainBenefits.map(b => `- ${b.icon} ${b.title}: ${b.description}`).join('\n')}

GANCHO PRINCIPAL: ${PLATFORM_KNOWLEDGE.trialOffer.description}
CTA: Direcione para a página /anunciar com o Teste Grátis de 14 dias!

SEGURANÇA: ${PLATFORM_KNOWLEDGE.brokerPitch.security.description}
`;
                } else {
                    specificInstructions = `
CLIENTE É CORRETOR - Ajude com dúvidas sobre a plataforma, mas mantenha o tom profissional.
Responda a dúvida específica dele de forma útil.
Deixe um leve gancho no final (muito sutil) sobre como ser parceiro ajuda nisso, mas SEM forçar a venda agora.
`;
                }
            } else {
                // Buyer flow
                const missingInfo = [];
                if (!newState.operacao) missingInfo.push('operação (comprar ou alugar)');
                if (!newState.tipoImovel) missingInfo.push('tipo de imóvel');
                if (!newState.cidade && !newState.bairro) missingInfo.push('cidade ou bairro');
                if (!newState.valorMax) missingInfo.push('faixa de valor');

                specificInstructions = `
CLIENTE É COMPRADOR/LOCATÁRIO

${matchScore >= 0.6 && matchingProperties.length > 0 ? `
SUCESSO! Encontramos ${matchingProperties.length} imóveis que atendem ao pedido.
SUA PRIORIDADE MÁXIMA É APRESENTAR ESSES IMÓVEIS.
1. Diga que encontrou ótimas opções.
2. Mencione os bairros encontrados.
3. PEÇA PARA O CLIENTE CLICAR NOS LINKS ABAIXO (Os botões aparecerão junto com sua resposta).
NÃO faça novas perguntas irrelevantes. O objetivo agora é o clique no imóvel.
` : ''}

${missingInfo.length > 0 ? `
INFORMAÇÕES QUE AINDA FALTAM (NÃO repita perguntas já respondidas):
${missingInfo.map(i => `- ${i}`).join('\n')}

Faça APENAS UMA pergunta por vez, sobre: ${missingInfo[0]}
` : ''}

${newState.cidade && matchingProperties.length === 0 ? `
Não encontramos imóveis exatos. Mas verifiquei bairros vizinhos ou valores próximos.
Se ainda assim não houver nada, sugira explorar o mapa, MAS NÃO REPITA essa sugestão se já tiver feito recentemente.
Seja criativa: sugira bairros próximos famosos ou pergunte se pode buscar em toda a cidade.
` : ''}

PARA CLIENTES INDECISOS, sugira: "${PLATFORM_KNOWLEDGE.buyerFlow.undecidedSuggestion}"
`;
            }


            // Add Broker Education Tip randomly if broker
            let educationTip = '';
            if (newState.clientType === 'broker' && Math.random() > 0.7) {
                const tips = PLATFORM_KNOWLEDGE.brokerEducation;
                educationTip = tips[Math.floor(Math.random() * tips.length)];
            }

            const prompt = `Você é a IzA, assistente virtual da iziBrokerz.

TOM DE VOZ: ${PLATFORM_KNOWLEDGE.voiceTone.style}
REGRAS DE OURO:
${PLATFORM_KNOWLEDGE.voiceTone.goldenRules.map(r => `- ${r}`).join('\n')}
- SE TIVER LINKS: NÃO PERGUNTE se o usuário quer ver. APENAS APRESENTE.
- DIGA: "Encontrei estas opções:" e finalize. Os botões farão o resto.
- EVITE REPETIÇÕES: Não use a mesma frase de "explorar mapa" duas vezes seguidas.
- ❌ NUNCA diga "Estou procurando" ou "Vou procurar" - VOCÊ NÃO PROCURA, você PERGUNTA ao cliente!
- ✅ SEMPRE dirija perguntas DIRETAMENTE ao cliente: "Qual faixa de valor você procura?"

CONTEXTO BRASILEIRO:
- Fale como uma corretora local, amiga e profissional.
- Use termos como "bairro", "região", "apê", "casa térrea".
- Se falar de valores, mostre empatia ("preço justo", "investimento").
- Transmita segurança citando verificação de corretores quando relevante.

TRATAMENTO DE OBJEÇÕES (Use se o cliente levantar esses pontos):
- Segurança: ${PLATFORM_KNOWLEDGE.objections.security.response}
- Preço: ${PLATFORM_KNOWLEDGE.objections.price.response}
- Concorrência: ${PLATFORM_KNOWLEDGE.objections.competition.response}

${propertyContext}

${specificInstructions}
${educationTip ? `\nDICA EXTRA PARA O CORRETOR (Inclua no final): ${educationTip}` : ''}


${conversationHistory}

PERGUNTA DO CLIENTE:
${textToSend}

${matchingProperties.length > 0 ? `
IMÓVEIS ENCONTRADOS (mencione-os na resposta e diga que o cliente pode clicar para ver):
${matchingProperties.map((p, i) => `${i + 1}. ${p.tipo_imovel} em ${p.bairro}, ${p.cidade} - ${formatCurrency(p.valor_venda || p.valor_locacao || 0)}`).join('\n')}
` : `
⚠️ NENHUM IMÓVEL ENCONTRADO com os critérios atuais.
OFEREÇA ALTERNATIVAS:
1. Sugira bairros próximos ou similares
2. Pergunte se o cliente quer "encomendar" um imóvel (cadastrar interesse)
`}

RESPONDA de forma CLARA, OBJETIVA e CONVIDATIVA (máximo 4 linhas):`;

            const response = await callGemini(prompt);

            if (response) {
                console.log('🤖 AI RESPONSE RECEIVED');
                console.log('🔗 propertyLinks before creating message:', propertyLinks);
                console.log('🔗 propertyLinks.length:', propertyLinks.length);

                // Generate Quick Actions based on current state and found properties
                const quickActions = await generateQuickActions(newState, matchingProperties);
                console.log('🎯 Quick Actions generated:', quickActions.length, quickActions);

                const assistantMessage: Message = {
                    role: 'assistant',
                    content: response,
                    timestamp: new Date(),
                    links: propertyLinks.length > 0 ? propertyLinks : undefined,
                    quickActions: quickActions.length > 0 ? quickActions : undefined
                };

                console.log('📨 ASSISTANT MESSAGE CREATED:', {
                    hasLinks: !!assistantMessage.links,
                    linksCount: assistantMessage.links?.length || 0,
                    links: assistantMessage.links,
                    hasQuickActions: !!assistantMessage.quickActions,
                    quickActionsCount: assistantMessage.quickActions?.length || 0
                });

                setMessages(prev => [...prev, assistantMessage]);

                // Persist Assistant Message
                if (conversationId) {
                    saveMessageToDb(conversationId, 'assistant', response, {
                        links: propertyLinks,
                        quickActions
                    });

                    // 🔥 CALCULATE LEAD SCORE
                    const allMessages = [...messages, userMessage, assistantMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp
                    }));

                    const leadClassification = calculateLeadScore(newState, allMessages);

                    console.log('🎯 LEAD SCORE CALCULATED:', {
                        score: leadClassification.score,
                        status: leadClassification.status,
                        priority: leadClassification.priority,
                        breakdown: leadClassification.breakdown
                    });

                    // Update conversation with lead score
                    await supabase
                        .from('iza_conversations')
                        .update({
                            lead_score: leadClassification.score,
                            lead_status: leadClassification.status,
                            score_breakdown: leadClassification.breakdown,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', conversationId);

                    //🔥 If HOT LEAD, notify
                    if (shouldNotifyBroker(leadClassification)) {
                        console.log('🔥🔥🔥 HOT LEAD DETECTED!', {
                            score: leadClassification.score,
                            conversationId,
                            state: newState
                        });

                        // TODO: Notification system (next step)
                    }
                }
            } else {
                throw new Error('Falha ao obter resposta');
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Intelligent fallback
            let fallbackMessage = '';
            if (conversationState.clientType === 'broker' || textToSend.toLowerCase().includes('corretor') || textToSend.toLowerCase().includes('parceiro')) {
                const hooks = PLATFORM_KNOWLEDGE.voiceTone.responseVariations.brokerHooks;
                fallbackMessage = hooks[Math.floor(Math.random() * hooks.length)] + " Acesse /anunciar para saber mais!";
            } else if (textToSend.toLowerCase().includes('imóvel') || textToSend.toLowerCase().includes('comprar') || textToSend.toLowerCase().includes('alugar')) {
                fallbackMessage = `Temos ótimas opções para você! 🏠 Me conta: você está buscando para comprar ou alugar? E qual tipo de imóvel prefere?`;
            } else {
                const fallbacks = PLATFORM_KNOWLEDGE.voiceTone.responseVariations.fallback;
                fallbackMessage = fallbacks[Math.floor(Math.random() * fallbacks.length)] + ` Você está buscar um imóvel ou é Corretor?`;
            }

            const errorMessage: Message = {
                role: 'assistant',
                content: fallbackMessage,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleLinkClick = (url: string) => {
        navigate(url);
        setIsOpen(false);
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full p-4 shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 transition-all duration-300 group"
                    aria-label="Abrir assistente IzA"
                >
                    <div className="relative">
                        <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
                        <div className="absolute -top-4 -right-3 w-4 h-4 bg-red-700 rounded-full animate-pulse"></div>
                    </div>
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-0 right-0 left-0 top-0 sm:top-auto sm:left-auto sm:bottom-6 sm:right-6 z-50 w-full h-full sm:w-[380px] sm:h-[520px] bg-slate-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">IzA</h3>
                                <p className="text-xs text-emerald-100">Assistente Virtual</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                        ? 'bg-emerald-500 text-white rounded-br-none'
                                        : 'bg-slate-800 text-white border border-slate-700 rounded-bl-none'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                                    {/* Property Links */}
                                    {message.links && message.links.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs opacity-70 font-medium">Clique para ver:</p>
                                            {message.links.map((link, linkIndex) => (
                                                <button
                                                    key={linkIndex}
                                                    onClick={() => handleLinkClick(link.url)}
                                                    className="flex items-center gap-2 text-xs bg-green-600 text-white border border-green-400 px-3 py-2 rounded-full hover:bg-green-700 transition-colors w-full text-left shadow-md mt-1"
                                                    style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
                                                >
                                                    <ExternalLink size={14} className="shrink-0 text-white" />
                                                    <span className="truncate font-medium">{link.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Actions */}
                                    {message.quickActions && message.quickActions.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs opacity-70 font-bold rounded-full">Escolha uma opção:</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {message.quickActions
                                                    .sort((a, b) => a.text.localeCompare(b.text))  // Sort alphabetically
                                                    .map((action) => {
                                                        // Category-based colors
                                                        const getCategoryStyles = (category: string) => {
                                                            switch (category) {
                                                                case 'operation':
                                                                    return 'bg-blue-600 hover:bg-blue-700 border-blue-400';
                                                                case 'type':
                                                                    return 'bg-green-600 hover:bg-green-700 border-green-400';
                                                                case 'neighborhood':
                                                                    return 'bg-purple-600 hover:bg-purple-700 border-purple-400';
                                                                case 'price':
                                                                    return 'bg-orange-600 hover:bg-orange-700 border-orange-400';
                                                                case 'broker':
                                                                    return 'bg-gray-600 hover:bg-gray-700 border-gray-400';
                                                                default:
                                                                    return 'bg-slate-600 hover:bg-slate-700 border-slate-400';
                                                            }
                                                        };

                                                        return (
                                                            <button
                                                                key={action.id}
                                                                onClick={() => {
                                                                    // Check if it's custom order badge
                                                                    if (action.id === 'custom-order') {
                                                                        // Open modal instead of sending message
                                                                        setCustomOrderModalOpen(true);
                                                                    } else {
                                                                        // Normal badge behavior - send message directly
                                                                        handleSend(action.actionText);
                                                                    }
                                                                }}
                                                                className={`flex items-center justify-center gap-2 text-xs text-white border px-3 py-2.5 rounded-lg transition-all transform hover:scale-105 active:scale-95 font-medium shadow-md ${getCategoryStyles(action.category)}`}
                                                            >
                                                                {action.icon && <span className="text-base">{action.icon}</span>}
                                                                <span className="truncate">{action.text}</span>
                                                                {action.count !== undefined && (
                                                                    <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                                        {action.count}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs opacity-60 mt-1">
                                        {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 text-white border border-slate-700 rounded-full rounded-bl-none px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-sm">Digitando...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions - Only show at start */}
                    {messages.length === 1 && (
                        <div className="p-3 bg-slate-800 border-t border-slate-700 shrink-0">
                            <p className="text-xs text-gray-400 mb-2 font-medium">Como posso ajudar?</p>
                            <div className="flex flex-col gap-2">
                                {quickQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSend(question)}
                                        className="text-sm bg-gradient-to-r from-midnight-950 to-midnight-800 hover:from-midnight-800 hover:to-midnight-700 text-midnight-300 px-4 py-3 rounded-full transition-all font-medium text-left"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 bg-slate-800 border-t border-slate-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Digite sua mensagem..."
                                className="flex-1 px-4 py-3 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white text-sm"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-full p-3 transition-colors disabled:cursor-not-allowed"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Order Modal */}
            <CustomOrderModal
                isOpen={customOrderModalOpen}
                onClose={() => setCustomOrderModalOpen(false)}
                conversationId={conversationId || undefined}
                prefilledData={{
                    operacao: conversationState.operacao || '',
                    tipoImovel: conversationState.tipoImovel || '',
                    cidade: conversationState.cidade || 'Natal',
                    bairro: conversationState.bairro || '',
                    valorMax: conversationState.valorMax
                }}
            />
        </>
    );
};
