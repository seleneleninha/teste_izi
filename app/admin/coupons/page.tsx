"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, Ticket, Plus, Edit2, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ToastContext';

interface Coupon {
    id: string;
    codigo: string;
    desconto_percentual: number;
    desconto_valor: number;
    validade: string;
    limite_uso: number;
    uso_atual: number;
    ativo: boolean;
}

export default function CouponsPage() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('cupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setCoupons(data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (coupon: Partial<Coupon>) => {
        try {
            if (editingCoupon?.id) {
                const { error } = await supabase.from('cupons').update(coupon).eq('id', editingCoupon.id);
                if (error) throw error;
                addToast('Cupom atualizado', 'success');
            } else {
                const { error } = await supabase.from('cupons').insert(coupon);
                if (error) throw error;
                addToast('Cupom criado', 'success');
            }
            fetchCoupons();
            setShowModal(false);
            setEditingCoupon(null);
        } catch (error) {
            console.error('Error saving coupon:', error);
            addToast('Erro ao salvar cupom', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este cupom?')) return;
        try {
            const { error } = await supabase.from('cupons').delete().eq('id', id);
            if (error) throw error;
            setCoupons(coupons.filter(c => c.id !== id));
            addToast('Cupom excluído', 'success');
        } catch (error) {
            addToast('Erro ao excluir', 'error');
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        addToast('Código copiado!', 'success');
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cupons</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{coupons.length} cupom(ns)</p>
                </div>
                <button
                    onClick={() => { setEditingCoupon(null); setShowModal(true); }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center gap-2"
                >
                    <Plus size={20} /> Novo Cupom
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Código</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Desconto</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Uso</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Validade</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                            <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {coupons.map((coupon) => (
                            <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <code className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-lg font-mono text-sm">{coupon.codigo}</code>
                                        <button onClick={() => copyCode(coupon.codigo)} className="text-gray-400 hover:text-gray-600">
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-emerald-600">
                                        {coupon.desconto_percentual ? `${coupon.desconto_percentual}%` : `R$ ${coupon.desconto_valor}`}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                    {coupon.uso_atual || 0} / {coupon.limite_uso || '∞'}
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                    {coupon.validade ? new Date(coupon.validade).toLocaleDateString('pt-BR') : 'Sem limite'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${coupon.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {coupon.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => { setEditingCoupon(coupon); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(coupon.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                        </h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleSave({
                                codigo: formData.get('codigo') as string,
                                desconto_percentual: parseFloat(formData.get('desconto_percentual') as string) || 0,
                                desconto_valor: parseFloat(formData.get('desconto_valor') as string) || 0,
                                validade: formData.get('validade') as string || null,
                                limite_uso: parseInt(formData.get('limite_uso') as string) || 0,
                                ativo: true
                            } as any);
                        }}>
                            <div className="space-y-4">
                                <input name="codigo" defaultValue={editingCoupon?.codigo} placeholder="Código (ex: PROMO20)" required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white uppercase" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input name="desconto_percentual" type="number" defaultValue={editingCoupon?.desconto_percentual} placeholder="% desconto" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                                    <input name="desconto_valor" type="number" step="0.01" defaultValue={editingCoupon?.desconto_valor} placeholder="R$ desconto" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                                </div>
                                <input name="validade" type="date" defaultValue={editingCoupon?.validade?.split('T')[0]} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                                <input name="limite_uso" type="number" defaultValue={editingCoupon?.limite_uso} placeholder="Limite de uso (0 = ilimitado)" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
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
