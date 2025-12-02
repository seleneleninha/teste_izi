import React from 'react';
import { useTheme } from './ThemeContext';

interface FooterProps {
    partner?: {
        name: string;
        email: string;
        phone: string;
        creci?: string;
        logo?: string;
    };
}

export const Footer: React.FC<FooterProps> = ({ partner }) => {
    const { theme } = useTheme();

    // O footer padrão tem fundo escuro (slate-950), então usamos a logo clara por padrão para contraste.
    // Se o parceiro tiver logo, usamos a dele.
    const logoSrc = partner?.logo || (theme === 'dark' ? '/izibrokerz-claro.png' : '/izibrokerz-claro.png');
    // Nota: Mantive a logo clara em ambos os casos pois o fundo é fixo em slate-950 (escuro).
    // Se o fundo mudasse com o tema, a lógica seria: theme === 'dark' ? 'claro.png' : 'escuro.png'

    return (
        <footer className="bg-slate-950 text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div>
                        {partner ? (
                            <>
                                <h3 className="text-2xl font-bold mb-4">{partner.name}</h3>
                                {partner.creci && <p className="text-gray-400 text-sm mb-2">CRECI: {partner.creci}</p>}
                            </>
                        ) : (
                            <img
                                src="/izibrokerz-claro.png"
                                alt="iziBrokerz"
                                className="h-10 mb-4 object-contain"
                                onError={(e) => {
                                    // Fallback se a imagem não carregar
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML += '<h3 class="text-2xl font-bold mb-4">iziBrokerz</h3>';
                                }}
                            />
                        )}

                        <p className="text-gray-400 text-sm leading-relaxed">
                            {partner
                                ? "Seu parceiro de confiança para encontrar o imóvel ideal."
                                : "A plataforma que conecta você ao imóvel dos seus sonhos."}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-4">Links Rápidos</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#/" className="hover:text-emerald-400 transition-colors">Início</a></li>
                            <li><a href="#/search" className="hover:text-emerald-400 transition-colors">Buscar Imóveis</a></li>
                            <li><a href="#/login" className="hover:text-emerald-400 transition-colors">Login</a></li>
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
