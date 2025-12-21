import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Plus, Search, Filter, MoreVertical,
    Phone, Mail, Calendar, DollarSign, Clock,
    ChevronLeft, ChevronRight, User, MapPin, Home,
    ArrowRight, AlertCircle, CheckCircle2, XCircle,
    Eye, FileText, CheckCircle, Target, TrendingUp, Users, MessageSquare, Loader2, X, Pencil,
    MessageCircle, Archive
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import { SalesFunnel } from '../components/SalesFunnel';
import { QuickStats } from '../components/QuickStats';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    DragOverEvent,
    useDroppable,
} from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    getOperations,
    getPropertyTypes,
    getSubtypes,
    getCities,
    getNeighborhoods,
    findMatchingProperties,
    PropertyMatch
} from '../lib/leadMatchingHelper';
import { PropertyDetailsModal } from '../components/PropertyDetailsModal';

interface Lead {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    status: 'Novo' | 'Em Contato' | 'Negociação' | 'Fechado' | 'Perdido' | 'Inativo';
    interesse: string;
    data_criacao: string;
    avatar?: string;
    origem?: string;
    ultima_interacao?: string;
    // New structured fields for matching
    operacao_interesse?: string; // UUID
    tipo_imovel_interesse?: string; // UUID
    cidade_interesse?: string;
    bairro_interesse?: string;
    bairro_interesse_2?: string;
    bairro_interesse_3?: string;
    orcamento_min?: number;
    orcamento_max?: number;
    motivo_perda?: string;
    data_perda?: string;
}

