import React, { useEffect, useState } from 'react';
import { X, MapPin, Bed, Bath, Car, Square, Share2, MessageCircle, ChevronLeft, ChevronRight, Loader2, Clock, XCircle, ShieldCheck, CheckCircle, Handshake, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { getPropertyUrl } from '../lib/propertyHelpers';
import { useAuth } from './AuthContext';

interface PropertyDetailsModalProps {
    propertyId: string;
    lead?: {
        nome: string;
        telefone: string;
    };
    onClose: () => void;
    isOpen: boolean;
}

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
};

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({ propertyId, lead, onClose, isOpen }) => {
    const { user } = useAuth();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // const [currentImageIndex, setCurrentImageIndex] = useState(0); // Replaced by page/direction
    const [currentUserSlug, setCurrentUserSlug] = useState<string | null>(null);
    const [[page, direction], setPage] = useState([0, 0]);

    // Direct WhatsApp Partnership Contact - Check Availability with Property Owner
    const handleDirectWhatsApp = () => {
        if (!property || !user) return;

        // Owner Data
        const ownerName = property.perfis?.nome || 'Corretor(a)';
        const ownerPhone = property.perfis?.whatsapp || '';

        if (!ownerPhone) {
            alert('O WhatsApp do dono do anúncio não está disponível.');
            return;
        }

        // Property Link (Smart Link using owner's slug)
        const ownerSlug = property.perfis?.slug;
        const propertyUrl = getPropertyUrl({
            ...property,
            tipo_imovel: property.tipo_imovel?.tipo || property.tipo_imovel,
            operacao: property.operacao?.tipo || property.operacao
        }, ownerSlug);

        // Current User Name (fetched in state)
        const myName = currentUserName || 'Corretor(a) Parceiro(a)';

        // Format the message with suggested responses
        const message = `Olá *${ownerName}*, sou *${myName}* Corretor(a) parceiro(a) da iziBrokerz, tudo bem?

Tenho um Cliente interessado no imóvel: ${propertyUrl}

Gostaria de saber se ainda está disponível e confirmar o(s) valor(es).

Fico no aguardo de sua resposta para agendarmos uma visita e fecharmos essa parceria, ok?

---
💡 *Respostas Rápidas (responda com 1, 2 ou 3):*

1 - ✅ _"Sim, está disponível! Vamos agendar uma visita."_

2 - ⏳ _"Preciso verificar com o(a) Proprietário(a). Já já te confirmo."_

3 - ❌ _"Infelizmente o imóvel já foi vendido/alugado. Vou inativar o anúncio."_`;

        const whatsappUrl = `https://wa.me/55${ownerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    // State for current user name
    const [currentUserName, setCurrentUserName] = useState<string | null>(null);

    // Fetch current user slug and name
    useEffect(() => {
        const fetchCurrentUserProfile = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('slug, nome, sobrenome')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setCurrentUserSlug(data.slug);
                    setCurrentUserName(data.nome ? `${data.nome}${data.sobrenome ? ' ' + data.sobrenome : ''}` : null);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchCurrentUserProfile();
    }, [user]);

    // Fetch full property details
    useEffect(() => {
        const fetchPropertyDetails = async () => {
            if (!propertyId || !isOpen) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('anuncios')
                    .select(`
                        *,
                        tipo_imovel (tipo),
                        operacao (tipo),
                        perfis:user_id (
                            slug,
                            nome,
                            sobrenome,
                            whatsapp
                        )
                    `)
                    .eq('id', propertyId)
                    .single();

                if (error) throw error;
                setProperty(data);
            } catch (err) {
                console.error('Error fetching property details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPropertyDetails();
    }, [propertyId, isOpen]);

    if (!isOpen) return null;

    const photos = property?.fotos ? property.fotos.split(',') : [];

    const imageIndex = Math.abs(page % photos.length);
    const currentImageIndex = imageIndex; // alias

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        paginate(1);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        paginate(-1);
    };

    const handleWhatsAppShare = () => {
        if (!property || !lead) return;

        // Use current user's slug if available, otherwise fall back to property owner's slug
        const brokerSlug = currentUserSlug || property.perfis?.slug;

        const propertyUrl = getPropertyUrl({
            ...property,
            tipo_imovel: property.tipo_imovel?.tipo || property.tipo_imovel,
            operacao: property.operacao?.tipo || property.operacao
        }, brokerSlug);

        const message = `Olá ${lead.nome}, tudo bem? 
Encontrei este imóvel que tem o seu perfil: *${property.titulo}* em ${property.bairro}, ${property.cidade}.
        
Veja os detalhes aqui: ${propertyUrl}
        
Vamos agendar uma visita?`;

        const whatsappUrl = `https://wa.me/55${lead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Format utility
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col md:flex-row">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[30] p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                    <X size={20} />
                </button>

                {loading ? (
                    <div className="w-full h-96 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary-500" size={48} />
                    </div>
                ) : property ? (
                    <>
                        {/* Image Gallery - Left Side (Desktop) or Top (Mobile) */}
                        <div className="w-full md:w-1/2 bg-slate-900 relative h-72 md:h-auto min-h-[300px] md:min-h-full">
                            {photos.length > 0 ? (
                                <div className="absolute inset-0 overflow-hidden">
                                    <AnimatePresence initial={false} custom={direction}>
                                        <motion.img
                                            key={page}
                                            src={photos[imageIndex]}
                                            custom={direction}
                                            variants={variants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                x: { type: "spring", stiffness: 300, damping: 30 },
                                                opacity: { duration: 0.2 }
                                            }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={1}
                                            onDragEnd={(e, { offset, velocity }) => {
                                                const swipe = swipePower(offset.x, velocity.x);

                                                if (swipe < -swipeConfidenceThreshold) {
                                                    paginate(1);
                                                } else if (swipe > swipeConfidenceThreshold) {
                                                    paginate(-1);
                                                }
                                            }}
                                            alt={property.titulo}
                                            className="w-full h-full object-cover absolute inset-0"
                                        />
                                    </AnimatePresence>

                                    {/* Mobile Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none md:hidden" />

                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm z-10"
                                            >
                                                <ChevronLeft size={20} className="md:w-6 md:h-6" />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm z-10"
                                            >
                                                <ChevronRight size={20} className="md:w-6 md:h-6" />
                                            </button>
                                        </>
                                    )}
                                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                                        {currentImageIndex + 1} / {photos.length}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    Sem fotos
                                </div>
                            )}
                        </div>

                        {/* Details - Right Side (Desktop) or Bottom (Mobile) */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${(property.operacao?.tipo || '').toLowerCase().includes('venda') ? 'bg-red-900/40 text-red-200 border-red-700/50' :
                                        (property.operacao?.tipo || '').toLowerCase().includes('locação') ? 'bg-blue-900/40 text-blue-200 border-blue-700/50' :
                                            (property.operacao?.tipo || '').toLowerCase().includes('temporada') ? 'bg-orange-900/40 text-orange-200 border-orange-700/50' :
                                                'bg-gray-700 text-gray-300 border-gray-600'
                                        }`}>
                                        {property.operacao?.tipo || 'Operação'}
                                    </div>
                                    <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-purple-900/40 text-purple-200 border-purple-700/50">
                                        {property.tipo_imovel?.tipo || 'Imóvel'}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-slate-400 text-sm mb-1">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="text-primary-500" />
                                            {property.bairro}, {property.cidade}
                                        </div>
                                        <div className="text-slate-600">•</div>
                                        <div className="font-mono text-xs opacity-70">
                                            Ref: {property.cod_imovel || property.id?.slice(0, 6)}
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                                    {property.titulo}
                                </h2>

                                <div className="mb-6">
                                    {/* Price Logic based on operation */}
                                    {(property.operacao?.tipo || '').toLowerCase().includes('temporada') ? (
                                        <div className="flex flex-col gap-1">
                                            {property.valor_diaria > 0 && (
                                                <div className="text-2xl font-bold text-primary-400">
                                                    {formatCurrency(property.valor_diaria)} <span className="text-sm font-normal text-slate-500">/dia</span>
                                                </div>
                                            )}
                                            {property.valor_mensal > 0 && (
                                                <div className="text-xl font-bold text-primary-400/80">
                                                    {formatCurrency(property.valor_mensal)} <span className="text-sm font-normal text-slate-500">/mês</span>
                                                </div>
                                            )}
                                            {!property.valor_diaria && !property.valor_mensal && (
                                                <div className="text-2xl font-bold text-primary-400">Sob Consulta</div>
                                            )}
                                        </div>
                                    ) : (property.operacao?.tipo || '').toLowerCase().includes('venda') ? (
                                        <div className="text-3xl font-bold text-primary-400">
                                            {property.valor_venda > 0 ? formatCurrency(property.valor_venda) : 'Sob Consulta'}
                                        </div>
                                    ) : (property.operacao?.tipo || '').toLowerCase().includes('locação') || (property.operacao?.tipo || '').toLowerCase().includes('aluguel') ? (
                                        <div className="text-3xl font-bold text-primary-400">
                                            {property.valor_locacao > 0 ? formatCurrency(property.valor_locacao) : 'Sob Consulta'} <span className="text-sm font-normal text-slate-500">/mês</span>
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-bold text-primary-400">
                                            {formatCurrency(property.valor_venda || property.valor_locacao || property.valor_diaria || property.valor_mensal)}
                                        </div>
                                    )}

                                    {(property.valor_condo > 0 || property.valor_iptu > 0) && (
                                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                                            {property.valor_condo > 0 && (
                                                <span>Cond.: <strong className="text-slate-200">{formatCurrency(property.valor_condo)}</strong></span>
                                            )}
                                            {property.valor_iptu > 0 && (
                                                <span>IPTU: <strong className="text-slate-200">{formatCurrency(property.valor_iptu)}</strong></span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-8 border-y border-slate-700 py-4">
                                    <div className="text-center">
                                        <Bed className="mx-auto text-gray-400 mb-1" size={20} />
                                        <span className="block font-bold text-white">{property.quartos}</span>
                                        <span className="text-xs text-gray-500">Quartos</span>
                                    </div>
                                    {(property.suites || 0) > 0 && (
                                        <div className="text-center">
                                            <div className="relative inline-block">
                                                <Bed className="mx-auto text-primary-500 mb-1" size={20} />
                                                <span className="absolute -top-1 -right-2 text-[10px] bg-primary-900 text-primary-200 px-1 rounded-full">S</span>
                                            </div>
                                            <span className="block font-bold text-white">{property.suites}</span>
                                            <span className="text-xs text-gray-500">Suítes</span>
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <Bath className="mx-auto text-gray-400 mb-1" size={20} />
                                        <span className="block font-bold text-white">{property.banheiros}</span>
                                        <span className="text-xs text-gray-500">Banheiros</span>
                                    </div>
                                    <div className="text-center">
                                        <Car className="mx-auto text-gray-400 mb-1" size={20} />
                                        <span className="block font-bold text-white">{property.vagas}</span>
                                        <span className="text-xs text-gray-500">Vagas</span>
                                    </div>
                                    <div className="text-center">
                                        <Square className="mx-auto text-gray-400 mb-1" size={20} />
                                        <span className="block font-bold text-white">{property.area_priv}</span>
                                        <span className="text-xs text-gray-500">m²</span>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert max-w-none mb-6">
                                    <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">Descrição</h3>
                                    <p className="text-slate-300 text-sm line-clamp-6 whitespace-pre-line">
                                        {property.descricao}
                                    </p>
                                </div>

                                {/* Features & Characteristics */}
                                {(property.caracteristicas || property.features) && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">Destaques</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {/* Handle both string (DB) and array (migrated) formats */}
                                            {(typeof property.caracteristicas === 'string'
                                                ? property.caracteristicas.split(',')
                                                : (property.caracteristicas || property.features || [])
                                            ).map((feat: string, i: number) => (
                                                feat && <span key={i} className="px-2 py-1 bg-slate-700 rounded-full text-xs text-slate-300 border border-slate-600">
                                                    {feat.trim()}
                                                </span>
                                            ))}
                                            {property.aceita_financiamento && (
                                                <span className="px-2 py-1 bg-green-900/40 text-green-300 border border-green-700/50 rounded text-xs flex items-center gap-1">
                                                    <CheckCircle size={10} /> Aceita Financiamento
                                                </span>
                                            )}
                                            {property.aceita_permuta && (
                                                <span className="px-2 py-1 bg-blue-900/40 text-blue-300 border border-blue-700/50 rounded text-xs flex items-center gap-1">
                                                    <Handshake size={10} /> Aceita Permuta
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleDirectWhatsApp}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mb-6"
                            >
                                <MessageCircle size={20} />
                                Checar Disponibilidade
                            </button>

                            {/* Actions */}
                            <div className="mt-auto p-6 border-t border-slate-700">
                                {lead ? (
                                    <div className="space-y-3">

                                        <div className="bg-red-950/30 backdrop-blur-sm border border-red-900/40 rounded-3xl p-4 space-y-3">
                                            <div className="flex items-center gap-2 justify-center text-red-300/90 text-sm font-bold animate-pulse text-center leading-tight">
                                                <AlertCircle size={16} className="shrink-0" />
                                                <span>
                                                    Dica: Verifique a disponibilidade antes de enviar. Evite perda de tempo e de seu Cliente!
                                                </span>
                                            </div>

                                            <button
                                                onClick={handleWhatsAppShare}
                                                className="w-full py-3 bg-white hover:bg-red-50 border border-red-100 text-slate-700 rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"
                                            >
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                                                    <Share2 size={14} />
                                                    <span>Enviar anúncio para</span>
                                                </div>
                                                <span className="font-bold text-red-600 text-lg leading-none">{lead.nome}</span>
                                            </button>
                                        </div>

                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onClose()} // Just close if no lead (preview mode)
                                        className="w-full py-3 bg-slate-700 text-white rounded-full font-bold transition-colors"
                                    >
                                        Fechar
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-96 flex flex-col items-center justify-center text-gray-500">
                        <p>Imóvel não encontrado</p>
                        <button onClick={onClose} className="mt-4 text-primary-500 hover:underline">Fechar</button>
                    </div>
                )}
            </div>
        </div>
    );
};
