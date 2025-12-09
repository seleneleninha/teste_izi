"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { MapPin, Phone, Mail, Building2, Home, CheckCircle2, Instagram, Facebook, Linkedin, Youtube, Twitter, AtSign, Loader2 } from 'lucide-react';
import { HorizontalScroll } from '@/components/HorizontalScroll';
import { PropertyCard } from '@/components/PropertyCard';
import { useTheme } from '@/components/ThemeContext';
import { Footer } from '@/components/Footer';
import { getRandomBackground } from '@/lib/backgrounds';

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
    show_address: boolean;
    watermark_light: string;
    watermark_dark: string;
    instagram?: string;
    facebook?: string;
    threads?: string;
    youtube?: string;
    linkedin?: string;
    x?: string;
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
    operacao: string;
    tipo_imovel: string;
    quartos: number;
    banheiros: number;
    vagas: number;
    area_priv: number;
    aceita_parceria: boolean;
}

export default function BrokerPage() {
    const params = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const slug = params?.slug as string;

    const [broker, setBroker] = useState<BrokerProfile | null>(null);
    const [ownProperties, setOwnProperties] = useState<Property[]>([]);
    const [partnerProperties, setPartnerProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [bgImage] = useState(getRandomBackground());

    useEffect(() => {
        if (slug) {
            fetchBrokerData();
        }
    }, [slug]);

    const fetchBrokerData = async () => {
        try {
            setLoading(true);

            // Fetch broker by slug
            const { data: brokerData, error: brokerError } = await supabase
                .from('perfis')
                .select('*')
                .eq('slug', slug)
                .single();

            if (brokerError) throw brokerError;
            if (!brokerData) {
                router.push('/');
                return;
            }

            setBroker(brokerData);

            // Fetch broker's own properties
            const { data: ownPropsData, error: ownPropsError } = await supabase
                .from('anuncios')
                .select(`*, tipo_imovel (tipo), operacao (tipo)`)
                .eq('user_id', brokerData.id)
                .eq('status_aprovacao', 'aprovado')
                .order('created_at', { ascending: false });

            if (ownPropsError) throw ownPropsError;

            const transformedOwnProps = ownPropsData?.map(p => ({
                ...p,
                fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                operacao: p.operacao?.tipo || p.operacao,
                tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
            })) || [];

            setOwnProperties(transformedOwnProps as any);

            // Fetch partnerships
            const { data: partnershipsData, error: partnershipsError } = await supabase
                .from('parcerias')
                .select(`
                    property_id,
                    anuncios (*, tipo_imovel (tipo), operacao (tipo))
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 pt-20">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    if (!broker) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 pt-20">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Corretor não encontrado</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">O corretor que você está procurando não existe.</p>
                    <Link
                        href="/"
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors inline-block"
                    >
                        Voltar para Home
                    </Link>
                </div>
            </div>
        );
    }

    const brokerLogo = theme === 'dark' ? broker.watermark_light : broker.watermark_dark;

    return (
        <div className="bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center pt-16">
                <div className="absolute inset-0 z-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={bgImage}
                        alt="Background"
                        className="w-full h-full object-cover transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-black/70"></div>
                </div>

                <div className="container mx-auto px-4 z-10 relative">
                    <div className="text-center">
                        {/* Profile Photo */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={broker.avatar || `https://ui-avatars.com/api/?name=${broker.nome}+${broker.sobrenome}&size=200`}
                            alt={`${broker.nome} ${broker.sobrenome}`}
                            className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover mx-auto mb-4"
                        />

                        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-white">
                            {broker.nome} {broker.sobrenome}
                        </h1>

                        {/* Contact Info */}
                        <div className="text-xl font-bold flex flex-wrap gap-6 justify-center text-white mb-8">
                            <a
                                href={`https://wa.me/55${broker.whatsapp.replace(/\D/g, '')}`}
                                className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                            >
                                <Phone size={18} />
                                {broker.whatsapp}
                            </a>

                            <div className="text-emerald-400 flex items-center gap-2">
                                <Building2 size={18} />
                                CRECI {broker.creci}/{broker.uf_creci}
                            </div>

                            <a
                                href={`mailto:${broker.email}`}
                                className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                            >
                                <Mail size={18} />
                                {broker.email}
                            </a>
                        </div>

                        {/* Social Media */}
                        <div className="flex items-center justify-center gap-6 mb-8 text-white">
                            {broker.instagram && (
                                <a href={broker.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                                    <Instagram size={30} />
                                </a>
                            )}
                            {broker.facebook && (
                                <a href={broker.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                                    <Facebook size={30} />
                                </a>
                            )}
                            {broker.linkedin && (
                                <a href={broker.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                                    <Linkedin size={30} />
                                </a>
                            )}
                            {broker.youtube && (
                                <a href={broker.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">
                                    <Youtube size={30} />
                                </a>
                            )}
                            {broker.x && (
                                <a href={broker.x} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
                                    <Twitter size={30} />
                                </a>
                            )}
                            {broker.threads && (
                                <a href={broker.threads} target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors">
                                    <AtSign size={30} />
                                </a>
                            )}
                        </div>

                        {/* Address */}
                        {broker.show_address && broker.logradouro && (
                            <div className="text-sm flex items-start gap-2 text-emerald-100 justify-center">
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

            {/* Own Properties */}
            <section className="py-20 bg-gray-50 dark:bg-slate-950">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center items-center gap-3 mb-12">
                        <Home className="text-emerald-500" size={32} />
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Imóveis em Destaque</h2>
                    </div>

                    {ownProperties.length > 0 ? (
                        <HorizontalScroll itemWidth={288} itemsPerPage={4}>
                            {ownProperties.map((property) => (
                                <div key={property.id} className="flex-none w-72" style={{ scrollSnapAlign: 'start' }}>
                                    <PropertyCard property={property} brokerSlug={slug} />
                                </div>
                            ))}
                        </HorizontalScroll>
                    ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                            <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-lg">Nenhum imóvel cadastrado no momento.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Partner Properties */}
            {partnerProperties.length > 0 && (
                <section className="py-20 bg-white dark:bg-slate-900">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-center items-center gap-3 mb-12">
                            <CheckCircle2 className="text-emerald-500" size={32} />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Veja outras opções</h2>
                        </div>

                        <HorizontalScroll itemWidth={288} itemsPerPage={4}>
                            {partnerProperties.map((property) => (
                                <div key={property.id} className="flex-none w-72" style={{ scrollSnapAlign: 'start' }}>
                                    <PropertyCard property={property} brokerSlug={slug} />
                                </div>
                            ))}
                        </HorizontalScroll>
                    </div>
                </section>
            )}

            <Footer
                partner={{
                    name: `${broker.nome} ${broker.sobrenome}`,
                    email: broker.email,
                    phone: broker.whatsapp,
                    creci: `${broker.creci}/${broker.uf_creci}`,
                    logo: broker.watermark_dark,
                    slug: broker.slug
                }}
            />
        </div>
    );
}
