import React, { useState, useEffect } from 'react';
import { Check, Star, Users, Building2, Handshake, Zap, Shield, BarChart3, ArrowRight, CheckCircle2, Target, Ticket, Trophy, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Footer } from '../components/Footer';
import { PartnersCarousel } from '../components/PartnersCarousel';
import { useToast } from '../components/ToastContext';
import { getRandomBackground } from '../lib/backgrounds';

interface Plan {
    id: string;
    nome: string;
    limite_anuncios: number;
    limite_parcerias: number;
    preco_mensal: number;
    preco_anual: number;
    destaque: boolean;
}

interface Beneficio {
    id: string;
    nome: string;
    descricao?: string;
    icone?: string;
    ordem: number;
    ativo: boolean;
}

interface PlanoBeneficio {
    plano_id: string;
    beneficio_id: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const PartnerPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
    const [planoBeneficios, setPlanoBeneficios] = useState<PlanoBeneficio[]>([]);
    const [allExpanded, setAllExpanded] = useState(false);
    const [loading, setLoading] = useState(true);

    // Challenge & Coupon State
    const [simulatedDiscount, setSimulatedDiscount] = useState(0);
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, percent: number } | null>(null);

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
            // Fetch plans
            const { data: plansData, error: plansError } = await supabase
                .from('planos')
                .select('*')
                .order('preco_mensal', { ascending: true });

            if (plansError) throw plansError;
            if (plansData) setPlans(plansData);

            // Fetch all benefits from catalog
            const { data: beneficiosData, error: beneficiosError } = await supabase
                .from('beneficios')
                .select('*')
                .eq('ativo', true)
                .order('ordem', { ascending: true });

            if (beneficiosError) throw beneficiosError;
            if (beneficiosData) setBeneficios(beneficiosData);

            // Fetch all plan-benefit relationships
            const { data: pbData, error: pbError } = await supabase
                .from('plano_beneficios')
                .select('*');

            if (pbError) throw pbError;
            if (pbData) setPlanoBeneficios(pbData);

        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get benefits for a specific plan
    const getPlanBeneficios = (planId: string): Beneficio[] => {
        const beneficioIds = planoBeneficios
            .filter(pb => pb.plano_id === planId)
            .map(pb => pb.beneficio_id);
        return beneficios.filter(b => beneficioIds.includes(b.id));
    };

    const fetchStats = async () => {
        try {
            // In a real scenario, we would count rows. For now, we'll use approximate real numbers or mocks.
            // const { count: propCount } = await supabase.from('anuncios').select('*', { count: 'exact', head: true });

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

    // Scroll Logic for Sticky Bubble (Mobile & Desktop)
    const [showStickyBubble, setShowStickyBubble] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            const plansSection = document.getElementById('plans');
            const challengeSection = document.getElementById('challenge-section');

            if (plansSection && challengeSection) {
                const plansRect = plansSection.getBoundingClientRect();
                const challengeRect = challengeSection.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                // Show if Plans Top is above middle of screen AND Challenge is not yet fully visible
                // Basically: user is looking at plans but hasn't reached challenge
                const startedPlans = plansRect.top < windowHeight / 2;
                const reachedChallenge = challengeRect.top < windowHeight - 100;

                if (startedPlans && !reachedChallenge) {
                    setShowStickyBubble(true);
                } else {
                    setShowStickyBubble(false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToChallenge = () => {
        document.getElementById('challenge-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleApplyCoupon = () => {
        const code = couponCode.toUpperCase().trim();
        if (code === 'IZI50') {
            setAppliedCoupon({ code: 'IZI50', percent: 50 });
            setSimulatedDiscount(50);
            setShowCouponInput(false);
            addToast('Cupom de 50% de LANÇAMENTO aplicado!', 'success');
        } else if (code === 'IZI30') {
            setAppliedCoupon({ code: 'IZI30', percent: 30 });
            setSimulatedDiscount(30);
            setShowCouponInput(false);
            addToast('Cupom de 30% aplicado com sucesso!', 'success');
        } else {
            addToast('Cupom inválido ou expirado.', 'error');
        }
    };

    // Calculate effective discount (either simulation or real applied coupon)
    // Applied coupon locks the discount visualization
    const activeDiscount = appliedCoupon ? appliedCoupon.percent : simulatedDiscount;

    return (
        <div className="bg-slate-900 min-h-screen font-sans">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={getRandomBackground()}
                        alt="Office Background"
                        className="w-full h-full object-cover opacity-50 dark:opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-midnight-950/95"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/30 text-white text-lg font-semibold mb-6 animate-fade-in-up">
                        Para Corretores Autônomos de todo Brasil
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up delay-100">
                        Acelere suas Vendas com<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Colaboração Inteligente</span>
                    </h1>
                    <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in-up delay-200">
                        Junte-se à Plataforma que está revolucionando o mercado imobiliário através de parcerias estratégicas.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
                        <button
                            onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            Começar Agora
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-full font-bold text-lg hover:bg-slate-700 transition-all"
                        >
                            Já tenho conta
                        </button>
                    </div>
                </div>
            </section>

            {/* Partners Carousel */}
            <PartnersCarousel bgColor="bg-midnight-950" />

            {/* Stats Section */}
            <section className="py-4 bg-midnight-800">
                <div className="container mx-auto px-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4">
                            <div className="text-4xl font-bold text-emerald-600 text-emerald-400">+{stats.properties}</div>
                            <div className="text-gray-400 font-medium">Imóveis Cadastrados</div>
                        </div>
                        <div className="p-4 border-t md:border-t-0 md:border-l border-emerald-200 border-slate-600">
                            <div className="text-4xl font-bold text-emerald-600 text-emerald-400">+{stats.brokers}</div>
                            <div className="text-gray-400 font-medium">Corretores Parceiros</div>
                        </div>
                        <div className="p-4 border-t md:border-t-0 md:border-l border-emerald-200 border-slate-600">
                            <div className="text-4xl font-bold text-emerald-600 text-emerald-400">+{stats.partnerships}</div>
                            <div className="text-gray-400 font-medium">Parcerias Realizadas</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gradient-to-b from-slate-900 via-slate-900 to-midnight-950 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-4 border border-emerald-500/20">
                            Recursos Exclusivos
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Por que escolher a <span className="text-red-500 font-bold">izi</span><span className="text-white font-bold">Brokerz.</span>?</h2>
                        <p className="text-slate-300 text-xl max-w-2xl mx-auto">
                            Nossa Plataforma foi desenvolvida de <span className="text-yellow-400 font-bold">CORRETORES PARA CORRETORES!</span> Focando no que realmente importa:
                        </p>
                        <p className="text-emerald-400 text-xl font-bold max-w-2xl mx-auto mt-2">
                            FECHAR + NEGÓCIOS E COLOCAR + DINHEIRO NO SEU BOLSO!!!
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Handshake className="w-10 h-10 text-emerald-500" />,
                                title: "Sistema de Parcerias",
                                description: "Conecte-se com corretores da sua região. Aumente seu portfólio e multiplique suas chances de venda."
                            },
                            {
                                icon: <Zap className="w-10 h-10 text-emerald-500" />,
                                title: "Intuitiva e Objetiva",
                                description: "Interface eficiente. Cadastre imóveis rapidamente, gerencie leads e foque no que realmente importa: seus resultados."
                            },
                            {
                                icon: <Shield className="w-10 h-10 text-emerald-500" />,
                                title: "Segurança e Credibilidade",
                                description: "Todos os corretores parceiros são verificados no CRECI/COFECI, garantindo segurança total para suas negociações."
                            },
                            {
                                icon: <BarChart3 className="w-10 h-10 text-emerald-500" />,
                                title: "Gestão de Leads Inteligente",
                                description: "CRM simples e eficiente para acompanhar seus Clientes. Qualifique contatos e não perca oportunidades de venda."
                            },
                            {
                                icon: <Target className="w-10 h-10 text-emerald-500" />,
                                title: "Match Inteligente",
                                description: "Cadastre seu Cliente e nossa Plataforma busca automaticamente em nossa base de dados, o imóvel ideal para ele."
                            },
                            {
                                icon: <Building2 className="w-10 h-10 text-emerald-500" />,
                                title: "Importação XML (Em Breve)",
                                description: "Você poderá importar seus imóveis de outros portais com poucos cliques, facilitando a gestão do seu portfólio."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 p-8 rounded-2xl hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 border border-slate-700/50 hover:border-emerald-500/30 group backdrop-blur-sm">
                                <div className="mb-6 p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl w-fit group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="plans" className="py-20 bg-slate-950 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Escolha o Plano Ideal para Você</h2>
                        <p className="text-xl text-gray-400 mb-8">
                            Planos flexíveis que crescem com você.
                        </p>

                        {/* Free Trial CTA moved here */}
                        <div className="bg-emerald-500/40 p-4 rounded-full border-2 border-emerald-500 border-slate-700 max-w-xl mx-auto mb-8 cursor-pointer hover:shadow-md transition-shadow animate-pulse" onClick={() => navigate('/login?register=true')}>
                            <h4 className="font-bold text-yellow-400 mb-1 flex items-center justify-center gap-2">
                                <Star className="text-yellow-400 fill-yellow-400" size={28} />
                                <p className="text-center text-lg">TESTE GRÁTIS POR 14 DIAS</p>
                            </h4>
                            <p className="text-sm text-gray-400">
                                Sem cartão de crédito. Cancele quando quiser.
                                <p className="underline font-bold text-emerald-500 cursor-pointer text-lg">CLIQUE AQUI!</p>
                            </p>
                        </div>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Mensal</span>
                            <button
                                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                                className={`relative w-16 h-8 rounded-full transition-colors animate-pulse ${billingCycle === 'annual' ? 'bg-emerald-500' : 'bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform animate-pulse ${billingCycle === 'annual' ? 'translate-x-8' : ''}`}></div>
                            </button>
                            <span className={`text-lg font-medium ${billingCycle === 'annual' ? 'text-white' : 'text-emerald-500 animate-pulse'}`}>
                                Anual <span className="text-emerald-500 text-md font-bold ml-1 animate-pulse">(20% DESCONTO)</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {plans.map((plan) => {
                            const monthlyCost = plan.preco_mensal * 12;
                            const annualCost = plan.preco_anual;

                            // Base prices (Monthly or Annual/12)
                            const baseDisplayPrice = billingCycle === 'monthly' ? plan.preco_mensal : (plan.preco_anual / 12);

                            // Apply active discount logic
                            const finalDisplayPrice = baseDisplayPrice * (1 - (activeDiscount / 100));

                            // Savings calculation (Always compares to base monthly * 12)
                            // If annual, savings = (monthly * 12) - (annual_price_with_discount)
                            const annualPriceWithDiscount = plan.preco_anual * (1 - (activeDiscount / 100));
                            const totalSavings = (plan.preco_mensal * 12) - annualPriceWithDiscount;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-slate-900 rounded-3xl p-6 shadow-lg border transition-all hover:-translate-y-2 ${plan.destaque
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                        : 'border-slate-700 hover:border-emerald-300'
                                        }`}
                                >
                                    {plan.destaque && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                            Mais Popular
                                        </div>
                                    )}

                                    {/* Active Discount Badge */}
                                    {activeDiscount > 0 && (
                                        <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                                            -{activeDiscount}% OFF
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-white mb-2">{plan.nome}</h3>
                                    <div className="mb-6">
                                        {/* Original Price Strikethrough (Annual or Discounted) */}
                                        {(billingCycle === 'annual' || activeDiscount > 0) && (
                                            <div className="text-gray-400 text-lg font-bold mb-1">
                                                De <span className="line-through decoration-red-500 decoration-2">
                                                    R${formatCurrency(plan.preco_mensal)}/mês
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-3xl font-bold ${activeDiscount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                                                R${formatCurrency(finalDisplayPrice)}
                                            </span>
                                            <span className="text-gray-500 text-xs">por mês</span>
                                        </div>

                                        {billingCycle === 'annual' && (
                                            <div className="font-bold text-md text-emerald-500 mt-1">
                                                Economize R${formatCurrency(totalSavings)} no ano
                                                <p className="font-light text-sm text-slate-300">
                                                    Pagamento único de R${formatCurrency(annualPriceWithDiscount)}
                                                </p>
                                            </div>
                                        )}
                                        {/* Discount Note */}
                                        {activeDiscount > 0 && (
                                            <p className="text-xs text-red-500 font-bold mt-2 animate-pulse">
                                                *Cupom de {activeDiscount}% aplicado na simulação
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => navigate('/login?register=true')}
                                        className={`w-full py-3 rounded-full font-bold mb-6 transition-colors ${plan.destaque
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                                            }`}>
                                        Assinar Agora
                                    </button>

                                    {/* Quantified Limits */}
                                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                                        <div className="flex items-center justify-center gap-2 text-gray-300">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            <span className="text-lg">Até <span className="font-bold text-white">{plan.limite_anuncios}</span> Anúncios</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-gray-300">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            <span className="text-lg">Até <span className="font-bold text-white">{plan.limite_parcerias}</span> Parcerias</span>
                                        </div>
                                    </div>

                                    {/* Benefits List with Tiered Display */}
                                    {(() => {
                                        const planBeneficios = getPlanBeneficios(plan.id);
                                        const planIndex = plans.findIndex(p => p.id === plan.id);

                                        // Filter out "Limite de Anúncios" and "Limite de Parcerias" (already shown above)
                                        const filteredBeneficios = planBeneficios.filter(b =>
                                            !b.nome.toLowerCase().includes('limite de anúncios') &&
                                            !b.nome.toLowerCase().includes('limite de parcerias')
                                        );

                                        // Get previous tier's benefits (if not first plan)
                                        let previousTierBeneficioIds: string[] = [];
                                        let previousTierName = '';
                                        if (planIndex > 0) {
                                            const previousPlan = plans[planIndex - 1];
                                            const previousBeneficios = getPlanBeneficios(previousPlan.id);
                                            previousTierBeneficioIds = previousBeneficios.map(b => b.id);
                                            previousTierName = previousPlan.nome;
                                        }

                                        // Calculate incremental benefits (only new in this tier) - EXCLUDING special items
                                        const incrementalBeneficios = filteredBeneficios.filter(b =>
                                            !previousTierBeneficioIds.includes(b.id) &&
                                            !b.nome.toLowerCase().includes('selo verificado') &&
                                            !b.nome.toLowerCase().includes('botão fixo')
                                        );

                                        // Special items (Selo Verificado, Botão Fixo) - ALWAYS show if current plan has them
                                        const specialItems = filteredBeneficios.filter(b =>
                                            b.nome.toLowerCase().includes('selo verificado') ||
                                            b.nome.toLowerCase().includes('botão fixo')
                                        );

                                        // Regular items are just incrementals (special items handled separately)
                                        const regularItems = incrementalBeneficios;

                                        // Combine: regular first, special last
                                        const orderedBeneficios = [...regularItems, ...specialItems];

                                        const isExpanded = allExpanded;
                                        const visibleBeneficios = isExpanded ? orderedBeneficios : orderedBeneficios.slice(0, 3);
                                        const hiddenCount = orderedBeneficios.length - 3;

                                        // Get tier info based on plan name
                                        const getTierInfo = (planName: string) => {
                                            const name = planName.toLowerCase();
                                            if (name.includes('profissional')) return { tier: 'Ouro', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
                                            if (name.includes('avançado')) return { tier: 'Prata', color: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/30' };
                                            if (name.includes('intermediário')) return { tier: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
                                            return null;
                                        };

                                        // Get Botão type based on plan name
                                        const getBotaoType = (planName: string) => {
                                            const name = planName.toLowerCase();
                                            if (name.includes('profissional') || name.includes('avançado')) return 'Agente de IA';
                                            if (name.includes('intermediário')) return 'ChatBot';
                                            return 'WhatsApp';
                                        };

                                        const tierInfo = getTierInfo(plan.nome);
                                        const botaoType = getBotaoType(plan.nome);

                                        return (
                                            <>
                                                {/* Previous tier inheritance badge */}
                                                {previousTierName && (
                                                    <div className="flex items-center justify-center gap-2 mb-3 p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                        <span className="text-sm text-slate-300">
                                                            Tudo do <span className="font-bold text-white">{previousTierName}</span> +
                                                        </span>
                                                    </div>
                                                )}

                                                <ul className="space-y-2 text-sm">
                                                    {visibleBeneficios.map((beneficio) => {
                                                        const isSelo = beneficio.nome.toLowerCase().includes('selo verificado');
                                                        const isBotao = beneficio.nome.toLowerCase().includes('botão fixo');

                                                        // Selo Verificado - Special styled item with tier
                                                        if (isSelo && tierInfo) {
                                                            return (
                                                                <li key={beneficio.id} className={`flex items-center justify-center gap-2 p-2 rounded-lg ${tierInfo.bg} border ${tierInfo.border}`}>
                                                                    <Shield size={16} className={`${tierInfo.color} shrink-0`} />
                                                                    <span className={`text-sm font-bold ${tierInfo.color}`}>
                                                                        Selo Verificado: {tierInfo.tier}
                                                                    </span>
                                                                </li>
                                                            );
                                                        }

                                                        // Botão Fixo - Show specific type
                                                        if (isBotao) {
                                                            return (
                                                                <li key={beneficio.id} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                                                    <Zap size={16} className="text-emerald-400 shrink-0" />
                                                                    <span className="text-sm justify-center font-bold text-emerald-400">
                                                                        Botão Fixo: {botaoType}
                                                                    </span>
                                                                </li>
                                                            );
                                                        }

                                                        // Regular benefit item
                                                        const isXML = beneficio.nome.toLowerCase().includes('importação xml');
                                                        return (
                                                            <li key={beneficio.id} className="flex items-center justify-center gap-2 text-gray-300">
                                                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                                                <span className="text-sm">
                                                                    {beneficio.nome}
                                                                    {isXML && (
                                                                        <span className="ml-1 text-xs font-semibold text-yellow-400">
                                                                            EM BREVE
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>

                                                {/* Expand/Collapse Button - Expands ALL cards */}
                                                {hiddenCount > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAllExpanded(!allExpanded);
                                                        }}
                                                        className="mt-3 w-full flex items-center justify-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors py-2 rounded-lg hover:bg-slate-700/50"
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <ChevronUp size={14} />
                                                                Ver menos
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown size={14} />
                                                                + {hiddenCount} benefícios
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}

                                </div>
                            )
                        })}
                    </div>

                    {/* --- CHALLENGE SECTION --- */}
                    <div id="challenge-section" className="mt-16 max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 border border-slate-700 shadow-2xl relative overflow-hidden group">
                        {/* Interactive Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>

                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-full mb-6 animate-bounce">
                                <Trophy className="text-red-500 w-8 h-8" />
                            </div>

                            <h3 className="text-2xl md:text-3xl font-black text-white mb-4 italic tracking-tight">
                                "AINDA ACHA QUE ESTÁ CARO???"
                            </h3>
                            <p className="text-xl md:text-2xl text-gray-400 font-light mb-10">
                                Pelo que oferecemos... <span className="text-emerald-400 font-bold">TEM CERTEZA?</span>
                            </p>

                            <div className="bg-slate-950/50 rounded-2xl p-8 mb-8 backdrop-blur-sm border border-slate-800">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                                    <Ticket className="text-yellow-500" />
                                    Quer Um Cupom de Desconto?
                                    <Ticket className="text-yellow-500" />
                                </h3>

                                {/* Dynamic Slider */}
                                <div className="mb-8 px-4">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-yellow-500 text-xs">10%</span>
                                        <span className="text-green-500 font-medium text-md">30%</span>
                                        <span className="text-blue-500 font-bold text-lg">50%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="50"
                                        step="20"
                                        value={simulatedDiscount}
                                        onChange={(e) => {
                                            if (!appliedCoupon) {
                                                setSimulatedDiscount(Number(e.target.value));
                                            }
                                        }}
                                        disabled={!!appliedCoupon}
                                        className={`w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all ${appliedCoupon ? 'opacity-50 cursor-not-allowed' : 'hover:accent-emerald-400'}`}
                                    />
                                    <p className="mt-4 text-gray-400 text-md">
                                        Arraste para simular o <span className="text-white font-bold">DESCONTO DE LANÇAMENTO</span>
                                    </p>
                                </div>

                                {!showCouponInput && !appliedCoupon ? (
                                    <button
                                        onClick={() => setShowCouponInput(true)}
                                        className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-900 hover:to-red-800 text-white rounded-3xl font-black text-md shadow-lg shadow-red-900/30 transform hover:scale-105 transition-all w-auto md:w-auto"
                                    >
                                        AGORA SIM! QUERO MEU CUPOM!
                                    </button>
                                ) : showCouponInput && !appliedCoupon ? (
                                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-in fade-in zoom-in duration-300">
                                        <div className="relative w-full md:w-64">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                placeholder="DIGITE O CÓDIGO"
                                                className="w-full px-6 py-4 bg-slate-800 border-2 border-slate-600 rounded-full text-white font-bold text-center uppercase tracking-widest focus:border-emerald-500 focus:outline-none"
                                            />
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                        </div>
                                        <button
                                            onClick={handleApplyCoupon}
                                            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-lg transition-all w-full md:w-auto"
                                        >
                                            VALIDAR
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-xl inline-flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="bg-emerald-500 rounded-full p-2">
                                            <Check className="text-white w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-white text-lg">CUPOM APLICADO!</p>
                                            <p className="text-emerald-400 text-sm">Desconto de {appliedCoupon?.percent}% garantido.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sticky CTA Bubble (Mobile & Desktop) */}
            {showStickyBubble && (
                <button
                    onClick={scrollToChallenge}
                    className="fixed bottom-6 right-10 z-50 animate-bounce cursor-pointer hover:scale-0 transition-transform"
                >
                    <div className="relative bg-red-600 text-white px-6 py-4 rounded-tr-2xl rounded-2xl border-2 border-white flex items-center gap-3">
                        <span className="text-sm font-black whitespace-nowrap uppercase italic">Acha que ainda está caro?! 👇</span>
                        <div className="absolute -bottom-3 right-32 w-6 h-6 bg-red-600 border-r-2 border-b-2 border-white transform rotate-45"></div>
                    </div>
                </button>
            )}

            {/* CTA Section */}
            <section className="py-20 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/parceria.png"
                        alt="Parceria Growth"
                        className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/30 to-slate-900/30"></div>
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pronto para transformar seus resultados?</h2>
                    <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
                        Junte-se a centenas de corretores que já estão fechando mais negócios com a <span className="text-red-500 font-bold">izi</span><span className="text-white font-bold">Brokerz.</span>
                    </p>
                    <button
                        onClick={() => navigate('/login?register=true')}
                        className="px-10 py-4 bg-white text-emerald-600 rounded-full font-bold text-lg shadow-xl hover:bg-gray-50 transition-all transform hover:scale-105"
                    >
                        Quero Testar por 14 dias
                    </button>
                </div>
            </section>

            <Footer />
        </div >
    );
};
