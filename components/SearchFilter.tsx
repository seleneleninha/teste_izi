import React, { useState, useEffect } from 'react';
import { Search, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export const SearchFilter = () => {
    const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showMap, setShowMap] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPropertyTypes();
    }, []);

    const fetchPropertyTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('tipo_imovel')
                .select('tipo')
                .order('tipo');

            if (error) throw error;
            if (data) {
                setPropertyTypes(data.map(item => item.tipo));
            }
        } catch (error) {
            console.error('Error fetching property types:', error);
        }
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        // Alugar = locacao + venda/locacao
        // Comprar = venda + venda/locacao
        if (activeTab === 'rent') {
            params.append('operacao', 'locacao');
        } else {
            params.append('operacao', 'venda');
        }
        if (selectedType) params.append('tipo', selectedType);
        if (searchTerm) params.append('q', searchTerm);
        if (showMap) params.append('view', 'map');

        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-4xl mx-auto -mt-12 md:-mt-24 relative z-20 border border-gray-100 dark:border-slate-700 mx-4 md:mx-auto">
            <div className="flex gap-6 mb-6 border-b border-gray-100 dark:border-slate-700 pb-2">
                <button
                    className={`pb-2 font-semibold text-lg transition-colors relative ${activeTab === 'rent'
                        ? 'text-emerald-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    onClick={() => setActiveTab('rent')}
                >
                    Alugar
                    {activeTab === 'rent' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full"></span>
                    )}
                </button>
                <button
                    className={`pb-2 font-semibold text-lg transition-colors relative ${activeTab === 'buy'
                        ? 'text-emerald-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    onClick={() => setActiveTab('buy')}
                >
                    Comprar
                    {activeTab === 'buy' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full"></span>
                    )}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 flex items-center bg-gray-50 dark:bg-slate-900">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full bg-transparent outline-none text-gray-700 dark:text-gray-200 cursor-pointer"
                    >
                        <option value="" className="dark:bg-slate-800">Tipo de Imóvel</option>
                        {propertyTypes.map((type, idx) => (
                            <option key={idx} value={type} className="dark:bg-slate-800">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-[2] border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 flex items-center bg-gray-50 dark:bg-slate-900">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Digite cidades, bairros ou características..."
                        className="w-full bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <button
                    onClick={handleSearch}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 uppercase tracking-wide shadow-lg shadow-emerald-500/20"
                >
                    Buscar
                </button>
            </div>
        </div>
    );
};
