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
        <section className={`py-16 border-t border-gray-100 dark:border-slate-800 overflow-hidden ${bgColor || 'bg-white dark:bg-slate-800'}`}>
            <div className="container mx-auto px-4 mb-10 text-center">
                <span className="text-emerald-500 font-semibold tracking-wider text-xl uppercase bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 rounded-full">
                    Confiança
                </span>
                <h2 className="text-3xl font-bold mt-4 text-gray-900 dark:text-white">
                    Nossos Parceiros
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Corretores que utilizam a iziBrokerz para impulsionar seus negócios
                </p>
            </div>

            <div className="relative w-full overflow-hidden">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>

                <div className="flex animate-scroll hover:pause" style={{ width: `${displayPartners.length * 200}px` }}>
                    {displayPartners.map((partner, index) => {
                        const logoSrc = getLogo(partner);

                        return (
                            <div
                                key={`${partner.id}-${index}`}
                                className="w-[200px] flex-shrink-0 flex items-center justify-center px-6"
                            >
                                <div
                                    onClick={() => window.open(`#/corretor/${partner.slug}`, '_blank')}
                                    className="group cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-300 w-full h-32 grayscale hover:grayscale-0 opacity-70 hover:opacity-100"
                                >
                                    {logoSrc ? (
                                        <img
                                            src={logoSrc}
                                            alt={`${partner.nome} ${partner.sobrenome}`}
                                            className="max-h-16 max-w-full object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all group-hover:scale-110"
                                            onError={(e) => {
                                                // Fallback to icon if image fails
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}

                                    {/* Fallback Icon / Name (Shown if no logo or error) */}
                                    <div className={`fallback-icon flex flex-col items-center ${logoSrc ? 'hidden' : ''}`}>
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                                            <UserCheck size={24} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center truncate w-full px-2">
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
                    animation: scroll 40s linear infinite;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
};
