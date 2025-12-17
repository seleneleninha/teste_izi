import { supabase } from './supabaseClient';

/**
 * Helper functions for lead matching and property suggestions
 */

export interface PropertyMatch {
    id: string;
    titulo: string;
    valor: number;
    cidade: string;
    bairro: string;
    imagem?: string;
    match_score: number;
    operacao?: string;
    tipo_imovel?: string;
    operacao_nome?: string;
    tipo_imovel_nome?: string;
    valor_venda?: number;
    valor_locacao?: number;
    valor_diaria?: number;
    valor_mensal?: number;
}

/**
 * Find matching properties for a lead based on their interests
 */
export async function findMatchingProperties(leadId: string): Promise<PropertyMatch[]> {
    try {
        const { data, error } = await supabase
            .rpc('find_matching_properties', { lead_id: leadId });

        if (error) {
            console.error('Error finding matching properties:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in findMatchingProperties:', error);
        return [];
    }
}

/**
 * Get unique cities from approved properties
 */
export async function getCities(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('anuncios')
            .select('cidade')
            .eq('status', 'ativo')
            .not('cidade', 'is', null);

        if (error) throw error;

        const cities = [...new Set(data?.map(p => p.cidade) || [])];
        return cities.sort();
    } catch (error) {
        console.error('Error fetching cities:', error);
        return [];
    }
}

/**
 * Get unique neighborhoods for a specific city
 */
export async function getNeighborhoods(city: string): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('anuncios')
            .select('bairro')
            .eq('status', 'ativo')
            .eq('cidade', city)
            .not('bairro', 'is', null);

        if (error) throw error;

        const neighborhoods = [...new Set(data?.map(p => p.bairro) || [])];
        return neighborhoods.sort();
    } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        return [];
    }
}

/**
 * Get all property types
 */
export async function getPropertyTypes(): Promise<{ id: string; tipo: string }[]> {
    try {
        const { data, error } = await supabase
            .from('tipo_imovel')
            .select('id, tipo')
            .order('tipo');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching property types:', error);
        return [];
    }
}

/**
 * Get all operations
 */
export async function getOperations(): Promise<{ id: string; tipo: string }[]> {
    try {
        const { data, error } = await supabase
            .from('operacao')
            .select('id, tipo')
            .order('tipo');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching operations:', error);
        return [];
    }
}

/**
 * Get subtypes for a specific property type
 */
export async function getSubtypes(typeId: string): Promise<{ id: string; subtipo: string }[]> {
    try {
        const { data, error } = await supabase
            .from('subtipo_imovel')
            .select('id, subtipo')
            .eq('tipo_imovel', typeId)
            .order('subtipo');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching subtypes:', error);
        return [];
    }
}

/**
 * Calculate match score between a lead and a property
 * NEW SYSTEM: 20 points per field (100 total)
 * - Operation: 20 points
 * - Property Type: 20 points
 * - City: 20 points
 * - Neighborhood: 20 points (matches ANY of 3 neighborhoods)
 * - Budget: 20 points (ONLY if lead has budget filled AND property is within range)
 */
export function calculateMatchScore(
    lead: {
        operacao_interesse?: string;
        tipo_imovel_interesse?: string;
        cidade_interesse?: string;
        bairro_interesse?: string;
        bairro_interesse_2?: string;
        bairro_interesse_3?: string;
        orcamento_min?: number;
        orcamento_max?: number;
    },
    property: {
        operacao: string;
        tipo_imovel: string;
        subtipo_imovel?: string;
        cidade: string;
        bairro: string;
        valor_venda?: number;
        valor_locacao?: number;
    }
): number {
    let score = 0;

    // Field 1: Operation (20 points)
    if (lead.operacao_interesse === property.operacao) {
        score += 20;
    }

    // Field 2: Property type (20 points)
    if (lead.tipo_imovel_interesse === property.tipo_imovel) {
        score += 20;
    }

    // Field 3: City (20 points)
    if (lead.cidade_interesse === property.cidade) {
        score += 20;
    }

    // Field 4: Neighborhood (20 points) - Match if property is in ANY of the 3 neighborhoods
    const leadNeighborhoods = [
        lead.bairro_interesse,
        lead.bairro_interesse_2,
        lead.bairro_interesse_3
    ].filter(Boolean); // Remove empty values

    if (leadNeighborhoods.includes(property.bairro)) {
        score += 20;
    }

    // Field 5: Budget (20 points) - ONLY if lead has budget filled
    const propertyValue = property.valor_venda || property.valor_locacao || 0;
    const hasBudget = lead.orcamento_min && lead.orcamento_min > 0 && lead.orcamento_max && lead.orcamento_max > 0;

    if (hasBudget && propertyValue >= lead.orcamento_min && propertyValue <= lead.orcamento_max) {
        score += 20;
    }

    return score;
}

