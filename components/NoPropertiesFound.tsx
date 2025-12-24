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
    isBrokerView?: boolean;
    onPrimaryAction?: () => void;
    hideActions?: boolean;
}

export const NoPropertiesFound: React.FC<NoPropertiesFoundProps> = ({
    message,
    subtitle,
    filters,
    onShowMore,
    conversationId,
    brokerId,
    isBrokerView = false,
    onPrimaryAction,
    hideActions = false
}) => {
    const [showModal, setShowModal] = useState(false);

    // Default values based on view mode
    const displayMessage = message || (isBrokerView
        ? "Você ainda não possui imóveis cadastrados"
        : "Até o momento, seu imóvel ideal ainda não chegou");

    const displaySubtitle = subtitle || (isBrokerView
        ? "Que tal anunciar seu primeiro imóvel e começar a expandir sua visibilidade e novas parcerias? Seus anúncios poderão compor a carteira de outros corretores da plataforma!"
        : "Que tal Encomendar seu Imóvel? Comunicaremos nossos Parceiros que existe uma procura pelo imóvel dos seus sonhos.");

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
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        {displayMessage}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
                        {displaySubtitle}
                    </p>
                </div>

                {/* Alinhamento de botões */}
                {!hideActions && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {/* Primary Action */}
                        <button
                            onClick={() => {
                                if (onPrimaryAction) {
                                    onPrimaryAction();
                                } else if (!isBrokerView) {
                                    setShowModal(true);
                                } else {
                                    window.location.href = '/add-property';
                                }
                            }}
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105"
                        >
                            {isBrokerView ? <Package size={20} /> : <Package size={20} />}
                            {isBrokerView ? "Anunciar meu 1º Imóvel" : "Encomendar Imóvel"}
                        </button>

                        {/* Secondary Action */}
                        {!isBrokerView ? (
                            <button
                                onClick={handleShowMore}
                                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold py-4 px-8 rounded-full transition-all border border-slate-700"
                            >
                                <Search size={20} />
                                Ver + opções
                            </button>
                        ) : (
                            <button
                                onClick={() => window.location.href = '/partner-properties'}
                                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold py-4 px-8 rounded-full transition-all border border-slate-700"
                            >
                                <Search size={20} />
                                Explorar Parcerias
                            </button>
                        )}
                    </div>
                )}

                {/* Optional: Quick Stats or Trust Indicators */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <p className="text-sm text-gray-400">
                        {isBrokerView ? (
                            <>✨ Anunciar na <span className="text-emerald-400 font-semibold">iziBrokerz</span> aumenta suas chances de fechamento através da nossa rede de parcerias.</>
                        ) : (
                            <>✨ Encomendas são <span className="text-emerald-400 font-semibold">totalmente gratuitas</span> e conectam você aos melhores corretores da região</>
                        )}
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
