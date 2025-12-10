import React from 'react';
import { useTheme } from './ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface FooterProps {
    partner?: {
        name: string;
        email: string;
        phone: string;
        creci?: string;
        logo?: string;
        slug?: string;
    };
}

export const Footer: React.FC<FooterProps> = ({ partner }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Detect if we're on a broker page
    const isBrokerPage = location.pathname.startsWith('/corretor/');
    const brokerSlug = partner?.slug || (isBrokerPage ? location.pathname.split('/corretor/')[1] : null);

    // O footer tem fundo escuro (slate-950), então usamos a logo clara para contraste
    const logoSrc = partner?.logo || '/logos/izibrokerz-escuro.png';

    return (
        <footer className="bg-slate-950 text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div>
                        {partner ? (
                            <>
                                {partner.logo ? (
                                    <img
                                        src={partner.logo}
                                        alt={partner.name}
                                        className="h-12 mb-4 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => brokerSlug && (window.location.href = `#/corretor/${brokerSlug}`)}
                                    />
                                ) : (
                                    <h3 className="text-2xl font-bold mb-4">{partner.name}</h3>
                                )}
                                {partner.creci && <p className="text-gray-400 text-sm mb-2">CRECI: {partner.creci}</p>}
                            </>
                        ) : (
                            <img
                                src={logoSrc}
                                alt="iziBrokerz"
                                className="h-10 mb-4 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate('/')}
                                onError={(e) => {
                                    // Fallback se a imagem não carregar
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML += '<h3 class="text-2xl font-bold mb-4 cursor-pointer hover:text-emerald-400 transition-colors">iziBrokerz</h3>';
                                }}
                            />
                        )}

                        <p className="text-gray-400 text-sm leading-relaxed">
                            {partner
                                ? "Seu parceiro de confiança para encontrar o imóvel ideal."
                                : "A Plataforma que conecta você ao imóvel dos seus sonhos."}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-4">Links Rápidos</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href={brokerSlug ? `#/corretor/${brokerSlug}` : "#/"} className="hover:text-emerald-400 transition-colors">Início</a></li>
                            <li><a href={brokerSlug ? `#/search?broker=${brokerSlug}` : "#/search"} className="hover:text-emerald-400 transition-colors">Buscar Imóveis</a></li>
                            {!brokerSlug && (
                                <>
                                    <li><a href="#/about" className="hover:text-emerald-400 transition-colors">Sobre</a></li>
                                    <li><a href="#/login" className="hover:text-emerald-400 transition-colors">Login</a></li>
                                </>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-4">Suporte</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#/terms" className="hover:text-emerald-400 transition-colors">Termos de Uso</a></li>
                            <li><a href="#/privacy" className="hover:text-emerald-400 transition-colors">Privacidade</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-4">Contato</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li>📧 {partner?.email || "contato@izibrokerz.com"}</li>
                            <li>📱 {partner?.phone || "(11) 9999-9999"}</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 text-center text-xs text-gray-500">
                    © {new Date().getFullYear()} {partner?.name || "iziBrokerz"}. Todos os direitos reservados.
                </div>
            </div>
        </footer>
    );
};
