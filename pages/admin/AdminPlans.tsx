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
}

interface Beneficio {
    id: string;
    nome: string;
    descricao?: string;
    icone?: string;
    ordem: number;
    ativo: boolean;
}

interface PlanoBeneficio {
    plano_id: string;
    beneficio_id: string;
}

export const AdminPlans: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
    const [planoBeneficios, setPlanoBeneficios] = useState<PlanoBeneficio[]>([]);
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
        destaque: false
    });
    const [selectedBeneficioIds, setSelectedBeneficioIds] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch plans
            const { data: plansData, error: plansError } = await supabase
                .from('planos')
                .select('*')
                .order('preco_mensal', { ascending: true });

            if (plansError) throw plansError;
            if (plansData) setPlans(plansData);

            // Fetch all benefits from catalog
            const { data: beneficiosData, error: beneficiosError } = await supabase
                .from('beneficios')
                .select('*')
                .eq('ativo', true)
                .order('ordem', { ascending: true });

            if (beneficiosError) throw beneficiosError;
            if (beneficiosData) setBeneficios(beneficiosData);

            // Fetch all plan-benefit relationships
            const { data: pbData, error: pbError } = await supabase
                .from('plano_beneficios')
                .select('*');

            if (pbError) throw pbError;
            if (pbData) setPlanoBeneficios(pbData);

        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Get benefits for a specific plan
    const getPlanBeneficios = (planId: string): Beneficio[] => {
        const beneficioIds = planoBeneficios
            .filter(pb => pb.plano_id === planId)
            .map(pb => pb.beneficio_id);
        return beneficios.filter(b => beneficioIds.includes(b.id));
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData(plan);
        // Get current benefits for this plan
        const currentBeneficioIds = planoBeneficios
            .filter(pb => pb.plano_id === plan.id)
            .map(pb => pb.beneficio_id);
        setSelectedBeneficioIds(currentBeneficioIds);
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
            destaque: false
        });
        setSelectedBeneficioIds([]);
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
            fetchData();
        } catch (error) {
            console.error('Error deleting plan:', error);
            addToast('Erro ao excluir plano.', 'error');
        }
    };

    const handleSave = async () => {
        try {
            let planId = editingPlan?.id;

            if (editingPlan) {
                // Update existing plan
                const { error } = await supabase
                    .from('planos')
                    .update({
                        nome: formData.nome,
                        limite_anuncios: formData.limite_anuncios,
                        limite_parcerias: formData.limite_parcerias,
                        preco_mensal: formData.preco_mensal,
                        preco_anual: formData.preco_anual,
                        destaque: formData.destaque
                    })
                    .eq('id', editingPlan.id);
                if (error) throw error;
            } else {
                // Create new plan
                const { data: newPlan, error } = await supabase
                    .from('planos')
                    .insert([{
                        nome: formData.nome,
                        limite_anuncios: formData.limite_anuncios,
                        limite_parcerias: formData.limite_parcerias,
                        preco_mensal: formData.preco_mensal,
                        preco_anual: formData.preco_anual,
                        destaque: formData.destaque
                    }])
                    .select()
                    .single();
                if (error) throw error;
                planId = newPlan.id;
            }

            // Update plan_beneficios
            if (planId) {
                // Delete existing relationships
                await supabase
                    .from('plano_beneficios')
                    .delete()
                    .eq('plano_id', planId);

                // Insert new relationships
                if (selectedBeneficioIds.length > 0) {
                    const newRelations = selectedBeneficioIds.map(beneficioId => ({
                        plano_id: planId,
                        beneficio_id: beneficioId
                    }));

                    const { error: insertError } = await supabase
                        .from('plano_beneficios')
                        .insert(newRelations);

                    if (insertError) throw insertError;
                }
            }

            addToast(editingPlan ? 'Plano atualizado!' : 'Plano criado!', 'success');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving plan:', error);
            addToast('Erro ao salvar plano.', 'error');
        }
    };

    const toggleBeneficio = (beneficioId: string) => {
        setSelectedBeneficioIds(prev =>
            prev.includes(beneficioId)
                ? prev.filter(id => id !== beneficioId)
                : [...prev, beneficioId]
        );
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
                    <button
                        onClick={handleCreate}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                    >
                        <Plus size={20} />
                        Novo Plano
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map(plan => {
                        const planBeneficios = getPlanBeneficios(plan.id);
                        return (
                            <div key={plan.id} className={`bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-700 relative group hover:border-emerald-500/50 transition-all ${plan.destaque ? 'ring-2 ring-emerald-500/20' : ''}`}>
                                {plan.destaque && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] uppercase tracking-wider font-black px-3 py-1 rounded-full shadow-lg">
                                        Mais Popular
                                    </span>
                                )}

                                <div className="text-center mb-6 pt-2">
                                    <h3 className="text-xl font-bold text-white mb-2">{plan.nome}</h3>
                                    <div className="text-3xl font-black text-white">
                                        R$ {Math.floor(plan.preco_mensal).toLocaleString('pt-BR')}
                                        <span className="text-sm text-slate-500 font-medium block mt-1">/mês</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8 bg-slate-900/50 p-4 rounded-2xl">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Anúncios</span>
                                        <span className="text-white font-bold">até {plan.limite_anuncios === 9999 ? 'Ilimitado' : plan.limite_anuncios}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Parcerias</span>
                                        <span className="text-white font-bold">até {plan.limite_parcerias}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Anual</span>
                                        <span className="text-emerald-400 font-bold">R$ {Math.floor(plan.preco_anual).toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6 text-xs text-slate-400">
                                    {planBeneficios.slice(0, 3).map((beneficio) => (
                                        <div key={beneficio.id} className="flex items-center gap-2">
                                            <Check size={12} className="text-emerald-500" />
                                            <span className="truncate">{beneficio.nome}</span>
                                        </div>
                                    ))}
                                    {planBeneficios.length > 3 && (
                                        <p className="text-center text-slate-500 italic">+ {planBeneficios.length - 3} recursos</p>
                                    )}
                                    {planBeneficios.length === 0 && (
                                        <p className="text-center text-slate-500 italic">Nenhum benefício</p>
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
                        );
                    })}
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
                                    step="1"
                                    value={formData.preco_mensal}
                                    onChange={e => setFormData({ ...formData, preco_mensal: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Preço Anual (R$)</label>
                                <input
                                    type="number"
                                    step="1"
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

                        {/* Benefits Checkboxes Section */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-slate-300 mb-4">
                                Benefícios Inclusos ({selectedBeneficioIds.length} selecionados)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {beneficios.map((beneficio) => (
                                    <div
                                        key={beneficio.id}
                                        onClick={() => toggleBeneficio(beneficio.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedBeneficioIds.includes(beneficio.id)
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedBeneficioIds.includes(beneficio.id)
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'border-slate-600 bg-slate-700'
                                            }`}>
                                            {selectedBeneficioIds.includes(beneficio.id) && (
                                                <Check size={14} className="text-white" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium">{beneficio.nome}</span>
                                    </div>
                                ))}
                            </div>
                            {beneficios.length === 0 && (
                                <p className="text-slate-500 text-sm text-center py-4 italic">
                                    Nenhum benefício cadastrado no catálogo.
                                </p>
                            )}
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
