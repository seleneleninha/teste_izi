import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Phone, Mail, Building2, Home, CheckCircle2, Search, Heart } from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';
import { useTheme } from '../components/ThemeContext';
import { Footer } from '../components/Footer';

interface BrokerProfile {
    id: string;
    nome: string;
    sobrenome: string;
    email: string;
    whatsapp: string;
    creci: string;
    uf_creci: string;
    avatar: string;
    cargo: string;
    slug: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    show_address: boolean;
    watermark_light: string;
    watermark_dark: string;
}

interface Property {
    id: string;
    user_id: string;
    cod_imovel: number;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    fotos: string[];
    operacao: any;
    tipo_imovel: any;
    quartos: number;
    banheiros: number;
    vagas: number;
    area_priv: number;
    aceita_parceria: boolean;
}

export const BrokerPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [broker, setBroker] = useState<BrokerProfile | null>(null);
    const [ownProperties, setOwnProperties] = useState<Property[]>([]);
    const [partnerProperties, setPartnerProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchBrokerData();
            // Salvar slug no sessionStorage para uso no PropertyDetails
            sessionStorage.setItem('brokerSlug', slug);
        }
    }, [slug]);

    const fetchBrokerData = async () => {
        try {
            setLoading(true);

            // Buscar dados do corretor pelo slug
            const { data: brokerData, error: brokerError } = await supabase
                .from('perfis')
                .select('*')
                .eq('slug', slug)
                .single();

            if (brokerError) throw brokerError;
            if (!brokerData) {
                navigate('/');
                return;
            }

            setBroker(brokerData);

            // Buscar imóveis do corretor
            const { data: ownPropsData, error: ownPropsError } = await supabase
                .from('anuncios')
                .select(`
          *,
          tipo_imovel (tipo),
          operacao (tipo)
        `)
                .eq('user_id', brokerData.id)
                .eq('status_aprovacao', 'aprovado')
                .order('created_at', { ascending: false });

            if (ownPropsError) throw ownPropsError;

            // Transform data
            const transformedOwnProps = ownPropsData?.map(p => ({
                ...p,
                fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                operacao: p.operacao?.tipo || p.operacao,
                tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
            })) || [];

            setOwnProperties(transformedOwnProps as any);

            // Buscar parcerias aceitas
            const { data: partnershipsData, error: partnershipsError } = await supabase
                .from('parcerias')
                .select(`
          property_id,
          anuncios (
            *,
            tipo_imovel (tipo),
            operacao (tipo)
          )
        `)
                .eq('user_id', brokerData.id);

            if (!partnershipsError && partnershipsData) {
                const transformedPartnerProps = partnershipsData
                    .map(p => p.anuncios)
                    .filter(Boolean)
                    .map((p: any) => ({
                        ...p,
                        fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                        operacao: p.operacao?.tipo || p.operacao,
                        tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
                    }));

                setPartnerProperties(transformedPartnerProps as any);
            }
        } catch (error) {
            console.error('Erro ao buscar dados do corretor:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!broker) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Corretor não encontrado</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">O corretor que você está procurando não existe.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                    >
                        Voltar para Home
                    </button>
                </div>
            </div>
        );
    }

    // Logo personalizada (watermark conforme tema)
    const brokerLogo = theme === 'dark' ? broker.watermark_light : broker.watermark_dark;

    return (
        <div className="bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
            {/* Hero Section Personalizado */}
            <section className="relative h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1920"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/70"></div>
                </div>

                <div className="container mx-auto px-4 z-10 relative">
                    <div className="text-center">
                        {/* Logo do Corretor */}
                        {brokerLogo && (
                            <img
                                src={brokerLogo}
                                alt={`${broker.nome} ${broker.sobrenome}`}
                                className="h-20 w-auto mx-auto mb-6 object-contain"
                            />
                        )}

                        {/* Foto de Perfil */}
                        <img
                            src={broker.avatar || `https://ui-avatars.com/api/?name=${broker.nome}+${broker.sobrenome}&size=200`}
                            alt={`${broker.nome} ${broker.sobrenome}`}
                            className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover mx-auto mb-4"
                        />

                        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-white">
                            {broker.nome} {broker.sobrenome}
                        </h1>
                        <p className="text-gray-200 text-xl mb-6">{broker.cargo || 'Corretor de Imóveis'}</p>

                        {/* Informações de Contato */}
                        <div className="flex flex-wrap gap-6 justify-center text-white mb-8">
                            <a
                                href={`https://wa.me/55${broker.whatsapp.replace(/\D/g, '')}`}
                                className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                            >
                                <Phone size={18} />
                                {broker.whatsapp}
                            </a>
                            <a
                                href={`mailto:${broker.email}`}
                                className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                            >
                                <Mail size={18} />
                                {broker.email}
                            </a>
                            <div className="flex items-center gap-2">
                                <Building2 size={18} />
                                CRECI {broker.creci}/{broker.uf_creci}
                            </div>
                        </div>

                        {/* Endereço (se habilitado) */}
                        {broker.show_address && broker.logradouro && (
                            <div className="flex items-start gap-2 text-primary-100 justify-center">
                                <MapPin size={18} className="mt-1" />
                                <span>
                                    {broker.logradouro}, {broker.numero}
                                    {broker.complemento && ` - ${broker.complemento}`} | {broker.bairro}, {broker.cidade} - {broker.uf}
                                    {broker.cep && ` | CEP: ${broker.cep}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Seção de Estatísticas */}
            <section className="py-16 bg-slate-950 text-white">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-5xl font-bold mb-2 text-emerald-400">{ownProperties.length}+</div>
                            <p className="text-xl text-emerald-100">Imóveis em Destaque</p>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2 text-emerald-400">{partnerProperties.length}+</div>
                            <p className="text-xl text-emerald-100">Parcerias Ativas</p>
                        </div>
                        <div>
                            <div className="text-5xl font-bold mb-2 text-emerald-400">100%</div>
                            <p className="text-xl text-emerald-100">Comprometimento</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Diferenciais */}
            <section className="py-20 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Meus Diferenciais</h2>
                        <p className="text-gray-600 dark:text-gray-400">Por que escolher trabalhar comigo?</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Search className="w-8 h-8 text-emerald-500" />,
                                title: "Atendimento Personalizado",
                                description: "Cada cliente é único e merece atenção especial para encontrar o imóvel perfeito."
                            },
                            {
                                icon: <Home className="w-8 h-8 text-emerald-500" />,
                                title: "Amplo Portfólio",
                                description: "Acesso a diversos imóveis exclusivos e oportunidades únicas no mercado."
                            },
                            {
                                icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
                                title: "Negociação Transparente",
                                description: "Transparência total em todas as etapas do processo de compra ou locação."
                            }
                        ].map((feature, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-emerald-500/50 transition-colors text-center group shadow-sm hover:shadow-md">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500/10 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Imóveis em Destaque */}
            <section className="py-20 bg-gray-50 dark:bg-slate-950">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">Meus Imóveis em Destaque</h2>
                    {ownProperties.length === 0 ? (
                        <div className="text-center py-16">
                            <Home size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Nenhum imóvel cadastrado
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Em breve teremos novos imóveis disponíveis.
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-4 gap-6">
                            {ownProperties.slice(0, 8).map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Você Também Pode Gostar (Parcerias) */}
            {partnerProperties.length > 0 && (
                <section className="py-20 bg-white dark:bg-slate-900">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-3 mb-12">
                            <Heart className="text-red-500" size={32} />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Você Também Pode Gostar</h2>
                        </div>
                        <div className="grid md:grid-cols-4 gap-6">
                            {partnerProperties.slice(0, 8).map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer Personalizado */}
            <Footer partner={{ name: `${broker.nome} ${broker.sobrenome}`, email: broker.email, phone: broker.whatsapp, creci: broker.creci, logo: theme === 'dark' ? broker.watermark_light : broker.watermark_dark }} />
        </div>
    );
};
