import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getLeadEmoji, getLeadColor } from '../lib/leadScoring';
import { Filter, Phone, Mail, MessageCircle, TrendingUp, Clock, User } from 'lucide-react';

interface Lead {
    id: string;
    phone_number: string;
    name: string | null;
    lead_score: number;
    lead_status: 'quente' | 'morno' | 'frio';
    score_breakdown: any;
    conversation_state: any;
    last_message_at: string;
    created_at: string;
    assigned_broker_id: string | null;
}

export const LeadsQuentes: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filter, setFilter] = useState<'todos' | 'quente' | 'morno' | 'frio'>('quente');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();

        // Realtime subscription
        const subscription = supabase
            .channel('leads_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'iza_conversations'
            }, () => {
                fetchLeads();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [filter]);

    const fetchLeads = async () => {
        setLoading(true);

        let query = supabase
            .from('iza_conversations')
            .select('*')
            .order('lead_score', { ascending: false })
            .order('updated_at', { ascending: false });

        if (filter !== 'todos') {
            query = query.eq('lead_status', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            setLeads(data || []);
        }

        setLoading(false);
    };

    const assumirLead = async (leadId: string) => {
        // TODO: Implement assign lead to current broker
        console.log('Assumir lead:', leadId);
        alert('Funcionalidade "Assumir Lead" será implementada!');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'quente': return 'bg-red-100 text-red-800 border-red-300';
            case 'morno': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'frio': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins}min atrás`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h atrás`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d atrás`;
    };

    const hotLeadsCount = leads.filter(l => l.lead_status === 'quente').length;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🔥 Leads Qualificados
                    </h1>
                    <p className="text-gray-600">
                        Apenas leads quentes (score 80+) e promissores
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Leads Quentes</p>
                                <p className="text-2xl font-bold text-red-600">{hotLeadsCount}</p>
                            </div>
                            <TrendingUp className="text-red-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Leads Mornos</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {leads.filter(l => l.lead_status === 'morno').length}
                                </p>
                            </div>
                            <Clock className="text-orange-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Leads Frios</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {leads.filter(l => l.lead_status === 'frio').length}
                                </p>
                            </div>
                            <User className="text-blue-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total de Leads</p>
                                <p className="text-2xl font-bold text-green-600">{leads.length}</p>
                            </div>
                            <MessageCircle className="text-green-500" size={32} />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Filter size={20} className="text-gray-500" />
                        <button
                            onClick={() => setFilter('todos')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'todos'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('quente')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'quente'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                        >
                            🔥 Quentes
                        </button>
                        <button
                            onClick={() => setFilter('morno')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'morno'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                }`}
                        >
                            🌡️ Mornos
                        </button>
                        <button
                            onClick={() => setFilter('frio')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'frio'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                        >
                            ❄️ Frios
                        </button>
                    </div>
                </div>

                {/* Leads List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-gray-600">Carregando leads...</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">Nenhum lead encontrado com este filtro.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leads.map(lead => {
                            const state = lead.conversation_state as any;

                            return (
                                <div
                                    key={lead.id}
                                    className="bg-white rounded-lg shadow-sm border-l-4 hover:shadow-md transition"
                                    style={{
                                        borderLeftColor:
                                            lead.lead_status === 'quente' ? '#EF4444' :
                                                lead.lead_status === 'morno' ? '#F97316' : '#3B82F6'
                                    }}
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {lead.name || 'Cliente Anônimo'}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(lead.lead_status)}`}>
                                                        {getLeadEmoji(lead.lead_status)} {lead.lead_status.toUpperCase()} - {lead.lead_score}/100
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <Phone size={14} />
                                                        <span>{lead.phone_number || 'Sem telefone'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        <span>{formatTimeAgo(lead.last_message_at || lead.created_at)}</span>
                                                    </div>
                                                </div>

                                                {/* Interest Summary */}
                                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Interesse:</p>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        {state?.operacao && (
                                                            <div>
                                                                <span className="text-gray-500">Operação:</span>{' '}
                                                                <span className="font-medium">{state.operacao}</span>
                                                            </div>
                                                        )}
                                                        {state?.tipoImovel && (
                                                            <div>
                                                                <span className="text-gray-500">Tipo:</span>{' '}
                                                                <span className="font-medium">{state.tipoImovel}</span>
                                                            </div>
                                                        )}
                                                        {state?.bairro && (
                                                            <div>
                                                                <span className="text-gray-500">Bairro:</span>{' '}
                                                                <span className="font-medium">{state.bairro}</span>
                                                            </div>
                                                        )}
                                                        {state?.valorMax && (
                                                            <div>
                                                                <span className="text-gray-500">Valor máx:</span>{' '}
                                                                <span className="font-medium">
                                                                    R$ {state.valorMax.toLocaleString('pt-BR')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => assumirLead(lead.id)}
                                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                                            >
                                                Assumir Lead
                                            </button>
                                            <button
                                                onClick={() => window.open(`https://wa.me/${lead.phone_number}`, '_blank')}
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
                                            >
                                                <Phone size={16} />
                                                WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
