import React, { useState, useEffect } from 'react';
import { X, Facebook, Globe, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ToastContext';
import { validateEmail, validateCPF, validatePhone, checkPasswordStrength, checkRateLimit, getRateLimitReset, translateAuthError } from '../lib/validation';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { LegalDocumentModal } from '../components/LegalDocumentModal';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userType, setUserType] = useState<'corretor' | 'cliente'>('cliente');
    const [profileSelected, setProfileSelected] = useState(false); // ✅ Fix: Hide form until selection

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('register') === 'true') {
            setIsSignUp(true);
        }
    }, [location]);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [apelido, setApelido] = useState('');
    const [cpf, setCpf] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [creci, setCreci] = useState('');
    const [ufCreci, setUfCreci] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [trialAccepted, setTrialAccepted] = useState(false);

    // Legal Modal States
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [legalDocType, setLegalDocType] = useState<'privacy' | 'terms' | 'lgpd'>('privacy');

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

        // ✅ SECURITY: Rate limiting
        if (!checkRateLimit('login', 5, 60000)) { // 5 tentativas por minuto
            const resetTime = getRateLimitReset('login');
            addToast(`Muitas tentativas. Tente novamente em ${resetTime}s`, 'error');
            return;
        }

        setLoading(true);

        try {
            // ✅ VALIDATION: Email format
            if (!validateEmail(email)) {
                addToast('Email inválido', 'error');
                setLoading(false);
                return;
            }

            if (isSignUp) {
                // ✅ Check if profile is actually selected
                if (!profileSelected) {
                    addToast('Selecione um perfil para continuar.', 'error');
                    setLoading(false);
                    return;
                }

                // Validation
                if (password !== confirmPassword) {
                    addToast('As senhas não coincidem.', 'error');
                    setLoading(false);
                    return;
                }

                // ✅ IMPROVED: Password strength check
                const { strength, feedback } = checkPasswordStrength(password);
                if (strength === 'weak') {
                    addToast(`Senha muito fraca: ${feedback.join('. ')}`, 'error');
                    setLoading(false);
                    return;
                }

                // ✅ IMPROVED: Proper CPF validation
                if (userType === 'corretor') {
                    if (!validateCPF(cpf)) {
                        addToast('CPF inválido. Verifique os dígitos.', 'error');
                        setLoading(false);
                        return;
                    }
                }

                // ✅ VALIDATION: Phone
                if (!validatePhone(whatsapp)) {
                    addToast('WhatsApp inválido', 'error');
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
                            apelido: apelido || null,
                            cpf: userType === 'corretor' ? cpf : null,
                            whatsapp,
                            creci: userType === 'corretor' ? creci : null,
                            uf_creci: userType === 'corretor' ? ufCreci : null,
                            is_trial: userType === 'corretor' ? trialAccepted : false,
                            tipo_usuario: userType // Guardamos o tipo para diferenciar
                        }
                    }
                });

                if (error) throw error;
                addToast('Cadastro realizado! Verifique seu email para confirmar.', 'success');
                setIsSignUp(false);
                setProfileSelected(false);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                if (data?.user) {
                    // Check if user is admin
                    const { data: profile } = await supabase
                        .from('perfis')
                        .select('is_admin')
                        .eq('id', data.user.id)
                        .single();

                    addToast('Login realizado com sucesso!', 'success');

                    const params = new URLSearchParams(location.search);
                    const redirectTo = params.get('redirectTo');

                    // Redirect based on role or return url
                    if (redirectTo) {
                        navigate(redirectTo);
                    } else if (profile?.is_admin) {
                        navigate('/dashboard'); // Redirect to main dashboard with X-Ray
                    } else {
                        navigate('/dashboard');
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            const friendlyMessage = translateAuthError(err);
            addToast(friendlyMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const openLegalModal = (type: 'privacy' | 'terms' | 'lgpd') => {
        setLegalDocType(type);
        setLegalModalOpen(true);
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setProfileSelected(false);
    };

    const handleProfileSelect = (type: 'cliente' | 'corretor') => {
        setUserType(type);
        setProfileSelected(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10">
            <div className={`bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-slate-700 my-auto transition-all duration-300 ${isSignUp && profileSelected ? 'max-w-2xl' : 'max-w-md'}`}>
                <button
                    onClick={() => navigate('/')}
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
                        {isSignUp
                            ? (profileSelected ? 'Preencha seus dados.' : 'Escolha seu perfil para começar.')
                            : 'Acesse para continuar.'}
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleAuth}>
                    {isSignUp && (
                        <>
                            {/* Profile Type Toggle */}
                            <div className="bg-slate-800 p-1 rounded-full flex mb-6">
                                <button
                                    type="button"
                                    onClick={() => handleProfileSelect('cliente')}
                                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 ${userType === 'cliente' && profileSelected
                                        ? 'bg-slate-600 text-white shadow-md ring-1 ring-white/10'
                                        : !profileSelected
                                            ? 'text-gray-400 hover:text-white hover:bg-slate-700'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    Sou Cliente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleProfileSelect('corretor')}
                                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 ${userType === 'corretor' && profileSelected
                                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-900/20'
                                        : !profileSelected
                                            ? 'text-gray-400 hover:text-white hover:bg-slate-700'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    Sou Corretor
                                </button>
                            </div>

                            {profileSelected && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            )}
                        </>
                    )}

                    {(!isSignUp || profileSelected) && (
                        <div className={isSignUp ? "animate-in fade-in slide-in-from-top-4 duration-500 delay-100" : ""}>
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

                            <div className="relative mt-4">
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
                                    className="absolute right-5 top-[32px] text-gray-400 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                                </button>

                                {/* ✅ Password Strength Indicator (only on signup) */}
                                {isSignUp && password && (
                                    <PasswordStrengthIndicator password={password} />
                                )}
                            </div>

                            {isSignUp && (
                                <div className="mt-4 relative">
                                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Confirmar Senha <span className="text-red-500">*</span></label>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-5 top-[32px] text-gray-400 hover:text-gray-300"
                                    >
                                        {showConfirmPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                                    </button>
                                </div>
                            )}

                            {!isSignUp && (
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" className="mr-2 rounded border-gray-600 bg-slate-800 text-primary-500 focus:ring-0" />
                                        Lembrar de mim
                                    </label>
                                    <a href="#" className="text-primary-500 hover:underline">Esqueceu a senha?</a>
                                </div>
                            )}

                            {isSignUp && (
                                <>

                                    <div className="flex items-center mt-4">

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
                                            Ao cadastrar-se na Plataforma você concorda com nosso{' '}
                                            <button type="button" onClick={() => openLegalModal('terms')} className="text-primary-600 hover:underline text-primary-500 font-semibold">TERMO DE USO</button>,{' '}
                                            nossa <button type="button" onClick={() => openLegalModal('privacy')} className="text-primary-600 hover:underline text-primary-500 font-semibold">POLÍTICA DE PRIVACIDADE</button> e{' '}
                                            <button type="button" onClick={() => openLegalModal('lgpd')} className="text-primary-600 hover:underline text-primary-500 font-semibold">COMPLIANCE LGPD</button>.
                                        </label>
                                    </div>

                                    {userType === 'corretor' && (
                                        <div className="flex items-center mt-4 p-3 bg-red-50 bg-red-900/50 border border-red-100 border-red-900/30 rounded-3xl">
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
                                                <p>Desde já tenho ciência que haverão limitações nas funcionalidades neste período de testes.</p>
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
                        </div>
                    )}

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-md font-bold text-primary-500 hover:underline"
                        >
                            {isSignUp ? 'Já tem uma conta? ENTRE AQUI' : 'Não tem conta? CADASTRE-SE'}
                        </button>
                    </div>
                </form>

            </div>

            {/* Legal Document Modal */}
            <LegalDocumentModal
                isOpen={legalModalOpen}
                onClose={() => setLegalModalOpen(false)}
                documentType={legalDocType}
            />
        </div>
    );
};