// Draggable LeadCard Component
const LeadCard: React.FC<{ lead: Lead; isDragging?: boolean; matchCount?: number; onMatch?: (lead: Lead) => void; onEdit?: (lead: Lead) => void; onArchive?: (lead: Lead) => void; onStatusChange?: (leadId: string, newStatus: string) => void; locked?: boolean }> = ({ lead, isDragging = false, matchCount = 0, onMatch, onEdit, onArchive, onStatusChange, locked = false }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: lead.id });

    const [showStatusMenu, setShowStatusMenu] = React.useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1,
    };

    const statusOptions = [
        { value: 'Novo', label: 'Novo', color: 'text-blue-600' },
        { value: 'Em Contato', label: 'Em Contato', color: 'text-yellow-600' },
        { value: 'Negociação', label: 'Negociação', color: 'text-purple-600' },
        { value: 'Fechado', label: 'Fechado', color: 'text-green-600' },
        { value: 'Perdido', label: 'Perdido', color: 'text-red-600' },
    ];

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group ${isDragging ? 'shadow-2xl ring-2 ring-primary-500 scale-105' : ''
                } ${locked ? 'opacity-75' : ''}`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div>
                        <h4 className="font-bold text-sm text-white">
                            {locked ? 'Lead Bloqueado' : lead.nome}
                        </h4>
                        <p className="text-xs text-slate-400">
                            {locked ? '•••••••••••' : lead.telefone}
                        </p>
                    </div>
                </div>
                {!locked && (
                    <div className="flex space-x-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onEdit) onEdit(lead);
                            }}
                            className="p-1.5 hover:bg-orange-100 hover:bg-orange-900/30 rounded text-orange-600"
                            title="Editar Lead"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`, '_blank');
                            }}
                            className="p-1.5 hover:bg-green-100 hover:bg-green-900/30 rounded text-green-600"
                            title="WhatsApp"
                        >
                            <MessageCircle size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMatch) onMatch(lead);
                            }}
                            className="p-1.5 hover:bg-purple-100 hover:bg-purple-900/30 rounded text-purple-600 relative"
                            title="Ver Imóveis Compatíveis"
                        >
                            <Target size={14} />
                            {matchCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white border-slate-800"></span>
                            )}
                        </button>
                        {lead.status !== 'Inativo' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onArchive) onArchive(lead);
                                }}
                                className="p-1.5 hover:bg-slate-700/30 rounded text-slate-400"
                                title="Arquivar Lead"
                            >
                                <Archive size={14} />
                            </button>
                        )}
                    </div>
                )}
                {locked && (
                    <div className="text-gray-400">
                        <Archive size={14} /> {/* Placeholder icon */}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center text-xs text-slate-400 bg-slate-700/50 p-2 rounded">
                    <span className="font-medium mr-1"></span> {lead.interesse}
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                    {locked ? (
                        <span className="text-primary-500 font-bold bg-primary-50 bg-primary-900/20 px-2 py-1 rounded">
                            Faça upgrade para ver
                        </span>
                    ) : (
                        <>
                            <span className="flex items-center font-bold text-sm">
                                de {lead.orcamento_min?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumSignificantDigits: 3 })} até {lead.orcamento_max?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumSignificantDigits: 3 })}
                            </span>
                            <span className="flex items-center">
                                <Calendar size={12} className="mr-1" />
                                {new Date(lead.data_criacao).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                            </span>
                        </>
                    )}
                </div>

                {/* Mobile-Friendly Status Change */}
                <div className="md:hidden pt-2 border-t border-slate-700">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowStatusMenu(!showStatusMenu);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-3xl flex items-center justify-between transition-colors"
                        >
                            <span>Mover para: {lead.status}</span>
                            <ChevronRight size={14} className={`transition-transform ${showStatusMenu ? 'rotate-90' : ''}`} />
                        </button>
                        {showStatusMenu && (
                            <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-3xl shadow-lg">
                                {statusOptions.filter(opt => opt.value !== lead.status).map(option => (
                                    <button
                                        key={option.value}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onStatusChange) {
                                                onStatusChange(lead.id, option.value);
                                            }
                                            setShowStatusMenu(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg ${option.color}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Droppable Column Component
const DroppableColumn: React.FC<{
    id: string;
    label: string;
    color: string;
    darkColor: string;
    leads: Lead[];
    children: React.ReactNode;
    icon?: React.ElementType;
    description?: string;
}> = ({ id, label, color, darkColor, leads, children, icon: Icon, description }) => {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div ref={setNodeRef} className="bg-slate-800 rounded-3xl border border-slate-700 shadow-sm transition-all hover:shadow-md">
            {/* Column Header acting as Stage Card Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-midnight-950/50 rounded-t-3xl">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-3xl shadow-sm bg-slate-700`}>
                        {Icon && <Icon size={20} className={color.replace('bg-', 'text-')} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base">{label}</h3>
                        {description && <p className="text-xs text-slate-400">{description}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold text-white block">{leads.length}</span>
                </div>
            </div>

            {/* Leads List */}
            <div className="p-4 min-h-[100px] space-y-3 bg-slate-900/20">
                {children}
                {leads.length === 0 && (
                    <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center">
                        <p className="text-sm text-gray-400">Arraste leads para cá</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Leads: React.FC = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Property Details Modal State
    const [viewingPropertyId, setViewingPropertyId] = useState<string | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [newLead, setNewLead] = useState({
        nome: '',
        email: '',
        telefone: '',
        interesse: '',
        // New fields
        operacao_interesse: '',
        tipo_imovel_interesse: '',
        cidade_interesse: '',
        bairro_interesse: '',
        bairro_interesse_2: '',
        bairro_interesse_3: '',
        orcamento_min: '',
        orcamento_max: ''
    });

    // Custom inputs state
    const [customCity, setCustomCity] = useState('');
    const [customNeighborhood, setCustomNeighborhood] = useState('');
    const [isCustomCity, setIsCustomCity] = useState(false);
    const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(false);

    // Dropdown options state
    const [operations, setOperations] = useState<{ id: string; tipo: string }[]>([]);
    const [propertyTypes, setPropertyTypes] = useState<{ id: string; tipo: string }[]>([]);
    const [subtypes, setSubtypes] = useState<{ id: string; subtipo: string }[]>([]); // Keep for now to avoid breaking if used elsewhere, but we won't use it for leads
    const [cities, setCities] = useState<string[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Match counts for each lead
    const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const columns = [
        { status: 'Novo', label: 'Novos', color: 'bg-blue-500', darkColor: 'bg-blue-600', icon: Eye, description: 'Leads recém-capturados' },
        { status: 'Em Contato', label: 'Em Contato', color: 'bg-yellow-500', darkColor: 'bg-yellow-600', icon: Search, description: 'Primeiro contato realizado' },
        { status: 'Negociação', label: 'Negociação', color: 'bg-purple-500', darkColor: 'bg-purple-600', icon: FileText, description: 'Negociando proposta' },
        { status: 'Fechado', label: 'Fechados', color: 'bg-green-500', darkColor: 'bg-green-600', icon: CheckCircle, description: 'Negócio concluído' },
        { status: 'Perdido', label: 'Perdidos', color: 'bg-red-500', darkColor: 'bg-red-600', icon: XCircle, description: 'Leads perdidos' },
    ];

    useEffect(() => {
        fetchLeads();
        fetchOptions();
    }, []);

    // Fetch match counts when leads change
    useEffect(() => {
        if (leads.length > 0) {
            fetchMatchCounts();
        }
    }, [leads.length]);

    useEffect(() => {
        // Subtypes are no longer directly linked to lead creation/editing
        // if (newLead.tipo_imovel_interesse) {
        //     fetchSubtypes(newLead.tipo_imovel_interesse);
        // } else {
        //     setSubtypes([]);
        // }
    }, [newLead.tipo_imovel_interesse]);

    useEffect(() => {
        if (newLead.cidade_interesse && newLead.cidade_interesse !== 'outro') {
            fetchNeighborhoods(newLead.cidade_interesse);
            setIsCustomCity(false);
        } else if (newLead.cidade_interesse === 'outro') {
            setIsCustomCity(true);
            setNeighborhoods([]);
            setNewLead(prev => ({ ...prev, bairro_interesse: '' })); // Clear neighborhood when custom city is selected
        } else {
            setIsCustomCity(false);
            setNeighborhoods([]);
            setNewLead(prev => ({ ...prev, bairro_interesse: '' })); // Clear neighborhood when no city is selected
        }
    }, [newLead.cidade_interesse]);

    useEffect(() => {
        if (newLead.bairro_interesse === 'outro') {
            setIsCustomNeighborhood(true);
        } else {
            setIsCustomNeighborhood(false);
        }
    }, [newLead.bairro_interesse]);

    const fetchOptions = async () => {
        setLoadingOptions(true);
        try {
            const [ops, types, cits] = await Promise.all([
                getOperations(),
                getPropertyTypes(),
                getCities()
            ]);
            setOperations(ops);
            setPropertyTypes(types);
            setCities(cits);
        } catch (error) {
            console.error('Error fetching options:', error);
        } finally {
            setLoadingOptions(false);
        }
    };

    // Subtypes are no longer directly linked to lead creation/editing
    // const fetchSubtypes = async (typeId: string) => {
    //     const subs = await getSubtypes(typeId);
    //     setSubtypes(subs);
    // };

    const fetchNeighborhoods = async (city: string) => {
        const hoods = await getNeighborhoods(city);
        setNeighborhoods(hoods);
    };

    const fetchMatchCounts = async () => {
        try {
            const counts: Record<string, number> = {};
            // Fetch match counts for all leads in parallel
            await Promise.all(
                leads.map(async (lead) => {
                    try {
                        const matches = await findMatchingProperties(lead.id);
                        counts[lead.id] = matches.length;
                    } catch (error) {
                        console.error(`Error fetching matches for lead ${lead.id}:`, error);
                        counts[lead.id] = 0;
                    }
                })
            );
            setMatchCounts(counts);
        } catch (error) {
            console.error('Error fetching match counts:', error);
        }
    };

    // Trial Logic State
    const [isTrialLimited, setIsTrialLimited] = useState(false);
    const [trialMaxLeads, setTrialMaxLeads] = useState(1);

    const fetchLeads = async () => {
        if (!user) return;

        try {
            // Check Trial Status
            const { data: profile } = await supabase
                .from('perfis')
                .select('is_trial, trial_fim')
                .eq('id', user.id)
                .single();

            if (profile?.is_trial) {
                // Fetch dynamic limit
                const { data: configData } = await supabase
                    .from('admin_config')
                    .select('value')
                    .eq('key', 'trial_max_leads')
                    .single();

                if (configData) {
                    setTrialMaxLeads(parseInt(configData.value));
                }

                setIsTrialLimited(true);
            } else {
                setIsTrialLimited(false);
            }

            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('user_id', user.id)
                .order('data_criacao', { ascending: false });

            if (error) throw error;
            if (data) setLeads(data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Construct a summary string for the legacy 'interesse' field
            const operationName = operations.find(op => op.id === newLead.operacao_interesse)?.tipo || '';
            const typeName = propertyTypes.find(t => t.id === newLead.tipo_imovel_interesse)?.tipo || '';

            const finalCity = isCustomCity ? customCity : newLead.cidade_interesse;
            const finalNeighborhood = isCustomNeighborhood ? customNeighborhood : newLead.bairro_interesse;

            const interestSummary = `${typeName} ${operationName ? `para ${operationName}` : ''} ${finalCity ? `em ${finalCity}` : ''}`;

            const leadData = {
                nome: newLead.nome,
                email: newLead.email,
                telefone: newLead.telefone,
                // Legacy fields
                interesse: interestSummary || newLead.interesse,
                // New structured fields
                operacao_interesse: newLead.operacao_interesse || null,
                tipo_imovel_interesse: newLead.tipo_imovel_interesse || null,
                cidade_interesse: finalCity || null,
                bairro_interesse: finalNeighborhood || null,
                bairro_interesse_2: newLead.bairro_interesse_2 || null,
                bairro_interesse_3: newLead.bairro_interesse_3 || null,
                orcamento_min: parseFloat(newLead.orcamento_min) || 0,
                orcamento_max: parseFloat(newLead.orcamento_max) || 0,
            };

            let error;

            if (editingLeadId) {
                // Update existing lead
                const { error: updateError } = await supabase
                    .from('leads')
                    .update(leadData)
                    .eq('id', editingLeadId);
                error = updateError;
            } else {
                // Create new lead
                const { error: insertError } = await supabase
                    .from('leads')
                    .insert({
                        ...leadData,
                        status: 'Novo',
                        user_id: user?.id
                    });
                error = insertError;
            }

            if (error) throw error;

            // If creating a new lead, immediately search for matches
            if (!editingLeadId) {
                const { data: newLeadData } = await supabase
                    .from('leads')
                    .select('id')
                    .eq('user_id', user?.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (newLeadData) {
                    // Fetch matches for the new lead
                    const matches = await findMatchingProperties(newLeadData.id);

                    if (matches.length > 0) {
                        // Show matches in modal
                        setSelectedLeadForMatch({ ...leadData, id: newLeadData.id, status: 'Novo', data_criacao: new Date().toISOString() } as Lead);
                        setMatchingProperties(matches);
                        setMatchModalOpen(true);
                        addToast(`Lead criado! Encontramos ${matches.length} imóve${matches.length > 1 ? 'is' : 'l'} compatível${matches.length > 1 ? 'is' : ''}!`, 'success');
                    } else {
                        addToast('Lead criado com sucesso! Nenhum imóvel compatível encontrado no momento.', 'success');
                    }
                }
            } else {
                addToast('Lead atualizado com sucesso!', 'success');
            }

            setIsModalOpen(false);
            setEditingLeadId(null);
            setNewLead({
                nome: '', email: '', telefone: '', interesse: '',
                operacao_interesse: '', tipo_imovel_interesse: '',
                cidade_interesse: '', bairro_interesse: '',
                bairro_interesse_2: '', bairro_interesse_3: '',
                orcamento_min: '', orcamento_max: ''
            });
            setCustomCity('');
            setCustomNeighborhood('');
            setIsCustomCity(false);
            setIsCustomNeighborhood(false);

            // Don't close modal if showing matches
            if (editingLeadId || matchingProperties.length === 0) {
                setIsModalOpen(false);
            } else {
                setIsModalOpen(false);
            }

            setEditingLeadId(null);
            setEditingLeadId(null);
            await fetchLeads();
            await fetchMatchCounts(); // Recalculate matches immediately
        } catch (error) {
            console.error('Error saving lead:', error);
            addToast('Erro ao salvar lead.', 'error');
        }
    };

    const handleEditLead = (lead: Lead) => {
        setEditingLeadId(lead.id);
        setNewLead({
            nome: lead.nome,
            email: lead.email,
            telefone: lead.telefone,
            interesse: lead.interesse,
            operacao_interesse: lead.operacao_interesse || '',
            tipo_imovel_interesse: lead.tipo_imovel_interesse || '',
            cidade_interesse: lead.cidade_interesse || '',
            bairro_interesse: lead.bairro_interesse || '',
            bairro_interesse_2: lead.bairro_interesse_2 || '',
            bairro_interesse_3: lead.bairro_interesse_3 || '',
            orcamento_min: lead.orcamento_min?.toString() || '',
            orcamento_max: lead.orcamento_max?.toString() || ''
        });

        // Handle custom city/neighborhood logic if needed
        // For simplicity, we assume if it's not in the list, it's custom, but the lists are fetched async.
        // A robust implementation would check against the lists after they load.
        // For now, we just set the values.

        setIsModalOpen(true);
    };

    const updateLeadStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', id);
            if (error) throw error;

            // Update local state immediately for better UX
            setLeads(prevLeads =>
                prevLeads.map(lead =>
                    lead.id === id ? { ...lead, status: newStatus as any } : lead
                )
            );

            addToast('Lead movido com sucesso!', 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            addToast('Erro ao mover lead.', 'error');
            // Revert on error
            fetchLeads();
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeLeadId = active.id as string;
        const overId = over.id as string;

        // Find the lead being dragged
        const activeLead = leads.find(l => l.id === activeLeadId);
        if (!activeLead) {
            setActiveId(null);
            return;
        }

        let newStatus = activeLead.status;

        // Check if dropped on a column
        const isColumn = columns.some(col => col.status === overId);

        if (isColumn) {
            newStatus = overId as any;
        } else {
            // Dropped on another lead?
            const targetLead = leads.find(l => l.id === overId);
            if (targetLead) {
                newStatus = targetLead.status;
            }
        }

        if (newStatus !== activeLead.status) {
            updateLeadStatus(activeLeadId, newStatus);
        }

        setActiveId(null);
    };

    const getLeadsByStatus = (status: string) => {
        let filtered = leads.filter(l => l.status === status);
        if (searchTerm) {
            filtered = filtered.filter(l =>
                l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.telefone.includes(searchTerm) ||
                l.interesse.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    };

    // Calculate funnel metrics
    const funnelMetrics = {
        totalLeads: leads.filter(l => l.status !== 'Inativo').length, // Exclude inactive from total
        byStage: {
            novo: leads.filter(l => l.status === 'Novo').length,
            emContato: leads.filter(l => l.status === 'Em Contato').length,
            negociacao: leads.filter(l => l.status === 'Negociação').length,
            fechado: leads.filter(l => l.status === 'Fechado').length,
            perdido: leads.filter(l => l.status === 'Perdido').length,
            inativo: leads.filter(l => l.status === 'Inativo').length,
        },
        totalValue: leads.filter(l => l.status !== 'Inativo').reduce((sum, l) => sum + (l.orcamento_max || l.orcamento_min || 0), 0),
        conversionRate: leads.filter(l => l.status !== 'Inativo').length > 0 ? (leads.filter(l => l.status === 'Fechado').length / leads.filter(l => l.status !== 'Inativo').length) * 100 : 0,
    };

    // Calculate leads created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leadsToday = leads.filter(l => {
        const leadDate = new Date(l.data_criacao);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate.getTime() === today.getTime();
    }).length;

    const activeLead = leads.find(l => l.id === activeId);

    // Match Modal State
    const [matchModalOpen, setMatchModalOpen] = useState(false);
    const [selectedLeadForMatch, setSelectedLeadForMatch] = useState<Lead | null>(null);
    const [matchingProperties, setMatchingProperties] = useState<PropertyMatch[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(false);

    const handleMatchClick = (lead: Lead) => {
        setSelectedLeadForMatch(lead);
        setMatchModalOpen(true);
        fetchMatches(lead.id);
    };

    useEffect(() => {
        // The custom event listener is no longer needed as we're using onMatch prop directly
        // const handleOpenMatchModal = (e: any) => {
        //     const lead = e.detail;
        //     setSelectedLeadForMatch(lead);
        //     setMatchModalOpen(true);
        //     fetchMatches(lead.id);
        // };

        // window.addEventListener('openMatchModal', handleOpenMatchModal);
        // return () => window.removeEventListener('openMatchModal', handleOpenMatchModal);
    }, []);

    const fetchMatches = async (leadId: string) => {
        setLoadingMatches(true);
        try {
            const matches = await findMatchingProperties(leadId);
            setMatchingProperties(matches);
        } catch (error) {
            console.error('Error fetching matches:', error);
            addToast('Erro ao buscar imóveis compatíveis.', 'error');
        } finally {
            setLoadingMatches(false);
        }
    };

    return (
        <div className="flex flex-col">
            {/* Controls */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gestão de Leads</h2>
                </div>
                <div className="flex space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none w-48 text-white"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingLeadId(null);
                            setNewLead({
                                nome: '', email: '', telefone: '', interesse: '',
                                operacao_interesse: '', tipo_imovel_interesse: '',
                                cidade_interesse: '', bairro_interesse: '', orcamento_min: '', orcamento_max: ''
                            });
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-medium transition-colors flex items-center">
                        <Plus size={16} className="mr-2" /> Novo Lead
                    </button>
                </div>
            </div>

            {/* Kanban Board with Drag and Drop */}
            {loading ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left Column: Funnel */}
                        <div className="lg:sticky lg:top-4">
                            <SalesFunnel metrics={funnelMetrics} />
                        </div>

                        {/* Right Column: Vertical Kanban */}
                        <div className="flex flex-col gap-4">
                            {columns.map((column) => (
                                <DroppableColumn
                                    key={column.status}
                                    id={column.status}
                                    label={column.label}
                                    color={column.color}
                                    darkColor={column.darkColor}
                                    leads={getLeadsByStatus(column.status)}
                                    icon={column.icon}
                                    description={column.description}
                                >
                                    <SortableContext
                                        items={getLeadsByStatus(column.status).map(l => l.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {getLeadsByStatus(column.status)
                                            .map((lead, index) => (
                                                <LeadCard
                                                    key={lead.id}
                                                    lead={lead}
                                                    matchCount={matchCounts[lead.id] || 0}
                                                    onMatch={() => handleMatchClick(lead)}
                                                    onEdit={() => handleEditLead(lead)}
                                                    onArchive={() => updateLeadStatus(lead.id, 'Inativo')}
                                                    onStatusChange={updateLeadStatus}
                                                    locked={isTrialLimited && index >= trialMaxLeads}
                                                />
                                            ))}
                                    </SortableContext>
                                </DroppableColumn>
                            ))}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeId && activeLead ? (
                            <div className="opacity-80 rotate-3 scale-105 cursor-grabbing">
                                <LeadCard lead={activeLead} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* New Lead Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 m-4">
                    <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">{editingLeadId ? 'Editar Lead' : 'Novo Lead'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateLead} className="space-y-4">
                            <div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Nome <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" required value={newLead.nome} onChange={e => setNewLead({ ...newLead, nome: e.target.value })} className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none mb-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Telefone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                        value={newLead.telefone}
                                        onChange={e => {
                                            // Remove tudo que não é número
                                            let value = e.target.value.replace(/\D/g, '');
                                            // Limita a 11 dígitos
                                            value = value.slice(0, 11);
                                            // Aplica a máscara (00) 00000-0000
                                            if (value.length > 0) {
                                                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                                                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                                            }
                                            setNewLead({ ...newLead, telefone: value });
                                        }}
                                        className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                            </div>

                            <div className="border-t border-slate-700 pt-4 mt-4">
                                <h4 className="text-sm font-bold text-white mb-3">Interesse do Cliente</h4>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Operação <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={newLead.operacao_interesse}
                                            onChange={e => setNewLead({ ...newLead, operacao_interesse: e.target.value })}
                                            className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        >
                                            <option value="">Selecione...</option>
                                            {operations
                                                .filter(op => !op.tipo.toLowerCase().includes('venda/locação') && !op.tipo.toLowerCase().includes('venda/locacao'))
                                                .map(op => (
                                                    <option key={op.id} value={op.id}>{op.tipo}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Tipo de Imóvel <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={newLead.tipo_imovel_interesse}
                                            onChange={e => setNewLead({ ...newLead, tipo_imovel_interesse: e.target.value })}
                                            className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        >
                                            <option value="">Selecione...</option>
                                            {propertyTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.tipo}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Subtipo field removed */}
                                {/* <div className="mb-3">
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Subtipo</label>
                                    <select
                                        disabled={!newLead.tipo_imovel_interesse || subtypes.length === 0}
                                        className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:opacity-50"
                                    >
                                        <option value="">Selecione...</option>
                                        {subtypes.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.subtipo}</option>
                                        ))}
                                    </select>
                                </div> */}

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Cidade <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={newLead.cidade_interesse}
                                            onChange={e => setNewLead({ ...newLead, cidade_interesse: e.target.value, bairro_interesse: '' })}
                                            className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        >
                                            <option value="">Selecione...</option>
                                            {cities.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                            <option value="outro">Outra...</option>
                                        </select>
                                        {isCustomCity && (
                                            <input
                                                type="text"
                                                placeholder="Digite a cidade"
                                                value={customCity}
                                                onChange={e => setCustomCity(e.target.value)}
                                                className="w-full mt-2 px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Bairro <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={newLead.bairro_interesse}
                                            onChange={e => setNewLead({ ...newLead, bairro_interesse: e.target.value })}
                                            disabled={(!newLead.cidade_interesse && !isCustomCity) || (newLead.cidade_interesse === 'outro' && !customCity)}
                                            className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:opacity-50"
                                        >
                                            <option value="">Selecione...</option>
                                            {neighborhoods.map(hood => (
                                                <option key={hood} value={hood}>{hood}</option>
                                            ))}
                                            <option value="outro">Outro...</option>
                                        </select>
                                        {isCustomNeighborhood && (
                                            <input
                                                type="text"
                                                placeholder="Digite o bairro"
                                                value={customNeighborhood}
                                                onChange={e => setCustomNeighborhood(e.target.value)}
                                                className="w-full mt-2 px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Bairros 2 e 3 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Bairro 2 (Opcional)</label>
                                        <select
                                            value={newLead.bairro_interesse_2}
                                            onChange={e => setNewLead({ ...newLead, bairro_interesse_2: e.target.value })}
                                            disabled={(!newLead.cidade_interesse && !isCustomCity) || (newLead.cidade_interesse === 'outro' && !customCity)}
                                            className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:opacity-50"
                                        >
                                            <option value="">Selecione...</option>
                                            {neighborhoods.map(hood => (
                                                <option key={hood} value={hood}>{hood}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Bairro 3 (Opcional)</label>
                                        <select
                                            value={newLead.bairro_interesse_3}
                                            onChange={e => setNewLead({ ...newLead, bairro_interesse_3: e.target.value })}
                                            disabled={(!newLead.cidade_interesse && !isCustomCity) || (newLead.cidade_interesse === 'outro' && !customCity)}
                                            className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:opacity-50"
                                        >
                                            <option value="">Selecione...</option>
                                            {neighborhoods.map(hood => (
                                                <option key={hood} value={hood}>{hood}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Orçamento Mín (R$)</label>
                                        <input
                                            type="number"
                                            value={newLead.orcamento_min}
                                            onChange={e => setNewLead({ ...newLead, orcamento_min: e.target.value })}
                                            className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                            placeholder="0,00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Orçamento Max (R$)</label>
                                        <input
                                            type="number"
                                            value={newLead.orcamento_max}
                                            onChange={e => setNewLead({ ...newLead, orcamento_max: e.target.value })}
                                            className="w-full px-3 py-2 rounded-full border border-slate-600 bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-bold transition-colors mt-4">{editingLeadId ? 'Salvar Alterações' : 'Criar Lead'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Matching Properties Modal */}
            {/* Matching Properties Modal */}
            {matchModalOpen && selectedLeadForMatch && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-3xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setMatchModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Target className="text-primary-500" />
                                Imóveis Compatíveis
                            </h3>
                            <p className="text-sm text-slate-400">
                                Sugestões para {selectedLeadForMatch.nome} com base no perfil
                            </p>
                        </div>

                        {loadingMatches ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-primary-500" size={32} />
                            </div>
                        ) : matchingProperties.filter(p => p.match_score >= 60).length > 0 ? (
                            <div className="space-y-4">
                                {matchingProperties
                                    .filter(p => p.match_score >= 60)
                                    .map(prop => {
                                        // Use pre-joined names from helper (fallback to lookup if not available)
                                        const opName = prop.operacao_nome || operations.find(op => op.id === prop.operacao)?.tipo || 'Operação';
                                        const typeName = prop.tipo_imovel_nome || propertyTypes.find(t => t.id === prop.tipo_imovel)?.tipo || 'Imóvel';

                                        // Badge Colors based on operation name
                                        let opColor = 'bg-gray-700 text-gray-300 border-gray-600';
                                        const opLower = opName.toLowerCase();
                                        if (opLower.includes('venda')) opColor = 'bg-red-900/40 text-red-200 border-red-700/50';
                                        else if (opLower.includes('locação') || opLower.includes('aluguel')) opColor = 'bg-blue-900/40 text-blue-200 border-blue-700/50';
                                        else if (opLower.includes('temporada')) opColor = 'bg-orange-900/40 text-orange-200 border-orange-700/50';

                                        // Price display logic
                                        const formatPrice = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

                                        return (
                                            <div key={prop.id} className="bg-slate-700/50 p-4 rounded-3xl border border-slate-600 flex justify-between items-center hover:bg-slate-700 transition-colors">
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">{prop.titulo}</h4>

                                                    {/* Badges Row */}
                                                    <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${opColor}`}>
                                                            {opName}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-purple-900/40 text-purple-200 border-purple-700/50">
                                                            {typeName}
                                                        </span>
                                                    </div>

                                                    <span className="text-sm text-slate-400 block mb-1">{prop.cidade} - {prop.bairro}</span>

                                                    {/* Price Logic */}
                                                    <div className="text-xl text-primary-400 font-bold">
                                                        {opLower.includes('temporada') ? (
                                                            <div className="flex flex-col">
                                                                {prop.valor_diaria && prop.valor_diaria > 0 && (
                                                                    <span>{formatPrice(prop.valor_diaria)} <span className="text-xs font-normal text-slate-500">/dia</span></span>
                                                                )}
                                                                {prop.valor_mensal && prop.valor_mensal > 0 && (
                                                                    <span>{formatPrice(prop.valor_mensal)} <span className="text-xs font-normal text-slate-500">/mês</span></span>
                                                                )}
                                                                {(!prop.valor_diaria || prop.valor_diaria <= 0) && (!prop.valor_mensal || prop.valor_mensal <= 0) && (
                                                                    <span className="text-sm">Sob Consulta</span>
                                                                )}
                                                            </div>
                                                        ) : opLower.includes('venda/locação') || opLower.includes('venda/locacao') ? (
                                                            // For Venda/Locação: show BOTH prices
                                                            <div className="flex flex-col gap-1">
                                                                {prop.valor_venda && prop.valor_venda > 0 && (
                                                                    <span className="text-base">{formatPrice(prop.valor_venda)} <span className="text-xs font-normal text-slate-500">venda</span></span>
                                                                )}
                                                                {prop.valor_locacao && prop.valor_locacao > 0 && (
                                                                    <span className="text-base">{formatPrice(prop.valor_locacao)} <span className="text-xs font-normal text-slate-500">/mês</span></span>
                                                                )}
                                                                {(!prop.valor_venda || prop.valor_venda <= 0) && (!prop.valor_locacao || prop.valor_locacao <= 0) && (
                                                                    <span className="text-sm">Sob Consulta</span>
                                                                )}
                                                            </div>
                                                        ) : opLower.includes('venda') ? (
                                                            <span>{prop.valor_venda && prop.valor_venda > 0 ? formatPrice(prop.valor_venda) : 'Sob Consulta'}</span>
                                                        ) : opLower.includes('locação') || opLower.includes('aluguel') ? (
                                                            <span>{prop.valor_locacao && prop.valor_locacao > 0 ? formatPrice(prop.valor_locacao) : 'Sob Consulta'}</span>
                                                        ) : (
                                                            <span>{formatPrice(prop.valor)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-xs text-slate-400">Match</div>
                                                        <div className={`text-xl font-bold ${prop.match_score >= 80 ? 'text-green-500' :
                                                            prop.match_score >= 60 ? 'text-yellow-500' :
                                                                'text-gray-500'
                                                            }`}>
                                                            {prop.match_score}%
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setViewingPropertyId(prop.id);
                                                            setIsDetailsModalOpen(true);
                                                        }}
                                                        className="p-2 bg-slate-600 rounded-full shadow-sm hover:shadow text-primary-500 hover:text-primary-600 transition-all"
                                                        title="Ver Detalhes e Enviar"
                                                    >
                                                        <ArrowRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Search size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Nenhum imóvel compatível encontrado no momento.</p>
                                <p className="text-sm mt-1">Tente ajustar os critérios do lead.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Property Details & Share Modal */}
            <PropertyDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                propertyId={viewingPropertyId || ''}
                lead={selectedLeadForMatch ? {
                    nome: selectedLeadForMatch.nome,
                    telefone: selectedLeadForMatch.telefone
                } : undefined}
            />
        </div>
    );
};