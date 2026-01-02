import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Check, Sparkles, Wand2, Loader2, Tag, MapPin, DollarSign, Home, Info, Search, AlertCircle, AlertTriangle, History, ShieldCheck, Save, Calendar, Trash2, Play, Maximize2, Star, Percent } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { generatePropertyDescription } from '../lib/geminiHelper';
import { useHeader } from '../components/HeaderContext';

import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { geocodeAddress } from '../lib/geocodingHelper';
import { DraggableMap } from '../components/DraggableMap';
import { formatCurrencyInput, formatAreaInput } from '../lib/formatters';
import imageCompression from 'browser-image-compression';
import { div } from 'framer-motion/client';

// Interface for the form data
interface PropertyFormData {
    title: string;
    type: string;
    // Location
    cep: string;
    address: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    latitude: string;
    longitude: string;
    // Details
    bedrooms: number | string;
    suites: number | string;
    bathrooms: number | string;
    garage: number | string;
    totalArea: number | string;
    privateArea: number | string;
    description: string;
    features: string[];
    // Financial
    salePrice: string;
    rentPrice: string;
    condoFee: string;
    iptu: string;
    aceitaParceria: boolean; // Partnership acceptance
    taxasInclusas: boolean; // Fees included in rent
    aceitaFinanciamento: boolean; // Financing acceptance
    // Temporada (Vacation Rental)
    valorDiaria: string;
    valorMensal: string;
    // Supabase Relations
    operacaoId: string;
    tipoImovelId: string;
    subtipoImovelId: string;
    videoUrl: string;
    tourVirtualUrl: string;
    observacoes: string;
}

const INITIAL_DATA: PropertyFormData = {
    title: '',
    type: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    bedrooms: '',
    suites: '',
    bathrooms: '',
    garage: '',
    totalArea: '',
    privateArea: '',
    description: '',
    features: [],
    salePrice: '',
    rentPrice: '',
    condoFee: '',
    iptu: '',
    aceitaParceria: false,
    taxasInclusas: false,
    aceitaFinanciamento: false,
    valorDiaria: '',
    valorMensal: '',
    operacaoId: '',
    tipoImovelId: '',
    subtipoImovelId: '',
    videoUrl: '',
    tourVirtualUrl: '',
    observacoes: ''
};



