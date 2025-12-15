import React, { useState, useEffect } from 'react';
import { Search, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface PropertyType {
    tipo: string;
    disponivel_temporada: boolean;
}

export const SearchFilter = ({ brokerSlug }: { brokerSlug?: string }) => {
    const [activeTab, setActiveTab] = useState<'buy' | 'rent' | 'temporada'>('buy');
    const [allPropertyTypes, setAllPropertyTypes] = useState<PropertyType[]>([]);
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showMap, setShowMap] = useState(false);
    const navigate = useNavigate();

    // Tipos padrão para Comprar/Alugar (sem temporada)
    const standardTypes = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];

    useEffect(() => {
        fetchPropertyTypes();
    }, []);

    // Reset tipo selecionado quando muda de operação
    useEffect(() => {
        setSelectedType('');
    }, [activeTab]);

    const fetchPropertyTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('tipo_imovel')
                .select('tipo, disponivel_temporada')
                .order('tipo');

            if (error) throw error;
            if (data) {
                setAllPropertyTypes(data);
            }
        } catch (error) {
            console.error('Error fetching property types:', error);
        }
    };

    // Filtrar tipos baseado na operação selecionada
    const filteredPropertyTypes = allPropertyTypes.filter(type => {
        if (activeTab === 'temporada') {
            // Temporada: mostrar apenas tipos com disponivel_temporada = true
            return type.disponivel_temporada === true;
        } else {
            // Comprar/Alugar: mostrar apenas os 5 tipos padrão
            return standardTypes.some(st => st.toLowerCase() === type.tipo.toLowerCase());
        }
    });

    const handleSearch = () => {
        const params = new URLSearchParams();

        if (activeTab === 'rent') {
            params.append('operacao', 'locacao');
        } else if (activeTab === 'buy') {
            params.append('operacao', 'venda');
        } else if (activeTab === 'temporada') {
            params.append('operacao', 'temporada');
        }

        if (selectedType) params.append('tipo', selectedType);
        if (searchTerm) params.append('q', searchTerm);
        if (showMap) params.append('view', 'map');

        // Navigation Logic
        if (brokerSlug) {
            navigate(`/corretor/${brokerSlug}/buscar?${params.toString()}`);
        } else {
            navigate(`/search?${params.toString()}`);
        }
    };

    return (

        <div className="bg-midnight-950/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto -mt-12 md:-mt-24 relative z-20 mx-4 md:mx-auto group">
            {/* Decorative sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-3xl" />

            <div className="flex gap-4 mb-6 border-b border-white/10 pb-4 relative z-10">
                <button
                    className={`pb-2 font-bold tracking-wide text-sm uppercase transition-colors relative ${activeTab === 'rent'
                        ? 'text-blue-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('rent')}
                >
                    Alugar
                    {activeTab === 'rent' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
                    )}
                </button>
                <button
                    className={`pb-2 font-bold tracking-wide text-sm uppercase transition-colors relative ${activeTab === 'buy'
                        ? 'text-red-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('buy')}
                >
                    Comprar
                    {activeTab === 'buy' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
                    )}
                </button>
                <button
                    className={`pb-2 font-bold tracking-wide text-sm uppercase transition-colors relative ${activeTab === 'temporada'
                        ? 'text-orange-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('temporada')}
                >
                    Temporada
                    {activeTab === 'temporada' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-400 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"></span>
                    )}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 relative z-10">
                <div className="flex-1 border border-white/10 rounded-full px-4 py-3 flex items-center bg-black/30 focus-within:bg-black/50 focus-within:border-emerald-500/50 transition-all">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full bg-transparent outline-none text-gray-200 cursor-pointer [&>option]:bg-midnight-950 [&>option]:text-white"
                    >
                        <option value="" className="bg-midnight-950 text-gray-400">Tipo de Imóvel</option>
                        {filteredPropertyTypes.map((type, idx) => (
                            <option key={idx} value={type.tipo} className="bg-midnight-950">
                                {type.tipo.charAt(0).toUpperCase() + type.tipo.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-[2] border border-white/10 rounded-full px-4 py-3 flex items-center bg-black/30 focus-within:bg-black/50 focus-within:border-emerald-500/50 transition-all">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Digite cidades, bairros ou características..."
                        className="w-full bg-transparent outline-none text-white placeholder-gray-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <button
                    onClick={handleSearch}
                    className={`
                        font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 uppercase tracking-wide shadow-lg
                        ${activeTab === 'temporada' ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20' : ''}
                        ${activeTab === 'rent' ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20' : ''}
                        ${activeTab === 'buy' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : ''}
                    `}
                >
                    Buscar
                </button>
            </div>
        </div>
    );
};
