import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, X } from 'lucide-react';
import { useToast } from '../../components/ToastContext';

interface Coupon {
    id: string;
    codigo: string;
    desconto_percentual: number;
    valido_ate: string;
    ativo: boolean;
}

export const AdminCoupons: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();

    const [formData, setFormData] = useState<Partial<Coupon>>({
        codigo: '',
        desconto_percentual: 0,
        valido_ate: '',
        ativo: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('cupons_desconto')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setCoupons(data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            addToast('Erro ao carregar cupons.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

        try {
            const { error } = await supabase
                .from('cupons_desconto')
                .delete()
                .eq('id', id);

            if (error) throw error;
            addToast('Cupom excluído com sucesso!', 'success');
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            addToast('Erro ao excluir cupom.', 'error');
        }
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('cupons_desconto')
                .insert([formData]);

            if (error) throw error;

            addToast('Cupom criado com sucesso!', 'success');
            setIsModalOpen(false);
            fetchCoupons();
        } catch (error) {
            console.error('Error saving coupon:', error);
            addToast('Erro ao salvar cupom.', 'error');
        }
    };

    const toggleStatus = async (coupon: Coupon) => {
        try {
            const { error } = await supabase
                .from('cupons_desconto')
                .update({ ativo: !coupon.ativo })
                .eq('id', coupon.id);

            if (error) throw error;
            fetchCoupons();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Cupons</h1>
                <button
                    onClick={() => {
                        setFormData({ codigo: '', desconto_percentual: 10, valido_ate: '', ativo: true });
                        setIsModalOpen(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    Novo Cupom
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Código</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Desconto</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Validade</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {coupons.map(coupon => (
                            <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                <td className="p-4 font-mono font-bold text-emerald-600">{coupon.codigo}</td>
                                <td className="p-4">{coupon.desconto_percentual}%</td>
                                <td className="p-4">
                                    {coupon.valido_ate ? new Date(coupon.valido_ate).toLocaleDateString() : 'Indeterminado'}
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => toggleStatus(coupon)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${coupon.ativo
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {coupon.ativo ? 'Ativo' : 'Inativo'}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleDelete(coupon.id)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Cupom</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                                <input
                                    type="text"
                                    value={formData.codigo}
                                    onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 uppercase"
                                    placeholder="EX: PROMO20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desconto (%)</label>
                                <input
                                    type="number"
                                    value={formData.desconto_percentual}
                                    onChange={e => setFormData({ ...formData, desconto_percentual: Number(e.target.value) })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade (Opcional)</label>
                                <input
                                    type="date"
                                    value={formData.valido_ate}
                                    onChange={e => setFormData({ ...formData, valido_ate: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                            >
                                Criar Cupom
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
