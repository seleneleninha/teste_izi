import { supabase } from './supabaseClient';
import { Property } from '../types'; // Verify this path or create a local interface if simpler
import { formatCurrency } from './formatters';

interface WhatsAppLinkParams {
    phone: string;
    message: string;
}

export const generateWhatsAppLink = ({ phone, message }: WhatsAppLinkParams): string => {
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-numeric characters
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
};

interface PropertyMessageParams {
    property: Property;
    brokerName?: string;
    template: 'interest' | 'visit' | 'proposal' | 'share' | 'availability';
}

export const formatPropertyMessage = ({
    property,
    brokerName,
    template
}: PropertyMessageParams): string => {
    // Get current URL or construct it if not in browser context
    const propertyLink = typeof window !== 'undefined'
        ? window.location.origin + '/' + generateSlug(property)
        : `https://izibrokerz.com/${generateSlug(property)}`;

    const baseData = {
        TYPE: property.tipo_imovel || 'Imóvel',
        NEIGHBORHOOD: property.bairro || '',
        CITY: property.cidade || '',
        PRICE: formatCurrency(property.valor_venda || property.valor_locacao || 0),
        CODE: property.cod_imovel || property.id.substring(0, 8),
        LINK: propertyLink
    };

    switch (template) {
        case 'interest':
            return `Olá${brokerName ? ' ' + brokerName : ''}! Vi o imóvel no site da iziBrokerz e gostaria de mais informações.

🏠 ${baseData.LINK}

📍 ${baseData.NEIGHBORHOOD}, ${baseData.CITY}
💰 Valor: ${baseData.PRICE}

Código: ${baseData.CODE}

Aguardo seu retorno!`;

        case 'visit':
            return `Olá${brokerName ? ' ' + brokerName : ''}! Gostaria de agendar uma visita ao imóvel:

🏠 ${baseData.TYPE} - ${baseData.NEIGHBORHOOD}
💰 Valor: ${baseData.PRICE}
📍 Código: ${baseData.CODE}
🔗 Link: ${baseData.LINK}

Quando podemos agendar?`;

        case 'proposal':
            return `Olá${brokerName ? ' ' + brokerName : ''}! Tenho interesse em fazer uma proposta para o imóvel:

🏠 ${baseData.TYPE} - ${baseData.NEIGHBORHOOD}
💰 Valor anunciado: ${baseData.PRICE}
📍 Código: ${baseData.CODE}
🔗 Link: ${baseData.LINK}

Podemos conversar sobre valores?`;

        case 'share':
            return `Olha que imóvel incrível que encontrei! 🏡

🏠 ${baseData.TYPE} - ${baseData.NEIGHBORHOOD}, ${baseData.CITY}
💰 ${baseData.PRICE}

Ver mais: ${baseData.LINK}`;

        case 'availability':
            return `Olá${brokerName ? ' ' + brokerName : ''}! Sou parceiro iziBrokerz e gostaria de checar a disponibilidade do imóvel para um cliente:

🏠 ${baseData.TYPE} - ${baseData.NEIGHBORHOOD}
💰 ${baseData.PRICE}
📍 Código: ${baseData.CODE}
🔗 Link: ${baseData.LINK}

Está disponível para visita?`;

        default:
            return `Olá! Tenho interesse no imóvel código ${baseData.CODE}.`;
    }
};

// Helper to generate slug (duplicated from other components, ideally should be a shared util)
const generateSlug = (p: Property) => {
    const type = (p.tipo_imovel || 'imovel').toLowerCase().replace(/\s+/g, '-');
    const quartos = p.quartos || 0;
    const bairro = (p.bairro || '').toLowerCase().replace(/\s+/g, '-');
    const cidade = (p.cidade || '').toLowerCase().replace(/\s+/g, '-');
    const area = p.area_priv || 0;
    const operation = (p.operacao || '').toLowerCase().replace('_', '-').replace('/', '-');
    const valor = p.valor_venda || p.valor_locacao || p.valor_diaria || p.valor_mensal || 0;
    const garagem = (p.vagas || 0) > 0 ? '-com-garagem' : '';
    const codigo = p.cod_imovel || p.id;

    return `${type}-${quartos}-quartos-${bairro}-${cidade}${garagem}-${area}m2-${operation}-RS${valor}-cod${codigo}`;
};

export const trackWhatsAppClick = async (
    corretorId: string,
    imovelId: string,
    tipoAcao: string
) => {
    try {
        await supabase.from('whatsapp_clicks').insert({
            corretor_id: corretorId,
            imovel_id: imovelId,
            tipo_acao: tipoAcao
        });
    } catch (error) {
        console.error('Error tracking WhatsApp click:', error);
        // Fail silently to not disrupt user experience
    }
};
