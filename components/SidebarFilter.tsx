import React, { useState, useEffect } from 'react';
import { Search, Map, Filter, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

export interface FilterState {
    operations: string[];
    types: string[];
    bedrooms: number | null; // null = any, 4 = 4+
    bathrooms: number | null;
    parking: number | null;
    minPrice: number | '';
    maxPrice: number | '';
    minArea: number | '';
    maxArea: number | '';
    cities: string[];
    neighborhoods: string[];
}

interface SidebarFilterProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    availableCities: string[];
    availableNeighborhoods: string[];
    availableOperations: string[];
    availableTypes: string[];
    onClose?: () => void; // For mobile modal
    totalResults: number;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
    filters,
    setFilters,
    availableCities,
    availableNeighborhoods,
    availableOperations,
    availableTypes,
    onClose,
    totalResults
}) => {
    // Local state for search inputs
    const [citySearch, setCitySearch] = useState('');
    const [neighSearch, setNeighSearch] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        operation: true,
        type: true,
        price: true,
        area: true,
        rooms: true,
        cities: true,
        neighborhoods: true
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Helper for case-insensitive type comparison
    const isTypeIncluded = (type: string) => {
        return filters.types.some(t => t.toLowerCase() === type.toLowerCase());
    };

    const handleOperationChange = (op: string) => {
        setFilters(prev => {
            const newOps = prev.operations.includes(op)
                ? prev.operations.filter(o => o !== op)
                : [...prev.operations, op];
            return { ...prev, operations: newOps };
        });
    };

    const handleTypeChange = (type: string) => {
        setFilters(prev => {
            // Case-insensitive check for existing type
            const existingIndex = prev.types.findIndex(t => t.toLowerCase() === type.toLowerCase());
            const newTypes = existingIndex >= 0
                ? prev.types.filter((_, i) => i !== existingIndex)
                : [...prev.types, type];
            return { ...prev, types: newTypes };
        });
    };

    const handleNeighborhoodChange = (neigh: string) => {
        setFilters(prev => {
            const newNeighs = prev.neighborhoods.includes(neigh)
                ? prev.neighborhoods.filter(n => n !== neigh)
                : [...prev.neighborhoods, neigh];
            return { ...prev, neighborhoods: newNeighs };
        });
    };

    const handleCityChange = (city: string) => {
        setFilters(prev => {
            const newCities = prev.cities.includes(city)
                ? prev.cities.filter(c => c !== city)
                : [...prev.cities, city];
            return { ...prev, cities: newCities };
        });
    };

    const filteredCities = (availableCities || []).filter(c =>
        c.toLowerCase().includes(citySearch.toLowerCase())
    );

    const filteredNeighborhoods = (availableNeighborhoods || []).filter(n =>
        n.toLowerCase().includes(neighSearch.toLowerCase())
    );

    const NumberButton = ({ value, label, current, onChange }: { value: number | null, label: string, current: number | null, onChange: (val: number | null) => void }) => (
        <button
            onClick={() => onChange(value === current ? null : value)}
            className={`flex-1 py-2 px-1 rounded-lg text-sm font-bold border transition-all ${current === value
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-slate-900 h-full overflow-y-auto no-scrollbar pb-20 md:pb-0">
            {/* Header Mobile */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Filter size={20} className="text-emerald-400" />
                    Filtrar Imóveis
                </h3>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="p-4 space-y-6">

                {/* Operação */}
                <div className="border-b border-white/5 pb-6">
                    <button onClick={() => toggleSection('operation')} className="flex items-center justify-between w-full mb-4 group">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Operação</h4>
                        {expandedSections.operation ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </button>
                    {expandedSections.operation && (
                        <div className="flex flex-col gap-3">
                            {['Venda', 'Locação', 'Temporada'].filter(op => availableOperations.includes(op.toLowerCase())).map(op => (
                                <label key={op} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${filters.operations.includes(op.toLowerCase()) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-800 group-hover:border-emerald-500/50'}`}>
                                        {filters.operations.includes(op.toLowerCase()) && <Check size={14} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span className={`text-sm ${filters.operations.includes(op.toLowerCase()) ? 'text-white font-bold' : 'text-slate-400 group-hover:text-white'}`}>{op}</span>
                                    <input type="checkbox" className="hidden" checked={filters.operations.includes(op.toLowerCase())} onChange={() => handleOperationChange(op.toLowerCase())} />
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tipo de Imóvel */}
                <div className="border-b border-white/5 pb-6">
                    <button onClick={() => toggleSection('type')} className="flex items-center justify-between w-full mb-4 group">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Tipo de Imóvel</h4>
                        {expandedSections.type ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </button>
                    {expandedSections.type && (
                        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {availableTypes.map(type => (
                                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isTypeIncluded(type) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-800 group-hover:border-emerald-500/50'}`}>
                                        {isTypeIncluded(type) && <Check size={14} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span className={`text-sm ${isTypeIncluded(type) ? 'text-white font-bold' : 'text-slate-400 group-hover:text-white'}`}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </span>
                                    <input type="checkbox" className="hidden" checked={isTypeIncluded(type)} onChange={() => handleTypeChange(type)} />
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Preço */}
                <div className="border-b border-white/5 pb-6">
                    <button onClick={() => toggleSection('price')} className="flex items-center justify-between w-full mb-4 group">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Valor (R$)</h4>
                        {expandedSections.price ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </button>
                    {expandedSections.price && (
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="Mínimo"
                                value={filters.minPrice}
                                onChange={e => setFilters(prev => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : '' }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                                type="number"
                                placeholder="Máximo"
                                value={filters.maxPrice}
                                onChange={e => setFilters(prev => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : '' }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Área */}
                <div className="border-b border-white/5 pb-6">
                    <button onClick={() => toggleSection('area')} className="flex items-center justify-between w-full mb-4 group">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Área (m²)</h4>
                        {expandedSections.area ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </button>
                    {expandedSections.area && (
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="Mín"
                                value={filters.minArea}
                                onChange={e => setFilters(prev => ({ ...prev, minArea: e.target.value ? Number(e.target.value) : '' }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                                type="number"
                                placeholder="Máx"
                                value={filters.maxArea}
                                onChange={e => setFilters(prev => ({ ...prev, maxArea: e.target.value ? Number(e.target.value) : '' }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Quartos, Banheiros, Vagas */}
                <div className="border-b border-white/5 pb-6">
                    <button onClick={() => toggleSection('rooms')} className="flex items-center justify-between w-full mb-4 group">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Características</h4>
                        {expandedSections.rooms ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </button>
                    {expandedSections.rooms && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 font-bold mb-2 block">Quartos</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <NumberButton
                                            key={num}
                                            value={num}
                                            label={num === 4 ? '4+' : num.toString()}
                                            current={filters.bedrooms}
                                            onChange={val => setFilters(prev => ({ ...prev, bedrooms: val }))}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold mb-2 block">Banheiros</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <NumberButton
                                            key={num}
                                            value={num}
                                            label={num === 4 ? '4+' : num.toString()}
                                            current={filters.bathrooms}
                                            onChange={val => setFilters(prev => ({ ...prev, bathrooms: val }))}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold mb-2 block">Vagas</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <NumberButton
                                            key={num}
                                            value={num}
                                            label={num === 4 ? '4+' : num.toString()}
                                            current={filters.parking}
                                            onChange={val => setFilters(prev => ({ ...prev, parking: val }))}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cidades */}
                <div className="border-b border-white/5 pb-6">
                    <button onClick={() => toggleSection('cities')} className="flex items-center justify-between w-full mb-4 group">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Cidades</h4>
                        {expandedSections.cities ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </button>
                    {expandedSections.cities && (
                        <>
                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar cidade..."
                                    value={citySearch}
                                    onChange={e => setCitySearch(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredCities.map((city, idx) => (
                                    <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${filters.cities.includes(city) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-800 group-hover:border-emerald-500/50'}`}>
                                            {filters.cities.includes(city) && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className={`text-sm ${filters.cities.includes(city) ? 'text-white font-bold' : 'text-slate-400 group-hover:text-white'}`}>
                                            {city}
                                        </span>
                                        <input type="checkbox" className="hidden" checked={filters.cities.includes(city)} onChange={() => handleCityChange(city)} />
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Bairros */}
                <div className="pb-6">
                    <button onClick={() => toggleSection('neighborhoods')} className="flex items-center justify-between w-full mb-4 group">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Bairros</h4>
                        {expandedSections.neighborhoods ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </button>
                    {expandedSections.neighborhoods && (
                        <>
                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar bairro..."
                                    value={neighSearch}
                                    onChange={e => setNeighSearch(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredNeighborhoods.map((neigh, idx) => (
                                    <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${filters.neighborhoods.includes(neigh) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-800 group-hover:border-emerald-500/50'}`}>
                                            {filters.neighborhoods.includes(neigh) && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className={`text-sm ${filters.neighborhoods.includes(neigh) ? 'text-white font-bold' : 'text-slate-400 group-hover:text-white'}`}>
                                            {neigh}
                                        </span>
                                        <input type="checkbox" className="hidden" checked={filters.neighborhoods.includes(neigh)} onChange={() => handleNeighborhoodChange(neigh)} />
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Actions (Mobile only) */}
            <div className="md:hidden sticky bottom-0 p-4 bg-slate-900 border-t border-white/10 mt-auto flex flex-col gap-3">
                <button onClick={onClose} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20">
                    Ver {totalResults} Imóveis
                </button>
                <button
                    onClick={() => setFilters({
                        operations: [], types: [], bedrooms: null, bathrooms: null, parking: null,
                        minPrice: '', maxPrice: '', minArea: '', maxArea: '', cities: [], neighborhoods: []
                    })}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-white/10 transition-colors"
                >
                    Limpar Filtros
                </button>
            </div>
        </div>
    );
};
