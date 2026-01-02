import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ToastContext';
import { Save, Info, Clock, Building2, Handshake } from 'lucide-react';

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

    if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

    return (
        <div className="min-h-screen bg-slate-900 pb-12">
            {/* Admin Header - Command Center Style */}
            <div className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 border-b border-slate-800/50 pt-8 pb-6 px-6 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                <Clock className="text-emerald-400" size={24} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Configurações de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Trial</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 font-medium ml-1">Defina os limites para usuários em período de teste.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {configs.map((config) => {
                        let Icon = Info;
                        let label = config.key;
                        let color = "text-slate-400";
                        let bgColor = "bg-slate-500/10";

                        if (config.key === 'trial_days') {
                            Icon = Clock;
                            label = "Duração do Teste";
                            color = "text-blue-400";
                            bgColor = "bg-blue-500/10";
                        } else if (config.key === 'trial_max_properties') {
                            Icon = Building2; // Need to import or use Grid
                            label = "Limite de Imóveis";
                            color = "text-purple-400";
                            bgColor = "bg-purple-500/10";
                        } else if (config.key === 'trial_max_partnerships') {
                            Icon = Handshake; // Need to import
                            label = "Limite de Parcerias";
                            color = "text-orange-400";
                            bgColor = "bg-orange-500/10";
                        }

                        return (
                            <div key={config.key} className="bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-700 relative group hover:border-emerald-500/30 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${bgColor} ${color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="bg-slate-900 rounded-xl px-3 py-1 text-xs font-mono text-slate-500">
                                        {config.key}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1">{label}</h3>
                                <p className="text-sm text-slate-400 mb-6 min-h-[40px]">{config.description}</p>

                                <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                                    <input
                                        type="number"
                                        value={config.value}
                                        onChange={(e) => handleChange(config.key, e.target.value)}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-white font-bold text-xl text-center"
                                    />
                                    <button
                                        onClick={() => handleSave(config.key, config.value)}
                                        className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                                        title="Salvar Alteração"
                                    >
                                        <Save size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 flex gap-4 items-start">
                    <Info className="text-blue-400 flex-shrink-0" size={24} />
                    <div>
                        <h4 className="text-blue-400 font-bold mb-1">Nota Importante</h4>
                        <p className="text-blue-300/80 text-sm">
                            A alteração da "Duração do Teste" afetará apenas novos cadastros. Os limites de imóveis e parcerias aplicam-se imediatamente a todos os usuários em Trial.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