export default function AddProperty() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { setHeaderContent } = useHeader();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<PropertyFormData>(INITIAL_DATA);
    const [loading, setLoading] = useState(false);
    const isSubmittingRef = useRef(false); // 🔒 Sync Lock for double-click prevention
    const [editingId, setEditingId] = useState<string | null>(null);
    const [rejectionData, setRejectionData] = useState<{ reason: string; history: any[] } | null>(null);
    const [propertyStatus, setPropertyStatus] = useState<string>('');

    // Helper function to change step and scroll to top
    const changeStep = (newStep: number) => {
        setStep(newStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Dynamic Options State
    const [operacoes, setOperacoes] = useState<any[]>([]);
    const [tiposImovel, setTiposImovel] = useState<any[]>([]);
    const [subtiposImovel, setSubtiposImovel] = useState<any[]>([]);
    const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);

    // Temporada state - detect if operation is vacation rental
    const [isTemporada, setIsTemporada] = useState(false);

    // Trial status state
    const [isTrial, setIsTrial] = useState(false);
    const [reachedLimit, setReachedLimit] = useState(false);
    const TRIAL_LIMIT = 5;

    // List of allowed types for Sale/Rent operations
    const TIPOS_PERMITIDOS_PADRAO = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];

    // Filter tipos logic
    const tiposDisponiveis = useMemo(() => {
        if (isTemporada) {
            return tiposImovel.filter(t => t.disponivel_temporada);
        } else {
            // For Sale, Rent, Sale/Rent - show only specific types
            return tiposImovel.filter(t => TIPOS_PERMITIDOS_PADRAO.includes(t.tipo));
        }
    }, [isTemporada, tiposImovel]);

    // Header Title
    useEffect(() => {
        setHeaderContent(
            <div className="flex flex-col justify-center">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
                    {editingId ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
                </h2>
                <p className="text-slate-400 text-xs font-medium leading-tight">Preencha os <span className="text-red-500">campos obrigatórios*</span>, por favor</p>
            </div>
        );
        return () => setHeaderContent(null);
    }, [editingId, setHeaderContent]);

    // Fetch user trial status and property count
    useEffect(() => {
        const checkTrialAndLimit = async () => {
            if (!user?.id) return;

            // 1. Check Profile for Trial Status
            const { data: profile } = await supabase
                .from('perfis')
                .select('is_trial')
                .eq('id', user.id)
                .single();

            const isUserTrial = profile?.is_trial || false;
            setIsTrial(isUserTrial);

            // 2. If Trial, check property count
            if (isUserTrial) {
                const { count, error } = await supabase
                    .from('anuncios')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!error && count !== null) {
                    if (count >= TRIAL_LIMIT) {
                        setReachedLimit(true);
                    }
                }
            }
        };

        checkTrialAndLimit();
    }, [user?.id]);

    useEffect(() => {
        const fetchOptions = async () => {
            const { data: ops } = await supabase.from('operacao').select('*');
            const { data: tipos } = await supabase.from('tipo_imovel').select('*');
            const { data: subtipos } = await supabase.from('subtipo_imovel').select('*');
            const { data: feats } = await supabase.from('caracteristicas').select('*');

            if (ops) setOperacoes(ops);
            if (tipos) setTiposImovel(tipos.sort((a, b) => a.tipo.localeCompare(b.tipo)));
            // Sort subtipos alphabetically
            if (subtipos) setSubtiposImovel(subtipos.sort((a, b) => a.subtipo.localeCompare(b.subtipo)));
            // Sort features alphabetically
            if (feats) setAvailableFeatures(feats.sort((a, b) => a.nome.localeCompare(b.nome)));
        };
        fetchOptions();
    }, []);

    // Detect if selected operation is Temporada
    useEffect(() => {
        const selectedOp = operacoes.find(o => o.id === formData.operacaoId);
        const isTemp = selectedOp?.tipo?.toLowerCase() === 'temporada';
        setIsTemporada(isTemp);

        // Clear subtipo when switching to Temporada
        if (isTemp && formData.subtipoImovelId) {
            setFormData(prev => ({ ...prev, subtipoImovelId: '' }));
        }
    }, [formData.operacaoId, operacoes]);

    // Fetch existing property data for editing
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('id');

        if (id) {
            setEditingId(id);
            fetchPropertyDetails(id);
        }
    }, [location.search]);

    const fetchPropertyDetails = async (id: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                // Populate form data
                setFormData({
                    title: data.titulo,
                    type: '', // Will be set via IDs
                    cep: data.cep || '',
                    address: data.logradouro || '',
                    number: data.numero || '',
                    complement: data.complemento || '',
                    neighborhood: data.bairro || '',
                    city: data.cidade || '',
                    state: data.uf || '',
                    latitude: data.latitude || '',
                    longitude: data.longitude || '',
                    bedrooms: data.quartos || '',
                    suites: data.suites || '',
                    bathrooms: data.banheiros || '',
                    garage: data.vagas || '',
                    totalArea: data.area_total || '',
                    privateArea: data.area_priv || '',
                    description: data.descricao || '',
                    features: data.caracteristicas ? data.caracteristicas.split(', ') : [],
                    salePrice: data.valor_venda ? data.valor_venda.toString().replace('.', ',') : '',
                    rentPrice: data.valor_locacao ? data.valor_locacao.toString().replace('.', ',') : '',
                    condoFee: data.valor_condo ? data.valor_condo.toString().replace('.', ',') : '',
                    iptu: data.valor_iptu ? data.valor_iptu.toString().replace('.', ',') : '',
                    aceitaParceria: data.aceita_parceria || false,
                    taxasInclusas: data.taxas_inclusas || false,
                    aceitaFinanciamento: data.aceita_financiamento || false,
                    operacaoId: data.operacao || '',
                    tipoImovelId: data.tipo_imovel || '',
                    subtipoImovelId: data.subtipo_imovel || '',
                    videoUrl: data.video || '',
                    tourVirtualUrl: data.tour_virtual || '',
                    observacoes: data.observacoes || ''
                });

                // Set images
                if (data.fotos) {
                    setImages(data.fotos.split(','));
                }

                // Set status and rejection info
                setPropertyStatus(data.status);
                if (data.status === 'reprovado') {
                    setRejectionData({
                        reason: data.motivo_reprovacao,
                        history: data.historico_reprovacao || []
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching property details:', error);
            addToast('Erro ao carregar dados do imóvel.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // 🔒 PREVENT DOUBLE SUBMISSION: Strict Ref Lock (Sync)
        if (isSubmittingRef.current) return;

        if (!user) {
            addToast('Você precisa estar logado para cadastrar um imóvel.', 'error');
            return;
        }

        isSubmittingRef.current = true; // 🔒 Lock immediately (sync)
        setLoading(true); // UI Update

        try {
            // ✅ Rate limiting: comentado temporariamente (função não importada)
            // const rateLimitCheck = await checkRateLimit(propertyFormLimiter, user.id, 'submissão de anúncio');
            // if (!rateLimitCheck.allowed) {
            //     addToast(rateLimitCheck.error!, 'error');
            //     return;
            // }

            // --- Trial Enforcement Logic ---
            try {
                const { data: profile } = await supabase
                    .from('perfis')
                    .select('is_trial, trial_fim')
                    .eq('id', user.id)
                    .single();

                if (profile?.is_trial) {
                    // Check Expiration
                    const trialEnd = new Date(profile.trial_fim);
                    if (new Date() > trialEnd) {
                        addToast('Seu período de teste expirou. Faça upgrade para continuar anunciando.', 'error');
                        // navigate('/partner'); // Optional: redirect to plans
                        return;
                    }

                    // Check Quantity Limit
                    // Only check if creating new property, not editing
                    if (!editingId) {
                        // Fetch dynamic limit
                        const { data: configData } = await supabase
                            .from('admin_config')
                            .select('value')
                            .eq('key', 'trial_max_properties')
                            .single();

                        const trialLimit = configData ? parseInt(configData.value) : 5;

                        const { count, error: countError } = await supabase
                            .from('anuncios')
                            .select('*', { count: 'exact', head: true })
                            .eq('user_id', user.id);

                        if (!countError && count !== null && count >= trialLimit) {
                            addToast(`Limite de ${trialLimit} imóveis atingido no período de testes. Faça upgrade para anunciar mais.`, 'error');
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error('Error checking trial limits:', err);
                // Fallback: allow to proceed if check fails, or block? Better block safely or warn.
                // For now, simple console error and proceed, or maybe return?
                // safest is to let it pass if DB check fails to avoid blocking users due to network glitches,
                // but for enforcement strictness, we might want to return.
                // Let's just log.
            }
            // -------------------------------

            // Validação de Campos Obrigatórios (Constraints do Banco)
            if (!formData.operacaoId) {
                addToast('Selecione a operação (Venda/Locação).', 'error');
                return;
            }
            if (!formData.tipoImovelId) {
                addToast('Selecione o tipo do imóvel.', 'error');
                return;
            }
            if (!formData.subtipoImovelId && !isTemporada) {
                addToast('Selecione o subtipo do imóvel.', 'error');
                return;
            }
            if (!formData.privateArea) {
                addToast('A área privativa é obrigatória.', 'error');
                return;
            }
            if (!formData.title) {
                addToast('O título do anúncio é obrigatório.', 'error');
                return;
            }

            const propertyData = {
                user_id: user.id,
                titulo: formData.title,
                operacao: formData.operacaoId,
                tipo_imovel: formData.tipoImovelId,
                subtipo_imovel: isTemporada ? null : formData.subtipoImovelId,
                cep: formData.cep,
                logradouro: formData.address,
                numero: formData.number ? String(formData.number) : null,
                complemento: formData.complement,
                bairro: formData.neighborhood,
                cidade: formData.city,
                uf: formData.state,
                latitude: formData.latitude || null,
                longitude: formData.longitude || null,
                quartos: formData.bedrooms ? Number(formData.bedrooms) : null,
                suites: formData.suites ? Number(formData.suites) : null,
                banheiros: formData.bathrooms ? Number(formData.bathrooms) : null,
                vagas: formData.garage ? Number(formData.garage) : null,
                area_priv: formData.privateArea ? parseFloat(formData.privateArea.replace(/\./g, '').replace(',', '.')) : 0,
                area_total: formData.totalArea ? parseFloat(formData.totalArea.replace(/\./g, '').replace(',', '.')) : null,
                descricao: formData.description,
                caracteristicas: formData.features.join(', '),
                fotos: images.join(','),
                // Valores normais (Venda/Locação)
                valor_venda: isTemporada ? null : (formData.salePrice ? parseFloat(formData.salePrice.replace(/\./g, '').replace(',', '.')) : null),
                valor_locacao: isTemporada ? null : (formData.rentPrice ? parseFloat(formData.rentPrice.replace(/\./g, '').replace(',', '.')) : null),
                // Valores Temporada
                valor_diaria: isTemporada && formData.valorDiaria ? parseFloat(formData.valorDiaria.replace(/\./g, '').replace(',', '.')) : null,
                valor_mensal: isTemporada && formData.valorMensal ? parseFloat(formData.valorMensal.replace(/\./g, '').replace(',', '.')) : null,
                // valor_condo: formData.condoFee ? parseFloat(formData.condoFee.replace(/\./g, '').replace(',', '.')) : null, // Comentado - trigger do banco busca valor_condominio
                valor_iptu: formData.iptu ? parseFloat(formData.iptu.replace(/\./g, '').replace(',', '.')) : null,
                aceita_parceria: formData.aceitaParceria,
                taxas_inclusas: isTemporada ? null : formData.taxasInclusas,
                aceita_financiamento: isTemporada ? null : formData.aceitaFinanciamento,
                status: 'pendente', // Always reset to pending on update
                video: formData.videoUrl,
                tour_virtual: formData.tourVirtualUrl,
                observacoes: formData.observacoes
            };

            let error;
            if (editingId) {
                const { error: updateError } = await supabase
                    .from('anuncios')
                    .update(propertyData)
                    .eq('id', editingId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('anuncios')
                    .insert(propertyData);
                error = insertError;
            }

            if (error) throw error;

            // --- ADMIN NOTIFICATION REMOVED ---
            // Notifications for admins will be handled via WAHA in the future.

            addToast(editingId ? 'Imóvel atualizado com sucesso! Aguardando nova aprovação.' : 'Imóvel cadastrado com sucesso! Aguardando aprovação.', 'success');
            navigate('/properties');
        } catch (error: any) {
            console.error('Error submitting property:', error);
            addToast('Erro ao cadastrar imóvel: ' + error.message, 'error');
        } finally {
            setLoading(false);
            isSubmittingRef.current = false; // 🔓 Unlock Sync
        }
    };



    // Media States
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadingTour, setUploadingTour] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // AI & Async States
    const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
    const [detectedTags, setDetectedTags] = useState<string[]>([]);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([]);
    const [priceEvaluation, setPriceEvaluation] = useState<{ min: number; max: number; suggestion: string } | null>(null);
    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const [cepError, setCepError] = useState('');

    // Touch/Drag states for mobile image reordering
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number>(0);

    const steps = [
        { num: 1, label: 'Endereço', icon: MapPin },
        { num: 2, label: 'Financeiro', icon: DollarSign },
        { num: 3, label: 'Detalhes', icon: Home },
        { num: 4, label: 'Fotos', icon: UploadCloud },
        { num: 5, label: 'Revisão', icon: Check }
    ];


    // Campos que devem receber formatação de moeda (R$ 1.000.000)
    const currencyFields = ['salePrice', 'rentPrice', 'condoFee', 'iptu', 'valorDiaria', 'valorMensal'];
    // Campos que devem receber formatação de área (1.500 m²)
    const areaFields = ['privateArea', 'totalArea'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let formattedValue = value;

        // Aplicar formatação para campos monetários
        if (currencyFields.includes(name)) {
            formattedValue = formatCurrencyInput(value);
        }
        // Aplicar formatação para campos de área
        else if (areaFields.includes(name)) {
            formattedValue = formatAreaInput(value);
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleFeatureToggle = (feature: string) => {
        setFormData(prev => {
            const exists = prev.features.includes(feature);
            return {
                ...prev,
                features: exists
                    ? prev.features.filter(f => f !== feature)
                    : [...prev.features, feature]
            };
        });
    };

    // --- ViaCEP Integration ---
    const fetchAddress = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setIsLoadingCep(true);
        setCepError('');

        try {
            console.log('Buscando CEP:', cleanCep);
            const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
            const data = await response.json();

            if (data.erro) {
                addToast('CEP não encontrado', 'error');
                return;
            }

            console.log('Dados do CEP:', data);

            setFormData(prev => ({
                ...prev,
                address: data.street || data.logradouro || '',
                neighborhood: data.neighborhood || data.bairro || '',
                city: data.city || data.localidade || '',
                state: data.state || data.uf || '',
            }));

            // Automatically fetch coordinates using geocoding
            if (data.city || data.localidade) {
                console.log('Iniciando geocodificação...');

                // Try precise address first
                let coords = await geocodeAddress({
                    street: data.street || data.logradouro || '',
                    number: formData.number || 's/n',
                    neighborhood: data.neighborhood || data.bairro || '',
                    city: data.city || data.localidade || '',
                    state: data.state || data.uf || '',
                    postalCode: cleanCep
                });

                console.log('Coordenadas obtidas (tentativa 1):', coords);

                // If precise address fails, try just city
                if (!coords) {
                    console.log('Tentando geocodificação apenas com cidade...');
                    coords = await geocodeAddress({
                        street: '',
                        number: '',
                        neighborhood: '',
                        city: data.city || data.localidade || '',
                        state: data.state || data.uf || '',
                        postalCode: ''
                    });
                    console.log('Coordenadas obtidas (tentativa 2 - cidade):', coords);
                }

                if (coords) {
                    setFormData(prev => ({
                        ...prev,
                        latitude: coords.latitude.toString(),
                        longitude: coords.longitude.toString()
                    }));
                    addToast('Endereço e coordenadas obtidos! Mapa exibido abaixo.', 'success');
                } else {
                    addToast('Endereço preenchido, mas não foi possível obter coordenadas automaticamente.', 'warning');
                }
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            addToast('Erro ao buscar endereço', 'error');
        } finally {
            setIsLoadingCep(false);
        }
    };

    const simulateGeocoding = (city: string) => {
        // Mock coordinates based on city (just for demo purposes)
        // In production, use Google Maps Geocoding API
        const lat = (Math.random() * (-23.4 - -23.7) + -23.7).toFixed(6); // Random Sao Paulo Lat
        const lng = (Math.random() * (-46.3 - -46.9) + -46.9).toFixed(6); // Random Sao Paulo Lng
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        fetchAddress(e.target.value);
    };

    // --- AI Functions ---
    const analyzePhotos = () => {
        setIsAnalyzingPhotos(true);
        setTimeout(() => {
            const tags = ['Piscina', 'Varanda Gourmet', 'Iluminação Natural', 'Piso Laminado'];
            setDetectedTags(tags);
            // Auto-select features based on AI
            setFormData(prev => ({
                ...prev,
                features: [...new Set([...prev.features, ...tags.filter(t => availableFeatures.some(f => f.nome === t))])]
            }));
            setIsAnalyzingPhotos(false);
        }, 2000);
    };

    const generateDescription = async () => {
        setIsGeneratingDesc(true);
        setGeneratedDescriptions([]);

        try {
            // Fetch broker data for Popular style
            const { data: brokerData } = await supabase
                .from('perfis')
                .select('nome, sobrenome, creci, uf_creci, whatsapp')
                .eq('id', user?.id)
                .single();

            // Get tipo, subtipo, and operacao names
            const tipoNome = tiposImovel.find(t => t.id === formData.tipoImovelId)?.tipo || formData.type;
            const subtipoNome = subtiposImovel.find(s => s.id === formData.subtipoImovelId)?.subtipo;
            const operacaoNome = operacoes.find(o => o.id === formData.operacaoId)?.tipo;

            // Check if it's temporada
            const isTemp = operacaoNome?.toLowerCase() === 'temporada';

            // Parse financial values (já formatados pelo input, ex: "479.000,00")
            // Remove pontos e vírgulas, depois converte para número
            const parseValue = (val: string) => {
                if (!val) return 0;
                // Remove "R$", espaços, pontos (separador de milhar)
                // Troca vírgula (decimal) por ponto
                const cleaned = val.replace(/[R$\s.]/g, '').replace(',', '.');
                return parseFloat(cleaned) || 0;
            };
            const valorVenda = parseValue(formData.salePrice);
            const valorLocacao = parseValue(formData.rentPrice);
            const valorDiaria = parseValue(formData.valorDiaria);
            const valorMensal = parseValue(formData.valorMensal);

            const descriptions = await generatePropertyDescription({
                titulo: formData.title,
                tipo: tipoNome,
                subtipo: subtipoNome,
                operacao: operacaoNome,
                bairro: formData.neighborhood,
                cidade: formData.city,
                quartos: Number(formData.bedrooms) || 0,
                suites: Number(formData.suites) || 0,
                banheiros: Number(formData.bathrooms) || 0,
                vagas: Number(formData.garage) || 0,
                area: formData.privateArea ? parseFloat(formData.privateArea.replace(/\./g, '').replace(',', '.')) : 0,
                caracteristicas: formData.features,
                brokerName: brokerData ? `${brokerData.nome} ${brokerData.sobrenome}` : undefined,
                brokerCreci: brokerData?.creci || undefined,
                brokerUfCreci: brokerData?.uf_creci || undefined,
                brokerWhatsapp: brokerData?.whatsapp || undefined,
                // Financial info
                valorVenda: valorVenda > 0 ? valorVenda : undefined,
                valorLocacao: valorLocacao > 0 ? valorLocacao : undefined,
                valorDiaria: valorDiaria > 0 ? valorDiaria : undefined,
                valorMensal: valorMensal > 0 ? valorMensal : undefined,
                taxasInclusas: formData.taxasInclusas,
                aceitaFinanciamento: formData.aceitaFinanciamento,
                // Don't include partnership info (internal only)
                isTemporada: isTemp,
            });

            setGeneratedDescriptions(descriptions);
            // Auto-select first description
            if (descriptions.length > 0) {
                setFormData(prev => ({ ...prev, description: descriptions[0] }));
            }
        } catch (error) {
            console.error('Error generating description:', error);
            addToast('Erro ao gerar descrição. Tente novamente.', 'error');
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const handleImageDelete = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        setUploading(true);
        const files = Array.from(event.target.files);
        const uploadedImageUrls: string[] = [];

        // Check if user has watermark configured
        let watermarkUrl: string | null = null;
        try {
            const { data: profileData } = await supabase
                .from('perfis')
                .select('marca_dagua')
                .eq('id', user?.id)
                .single();

            watermarkUrl = profileData?.marca_dagua || null;
        } catch (error) {
            console.log('No watermark configured or error fetching:', error);
        }

        for (const file of files) {
            // Validação inline de tipo de imagem
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                addToast(`Arquivo inválido: ${file.name}. Use JPEG, PNG ou WebP.`, 'error');
                continue;
            }

            // Validação inline de tamanho (10MB)
            const maxSizeMB = 10;
            const maxSizeBytes = maxSizeMB * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                addToast(`Imagem muito grande: ${file.name} (${sizeMB}MB). Máximo ${maxSizeMB}MB.`, 'error');
                continue;
            }

            let fileToUpload: File | Blob = file;

            // Apply watermark if configured
            if (watermarkUrl) {
                try {
                    const { applyWatermark } = await import('../lib/watermarkHelper');
                    const watermarkedBlob = await applyWatermark(file, watermarkUrl);
                    fileToUpload = watermarkedBlob;
                    console.log('✅ Watermark applied to image');
                } catch (error) {
                    console.error('Error applying watermark, uploading original:', error);
                    // Continue with original file if watermark fails
                }
            }

            // ⚡ COMPRESSÃO - Browser-compatible (mantém qualidade)
            let finalFile: File | Blob = fileToUpload;

            try {
                const options = {
                    maxSizeMB: 2,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: 'image/webp',
                    initialQuality: 0.85
                };

                const compressedFile = await imageCompression(fileToUpload as File, options);
                finalFile = compressedFile;

                const originalMB = (file.size / (1024 * 1024)).toFixed(2);
                const compressedMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
                const reduction = Math.round((1 - compressedFile.size / file.size) * 100);

                console.log(`🚀 Comprimida: ${originalMB}MB → ${compressedMB}MB (${reduction}% redução)`);
            } catch (error) {
                console.error('Erro ao comprimir, usando original:', error);
                finalFile = fileToUpload;
            }

            // Gerar nome único
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const extension = finalFile.type === 'image/webp' ? 'webp' : file.name.split('.').pop();
            const uniqueName = `${timestamp}_${random}.${extension}`;
            const filePath = `${user?.id}/${uniqueName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('property-images')
                .upload(filePath, finalFile, {
                    contentType: finalFile.type,
                    upsert: false
                });

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                addToast('Erro ao fazer upload da imagem: ' + uploadError.message, 'error');
                setUploading(false);
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            if (publicUrlData) {
                uploadedImageUrls.push(publicUrlData.publicUrl);
            }
        }

        setImages(prev => [...prev, ...uploadedImageUrls]);
        setUploading(false);

        if (watermarkUrl) {
            addToast(`${files.length} foto(s) enviada(s) com marca d'água!`, 'success');
        }
    };

    const handleTourUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            addToast('O arquivo deve ter no máximo 50MB.', 'error');
            return;
        }

        setUploadingTour(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `tour_${Math.random()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            if (publicUrlData) {
                setFormData(prev => ({ ...prev, tourVirtualUrl: publicUrlData.publicUrl }));
                addToast('Tour 360º enviado com sucesso!', 'success');
            }
        } catch (error: any) {
            console.error('Error uploading tour:', error);
            addToast('Erro ao enviar tour: ' + error.message, 'error');
        } finally {
            setUploadingTour(false);
        }
    };

    // BLOCKING UI FOR TRIAL LIMIT
    if (reachedLimit) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                        <AlertTriangle className="text-amber-500" size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Limite do Plano Atingido</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Você atingiu o limite de <strong>{TRIAL_LIMIT} imóveis</strong> disponíveis no seu período de teste.
                        Para continuar cadastrando e expandindo sua carteira, faça um upgrade.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/upgrade')}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 group"
                        >
                            <Sparkles size={20} className="group-hover:animate-pulse" />
                            Fazer Upgrade Agora
                        </button>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-gray-300 font-medium rounded-xl transition-colors border border-slate-700"
                        >
                            Voltar ao Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-0 md:mt-6 max-w-5xl mx-auto pb-12">


            {/* Rejection Banner */}
            {rejectionData && propertyStatus === 'reprovado' && (
                <div className="mb-8 bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex items-start">
                        <AlertTriangle className="text-red-400 mr-4 flex-shrink-0 mt-1" size={24} />
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-200 mb-2">
                                Atenção: Este anúncio foi reprovado
                            </h3>
                            <div className="bg-slate-800 p-4 rounded-3xl border border-red-900/30 mb-4">
                                <p className="font-bold text-red-300 mb-1">Motivo da Reprovação:</p>
                                <p className="text-gray-300 whitespace-pre-line">
                                    {rejectionData.reason}
                                </p>
                            </div>
                            <p className="text-sm text-red-300">
                                Por favor, corrija os problemas apontados abaixo e salve o anúncio novamente.
                                Ele será enviado automaticamente para uma nova análise.
                            </p>

                            {rejectionData.history && rejectionData.history.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-red-800">
                                    <p className="text-md font-bold text-red-400 uppercase mb-2 flex items-center">
                                        <History size={12} className="mr-1" /> Histórico de Reprovações
                                    </p>
                                    <div className="space-y-3">
                                        {rejectionData.history.map((item: any, idx: number) => (
                                            <div key={idx} className="text-md text-gray-400 border-b border-slate-700 pb-2 last:border-0">
                                                <div className="font-bold mb-1">{new Date(item.data).toLocaleDateString()}</div>
                                                {item.razoes && item.razoes.length > 0 && (
                                                    <div className="mb-1">
                                                        <span className="font-semibold">Motivos: {item.razoes.join('; ')} </span>
                                                    </div>
                                                )}
                                                {item.motivo && (
                                                    <div>
                                                        <span className="font-semibold">Obs:</span> {item.motivo}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Stepper - Mobile Horizontal Scroll / Desktop Centered */}
            <div className="mb-14 sticky top-[64px] md:static md:z-auto bg-slate-950/80 backdrop-blur-xl py-2 md:py-6 -mx-4 px-4 md:mx-0 md:px-0 border-b border-white/5 md:border-none z-20">
                <div className="max-w-4xl mx-auto flex flex-row justify-between items-center overflow-x-auto no-scrollbar gap-4 md:gap-0 snap-x py-4">

                    {steps.map((s) => {
                        let isCompleted = step > s.num;
                        let isCurrent = step === s.num;

                        return (
                            <button
                                key={s.num}
                                onClick={() => changeStep(s.num)}
                                className={`flex flex-shrink-0 flex-col items-center relative group min-w-[85px] snap-center focus:outline-none transition-all duration-300 ${isCurrent ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div
                                    className={`w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] flex items-center justify-center font-bold border transition-all duration-500 shadow-2xl
                                    ${isCompleted || isCurrent
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-emerald-500/20'
                                            : 'bg-slate-900 border-white/5 text-slate-500'
                                        }`}
                                >
                                    {isCompleted ? <Check size={22} strokeWidth={3} /> : <s.icon size={20} className={isCurrent ? 'animate-pulse' : ''} />}

                                    {/* Active Glow */}
                                    {isCurrent && (
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full -z-10 animate-pulse"></div>
                                    )}
                                </div>
                                <span className={`mt-3 text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-colors
                                    ${isCompleted || isCurrent ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {s.label}
                                </span>

                                {/* Mobile Active Indicator */}
                                {isCurrent && (
                                    <motion.div
                                        layoutId="activeStep"
                                        className="md:hidden h-1 w-6 bg-emerald-400 rounded-full mt-2"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Form Content */}
            <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-6 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* STEP 1: LOCALIZAÇÃO E DADOS BÁSICOS */}
                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Header Section */}
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 shadow-inner">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Dados Principais</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Dados fundamentais e endereço do seu imóvel</p>
                            </div>
                        </div>
                        <div className="grid gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Título do Anúncio <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium placeholder:text-slate-700"
                                    placeholder="Ex: Lindo Apartamento no Centro com Vista Mar"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Operação <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="operacaoId"
                                            value={formData.operacaoId}
                                            onChange={handleInputChange}
                                            className="w-full px-6 py-4 pr-12 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all appearance-none font-medium"
                                        >
                                            <option value="" className="bg-slate-900">Selecione...</option>
                                            {operacoes.map(op => (
                                                <option key={op.id} value={op.id} className="bg-slate-900">{op.tipo}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                            <Tag size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Tipo de Imóvel <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="tipoImovelId"
                                            value={formData.tipoImovelId}
                                            onChange={handleInputChange}
                                            className="w-full px-6 py-4 pr-12 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all appearance-none font-medium"
                                        >
                                            <option value="" className="bg-slate-900">Selecione...</option>
                                            {tiposDisponiveis.map(tipo => (
                                                <option key={tipo.id} value={tipo.id} className="bg-slate-900">{tipo.tipo}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                            <Home size={18} />
                                        </div>
                                    </div>
                                    {isTemporada && <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-2 ml-1 flex items-center gap-1.5"><Sparkles size={12} /> Sugerido para Temporada</p>}
                                </div>

                                {/* Subtipo - Hidden for Temporada */}
                                {!isTemporada && (
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Subtipo <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="subtipoImovelId"
                                                value={formData.subtipoImovelId}
                                                onChange={handleInputChange}
                                                className="w-full px-6 py-4 pr-12 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all appearance-none font-medium"
                                            >
                                                <option value="" className="bg-slate-900">Selecione...</option>
                                                {subtiposImovel
                                                    .filter(sub => !formData.tipoImovelId || sub.tipo_imovel === formData.tipoImovelId)
                                                    .map(sub => (
                                                        <option key={sub.id} value={sub.id} className="bg-slate-900">{sub.subtipo}</option>
                                                    ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                                <Wand2 size={18} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-8 pt-10 border-t border-white/5">
                            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Localização Precisa</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Endereço detalhado para exibição no mapa</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="col-span-2 lg:col-span-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">CEP <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleInputChange}
                                        onBlur={handleCepBlur}
                                        maxLength={9}
                                        className={`w-full px-6 py-4 rounded-2xl bg-slate-950/40 border focus:ring-4 outline-none text-white transition-all font-medium placeholder:text-slate-700 ${cepError ? 'border-red-500/50 focus:ring-red-500/10' : 'border-white/5 focus:border-primary-500/50 focus:ring-primary-500/10'}`}
                                        placeholder="00000-000"
                                    />
                                    {isLoadingCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary-500" size={18} />}
                                </div>
                                {cepError && <p className="text-[10px] text-red-400 font-bold uppercase mt-2 ml-1 flex items-center gap-1.5"><AlertCircle size={12} /> {cepError}</p>}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Endereço <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium placeholder:text-slate-700"
                                    placeholder="Rua, Avenida..."
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Número</label>
                                <input
                                    type="text"
                                    name="number"
                                    value={formData.number}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium placeholder:text-slate-700"
                                    placeholder="123"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Complemento</label>
                                <input
                                    type="text"
                                    name="complement"
                                    value={formData.complement}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium placeholder:text-slate-700"
                                    placeholder="Apto 101"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Bairro <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="neighborhood"
                                    value={formData.neighborhood}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Cidade <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium"
                                />
                            </div>

                            <div className="col-span-1 lg:max-w-[120px]">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">UF <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    maxLength={2}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all uppercase font-medium"
                                />
                            </div>
                        </div>

                        {/* Manual Geocoding Test Button (if automatic fails) */}
                        {formData.city && !formData.latitude && (
                            <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] animate-in zoom-in duration-500">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-amber-200/80 font-medium leading-relaxed">
                                            <strong className="text-amber-400">Buscando...</strong><br />
                                            Clique abaixo para tentar localizar manualmente:
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setIsLoadingCep(true);
                                        try {
                                            const coords = await geocodeAddress({
                                                street: formData.address || '',
                                                number: formData.number || 's/n',
                                                neighborhood: formData.neighborhood || '',
                                                city: formData.city,
                                                state: formData.state,
                                                postalCode: formData.cep.replace(/\D/g, '')
                                            });

                                            if (coords) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    latitude: coords.latitude.toString(),
                                                    longitude: coords.longitude.toString()
                                                }));
                                                addToast('Coordenadas localizadas!', 'success');
                                            } else {
                                                addToast('Endereço não encontrado no mapa.', 'error');
                                            }
                                        } catch (error) {
                                            addToast('Erro ao buscar coordenadas.', 'error');
                                        } finally {
                                            setIsLoadingCep(false);
                                        }
                                    }}
                                    disabled={isLoadingCep}
                                    className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center disabled:opacity-50 active:scale-95 shadow-xl shadow-amber-500/20"
                                >
                                    {isLoadingCep ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2" size={18} />
                                            Localizando...
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="mr-2" size={18} strokeWidth={3} />
                                            Localizar no Mapa
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Coordinate Info */}
                        {formData.latitude && formData.longitude && (
                            <div className="mt-8 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-left duration-500">
                                <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="text-xs">
                                    <p className="font-black text-emerald-400 uppercase tracking-widest mb-1">Localização Confirmada</p>
                                    <p className="text-slate-400 font-medium">{formData.latitude}, {formData.longitude}</p>
                                </div>
                            </div>
                        )}

                        {/* Interactive Map - Shows automatically after coordinates are fetched */}
                        {formData.latitude && formData.longitude && (
                            <div className="mt-6">
                                <h4 className="text-lg font-bold text-white mb-4">Localização no Mapa</h4>
                                <DraggableMap
                                    latitude={parseFloat(formData.latitude)}
                                    longitude={parseFloat(formData.longitude)}
                                    address={`${formData.address}, ${formData.number} - ${formData.neighborhood}, ${formData.city}/${formData.state}`}
                                    onLocationChange={(lat, lng) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            latitude: lat.toString(),
                                            longitude: lng.toString()
                                        }));
                                    }}
                                    onAddressChange={(addressData) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            cep: addressData.cep || prev.cep,
                                            address: addressData.address || prev.address,
                                            neighborhood: addressData.neighborhood || prev.neighborhood,
                                            city: addressData.city || prev.city,
                                            state: addressData.state || prev.state
                                        }));
                                        addToast('Localização e endereço atualizados!', 'success');
                                    }}
                                />
                            </div>
                        )}

                        {formData.latitude && (
                            <div className="mt-4 p-3 bg-blue-900/20 border-blue-900/30 rounded-2xl flex items-center text-sm text-blue-300">
                                <MapPin size={16} className="mr-2" />
                                Coordenadas localizadas: {formData.latitude}, {formData.longitude}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: FINANCEIRO */}
                {step === 2 && (
                    <div className="space-y-10">
                        {/* Header Section */}
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Finanças e Comercial</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Valores, taxas e condições de negócio</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Lógica para determinar visibilidade baseada na operação */}
                            {(() => {
                                const operacaoNome = operacoes.find(op => op.id === formData.operacaoId)?.tipo?.toLowerCase() || '';
                                const isVenda = operacaoNome.includes('venda') && !isTemporada;
                                const isLocacao = (operacaoNome.includes('locação') || operacaoNome.includes('aluguel')) && !isTemporada;

                                return (
                                    <>
                                        <div className="space-y-8">
                                            {/* Temporada Fields */}
                                            {isTemporada && (
                                                <>
                                                    <div className="group">
                                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">🏖️ Valor da Diária</label>
                                                        <div className="relative">
                                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-black">R$</div>
                                                            <input
                                                                type="text"
                                                                name="valorDiaria"
                                                                value={formData.valorDiaria}
                                                                onChange={handleInputChange}
                                                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none text-white transition-all font-black text-xl placeholder:text-slate-800"
                                                                placeholder="0,00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="group">
                                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">📅 Valor Mensal (opcional)</label>
                                                        <div className="relative">
                                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-black">R$</div>
                                                            <input
                                                                type="text"
                                                                name="valorMensal"
                                                                value={formData.valorMensal}
                                                                onChange={handleInputChange}
                                                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none text-white transition-all font-black text-xl placeholder:text-slate-800"
                                                                placeholder="0,00"
                                                            />
                                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600">
                                                                <Calendar size={18} />
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-medium mt-2 ml-1 italic">Para estadias longas ou mensalistas</p>
                                                    </div>
                                                </>
                                            )}

                                            {/* Venda Fields */}
                                            {isVenda && (
                                                <div className="group">
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Valor de Venda</label>
                                                    <div className="relative">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-black">R$</div>
                                                        <input
                                                            type="text"
                                                            name="salePrice"
                                                            value={formData.salePrice}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-black text-xl placeholder:text-slate-800"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Locação Fields */}
                                            {isLocacao && (
                                                <div className="group">
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Valor de Locação</label>
                                                    <div className="relative">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-black">R$</div>
                                                        <input
                                                            type="text"
                                                            name="rentPrice"
                                                            value={formData.rentPrice}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-black text-xl placeholder:text-slate-800"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-8">
                                            {/* Condomínio - Para LOCAÇÃO ou VENDA de Apartamento */}
                                            {!isTemporada && (isLocacao || (isVenda && tiposImovel.find(t => t.id === formData.tipoImovelId)?.tipo?.toLowerCase().includes('apartamento'))) && (
                                                <div className="group">
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Condomínio (Mês)</label>
                                                    <div className="relative">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-black">R$</div>
                                                        <input
                                                            type="text"
                                                            name="condoFee"
                                                            value={formData.condoFee}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {!isTemporada && (
                                                <div className="group">
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">IPTU (Ano)</label>
                                                    <div className="relative">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-black">R$</div>
                                                        <input
                                                            type="text"
                                                            name="iptu"
                                                            value={formData.iptu}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 space-y-4">
                                                {!isTemporada && isLocacao && (
                                                    <label className="flex items-center group cursor-pointer select-none">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.taxasInclusas}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, taxasInclusas: e.target.checked }))}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-12 h-6 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500/20 border border-white/5 transition-all"></div>
                                                            <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full transition-all peer-checked:left-7 peer-checked:bg-emerald-500 shadow-lg"></div>
                                                        </div>
                                                        <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover:text-slate-200 transition-colors">
                                                            Taxas inclusas no valor?
                                                        </span>
                                                    </label>
                                                )}

                                                {!isTemporada && isVenda && (
                                                    <label className="flex items-center group cursor-pointer select-none">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.aceitaFinanciamento}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, aceitaFinanciamento: e.target.checked }))}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-12 h-6 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500/20 border border-white/5 transition-all"></div>
                                                            <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full transition-all peer-checked:left-7 peer-checked:bg-emerald-500 shadow-lg"></div>
                                                        </div>
                                                        <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover:text-slate-200 transition-colors">
                                                            Aceita Financiamento?
                                                        </span>
                                                    </label>
                                                )}
                                            </div>

                                            {/* Temporada info box */}
                                            {isTemporada && (
                                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl animate-in fade-in zoom-in duration-500">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                                            <Sparkles size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Modo Temporada Ativo</p>
                                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                                O valor da diária será o destaque. Estadias longas poderão ver o valor mensal como opção preferencial.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Partnership Field - Hidden for Trial Users */}
                        {!isTrial && (
                            <div className="mt-12 p-8 bg-slate-950/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -z-10 transition-all group-hover:bg-primary-500/10"></div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Aceita Parceria?</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Colabore com outros corretores e amplie seus ganhos</p>
                                        </div>
                                    </div>

                                    <label className="flex items-center cursor-pointer select-none">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.aceitaParceria}
                                                onChange={(e) => setFormData(prev => ({ ...prev, aceitaParceria: e.target.checked }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-16 h-8 bg-slate-800 rounded-full peer peer-checked:bg-primary-500/20 border border-white/5 transition-all"></div>
                                            <div className="absolute left-1.5 top-1.5 w-5 h-5 bg-slate-500 rounded-full transition-all peer-checked:left-9 peer-checked:bg-primary-500 shadow-xl"></div>
                                        </div>
                                        <span className="ml-4 text-xs font-black text-white uppercase tracking-widest min-w-[40px]">
                                            {formData.aceitaParceria ? 'SIM' : 'NÃO'}
                                        </span>
                                    </label>
                                </div>

                                <AnimatePresence>
                                    {formData.aceitaParceria && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl relative">
                                                <div className="flex gap-4">
                                                    <div className="p-2 h-fit rounded-lg bg-red-500/10 text-red-500 shrink-0">
                                                        <AlertTriangle size={24} />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-[14px] font-black text-red-400 uppercase tracking-[0.2em]">Condições Importantes</p>
                                                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                                            Ao aceitar, VOCÊ CONCORDA COM A DIVISÃO DA COMISSÃO PADRÃO (FIFTY 50/50) estabelecida pela Mercado.
                                                            <br className="mb-2" />
                                                            <span className="text-slate-400 italic block mt-2 pt-2 border-t border-red-500/10 animate-pulse">A Plataforma não intermedia e nem se responsabiliza pelas parcerias realizadas entre os Corretores Parceiros.</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: DETALHES DO IMÓVEL */}
                {step === 3 && (
                    <div className="space-y-10">
                        {/* Header Section */}
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shadow-inner">
                                <Home size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Atributos e Detalhes</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Características físicas e diferenciais únicos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                            {[
                                { name: 'bedrooms', label: 'Quartos', icon: null },
                                { name: 'suites', label: 'Suítes', icon: null },
                                { name: 'bathrooms', label: 'Banheiros', icon: null },
                                { name: 'garage', label: 'Vagas', icon: null },
                            ].map((field) => (
                                <div key={field.name} className="group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">{field.label}</label>
                                    <input
                                        type="number"
                                        name={field.name}
                                        value={formData[field.name as keyof PropertyFormData] as string}
                                        onChange={handleInputChange}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-white transition-all font-black text-center"
                                    />
                                </div>
                            ))}

                            <div className="col-span-1 group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Área Privativa <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        name="privateArea"
                                        value={formData.privateArea}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className="w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-white transition-all font-black text-xl placeholder:text-slate-800"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs">m²</div>
                                </div>
                            </div>

                            <div className="col-span-1 group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Área Total</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        name="totalArea"
                                        value={formData.totalArea}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className="w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-white transition-all font-black text-xl placeholder:text-slate-800"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs">m²</div>
                                </div>
                            </div>
                        </div>


                        <div className="mb-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Comodidades e Infraestrutura</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Selecione os diferenciais que o imóvel oferece</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {availableFeatures.map(feature => (
                                    <label
                                        key={feature.id}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${formData.features.includes(feature.nome)
                                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                                            : 'bg-slate-950/20 border-white/5 text-slate-500 hover:bg-slate-950/40 hover:border-white/10'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.features.includes(feature.nome)}
                                            onChange={() => handleFeatureToggle(feature.nome)}
                                        />
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${formData.features.includes(feature.nome)
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-slate-800'
                                            }`}>
                                            {formData.features.includes(feature.nome) && <Check size={12} strokeWidth={4} className="text-slate-950" />}
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-wider">{feature.nome}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="relative pt-10 border-t border-white/5">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                        <Wand2 size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Descrição do Imóvel</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Destaque os pontos fortes e diferenciais únicos</p>
                                    </div>
                                </div>
                                <button
                                    onClick={generateDescription}
                                    disabled={isGeneratingDesc}
                                    className="flex items-center h-fit text-[10px] font-black uppercase tracking-widest px-5 py-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isGeneratingDesc ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />}
                                    Gerar Texto com IA
                                </button>
                            </div>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full px-8 py-6 rounded-[2rem] bg-slate-950/40 border border-white/5 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-white h-52 resize-none transition-all text-sm leading-relaxed whitespace-pre-wrap placeholder:text-slate-800"
                                placeholder="Descreva os pontos fortes e diferenciais únicos do imóvel..."
                            ></textarea>

                            {/* Generated Description Options */}
                            <AnimatePresence>
                                {generatedDescriptions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-8 space-y-4"
                                    >
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Opções Geradas pela IA <span className="text-slate-600 font-medium lowercase">— Clique para aplicar</span></p>
                                        <div className="grid grid-cols-1 gap-4">
                                            {generatedDescriptions.map((desc, idx) => {
                                                const labels = ['Conservadora', 'Popular (com emojis)', 'Mix'];
                                                const isSelected = formData.description === desc;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, description: desc }))}
                                                        className={`w-full text-left p-6 rounded-[2rem] border transition-all relative overflow-hidden group ${isSelected
                                                            ? 'border-blue-500/50 bg-blue-500/5'
                                                            : 'border-white/5 bg-slate-950/20 hover:border-white/10 hover:bg-slate-950/40'
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-0 right-0 p-4 text-blue-500">
                                                                <Check size={18} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                        <div className="flex items-start">
                                                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center mr-4 transition-all ${isSelected ? 'bg-blue-500 text-slate-950' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                                                                }`}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>Estilo {labels[idx]}</p>
                                                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{desc}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* STEP 4: FOTOS E MÍDIA */}
                {step === 4 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Header Section */}
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 shadow-inner">
                                <UploadCloud size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Fotos e Mídia</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Gerencie a identidade visual do seu imóvel</p>
                            </div>
                        </div>

                        {/* Info/Dica - estilizada no padrão premium */}
                        {images.length > 0 && (
                            <div className="p-6 bg-primary-500/5 border border-white/5 rounded-[2rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -z-10"></div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                                        <Info size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Dica de Especialista</p>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            Arraste as imagens para reordenar. A <span className="text-white font-bold">primeira imagem</span> será a capa principal do seu anúncio. Use fotos horizontais e bem iluminadas para maior engajamento.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grid de Imagens */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {images.map((img, idx) => {
                                const isDestaque = idx === 0;

                                return (
                                    <div
                                        key={idx}
                                        draggable={true}
                                        style={{ touchAction: 'none' }}
                                        onDragStart={(e) => {
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('text/html', idx.toString());
                                            setDraggedIndex(idx);
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const draggedIdx = parseInt(e.dataTransfer.getData('text/html'));
                                            if (draggedIdx === idx) return;

                                            const newImages = [...images];
                                            const [draggedImage] = newImages.splice(draggedIdx, 1);
                                            newImages.splice(idx, 0, draggedImage);
                                            setImages(newImages);
                                            setDraggedIndex(null);
                                        }}
                                        onTouchStart={(e) => {
                                            setDraggedIndex(idx);
                                            setTouchStartY(e.touches[0].clientY);
                                        }}
                                        onTouchMove={(e) => {
                                            if (draggedIndex === null) return;
                                            const touch = e.touches[0];
                                            const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                            const targetDiv = element?.closest('[data-image-index]');

                                            if (targetDiv) {
                                                const targetIndex = parseInt(targetDiv.getAttribute('data-image-index') || '');
                                                if (!isNaN(targetIndex) && targetIndex !== draggedIndex) {
                                                    targetDiv.classList.add('border-primary-500', 'ring-4', 'ring-primary-500/20');
                                                    setTimeout(() => {
                                                        targetDiv.classList.remove('border-primary-500', 'ring-4', 'ring-primary-500/20');
                                                    }, 100);
                                                }
                                            }
                                        }}
                                        onTouchEnd={(e) => {
                                            if (draggedIndex === null) return;
                                            const touch = e.changedTouches[0];
                                            const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                            let targetDiv = element?.closest('[data-image-index]');
                                            if (!targetDiv && element?.tagName === 'IMG') {
                                                targetDiv = element.parentElement?.closest('[data-image-index]');
                                            }
                                            if (!targetDiv && element?.parentElement) {
                                                targetDiv = element.parentElement.closest('[data-image-index]');
                                            }

                                            if (targetDiv) {
                                                const targetIndex = parseInt(targetDiv.getAttribute('data-image-index') || '');
                                                if (!isNaN(targetIndex) && targetIndex !== draggedIndex) {
                                                    const newImages = [...images];
                                                    const [draggedImage] = newImages.splice(draggedIndex, 1);
                                                    newImages.splice(targetIndex, 0, draggedImage);
                                                    setImages(newImages);
                                                }
                                            }
                                            setDraggedIndex(null);
                                            setTouchStartY(0);
                                        }}
                                        data-image-index={idx}
                                        className={`group aspect-square rounded-[2.5rem] overflow-hidden border-2 relative transition-all duration-500 cursor-grab active:cursor-grabbing ${isDestaque
                                            ? 'border-primary-500 shadow-2xl shadow-primary-500/20 scale-100'
                                            : 'border-white/5 hover:border-primary-500/50 grayscale-[0.3] hover:grayscale-0'
                                            } ${draggedIndex === idx ? 'opacity-20 scale-90 blur-sm' : ''}`}
                                    >
                                        {/* Featured Badge */}
                                        {isDestaque && (
                                            <div className="absolute top-4 left-4 z-20 overflow-hidden rounded-xl">
                                                <div className="absolute inset-0 bg-primary-500 blur-sm animate-pulse"></div>
                                                <div className="relative bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 flex items-center gap-2 border border-white/10 uppercase tracking-widest leading-none">
                                                    <Star size={10} className="fill-primary-500 text-primary-500" />
                                                    Capa Principal
                                                </div>
                                            </div>
                                        )}

                                        <img
                                            src={img}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={`Property ${idx + 1}`}
                                            draggable={false}
                                        />

                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        {/* Actions */}
                                        <div className="absolute inset-x-0 bottom-4 px-4 flex justify-between items-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-30">
                                            <div className="flex items-center gap-2 text-white/70">
                                                <Maximize2 size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Preview</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleImageDelete(idx)}
                                                className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 hover:scale-110 active:scale-95 shadow-xl transition-all duration-300"
                                                title="Remover foto"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Drag handle hint for mobile/non-hover */}
                                        {!isDestaque && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                                    <Search size={20} className="text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Card de Upload Compacto - como próxima imagem */}
                            <label className="aspect-square rounded-[2.5rem] overflow-hidden border-2 border-dashed border-white/10 hover:border-primary-500 bg-slate-950/40 cursor-pointer transition-all duration-500 group flex flex-col items-center justify-center relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-center p-6 relative z-10">
                                    <div className="w-16 h-16 bg-white/5 text-slate-400 group-hover:text-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 border border-white/5">
                                        {uploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
                                    </div>
                                    <p className="text-xs font-black text-white uppercase tracking-widest mb-1">
                                        {uploading ? 'Enviando...' : images.length > 0 ? 'Adicionar' : 'Upload'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        {images.length > 0 ? 'Mais fotos' : 'Fotos aqui'}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Media Section */}
                        <div className="pt-8 border-t border-white/5 space-y-12">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                                    <Play size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Mídias Imersivas</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Adicione vídeos e tours virtuais</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Vídeo do Imóvel (YouTube/Vimeo)</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors">
                                            <Play size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            name="videoUrl"
                                            value={formData.videoUrl}
                                            onChange={handleInputChange}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium"
                                            placeholder="https://youtube.com/watch?v=..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tour 360º (Link)</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors">
                                            <Maximize2 size={20} />
                                        </div>
                                        <input
                                            type="url"
                                            name="tourVirtualUrl"
                                            value={formData.tourVirtualUrl}
                                            onChange={handleInputChange}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white transition-all font-medium"
                                            placeholder="https://exemplo.com/tour360"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Observações Adicionais</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Notas importantes para o cliente</p>
                                </div>
                            </div>

                            <div className="relative group">
                                <textarea
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 rounded-3xl bg-slate-950/40 border border-white/5 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 outline-none text-white h-40 resize-none transition-all text-sm leading-relaxed whitespace-pre-wrap font-medium"
                                    placeholder="Informações adicionais sobre o imóvel que você acha pertinente o Cliente saber..."
                                ></textarea>
                                <div className="absolute bottom-4 right-6 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                    Público
                                </div>
                            </div>
                        </div>

                        {/* IA Detected Tags */}
                        {detectedTags.length > 0 && (
                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500 shadow-lg shadow-primary-500/10">
                                        <Sparkles size={20} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Inteligência Visual</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Características detectadas automaticamente</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {detectedTags.map((tag, idx) => (
                                        <div
                                            key={idx}
                                            className="px-4 py-2 bg-primary-500/5 border border-primary-500/20 rounded-xl flex items-center gap-2 group hover:bg-primary-500/10 hover:border-primary-500/40 transition-all duration-300"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">{tag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 5: SMART REVIEW & VALIDATION */}
                {step === 5 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="text-center space-y-4">
                            <div className="inline-flex p-4 rounded-3xl bg-primary-500/10 text-primary-500 mb-2 shadow-inner">
                                <ShieldCheck size={48} />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Revisão Final</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] max-w-xl mx-auto">
                                Verifique se todos os dados estão corretos antes de publicar seu anúncio exclusivo na IziBrokerz.
                            </p>
                        </div>

                        {/* Validation Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                            {/* 1. Localização */}
                            {(() => {
                                const isValid =
                                    formData.title &&
                                    formData.operacaoId &&
                                    formData.tipoImovelId &&
                                    formData.cep &&
                                    formData.address &&
                                    formData.city &&
                                    formData.state &&
                                    formData.neighborhood;

                                return (
                                    <div className={`p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group ${isValid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -z-10 transition-all ${isValid ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}></div>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-2xl ${isValid ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20 shadow-lg' : 'bg-amber-500/10 text-amber-500 shadow-amber-500/20 shadow-lg'}`}>
                                                {isValid ? <Check size={24} /> : <AlertTriangle size={24} />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        Etapa 01: Identidade
                                                    </p>
                                                    {!isValid && (
                                                        <button onClick={() => changeStep(1)} className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest underline decoration-2 underline-offset-4">Corrigir</button>
                                                    )}
                                                </div>
                                                <h4 className="text-lg font-black text-white uppercase tracking-tight">Dados de Identificação</h4>
                                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                    {isValid ? 'Títulos, tipos e localização devidamente preenchidos.' : 'Faltam informações essenciais de localização ou títulos.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 2. Financeiro */}
                            {(() => {
                                const operacaoTipo = operacoes.find(o => o.id === formData.operacaoId)?.tipo?.toLowerCase() || '';
                                const isVenda = operacaoTipo.includes('venda') && !isTemporada;
                                const isLocacao = (operacaoTipo.includes('locação') || operacaoTipo.includes('aluguel')) && !isTemporada;

                                const isValid =
                                    (isTemporada && (formData.valorDiaria || formData.valorMensal)) ||
                                    (isVenda && formData.salePrice) ||
                                    (isLocacao && formData.rentPrice);

                                return (
                                    <div className={`p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group ${isValid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -z-10 transition-all ${isValid ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}></div>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-2xl ${isValid ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20 shadow-lg' : 'bg-amber-500/10 text-amber-500 shadow-amber-500/20 shadow-lg'}`}>
                                                {isValid ? <Check size={24} /> : <AlertTriangle size={24} />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        Etapa 02: Comercial
                                                    </p>
                                                    {!isValid && (
                                                        <button onClick={() => changeStep(2)} className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest underline decoration-2 underline-offset-4">Corrigir</button>
                                                    )}
                                                </div>
                                                <h4 className="text-lg font-black text-white uppercase tracking-tight">Valoração Comercial</h4>
                                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                    {isValid ? 'Os valores de venda ou locação foram definidos.' : 'Certifique-se de informar os preços do imóvel.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 3. Detalhes */}
                            {(() => {
                                const isValid = formData.description && formData.description.length > 20;

                                return (
                                    <div className={`p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group ${isValid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -z-10 transition-all ${isValid ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}></div>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-2xl ${isValid ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20 shadow-lg' : 'bg-blue-500/10 text-blue-500 shadow-blue-500/20 shadow-lg'}`}>
                                                {isValid ? <Check size={24} /> : <Info size={24} />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isValid ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                        Etapa 03: Atributos
                                                    </p>
                                                    <button onClick={() => changeStep(3)} className={`text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 ${isValid ? 'text-slate-400 hover:text-white' : 'text-blue-500 hover:text-blue-400'}`}>Revisar</button>
                                                </div>
                                                <h4 className="text-lg font-black text-white uppercase tracking-tight">Detalhes e Comodidades</h4>
                                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                    {isValid ? 'Descrição e características físicas revisadas.' : 'Uma descrição detalhada ajuda a converter mais contatos.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 4. Fotos */}
                            {(() => {
                                const isValid = images.length >= 1;

                                return (
                                    <div className={`p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group ${isValid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -z-10 transition-all ${isValid ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}></div>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-2xl ${isValid ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20 shadow-lg' : 'bg-red-500/10 text-red-500 shadow-red-500/20 shadow-lg'}`}>
                                                {isValid ? <Check size={24} /> : <AlertCircle size={24} />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        Etapa 04: Visual
                                                    </p>
                                                    <button onClick={() => changeStep(4)} className={`text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 ${isValid ? 'text-slate-400 hover:text-white' : 'text-red-500 hover:text-red-400'}`}>
                                                        {isValid ? 'Adicionar' : 'Corrigir'}
                                                    </button>
                                                </div>
                                                <h4 className="text-lg font-black text-white uppercase tracking-tight">Galeria de Mídia</h4>
                                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                    {isValid ? `${images.length} imagem(ns) pronta(s) para exibição.` : 'É obrigatório o envio de pelo menos uma foto de capa.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Smart Preview Card */}
                        <div className="p-12 bg-slate-950/40 border border-white/5 rounded-[3rem] max-w-5xl mx-auto relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] rounded-full -z-10"></div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                                <div className="lg:col-span-1">
                                    <div className="aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative">
                                        {images.length > 0 ? (
                                            <img src={images[0]} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                <UploadCloud size={48} className="text-slate-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <div className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-[0.2em]">Preview do Card</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-primary-500 text-white text-[8px] font-black rounded-lg uppercase tracking-widest leading-none">
                                                {operacoes.find(o => o.id === formData.operacaoId)?.tipo || 'Imóvel'}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tiposImovel.find(t => t.id === formData.tipoImovelId)?.nome || 'Residencial'}</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">{formData.title || 'Título do Imóvel'}</h2>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <MapPin size={14} className="text-primary-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider">{formData.neighborhood ? `${formData.neighborhood}, ${formData.city}` : 'Localização não definida'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-6">
                                        <div className="text-center">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Quartos</p>
                                            <p className="text-lg font-black text-white">{formData.bedrooms || '0'}</p>
                                        </div>
                                        <div className="text-center border-x border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Vagas</p>
                                            <p className="text-lg font-black text-white">{formData.garage || '0'}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Área</p>
                                            <p className="text-lg font-black text-white">{formData.privateArea || '0'}<span className="text-[10px] ml-0.5">m²</span></p>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline justify-between pt-2">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Investimento</p>
                                            <p className="text-4xl font-black text-primary-500 leading-none">
                                                <span className="text-lg mr-2">R$</span>
                                                {(() => {
                                                    const operacaoTipo = operacoes.find(o => o.id === formData.operacaoId)?.tipo?.toLowerCase() || '';
                                                    if (isTemporada) return formData.valorDiaria || formData.valorMensal || 'Consulte';
                                                    if (operacaoTipo.includes('venda')) return formData.salePrice || 'Consulte';
                                                    return formData.rentPrice || 'Consulte';
                                                })()}
                                            </p>
                                        </div>
                                        {isTemporada && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">Modo Temporada</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FINAL ACTION BUTTON */}
                        <div className="flex flex-col items-center gap-6 mt-8">
                            {(() => {
                                // Global Validation Check
                                const operacaoTipo = operacoes.find(o => o.id === formData.operacaoId)?.tipo?.toLowerCase() || '';
                                const isVenda = operacaoTipo.includes('venda') && !isTemporada;
                                const isLocacao = (operacaoTipo.includes('locação') || operacaoTipo.includes('aluguel')) && !isTemporada;

                                const isFormValid =
                                    formData.title &&
                                    formData.operacaoId &&
                                    formData.tipoImovelId &&
                                    formData.cep &&
                                    formData.address &&
                                    formData.city &&
                                    formData.state &&
                                    formData.neighborhood &&
                                    (
                                        (isTemporada && (formData.valorDiaria || formData.valorMensal)) ||
                                        (isVenda && formData.salePrice) ||
                                        (isLocacao && formData.rentPrice)
                                    ) &&
                                    images.length >= 1;

                                return (
                                    <>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!isFormValid || loading}
                                            className={`
                                                    group relative px-16 py-6 rounded-[2.5rem] font-bold text-xl transition-all duration-500 overflow-hidden
                                                    ${isFormValid
                                                    ? 'bg-gradient-to-r from-primary-600 to-primary-400 text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.5)] scale-100 hover:scale-105 active:scale-95'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 grayscale'}
                                                `}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer"></div>
                                            <div className="flex items-center justify-center gap-4 relative z-10">
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={28} />
                                                        <span className="uppercase tracking-widest text-sm font-black">Processando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {isFormValid ? <ShieldCheck size={28} className="text-white" /> : <AlertTriangle size={28} />}
                                                        <span className="uppercase tracking-widest text-sm font-black">
                                                            {isFormValid ? (editingId ? 'Confirmar Atualização' : 'Publicar este Imóvel') : 'Preencha os dados obrigatórios'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                        {!isFormValid && (
                                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest animate-pulse">Existem campos obrigatórios pendentes de atenção</p>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>


            {/* Footer Actions (Hidden on Step 5 because it has its own main action button) */}
            {
                step < 5 && (
                    <div className="flex flex-row justify-between items-center mt-12 pt-10 border-t border-white/5 gap-4">
                        <button
                            onClick={() => step > 1 ? changeStep(step - 1) : navigate('/dashboard')}
                            className="flex-1 px-4 py-3.5 md:px-8 md:py-4 rounded-[2rem] bg-slate-900 border border-white/5 text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all active:scale-95"
                        >
                            {step === 1 ? 'Cancelar' : 'Voltar'}
                        </button>
                        <button
                            onClick={() => changeStep(step + 1)}
                            className="flex-1 px-4 py-3.5 md:px-10 md:py-4 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-95 group"
                        >
                            Próxima Etapa
                            <Check size={18} className="group-hover:scale-110 transition-transform hidden md:block" />
                        </button>
                    </div>
                )
            }
        </div >
    );
}
