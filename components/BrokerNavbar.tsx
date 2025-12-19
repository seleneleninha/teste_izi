import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Search, MessageCircle, Share2, ArrowLeft, History, PersonStandingIcon, User, LogIn } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { generateWhatsAppLink, trackWhatsAppClick } from '../lib/whatsAppHelper';
import { LoginModal } from './LoginModal';

interface BrokerNavbarProps {
    brokerSlug: string;
}

export const BrokerNavbar: React.FC<BrokerNavbarProps> = ({ brokerSlug }) => {
    const { theme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [broker, setBroker] = useState<any>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchBroker = async () => {
            const { data } = await supabase
                .from('perfis')
                .select('nome, sobrenome, whatsapp, avatar, creci, uf_creci')
                .eq('slug', brokerSlug)
                .single();
            if (data) setBroker(data);
        };
        if (brokerSlug) fetchBroker();
    }, [brokerSlug]);

    const scrollToFooter = () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Imóveis de ${broker?.nome || 'Corretor'}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        }
    };

    if (!broker) return null;

    return (
        <nav
            className={`fixed w-full z-[50] transition-all duration-300 ${isScrolled || isMenuOpen
                ? 'bg-midnight-950/90 backdrop-blur-md border-b border-white/10 py-3 shadow-xl'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    {/* Brand / Name */}
                    <Link to={`/${brokerSlug}`} className="text-2xl font-heading font-bold text-white flex items-center gap-3">
                        {/* If they had a logo it would go here, else generic or avatar */}
                        {broker.avatar ? (
                            <img src={broker.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                                {broker.nome.charAt(0)}
                            </div>
                        )}
                        <span>
                            {broker.nome} <span className="text-emerald-400">{broker.sobrenome}</span>
                        </span>
                        {broker.creci && broker.uf_creci && (
                            <p className="text-sm font-bold text-white mt-1">CRECI: {broker.creci}/{broker.uf_creci}</p>
                        )}
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            to={`/${brokerSlug}`}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400 ${location.pathname === `/${brokerSlug}` ? 'text-emerald-400' : 'text-gray-300'}`}
                        >
                            <Home size={18} /> Início
                        </Link>
                        <Link
                            to={`/${brokerSlug}/buscar`}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400 ${location.pathname.includes('/buscar') ? 'text-emerald-400' : 'text-gray-300'}`}
                        >
                            <Search size={18} /> Buscar Imóveis
                        </Link>
                        <Link
                            to={`/${brokerSlug}/sobre`}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400 ${location.pathname.includes('/sobre') ? 'text-emerald-400' : 'text-gray-300'}`}
                        >
                            <User size={18} /> Sobre
                        </Link>

                        {/* WhatsApp Button - Inline */}
                        {/* WhatsApp Button - Inline */}
                        <button
                            onClick={() => {
                                if (broker && broker.whatsapp) {
                                    // Track click (general contact)
                                    trackWhatsAppClick(broker.id, 'general_navbar', 'contact');

                                    const message = `Olá ${broker.nome}! Vi seu perfil na iziBrokerz e gostaria de conversar.`;
                                    const whatsappUrl = generateWhatsAppLink({
                                        phone: broker.whatsapp,
                                        message: message
                                    });
                                    window.open(whatsappUrl, '_blank');
                                } else {
                                    alert('WhatsApp não disponível para este corretor.');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-full transition-all text-white font-medium shadow-lg shadow-emerald-500/30 hover:scale-105"
                            title="Fale Comigo"
                        >
                            <MessageCircle size={18} />
                            <span>Fale Comigo</span>
                        </button>

                        {/* Login Button - Inline */}
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full transition-all text-white font-medium shadow-lg shadow-red-500/30 hover:scale-105"
                            title="Login"
                        >
                            <LogIn size={18} />
                            <span>Login</span>
                        </button>

                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* Share Button (Mobile/Desktop) */}
                        <button
                            onClick={handleShare}
                            className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full transition-colors"
                            title="Compartilhar"
                        >
                            <Share2 size={20} />
                        </button>

                        {/* Hamburger */}
                        <button
                            className="md:hidden text-white animate-pulse"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}

                {isMenuOpen && (
                    <div className="md:hidden fixed top-full w-auto right-0 bg-midnight-950/90 border-b border-midnight-700 z-40 shadow-lg rounded-bl-3xl">
                        <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                            <Link
                                to={`/${brokerSlug}`}
                                className="flex items-center gap-3 text-gray-300 p-2 rounded-full hover:bg-white/5"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Home size={20} /> Início
                            </Link>
                            <Link
                                to={`/${brokerSlug}/buscar`}
                                className="flex items-center gap-3 text-gray-300 p-2 rounded-full hover:bg-white/5"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Search size={20} /> Buscar Imóveis
                            </Link>
                            <Link
                                to={`/${brokerSlug}/sobre`}
                                className="flex items-center gap-3 text-gray-300 p-2 rounded-full hover:bg-white/5"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <User size={18} /> Sobre
                            </Link>

                            {/* WhatsApp Button - Mobile */}
                            <button
                                onClick={() => {
                                    if (broker && broker.whatsapp) {
                                        // Track click (general contact)
                                        trackWhatsAppClick(broker.id, 'general_navbar_mobile', 'contact');

                                        const message = `Olá ${broker.nome}! Vi seu perfil na iziBrokerz e gostaria de conversar.`;
                                        const whatsappUrl = generateWhatsAppLink({
                                            phone: broker.whatsapp,
                                            message: message
                                        });
                                        window.open(whatsappUrl, '_blank');
                                    } else {
                                        alert('WhatsApp não disponível para este corretor.');
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-full transition-all text-white font-bold shadow-lg shadow-emerald-500/30 hover:scale-105"
                                title="Fale Comigo"
                            >
                                <MessageCircle size={18} />
                                <span>Fale Comigo</span>
                            </button>
                            {/* Login Button - Inline */}
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full transition-all text-white font-medium shadow-lg shadow-red-500/30 hover:scale-105"
                                title="Login"
                            >
                                <LogIn size={18} />
                                <span>Login</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Login Modal */}
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </nav >
    );
};
