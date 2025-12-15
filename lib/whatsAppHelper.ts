import { generatePropertySlug } from './propertyHelpers';

interface WhatsAppMessage {
    phone: string;
    text?: string;
    mediaUrl?: string;
    caption?: string;
}

interface Property {
    id: string;
    titulo: string;
    bairro: string;
    cidade: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    quartos: number;
    vagas: number;
    area_priv: number;
    fotos: string;
    operacao: string;
    tipo_imovel: string;
    cod_imovel: number;
}

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const INSTANCE_NAME = process.env.WHATSAPP_INSTANCE_NAME || 'iziBrokerz';
const API_KEY = process.env.EVOLUTION_API_KEY || '';

/**
 * Envia mensagem de texto via WhatsApp
 */
export async function sendWhatsAppMessage(
    phone: string,
    message: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': API_KEY
                },
                body: JSON.stringify({
                    number: formatPhoneNumber(phone),
                    text: message
                })
            }
        );

        if (!response.ok) {
            console.error('Failed to send WhatsApp message:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return false;
    }
}

/**
 * Envia imagem com legenda via WhatsApp
 */
export async function sendWhatsAppImage(
    phone: string,
    imageUrl: string,
    caption?: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': API_KEY
                },
                body: JSON.stringify({
                    number: formatPhoneNumber(phone),
                    mediaUrl: imageUrl,
                    caption: caption || ''
                })
            }
        );

        if (!response.ok) {
            console.error('Failed to send WhatsApp image:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending WhatsApp image:', error);
        return false;
    }
}

/**
 * Envia imóvel com foto via WhatsApp
 */
export async function sendPropertyWithImage(
    phone: string,
    property: Property
): Promise<boolean> {
    try {
        // Gera slug do imóvel
        const slug = generatePropertySlug({
            tipo_imovel: property.tipo_imovel,
            quartos: property.quartos,
            bairro: property.bairro,
            cidade: property.cidade,
            vagas: property.vagas,
            area_priv: property.area_priv,
            operacao: property.operacao,
            valor_venda: property.valor_venda,
            valor_locacao: property.valor_locacao,
            cod_imovel: property.cod_imovel,
            slug: ''
        });

        const propertyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://izibrokerz.com.br'}/${slug}`;

        // Primeira foto
        const photos = property.fotos ? JSON.parse(property.fotos) : [];
        const firstPhoto = photos.length > 0 ? photos[0] : '';

        const caption =
            `🏡 *${property.titulo}*\n\n` +
            `📍 ${property.bairro}, ${property.cidade}\n` +
            `💰 ${formatPrice(property.valor_venda || property.valor_locacao || 0)}\n` +
            `🛏️ ${property.quartos} quartos | 🚗 ${property.vagas} vagas | 📐 ${property.area_priv}m²\n\n` +
            `👉 Ver mais: ${propertyUrl}`;

        if (firstPhoto) {
            return await sendWhatsAppImage(phone, firstPhoto, caption);
        } else {
            return await sendWhatsAppMessage(phone, caption);
        }
    } catch (error) {
        console.error('Error sending property:', error);
        return false;
    }
}

/**
 * Envia múltiplos imóveis via WhatsApp
 */
export async function sendMultipleProperties(
    phone: string,
    properties: Property[]
): Promise<boolean> {
    try {
        if (properties.length === 0) {
            return await sendWhatsAppMessage(
                phone,
                'Desculpe, não encontrei imóveis que atendam aos seus critérios. 😔\n\nPodemos ajustar a busca?'
            );
        }

        // Envia mensagem inicial
        await sendWhatsAppMessage(
            phone,
            `Encontrei *${properties.length} ${properties.length === 1 ? 'imóvel' : 'imóveis'}* para você! 🏡`
        );

        // Aguarda 1 segundo
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Envia cada imóvel (limita a 5 para não sobrecarregar)
        const propertieToSend = properties.slice(0, 5);

        for (let i = 0; i < propertieToSend.length; i++) {
            await sendPropertyWithImage(phone, propertieToSend[i]);

            // Aguarda 2 segundos entre cada envio
            if (i < propertieToSend.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Se tiver mais de 5, avisa
        if (properties.length > 5) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sendWhatsAppMessage(
                phone,
                `Há mais ${properties.length - 5} opções disponíveis! 😊\n\nQuer refinar a busca ou ver mais?`
            );
        }

        return true;
    } catch (error) {
        console.error('Error sending multiple properties:', error);
        return false;
    }
}

/**
 * Formata número de telefone para formato internacional
 */
function formatPhoneNumber(phone: string): string {
    // Remove todos os não-dígitos
    let cleaned = phone.replace(/\D/g, '');

    // Se não começa com código do país, adiciona Brasil (55)
    if (!cleaned.startsWith('55')) {
        // Se tem 11 dígitos (DDD + número), adiciona 55
        if (cleaned.length === 11) {
            cleaned = '55' + cleaned;
        }
    }

    return cleaned;
}

/**
 * Formata preço
 */
function formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
    }).format(value);
}

/**
 * Verifica se a API do WhatsApp está configurada
 */
export function isWhatsAppConfigured(): boolean {
    return !!(EVOLUTION_API_URL && INSTANCE_NAME && API_KEY);
}

/**
 * Testa conexão com Evolution API
 */
export async function testWhatsAppConnection(): Promise<boolean> {
    try {
        const response = await fetch(
            `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
            {
                headers: {
                    'apikey': API_KEY
                }
            }
        );

        return response.ok;
    } catch (error) {
        console.error('WhatsApp connection test failed:', error);
        return false;
    }
}
