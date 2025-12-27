// Conditional Floating Button based on Broker's Plan
// - Básico: WhatsApp button
// - Intermediário: ChatBot with dynamic property filtering funnel
// - Avançado/Profissional: Full IzA Assistant

import React, { useState, useEffect } from 'react';
import { MessageCircle, Bot, X, ChevronLeft, MapPin, Home, DollarSign, ExternalLink, Building, Store, Trees } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PublicAIAssistant } from './PublicAIAssistant';
import { generatePropertySlug } from '../lib/propertyHelpers';

interface BrokerPlan {
    plano_id: string | null;
    plano_nome: string | null;
    whatsapp: string | null;
    broker_id: string | null;
}

interface ConditionalFloatingButtonProps {
    brokerSlug?: string;
}

interface Property {
    id: string;
    titulo: string;
    operacao: { tipo: string } | string;
    tipo_imovel: { tipo: string } | string;
    bairro: string;
    cidade: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    valor_diaria: number | null;
    fotos: string;
    quartos: number;
    area_priv: number;
    vagas: number;
    cod_imovel: number;
}

type FunnelStep = 'initial' | 'tipo' | 'bairro' | 'preco' | 'results';

// Format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

// ChatBot Modal Component for Intermediário plan - With Dynamic Funnel
const ChatBotModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    brokerWhatsapp: string;
    brokerSlug: string;
    brokerId: string;
}> = ({ isOpen, onClose, brokerWhatsapp, brokerSlug, brokerId }) => {
    const [step, setStep] = useState<FunnelStep>('initial');
    const [selectedOperacao, setSelectedOperacao] = useState<string | null>(null);
    const [selectedTipo, setSelectedTipo] = useState<string | null>(null);
    const [selectedBairro, setSelectedBairro] = useState<string | null>(null);

    // Available options based on broker's properties
    const [availableOperacoes, setAvailableOperacoes] = useState<string[]>([]);
    const [availableTipos, setAvailableTipos] = useState<string[]>([]);
    const [availableBairros, setAvailableBairros] = useState<string[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch broker's properties on mount
    useEffect(() => {
        const fetchBrokerProperties = async () => {
            if (!brokerId) return;

            try {
                // Fetch own properties
                const { data: ownProps } = await supabase
                    .from('anuncios')
                    .select('id, titulo, operacao(tipo), tipo_imovel(tipo), bairro, cidade, valor_venda, valor_locacao, valor_diaria, fotos, quartos, area_priv, vagas, cod_imovel')
                    .eq('user_id', brokerId)
                    .eq('status', 'ativo');

                // Fetch partnership properties
                const { data: partnerships } = await supabase
                    .from('parcerias')
                    .select('anuncios(id, titulo, operacao(tipo), tipo_imovel(tipo), bairro, cidade, valor_venda, valor_locacao, valor_diaria, fotos, quartos, area_priv, vagas, cod_imovel)')
                    .eq('user_id', brokerId)
                    .eq('status', 'aceita');

                let props: Property[] = [];

                if (ownProps) {
                    props = [...props, ...ownProps.map((p: any) => ({
                        ...p,
                        operacao: p.operacao?.tipo || p.operacao,
                        tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
                    }))];
                }

                if (partnerships) {
                    const partnerProps = partnerships
                        .map((p: any) => p.anuncios)
                        .filter(Boolean)
                        .map((p: any) => ({
                            ...p,
                            operacao: p.operacao?.tipo || p.operacao,
                            tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
                        }));
                    props = [...props, ...partnerProps];
                }

                // Remove duplicates
                const uniqueProps = Array.from(new Map(props.map(item => [item.id, item])).values());
                setAllProperties(uniqueProps);

                // Get unique operacoes
                const operacoes = [...new Set(uniqueProps.map(p =>
                    typeof p.operacao === 'string' ? p.operacao : ''
                ).filter(Boolean))];
                setAvailableOperacoes(operacoes);

            } catch (error) {
                console.error('Error fetching broker properties:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchBrokerProperties();
        }
    }, [brokerId, isOpen]);

    // Helper function to normalize string (remove accents)
    const normalizeStr = (str: string): string => {
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    // Helper function to match grouped operacao
    const matchesGroupedOperacao = (rawOp: string, groupedOp: string): boolean => {
        const op = normalizeStr(rawOp);
        if (groupedOp === 'comprar') {
            return op === 'venda' || op === 'venda/locacao';
        } else if (groupedOp === 'alugar') {
            return op === 'locacao' || op === 'venda/locacao';
        } else if (groupedOp === 'temporada') {
            return op === 'temporada';
        }
        return false;
    };

    // Update available tipos when operacao changes
    useEffect(() => {
        if (selectedOperacao) {
            const filtered = allProperties.filter(p => {
                const op = typeof p.operacao === 'string' ? p.operacao : '';
                return matchesGroupedOperacao(op, selectedOperacao);
            });
            const tipos = [...new Set(filtered.map(p =>
                typeof p.tipo_imovel === 'string' ? p.tipo_imovel : ''
            ).filter(Boolean))];
            setAvailableTipos(tipos);
        }
    }, [selectedOperacao, allProperties]);

    // Update available bairros when tipo changes
    useEffect(() => {
        if (selectedOperacao && selectedTipo) {
            const filtered = allProperties.filter(p => {
                const op = typeof p.operacao === 'string' ? p.operacao : '';
                const tipo = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : '';
                return matchesGroupedOperacao(op, selectedOperacao) &&
                    tipo.toLowerCase() === selectedTipo.toLowerCase();
            });
            const bairros = [...new Set(filtered.map(p => p.bairro).filter(Boolean))];
            setAvailableBairros(bairros);
        }
    }, [selectedOperacao, selectedTipo, allProperties]);

    // Filter final properties
    useEffect(() => {
        if (selectedOperacao && selectedTipo && selectedBairro) {
            const filtered = allProperties.filter(p => {
                const op = typeof p.operacao === 'string' ? p.operacao.toLowerCase() : '';
                const tipo = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : '';

                // Match operacao based on grouped logic
                let opMatch = false;
                if (selectedOperacao === 'comprar') {
                    opMatch = op === 'venda' || op === 'venda/locacao';
                } else if (selectedOperacao === 'alugar') {
                    opMatch = op === 'locacao' || op === 'venda/locacao';
                } else if (selectedOperacao === 'temporada') {
                    opMatch = op === 'temporada';
                }

                return opMatch &&
                    tipo.toLowerCase() === selectedTipo.toLowerCase() &&
                    p.bairro.toLowerCase() === selectedBairro.toLowerCase();
            });
            setFilteredProperties(filtered);
        }
    }, [selectedOperacao, selectedTipo, selectedBairro, allProperties]);

    // Grouped operacao options (not raw database values)
    const operacaoOptions = [
        { id: 'comprar', label: 'Quero COMPRAR um imóvel', icon: '🏠' },
        { id: 'alugar', label: 'Quero ALUGAR um imóvel', icon: '🔑' },
        { id: 'temporada', label: 'Quero TEMPORADA um imóvel', icon: '🏖️' },
    ];

    // Check which grouped operacoes have properties
    const getAvailableGroupedOperacoes = () => {
        const hasComprar = allProperties.some(p => {
            const op = typeof p.operacao === 'string' ? normalizeStr(p.operacao) : '';
            return op === 'venda' || op === 'venda/locacao';
        });
        const hasAlugar = allProperties.some(p => {
            const op = typeof p.operacao === 'string' ? normalizeStr(p.operacao) : '';
            return op === 'locacao' || op === 'venda/locacao';
        });
        const hasTemporada = allProperties.some(p => {
            const op = typeof p.operacao === 'string' ? normalizeStr(p.operacao) : '';
            return op === 'temporada';
        });

        return operacaoOptions.filter(o =>
            (o.id === 'comprar' && hasComprar) ||
            (o.id === 'alugar' && hasAlugar) ||
            (o.id === 'temporada' && hasTemporada)
        );
    };

    // Icons by tipo_imovel
    const tipoImovelIcons: Record<string, React.ReactNode> = {
        'apartamento': <Building className="text-blue-400" size={24} />,
        'casa': <Home className="text-blue-400" size={24} />,
        'terreno': <MapPin className="text-blue-400" size={24} />,
        'comercial': <Store className="text-blue-400" size={24} />,
        'rural': <Trees className="text-blue-400" size={24} />,
        'flat': <Building className="text-blue-400" size={24} />,
        'cobertura': <Building className="text-blue-400" size={24} />,
        'kitnet': <Home className="text-blue-400" size={24} />,
        'sobrado': <Home className="text-blue-400" size={24} />,
    };

    const getTipoIcon = (tipo: string) => {
        const lowerTipo = tipo.toLowerCase();
        return tipoImovelIcons[lowerTipo] || <Home className="text-blue-400" size={24} />;
    };

    const handleBack = () => {
        if (step === 'tipo') {
            setStep('initial');
            setSelectedOperacao(null);
        } else if (step === 'bairro') {
            setStep('tipo');
            setSelectedTipo(null);
        } else if (step === 'results') {
            setStep('bairro');
            setSelectedBairro(null);
        }
    };

    const handleReset = () => {
        setStep('initial');
        setSelectedOperacao(null);
        setSelectedTipo(null);
        setSelectedBairro(null);
        setFilteredProperties([]);
    };

    const handleWhatsApp = () => {
        const phone = brokerWhatsapp?.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}?text=Olá! Vim pelo seu site e gostaria de falar com você.`, '_blank');
        onClose();
    };

    const getPropertyImage = (fotos: string) => {
        if (!fotos) return '/placeholder-property.jpg';
        const fotosArray = fotos.split(',').filter(Boolean);
        return fotosArray[0] || '/placeholder-property.jpg';
    };

    const getPropertyValue = (property: Property) => {
        if (selectedOperacao === 'venda') return property.valor_venda;
        if (selectedOperacao === 'locacao') return property.valor_locacao;
        if (selectedOperacao === 'temporada') return property.valor_diaria;
        return property.valor_venda || property.valor_locacao;
    };

    const getPropertyLink = (property: Property) => {
        const tipoImovel = typeof property.tipo_imovel === 'string' ? property.tipo_imovel : '';
        const operacao = typeof property.operacao === 'string' ? property.operacao : '';

        const slug = generatePropertySlug({
            tipo_imovel: tipoImovel,
            quartos: property.quartos,
            bairro: property.bairro,
            cidade: property.cidade,
            vagas: property.vagas,
            area_priv: property.area_priv,
            operacao: operacao,
            valor_venda: property.valor_venda,
            valor_locacao: property.valor_locacao,
            cod_imovel: property.cod_imovel
        });
        return `/${brokerSlug}/imovel/${slug}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-midnight-900 rounded-3xl shadow-2xl w-full max-w-sm border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {step !== 'initial' && (
                            <button
                                onClick={handleBack}
                                className="text-white/70 hover:text-white p-1 mr-1"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Assistente Virtual</h3>
                            <p className="text-blue-100 text-sm">
                                {step === 'initial' && 'Como posso ajudar?'}
                                {step === 'tipo' && 'Que tipo de imóvel?'}
                                {step === 'bairro' && 'Em qual bairro?'}
                                {step === 'results' && `${filteredProperties.length} opções encontradas`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Choose Operation */}
                            {step === 'initial' && (
                                <>
                                    {getAvailableGroupedOperacoes().map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setSelectedOperacao(option.id);
                                                setStep('tipo');
                                            }}
                                            className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl transition-all duration-200 text-left group"
                                        >
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleWhatsApp}
                                        className="w-full flex items-center gap-3 p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-200 text-left group"
                                    >
                                        <span className="text-2xl">💬</span>
                                        <span className="text-white font-medium group-hover:text-green-400 transition-colors animate-pulse">
                                            Falar com o(a) Corretor(a)
                                        </span>
                                    </button>
                                </>
                            )}

                            {/* Step 2: Choose Property Type */}
                            {step === 'tipo' && (
                                <>
                                    {availableTipos.map((tipo) => (
                                        <button
                                            key={tipo}
                                            onClick={() => {
                                                setSelectedTipo(tipo);
                                                setStep('bairro');
                                            }}
                                            className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl transition-all duration-200 text-left group"
                                        >
                                            {getTipoIcon(tipo)}
                                            <span className="text-white font-medium group-hover:text-blue-400 transition-colors capitalize">
                                                {tipo}
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Step 3: Choose Neighborhood */}
                            {step === 'bairro' && (
                                <>
                                    {availableBairros.map((bairro) => (
                                        <button
                                            key={bairro}
                                            onClick={() => {
                                                setSelectedBairro(bairro);
                                                setStep('results');
                                            }}
                                            className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl transition-all duration-200 text-left group"
                                        >
                                            <MapPin className="text-blue-400" size={24} />
                                            <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                                                {bairro}
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Step 4: Show Results */}
                            {step === 'results' && (
                                <>
                                    {filteredProperties.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <p>Nenhum imóvel encontrado</p>
                                            <button
                                                onClick={handleReset}
                                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                            >
                                                Nova busca
                                            </button>
                                        </div>
                                    ) : (
                                        filteredProperties.slice(0, 5).map((property) => (
                                            <a
                                                key={property.id}
                                                href={getPropertyLink(property)}
                                                className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl transition-all duration-200 overflow-hidden group"
                                            >
                                                <div className="flex gap-3 p-3">
                                                    <img
                                                        src={getPropertyImage(property.fotos)}
                                                        alt={property.titulo}
                                                        className="w-20 h-20 object-cover rounded-lg shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors text-sm">
                                                            {property.titulo}
                                                        </h4>
                                                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                                                            <MapPin size={12} />
                                                            {property.bairro}
                                                        </p>
                                                        <p className="text-emerald-400 font-bold text-sm mt-1">
                                                            {formatCurrency(getPropertyValue(property) || 0)}
                                                        </p>
                                                    </div>
                                                    <ExternalLink className="text-gray-500 group-hover:text-blue-400 shrink-0 self-center" size={16} />
                                                </div>
                                            </a>
                                        ))
                                    )}
                                    {filteredProperties.length > 5 && (
                                        <a
                                            href={`/${brokerSlug}/buscar?operacao=${selectedOperacao}&tipo=${selectedTipo}&bairro=${selectedBairro}`}
                                            className="block w-full p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-center text-blue-400 font-medium transition-colors"
                                        >
                                            Ver todos ({filteredProperties.length} imóveis)
                                        </a>
                                    )}
                                    <button
                                        onClick={handleReset}
                                        className="w-full p-3 text-gray-400 hover:text-white transition-colors text-sm"
                                    >
                                        ← Fazer nova busca
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Floating WhatsApp Button for Básico plan
const FloatingWhatsApp: React.FC<{ whatsapp: string }> = ({ whatsapp }) => {
    const phone = whatsapp?.replace(/\D/g, '');

    return (
        <a
            href={`https://wa.me/55${phone}?text=Olá! Vim pelo seu site e gostaria de mais informações.`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-4 right-4 z-[9999] w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-110"
        >
            <MessageCircle className="text-white" size={28} />
        </a>
    );
};

// Floating ChatBot Button for Intermediário plan
const FloatingChatBot: React.FC<{
    whatsapp: string;
    brokerSlug: string;
    brokerId: string;
}> = ({ whatsapp, brokerSlug, brokerId }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-110"
            >
                <Bot className="text-white" size={28} />
            </button>

            <ChatBotModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                brokerWhatsapp={whatsapp}
                brokerSlug={brokerSlug}
                brokerId={brokerId}
            />
        </>
    );
};

export const ConditionalFloatingButton: React.FC<ConditionalFloatingButtonProps> = ({ brokerSlug }) => {
    const [brokerPlan, setBrokerPlan] = useState<BrokerPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBrokerPlan = async () => {
            if (!brokerSlug) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('perfis')
                    .select(`
                        id,
                        plano_id,
                        whatsapp,
                        planos (nome)
                    `)
                    .eq('slug', brokerSlug)
                    .single();

                if (!error && data) {
                    setBrokerPlan({
                        plano_id: data.plano_id,
                        plano_nome: (data.planos as any)?.nome || null,
                        whatsapp: data.whatsapp,
                        broker_id: data.id
                    });
                }
            } catch (error) {
                console.error('Error fetching broker plan:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrokerPlan();
    }, [brokerSlug]);

    // If not on a broker page, show the default PublicAIAssistant
    if (!brokerSlug) {
        return <PublicAIAssistant />;
    }

    // Loading state - show nothing
    if (loading) {
        return null;
    }

    // Determine which button/component to show based on plan
    const planName = brokerPlan?.plano_nome?.toLowerCase() || 'básico';

    console.log('ConditionalFloatingButton - Plan:', planName, 'Broker:', brokerSlug);

    // Admin (null plan) or Avançado/Profissional → Full IzA
    if (!brokerPlan?.plano_id || planName === 'avançado' || planName === 'profissional') {
        return <PublicAIAssistant brokerSlug={brokerSlug} />;
    }

    // Intermediário → ChatBot
    if (planName === 'intermediário') {
        return (
            <FloatingChatBot
                whatsapp={brokerPlan.whatsapp || ''}
                brokerSlug={brokerSlug}
                brokerId={brokerPlan.broker_id || ''}
            />
        );
    }

    // Básico → WhatsApp
    if (planName === 'básico' && brokerPlan.whatsapp) {
        return <FloatingWhatsApp whatsapp={brokerPlan.whatsapp} />;
    }

    // Fallback: WhatsApp
    if (brokerPlan?.whatsapp) {
        return <FloatingWhatsApp whatsapp={brokerPlan.whatsapp} />;
    }

    // No plan, no whatsapp - show default IzA
    return <PublicAIAssistant brokerSlug={brokerSlug} />;
};
