import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, XCircle, Clock, Loader2, ShieldCheck, MapPin } from 'lucide-react';

export const MagicVerification: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<any | null>(null);
    const [property, setProperty] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (token) fetchContext();
    }, [token]);

    const fetchContext = async () => {
        try {
            // Find message by token
            const { data: msg, error } = await supabase
                .from('mensagens_internas')
                .select('*, imovel:imovel_id(*)')
                .eq('magic_link_token', token)
                .single();

            if (error) throw error;
            setMessage(msg);
            setProperty(msg.imovel);
        } catch (error) {
            console.error('Link inválido ou expirado', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (response: 'disponivel' | 'analise' | 'indisponivel') => {
        if (!message) return;
        setActionLoading(true);

        try {
            // 1. Update request status
            await supabase
                .from('mensagens_internas')
                .update({ status: response })
                .eq('id', message.id);

            // 2. Insert Auto-Reply
            let replyText = '';
            if (response === 'disponivel') replyText = '✅ Sim, o imóvel está disponível! Pode agendar a visita. Fico no seu aguardo no WhatsApp.';
            if (response === 'analise') replyText = '⏳ Preciso verificar com o(a) Proprietário(a) os valores, já já te confirmo.';
            if (response === 'indisponivel') replyText = '❌ Não. Infelizmente o(a) Proprietário(a) já negociou o imóvel. Vou inativar esse anúncio. Obrigado pelo interesse e vamos para o próximo negócio.';

            await supabase
                .from('mensagens_internas')
                .insert({
                    conversa_id: message.conversa_id,
                    remetente_id: message.destinatario_id, // Owner is Sender now
                    destinatario_id: message.remetente_id, // Broker is Recipient
                    imovel_id: message.imovel_id,
                    tipo: 'resposta_disponibilidade',
                    status: response,
                    conteudo: replyText,
                    lida: false
                });

            // 3. Notify Broker
            await supabase
                .from('notificacoes')
                .insert({
                    user_id: message.remetente_id,
                    titulo: 'Resposta de Disponibilidade 🏠',
                    mensagem: `O proprietário respondeu via Link: ${replyText}`,
                    tipo: 'message',
                    link: `/dashboard?openChat=${message.conversa_id}`,
                    lida: false
                });

            // If checking -> Reload context to show "In Analysis" state on next visit? 
            // Actually just showing Success or "Checking" state now is fine.
            // If 'analise', we assume they might come back later.

            if (response === 'analise') {
                setMessage({ ...message, status: 'analise' }); // Optimistic update
                setSuccess(true);
            } else {
                setSuccess(true);
            }

        } catch (error) {
            console.error('Error processing response', error);
            alert('Erro ao processar. Tente novamente.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary-600" /></div>;

    if (!message || !property) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <XCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Link Inválido ou Expirado</h1>
            <p className="text-gray-500">Não encontramos esta solicitação. Verifique se o link está correto.</p>
        </div>
    );

    if (success) {
        if (message.status === 'analise') {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 p-6 text-center animate-in fade-in">
                    <Clock className="w-20 h-20 text-amber-500 mb-6" />
                    <h1 className="text-2xl font-bold text-amber-900 mb-2">Registrado: Em Análise</h1>
                    <p className="text-amber-700 max-w-xs mx-auto mb-8">
                        Avisamos o corretor que você está verificando. <br />
                        <strong>Quando tiver a resposta, clique neste link novamente!</strong>
                    </p>
                    <button onClick={() => window.close()} className="px-6 py-3 bg-white text-amber-700 font-bold rounded-full shadow-sm border border-amber-200">
                        Fechar Página
                    </button>
                </div>
            );
        }
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 text-center animate-in fade-in">
                <ShieldCheck className="w-20 h-20 text-emerald-500 mb-6" />
                <h1 className="text-2xl font-bold text-emerald-900 mb-2">Resposta Enviada!</h1>
                <p className="text-emerald-700 max-w-xs mx-auto mb-8">
                    O status foi atualizado e o corretor já recebeu sua mensagem no chat.
                </p>
                <div className="p-4 bg-white/50 rounded-full border border-emerald-100 max-w-sm mx-auto">
                    <p className="text-sm text-emerald-800 italic">"{message.status === 'disponivel' ? 'Sim, está disponível...' : 'Não, infelizmente...'}"</p>
                </div>
            </div>
        );
    }

    const isPending = message.status === 'pendente';
    const isAnalyzing = message.status === 'analise';
    const isDone = ['disponivel', 'indisponivel'].includes(message.status);

    if (isDone) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <CheckCircle className="w-16 h-16 text-gray-400 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Já Respondido</h1>
                <p className="text-gray-500">Você já marcou este imóvel como <strong>{message.status.toUpperCase()}</strong>.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header Mobile */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex items-center justify-center">
                <span className="font-bold text-primary-600 tracking-tight">iziBrokerz</span>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center max-w-md mx-auto w-full">

                {/* Property Card */}
                <div className="w-full bg-white rounded-full shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="h-48 bg-gray-200 relative">
                        {property.fotos?.[0] ? (
                            <img src={property.fotos[0]} alt={property.titulo} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">Sem Foto</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                            <h2 className="text-white font-bold text-lg leading-tight mb-1 shadow-black/50 drop-shadow-md">{property.titulo}</h2>
                            <p className="text-white/80 text-xs flex items-center gap-1"><MapPin size={12} /> {property.bairro || 'Localização'}</p>
                        </div>
                    </div>
                </div>

                {/* Question */}
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {isAnalyzing ? 'Já tem um retorno?' : 'Este imóvel está disponível?'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                        {isAnalyzing
                            ? 'Você ficou de verificar a disponibilidade. O corretor está aguardando.'
                            : 'Um parceiro tem um cliente interessado e precisa da sua confirmação para agendar visita.'}
                    </p>
                </div>

                {/* Actions */}
                <div className="w-full space-y-3">
                    <button
                        onClick={() => handleResponse('disponivel')}
                        disabled={actionLoading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full font-bold text-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {actionLoading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                        Sim, Disponível
                    </button>

                    {!isAnalyzing && (
                        <button
                            onClick={() => handleResponse('analise')}
                            disabled={actionLoading}
                            className="w-full py-4 bg-white hover:bg-gray-50 border-2 border-amber-200 text-amber-600 font-bold rounded-full text-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Clock />
                            Vou Verificar
                        </button>
                    )}

                    <button
                        onClick={() => handleResponse('indisponivel')}
                        disabled={actionLoading}
                        className="w-full py-4 bg-white hover:bg-red-50 text-red-500 border border-red-100 font-bold rounded-full text-lg transition-all flex items-center justify-center gap-2"
                    >
                        <XCircle />
                        Não, Indisponível
                    </button>

                    {isAnalyzing && (
                        <p className="text-xs text-center text-gray-400 mt-4">
                            Se ainda não tiver certeza, pode fechar e voltar depois.
                        </p>
                    )}
                </div>
            </div>

            <div className="p-6 text-center">
                <p className="text-[10px] text-gray-300">Segurança iziBrokerz • Token Seguro</p>
            </div>
        </div>
    );
};
