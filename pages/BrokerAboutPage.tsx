import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BrokerNavbar } from '../components/BrokerNavbar';
import { BrokerFooter } from '../components/BrokerFooter';
import { Loader2, MapPin, Phone, Mail, Award, Calendar, Building2, Instagram, Facebook, Linkedin, Youtube, Twitter, TrendingUp, Users, Home, ArrowRight, MessageCircle } from 'lucide-react';
import { getRandomBackground } from '../lib/backgrounds';
import { getVerificationConfig } from '../lib/verificationHelper';
import { VerificationBadge } from '../components/VerificationBadge';

interface BrokerProfile {
    id: string;
    nome: string;
    sobrenome: string;
    email: string;
    whatsapp: string;
    creci: string;
    uf_creci: string;
    avatar: string;
    slug: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    x?: string;
    sobre_mim?: string;
    especialidades?: string;
    anos_experiencia?: number;
    imoveis_vendidos?: number;
    clientes_atendidos?: number;
    watermark_dark?: string;
    marca_dagua?: string;
    plano_id?: string;
}

export const BrokerAboutPage: React.FC = () => {
    const { slug: rawSlug } = useParams<{ slug: string }>();
    const slug = rawSlug?.split('/')[0] || '';
    const navigate = useNavigate();
    const [broker, setBroker] = useState<BrokerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchBrokerData();
        }
    }, [slug]);

    const fetchBrokerData = async () => {
        try {
            setLoading(true);
            const { data: brokerData, error: brokerError } = await supabase
                .from('perfis')
                .select('*')
                .eq('slug', slug)
                .single();

            if (brokerError || !brokerData) {
                console.error('Broker not found:', brokerError);
                navigate('/');
                return;
            }

            setBroker(brokerData);
        } catch (error) {
            console.error('Error fetching broker data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-midnight-950">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    if (!broker) return null;

    const socialLinks = [
        { icon: Instagram, url: broker.instagram, label: 'Instagram', color: 'hover:text-pink-500' },
        { icon: Facebook, url: broker.facebook, label: 'Facebook', color: 'hover:text-blue-500' },
        { icon: Linkedin, url: broker.linkedin, label: 'LinkedIn', color: 'hover:text-blue-600' },
        { icon: Youtube, url: broker.youtube, label: 'YouTube', color: 'hover:text-red-500' },
        { icon: Twitter, url: broker.x, label: 'X (Twitter)', color: 'hover:text-gray-400' },
    ].filter(link => link.url);

    // Stats for showcase
    const stats = [
        { number: broker.anos_experiencia ? `+${broker.anos_experiencia}` : null, label: 'Anos de Experiência', icon: Calendar },
        { number: broker.imoveis_vendidos ? `+${broker.imoveis_vendidos}` : null, label: 'Imóveis Negociados', icon: Home },
        { number: broker.clientes_atendidos ? `+${broker.clientes_atendidos}` : null, label: 'Clientes Atendidos', icon: Users },
    ].filter(stat => stat.number);

    return (
        <div className="min-h-screen bg-midnight-950 flex flex-col">
            <BrokerNavbar brokerSlug={broker.slug} />

            {/* Hero Section with Profile */}
            <section className="relative overflow-hidden text-white py-24 lg:py-32 mt-20">
                {/* Background Image - Random */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={getRandomBackground()}
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    {/* Dark Overlay Mask */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-midnight-950/95"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 text-emerald-400 text-lg font-semibold mb-6 backdrop-blur-sm border border-emerald-500/30">
                        Um Pouco da Minha História...
                    </span>

                    {/* Avatar */}
                    <div className="mb-6 flex justify-center">
                        <div className="relative group">
                            {/* Verification Badge Overlay */}
                            {broker.plano_id && (
                                <>
                                    {/* Pulse/Glow Ring based on Tier */}
                                    <div className={`absolute -inset-1 rounded-full ${getVerificationConfig(broker.plano_id)?.gradientClass} blur opacity-40 group-hover:opacity-75 transition duration-500`} />

                                    {/* Floating Badge Icon */}
                                    <div className="absolute -top-1 -right-1 z-20 rounded-full p-1 shadow-lg">
                                        <img
                                            src={getVerificationConfig(broker.plano_id)?.badgeUrl}
                                            alt={getVerificationConfig(broker.plano_id)?.title}
                                            className="md:w-8 md:h-8 w-6 h-6 object-contain drop-shadow-sm"
                                            title={getVerificationConfig(broker.plano_id)?.title}
                                        />
                                    </div>
                                </>
                            )}

                            {!broker.plano_id && (
                                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-30 group-hover:opacity-50 blur-lg transition duration-500"></div>
                            )}

                            {broker.avatar ? (
                                <img
                                    src={broker.avatar}
                                    alt={`${broker.nome} ${broker.sobrenome}`}
                                    className={`relative md:w-28 md:h-28 w-20 h-20 rounded-full border-4 object-cover shadow-2xl transform transition hover:-translate-y-1 duration-500 ${broker.plano_id ? getVerificationConfig(broker.plano_id)?.borderClass : 'border-emerald-500'}`}
                                />
                            ) : (
                                <div className={`relative md:w-28 md:h-28 w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white text-6xl font-bold border-4 shadow-2xl ${broker.plano_id ? getVerificationConfig(broker.plano_id)?.borderClass : 'border-emerald-400'}`}>
                                    {broker.nome.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name & Title */}
                    <h1 className="text-2xl lg:text-3xl font-bold mb-4 tracking-tight">
                        {broker.nome} <span className="text-emerald-400">{broker.sobrenome}</span>
                    </h1>

                    {/* Verification Badge */}
                    <div className="flex justify-center mb-8">
                        <VerificationBadge plano_id={broker.plano_id} className="bg-slate/10 border border-white/20" />
                    </div>

                    {/* Quick Contact */}

                    <div className="flex flex-wrap justify-center gap-4">
                        <a>
                            <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1 rounded-full transition-all border border-white/20">
                                <Award className="text-emerald-400" size={20} />
                                <span className="text-white font-bold">CRECI {broker.creci}/{broker.uf_creci}</span>
                            </div>
                        </a>
                        <a
                            href={`https://wa.me/55${broker.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-1 rounded-full transition-all shadow-lg shadow-emerald-500/30 hover:scale-105"
                        >
                            <Phone size={20} />
                            WhatsApp
                        </a>
                        <a
                            href={`mailto:${broker.email}`}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-1 rounded-full transition-all border border-white/20"
                        >
                            <Mail size={20} />
                            E-mail
                        </a>
                    </div>
                </div>
            </section>

            {/* Stats Showcase - Only if has stats */}
            {stats.length > 0 && (
                <section className="py-16 bg-midnight-900 border-y border-white/5">
                    <div className="container mx-auto px-6">
                        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-4xl mx-auto`}>
                            {stats.map((stat, idx) => (
                                <div key={idx} className="text-center p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-500/50 transition-colors group">
                                    <div className="flex justify-center mb-3">
                                        <stat.icon className="text-emerald-400 group-hover:scale-110 transition-transform" size={32} />
                                    </div>
                                    <div className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2 group-hover:scale-110 transition-transform">
                                        {stat.number}
                                    </div>
                                    <div className="text-slate-400 font-medium text-sm md:text-base uppercase tracking-wider">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Sobre Mim Section - Storytelling */}
            {broker.sobre_mim && (
                <section className="py-20 lg:py-28 relative bg-midnight-950">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 text-center">
                                Minha <span className="text-emerald-400">História</span>
                            </h2>
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12">
                                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line text-center md:text-left">
                                    {broker.sobre_mim}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="py-20 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/parceria.png"
                        alt="Parceria"
                        className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/30 to-slate-900/30"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center text-white">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para <span className="text-emerald-400">Achar o Lar dos Sonhos?</span></h2>
                    <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
                        Deixe-me <span className="text-yellow-400 font-bold">ajudar você e sua Família</span> a realizar esse sonho tão importante na vida de vocês.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={`https://wa.me/55${broker.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center text-center w-full sm:w-auto gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-8 py-5 rounded-full transition-all shadow-xl shadow-emerald-500/40 hover:scale-105 active:scale-95"
                        >
                            <MessageCircle size={24} className="animate-pulse" />
                            <span className="text-xl uppercase tracking-tighter">Fale Comigo no WhatsApp</span>
                        </a>
                    </div>
                </div>
            </section>

            <BrokerFooter
                partner={{
                    name: `${broker.nome} ${broker.sobrenome}`,
                    email: broker.email,
                    phone: broker.whatsapp,
                    creci: `${broker.creci}/${broker.uf_creci}`,
                    slug: broker.slug,
                    logo: broker.watermark_dark || broker.marca_dagua,
                    endereço: broker.logradouro,
                    numero: broker.numero,
                    bairro: broker.bairro,
                    cidade: broker.cidade,
                    uf: broker.uf,
                    instagram: broker.instagram,
                    facebook: broker.facebook,
                    linkedin: broker.linkedin,
                    youtube: broker.youtube,
                    x: broker.x
                }}
            />
        </div >
    );
};
