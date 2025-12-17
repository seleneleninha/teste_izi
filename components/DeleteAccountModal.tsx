import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
    const { user, signOut } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!user) return;

        // Validações
        if (!password) {
            addToast('Digite sua senha para confirmar.', 'error');
            return;
        }

        if (confirmText.toLowerCase() !== 'deletar minha conta') {
            addToast('Digite exatamente "DELETAR MINHA CONTA" para confirmar.', 'error');
            return;
        }

        setLoading(true);

        try {
            // 1. Verificar senha
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password,
            });

            if (signInError) {
                throw new Error('Senha incorreta. Tente novamente.');
            }

            // 2. Soft Delete + Anonimização (LGPD Art. 16)
            const deletedEmail = `deleted_user_${user.id}@deleted.local`;

            const { error: updateError } = await supabase
                .from('perfis')
                .update({
                    deleted_at: new Date().toISOString(),
                    email: deletedEmail,
                    cpf: null,
                    whatsapp: '(00)00000-0000', // Anonimizado
                    nome: 'Usuário',
                    sobrenome: 'Deletado',
                    marca_dagua: null,
                })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error deleting account:', updateError);
                throw new Error('Erro ao deletar conta. Tente novamente.');
            }

            // 3. Fazer logout
            await signOut();

            addToast('Conta deletada com sucesso. Seus dados foram anonimizados.', 'success');

            // 4. Redirecionar para home
            navigate('/');
            onClose();
        } catch (err: any) {
            console.error('Delete account error:', err);
            addToast(err.message || 'Erro ao deletar conta.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-midnight-900 rounded-3xl shadow-2xl w-full max-w-md border-2 border-red-500/50 relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 rounded-t-3xl p-6 border-b-2 border-red-500/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="text-red-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Deletar Conta</h2>
                                <p className="text-red-200 text-sm">Ação irreversível</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Warning */}
                    <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-4 space-y-2">
                        <p className="text-red-300 font-semibold flex items-center gap-2">
                            <AlertTriangle size={18} />
                            Esta ação não pode ser desfeita!
                        </p>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Ao deletar sua conta:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm ml-4">
                            <li>Seus dados pessoais serão <strong className="text-red-300">anonimizados</strong></li>
                            <li>Você <strong className="text-red-300">perderá acesso</strong> à plataforma</li>
                            <li>Seus anúncios serão <strong className="text-amber-300">desassociados</strong> de você</li>
                            <li>Parcerias e conversas serão <strong className="text-amber-300">removidas</strong></li>
                        </ul>
                        <p className="text-red-200 text-xs mt-3 bg-red-950/50 p-2 rounded">
                            💡 <strong>Alternativa:</strong> Você pode apenas pausar sua conta temporariamente em vez de deletá-la.
                        </p>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirme sua senha:
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                            className="w-full px-4 py-3 rounded-xl bg-midnight-800 border border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            disabled={loading}
                        />
                    </div>

                    {/* Confirmation Text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Digite <span className="text-red-400 font-bold">"DELETAR MINHA CONTA"</span> para confirmar:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="DELETAR MINHA CONTA"
                            className="w-full px-4 py-3 rounded-xl bg-midnight-800 border border-gray-700 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            disabled={loading}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-full transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading || !password || confirmText.toLowerCase() !== 'deletar minha conta'}
                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Deletando...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    Deletar Conta
                                </>
                            )}
                        </button>
                    </div>

                    {/* LGPD Info */}
                    <p className="text-xs text-gray-500 text-center mt-4">
                        Conforme LGPD Art. 18, você tem o direito de requisitar a exclusão de seus dados pessoais.
                        Seus dados serão anonimizados em até 30 dias.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};
