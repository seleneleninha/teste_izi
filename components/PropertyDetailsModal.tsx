import React, { useEffect, useState } from 'react';
import { X, MapPin, Bed, Bath, Car, Square, Share2, MessageCircle, ChevronLeft, ChevronRight, Loader2, Clock, XCircle, ShieldCheck } from 'lucide-react';
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
    const [availabilityStatus, setAvailabilityStatus] = useState<'unknown' | 'pendente' | 'disponivel' | 'analise' | 'indisponivel'>('unknown');
    const [requestLoading, setRequestLoading] = useState(false);

    // Fetch current user slug
    useEffect(() => {
        const fetchCurrentUserSlug = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('slug')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setCurrentUserSlug(data.slug);
                }
            } catch (error) {
                console.error('Error fetching user slug:', error);
            }
        };

        fetchCurrentUserSlug();
    }, [user]);

    // Check Status Effect
    useEffect(() => {
        const checkStatus = async () => {
            if (!property || !user) return;

            // Se for o dono do imóvel, está disponível para ele
            if (property.user_id === user.id) {
                setAvailabilityStatus('disponivel');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('mensagens_internas')
                    .select('status')
                    .eq('imovel_id', property.id)
                    .eq('remetente_id', user.id)
                    .eq('tipo', 'verificacao_disponibilidade')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    setAvailabilityStatus(data.status as any);
                } else {
                    setAvailabilityStatus('unknown');
                }
            } catch (error) {
                // No message found is fine
                setAvailabilityStatus('unknown');
            }
        };

        checkStatus();
    }, [property, user]);

    const handleCheckAvailability = async () => {
        if (!property || !user) return;
        setRequestLoading(true);

        try {
            // 1. Get or Create Conversation
            let conversaId;
            const targetUserId = property.user_id;

            const { data: existingConv } = await supabase
                .from('conversas')
                .select('id')
                .eq('imovel_id', property.id)
                .or(`and(solicitante_id.eq.${user.id},proprietario_id.eq.${targetUserId}),and(solicitante_id.eq.${targetUserId},proprietario_id.eq.${user.id})`)
                .maybeSingle();

            if (existingConv) {
                conversaId = existingConv.id;
            } else {
                const { data: newConv, error: convError } = await supabase
                    .from('conversas')
                    .insert({
                        imovel_id: property.id,
                        solicitante_id: user.id,
                        proprietario_id: targetUserId
                    })
                    .select()
                    .single();

                if (convError) throw convError;
                conversaId = newConv.id;
            }

            // 2. Insert Availability Request Message
            const { data: msgData, error: msgError } = await supabase
                .from('mensagens_internas')
                .insert({
                    conversa_id: conversaId,
                    remetente_id: user.id,
                    destinatario_id: targetUserId,
                    imovel_id: property.id,
                    tipo: 'verificacao_disponibilidade',
                    status: 'pendente',
                    conteudo: `Olá, gostaria de confirmar a disponibilidade do imóvel "${property.titulo}" para visita. Aguardo seu retorno.`
                })
                .select()
                .single();

            if (msgError) throw msgError;

            // 3. Send Notification linked to that conversation
            await supabase
                .from('notificacoes')
                .insert({
                    user_id: targetUserId,
                    titulo: 'Verificar Disponibilidade 🏠',
                    mensagem: `O corretor deseja saber se "${property.titulo}" está disponível para visita.`,
                    tipo: 'message',
                    link: `/dashboard?openChat=${conversaId}`,
                    lida: false
                });

            // 4. Magic Link & WhatsApp Redirect
            const token = msgData.magic_link_token; // Should exist if column added to DB

            // Assuming property.anunciante is not available directly, we might need to rely on what we have,
            // or fetch it if needed. But usually fetching 'property' fetches the owner info too if configured.
            // If property.perfis exists (from fetchPropertyDetails below), use it.
            const ownerPhone = property.perfis?.whatsapp || property.anunciante?.whatsapp;
            const ownerName = property.perfis?.nome || property.anunciante?.nome || 'Parceiro';

            if (token && ownerPhone) {
                const magicLink = `${window.location.origin}/#/v/${token}`;
                const text = `Olá ${ownerName}! Tenho um cliente interessado no imóvel "${property.titulo}".\n\nPor favor, confirme a disponibilidade clicando aqui para liberar o lead:\n${magicLink}`;

                const phone = ownerPhone.replace(/\D/g, '');
                const waUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;

                window.open(waUrl, '_blank');
            }

            setAvailabilityStatus('pendente');
        } catch (error) {
            console.error('Error checking availability:', error);
        } finally {
            setRequestLoading(false);
        }
    };

    // Fetch current user slug
    useEffect(() => {
        const fetchCurrentUserSlug = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('slug')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setCurrentUserSlug(data.slug);
                }
            } catch (error) {
                console.error('Error fetching user slug:', error);
            }
        };

        fetchCurrentUserSlug();
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

    // Variant definitions inside or outside? Outside is better perf but inside allows closure if needed (not needed).
    // I need to add them. I'll add them inside for simplicity of this Replace block or just assume I can add them before component...
    // Actually, I should have added them with imports. I will add them inside component at top or just use them.
    // Let's add them at line 16 (before export).

    const [[page, direction], setPage] = useState([0, 0]);
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
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col md:flex-row">
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
                        <div className="w-full md:w-1/2 bg-gray-100 dark:bg-slate-900 relative min-h-[300px] md:min-h-full">
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none md:hidden" />

                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </>
                                    )}
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
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
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${property.operacao?.tipo === 'Locação' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {property.operacao?.tipo || 'Venda'}
                                    </span>
                                    <span className="text-gray-500 dark:text-slate-400 text-sm flex items-center gap-1">
                                        <MapPin size={14} />
                                        {property.bairro}, {property.cidade}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                    {property.titulo}
                                </h2>

                                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-6">
                                    {formatCurrency(property.valor_venda || property.valor_locacao)}
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-8 border-y border-gray-100 dark:border-slate-700 py-4">
                                    <div className="text-center">
                                        <Bed className="mx-auto text-gray-400 mb-1" size={20} />
                                        <span className="block font-bold text-gray-900 dark:text-white">{property.quartos}</span>
                                        <span className="text-xs text-gray-500">Quartos</span>
                                    </div>
                                    <div className="text-center">
                                        <Bath className="mx-auto text-gray-400 mb-1" size={20} />
                                        <span className="block font-bold text-gray-900 dark:text-white">{property.banheiros}</span>
                                        <span className="text-xs text-gray-500">Banheiros</span>
                                    </div>
                                    <div className="text-center">
                                        <Car className="mx-auto text-gray-400 mb-1" size={20} />
                                        <span className="block font-bold text-gray-900 dark:text-white">{property.vagas}</span>
                                        <span className="text-xs text-gray-500">Vagas</span>
                                    </div>
                                    <div className="text-center">
                                        <Square className="mx-auto text-gray-400 mb-1" size={20} />
                                        <span className="block font-bold text-gray-900 dark:text-white">{property.area_priv}</span>
                                        <span className="text-xs text-gray-500">m²</span>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert max-w-none mb-8">
                                    <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">Descrição</h3>
                                    <p className="text-gray-600 dark:text-slate-300 text-sm line-clamp-6">
                                        {property.descricao}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto pt-6 border-t border-gray-100 dark:border-slate-700">
                                {lead ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-2">
                                            Enviar sugestão para <span className="font-bold text-gray-900 dark:text-white">{lead.nome}</span>
                                        </p>

                                        {availabilityStatus === 'disponivel' ? (
                                            <button
                                                onClick={handleWhatsAppShare}
                                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                                            >
                                                <MessageCircle size={20} />
                                                Enviar via WhatsApp
                                            </button>
                                        ) : availabilityStatus === 'pendente' ? (
                                            <button
                                                disabled
                                                className="w-full py-3 bg-amber-100 text-amber-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-wait"
                                            >
                                                <Clock size={20} />
                                                Aguardando Confirmação
                                            </button>
                                        ) : availabilityStatus === 'analise' ? (
                                            <button
                                                disabled
                                                className="w-full py-3 bg-blue-100 text-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-wait"
                                            >
                                                <Loader2 size={20} className="animate-spin" />
                                                Proprietário Verificando...
                                            </button>
                                        ) : availabilityStatus === 'indisponivel' ? (
                                            <div className="p-4 bg-red-100 border border-red-200 rounded-xl text-center">
                                                <p className="text-red-700 font-bold flex items-center justify-center gap-2">
                                                    <XCircle size={18} /> Imóvel Indisponível
                                                </p>
                                                <p className="text-xs text-red-600 mt-1">O proprietário informou que já foi negociado.</p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleCheckAvailability}
                                                disabled={requestLoading}
                                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
                                            >
                                                {requestLoading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                                                Verificar Disponibilidade com Anunciante
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onClose()} // Just close if no lead (preview mode)
                                        className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-bold transition-colors"
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
