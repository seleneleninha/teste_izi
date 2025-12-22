import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useToast } from '../../components/ToastContext';

interface Plan {
    id: string;
    nome: string;
    limite_anuncios: number;
    limite_parcerias: number;
    preco_mensal: number;
    preco_anual: number;
    destaque: boolean;
    features: string[];
}

export const AdminPlans: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();

    // Form state
    const [formData, setFormData] = useState<Partial<Plan>>({
        nome: '',
        limite_anuncios: 0,
        limite_parcerias: 0,
        preco_mensal: 0,
        preco_anual: 0,
        destaque: false,
        features: []
    });
    const [featureInput, setFeatureInput] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('planos')
                .select('*')
                .order('preco_mensal', { ascending: true });

            if (error) throw error;
            if (data) setPlans(data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            addToast('Erro ao carregar planos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData(plan);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingPlan(null);
        setFormData({
            nome: '',
            limite_anuncios: 10,
            limite_parcerias: 5,
            preco_mensal: 0,
            preco_anual: 0,
            destaque: false,
            features: []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este plano?')) return;

        try {
            const { error } = await supabase
                .from('planos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            addToast('Plano excluído com sucesso!', 'success');
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            addToast('Erro ao excluir plano.', 'error');
        }
    };

    const handleSave = async () => {
        try {
            if (editingPlan) {
                const { error } = await supabase
                    .from('planos')
                    .update(formData)
                    .eq('id', editingPlan.id);
                if (error) throw error;
                addToast('Plano atualizado!', 'success');
            } else {
                const { error } = await supabase
                    .from('planos')
                    .insert([formData]);
                if (error) throw error;
                addToast('Plano criado!', 'success');
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            addToast('Erro ao salvar plano.', 'error');
        }
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...(prev.features || []), featureInput.trim()]
            }));
            setFeatureInput('');
        }
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features?.filter((_, i) => i !== index)
        }));
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
                                <Edit2 className="text-emerald-400" size={24} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Planos</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 font-medium ml-1">Defina as ofertas e funcionalidades para seus corretores.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-end mb-8">
                    <button
                        onClick={handleCreate}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                    >
                        <Plus size={20} />
                        Criar Novo Plano
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className={`bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-700 relative group hover:border-emerald-500/50 transition-all ${plan.destaque ? 'ring-2 ring-emerald-500/20' : ''}`}>
                            {plan.destaque && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] uppercase tracking-wider font-black px-3 py-1 rounded-full shadow-lg">
                                    Mais Popular
                                </span>
                            )}

                            <div className="text-center mb-6 pt-2">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.nome}</h3>
                                <div className="text-3xl font-black text-white">
                                    R$ {plan.preco_mensal.toFixed(0)}<span className="text-emerald-400">,90</span>
                                    <span className="text-sm text-slate-500 font-medium block mt-1">/mês</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 bg-slate-900/50 p-4 rounded-2xl">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Anúncios</span>
                                    <span className="text-white font-bold">{plan.limite_anuncios === 9999 ? 'Ilimitado' : plan.limite_anuncios}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Parcerias</span>
                                    <span className="text-white font-bold">{plan.limite_parcerias}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Anual (Total)</span>
                                    <span className="text-emerald-400 font-bold">R$ {plan.preco_anual.toFixed(0)}</span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6 text-xs text-slate-400">
                                {plan.features && plan.features.slice(0, 3).map((feat, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Check size={12} className="text-emerald-500" />
                                        <span className="truncate">{feat}</span>
                                    </div>
                                ))}
                                {plan.features && plan.features.length > 3 && (
                                    <p className="text-center text-slate-500 italic">+ {plan.features.length - 3} recursos</p>
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl transition-colors flex items-center justify-center"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                                </h2>
                                <p className="text-slate-400 text-sm">Configure os detalhes da oferta.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-300 mb-2">Nome do Plano</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-medium"
                                    placeholder="Ex: Start, Pro, Business..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Limite Anúncios</label>
                                <input
                                    type="number"
                                    value={formData.limite_anuncios}
                                    onChange={e => setFormData({ ...formData, limite_anuncios: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Limite Parcerias</label>
                                <input
                                    type="number"
                                    value={formData.limite_parcerias}
                                    onChange={e => setFormData({ ...formData, limite_parcerias: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Preço Mensal (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.preco_mensal}
                                    onChange={e => setFormData({ ...formData, preco_mensal: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Preço Anual (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.preco_anual}
                                    onChange={e => setFormData({ ...formData, preco_anual: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-medium"
                                />
                            </div>
                            <div className="md:col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.destaque}
                                        onChange={e => setFormData({ ...formData, destaque: e.target.checked })}
                                        className="w-5 h-5 text-emerald-500 rounded border-slate-600 bg-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                        id="destaque"
                                    />
                                    <label htmlFor="destaque" className="text-sm font-bold text-slate-300 cursor-pointer">Definir como "Mais Popular"</label>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-bold text-slate-300 mb-2">Funcionalidades</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={featureInput}
                                    onChange={e => setFeatureInput(e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                                    placeholder="Ex: Site Grátis, Suporte VIP..."
                                    onKeyDown={e => e.key === 'Enter' && addFeature()}
                                />
                                <button onClick={addFeature} className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl transition-colors">
                                    <Plus size={24} />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {formData.features?.map((feature, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 group">
                                        <span className="text-sm text-slate-300">{feature}</span>
                                        <button onClick={() => removeFeature(idx)} className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {(!formData.features || formData.features.length === 0) && (
                                    <p className="text-slate-500 text-sm text-center py-4 italic">Nenhuma funcionalidade adicionada.</p>
                                )}
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
                                Salvar Plano
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
