import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Star, Linkedin, Instagram, Bed, Bath, Square, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AgentProfile {
    id: string;
    nome: string;
    email: string;
    avatar: string;
    creci: string;
    whatsapp: string;
}

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
}

export const AgentProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [agent, setAgent] = useState<AgentProfile | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchAgentData();
        }
    }, [id]);

    const fetchAgentData = async () => {
        try {
            setLoading(true);

            // Fetch agent profile
            const { data: profileData, error: profileError } = await supabase
                .from('perfis')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;

            if (profileData) {
                setAgent({
                    id: profileData.id,
                    nome: profileData.nome || 'Corretor',
                    email: profileData.email || '',
                    avatar: profileData.avatar || `https://ui-avatars.com/api/?name=${profileData.nome}`,
                    creci: profileData.creci || 'N/A',
                    whatsapp: profileData.whatsapp || ''
                });

                // Fetch agent's properties
                const { data: propsData, error: propsError } = await supabase
                    .from('anuncios')
                    .select('*')
                    .eq('user_id', id)
                    .limit(6);

                if (propsError) throw propsError;

                if (propsData) {
                    const mapped: Property[] = propsData.map(p => ({
                        id: p.id,
                        title: p.titulo,
                        price: p.valor_venda || p.valor_locacao || 0,
                        location: `${p.bairro}, ${p.cidade}`,
                        beds: p.quartos || 0,
                        baths: p.banheiros || 0,
                        area: p.area_priv || 0,
                        image: p.fotos ? p.fotos.split(',')[0] : 'https://picsum.photos/seed/prop1/400/300',
                        type: p.tipo_imovel || 'Imóvel'
                    }));
                    setProperties(mapped);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados do corretor:', error);
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

    if (!agent) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Corretor não encontrado.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600"
                >
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            {/* Header Card */}
            <div className="bg-slate-800 rounded-full shadow-xl border border-slate-700 overflow-hidden mb-12">
                <div className="h-48 bg-gradient-to-r from-slate-800 to-primary-900 relative">
                    <div className="absolute top-4 right-4 flex space-x-2">
                        <button className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-sm transition-colors">
                            <Linkedin size={20} />
                        </button>
                        <button className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-sm transition-colors">
                            <Instagram size={20} />
                        </button>
                    </div>
                </div>
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row items-end md:items-center -mt-16 mb-6 gap-6">
                        <img
                            src={agent.avatar}
                            alt={agent.nome}
                            className="w-32 h-32 rounded-full border-4 border-white border-slate-800 shadow-lg object-cover bg-white"
                        />
                        <div className="flex-1 mb-2">
                            <h1 className="text-3xl font-bold text-white">{agent.nome}</h1>
                            <p className="text-sm text-slate-400 mt-1">CRECI: {agent.creci}</p>
                        </div>
                        <div className="flex gap-3 mb-2 w-full md:w-auto">
                            {agent.whatsapp && (
                                <a
                                    href={`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 md:flex-none px-6 py-3 bg-slate-900 bg-slate-700 text-white rounded-full font-medium hover:bg-slate-800 transition-colors flex items-center justify-center"
                                >
                                    <Phone size={18} className="mr-2" /> Falar no WhatsApp
                                </a>
                            )}
                            <a
                                href={`mailto:${agent.email}`}
                                className="flex-1 md:flex-none px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30"
                            >
                                Enviar Email
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-700 pt-8">
                        <div className="col-span-2">
                            <h3 className="text-xl font-bold text-white mb-4">Sobre</h3>
                            <div className="bg-slate-900/50 p-6 rounded-full border border-slate-700">
                                <p className="text-slate-300 leading-relaxed">
                                    Corretor de imóveis profissional dedicado a encontrar as melhores oportunidades para meus Clientes.
                                    Com experiência no mercado imobiliário, ofereço um atendimento personalizado e transparente.
                                </p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Estatísticas</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-900 rounded-full border border-slate-700">
                                    <span className="text-slate-400">Imóveis Ativos</span>
                                    <span className="font-bold text-xl text-white">{properties.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-900 rounded-full border border-slate-700">
                                    <span className="text-slate-400">Avaliação</span>
                                    <div className="flex items-center font-bold text-xl text-white">
                                        5.0 <Star size={16} className="text-yellow-500 ml-1 fill-current" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Listings */}
            <h2 className="text-2xl font-bold text-white mb-6">Imóveis Disponíveis</h2>
            {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {properties.map(prop => (
                        <div
                            key={prop.id}
                            className="bg-slate-800 rounded-full overflow-hidden shadow-sm border border-slate-700 group cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                            onClick={() => navigate(`/properties/${prop.id}`)}
                        >
                            <div className="h-56 overflow-hidden relative">
                                <img
                                    src={prop.image}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt={prop.title}
                                />
                                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {prop.type}
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-lg text-white mb-1 truncate">{prop.title}</h3>
                                <div className="flex items-center text-slate-400 text-sm mb-4">
                                    <MapPin size={14} className="mr-1" />
                                    {prop.location}
                                </div>
                                <p className="text-xl font-bold text-primary-500 mb-4">R$ {prop.price.toLocaleString('pt-BR')}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-700 text-sm text-slate-400">
                                    <span className="flex items-center"><Bed size={16} className="mr-1" /> {prop.beds}</span>
                                    <span className="flex items-center"><Bath size={16} className="mr-1" /> {prop.baths}</span>
                                    <span className="flex items-center"><Square size={16} className="mr-1" /> {prop.area}m²</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-800 rounded-full border border-dashed border-slate-700">
                    <p className="text-gray-500">Nenhum imóvel disponível no momento.</p>
                </div>
            )}
        </div>
    );
};