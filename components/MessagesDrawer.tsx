import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Send, User, Search, Loader2, ArrowLeft, CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

interface MessagesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialChatId?: string | null;
}

export const MessagesDrawer: React.FC<MessagesDrawerProps> = ({ isOpen, onClose, initialChatId }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchChats();
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (initialChatId && chats.length > 0) {
            // Find chat containing this message ID or just the chat object if passed differently
            // Simpler: changing initialChatId to be the "Message ID" that triggered the open
            // We need to find which chat that message belongs to.
            const findChat = async () => {
                const { data } = await supabase.from('mensagens_internas').select('imovel_id, remetente_id, destinatario_id').eq('id', initialChatId).single();
                if (data) {
                    // Find in loaded chats or construct key
                    const partnerId = data.remetente_id === user?.id ? data.destinatario_id : data.remetente_id;
                    const found = chats.find(c => c.imovel_id === data.imovel_id && c.partner.id === partnerId);
                    if (found) setSelectedChat(found);
                }
            }
            findChat();
        }
    }, [initialChatId, chats]);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat);
        }
    }, [selectedChat]);

    const fetchChats = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch conversations directly
            const { data, error } = await supabase
                .from('conversas')
                .select(`
                    *,
                    imovel:imovel_id(id, titulo),
                    solicitante:solicitante_id(id, nome, sobrenome, avatar),
                    proprietario:proprietario_id(id, nome, sobrenome, avatar)
                `)
                .or(`solicitante_id.eq.${user.id},proprietario_id.eq.${user.id}`)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            // Transform for UI
            const formatted = data.map(conv => {
                const partner = conv.solicitante_id === user.id ? conv.proprietario : conv.solicitante;
                return {
                    ...conv,
                    partner,
                    // Use updated_at for sorting/display as fallback to last message time
                    created_at: conv.updated_at
                };
            });

            setChats(formatted);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chat: any) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('mensagens_internas')
                .select(`
                    *,
                    remetente:remetente_id(id, nome, sobrenome, avatar)
                `)
                .eq('imovel_id', chat.imovel_id)
                .or(`and(remetente_id.eq.${user.id},destinatario_id.eq.${chat.partner.id}),and(remetente_id.eq.${chat.partner.id},destinatario_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
            scrollToBottom();

            // Mark unread as read (simple version)
            const unreadIds = data?.filter((m: any) => !m.lida && m.destinatario_id === user.id).map((m: any) => m.id) || [];
            if (unreadIds.length > 0) {
                await supabase.from('mensagens_internas').update({ lida: true }).in('id', unreadIds);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || !selectedChat) return;
        setSending(true);
        const text = newMessage;
        setNewMessage(''); // Optimistic clear

        try {
            const { data, error } = await supabase
                .from('mensagens_internas')
                .insert({
                    conversa_id: selectedChat.id,
                    remetente_id: user.id,
                    destinatario_id: selectedChat.partner.id,
                    imovel_id: selectedChat.imovel_id,
                    tipo: 'chat',
                    status: 'lida',
                    conteudo: text,
                    lida: false
                })
                .select(`*, remetente:remetente_id(id, nome, sobrenome, avatar)`)
                .single();

            if (error) throw error;

            setMessages(prev => [...prev, data]);
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(text); // Restore on error
        } finally {
            setSending(false);
        }
    };

    const handleAvailabilityResponse = async (msgId: string, response: 'disponivel' | 'analise' | 'indisponivel') => {
        if (!user || !selectedChat) return;
        try {
            // Double check if already answered to prevent duplicates? RLS or UI prevents it mostly.

            // 1. Update the original request status
            await supabase
                .from('mensagens_internas')
                .update({ status: response })
                .eq('id', msgId);

            // 2. Insert the specialized response message
            let replyText = '';
            if (response === 'disponivel') replyText = '✅ Sim, o imóvel está disponível! Pode agendar a visita. Fico no seu aguardo no WhatsApp.';
            if (response === 'analise') replyText = '⏳ Preciso verificar com o(a) Proprietário(a) os valores, já já te confirmo.';
            if (response === 'indisponivel') replyText = '❌ Não. Infelizmente o(a) Proprietário(a) já negociou o imóvel. Vou inativar esse anúncio. Obrigado pelo interesse e vamos para o próximo negócio.';

            const { data: replyMsg } = await supabase
                .from('mensagens_internas')
                .insert({
                    conversa_id: selectedChat.id,
                    remetente_id: user.id,
                    destinatario_id: selectedChat.partner.id,
                    imovel_id: selectedChat.imovel_id,
                    tipo: 'resposta_disponibilidade',
                    status: response,
                    conteudo: replyText,
                    lida: false
                })
                .select(`*, remetente:remetente_id(id, nome, sobrenome, avatar)`)
                .single();

            // 3. Notify the requester (who is now the recipient of this reply)
            await supabase
                .from('notificacoes')
                .insert({
                    user_id: selectedChat.partner.id,
                    titulo: 'Resposta de Disponibilidade 🏠',
                    mensagem: `O proprietário respondeu: ${replyText}`,
                    tipo: 'message',
                    link: `/dashboard?openChat=${replyMsg.id}`, // Link back to this chat
                    lida: false
                });

            // Update local state
            // Update the status of the request message in the list
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: response } : m));
            // Add the reply
            if (replyMsg) {
                setMessages(prev => [...prev, replyMsg]);
                scrollToBottom();
            }

        } catch (error) {
            console.error('Error handling response:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        {selectedChat && (
                            <button onClick={() => setSelectedChat(null)} className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {selectedChat ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shadow-sm">
                                        {selectedChat.partner.nome?.[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="leading-none text-sm">{selectedChat.partner.nome} {selectedChat.partner.sobrenome}</span>
                                        <span className="text-[10px] opacity-60 font-normal mt-0.5 max-w-[180px] truncate">{selectedChat.imovel?.titulo}</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Send size={20} className="text-primary-500" />
                                    Mensagens
                                </>
                            )}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col relative bg-gray-50 dark:bg-slate-900/50">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-primary-500" />
                        </div>
                    ) : selectedChat ? (
                        /* CHAT VIEW */
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                {messages.map((msg) => {
                                    const isMe = msg.remetente_id === user?.id;
                                    const isSystem = msg.tipo === 'verificacao_disponibilidade';
                                    const isResponse = msg.tipo === 'resposta_disponibilidade';

                                    return (
                                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${isMe
                                                ? 'bg-primary-600 text-white rounded-br-none'
                                                : isSystem || isResponse
                                                    ? 'bg-white dark:bg-slate-800 border-l-4 border-primary-500 rounded-md w-full' /* System/Card style */
                                                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-slate-700'
                                                }`}>
                                                {/* Specialized UI for Availability Request */}
                                                {(isSystem || isResponse) && (
                                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-slate-700/50">
                                                        {isSystem ? <Clock size={14} className="text-primary-500" /> : <ShieldCheck size={14} className="text-emerald-500" />}
                                                        <span className={`text-xs font-bold uppercase ${isSystem ? 'text-primary-500' : 'text-emerald-500'}`}>
                                                            {isSystem ? 'Solicitação de Disponibilidade' : 'Resposta Registrada'}
                                                        </span>
                                                    </div>
                                                )}

                                                <p className={`text-sm whitespace-pre-wrap ${isMe ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {msg.conteudo}
                                                </p>

                                                {/* ACTION BUTTONS (Only for recipient of Request) */}
                                                {isSystem && !isMe && (
                                                    <>
                                                        {/* INITIAL PENDING STATE */}
                                                        {msg.status === 'pendente' && (
                                                            <div className="mt-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3 space-y-2 border border-gray-100 dark:border-slate-700">
                                                                <p className="text-xs font-bold text-center mb-1 text-gray-500 dark:text-gray-400">O imóvel está disponível?</p>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    <button
                                                                        onClick={() => handleAvailabilityResponse(msg.id, 'disponivel')}
                                                                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                                                                    >
                                                                        <CheckCircle size={14} /> Sim, disponível
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleAvailabilityResponse(msg.id, 'analise')}
                                                                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold transition-colors"
                                                                    >
                                                                        <Clock size={14} /> Vou verificar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleAvailabilityResponse(msg.id, 'indisponivel')}
                                                                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold transition-colors"
                                                                    >
                                                                        <XCircle size={14} /> Indisponível
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ANALYSIS/CHECKING FOLLOW-UP */}
                                                        {msg.status === 'analise' && (
                                                            <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 space-y-2 border border-amber-100 dark:border-amber-800/30 animate-in fade-in slide-in-from-top-2">
                                                                <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-500 mb-1">
                                                                    <Clock size={12} />
                                                                    <p className="text-xs font-bold text-center">Em Análise</p>
                                                                </div>
                                                                <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 mb-2">Você informou que verificaria. Tem um retorno?</p>

                                                                <div className="grid grid-cols-1 gap-2">
                                                                    <button
                                                                        onClick={() => handleAvailabilityResponse(msg.id, 'disponivel')}
                                                                        className="text-left p-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-medium transition-colors border border-emerald-200 dark:border-emerald-800/50 flex group"
                                                                    >
                                                                        <CheckCircle size={14} className="mt-0.5 mr-2 shrink-0 group-hover:scale-110 transition-transform" />
                                                                        <span>Sim, o imóvel está disponível! Pode agendar a visita. Fico no seu aguardo no WhatsApp.</span>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleAvailabilityResponse(msg.id, 'indisponivel')}
                                                                        className="text-left p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg text-[10px] font-medium transition-colors border border-red-200 dark:border-red-800/50 flex group"
                                                                    >
                                                                        <XCircle size={14} className="mt-0.5 mr-2 shrink-0 group-hover:scale-110 transition-transform" />
                                                                        <span>Não. Infelizmente já foi negociado. Vou inativar esse anúncio. Obrigado pelo interesse.</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {/* STATUS BADGE After Decision */}
                                                {isSystem && msg.status !== 'pendente' && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs opacity-80">
                                                        <span className="text-gray-500 dark:text-gray-400">Status atual:</span>
                                                        <span className={`font-bold uppercase flex items-center gap-1
                                                            ${msg.status === 'disponivel' ? 'text-emerald-600' :
                                                                msg.status === 'indisponivel' ? 'text-red-600' : 'text-amber-600'}
                                                        `}>
                                                            {msg.status}
                                                        </span>
                                                    </div>
                                                )}

                                                <span className={`text-[10px] block text-right mt-1 opacity-70 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shrink-0">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 bg-gray-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white dark:placeholder-gray-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-600/20"
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : chats.length > 0 ? (
                        /* CHAT LIST */
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conversas Recentes</span>
                            </div>

                            {chats.map((chat) => {
                                const isMe = chat.remetente_id === user?.id;
                                return (
                                    <div
                                        key={chat.id + '-list'}
                                        className="describe-chat-card p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-900/50 shadow-sm"
                                        onClick={() => setSelectedChat(chat)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold shrink-0 text-lg shadow-inner">
                                                    {chat.partner?.nome?.[0] || <User size={20} />}
                                                </div>
                                                {/* Online/Status indicator placeholder */}
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                                        {chat.partner?.nome} {chat.partner?.sobrenome}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                                                        {new Date(chat.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <div className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 truncate max-w-[150px]">
                                                        🏠 {chat.imovel?.titulo}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1">
                                                    {isMe ? <span className="font-medium text-gray-900 dark:text-white">Você:</span> : null}
                                                    {chat.tipo === 'verificacao_disponibilidade' ? (
                                                        <span className="italic text-primary-500 flex items-center gap-1"><Clock size={10} /> Solicitou disponibilidade...</span>
                                                    ) : chat.tipo === 'resposta_disponibilidade' ? (
                                                        <span className="italic text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Respondeu sobre disponibilidade...</span>
                                                    ) : (
                                                        chat.conteudo
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Send size={24} className="text-gray-400" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Nenhuma mensagem</h3>
                            <p className="text-sm max-w-[200px]">Suas conversas com outros corretores aparecerão aqui.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
