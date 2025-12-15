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

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    links?: { text: string; url: string }[];
}

interface PropertyMatch {
    id: string;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    operacao: string;
    tipo_imovel: string;
    slug?: string;
}

export const PublicAIAssistant: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '👋 Olá! Sou a IzA, sua assistente virtual! Como posso te ajudar hoje?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationState, setConversationState] = useState<ConversationState>(createEmptyConversationState());
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
            let query = supabase
                .from('anuncios')
                .select(`
                    id, titulo, cidade, bairro, valor_venda, valor_locacao,
                    operacao(tipo), tipo_imovel(tipo)
                `)
                .eq('status_aprovacao', 'aprovado')
                .limit(5);

            // Add filters based on state
            if (state.cidade) {
                query = query.ilike('cidade', `%${state.cidade}%`);
            }
            if (state.bairro) {
                query = query.ilike('bairro', `%${state.bairro}%`);
            }
            if (state.valorMax) {
                if (state.operacao === 'venda') {
                    query = query.lte('valor_venda', state.valorMax);
                } else if (state.operacao === 'locacao') {
                    query = query.lte('valor_locacao', state.valorMax);
                }
            }

            const { data, error } = await query;

            if (error || !data) return [];

            return data.map(p => ({
                ...p,
                operacao: (p.operacao as any)?.tipo || '',
                tipo_imovel: (p.tipo_imovel as any)?.tipo || ''
            })).filter(p => {
                // Filter by operacao if specified
                if (state.operacao) {
                    const opLower = p.operacao.toLowerCase();
                    if (state.operacao === 'venda' && !opLower.includes('venda')) return false;
                    if (state.operacao === 'locacao' && !opLower.includes('locação') && !opLower.includes('locacao')) return false;
                }
                // Filter by tipo if specified
                if (state.tipoImovel) {
                    const tipoLower = p.tipo_imovel.toLowerCase();
                    if (!tipoLower.includes(state.tipoImovel)) return false;
                }
                return true;
            });
        } catch (error) {
            console.error('Error searching properties:', error);
            return [];
        }
    };

    // Generate property link
    const generatePropertyLink = (property: PropertyMatch): string => {
        const tipoSlug = (property.tipo_imovel || 'imovel').toLowerCase().replace(/\s+/g, '-');
        const bairroSlug = (property.bairro || '').toLowerCase().replace(/\s+/g, '-');
        const cidadeSlug = (property.cidade || '').toLowerCase().replace(/\s+/g, '-');
        return `/${tipoSlug}-${bairroSlug}-${cidadeSlug}-${property.id}`;
    };

    // Format currency
    const formatCurrency = (value: number): string => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
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

            return `
DADOS DA PLATAFORMA:
- Total de imóveis: ${properties.length}
- Cidades: ${cities.join(', ')}
- Bairros: ${neighborhoods.slice(0, 15).join(', ')}
- À venda: ${forSale} | Para locação: ${forRent}

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

        // Check for neighborhood match
        for (const neighborhood of neighborhoods) {
            if (lowerMessage.includes(neighborhood.toLowerCase())) {
                newState.bairro = neighborhood;
                if (!newState.answeredQuestions.includes('bairro')) {
                    newState.answeredQuestions.push('bairro');
                }
                break;
            }
        }

        return newState;
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setLoading(true);

        try {
            // Extract information from user message
            let newState = extractInfoFromMessage(currentInput, conversationState);

            // Detect client type from quick questions
            const lowerInput = currentInput.toLowerCase();
            if (lowerInput.includes('comprar') || lowerInput.includes('alugar') || lowerInput.includes('imóvel')) {
                newState.clientType = 'buyer';
            } else if (lowerInput.includes('corretor') || lowerInput.includes('parceiro')) {
                newState.clientType = 'broker';
            }

            // Detect location from database
            newState = await detectLocation(currentInput, newState);

            setConversationState(newState);

            // Calculate match score for buyers
            const matchScore = calculateMatchScore(newState);

            // Search for matching properties if buyer and has some info
            let matchingProperties: PropertyMatch[] = [];
            let propertyLinks: { text: string; url: string }[] = [];

            if (newState.clientType === 'buyer' && matchScore >= 0.6) {
                matchingProperties = await searchMatchingProperties(newState);
                propertyLinks = matchingProperties.map(p => ({
                    text: `${p.tipo_imovel} em ${p.bairro} - ${formatCurrency(p.valor_venda || p.valor_locacao || 0)}`,
                    url: generatePropertyLink(p)
                }));
            }

            // Get context for AI
            const propertyContext = await getPropertyContext(newState);
            const conversationHistory = messages
                .slice(-6)
                .map(m => `${m.role === 'user' ? 'Cliente' : 'IzA'}: ${m.content}`)
                .join('\n');

            // Build prompt based on client type
            let specificInstructions = '';

            if (newState.clientType === 'broker') {
                specificInstructions = `
