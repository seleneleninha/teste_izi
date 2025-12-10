import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ToastContext';
import { Save, Info } from 'lucide-react';

interface AdminConfig {
    key: string;
    value: string;
    description: string;
}

export const AdminTrialSettings: React.FC = () => {
    const [configs, setConfigs] = useState<AdminConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_config')
                .select('*')
                .order('key');

            if (error) throw error;
            if (data) setConfigs(data);
        } catch (error) {
            console.error('Error fetching configs:', error);
            addToast('Erro ao carregar configurações.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: string, value: string) => {
        try {
            const { error } = await supabase
                .from('admin_config')
                .update({ value })
                .eq('key', key);

            if (error) throw error;
            addToast('Configuração salva com sucesso!', 'success');
        } catch (error) {
            console.error('Error saving config:', error);
            addToast('Erro ao salvar configuração.', 'error');
        }
    };

    const handleChange = (key: string, newValue: string) => {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
    };

    if (loading) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Carregando...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configurações do Período de Teste (Trial)</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Defina os limites e parâmetros para usuários que estão em período de teste gratuito.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 max-w-3xl">
                <div className="space-y-6">
                    {configs.map((config) => (
                        <div key={config.key} className="flex flex-col md:flex-row md:items-start gap-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    {config.key === 'trial_days' && 'Duração do Teste (Dias)'}
                                    {config.key === 'trial_max_properties' && 'Limite de Imóveis'}
                                    {config.key === 'trial_max_partnerships' && 'Limite de Parcerias'}
                                    {config.key === 'trial_max_leads' && 'Limite de Leads (Detalhes)'}
                                    {!['trial_days', 'trial_max_properties', 'trial_max_partnerships', 'trial_max_leads'].includes(config.key) && config.key}
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                    <Info size={12} />
                                    {config.description}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={config.value}
                                    onChange={(e) => handleChange(config.key, e.target.value)}
                                    className="w-32 p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                                />
                                <button
                                    onClick={() => handleSave(config.key, config.value)}
                                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                                    title="Salvar"
                                >
                                    <Save size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                    <strong>Nota:</strong> A alteração da "Duração do Teste" afetará apenas novos cadastros. Os limites de imóveis e parcerias aplicam-se imediatamente a todos os usuários em Trial.
                </div>
            </div>
        </div>
    );
};
