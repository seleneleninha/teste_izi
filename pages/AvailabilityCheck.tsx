import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, Clock, XCircle, Home, MapPin, ArrowLeft, Loader2, Send } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';

export const AvailabilityCheck: React.FC = () => {
    const { id } = useParams(); // messageId
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<any>(null);
    const [property, setProperty] = useState<any>(null);
    const [broker, setBroker] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id || !user) return;

            try {
                // Fetch message
                const { data: msgData, error: msgError } = await supabase
                    .from('mensagens_internas')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (msgError) throw msgError;
                setMessage(msgData);

                // Verify permissions (must be recipient/owner)
                if (msgData.destinatario_id !== user.id) {
                    addToast('Você não tem permissão para acessar esta solicitação.', 'error');
                    navigate('/');
                    return;
                }

                // Fetch Property
                const { data: propData } = await supabase
                    .from('anuncios')
                    .select('*')
                    .eq('id', msgData.imovel_id)
                    .single();
                setProperty(propData);

                // Fetch Broker (Sender)
                const { data: brokerData } = await supabase
                    .from('perfis')
                    .select('*')
                    .eq('id', msgData.remetente_id)
                    .single();
                setBroker(brokerData);

            } catch (error) {
                console.error('Error fetching details:', error);
                addToast('Erro ao carregar solicitação.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, user]);

    const handleResponse = async (status: 'disponivel' | 'analise' | 'indisponivel') => {
        setProcessing(true);
        try {
            // Update Message Status
            const { error: updateError } = await supabase
                .from('mensagens_internas')
                .update({
                    status: status,
                    lida: true
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Notify Broker
            let notifTitle = '';
            let notifMsg = '';
            let type = '';

            switch (status) {
                case 'disponivel':
                    notifTitle = 'Imóvel Disponível! ✅';
                    notifMsg = `O proprietário confirmou a disponibilidade de "${property.titulo}". Agora você pode enviar para seu lead!`;
                    type = 'success';
                    break;
                case 'analise':
                    notifTitle = 'Verificando Disponibilidade ⏳';
                    notifMsg = `O proprietário de "${property.titulo}" está verificando os valores e disponibilidade. Aguarde confirmação.`;
                    type = 'alert'; // visual logic uses alert/info
                    break;
                case 'indisponivel':
                    notifTitle = 'Imóvel Indisponível ❌';
                    notifMsg = `O proprietário informou que o imóvel "${property.titulo}" não está mais disponível.`;
                    type = 'alert';
                    break;
            }

            await supabase
                .from('notificacoes')
                .insert({
                    user_id: message.remetente_id,
                    titulo: notifTitle,
                    mensagem: notifMsg,
                    tipo: type, // map to existing types: 'success', 'alert', 'message'
                    lida: false
                });

            addToast('Resposta enviada com sucesso!', 'success');
            navigate('/dashboard'); // Or back to notifications

        } catch (error) {
            console.error('Error sending response:', error);
            addToast('Erro ao enviar resposta.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={48} /></div>;
    }

    if (!message || !property) return null;

    // If already answered
    if (message.status !== 'pendente' && message.status !== 'analise') { // Allow re-answering if analysis?
        // Actually, if it's 'disponivel' or 'indisponivel', maybe just show status
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-full shadow-xl overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-primary-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold mb-2">Verificação de Disponibilidade</h1>
                    <p className="opacity-90 text-sm">
                        O corretor <span className="font-bold">{broker?.nome}</span> tem um lead interessado no seu imóvel.
                    </p>
                </div>

                {/* Property Preview */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex gap-4">
                        <img
                            src={property.fotos ? property.fotos.split(',')[0] : ''}
                            alt={property.titulo}
                            className="w-20 h-20 rounded-full object-cover bg-gray-200"
                        />
                        <div>
                            <h3 className="font-bold text-white line-clamp-1">{property.titulo}</h3>
                            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin size={14} /> {property.bairro}, {property.cidade}
                            </p>
                            <p className="text-emerald-600 font-bold mt-2">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.valor_venda || property.valor_locacao)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status or Actions */}
                <div className="p-6 space-y-4">
                    {message.status === 'pendente' || message.status === 'analise' ? (
                        <>
                            <p className="text-center text-gray-300 mb-4 font-medium">
                                O imóvel ainda está disponível nas condições anunciadas?
                            </p>

                            <button
                                onClick={() => handleResponse('disponivel')}
                                disabled={processing}
                                className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full flex items-center gap-3 transition-colors group text-left"
                            >
                                <div className="bg-emerald-500 text-white p-2 rounded-full group-hover:scale-110 transition-transform">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-800">Sim, está disponível!</h4>
                                    <p className="text-xs text-emerald-600">Pode enviar para o cliente e agendar visita.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleResponse('analise')}
                                disabled={processing}
                                className="w-full p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full flex items-center gap-3 transition-colors group text-left"
                            >
                                <div className="bg-amber-500 text-white p-2 rounded-full group-hover:scale-110 transition-transform">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-800">Preciso verificar</h4>
                                    <p className="text-xs text-amber-600">Vou confirmar valores/disponibilidade e retorno.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleResponse('indisponivel')}
                                disabled={processing}
                                className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full flex items-center gap-3 transition-colors group text-left"
                            >
                                <div className="bg-red-500 text-white p-2 rounded-full group-hover:scale-110 transition-transform">
                                    <XCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-800">Não, já foi negociado.</h4>
                                    <p className="text-xs text-red-600">O imóvel será marcado como inativo.</p>
                                </div>
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${message.status === 'disponivel' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                }`}>
                                {message.status === 'disponivel' ? <CheckCircle size={32} /> : <XCircle size={32} />}
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                                {message.status === 'disponivel' ? 'Confirmado como Disponível' : 'Marcado como Indisponível'}
                            </h3>
                            <p className="text-gray-500">Você já respondeu a esta solicitação.</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-medium"
                            >
                                Voltar ao Dashboard
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(message.status === 'pendente' || message.status === 'analise') && (
                    <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-2"
                        >
                            <ArrowLeft size={16} /> Voltar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