CLIENTE É CORRETOR - use o pitch de vendas:
${PLATFORM_KNOWLEDGE.brokerPitch.headline}

PRINCIPAIS BENEFÍCIOS para enfatizar:
${PLATFORM_KNOWLEDGE.brokerPitch.mainBenefits.map(b => `- ${b.icon} ${b.title}: ${b.description}`).join('\n')}

GANCHO PRINCIPAL: ${PLATFORM_KNOWLEDGE.trialOffer.description}
CTA: Direcione para a página /anunciar com o Teste Grátis de 14 dias!

SEGURANÇA: ${PLATFORM_KNOWLEDGE.brokerPitch.security.description}

FOCO na mensagem: ${PLATFORM_KNOWLEDGE.brokerPitch.focus.join(' | ')}
`;
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
ÓTIMA NOTÍCIA! Encontrei ${matchingProperties.length} imóveis compatíveis!
Mostre os imóveis encontrados e incentive o cliente a clicar nos links.
` : ''}

${missingInfo.length > 0 ? `
INFORMAÇÕES QUE AINDA FALTAM (NÃO repita perguntas já respondidas):
${missingInfo.map(i => `- ${i}`).join('\n')}

Faça APENAS UMA pergunta por vez, sobre: ${missingInfo[0]}
` : ''}

${newState.cidade && matchingProperties.length === 0 ? `
Não encontramos imóveis em ${newState.cidade}. Sugira explorar o mapa ou bairros próximos!
` : ''}

PARA CLIENTES INDECISOS, sugira: "${PLATFORM_KNOWLEDGE.buyerFlow.undecidedSuggestion}"
`;
            }

            const prompt = `Você é a IzA, assistente virtual da iziBrokerz.

TOM DE VOZ: ${PLATFORM_KNOWLEDGE.voiceTone.style}
REGRAS:
${PLATFORM_KNOWLEDGE.voiceTone.rules.map(r => `- ${r}`).join('\n')}

${propertyContext}

${specificInstructions}

HISTÓRICO:
${conversationHistory}

PERGUNTA DO CLIENTE:
${currentInput}

${matchingProperties.length > 0 ? `
IMÓVEIS ENCONTRADOS (mencione-os na resposta e diga que o cliente pode clicar para ver):
${matchingProperties.map((p, i) => `${i + 1}. ${p.tipo_imovel} em ${p.bairro}, ${p.cidade} - ${formatCurrency(p.valor_venda || p.valor_locacao || 0)}`).join('\n')}
` : ''}

RESPONDA de forma CLARA, OBJETIVA e CONVIDATIVA (máximo 4 linhas):`;

            const response = await callGemini(prompt);

            if (response) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: response,
                    timestamp: new Date(),
                    links: propertyLinks.length > 0 ? propertyLinks : undefined
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error('Falha ao obter resposta');
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Intelligent fallback
            let fallbackMessage = '';
            const lowerInput = currentInput.toLowerCase();

            if (conversationState.clientType === 'broker' || lowerInput.includes('corretor') || lowerInput.includes('parceiro')) {
                fallbackMessage = `Que ótimo ter você aqui! 🤝 A iziBrokerz oferece Teste Grátis de 14 dias com acesso completo: parcerias, CRM, página personalizada e muito mais! Acesse /anunciar e comece agora!`;
            } else if (lowerInput.includes('imóvel') || lowerInput.includes('comprar') || lowerInput.includes('alugar')) {
                fallbackMessage = `Temos ótimas opções para você! 🏠 Me conta: você está buscando para comprar ou alugar? E qual tipo de imóvel prefere?`;
            } else {
                fallbackMessage = `Estou aqui para ajudar! 😊 Você está buscando um imóvel ou é Corretor interessado em parcerias?`;
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
                <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-slate-800 rounded-full shadow-2xl flex flex-col overflow-hidden border border-slate-700">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 flex items-center justify-between">
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
                                    className={`max-w-[85%] rounded-full px-4 py-2 ${message.role === 'user'
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
                                                    className="flex items-center gap-2 text-xs bg-emerald-100 bg-emerald-900/30 text-emerald-700 text-emerald-300 px-3 py-2 rounded-full hover:bg-emerald-200 hover:bg-emerald-900/50 transition-colors w-full text-left"
                                                >
                                                    <ExternalLink size={14} />
                                                    <span className="truncate">{link.text}</span>
                                                </button>
                                            ))}
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
                        <div className="p-3 bg-slate-800 border-t border-slate-700">
                            <p className="text-xs text-gray-400 mb-2 font-medium">Como posso ajudar?</p>
                            <div className="flex flex-col gap-2">
                                {quickQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(question)}
                                        className="text-sm bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-900/40 text-emerald-700 text-emerald-300 px-4 py-3 rounded-full transition-all font-medium text-left"
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
        </>
    );
};
