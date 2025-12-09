"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Eye, Building2, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ToastContext';

interface PendingProperty {
    id: string;
    titulo: string;
    bairro: string;
    cidade: string;
    uf: string;
    valor_venda: number;
    valor_locacao: number;
    fotos: string[];
    created_at: string;
    tipo_imovel: string;
    operacao: string;
    user: {
        nome: string;
        email: string;
        creci: string;
    };
}

export default function ApprovalsPage() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<PendingProperty[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingProperties();
    }, []);

    const fetchPendingProperties = async () => {
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    id, titulo, bairro, cidade, uf, valor_venda, valor_locacao, fotos, created_at,
                    tipo_imovel (tipo),
                    operacao (tipo),
                    perfis:user_id (nome, email, creci)
                `)
                .eq('status_aprovacao', 'pendente')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                setProperties(data.map(p => ({
                    id: p.id,
                    titulo: p.titulo,
                    bairro: p.bairro,
                    cidade: p.cidade,
                    uf: p.uf,
                    valor_venda: p.valor_venda,
                    valor_locacao: p.valor_locacao,
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    created_at: p.created_at,
                    tipo_imovel: (p.tipo_imovel as any)?.tipo || p.tipo_imovel,
                    operacao: (p.operacao as any)?.tipo || p.operacao,
                    user: p.perfis as any || { nome: '', email: '', creci: '' }
                })));
            }
        } catch (error) {
            console.error('Error fetching pending properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (propertyId: string, status: 'aprovado' | 'reprovado') => {
        setProcessingId(propertyId);

        try {
            const { error } = await supabase
                .from('anuncios')
                .update({ status_aprovacao: status, approved_at: new Date().toISOString() })
                .eq('id', propertyId);

            if (error) throw error;

            setProperties(properties.filter(p => p.id !== propertyId));
            addToast(`Imóvel ${status === 'aprovado' ? 'aprovado' : 'reprovado'} com sucesso!`, 'success');
        } catch (error) {
            console.error('Error updating property status:', error);
            addToast('Erro ao atualizar status', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Aprovar Anúncios</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{properties.length} anúncio(s) pendente(s)</p>
            </div>

            {/* Pending Properties */}
            {properties.length > 0 ? (
                <div className="space-y-6">
                    {properties.map((property) => (
                        <div key={property.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-lg">
                            <div className="flex flex-col lg:flex-row">
                                {/* Image */}
                                <div className="lg:w-72 h-48 lg:h-auto flex-shrink-0 bg-gray-200 dark:bg-slate-700">
                                    {property.fotos.length > 0 ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={property.fotos[0]}
                                            alt={property.titulo}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Building2 className="text-gray-400" size={48} />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                {property.titulo}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-3">
                                                {property.bairro}, {property.cidade} - {property.uf}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                                    {property.tipo_imovel}
                                                </span>
                                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                                                    {property.operacao}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm">
                                                {property.valor_venda > 0 && (
                                                    <span className="font-bold text-emerald-600">
                                                        Venda: R$ {property.valor_venda.toLocaleString('pt-BR')}
                                                    </span>
                                                )}
                                                {property.valor_locacao > 0 && (
                                                    <span className="font-bold text-blue-600">
                                                        Locação: R$ {property.valor_locacao.toLocaleString('pt-BR')}/mês
                                                    </span>
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <User size={16} />
                                                    <span className="font-medium">{property.user.nome}</span>
                                                    <span>•</span>
                                                    <span>{property.user.email}</span>
                                                    {property.user.creci && (
                                                        <>
                                                            <span>•</span>
                                                            <span>CRECI: {property.user.creci}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    <Clock size={12} />
                                                    Enviado em {new Date(property.created_at).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex lg:flex-col gap-3 flex-shrink-0">
                                            <button
                                                onClick={() => handleApproval(property.id, 'aprovado')}
                                                disabled={processingId === property.id}
                                                className="flex-1 lg:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                {processingId === property.id ? (
                                                    <Loader2 className="animate-spin" size={20} />
                                                ) : (
                                                    <CheckCircle size={20} />
                                                )}
                                                Aprovar
                                            </button>
                                            <button
                                                onClick={() => handleApproval(property.id, 'reprovado')}
                                                disabled={processingId === property.id}
                                                className="flex-1 lg:flex-none px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <XCircle size={20} />
                                                Reprovar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <CheckCircle className="mx-auto text-emerald-500 mb-4" size={64} />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Tudo em dia!
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Não há anúncios pendentes de aprovação.
                    </p>
                </div>
            )}
        </div>
    );
}
