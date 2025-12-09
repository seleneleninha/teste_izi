"use client";

// Public AI Assistant for iziBrokerz
// Helps buyers/renters find properties and brokers learn about the platform

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { callGemini } from '@/lib/geminiHelper';
import { supabase } from '@/lib/supabaseClient';
import { PLATFORM_KNOWLEDGE, qualifyLead } from '@/lib/platformKnowledge';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const PublicAIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '👋 Olá! Sou a IzA sua assistente virtual. Posso te ajudar a encontrar o imóvel perfeito ou esclarecer dúvidas sobre nossa Plataforma. Como posso ajudar?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getPropertyContext = async (): Promise<string> => {
        try {
            const { data: properties, error } = await supabase
                .from('anuncios')
                .select(`
                    id,
                    titulo,
                    cidade,
                    bairro,
                    valor_venda,
                    valor_locacao,
                    quartos,
                    banheiros,
                    area_priv,
                    operacao(tipo),
                    tipo_imovel(tipo)
                `)
                .eq('status_aprovacao', 'aprovado')
                .limit(50);

            if (error || !properties) return '';

            const cities = Array.from(new Set(properties.map(p => p.cidade)));
            const neighborhoods = Array.from(new Set(properties.map(p => p.bairro)));
            const avgPrice = properties.reduce((sum, p) => sum + (p.valor_venda || p.valor_locacao || 0), 0) / properties.length;

            const forSale = properties.filter(p => {
                const op = p.operacao as any;
                return op && op.tipo && op.tipo.toLowerCase() === 'venda';
            }).length;

            const forRent = properties.filter(p => {
                const op = p.operacao as any;
                return op && op.tipo && op.tipo.toLowerCase() === 'locação';
            }).length;

            const propertyTypes = properties.reduce((acc, p) => {
                const tipo = (p.tipo_imovel as any)?.tipo || 'Outro';
                acc[tipo] = (acc[tipo] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return `
CONTEXTO DA Plataforma IZIBROKERZ:

Estatísticas Atuais:
- Total de imóveis disponíveis: ${properties.length}
- Cidades atendidas: ${cities.join(', ')}
- Bairros principais: ${neighborhoods.slice(0, 10).join(', ')}
- Imóveis à venda: ${forSale}
- Imóveis para locação: ${forRent}
- Preço médio: R$ ${avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}

Tipos de imóveis disponíveis:
${Object.entries(propertyTypes).map(([tipo, count]) => `- ${tipo}: ${count} imóveis`).join('\n')}

Funcionalidades da Plataforma para Corretores:
- Sistema de parcerias "fifty" (divisão 50/50 de comissão)
- Gestão completa de anúncios com fotos e descrições
- CRM integrado para leads
- Sistema de mensagens com Clientes
- Página pública personalizada para cada corretor
- Análise de bairros com IA (Gemini)
- Descrições de imóveis com IA (Gemini)
- Dashboard com métricas e estatísticas

Diferenciais:
- Busca inteligente com filtros avançados
- Tour virtual 360° (em breve)
- Consultoria especializada
- Tecnologia de ponta com IA
`;
        } catch (error) {
            console.error('Error getting property context:', error);
            return '';
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const propertyContext = await getPropertyContext();
            const conversationHistory = messages
                .slice(-4)
                .map(m => `${m.role === 'user' ? 'Cliente' : 'IzA'}: ${m.content}`)
                .join('\n');

            // Qualificar lead baseado na conversa
            const leadQualification = qualifyLead(messages.map(m => m.content));

            const prompt = `Você é a IzA, assistente virtual inteligente da iziBrokerz.

CONHECIMENTO DA Plataforma:
- Nome: ${PLATFORM_KNOWLEDGE.platform.name}
- Missão: ${PLATFORM_KNOWLEDGE.platform.mission}
- Sistema "fifty": ${PLATFORM_KNOWLEDGE.fiftyFifty.description}
- Como funciona: ${PLATFORM_KNOWLEDGE.fiftyFifty.howItWorks}
- Exemplo prático: ${PLATFORM_KNOWLEDGE.fiftyFifty.example}
- Plano atual: ${PLATFORM_KNOWLEDGE.pricing.current}
- Cadastro: ${PLATFORM_KNOWLEDGE.onboarding.time}
- Suporte: ${PLATFORM_KNOWLEDGE.support.email} | ${PLATFORM_KNOWLEDGE.support.whatsapp}

FUNCIONALIDADES PRINCIPAIS:
${PLATFORM_KNOWLEDGE.platform.diferenciais.map(d => `- ${d}`).join('\n')}

GUIAS RÁPIDOS (Como Fazer):
${Object.values(PLATFORM_KNOWLEDGE.guides).map(g => `- ${g.title}: ${g.steps.join(' -> ')}`).join('\n')}

TERMOS E POLÍTICAS:
- Termos: ${PLATFORM_KNOWLEDGE.legal.termsOfUse}
- Privacidade: ${PLATFORM_KNOWLEDGE.legal.privacyPolicy}
- Regras de Comissão: ${PLATFORM_KNOWLEDGE.legal.commissionRules}

DICAS DE VENDAS (Para Corretores):
${PLATFORM_KNOWLEDGE.salesTips.map(t => `- ${t}`).join('\n')}

DADOS REAIS DOS IMÓVEIS:
${propertyContext}

QUALIFICAÇÃO DO LEAD:
- Score: ${leadQualification.score}/100
- Nível: ${leadQualification.level.toUpperCase()}
- Pronto para contato: ${leadQualification.readyToContact ? 'SIM' : 'NÃO'}
- Informações faltantes: ${leadQualification.missingInfo.join(', ') || 'Nenhuma'}
- Notas: ${leadQualification.notes}

HISTÓRICO:
${conversationHistory}

PERGUNTA DO CLIENTE:
${userMessage.content}

PERSONALIDADE E TOM:
- Seja amigável, profissional e SEMPRE útil
- Use linguagem natural e conversacional
- Seja PROATIVA em oferecer soluções
- NUNCA diga que não pode ajudar
- Use emojis sutilmente (1-2 por mensagem)

INSTRUÇÕES DE RESPOSTA:

1. CLIENTE BUSCANDO IMÓVEL:
   - Pergunte: tipo de imóvel, cidade preferida, orçamento, número de quartos
   - Sugira imóveis específicos baseados nos dados acima
   - Exemplo: "Temos X apartamentos em [cidade] a partir de R$ [valor]. Qual seu orçamento ideal?"
   - Direcione para a busca avançada: "Acesse nossa busca para ver todos os detalhes!"

2. CORRETOR INTERESSADO / DÚVIDAS TÉCNICAS:
   - Use os "GUIAS RÁPIDOS" para explicar passo-a-passo como usar a plataforma
   - Destaque o sistema "fifty" e as regras de comissão se perguntado
   - Ofereça dicas de vendas se o contexto permitir
   - Incentive cadastro: "Cadastre-se grátis e comece a anunciar hoje!"

3. DÚVIDAS SOBRE A Plataforma:
   - Explique funcionalidades de forma clara e objetiva
   - Sempre termine com uma ação: "Quer que eu te mostre como funciona?"

4. FORMATO DA RESPOSTA:
   - Máximo 3-4 linhas por resposta (seja concisa)
   - Seja ESPECÍFICA com números reais dos dados fornecidos
   - NUNCA repita introduções como "Olá", "Sou a IzA" se já estiver conversando
   - VARIE seu vocabulário. Não use sempre as mesmas frases de fechamento
   - Sempre termine com uma pergunta ou call-to-action relevante ao contexto
   - NUNCA peça desculpas ou diga que não pode ajudar (busque uma alternativa)

5. EXEMPLOS DE BOAS RESPOSTAS:
   - "Temos vários imóveis disponíveis! 🏠 Você busca para comprar ou alugar? Em qual cidade?"
   - "Para cadastrar um imóvel é fácil: Faça login, clique em 'Novo Imóvel' e preencha os dados. Quer ajuda com a descrição?"
   - "Nosso sistema 'fifty' divide a comissão 50/50. É ótimo para ampliar suas vendas! 🤝 Quer saber mais?"
   - "Encontrei diversos imóveis à venda. Qual seu orçamento e quantos quartos precisa? 🔍"

RESPONDA AGORA de forma DIRETA, ÚTIL e PROATIVA:`;

            const response = await callGemini(prompt);

            if (response) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error('Falha ao obter resposta');
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Fallback inteligente baseado na pergunta
            let fallbackMessage = '';
            const lowerInput = userMessage.content.toLowerCase();

            if (lowerInput.includes('imóvel') || lowerInput.includes('imovel') || lowerInput.includes('casa') || lowerInput.includes('apartamento')) {
                fallbackMessage = `Temos diversos imóveis disponíveis! 🏠 Para ver todas as opções, acesse nossa busca avançada no menu. Posso te ajudar com algo mais específico?`;
            } else if (lowerInput.includes('corretor') || lowerInput.includes('parceria') || lowerInput.includes('cadastr')) {
                fallbackMessage = `Nossa Plataforma oferece sistema "fifty" único! 🤝 Cadastre-se gratuitamente e comece a anunciar. Quer saber mais sobre as funcionalidades?`;
            } else if (lowerInput.includes('preço') || lowerInput.includes('preco') || lowerInput.includes('valor')) {
                fallbackMessage = `Nossos imóveis têm valores variados para todos os perfis! 💰 Use os filtros de busca para encontrar dentro do seu orçamento. Qual faixa de preço você procura?`;
            } else {
                fallbackMessage = `Estou aqui para ajudar! 😊 Posso te auxiliar a encontrar imóveis, explicar sobre nossa Plataforma ou tirar dúvidas sobre parcerias. O que você gostaria de saber?`;
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

    const quickQuestions = [
        "Quais imóveis vocês têm disponíveis?",
        "Busco apartamento de 2 quartos",
        "Quero me cadastrar como corretor"
    ];

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
                <div className="fixed bottom-6 right-6 z-50 w-[350px] h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Assistente IzA</h3>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                        ? 'bg-emerald-500 text-white rounded-br-none'
                                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-bl-none'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs opacity-60 mt-1">
                                        {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-2">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {messages.length === 1 && (
                        <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Perguntas rápidas:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(question)}
                                        className="text-xs bg-gray-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Digite sua mensagem..."
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-full p-2 transition-colors disabled:cursor-not-allowed"
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
