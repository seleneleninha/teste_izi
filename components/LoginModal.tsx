import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [userType, setUserType] = useState<'corretor' | 'cliente'>('cliente');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [cpf, setCpf] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [creci, setCreci] = useState('');
    const [ufCreci, setUfCreci] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [trialAccepted, setTrialAccepted] = useState(false);

    const states = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
        'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1)$2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    addToast('As senhas não coincidem.', 'error');
                    setLoading(false);
                    return;
                }

                if (userType === 'corretor' && cpf.length < 14) {
                    addToast('CPF inválido.', 'error');
                    setLoading(false);
                    return;
                }

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nome,
                            sobrenome,
                            cpf: userType === 'corretor' ? cpf : null,
                            whatsapp,
                            creci: userType === 'corretor' ? creci : null,
                            uf_creci: userType === 'corretor' ? ufCreci : null,
                            is_trial: userType === 'corretor' ? trialAccepted : false,
                            tipo_usuario: userType
                        }
                    }
                });

                if (error) throw error;
                addToast('Cadastro realizado! Verifique seu email para confirmar.', 'success');
                setIsSignUp(false);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                if (data?.user) {
                    const { data: profile } = await supabase
                        .from('perfis')
                        .select('is_admin')
                        .eq('id', data.user.id)
                        .single();

                    addToast('Login realizado com sucesso!', 'success');
                    onClose(); // Close modal

                    // Redirect based on role
                    if (profile?.is_admin) {
                        navigate('/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            addToast(err.message || 'Ocorreu um erro ao tentar autenticar.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10">
            <div className={`bg-slate-900 rounded-3xl shadow-2xl w-full p-8 relative border border-slate-700 my-auto ${isSignUp ? 'max-w-2xl' : 'max-w-md'}`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-primary-500/30">
                        I
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        {isSignUp ? 'Crie sua conta' : 'Bem-vindo(a) de volta!'}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {isSignUp ? 'Escolha seu perfil para começar.' : 'Acesse para continuar.'}
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleAuth}>
                    {isSignUp && (
                        <>
                            {/* Profile Type Toggle */}
                            <div className="bg-slate-800 p-1 rounded-full flex mb-6">
                                <button
                                    type="button"
                                    onClick={() => setUserType('cliente')}
                                    className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${userType === 'cliente'
                                        ? 'bg-slate-700 text-primary-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    Sou Cliente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('corretor')}
                                    className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${userType === 'corretor'
                                        ? 'bg-slate-700 text-primary-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    Sou Corretor
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Nome <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Sobrenome <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={sobrenome}
                                        onChange={(e) => setSobrenome(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">WhatsApp <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                                        required
                                        placeholder="(00)90000-0000"
                                        maxLength={14}
                                        className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>

                                {userType === 'corretor' && (
                                    <>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">CPF <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={cpf}
                                                onChange={(e) => setCpf(formatCPF(e.target.value))}
                                                required
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                                className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Nº CRECI <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={creci}
                                                onChange={(e) => setCreci(e.target.value.replace(/\D/g, ''))}
                                                required
                                                className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">UF do CRECI <span className="text-red-500">*</span></label>
                                            <select
                                                value={ufCreci}
                                                onChange={(e) => setUfCreci(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none"
                                            >
                                                <option value="">Selecione</option>
                                                {states.map(uf => (
                                                    <option key={uf} value={uf}>{uf}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seuemail@exemplo.com"
                            className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Senha <span className="text-red-500">*</span></label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[26px] text-gray-400 hover:text-gray-300"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {isSignUp && (
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Confirmar Senha <span className="text-red-500">*</span></label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            />
                        </div>
                    )}

                    {!isSignUp && (
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="mr-2 rounded border-gray-600 bg-slate-800 text-primary-500 focus:ring-0" />
                                Lembrar de mim
                            </label>
                            <a href="#" className="text-primary-500 hover:underline">Esqueceu a senha?</a>
                        </div>
                    )}

                    {isSignUp && (
                        <>
                            <div className="flex items-start mt-4">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        required
                                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 bg-gray-700 border-gray-600 focus:ring-primary-600 ring-offset-gray-800"
                                    />
                                </div>
                                <label htmlFor="terms" className="ml-2 text-sm font-medium text-gray-300">
                                    Ao cadastrar-se na Plataforma você concorda com nosso <Link to="/terms" className="text-primary-600 hover:underline text-primary-500">TERMO DE USO</Link> e nossa <Link to="/privacy" className="text-primary-600 hover:underline text-primary-500">POLÍTICA DE PRIVACIDADE</Link> de acordo com a LGPD (Lei Geral de Proteção de Dados) vigente.
                                </label>
                            </div>

                            {userType === 'corretor' && (
                                <div className="flex items-start mt-4 p-3 bg-red-50 bg-red-900/50 border border-red-100 border-red-900/30 rounded-3xl">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="trial_terms"
                                            type="checkbox"
                                            checked={trialAccepted}
                                            onChange={(e) => setTrialAccepted(e.target.checked)}
                                            className="w-4 h-4 border border-gray-300 rounded bg-white focus:ring-3 focus:ring-primary-300 bg-gray-700 border-gray-600 focus:ring-primary-600 ring-offset-gray-800"
                                        />
                                    </div>
                                    <label htmlFor="trial_terms" className="p-2 ml-2 text-sm font-bold text-gray-200 cursor-pointer">
                                        QUERO TESTAR A PLATAFORMA POR 14 DIAS GRATUITAMENTE.
                                        <br /><br />
                                        <p>Desde já tenho ciência que haverão limitações nas funcionalidades neste período de testes, <span className="underline">NADA TENDO A RECLAMAR POSTERIORMENTE.</span></p>
                                    </label>
                                </div>
                            )}
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors shadow-lg shadow-red-500/25 mt-6 flex items-center justify-center disabled:opacity-70"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : (isSignUp ? 'CADASTRAR' : 'ENTRAR')}
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-md font-bold text-primary-500 hover:underline"
                        >
                            {isSignUp ? 'Já tem uma conta? ENTRE AQUI' : 'Não tem conta? CADASTRE-SE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
