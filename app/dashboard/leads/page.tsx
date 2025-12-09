"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, Users, Phone, Mail, MessageCircle, Calendar, Eye, Trash2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';

interface Lead {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    mensagem: string;
    created_at: string;
    anuncio_id: string;
    status: string;
    property?: {
        titulo: string;
        bairro: string;
        cidade: string;
    };
}

export default function LeadsPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (user) {
            fetchLeads();
        }
    }, [user]);

    const fetchLeads = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('leads')
                .select(`*, anuncios:anuncio_id (titulo, bairro, cidade)`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setLeads(data.map(l => ({
                    ...l,
                    property: l.anuncios as any
                })));
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateLeadStatus = async (leadId: string, status: string) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status })
                .eq('id', leadId);

            if (error) throw error;

            setLeads(leads.map(l => l.id === leadId ? { ...l, status } : l));
            addToast('Status atualizado', 'success');
        } catch (error) {
            console.error('Error updating lead:', error);
            addToast('Erro ao atualizar status', 'error');
        }
    };

    const deleteLead = async (leadId: string) => {
        if (!confirm('Tem certeza que deseja excluir este lead?')) return;

        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', leadId);

            if (error) throw error;

            setLeads(leads.filter(l => l.id !== leadId));
            addToast('Lead excluído', 'success');
        } catch (error) {
            console.error('Error deleting lead:', error);
            addToast('Erro ao excluir lead', 'error');
        }
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.telefone?.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statusColors: Record<string, string> = {
        novo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        contato: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        negociando: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        fechado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        perdido: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leads (CRM)</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{leads.length} lead(s) cadastrado(s)</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 border border-gray-100 dark:border-slate-700">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                >
                    <option value="all">Todos os Status</option>
                    <option value="novo">Novo</option>
                    <option value="contato">Em Contato</option>
                    <option value="negociando">Negociando</option>
                    <option value="fechado">Fechado</option>
                    <option value="perdido">Perdido</option>
                </select>
            </div>

            {/* Leads Table */}
            {filteredLeads.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Contato</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Imóvel</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Data</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900 dark:text-white">{lead.nome}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <a href={`mailto:${lead.email}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-500 flex items-center gap-1">
                                                    <Mail size={14} /> {lead.email}
                                                </a>
                                                <a href={`tel:${lead.telefone}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-500 flex items-center gap-1">
                                                    <Phone size={14} /> {lead.telefone}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.property ? (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {lead.property.titulo?.substring(0, 30)}...
                                                </p>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={lead.status || 'novo'}
                                                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border-0 ${statusColors[lead.status || 'novo']}`}
                                            >
                                                <option value="novo">Novo</option>
                                                <option value="contato">Em Contato</option>
                                                <option value="negociando">Negociando</option>
                                                <option value="fechado">Fechado</option>
                                                <option value="perdido">Perdido</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`https://wa.me/55${lead.telefone?.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle size={18} />
                                                </a>
                                                <button
                                                    onClick={() => deleteLead(lead.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <Users className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {searchTerm || statusFilter !== 'all' ? 'Nenhum lead encontrado' : 'Você ainda não tem leads'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Quando alguém entrar em contato pelos seus imóveis, aparecerá aqui'}
                    </p>
                </div>
            )}
        </div>
    );
}
