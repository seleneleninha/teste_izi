"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, Eye, Loader2, Building2, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';
import { PropertyCard } from '@/components/PropertyCard';

export default function PropertiesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (user) {
            fetchProperties();
        }
    }, [user]);

    const fetchProperties = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select(`*, tipo_imovel (tipo), operacao (tipo)`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setProperties(data.map(p => ({
                    ...p,
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    operacao: p.operacao?.tipo || p.operacao,
                    tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
                })));
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
            addToast('Erro ao carregar imóveis', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;

        try {
            const { error } = await supabase
                .from('anuncios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProperties(properties.filter(p => p.id !== id));
            addToast('Imóvel excluído com sucesso', 'success');
        } catch (error) {
            console.error('Error deleting property:', error);
            addToast('Erro ao excluir imóvel', 'error');
        }
    };

    const filteredProperties = properties.filter(p => {
        const matchesSearch = p.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cidade?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || p.status_aprovacao === statusFilter;

        return matchesSearch && matchesStatus;
    });

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meus Imóveis</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{properties.length} imóveis cadastrados</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/add-property')}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg"
                >
                    <Plus size={20} />
                    Novo Imóvel
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 border border-gray-100 dark:border-slate-700">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por título, bairro ou cidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-white"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                >
                    <option value="all">Todos os Status</option>
                    <option value="aprovado">Aprovados</option>
                    <option value="pendente">Pendentes</option>
                    <option value="reprovado">Reprovados</option>
                </select>
            </div>

            {/* Properties Grid */}
            {filteredProperties.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {filteredProperties.map((property) => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            showStatus={true}
                            isDashboard={true}
                            actions={
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => router.push(`/dashboard/edit-property/${property.id}`)}
                                        className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Edit2 size={16} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(property.id)}
                                        className="py-2 px-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <Building2 className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {searchTerm || statusFilter !== 'all' ? 'Nenhum imóvel encontrado' : 'Você ainda não tem imóveis'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Cadastre seu primeiro imóvel para começar'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                        <button
                            onClick={() => router.push('/dashboard/add-property')}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold"
                        >
                            Cadastrar Primeiro Imóvel
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
