import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeContext';
import { UserCheck } from 'lucide-react';

interface Partner {
    id: string;
    nome: string;
    sobrenome: string;
    slug: string;
    watermark_dark: string | null;
    watermark_light: string | null;
    avatar: string | null;
    marca_dagua: string | null;
}

interface PartnersCarouselProps {
    bgColor?: string;
}

export const PartnersCarousel: React.FC<PartnersCarouselProps> = ({ bgColor }) => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { theme } = useTheme();

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const { data, error } = await supabase
                .from('perfis')
                .select('id, nome, sobrenome, slug, watermark_dark, watermark_light, avatar, marca_dagua, is_admin')
                .eq('is_trial', false) // Only paying users
                .eq('is_admin', false) // Exclude admins
                .order('created_at', { ascending: false })
                .limit(50); // Fetch more to allow for client-side filtering

            if (error) throw error;
            if (data) {
                // Filter: Must have a logo (watermark or marca_dagua)
                const validPartners = data.filter(p =>
                    p.watermark_light || p.watermark_dark || p.marca_dagua
                );
                setPartners(validPartners);
            }
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || partners.length === 0) return null;

    // Helper to get the best logo
    const getLogo = (p: Partner) => {
        // Priority: Watermark (Theme based) -> Generic Watermark -> Avatar -> Placeholder
        if (theme === 'light' && p.watermark_light) return p.watermark_light;
        if (theme === 'dark' && p.watermark_dark) return p.watermark_dark;
        if (p.marca_dagua) return p.marca_dagua;
        if (p.avatar) return p.avatar;
        return null;
    };

    // Duplicate partners to create seamless loop if we have few items
    const displayPartners = partners.length < 10 ? [...partners, ...partners, ...partners] : [...partners, ...partners];

    return (
        <section className={`py-24 border-t border-white/5 overflow-hidden bg-midnight-950`}>
            <div className="container mx-auto px-4 mb-12 text-center">
                <span className="text-emerald-400 font-semibold tracking-wider text-sm uppercase bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                    Confiança & Credibilidade
                </span>
                <h2 className="text-3xl md:text-4xl font-heading font-bold mt-6 text-white">
                    Nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Parceiros</span>
                </h2>
                <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                    Os melhores profissionais do mercado utilizam nossa tecnologia para realizar sonhos.
                </p>
            </div>

            <div className="relative w-full overflow-hidden group">
                {/* Gradient Masks (Midnight) */}
                <div className="absolute left-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-r from-midnight-950 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-l from-midnight-950 to-transparent z-10 pointer-events-none"></div>

                <div className="flex animate-scroll group-hover:pause" style={{ width: `${displayPartners.length * 200}px` }}>
                    {displayPartners.map((partner, index) => {
                        // Force logic for Dark Background: Prevails watermark_dark (which usually means Logo for Dark Mode? or Logo that is Dark?)
                        // Testing assumption: watermark_light is for light theme (dark logo). watermark_dark is for dark theme (light logo).
                        // Let's use the naming convention usually adopted: 
                        // If Layout.tsx used theme==='light' ? watermark_light : watermark_dark 
                        // PROBABLY watermark_light = logo for light theme. watermark_dark = logo for dark theme.
                        // Since background is Midnight (Dark), we need watermark_dark.
                        const logoSrc = partner.watermark_dark || partner.avatar || partner.marca_dagua;

                        return (
                            <div
                                key={`${partner.id}-${index}`}
                                className="w-[200px] flex-shrink-0 flex items-center justify-center px-6"
                            >
                                <div
                                    onClick={() => window.open(`#/corretor/${partner.slug}`, '_blank')}
                                    className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-3xl hover:bg-white/5 transition-all duration-300 w-full h-32 opacity-50 hover:opacity-100 hover:scale-105"
                                >
                                    {logoSrc ? (
                                        <img
                                            src={logoSrc}
                                            alt={`${partner.nome} ${partner.sobrenome}`}
                                            className="max-h-16 max-w-full object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 group-hover:scale-110"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}

                                    {/* Fallback Icon / Name */}
                                    <div className={`fallback-icon flex flex-col items-center ${logoSrc ? 'hidden' : ''}`}>
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-emerald-400 mb-2">
                                            <UserCheck size={24} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-300 text-center truncate w-full px-2">
                                            {partner.nome}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 60s linear infinite;
                }
                .group:hover .animate-scroll {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
};