/**
 * Get property suggestions for a lead
 */
export async function getPropertySuggestions(leadId: string, limit: number = 5): Promise<PropertyMatch[]> {
    try {
        // First, get the lead details
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            console.error('Error fetching lead:', leadError);
            return [];
        }

        // Build query for matching properties with JOINs for names
        let query = supabase
            .from('anuncios')
            .select(`
                id,
                titulo,
                valor_venda,
                valor_locacao,
                valor_diaria,
                valor_mensal,
                cidade,
                bairro,
                operacao,
                tipo_imovel,
                imagem,
                operacao_rel:operacao(id, tipo),
                tipo_imovel_rel:tipo_imovel(id, tipo)
            `)
            .eq('status', 'ativo');

        // Add filters based on lead interests
        // For operation: if lead wants Venda or Locação, also include Venda/Locação
        if (lead.operacao_interesse) {
            // Get Venda/Locação operation ID
            const { data: vendaLocacaoOp } = await supabase
                .from('operacao')
                .select('id')
                .ilike('tipo', '%venda/loca%')
                .limit(1)
                .single();

            if (vendaLocacaoOp) {
                // Match either the exact operation OR Venda/Locação
                query = query.or(`operacao.eq.${lead.operacao_interesse},operacao.eq.${vendaLocacaoOp.id}`);
            } else {
                query = query.eq('operacao', lead.operacao_interesse);
            }
        }

        if (lead.tipo_imovel_interesse) {
            query = query.eq('tipo_imovel', lead.tipo_imovel_interesse);
        }

        if (lead.cidade_interesse) {
            query = query.eq('cidade', lead.cidade_interesse);
        }

        // Filter by ANY of the 3 neighborhoods
        const leadNeighborhoods = [
            lead.bairro_interesse,
            lead.bairro_interesse_2,
            lead.bairro_interesse_3
        ].filter(Boolean);

        if (leadNeighborhoods.length > 0) {
            query = query.in('bairro', leadNeighborhoods);
        }

        const { data: properties, error: propError } = await query.limit(20);

        if (propError || !properties) {
            console.error('Error fetching properties:', propError);
            return [];
        }

        // Calculate match scores and sort
        const matches: PropertyMatch[] = properties.map(prop => ({
            id: prop.id,
            titulo: prop.titulo,
            valor: prop.valor_venda || prop.valor_locacao || prop.valor_diaria || prop.valor_mensal || 0,
            cidade: prop.cidade,
            bairro: prop.bairro,
            imagem: prop.imagem,
            match_score: calculateMatchScore(lead, prop),
            operacao: prop.operacao,
            tipo_imovel: prop.tipo_imovel,
            operacao_nome: (prop as any).operacao_rel?.tipo || '',
            tipo_imovel_nome: (prop as any).tipo_imovel_rel?.tipo || '',
            valor_venda: prop.valor_venda,
            valor_locacao: prop.valor_locacao,
            valor_diaria: prop.valor_diaria,
            valor_mensal: prop.valor_mensal
        }));

        // Sort by match score and return top results
        return matches
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, limit);
    } catch (error) {
        console.error('Error in getPropertySuggestions:', error);
        return [];
    }
}
