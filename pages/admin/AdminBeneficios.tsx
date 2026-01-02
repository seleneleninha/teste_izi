import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit2, Trash2, GripVertical, X, Check, Save } from 'lucide-react';
import { useToast } from '../../components/ToastContext';

interface Beneficio {
    id: string;
    nome: string;
    descricao: string;
    icone: string;
    ordem: number;
    ativo: boolean;
}

export const AdminBeneficios: React.FC = () => {
    const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();

    // Form state
    const [formData, setFormData] = useState<Partial<Beneficio>>({
        nome: '',
        descricao: '',
        icone: '',
        ordem: 0,
        ativo: true
    });

    useEffect(() => {
        fetchBeneficios();
    }, []);

    const fetchBeneficios = async () => {
        try {
            const { data, error } = await supabase
                .from('beneficios')
                .select('*')
                .order('ordem', { ascending: true });

            if (error) throw error;
            if (data) setBeneficios(data);
        } catch (error) {
            console.error('Error fetching beneficios:', error);
            addToast('Erro ao carregar benefícios.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (beneficio: Beneficio) => {
        setEditingId(beneficio.id);
        setFormData(beneficio);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({
            nome: '',
            descricao: '',
            icone: '',
            ordem: beneficios.length + 1,
            ativo: true
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este benefício?')) return;

        try {
            const { error } = await supabase
                .from('beneficios')
                .delete()
                .eq('id', id);

            if (error) throw error;
            addToast('Benefício excluído com sucesso!', 'success');
            fetchBeneficios();
        } catch (error) {
            console.error('Error deleting beneficio:', error);
            addToast('Erro ao excluir benefício.', 'error');
        }
    };

    const handleToggleAtivo = async (id: string, currentAtivo: boolean) => {
        try {
            const { error } = await supabase
                .from('beneficios')
                .update({ ativo: !currentAtivo })
                .eq('id', id);

            if (error) throw error;
            addToast(`Benefício ${!currentAtivo ? 'ativado' : 'desativado'}!`, 'success');
            fetchBeneficios();
        } catch (error) {
            console.error('Error toggling beneficio:', error);
            addToast('Erro ao alterar status.', 'error');
        }
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('beneficios')
                    .update({
                        nome: formData.nome,
                        descricao: formData.descricao,
                        icone: formData.icone,
                        ordem: formData.ordem,
                        ativo: formData.ativo
                    })
                    .eq('id', editingId);
                if (error) throw error;
                addToast('Benefício atualizado!', 'success');
            } else {
                const { error } = await supabase
                    .from('beneficios')
                    .insert([{
                        nome: formData.nome,
                        descricao: formData.descricao,
                        icone: formData.icone,
                        ordem: formData.ordem,
                        ativo: formData.ativo
                    }]);
                if (error) throw error;
                addToast('Benefício criado!', 'success');
            }
            setIsModalOpen(false);
            fetchBeneficios();
        } catch (error) {
            console.error('Error saving beneficio:', error);
            addToast('Erro ao salvar benefício.', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Carregando...</div>;

    return (
        <div className="min-h-screen bg-slate-900 pb-12">
            {/* Admin Header */}
            <div className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 border-b border-slate-800/50 pt-8 pb-6 px-6 mb-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                                <GripVertical className="text-purple-400" size={24} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Catálogo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Benefícios</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 font-medium ml-1">Gerencie os benefícios disponíveis para os planos.</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                    >
                        <Plus size={20} />
                        Novo Benefício
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6">
                <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Ordem</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Nome</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Descrição</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {beneficios.map((beneficio) => (
                                    <tr key={beneficio.id} className={`hover:bg-slate-700/50 transition-colors ${!beneficio.ativo ? 'opacity-50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <span className="text-slate-400 font-mono text-sm">{beneficio.ordem}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-white font-medium">{beneficio.nome}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-slate-400 text-sm line-clamp-1">{beneficio.descricao || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleAtivo(beneficio.id, beneficio.ativo)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${beneficio.ativo
                                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                    : 'bg-slate-600/50 text-slate-400 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {beneficio.ativo ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(beneficio)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(beneficio.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {beneficios.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                            Nenhum benefício cadastrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'Editar Benefício' : 'Novo Benefício'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Nome</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                    placeholder="Ex: Página Personalizada"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Descrição (opcional)</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none text-white resize-none"
                                    rows={2}
                                    placeholder="Descrição opcional do benefício"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Ordem</label>
                                    <input
                                        type="number"
                                        value={formData.ordem}
                                        onChange={e => setFormData({ ...formData, ordem: Number(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.ativo}
                                            onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                                            className="w-5 h-5 text-purple-500 rounded border-slate-600 bg-slate-700 focus:ring-purple-500"
                                        />
                                        <span className="text-sm font-bold text-slate-300">Ativo</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
