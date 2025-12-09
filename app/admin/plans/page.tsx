"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CreditCard, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ToastContext';

interface Plan {
    id: string;
    nome: string;
    valor: number;
    limite_anuncios: number;
    limite_destaques: number;
    descricao: string;
    ativo: boolean;
}

export default function PlansPage() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('planos')
                .select('*')
                .order('valor', { ascending: true });

            if (error) throw error;
            if (data) setPlans(data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (plan: Partial<Plan>) => {
        try {
            if (editingPlan?.id) {
                const { error } = await supabase
                    .from('planos')
                    .update(plan)
                    .eq('id', editingPlan.id);
                if (error) throw error;
                addToast('Plano atualizado', 'success');
            } else {
                const { error } = await supabase.from('planos').insert(plan);
                if (error) throw error;
                addToast('Plano criado', 'success');
            }
            fetchPlans();
            setShowModal(false);
            setEditingPlan(null);
        } catch (error) {
            console.error('Error saving plan:', error);
            addToast('Erro ao salvar plano', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este plano?')) return;

        try {
            const { error } = await supabase.from('planos').delete().eq('id', id);
            if (error) throw error;
            setPlans(plans.filter(p => p.id !== id));
            addToast('Plano excluído', 'success');
        } catch (error) {
            console.error('Error deleting plan:', error);
            addToast('Erro ao excluir plano', 'error');
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planos</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{plans.length} plano(s) cadastrado(s)</p>
                </div>
                <button
                    onClick={() => { setEditingPlan(null); setShowModal(true); }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center gap-2"
                >
                    <Plus size={20} />
                    Novo Plano
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 ${plan.ativo ? 'border-emerald-500' : 'border-gray-200 dark:border-slate-700'} shadow-lg`}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.nome}</h3>
                                <p className="text-3xl font-bold text-emerald-500 mt-2">
                                    R$ {plan.valor?.toFixed(2)}
                                    <span className="text-sm font-normal text-gray-500">/mês</span>
                                </p>
                            </div>
                            {plan.ativo && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                    Ativo
                                </span>
                            )}
                        </div>

                        <ul className="space-y-2 mb-6">
                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Check size={16} className="text-emerald-500" />
                                {plan.limite_anuncios} anúncios
                            </li>
                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Check size={16} className="text-emerald-500" />
                                {plan.limite_destaques} destaques
                            </li>
                        </ul>

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setEditingPlan(plan); setShowModal(true); }}
                                className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center gap-1"
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="py-2 px-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                        </h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleSave({
                                nome: formData.get('nome') as string,
                                valor: parseFloat(formData.get('valor') as string),
                                limite_anuncios: parseInt(formData.get('limite_anuncios') as string),
                                limite_destaques: parseInt(formData.get('limite_destaques') as string),
                                descricao: formData.get('descricao') as string,
                                ativo: true
                            });
                        }}>
                            <div className="space-y-4">
                                <input name="nome" defaultValue={editingPlan?.nome} placeholder="Nome do plano" required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                                <input name="valor" type="number" step="0.01" defaultValue={editingPlan?.valor} placeholder="Valor mensal" required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                                <input name="limite_anuncios" type="number" defaultValue={editingPlan?.limite_anuncios} placeholder="Limite de anúncios" required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                                <input name="limite_destaques" type="number" defaultValue={editingPlan?.limite_destaques} placeholder="Limite de destaques" required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                                <textarea name="descricao" defaultValue={editingPlan?.descricao} placeholder="Descrição" rows={3} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white resize-none" />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
