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
            .eq('status_aprovacao', 'aprovado')
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
            .eq('status_aprovacao', 'aprovado')
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
 */
export function calculateMatchScore(
    lead: {
        operacao_interesse?: string;
        tipo_imovel_interesse?: string;
        cidade_interesse?: string;
        bairro_interesse?: string;
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

    // Field 4: Neighborhood (20 points)
    if (lead.bairro_interesse === property.bairro) {
        score += 20;
    }

    // Field 5: Price range (20 points)
    const propertyValue = property.valor_venda || property.valor_locacao || 0;
    if (
        lead.orcamento_min &&
        lead.orcamento_max &&
        propertyValue >= lead.orcamento_min &&
        propertyValue <= lead.orcamento_max
    ) {
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

        // Build query for matching properties
        let query = supabase
            .from('anuncios')
            .select(`
                id,
                titulo,
                valor_venda,
                valor_locacao,
                cidade,
                bairro,
                operacao,
                tipo_imovel
            `)
            .eq('status_aprovacao', 'aprovado');

        // Add filters based on lead interests
        if (lead.operacao_interesse) {
            query = query.eq('operacao', lead.operacao_interesse);
        }

        if (lead.tipo_imovel_interesse) {
            query = query.eq('tipo_imovel', lead.tipo_imovel_interesse);
        }

        if (lead.cidade_interesse) {
            query = query.eq('cidade', lead.cidade_interesse);
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
            valor: prop.valor_venda || prop.valor_locacao || 0,
            cidade: prop.cidade,
            bairro: prop.bairro,
            imagem: prop.imagem,
            match_score: calculateMatchScore(lead, prop)
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
