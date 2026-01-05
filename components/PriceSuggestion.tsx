import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, Loader2, Lightbulb, DollarSign, Info } from 'lucide-react';

interface PriceSuggestionProps {
    cidade: string;
    bairro: string;
    areaPrivativa: number;
    tipoImovel?: string;
    operacao: 'venda' | 'locacao' | 'ambos';
    onSuggestionReady?: (suggestion: PriceSuggestionData) => void;
}

export interface PriceSuggestionData {
    mediaM2Venda: number | null;
    mediaM2Locacao: number | null;
    minM2Venda: number | null;
    maxM2Venda: number | null;
    totalAnuncios: number;
    sugestaoVenda: number | null;
    sugestaoLocacao: number | null;
}

export const PriceSuggestion: React.FC<PriceSuggestionProps> = ({
    cidade,
    bairro,
    areaPrivativa,
    tipoImovel,
    operacao,
    onSuggestionReady,
}) => {
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<PriceSuggestionData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cidade && bairro && areaPrivativa > 0) {
            fetchMarketData();
        } else {
            setSuggestion(null);
        }
    }, [cidade, bairro, areaPrivativa, tipoImovel]);

    const fetchMarketData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Build query to get similar properties in the same neighborhood
            let query = supabase
                .from('anuncios')
                .select('valor_venda, valor_locacao, area_priv, tipo_imovel!inner(tipo)')
                .eq('status', 'ativo')
                .eq('cidade', cidade)
                .eq('bairro', bairro)
                .gt('area_priv', 0);

            // If tipo_imovel is specified, filter by it
            if (tipoImovel) {
                query = query.eq('tipo_imovel.tipo', tipoImovel);
            }

            const { data, error: queryError } = await query;

            if (queryError) throw queryError;

            if (!data || data.length === 0) {
                // Try fetching city-wide data if no neighborhood data
                const { data: cityData, error: cityError } = await supabase
                    .from('anuncios')
                    .select('valor_venda, valor_locacao, area_priv')
                    .eq('status', 'ativo')
                    .eq('cidade', cidade)
                    .gt('area_priv', 0);

                if (cityError || !cityData || cityData.length === 0) {
                    setError('Ainda não temos dados suficientes para esta região.');
                    setSuggestion(null);
                    return;
                }

                calculateSuggestion(cityData, areaPrivativa, true);
            } else {
                calculateSuggestion(data, areaPrivativa, false);
            }
        } catch (err) {
            console.error('Erro ao buscar dados de mercado:', err);
            setError('Erro ao buscar dados de mercado.');
        } finally {
            setLoading(false);
        }
    };

    const calculateSuggestion = (
        data: any[],
        area: number,
        isCityWide: boolean
    ) => {
        const m2Vendas: number[] = [];
        const m2Locacoes: number[] = [];

        data.forEach((prop) => {
            if (prop.valor_venda && prop.area_priv > 0) {
                m2Vendas.push(prop.valor_venda / prop.area_priv);
            }
            if (prop.valor_locacao && prop.area_priv > 0) {
                m2Locacoes.push(prop.valor_locacao / prop.area_priv);
            }
        });

        const mediaM2Venda = m2Vendas.length > 0
            ? Math.round(m2Vendas.reduce((a, b) => a + b, 0) / m2Vendas.length)
            : null;

        const mediaM2Locacao = m2Locacoes.length > 0
            ? Math.round(m2Locacoes.reduce((a, b) => a + b, 0) / m2Locacoes.length)
            : null;

        const result: PriceSuggestionData = {
            mediaM2Venda,
            mediaM2Locacao,
            minM2Venda: m2Vendas.length > 0 ? Math.round(Math.min(...m2Vendas)) : null,
            maxM2Venda: m2Vendas.length > 0 ? Math.round(Math.max(...m2Vendas)) : null,
            totalAnuncios: data.length,
            sugestaoVenda: mediaM2Venda ? Math.round(mediaM2Venda * area) : null,
            sugestaoLocacao: mediaM2Locacao ? Math.round(mediaM2Locacao * area) : null,
        };

        setSuggestion(result);
        onSuggestionReady?.(result);
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Don't render if missing required data
    if (!cidade || !bairro || areaPrivativa <= 0) {
        return null;
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                <Loader2 size={20} className="text-emerald-400 animate-spin" />
                <span className="text-slate-300">Calculando sugestão de preço...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-800/50 border border-slate-600/30 rounded-2xl p-4 flex items-center gap-3">
                <Info size={20} className="text-slate-400" />
                <span className="text-slate-400">{error}</span>
            </div>
        );
    }

    if (!suggestion) return null;

    const showVenda = operacao === 'venda' || operacao === 'ambos';
    const showLocacao = operacao === 'locacao' || operacao === 'ambos';

    return (
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Lightbulb size={20} className="text-emerald-400" />
                </div>
                <div>
                    <h4 className="text-white font-bold">💡 Sugestão de Preço</h4>
                    <p className="text-slate-400 text-sm">
                        Baseado em {suggestion.totalAnuncios} imóveis similares em {bairro}
                    </p>
                </div>
            </div>

            {/* Price Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Venda */}
                {showVenda && suggestion.sugestaoVenda && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={16} className="text-emerald-400" />
                            <span className="text-slate-400 text-sm">Valor de Venda Sugerido</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">
                            {formatCurrency(suggestion.sugestaoVenda)}
                        </p>
                        <div className="mt-2 text-xs text-slate-500 space-y-1">
                            <p>R$/m² médio: {formatCurrency(suggestion.mediaM2Venda)}</p>
                            <p>Faixa: {formatCurrency(suggestion.minM2Venda)} - {formatCurrency(suggestion.maxM2Venda)}/m²</p>
                        </div>
                    </div>
                )}

                {/* Locação */}
                {showLocacao && suggestion.sugestaoLocacao && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={16} className="text-blue-400" />
                            <span className="text-slate-400 text-sm">Valor de Locação Sugerido</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">
                            {formatCurrency(suggestion.sugestaoLocacao)}
                        </p>
                        <div className="mt-2 text-xs text-slate-500">
                            <p>R$/m² médio: {formatCurrency(suggestion.mediaM2Locacao)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info size={12} />
                Esta é uma sugestão baseada em dados reais do mercado. O valor final pode variar conforme características específicas do imóvel.
            </p>
        </div>
    );
};

export default PriceSuggestion;
