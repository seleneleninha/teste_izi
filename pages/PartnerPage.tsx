import React, { useState, useEffect } from 'react';
import { Check, Star, Users, Building2, Handshake, Zap, Shield, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Footer } from '../components/Footer';

interface Plan {
    id: string;
    nome: string;
    limite_anuncios: number;
    limite_parcerias: number;
    preco_mensal: number;
    preco_anual: number;
    destaque: boolean;
    features: string[];
}

export const PartnerPage: React.FC = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        properties: 0,
        brokers: 0,
        partnerships: 0
    });

    useEffect(() => {
        fetchPlans();
        fetchStats();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('planos')
                .select('*')
                .order('preco_mensal', { ascending: true });

            if (data) {
                setPlans(data);
            } else {
                // Fallback mock data if table is empty or not created yet
                setPlans([
                    {
                        id: '1',
                        nome: 'Básico',
                        limite_anuncios: 10,
                        limite_parcerias: 10,
                        preco_mensal: 99.90,
                        preco_anual: 959.04,
                        destaque: false,
                        features: ['Até 10 Anúncios', 'Até 10 Parcerias', 'Painel de Controle Básico', 'Suporte por Email']
                    },
                    {
                        id: '2',
                        nome: 'Intermediário',
                        limite_anuncios: 25,
                        limite_parcerias: 20,
                        preco_mensal: 199.90,
                        preco_anual: 1919.04,
                        destaque: false,
                        features: ['Até 25 Anúncios', 'Até 20 Parcerias', 'Painel de Controle Completo', 'Suporte Prioritário', 'Estatísticas de Visualização']
                    },
                    {
                        id: '3',
                        nome: 'Avançado',
                        limite_anuncios: 50,
                        limite_parcerias: 30,
                        preco_mensal: 299.90,
                        preco_anual: 2879.04,
                        destaque: true,
                        features: ['Até 50 Anúncios', 'Até 30 Parcerias', 'Destaque nos Resultados', 'Suporte via WhatsApp', 'Relatórios Avançados', 'Selo de Corretor Verificado']
                    },
                    {
                        id: '4',
                        nome: 'Profissional',
                        limite_anuncios: 100,
                        limite_parcerias: 50,
                        preco_mensal: 499.90,
                        preco_anual: 4799.04,
                        destaque: false,
                        features: ['Até 100 Anúncios', 'Até 50 Parcerias', 'Prioridade Máxima em Buscas', 'Gerente de Conta Dedicado', 'API de Integração', 'Importação XML (Em breve)']
                    }
                ]);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            // In a real scenario, we would count rows. For now, we'll use approximate real numbers or mocks.
            // const { count: propCount } = await supabase.from('anuncios').select('*', { count: 'exact', head: true });
            // const { count: brokerCount } = await supabase.from('perfis').select('*', { count: 'exact', head: true }).eq('cargo', 'Corretor');

            // Mocking for "selling" effect as requested
            setStats({
                properties: 1250,
                brokers: 580,
                partnerships: 320
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen font-sans">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1920"
                        alt="Office Background"
                        className="w-full h-full object-cover opacity-20 dark:opacity-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-white dark:from-slate-900/80 dark:via-slate-900/50 dark:to-slate-900"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6 animate-fade-in-up">
                        Para Corretores e Imobiliárias
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight animate-fade-in-up delay-100">
                        Acelere suas Vendas com o Poder da <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Colaboração Inteligente</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in-up delay-200">
                        Junte-se à plataforma que está revolucionando o mercado imobiliário através de parcerias estratégicas e tecnologia de ponta.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
                        <button
                            onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            Começar Agora
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                        >
                            Já tenho conta
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-10 bg-emerald-50 dark:bg-slate-800/50 border-y border-emerald-100 dark:border-slate-700">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="p-6">
                            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">+{stats.properties}</div>
                            <div className="text-gray-600 dark:text-gray-400 font-medium">Imóveis Cadastrados</div>
                        </div>
                        <div className="p-6 border-t md:border-t-0 md:border-l border-emerald-200 dark:border-slate-600">
                            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">+{stats.brokers}</div>
                            <div className="text-gray-600 dark:text-gray-400 font-medium">Corretores Parceiros</div>
                        </div>
                        <div className="p-6 border-t md:border-t-0 md:border-l border-emerald-200 dark:border-slate-600">
                            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">+{stats.partnerships}</div>
                            <div className="text-gray-600 dark:text-gray-400 font-medium">Parcerias Realizadas</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Por que escolher a iziBrokerz?</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Nossa plataforma foi desenhada por corretores para corretores, focando no que realmente importa: fechar negócios.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Handshake className="w-10 h-10 text-emerald-500" />,
                                title: "Sistema de Parcerias Único",
                                description: "Conecte-se automaticamente com corretores que têm o cliente para o seu imóvel ou o imóvel para o seu cliente. Amplie seu estoque e sua carteira instantaneamente."
                            },
                            {
                                icon: <Zap className="w-10 h-10 text-emerald-500" />,
                                title: "Intuitiva e Objetiva",
                                description: "Interface limpa e moderna, sem complicações. Cadastre imóveis em minutos e gerencie seus leads com facilidade, tanto no desktop quanto no mobile."
                            },
                            {
                                icon: <Shield className="w-10 h-10 text-emerald-500" />,
                                title: "Segurança e Credibilidade",
                                description: "Ambiente seguro para negociações. Todos os corretores são verificados pelo CRECI, garantindo parcerias sérias e profissionais."
                            },
                            {
                                icon: <BarChart3 className="w-10 h-10 text-emerald-500" />,
                                title: "Gestão de Leads Inteligente",
                                description: "Não perca mais vendas. Nosso CRM integrado ajuda você a acompanhar cada etapa do funil de vendas e qualificar seus contatos."
                            },
                            {
                                icon: <Users className="w-10 h-10 text-emerald-500" />,
                                title: "Rede de Colaboração",
                                description: "Faça parte de uma comunidade ativa. Troque experiências, indicações e cresça junto com os melhores profissionais do mercado."
                            },
                            {
                                icon: <Building2 className="w-10 h-10 text-emerald-500" />,
                                title: "Importação XML (Em Breve)",
                                description: "Traga seus imóveis de outros portais ou CRMs automaticamente. Estamos finalizando a integração para facilitar sua migração."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl hover:shadow-lg transition-all border border-gray-100 dark:border-slate-700 group">
                                <div className="mb-6 p-3 bg-white dark:bg-slate-700 rounded-xl w-fit group-hover:scale-110 transition-transform shadow-sm">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="plans" className="py-20 bg-gray-50 dark:bg-slate-950 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Escolha o Plano Ideal para Você</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Comece com nosso teste grátis de 14 dias. Cancele a qualquer momento.
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Mensal</span>
                            <button
                                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                                className={`relative w-16 h-8 rounded-full transition-colors ${billingCycle === 'annual' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${billingCycle === 'annual' ? 'translate-x-8' : ''}`}></div>
                            </button>
                            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                Anual <span className="text-emerald-500 text-xs font-bold ml-1">(-20%)</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border transition-all hover:-translate-y-2 ${plan.destaque
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                        : 'border-gray-100 dark:border-slate-700 hover:border-emerald-300'
                                    }`}
                            >
                                {plan.destaque && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                        Mais Popular
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.nome}</h3>
                                <div className="mb-6">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        R$ {billingCycle === 'monthly' ? plan.preco_mensal.toFixed(2).replace('.', ',') : (plan.preco_anual / 12).toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-gray-500 text-sm">/mês</span>
                                    {billingCycle === 'annual' && (
                                        <div className="text-xs text-emerald-500 font-medium mt-1">
                                            Faturado R$ {plan.preco_anual.toFixed(2).replace('.', ',')} anualmente
                                        </div>
                                    )}
                                </div>

                                <button className={`w-full py-3 rounded-xl font-bold mb-6 transition-colors ${plan.destaque
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                        : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                                    }`}>
                                    Assinar Agora
                                </button>

                                <ul className="space-y-3 text-sm">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center bg-emerald-50 dark:bg-slate-800/50 p-6 rounded-xl border border-emerald-100 dark:border-slate-700 max-w-2xl mx-auto">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                            <Star className="text-yellow-400 fill-yellow-400" size={20} />
                            Teste Grátis por 14 dias
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Experimente qualquer plano sem compromisso. Não pedimos cartão de crédito para começar.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-emerald-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pronto para transformar seus resultados?</h2>
                    <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
                        Junte-se a centenas de corretores que já estão fechando mais negócios com a iziBrokerz.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-10 py-4 bg-white text-emerald-600 rounded-xl font-bold text-lg shadow-xl hover:bg-gray-50 transition-all transform hover:scale-105"
                    >
                        Criar Conta Gratuita
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
};
