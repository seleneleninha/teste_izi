import React, { useEffect, useState } from 'react';
import { X, MapPin, Bed, Bath, Car, Square, Share2, MessageCircle, ChevronLeft, ChevronRight, Loader2, Clock, XCircle, ShieldCheck, CheckCircle, Handshake, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { getPropertyUrl } from '../lib/propertyHelpers';
import { generateWhatsAppLink, formatPropertyMessage, trackWhatsAppClick } from '../lib/whatsAppHelper';
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
    const [currentUserName, setCurrentUserName] = useState<string | null>(null);
    const [currentUserPhone, setCurrentUserPhone] = useState<string | null>(null);
    const [currentUserSlug, setCurrentUserSlug] = useState<string | null>(null);
    const [[page, direction], setPage] = useState([0, 0]);

    // Direct WhatsApp Partnership Contact - Check Availability with Property Owner
    const handleDirectWhatsApp = async () => {
        if (!property) return;

        // Owner Data
        const ownerName = property.perfis?.nome || 'Corretor(a)';
        const ownerPhone = property.perfis?.whatsapp || '';
        const ownerId = property.perfis?.id;

        if (!ownerPhone) {
            alert('O WhatsApp do dono do anúncio não está disponível.');
            return;
        }

        // Generate property URL
        const prodUrl = getPropertyUrl({
            ...property,
            tipo_imovel: property.tipo_imovel?.tipo || property.tipo_imovel,
            operacao: property.operacao?.tipo || property.operacao
        }, property.perfis?.slug);

        // Track click
        if (ownerId && property.id) {
            await trackWhatsAppClick(ownerId, property.id, 'interest_modal');
        }

        // Generate message with sender details and URL
        const message = formatPropertyMessage({
            property: property,
            brokerName: ownerName,
            template: 'availability',
            senderName: currentUserName || '',
            senderPhone: currentUserPhone || '',
            propertyUrl: prodUrl
        });

        const whatsappUrl = generateWhatsAppLink({
            phone: ownerPhone,
            message: message
        });

        window.open(whatsappUrl, '_blank');
    };


    // Fetch current user slug and name
    useEffect(() => {
        const fetchCurrentUserProfile = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('slug, nome, sobrenome, whatsapp')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setCurrentUserSlug(data.slug);
                    setCurrentUserName(data.nome ? `${data.nome}${data.sobrenome ? ' ' + data.sobrenome : ''}` : null);
                    setCurrentUserPhone(data.whatsapp);
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative flex flex-col md:flex-row shadow-primary-500/10">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[30] p-2.5 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 transition-all border border-white/5 shadow-xl hover:scale-110 active:scale-95"
                >
                    <X size={20} />
                </button>

                {loading ? (
                    <div className="w-full h-[500px] flex items-center justify-center bg-slate-900/50">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-primary-500" size={48} />
                            <span className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-xs">Carregando detalhes...</span>
                        </div>
                    </div>
                ) : property ? (
                    <>
                        {/* Image Gallery - Left Side (Desktop) or Top (Mobile) */}
                        <div className="w-full md:w-1/2 bg-slate-950 relative h-72 md:h-auto min-h-[350px] md:min-h-full border-r border-white/5">
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

                                    {/* Glass Overlay for navigation */}
                                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900/40 hover:bg-slate-900/80 text-white rounded-full transition-all backdrop-blur-md z-10 border border-white/10 flex items-center justify-center shadow-lg hover:scale-110"
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900/40 hover:bg-slate-900/80 text-white rounded-full transition-all backdrop-blur-md z-10 border border-white/10 flex items-center justify-center shadow-lg hover:scale-110"
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </>
                                    )}
                                    <div className="absolute bottom-6 left-6 bg-slate-900/60 backdrop-blur-xl text-white px-4 py-2 rounded-2xl text-[10px] font-bold z-10 border border-white/10 uppercase tracking-widest">
                                        FOTO {currentImageIndex + 1} de {photos.length}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 font-bold uppercase tracking-widest gap-4">
                                    <XCircle size={64} className="opacity-20" />
                                    <span>Nenhuma foto disponível</span>
                                </div>
                            )}
                        </div>

                        {/* Details - Right Side (Desktop) or Bottom (Mobile) */}
                        <div className="w-full md:w-1/2 overflow-y-auto max-h-screen md:max-h-full scrollbar-thin scrollbar-thumb-white/10">
                            <div className="p-8 md:p-10">
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${(property.operacao?.tipo || '').toLowerCase().includes('venda') ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' :
                                        (property.operacao?.tipo || '').toLowerCase().includes('locação') ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' :
                                            'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}>
                                        {property.operacao?.tipo || 'Operação'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border bg-slate-800 text-slate-200 border-white/10">
                                        {property.tipo_imovel?.tipo || 'Imóvel'}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        REF: {property.cod_imovel || property.id?.slice(0, 6)}
                                    </div>
                                </div>

                                <h2 className="text-3xl font-black text-white mb-4 leading-[1.1] tracking-tight uppercase">
                                    {property.titulo}
                                </h2>

                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-8 bg-white/5 w-fit px-4 py-2 rounded-2xl border border-white/5">
                                    <MapPin size={16} className="text-primary-500" />
                                    <span className="font-bold">{property.bairro}</span>
                                    <span className="opacity-40">•</span>
                                    <span>{property.cidade}</span>
                                </div>

                                <div className="mb-10 p-6 bg-slate-800/30 rounded-[2rem] border border-white/5">
                                    {/* Price Logic */}
                                    {(property.operacao?.tipo || '').toLowerCase().includes('temporada') ? (
                                        <div className="space-y-2">
                                            {property.valor_diaria > 0 && (
                                                <div className="text-2xl font-black text-emerald-400 tracking-tighter">
                                                    {formatCurrency(property.valor_diaria)} <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">/dia</span>
                                                </div>
                                            )}
                                            {property.valor_mensal > 0 && (
                                                <div className="text-xl font-black text-emerald-400/70 tracking-tighter">
                                                    {formatCurrency(property.valor_mensal)} <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">/mês</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (property.operacao?.tipo || '').toLowerCase().includes('venda') ? (
                                        <div className="text-3xl font-black text-emerald-400 tracking-tighter">
                                            {property.valor_venda > 0 ? formatCurrency(property.valor_venda) : 'Sob Consulta'}
                                        </div>
                                    ) : (property.operacao?.tipo || '').toLowerCase().includes('locação') || (property.operacao?.tipo || '').toLowerCase().includes('aluguel') ? (
                                        <div className="text-3xl font-black text-emerald-400 tracking-tighter">
                                            {property.valor_locacao > 0 ? formatCurrency(property.valor_locacao) : 'Sob Consulta'} <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">/mês</span>
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-black text-emerald-400 tracking-tighter">
                                            {formatCurrency(property.valor_venda || property.valor_locacao || property.valor_diaria || property.valor_mensal)}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {property.valor_condo > 0 && (
                                            <div className="flex flex-col">
                                                <span className="opacity-60 mb-0.5">Condomínio</span>
                                                <span className="text-slate-300 text-sm font-black">{formatCurrency(property.valor_condo)}</span>
                                            </div>
                                        )}
                                        {property.valor_iptu > 0 && (
                                            <div className="flex flex-col">
                                                <span className="opacity-60 mb-0.5">IPTU Anual</span>
                                                <span className="text-slate-300 text-sm font-black">{formatCurrency(property.valor_iptu)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 pb-10 border-b border-white/5">
                                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-white/5 text-center">
                                        <Bed className="mx-auto text-primary-500 mb-2" size={20} />
                                        <span className="block font-black text-white text-lg leading-none mb-1">{property.quartos}</span>
                                    </div>
                                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-white/5 text-center">
                                        <Bath className="mx-auto text-primary-500 mb-2" size={20} />
                                        <span className="block font-black text-white text-lg leading-none mb-1">{property.banheiros}</span>
                                    </div>
                                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-white/5 text-center">
                                        <Car className="mx-auto text-primary-500 mb-2" size={20} />
                                        <span className="block font-black text-white text-lg leading-none mb-1">{property.vagas}</span>
                                    </div>
                                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-white/5 text-center">
                                        <Square className="mx-auto text-primary-500 mb-2" size={20} />
                                        <span className="block font-black text-white text-lg leading-none mb-1">{property.area_priv}m²</span>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                            Descrição do Imóvel
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line font-medium bg-slate-800/20 p-6 rounded-3xl border border-white/5">
                                            {property.descricao || 'O proprietário ainda não forneceu uma descrição detalhada para este imóvel.'}
                                        </p>
                                    </div>

                                    {/* Features & Characteristics */}
                                    {(property.caracteristicas || property.features) && (
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                                Características e Diferenciais
                                            </h3>
                                            <div className="flex flex-wrap gap-2.5">
                                                {(typeof property.caracteristicas === 'string'
                                                    ? property.caracteristicas.split(',')
                                                    : (property.caracteristicas || property.features || [])
                                                ).map((feat: string, i: number) => (
                                                    feat && <span key={i} className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-white/5 transition-colors">
                                                        {feat.trim()}
                                                    </span>
                                                ))}
                                                {property.aceita_financiamento && (
                                                    <span className="px-3 py-1.5 bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                                        <ShieldCheck size={12} /> Financiável
                                                    </span>
                                                )}
                                                {property.aceita_permuta && (
                                                    <span className="px-3 py-1.5 bg-blue-950/30 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                                        <Handshake size={12} /> Permuta
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-12 pt-10 border-t border-white/5 flex flex-col gap-4">
                                    {lead ? (
                                        <>
                                            <div className="bg-red-950/20 border border-red-500/20 rounded-3xl p-6 text-center">
                                                <div className="flex items-center gap-2 justify-center text-red-400 text-[18px] font-black uppercase tracking-[0.1em] mb-3">
                                                    <AlertCircle size={18} />
                                                    DICA DE SEGURANÇA
                                                </div>
                                                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                                    Verifique a disponibilidade antes de enviar para seu cliente. Evite frustrações e perda de tempo!
                                                </p>

                                                <button
                                                    onClick={handleDirectWhatsApp}
                                                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-3 active:scale-95 group"
                                                >
                                                    <MessageCircle size={22} className="group-hover:rotate-12 transition-transform" />
                                                    Checar Disponibilidade
                                                </button>
                                            </div>

                                            <div className="bg-slate-800/30 border border-white/5 rounded-3xl p-6">
                                                <div className="flex items-center gap-2 justify-center text-slate-500 text-[10px] font-black uppercase tracking-[0.1em] mb-4">
                                                    PARA SEU CLIENTE
                                                </div>
                                                <button
                                                    onClick={handleWhatsAppShare}
                                                    className="w-full py-5 bg-white hover:bg-slate-50 text-slate-900 rounded-[2rem] font-black transition-all flex flex-col items-center justify-center gap-1 active:scale-95 shadow-lg"
                                                >
                                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                                                        <Share2 size={16} />
                                                        <span>Enviar anúncio para</span>
                                                    </div>
                                                    <span className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-none">{lead.nome}</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            onClick={onClose}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-3xl font-black uppercase tracking-widest transition-colors border border-white/5"
                                        >
                                            Fechar Detalhes
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-[500px] flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                        <XCircle size={64} className="opacity-20 mb-4" />
                        <p className="font-bold uppercase tracking-widest">Imóvel não encontrado</p>
                        <button onClick={onClose} className="mt-6 text-primary-500 hover:text-primary-400 font-bold uppercase tracking-widest text-xs border-b border-primary-500 pb-1">Voltar</button>
                    </div>
                )}
            </div>
        </div>
    );
};
