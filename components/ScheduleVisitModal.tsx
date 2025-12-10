import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Mail, Phone, MessageSquare, CheckCircle, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface ScheduleVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyTitle: string;
    ownerId: string; // The ID of the user who owns the property (advertiser)
    ownerName?: string;
    ownerPhone?: string;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
    isOpen,
    onClose,
    propertyId,
    propertyTitle,
    ownerId,
    ownerName,
    ownerPhone
}) => {
    const { user, userProfile } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        data: '',
        hora: '',
        observacoes: ''
    });

    // Pre-fill form if user is logged in
    useEffect(() => {
        if (isOpen) {
            if (userProfile) {
                setFormData(prev => ({
                    ...prev,
                    nome: userProfile.nome ? `${userProfile.nome} ${userProfile.sobrenome || ''}` : '',
                    email: user.email || '',
                    telefone: userProfile.whatsapp || ''
                }));
            }
            setSuccess(false);
        }
    }, [isOpen, user, userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome || !formData.email || !formData.telefone || !formData.data || !formData.hora) {
            addToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Combine Date and Time
            const visitDate = new Date(`${formData.data}T${formData.hora}:00`);

            // 1. Insert into agendamentos
            const { data: agendamento, error: agendamentoError } = await supabase
                .from('agendamentos')
                .insert({
                    anuncio_id: propertyId,
                    anunciante_id: ownerId,
                    visitante_id: user?.id || null,
                    nome: formData.nome,
                    email: formData.email,
                    telefone: formData.telefone,
                    data_visita: visitDate.toISOString(),
                    observacoes: formData.observacoes,
                    status: 'pendente'
                })
                .select()
                .single();

            if (agendamentoError) throw agendamentoError;

            // 2. Insert into mensagens_internas for Notification
            // Need to find or create a conversation first? 
            // For now, inserting directly into messages if logic supports it, OR
            // Creating a system notification/message without conversation if that's the model.
            // But looking at previous code, messages are linked to `conversas`.
            // Let's creating a conversation logic similar to PropertyDetailsModal availability check.

            let conversaId;
            const { data: existingConv } = await supabase
                .from('conversas')
                .select('id')
                .eq('imovel_id', propertyId)
                .or(`and(solicitante_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'},proprietario_id.eq.${ownerId}),and(solicitante_id.eq.${ownerId},proprietario_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'})`)
                .maybeSingle();

            if (existingConv) {
                conversaId = existingConv.id;
            } else if (user) {
                // Only create conversation if user is logged in
                const { data: newConv } = await supabase
                    .from('conversas')
                    .insert({
                        imovel_id: propertyId,
                        solicitante_id: user.id,
                        proprietario_id: ownerId
                    })
                    .select()
                    .single();
                if (newConv) conversaId = newConv.id;
            }

            if (conversaId) {
                await supabase.from('mensagens_internas').insert({
                    conversa_id: conversaId,
                    remetente_id: user?.id, // Can be null? Table usually requires UUID. If not logged, maybe skip message or use system user?
                    // If user not logged in, we can't easily insert into messages table if it has FK constraint on sender.
                    // Assuming logged in users for "Chat" features.
                    // For non-logged users, checking availability/scheduling might just update the `agendamentos` table.
                    // The "Notification" requirement implies the broker gets a ping.
                    // If not logged in, we can't insert a message 'from' them.
                    // Maybe insert a notification directly into `notificacoes`?

                    destinatario_id: ownerId,
                    imovel_id: propertyId,
                    tipo: 'agendamento_visita',
                    status: 'pendente',
                    conteudo: `Olá, acabei de solicitar uma visita para o imóvel "${propertyTitle}" no dia ${new Date(visitDate).toLocaleDateString()} às ${formData.hora}. Aguardo confirmação.`
                });
            }

            // Always insert a notification for the broker
            await supabase
                .from('notificacoes')
                .insert({
                    user_id: ownerId,
                    titulo: 'Nova Solicitação de Visita 📅',
                    mensagem: `${formData.nome} quer visitar "${propertyTitle}" em ${new Date(visitDate).toLocaleDateString()}.`,
                    tipo: 'message', // or 'calendar'
                    link: `/dashboard/agendamentos`, // Assuming this page will exist or similar
                    lida: false
                });

            setSuccess(true);
            addToast('Solicitação enviada com sucesso!', 'success');

        } catch (error: any) {
            console.error('Error scheduling visit:', error);
            addToast('Erro ao enviar solicitação: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppConfirm = () => {
        if (!ownerPhone) return;
        const phone = ownerPhone.replace(/\D/g, '');
        const message = `Olá ${ownerName || 'Corretor'}, acabei de agendar uma visita pelo site para o imóvel *${propertyTitle}*.\n\nNome: ${formData.nome}\nData: ${formData.data}\nHora: ${formData.hora}\n\nPodemos confirmar?`;
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh] relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Calendar className="text-primary-500" />
                        Agendar Visita
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">
                        Preencha os dados abaixo para solicitar uma visita ao imóvel: <br />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{propertyTitle}</span>
                    </p>

                    {success ? (
                        <div className="text-center py-8 animate-in zoom-in-50 duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Solicitação Enviada!</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                O anunciante foi notificado e entrará em contato para confirmar o horário.
                            </p>

                            <button
                                onClick={handleWhatsAppConfirm}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 mb-3"
                            >
                                <MessageCircle size={20} />
                                Agilizar no WhatsApp
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu Nome</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleChange}
                                        placeholder="Nome completo"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="seu@email.com"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone/WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            name="telefone"
                                            value={formData.telefone}
                                            onChange={handleChange}
                                            placeholder="(00) 00000-0000"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Preferida</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            name="data"
                                            value={formData.data}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horário</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="time"
                                            name="hora"
                                            value={formData.hora}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações (Opcional)</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <textarea
                                        name="observacoes"
                                        value={formData.observacoes}
                                        onChange={handleChange}
                                        placeholder="Ex: Tenho disponibilidade apenas pela manhã..."
                                        rows={3}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={20} />}
                                Solicitar Agendamento
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
