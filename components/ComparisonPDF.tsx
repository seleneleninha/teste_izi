/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Link, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Registrar fonte customizada (opcional, usando Helvetica padrão por enquanto)
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#030712', // midnight-950
        padding: 30,
        fontFamily: 'Helvetica',
        color: '#FFFFFF',
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b', // midnight-800
        paddingBottom: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 60,
        objectFit: 'contain',
        marginRight: 15,
    },
    brokerInfo: {
        flexDirection: 'column',
    },
    brokerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    brokerContact: {
        fontSize: 10,
        color: '#94a3b8', // slate-400
        marginTop: 2,
    },
    docTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'right',
    },
    docDate: {
        fontSize: 10,
        color: '#64748b', // slate-500
        textAlign: 'right',
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    column: {
        flex: 1,
        flexDirection: 'column',
    },
    card: {
        borderWidth: 1,
        borderColor: '#1e293b', // midnight-800
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#0f172a', // midnight-900 / slate-900
    },
    cardImage: {
        width: '100%',
        height: 120,
        objectFit: 'cover',
    },
    cardContent: {
        padding: 10,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#34d399', // emerald-400 (lighter for dark mode)
        marginBottom: 4,
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        height: 30,
    },
    location: {
        fontSize: 9,
        color: '#cbd5e1', // slate-300
        marginBottom: 8,
    },
    specsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        paddingTop: 8,
        marginTop: 4,
    },
    specItem: {
        fontSize: 8,
        color: '#94a3b8', // slate-400
        alignItems: 'center',
    },
    featuresList: {
        marginTop: 8,
        marginBottom: 8,
        minHeight: 60,
    },
    featureItem: {
        fontSize: 8,
        color: '#94a3b8', // slate-400
        marginBottom: 2,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 5,
    },
    button: {
        flex: 1,
        backgroundColor: '#3b82f6',
        padding: 6,
        borderRadius: 4,
        textAlign: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonOutline: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ef4444',
        padding: 6,
        borderRadius: 4,
    },
    buttonOutlineText: {
        color: '#ef4444',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 8,
        color: '#64748b',
    },
});

interface ComparisonPDFProps {
    properties: any[];
    broker: {
        name: string;
        email: string;
        phone: string;
        creci: string;
        avatar?: string;
        logo?: string;
        slug?: string;
    } | null;
}

export const ComparisonPDF: React.FC<ComparisonPDFProps> = ({ properties, broker }) => {
    // Dividir propriedades em grupos de 3 para não quebrar layout
    const chunks = [];
    for (let i = 0; i < properties.length; i += 3) {
        chunks.push(properties.slice(i, i + 3));
    }

    return (
        <Document>
            {chunks.map((chunk, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            {broker?.logo ? (
                                <Image style={styles.logo} src={broker.logo} />
                            ) : broker?.avatar ? (
                                <Image style={[styles.logo, { borderRadius: 30 }]} src={broker.avatar} />
                            ) : null}
                            <View style={styles.brokerInfo}>
                                <Text style={styles.brokerName}>{broker?.name || 'Apresentação de Imóveis'}</Text>
                                <Text style={styles.brokerContact}>
                                    CRECI: {broker?.creci} • {broker?.phone}
                                </Text>
                                <Text style={styles.brokerContact}>{broker?.email}</Text>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.docTitle}>Comparativo de Imóveis</Text>
                            <Text style={styles.docDate}>
                                Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </Text>
                        </View>
                    </View>

                    {/* Content Grid */}
                    <View style={styles.grid}>
                        {chunk.map((prop: any) => (
                            <View key={prop.id} style={styles.column}>
                                <View style={styles.card}>
                                    <Image
                                        style={styles.cardImage}
                                        src={prop.fotos[0] || 'https://via.placeholder.com/400x300'}
                                    />
                                    <View style={styles.cardContent}>
                                        <Text style={styles.price}>
                                            {prop.valor_venda ? `Venda: R$ ${prop.valor_venda.toLocaleString('pt-BR')}` : ''}
                                            {prop.valor_venda && prop.valor_locacao ? '\n' : ''}
                                            {prop.valor_locacao ? `Locação: R$ ${prop.valor_locacao.toLocaleString('pt-BR')}` : ''}
                                        </Text>

                                        <Text style={styles.title}>{prop.titulo}</Text>
                                        <Text style={styles.location}>{prop.bairro}, {prop.cidade}</Text>

                                        <View style={styles.specsRow}>
                                            <Text style={styles.specItem}>{prop.area_priv} m²</Text>
                                            <Text style={styles.specItem}>{prop.quartos} Bed</Text>
                                            <Text style={styles.specItem}>{prop.banheiros} Bath</Text>
                                            <Text style={styles.specItem}>{prop.vagas} Car</Text>
                                        </View>

                                        <View style={styles.featuresList}>
                                            {prop.caracteristicas.slice(0, 5).map((feat: string, i: number) => (
                                                <Text key={i} style={styles.featureItem}>• {feat}</Text>
                                            ))}
                                        </View>

                                        <View style={styles.buttonsRow}>
                                            <Link
                                                style={styles.button}
                                                src={`https://izi-theta.vercel.app/${broker?.slug || ''}/imovel/${prop.slug}`}
                                            >
                                                <Text style={styles.buttonText}>VER NO SITE</Text>
                                            </Link>
                                            {prop.video && (
                                                <Link
                                                    style={styles.buttonOutline}
                                                    src={prop.video}
                                                >
                                                    <Text style={styles.buttonOutlineText}>VÍDEO</Text>
                                                </Link>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                        {/* Preencher colunas vazias se houver menos de 3 */}
                        {[...Array(3 - chunk.length)].map((_, i) => (
                            <View key={`empty-${i}`} style={styles.column} />
                        ))}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Apresentado por {broker?.name}</Text>
                        <Text style={styles.footerText}>Página {pageIndex + 1} de {chunks.length}</Text>
                    </View>
                </Page>
            ))}
        </Document>
    );
};
