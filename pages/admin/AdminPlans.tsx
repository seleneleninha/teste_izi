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
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Planos</h1>
                <button
                    onClick={handleCreate}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    Novo Plano
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 relative">
                        {plan.destaque && (
                            <span className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
                                Destaque
                            </span>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.nome}</h3>
                        <div className="text-2xl font-bold text-emerald-600 mb-4">
                            R$ {plan.preco_mensal.toFixed(2)} <span className="text-sm text-gray-500 font-normal">/mês</span>
                        </div>

                        <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300">
                            <p><strong>Anúncios:</strong> {plan.limite_anuncios}</p>
                            <p><strong>Parcerias:</strong> {plan.limite_parcerias}</p>
                            <p><strong>Anual:</strong> R$ {plan.preco_anual.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => handleEdit(plan)}
                                className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg flex items-center justify-center gap-2"
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Excluir
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Plano</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite Anúncios</label>
                                <input
                                    type="number"
                                    value={formData.limite_anuncios}
                                    onChange={e => setFormData({ ...formData, limite_anuncios: Number(e.target.value) })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Mensal</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.preco_mensal}
                                    onChange={e => setFormData({ ...formData, preco_mensal: Number(e.target.value) })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Anual</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.preco_anual}
                                    onChange={e => setFormData({ ...formData, preco_anual: Number(e.target.value) })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite Parcerias</label>
                                <input
                                    type="number"
                                    value={formData.limite_parcerias}
                                    onChange={e => setFormData({ ...formData, limite_parcerias: Number(e.target.value) })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div className="flex items-center mt-6">
                                <input
                                    type="checkbox"
                                    checked={formData.destaque}
                                    onChange={e => setFormData({ ...formData, destaque: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Destaque</label>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Funcionalidades</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={featureInput}
                                    onChange={e => setFeatureInput(e.target.value)}
                                    className="flex-1 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="Adicionar funcionalidade..."
                                    onKeyDown={e => e.key === 'Enter' && addFeature()}
                                />
                                <button onClick={addFeature} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg">
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.features?.map((feature, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
                                        <span className="text-sm">{feature}</span>
                                        <button onClick={() => removeFeature(idx)} className="text-red-500 hover:text-red-700">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
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
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
