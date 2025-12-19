import React, { useState } from 'react';
import { Home, Package, Search } from 'lucide-react';
import { CustomOrderModal } from './CustomOrderModal';

interface NoPropertiesFoundProps {
    message?: string;
    subtitle?: string;
    filters?: {
        operacao?: string;
        tipoImovel?: string;
        cidade?: string;
        bairro?: string;
        valorMax?: number;
    };
    onShowMore?: () => void;
    conversationId?: string;
    brokerId?: string; // ID do corretor ou undefined para 'plataforma'
}

export const NoPropertiesFound: React.FC<NoPropertiesFoundProps> = ({
    message = "Até o momento, seu imóvel ideal ainda não chegou",
    subtitle = "Que tal Encomendar seu Imóvel? Comunicaremos nossos Parceiros que existe uma procura pelo imóvel dos seus sonhos.",
    filters,
    onShowMore,
    conversationId,
    brokerId
}) => {
    const [showModal, setShowModal] = useState(false);

    // Debug: verificar se brokerId est\u00e1 sendo recebido
    console.log('NoPropertiesFound - brokerId recebido:', brokerId);

    const handleShowMore = () => {
        if (onShowMore) {
            onShowMore();
        } else {
            // Default: scroll to top or navigate based on context
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <>
            <div className="text-center py-16 px-4 max-w-3xl mx-auto">
                {/* Icon */}
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-full mb-4">
                        <Home size={40} className="text-gray-400" />
                    </div>

                    {/* Heading */}
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        {message}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed">
                        {subtitle}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {/* Primary Action: Custom Order */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
                    >
                        <Package size={20} />
                        Encomendar Imóvel
                    </button>

                    {/* Secondary Action: Show More */}
                    <button
                        onClick={handleShowMore}
                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-4 px-8 rounded-full transition-all border border-slate-600"
                    >
                        <Search size={20} />
                        Ver + opções
                    </button>
                </div>

                {/* Optional: Quick Stats or Trust Indicators */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <p className="text-sm text-gray-400">
                        ✨ Encomendas são <span className="text-emerald-400 font-semibold">totalmente gratuitas</span> e conectam você aos melhores corretores da região
                    </p>
                </div>
            </div>

            {/* Custom Order Modal */}
            <CustomOrderModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                prefilledData={filters}
                conversationId={conversationId}
                brokerId={brokerId}
            />
        </>
    );
};
