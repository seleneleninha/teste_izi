import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, X, Percent } from 'lucide-react';
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
        <div className="min-h-screen bg-slate-900 pb-12">
            {/* Admin Header - Command Center Style */}
            <div className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 border-b border-slate-800/50 pt-8 pb-6 px-6 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                <Percent className="text-emerald-400" size={24} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Cupons</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 font-medium ml-1">Crie códigos de desconto para campanhas de marketing.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-end mb-8">
                    <button
                        onClick={() => {
                            setFormData({ codigo: '', desconto_percentual: 10, valido_ate: '', ativo: true });
                            setIsModalOpen(true);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                    >
                        <Plus size={20} />
                        Novo Cupom
                    </button>
                </div>

                <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="p-6 font-bold text-slate-300">Código</th>
                                    <th className="p-6 font-bold text-slate-300">Desconto</th>
                                    <th className="p-6 font-bold text-slate-300">Validade</th>
                                    <th className="p-6 font-bold text-slate-300">Status</th>
                                    <th className="p-6 font-bold text-slate-300 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-6 font-mono font-black text-emerald-400 text-lg">{coupon.codigo}</td>
                                        <td className="p-6 font-bold text-white">{coupon.desconto_percentual}% OFF</td>
                                        <td className="p-6 text-slate-400">
                                            {coupon.valido_ate ? new Date(coupon.valido_ate).toLocaleDateString() : 'Indeterminado'}
                                        </td>
                                        <td className="p-6">
                                            <button
                                                onClick={() => toggleStatus(coupon)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${coupon.ativo
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                    : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {coupon.ativo ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {coupons.length === 0 && (
                        <div className="p-12 text-center text-slate-500 italic">
                            Nenhum cupom criado ainda.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Novo Cupom</h2>
                            <button onClick={() => setIsModalOpen(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Código do Cupom</label>
                                <input
                                    type="text"
                                    value={formData.codigo}
                                    onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono uppercase text-lg"
                                    placeholder="EX: PROMO20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Desconto (%)</label>
                                <input
                                    type="number"
                                    value={formData.desconto_percentual}
                                    onChange={e => setFormData({ ...formData, desconto_percentual: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Validade (Opcional)</label>
                                <input
                                    type="date"
                                    value={formData.valido_ate}
                                    onChange={e => setFormData({ ...formData, valido_ate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
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
