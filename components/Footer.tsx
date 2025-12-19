import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LegalDocumentModal } from './LegalDocumentModal';

export interface FooterProps {
    partner?: {
        name: string;
        email: string;
        phone: string;
        creci?: string;
        logo?: string;
        slug?: string;
        endereço?: string;
        numero?: string;
        bairro?: string;
        cidade?: string;
        uf?: string;
        instagram?: string;
        facebook?: string;
        linkedin?: string;
        youtube?: string;
        x?: string;
    };
    isBrokerPage?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ partner, isBrokerPage: propIsBrokerPage }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [legalDocType, setLegalDocType] = useState<'privacy' | 'terms' | 'lgpd'>('privacy');

    // Detect if we're on a broker page (either via prop or URL)
    // Detect broker page from clean URLs (without /corretor prefix)
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const isFixedRoute = ['search', 'buscar', 'partner', 'login', 'about', 'favoritos', 'admin', 'imovel'].some(r => pathSegments[0] === r);
    const isBrokerPage = propIsBrokerPage || (!isFixedRoute && pathSegments.length > 0 && location.pathname !== '/');
    const brokerSlug = partner?.slug || (isBrokerPage && pathSegments[0] ? pathSegments[0] : null);

    // Logo: Use broker's watermark_dark if on broker page, otherwise platform logo
    const logoSrc = isBrokerPage && partner?.logo
        ? partner.logo
        : '/logos/izibrokerz-escuro.png';

    return (
        <>
            <footer className="bg-black text-white py-20 border-t border-white/10">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">

                            <img
                                src={logoSrc}
                                alt={isBrokerPage ? partner?.name : "iziBrokerz"}
                                className="h-10 mb-6 object-contain cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    if (isBrokerPage && brokerSlug) {
                                        navigate(`/${brokerSlug}`);
                                    } else {
                                        navigate('/');
                                    }
                                }}
                            />

                            <div>
                                {isBrokerPage ? (
                                    <p className="text-gray-400 text-sm mb-6">
                                        Atendimento personalizado para encontrar o imóvel dos seus sonhos. <strong className="text-emerald-400">Vamos agendar uma visita?</strong>
                                    </p>
                                ) : (
                                    <p className="text-gray-400 text-sm mb-6">
                                        A Plataforma Imobiliária que chegou para facilitar sua busca pelo imóvel ideal. <br /><strong className="text-emerald-400">Fale com nossos Corretores Parceiros!</strong>
                                    </p>
                                )}
                            </div>

                            {/* Social Media Icons - Dynamic for Broker Pages */}
                            {partner && (partner.instagram || partner.facebook || partner.linkedin || partner.youtube || partner.x) ? (
                                <div className="flex gap-3">
                                    {partner.instagram && (
                                        <a href={partner.instagram} target="_blank" rel="noopener noreferrer" className="min-w-[44px] min-h-[44px] rounded-full bg-white/5 flex items-center justify-center hover:bg-pink-600 transition-all text-gray-400 hover:text-white active:scale-95" aria-label="Instagram">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                        </a>
                                    )}
                                    {partner.facebook && (
                                        <a href={partner.facebook} target="_blank" rel="noopener noreferrer" className="min-w-[44px] min-h-[44px] rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-all text-gray-400 hover:text-white active:scale-95" aria-label="Facebook">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                                        </a>
                                    )}
                                    {partner.linkedin && (
                                        <a href={partner.linkedin} target="_blank" rel="noopener noreferrer" className="min-w-[44px] min-h-[44px] rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-500 transition-all text-gray-400 hover:text-white active:scale-95" aria-label="LinkedIn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                                        </a>
                                    )}
                                    {partner.youtube && (
                                        <a href={partner.youtube} target="_blank" rel="noopener noreferrer" className="min-w-[44px] min-h-[44px] rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600 transition-all text-gray-400 hover:text-white active:scale-95" aria-label="YouTube">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                                        </a>
                                    )}
                                    {partner.x && (
                                        <a href={partner.x} target="_blank" rel="noopener noreferrer" className="min-w-[44px] min-h-[44px] rounded-full bg-white/5 flex items-center justify-center hover:bg-gray-700 transition-all text-gray-400 hover:text-white active:scale-95" aria-label="X (Twitter)">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-colors text-gray-400 hover:text-white">
                                        <span className="sr-only">Instagram</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-500 transition-colors text-gray-400 hover:text-white">
                                        <span className="sr-only">LinkedIn</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>


                        {/* Column 2: Broker Links or Platform Explore */}
                        <div>
                            <h4 className="text-lg font-bold mb-6 text-gray-200">{isBrokerPage ? 'Navegação' : 'Explorar'}</h4>
                            <ul className="space-y-3 text-gray-400 text-sm">
                                {isBrokerPage && brokerSlug ? (
                                    <>
                                        <li><a href={`/${brokerSlug}`} className="hover:text-emerald-400 transition-colors">Início</a></li>
                                        <li><a href={`/${brokerSlug}/buscar?operacao=venda`} className="hover:text-emerald-400 transition-colors">Comprar</a></li>
                                        <li><a href={`/${brokerSlug}/buscar?operacao=locacao`} className="hover:text-emerald-400 transition-colors">Alugar</a></li>
                                        <li><a href={`/${brokerSlug}/buscar`} className="hover:text-emerald-400 transition-colors">Todos os Imóveis</a></li>
                                    </>
                                ) : (
                                    <>
                                        <li><a href="/search?operacao=venda" className="hover:text-emerald-400 transition-colors">Imóveis à Venda</a></li>
                                        <li><a href="/search?operacao=locacao" className="hover:text-emerald-400 transition-colors">Imóveis para Alugar</a></li>
                                        <li><a href="/search?operacao=temporada" className="hover:text-emerald-400 transition-colors">Imóveis para Temporada</a></li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Column 3: Contact or Institutional */}
                        <div>
                            <h4 className="text-lg font-bold mb-6 text-gray-200">{isBrokerPage ? 'Fale Comigo' : 'Institucional'}</h4>
                            <ul className="space-y-3 text-gray-400 text-sm">
                                {isBrokerPage && partner ? (
                                    <>
                                        {partner.phone && (
                                            <li className="flex items-center gap-2">
                                                <span className="opacity-70">Tel:</span>
                                                <a href={`tel:${partner.phone}`} className="hover:text-emerald-400 transition-colors">{partner.phone}</a>
                                            </li>
                                        )}
                                        {partner.email && (
                                            <li className="flex items-center gap-2">
                                                <span className="opacity-70">Email:</span>
                                                <a href={`mailto:${partner.email}`} className="hover:text-emerald-400 transition-colors">{partner.email}</a>
                                            </li>
                                        )}
                                        {/* Whatsapp Link if available */}
                                        <li>
                                            <a href={`https://wa.me/55${partner.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                                                WhatsApp
                                            </a>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li><a href="/login" className="hover:text-emerald-400 transition-colors">Área do Corretor</a></li>
                                        <li><a href="/partner" className="hover:text-emerald-400 transition-colors">Seja um Parceiro</a></li>
                                        <li><a href="/about" className="hover:text-emerald-400 transition-colors">Sobre Nós</a></li>
                                        <li><a href="#/contact" className="hover:text-emerald-400 transition-colors">Contato</a></li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Column 4: CTA or Location */}
                        <div className={isBrokerPage ? "" : "bg-white/5 p-6 rounded-3xl border border-white/10"}>
                            {isBrokerPage ? (
                                <div>
                                    <h4 className="text-lg font-bold mb-6 text-gray-200">Localização</h4>
                                    {partner?.endereço ? (
                                        <div className="text-gray-400 text-sm space-y-1">
                                            <p>{partner.endereço}, {partner.numero}</p>
                                            <p>{partner.bairro}</p>
                                            <p>{partner.cidade}/{partner.uf}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm mb-4">
                                            Atendimento personalizado para encontrar o imóvel dos seus sonhos.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <h4 className="text-lg font-bold mb-2 text-white">Ainda com dúvidas?</h4>
                                    <p className="text-gray-400 text-sm mb-4">Teste nossa Plataforma GRATUITAMENTE por 14 dias. Sem cartão de crédito e sem compromisso. Cancele quando quiser.</p>
                                    <button
                                        onClick={() => window.open('http://localhost:3000/#/partner', '_blank')}
                                        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 -lg transition-all text-sm shadow-lg shadow-emerald-500/20"
                                    >
                                        QUERO TESTAR!
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-md text-gray-600">
                        <div className="text-center">
                            <p>© 2025 <a href="/" className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors"> iziBrokerz</a>. Todos os direitos reservados.</p>
                        </div>

                        <div className="flex gap-6 mt-4 md:mt-0">
                            <button
                                onClick={() => { setLegalDocType('terms'); setLegalModalOpen(true); }}
                                className="hover:text-gray-400 transition-colors cursor-pointer"
                            >
                                Termos de Uso
                            </button>
                            <button
                                onClick={() => { setLegalDocType('privacy'); setLegalModalOpen(true); }}
                                className="hover:text-gray-400 transition-colors cursor-pointer"
                            >
                                Privacidade
                            </button>
                            <button
                                onClick={() => { setLegalDocType('lgpd'); setLegalModalOpen(true); }}
                                className="hover:text-gray-400 transition-colors cursor-pointer"
                            >
                                LGPD
                            </button>
                        </div>

                        {isBrokerPage && (
                            <div className="text-center gap-1 my-4 md:my-0 text-white font-bold">
                                <p>Feito de <span className="text-red-500">CORRETOR</span> para <span className="text-red-500">CORRETORES</span></p>
                            </div>
                        )}
                    </div>
                </div>
            </footer>

            {/* Legal Document Modal */}
            <LegalDocumentModal
                isOpen={legalModalOpen}
                onClose={() => setLegalModalOpen(false)}
                documentType={legalDocType}
            />
        </>
    );
};
