import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { useHeader } from '../components/HeaderContext';
import { Lock, Trash2, Loader2, Eye, EyeOff, Download, Shield } from 'lucide-react';
import { checkPasswordStrength } from '../lib/validation';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { DeleteAccountModal } from '../components/DeleteAccountModal';

export const Security: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { setHeaderContent } = useHeader();

    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [exportingData, setExportingData] = useState(false);

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Set header
    React.useEffect(() => {
        setHeaderContent(
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                    <Shield size={24} className="text-amber-500" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Segurança</h1>
                    <p className="text-slate-400 text-xs font-medium leading-tight">Gerencie sua senha e dados da conta</p>
                </div>
            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent]);

    // Change Password Handler
    const handleChangePassword = async () => {
        if (!passwords.newPassword) {
            addToast('Digite a nova senha', 'error');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            addToast('As senhas não coincidem', 'error');
            return;
        }

        const strength = checkPasswordStrength(passwords.newPassword);
        if (strength.score < 3) {
            addToast('Senha muito fraca. Use letras maiúsculas, minúsculas, números e símbolos.', 'error');
            return;
        }

        try {
            setSaving(true);
            const { error } = await supabase.auth.updateUser({
                password: passwords.newPassword
            });

            if (error) throw error;

            setPasswords({ newPassword: '', confirmPassword: '' });
            addToast('Senha alterada com sucesso!', 'success');
        } catch (error: any) {
            console.error('Erro ao alterar senha:', error);
            addToast(error.message || 'Erro ao alterar senha', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Export Data (LGPD)
    const handleExportData = async () => {
        if (!user) return;

        try {
            setExportingData(true);

            // 1. Buscar perfil
            const { data: perfilData } = await supabase
                .from('perfis')
                .select('*')
                .eq('id', user.id)
                .single();

            // 2. Buscar anúncios
            const { data: anunciosData } = await supabase
                .from('anuncios')
                .select('*')
                .eq('user_id', user.id);

            // 3. Buscar parcerias
            const { data: parceriasData } = await supabase
                .from('parcerias')
                .select('*')
                .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`);

            // 4. Buscar encomendas
            const { data: conversasData } = await supabase
                .from('encomendar_imovel')
                .select('*')
                .eq('user_id', user.id);

            // 5. Montar JSON
            const userData = {
                exportado_em: new Date().toISOString(),
                usuario: {
                    id: user.id,
                    email: user.email,
                    ...perfilData
                },
                anuncios: anunciosData || [],
                parcerias: parceriasData || [],
                encomendas: conversasData || [],
                total_registros: {
                    anuncios: anunciosData?.length || 0,
                    parcerias: parceriasData?.length || 0,
                    encomendas: conversasData?.length || 0
                }
            };

            // 6. Download como JSON
            const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `izibrokerz_dados_${user.id}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            addToast('Dados exportados com sucesso! Arquivo baixado.', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            addToast('Erro ao exportar dados. Tente novamente.', 'error');
        } finally {
            setExportingData(false);
        }
    };

    return (
        <div className="w-full pb-12">
            <div className="bg-slate-800/50 rounded-3xl shadow-sm border border-slate-700/50 p-6 md:p-8 backdrop-blur-sm">

                {/* Password Change Section */}
                <div className="mb-8">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Lock size={20} className="mr-2 text-amber-500" /> Alterar Senha
                    </h4>

                    <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-700/50">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                            <div className="w-full">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nova Senha</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Digite a nova senha"
                                        value={passwords.newPassword}
                                        onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        autoComplete="new-password"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-amber-500 outline-none text-white text-sm pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwords.newPassword && <div className="mt-2"><PasswordStrengthIndicator password={passwords.newPassword} /></div>}
                            </div>
                            <div className="w-full">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Confirmar Senha</label>
                                <input
                                    type="password"
                                    placeholder="Confirme a nova senha"
                                    value={passwords.confirmPassword}
                                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    autoComplete="new-password"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-amber-500 outline-none text-white text-sm"
                                />
                            </div>
                            <div className="w-full">
                                <label className="block text-xs font-medium text-slate-400 mb-1">&nbsp;</label>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={saving || !passwords.newPassword}
                                    className="w-full h-[42px] bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-amber-600/20"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Atualizar Senha'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data & Privacy Section */}
                <div className="pt-6 border-t border-slate-700/50">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Shield size={20} className="mr-2 text-amber-500" /> Dados & Privacidade
                    </h4>

                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={handleExportData}
                            disabled={exportingData}
                            className="flex-1 px-4 py-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 text-amber-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {exportingData ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            Baixar meus Dados (LGPD)
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex-1 px-4 py-4 bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 text-red-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Excluir Minha Conta
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-4 text-center">
                        A exclusão da conta é irreversível. Todos os seus dados serão permanentemente removidos.
                    </p>
                </div>
            </div>

            {/* Delete Account Modal */}
            <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
        </div>
    );
};
