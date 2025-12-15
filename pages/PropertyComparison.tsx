import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';

interface Property {
    id: string;
    title: string;
    price: number;
    location: string;
    beds: number;
    baths: number;
    area: number;
    image: string;
    type: string;
    features: string[];
}

export const PropertyComparison: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    const idsString = searchParams.get('ids');
    const ids = idsString?.split(',') || [];

    useEffect(() => {
        if (ids.length > 0) {
            fetchProperties();
        } else {
            setLoading(false);
        }
    }, [idsString]);

    const fetchProperties = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('anuncios')
                .select('*')
                .in('id', ids);

            if (error) throw error;

            if (data) {
                const mapped: Property[] = data.map(p => ({
                    id: p.id,
                    title: p.titulo,
                    price: p.valor_venda || p.valor_locacao || 0,
                    location: `${p.bairro}, ${p.cidade}`,
                    beds: p.quartos || 0,
                    baths: p.banheiros || 0,
                    area: p.area_priv || 0,
                    image: p.fotos ? p.fotos.split(',')[0] : 'https://picsum.photos/seed/prop1/400/300',
                    type: p.tipo_imovel || 'N/A',
                    features: p.caracteristicas ? p.caracteristicas.split(',') : []
                }));
                setProperties(mapped);
            }
        } catch (error) {
            console.error('Erro ao buscar propriedades:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Nenhum imóvel selecionado para comparação.</p>
                <button
                    onClick={() => navigate('/properties')}
                    className="px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600"
                >
                    Voltar para Imóveis
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex items-center mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="mr-4 p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">Comparativo de Imóveis</h2>
                    <p className="text-slate-400 text-sm">Comparando {properties.length} imóveis lado a lado</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr>
                            <th className="p-4 text-left w-48 bg-slate-900/50 sticky left-0 border-b border-slate-700"></th>
                            {properties.map(prop => (
                                <th key={prop.id} className="p-4 border-b border-slate-700 min-w-[300px]">
                                    <div className="relative rounded-full overflow-hidden h-48 mb-4 shadow-md">
                                        <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                                        <button
                                            className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-gray-700 hover:text-red-500"
                                            onClick={() => {
                                                navigate(`/compare?ids=${ids.filter(id => id !== prop.id).join(',')}`);
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{prop.title}</h3>
                                    <p className="text-sm text-slate-400 font-normal">{prop.location}</p>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-slate-300">
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Preço</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800 text-lg font-bold text-primary-500">
                                    R$ {prop.price.toLocaleString('pt-BR')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Área Total</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800">
                                    {prop.area} m²
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Quartos</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800">
                                    {prop.beds}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Banheiros</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800">
                                    {prop.baths}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800 align-top">Destaques</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800 align-top">
                                    <ul className="space-y-2">
                                        {prop.features.length > 0 ? prop.features.map((feat, i) => (
                                            <li key={i} className="flex items-center text-sm">
                                                <Check size={14} className="text-green-500 mr-2 shrink-0" /> {feat}
                                            </li>
                                        )) : (
                                            <li className="text-sm text-gray-400">Sem destaques</li>
                                        )}
                                    </ul>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Tipo</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800">
                                    <span className="px-3 py-1 rounded-full bg-slate-700 text-xs font-medium">
                                        {prop.type}
                                    </span>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 bg-slate-900/50 sticky left-0"></td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4">
                                    <button
                                        onClick={() => navigate(`/properties/${prop.id}`)}
                                        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-full transition-colors shadow-md"
                                    >
                                        Ver Detalhes
                                    </button>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};