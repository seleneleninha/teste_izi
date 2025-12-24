import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Plus, Search, Filter, MoreVertical,
    Phone, Mail, Calendar, DollarSign, Clock,
    ChevronLeft, ChevronRight, ChevronDown, User, MapPin, Home,
    ArrowRight, AlertCircle, CheckCircle2, XCircle,
    Eye, FileText, CheckCircle, Target, TrendingUp, Users, MessageSquare, Loader2, X, Pencil,
    MessageCircle, Archive, List, RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import { SalesFunnel } from '../components/SalesFunnel';
import { QuickStats } from '../components/QuickStats';
import { useHeader } from '../components/HeaderContext';

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
    status: 'Novo' | 'Em Contato' | 'Negociação' | 'Fechado' | 'Arquivado';
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
const LeadCard: React.FC<{
    lead: Lead;
    isDragging?: boolean;
    matchCount?: number;
    onMatch?: (lead: Lead) => void;
    onEdit?: (lead: Lead) => void;
    onArchive?: (lead: Lead) => void;
    onStatusChange?: (leadId: string, newStatus: string) => void;
    locked?: boolean;
    operations?: { id: string; tipo: string }[];
    propertyTypes?: { id: string; tipo: string }[];
    columns?: any[];
}> = ({ lead, isDragging = false, matchCount = 0, onMatch, onEdit, onArchive, onStatusChange, locked = false, operations = [], propertyTypes = [], columns = [] }) => {
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

    const statusInfo = columns.find(c => c.status === lead.status);
    const statusColor = statusInfo?.color.replace('bg-', 'text-') || 'text-slate-400';
    const statusBg = statusInfo?.color.replace('bg-', 'bg-') + '/10' || 'bg-slate-500/10';
    const statusBorder = statusInfo?.color.replace('bg-', 'border-') + '/20' || 'border-slate-500/20';

    const statusOptions = [
        { value: 'Novo', label: 'Novo', color: 'text-blue-600' },
        { value: 'Em Contato', label: 'Em Contato', color: 'text-yellow-600' },
        { value: 'Negociação', label: 'Negociação', color: 'text-purple-600' },
        { value: 'Fechado', label: 'Fechado', color: 'text-green-600' },
        { value: 'Arquivado', label: 'Arquivado', color: 'text-red-600' },
    ];

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700/50 hover:border-slate-500 transition-all cursor-grab active:cursor-grabbing group hover:shadow-lg ${isDragging ? 'shadow-2xl ring-2 ring-emerald-500/50 scale-105 z-50' : ''
                } ${locked ? 'opacity-75 grayscale' : ''}`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                    <h4 className="font-black text-sm text-white uppercase tracking-tight">
                        {locked ? 'Lead Bloqueado' : lead.nome}
                    </h4>
                    {!locked ? (
                        <a
                            href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-emerald-400 font-bold hover:text-emerald-300 transition-colors flex items-center gap-1 mt-0.5"
                            title="Conversar no WhatsApp"
                        >
                            {lead.telefone}
                        </a>
                    ) : (
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            •••••••••••
                        </p>
                    )}
                </div>

                {!locked && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMatch) onMatch(lead);
                            }}
                            className="p-1.5 hover:bg-purple-900/40 rounded-lg text-purple-400 relative transition-all"
                            title="Ver Imóveis Compatíveis"
                        >
                            <Target size={14} />
                            {matchCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border border-slate-800 text-[9px] font-black flex items-center justify-center text-white">
                                    {matchCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onEdit) onEdit(lead);
                            }}
                            className="p-1.5 hover:bg-orange-900/40 rounded-lg text-orange-400 transition-all"
                            title="Editar Lead"
                        >
                            <Pencil size={14} />
                        </button>
                        {lead.status !== 'Arquivado' ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onArchive) onArchive(lead);
                                }}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-400 transition-colors"
                                title="Arquivar Lead"
                            >
                                <Archive size={14} />
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onStatusChange) onStatusChange(lead.id, 'Novo');
                                }}
                                className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                                title="Desarquivar Lead"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                )}
                {locked && (
                    <div className="text-gray-400">
                        <Archive size={14} />
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {/* Responsive Grid: 2 columns mobile, 3 columns desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.1em] mb-1">Interesse</p>
                        <div className="flex flex-col">
                            <span className="text-xs text-emerald-400 font-bold leading-tight">
                                {operations.find(o => o.id === lead.operacao_interesse)?.tipo || 'N/A'}
                            </span>
                            <span className="text-[10px] text-slate-300 font-medium leading-tight">
                                {propertyTypes.find(t => t.id === lead.tipo_imovel_interesse)?.tipo || lead.interesse}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.1em] mb-1">Localização</p>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs text-slate-200 font-bold truncate">{lead.bairro_interesse || lead.cidade_interesse || 'Não inf.'}</span>
                            {(lead.bairro_interesse_2 || lead.bairro_interesse_3) && (
                                <span className="text-[10px] text-slate-500 font-medium leading-tight">+ {
                                    [lead.bairro_interesse_2, lead.bairro_interesse_3].filter(Boolean).length
                                } bairros</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 col-span-2 md:col-span-1 flex items-center justify-between gap-3">
                        <div className="flex-1">
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.1em] mb-1">Orçamento</p>
                            <div className="flex flex-col">
                                <span className="text-emerald-400 font-black text-sm leading-tight">
                                    {locked ? '••••' : `R$ ${lead.orcamento_min?.toLocaleString('pt-BR')}`}
                                </span>
                                <span className="text-emerald-500/80 font-bold text-[11px] leading-tight mt-0.5">
                                    {locked ? '••••' : `a R$ ${lead.orcamento_max?.toLocaleString('pt-BR')}`}
                                </span>
                            </div>
                        </div>

                        {!locked && (
                            <div className="md:hidden relative flex-1 text-right">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.1em] mb-1">Etapa:</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowStatusMenu(!showStatusMenu);
                                    }}
                                    className={`ml-auto px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1 ${statusBg} ${statusColor} ${statusBorder} hover:brightness-125 cursor-pointer`}
                                >
                                    {lead.status}
                                    <ChevronDown size={12} />
                                </button>
                                {showStatusMenu && (
                                    <div className="absolute z-[100] top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                                                className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${option.color}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold border-t border-white/5 pt-2">
                    <span className="flex items-center">
                        <Calendar size={12} className="mr-1 text-slate-600" />
                        CRIADO EM {new Date(lead.data_criacao).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }).toUpperCase()}
                    </span>
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
        <div ref={setNodeRef} className="bg-slate-900/40 rounded-3xl border border-slate-700/50 shadow-sm transition-all hover:shadow-md backdrop-blur-sm">
            {/* Column Header acting as Stage Card Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/80 rounded-t-3xl">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl shadow-sm bg-slate-800 border border-slate-700`}>
                        {Icon && <Icon size={20} className={color.replace('bg-', 'text-')} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base tracking-tight">{label}</h3>
                        {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold text-emerald-400 block">{leads.length}</span>
                </div>
            </div>

            {/* Leads List */}
            <div className="p-4 min-h-[100px] space-y-3 bg-slate-950/20 rounded-b-3xl">
                {children}
                {leads.length === 0 && (
                    <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center">
                        <p className="text-sm text-slate-500 font-medium">Arraste leads para cá</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Mobile List View Card Component
const MobileLeadListViewCard: React.FC<{
    lead: Lead;
    isLocked: boolean;
    onMatchClick: (lead: Lead) => void;
    onEditLead: (lead: Lead) => void;
    updateLeadStatus: (leadId: string, newStatus: string) => void;
    operations: { id: string; tipo: string }[];
    propertyTypes: { id: string; tipo: string }[];
    matchCounts: Record<string, number>;
    columns: any[];
}> = ({ lead, isLocked, onMatchClick, onEditLead, updateLeadStatus, operations, propertyTypes, matchCounts, columns }) => {
    const [showStatusMenu, setShowStatusMenu] = React.useState(false);

    const opName = operations.find(op => op.id === lead.operacao_interesse)?.tipo;
    const typeName = propertyTypes.find(t => t.id === lead.tipo_imovel_interesse)?.tipo;
    const statusInfo = columns.find(c => c.status === lead.status);
    const statusColor = statusInfo?.color.replace('bg-', 'text-') || 'text-slate-400';
    const statusBg = statusInfo?.color.replace('bg-', 'bg-') + '/10' || 'bg-slate-500/10';
    const statusBorder = statusInfo?.color.replace('bg-', 'border-') + '/20' || 'border-slate-500/20';

    const statusOptions = [
        { value: 'Novo', label: 'Novo', color: 'text-blue-600' },
        { value: 'Em Contato', label: 'Em Contato', color: 'text-yellow-600' },
        { value: 'Negociação', label: 'Negociação', color: 'text-purple-600' },
        { value: 'Fechado', label: 'Fechado', color: 'text-green-600' },
        { value: 'Arquivado', label: 'Arquivado', color: 'text-red-600' },
    ];

    return (
        <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700/50 shadow-xl space-y-6">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h4 className="font-black text-white text-lg uppercase tracking-tight leading-tight">
                        {isLocked ? 'Lead Bloqueado' : lead.nome}
                    </h4>
                    {!isLocked ? (
                        <a
                            href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold mt-1"
                        >
                            <Phone size={14} />
                            {lead.telefone}
                        </a>
                    ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm font-bold mt-1">
                            <Phone size={14} />
                            •••••••••••
                        </div>
                    )}
                </div>

                {/* Interactive Status Badge */}
                <div className="relative">
                    <button
                        onClick={() => !isLocked && setShowStatusMenu(!showStatusMenu)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1 ${statusBg} ${statusColor} ${statusBorder} ${!isLocked ? 'hover:brightness-125 cursor-pointer' : ''}`}
                    >
                        {lead.status}
                        {!isLocked && <ChevronDown size={12} />}
                    </button>
                    {showStatusMenu && (
                        <div className="absolute z-50 top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {statusOptions.filter(opt => opt.value !== lead.status).map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        updateLeadStatus(lead.id, option.value);
                                        setShowStatusMenu(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${option.color}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-[1.5rem] border border-white/5 grid grid-cols-2 gap-4">
                <div className="col-span-1">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Interesse</p>
                    <div className="flex flex-col">
                        <span className="text-white font-black uppercase text-sm tracking-tight">{typeName || 'Imóvel'}</span>
                        <span className="text-xs text-slate-400 font-bold mt-1">{opName || 'Venda/Locação'}</span>
                    </div>
                </div>

                <div className="col-span-1">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Orçamento</p>
                    <div className="flex flex-col">
                        <span className="text-emerald-400 font-black text-sm leading-tight">
                            {isLocked ? '••••' : `R$ ${lead.orcamento_min?.toLocaleString('pt-BR')}`}
                        </span>
                        <span className="text-emerald-500/80 font-bold text-[11px] leading-tight mt-1">
                            {isLocked ? '••••' : `a R$ ${lead.orcamento_max?.toLocaleString('pt-BR')}`}
                        </span>
                    </div>
                </div>

                <div className="col-span-2 pt-2 border-t border-white/5">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Localização</p>
                    <div className="text-slate-200 font-bold text-sm">
                        {lead.bairro_interesse || lead.cidade_interesse || 'Não informado'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {!isLocked ? (
                    <>
                        <button
                            onClick={() => window.open(`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`, '_blank')}
                            className="flex flex-col items-center justify-center p-3 bg-green-500/10 text-green-400 rounded-2xl border border-green-500/20 hover:bg-green-500 hover:text-white transition-all gap-1"
                        >
                            <MessageCircle size={18} />
                            <span className="text-[8px] font-black uppercase">WhatsApp</span>
                        </button>
                        <button
                            onClick={() => onMatchClick(lead)}
                            className="flex flex-col items-center justify-center p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all gap-1 relative"
                        >
                            <Target size={18} />
                            <span className="text-[8px] font-black uppercase">Imóveis</span>
                            {(matchCounts[lead.id] || 0) > 0 && (
                                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border border-slate-800 text-[8px] font-black flex items-center justify-center text-white">
                                    {matchCounts[lead.id]}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => onEditLead(lead)}
                            className="flex flex-col items-center justify-center p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all gap-1"
                        >
                            <Pencil size={18} />
                            <span className="text-[8px] font-black uppercase">Editar</span>
                        </button>
                        {lead.status !== 'Arquivado' ? (
                            <button
                                onClick={() => updateLeadStatus(lead.id, 'Arquivado')}
                                className="flex flex-col items-center justify-center p-3 bg-red-700/30 text-red-400 rounded-2xl border border-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all gap-1"
                            >
                                <Archive size={18} />
                                <span className="text-[8px] font-black uppercase">Arquivar</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => updateLeadStatus(lead.id, 'Novo')}
                                className="flex flex-col items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all gap-1"
                            >
                                <RotateCcw size={18} />
                                <span className="text-[8px] font-black uppercase">Ativar</span>
                            </button>
                        )}
                    </>
                ) : (
                    <div className="col-span-4 p-4 text-center bg-slate-900/40 rounded-2xl border border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        Disponível na Versão Completa
                    </div>
                )}
            </div>
        </div>
    );
};

export const Leads: React.FC = () => {
    const { setHeaderContent } = useHeader();
    const { addToast } = useToast();
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [showArchived, setShowArchived] = useState(false);

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
        { status: 'Arquivado', label: 'Arquivados', color: 'bg-red-500', darkColor: 'bg-red-600', icon: Archive, description: 'Leads arquivados' },
    ];

    useEffect(() => {
        setHeaderContent(
            <div className="flex flex-col justify-center">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
                    Gestão de Leads
                </h2>
                <p className="text-slate-400 text-xs font-medium leading-tight">Gerencie e acompanhe seus clientes no funil</p>
            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent]);

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
        totalLeads: leads.filter(l => l.status !== 'Arquivado').length, // Exclude archived from total
        byStage: {
            novo: leads.filter(l => l.status === 'Novo').length,
            emContato: leads.filter(l => l.status === 'Em Contato').length,
            negociacao: leads.filter(l => l.status === 'Negociação').length,
            fechado: leads.filter(l => l.status === 'Fechado').length,
            arquivado: leads.filter(l => l.status === 'Arquivado').length,
        },
        totalValue: leads.filter(l => l.status !== 'Arquivado').reduce((sum, l) => sum + (l.orcamento_max || l.orcamento_min || 0), 0),
        conversionRate: leads.filter(l => l.status !== 'Arquivado').length > 0 ? (leads.filter(l => l.status === 'Fechado').length / leads.filter(l => l.status !== 'Arquivado').length) * 100 : 0,
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
        <div className="flex flex-col pt-6">
            {/* Unified Header & Filter Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-[2.5rem] shadow-2xl mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                            <Users size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Gestão de Leads</h3>
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                {leads.length} leads no total
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative group flex-1 md:flex-initial">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="BUSCAR LEADS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-4 py-4 rounded-2xl bg-slate-900/60 border border-white/5 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none w-full md:w-64 text-white font-bold transition-all hover:bg-slate-900/80 uppercase tracking-wider"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setView('kanban')}
                                className={`p-2.5 rounded-xl transition-all ${view === 'kanban' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'text-slate-500 hover:text-white'}`}
                                title="Visualização em Quadro"
                            >
                                <LayoutDashboard size={18} />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'text-slate-500 hover:text-white'}`}
                                title="Visualização em Lista"
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`p-2.5 rounded-xl transition-all border ${showArchived ? 'bg-red-700 text-white border-red-600 shadow-inner' : 'bg-red-900/60 text-red-500 border-white/5 hover:text-white'}`}
                            title={showArchived ? "Ocultar Arquivados" : "Mostrar Arquivados"}
                        >
                            <Archive size={18} />
                        </button>

                        <button
                            onClick={() => {
                                setEditingLeadId(null);
                                setNewLead({
                                    nome: '', email: '', telefone: '', interesse: '',
                                    operacao_interesse: '', tipo_imovel_interesse: '',
                                    cidade_interesse: '', bairro_interesse: '', orcamento_min: '', orcamento_max: '',
                                    bairro_interesse_2: '', bairro_interesse_3: ''
                                });
                                setIsModalOpen(true);
                            }}
                            className="flex-1 md:flex-initial px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20 active:scale-95 border border-white/10 uppercase tracking-widest"
                        >
                            <Plus size={20} /> NOVO LEAD
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
            ) : view === 'kanban' ? (
                /* Kanban Board with Drag and Drop */
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left Column: Funnel */}
                        <div className="lg:sticky lg:top-4 animate-in slide-in-from-left duration-700">
                            <SalesFunnel metrics={funnelMetrics} />
                        </div>

                        {/* Right Column: Vertical Kanban */}
                        <div className="flex flex-col gap-8 animate-in slide-in-from-bottom duration-700">
                            {columns
                                .filter(col => showArchived || col.status !== 'Arquivado')
                                .map((column) => (
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
                                            <div className="space-y-4">
                                                {getLeadsByStatus(column.status)
                                                    .map((lead, index) => (
                                                        <LeadCard
                                                            key={lead.id}
                                                            lead={lead}
                                                            matchCount={matchCounts[lead.id] || 0}
                                                            onMatch={() => handleMatchClick(lead)}
                                                            onEdit={() => handleEditLead(lead)}
                                                            onArchive={() => updateLeadStatus(lead.id, 'Arquivado')}
                                                            onStatusChange={updateLeadStatus}
                                                            locked={isTrialLimited && index >= trialMaxLeads}
                                                            operations={operations}
                                                            propertyTypes={propertyTypes}
                                                            columns={columns}
                                                        />
                                                    ))}
                                            </div>
                                        </SortableContext>
                                    </DroppableColumn>
                                ))}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeId && activeLead ? (
                            <div className="opacity-80 rotate-3 scale-105 cursor-grabbing z-[100]">
                                <LeadCard
                                    lead={activeLead}
                                    operations={operations}
                                    propertyTypes={propertyTypes}
                                    columns={columns}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            ) : (
                /* List View Content */
                <div className="animate-in fade-in duration-700">
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-slate-800/40 backdrop-blur-sm rounded-[2.5rem] border border-slate-700/50 overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                                    <th className="p-8">Lead / Contato</th>
                                    <th className="p-8">Interesse</th>
                                    <th className="p-8">Localização</th>
                                    <th className="p-8">Orçamento</th>
                                    <th className="p-8 text-center">Status</th>
                                    <th className="p-8 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {leads
                                    .filter(l => showArchived || l.status !== 'Arquivado')
                                    .filter(l =>
                                        l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        l.telefone.includes(searchTerm)
                                    )
                                    .map((lead, index) => {
                                        const isLocked = isTrialLimited && index >= trialMaxLeads;
                                        const statusColor = columns.find(c => c.status === lead.status)?.color.replace('bg-', 'text-') || 'text-slate-400';
                                        const statusBg = columns.find(c => c.status === lead.status)?.color.replace('bg-', 'bg-') + '/10' || 'bg-slate-500/10';
                                        const statusBorder = columns.find(c => c.status === lead.status)?.color.replace('bg-', 'border-') + '/20' || 'border-slate-500/20';

                                        const opName = operations.find(op => op.id === lead.operacao_interesse)?.tipo;
                                        const typeName = propertyTypes.find(t => t.id === lead.tipo_imovel_interesse)?.tipo;

                                        return (
                                            <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors group">
                                                <td className="p-8">
                                                    <div className="flex flex-col">
                                                        <div className="font-bold text-white text-base tracking-tight leading-tight">{isLocked ? 'Lead Bloqueado' : lead.nome}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {!isLocked ? (
                                                                <a
                                                                    href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                                                                >
                                                                    {lead.telefone}
                                                                </a>
                                                            ) : (
                                                                <div className="text-sm text-slate-400 font-medium">
                                                                    •••••••••••
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex flex-col">
                                                        <div className="text-sm text-white font-black uppercase tracking-tight">{typeName || 'Imóvel'}</div>
                                                        <div className="text-xs text-slate-400 font-bold mt-1">{opName || 'Venda/Locação'}</div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-sm text-slate-300 font-bold">{lead.bairro_interesse || lead.cidade_interesse}</div>
                                                        {lead.bairro_interesse_2 && <div className="text-[12px] text-slate-500 font-medium">{lead.bairro_interesse_2}</div>}
                                                        {lead.bairro_interesse_3 && <div className="text-[10px] text-slate-500 font-medium">{lead.bairro_interesse_3}</div>}
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex flex-col group/budget">
                                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em] mb-0.5">de</div>
                                                        <div className="text-sm text-emerald-400 font-black leading-none">
                                                            {isLocked ? '••••' : `R$ ${lead.orcamento_min?.toLocaleString('pt-BR')}`}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em] mb-0.5 mt-2">até</div>
                                                        <div className="text-sm text-emerald-500 font-black leading-none">
                                                            {isLocked ? '••••' : `R$ ${lead.orcamento_max?.toLocaleString('pt-BR')}`}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8 text-center">
                                                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block ${statusBg} ${statusColor} ${statusBorder}`}>
                                                        {lead.status}
                                                    </div>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {!isLocked && (
                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                <button
                                                                    onClick={() => handleMatchClick(lead)}
                                                                    className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all shadow-lg shadow-purple-500/10 relative"
                                                                    title="Ver Compatíveis"
                                                                >
                                                                    <Target size={14} />
                                                                    {(matchCounts[lead.id] || 0) > 0 && (
                                                                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border border-slate-800 text-[12px] font-black flex items-center justify-center text-white">
                                                                            {matchCounts[lead.id]}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditLead(lead)}
                                                                    className="p-2 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-orange-500/10"
                                                                    title="Editar"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                {lead.status !== 'Arquivado' ? (
                                                                    <button
                                                                        onClick={() => updateLeadStatus(lead.id, 'Arquivado')}
                                                                        className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                                                        title="Arquivar"
                                                                    >
                                                                        <Archive size={14} />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => updateLeadStatus(lead.id, 'Novo')}
                                                                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                                                                        title="Desarquivar"
                                                                    >
                                                                        <RotateCcw size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {leads.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-6 bg-slate-700/20 rounded-[2rem] border border-white/5">
                                                    <Users size={48} className="text-slate-600" />
                                                </div>
                                                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Nenhum lead encontrado</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List View (Mobile First Design) */}
                    <div className="md:hidden space-y-4">
                        {leads
                            .filter(l => showArchived || l.status !== 'Arquivado')
                            .filter(l =>
                                l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                l.telefone.includes(searchTerm)
                            )
                            .map((lead, index) => {
                                const isLocked = isTrialLimited && index >= trialMaxLeads;
                                return (
                                    <MobileLeadListViewCard
                                        key={lead.id}
                                        lead={lead}
                                        isLocked={isLocked}
                                        onMatchClick={handleMatchClick}
                                        onEditLead={handleEditLead}
                                        updateLeadStatus={updateLeadStatus}
                                        operations={operations}
                                        propertyTypes={propertyTypes}
                                        matchCounts={matchCounts}
                                        columns={columns}
                                    />
                                );
                            })}
                    </div>
                </div>
            )}

            {/* New Lead Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto border border-white/10">
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
            {matchModalOpen && selectedLeadForMatch && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => setMatchModalOpen(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors z-10"
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
                                            <div key={prop.id} className="group bg-slate-700/30 hover:bg-slate-700/50 p-4 rounded-3xl border border-white/5 hover:border-white/10 flex gap-4 transition-all duration-300">
                                                {/* Property Image Preview */}
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-800 border border-white/5">
                                                    {prop.imagem ? (
                                                        <img
                                                            src={prop.imagem}
                                                            alt={prop.titulo}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                            <Target size={24} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white text-base truncate group-hover:text-primary-400 transition-colors uppercase tracking-tight">{prop.titulo}</h4>

                                                    {/* Badges Row */}
                                                    <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest pl-0.5">Operação</span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${opColor} mt-0.5`}>
                                                                {opName}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest pl-0.5">Imóvel</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-slate-800 text-slate-300 border-white/10 mt-0.5">
                                                                {typeName}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                                        {prop.cidade} - {prop.bairro}
                                                    </div>

                                                    {/* Price Logic */}
                                                    <div className="text-lg text-emerald-400 font-black tracking-tight">
                                                        {opLower.includes('temporada') ? (
                                                            <div className="flex flex-col">
                                                                {prop.valor_diaria && prop.valor_diaria > 0 && (
                                                                    <span>{formatPrice(prop.valor_diaria)} <span className="text-[10px] uppercase font-bold text-slate-500">/dia</span></span>
                                                                )}
                                                                {prop.valor_mensal && prop.valor_mensal > 0 && (
                                                                    <span>{formatPrice(prop.valor_mensal)} <span className="text-[10px] uppercase font-bold text-slate-500">/mês</span></span>
                                                                )}
                                                            </div>
                                                        ) : opLower.includes('venda/locação') || opLower.includes('venda/locacao') ? (
                                                            <div className="flex items-baseline gap-2">
                                                                {prop.valor_venda && prop.valor_venda > 0 && (
                                                                    <span>{formatPrice(prop.valor_venda)}</span>
                                                                )}
                                                                {prop.valor_locacao && prop.valor_locacao > 0 && (
                                                                    <span className="text-sm opacity-60">| {formatPrice(prop.valor_locacao)}/mês</span>
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

                                                <div className="flex flex-col justify-between items-end gap-2">
                                                    <div className="text-right bg-slate-800/50 p-2 rounded-2xl border border-white/5 min-w-[70px]">
                                                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Match</div>
                                                        <div className={`text-lg font-black leading-none ${prop.match_score >= 80 ? 'text-emerald-500' :
                                                            prop.match_score >= 60 ? 'text-amber-500' :
                                                                'text-slate-500'
                                                            }`}>
                                                            {prop.match_score}%
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setViewingPropertyId(prop.id);
                                                            setIsDetailsModalOpen(true);
                                                        }}
                                                        className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-2xl shadow-lg shadow-primary-600/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/btn"
                                                        title="Ver Detalhes e Enviar"
                                                    >
                                                        <ArrowRight size={20} className="group-hover/btn:translate-x-0.5 transition-transform" />
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