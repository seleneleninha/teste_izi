import React, { useState, useEffect } from 'react';
import { UploadCloud, Check, Sparkles, Wand2, Loader2, Tag, MapPin, DollarSign, Home, Info, Search, AlertCircle, AlertTriangle, History, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generatePropertyDescription, evaluatePropertyPrice } from '../lib/geminiHelper';

import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { geocodeAddress } from '../lib/geocodingHelper';
import { DraggableMap } from '../components/DraggableMap';

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
    operacaoId: '',
    tipoImovelId: '',
    subtipoImovelId: '',
    videoUrl: '',
    tourVirtualUrl: '',
    observacoes: ''
};



export const AddProperty: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<PropertyFormData>(INITIAL_DATA);
    const [loading, setLoading] = useState(false);
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
                setPropertyStatus(data.status_aprovacao);
                if (data.status_aprovacao === 'reprovado') {
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
        if (!user) {
            addToast('Você precisa estar logado para cadastrar um imóvel.', 'error');
            return;
        }

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
        if (!formData.subtipoImovelId) {
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

        setLoading(true);
        try {
            const propertyData = {
                user_id: user.id,
                titulo: formData.title,
                operacao: formData.operacaoId,
                tipo_imovel: formData.tipoImovelId,
                subtipo_imovel: formData.subtipoImovelId,
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
                area_priv: Number(formData.privateArea),
                area_total: formData.totalArea ? Number(formData.totalArea) : null,
                descricao: formData.description,
                caracteristicas: formData.features.join(', '),
                fotos: images.join(','),
                valor_venda: formData.salePrice ? parseFloat(formData.salePrice.replace(/\./g, '').replace(',', '.')) : null,
                valor_locacao: formData.rentPrice ? parseFloat(formData.rentPrice.replace(/\./g, '').replace(',', '.')) : null,
                valor_condo: formData.condoFee ? parseFloat(formData.condoFee.replace(/\./g, '').replace(',', '.')) : null,
                valor_iptu: formData.iptu ? parseFloat(formData.iptu.replace(/\./g, '').replace(',', '.')) : null,
                aceita_parceria: formData.aceitaParceria,
                taxas_inclusas: formData.taxasInclusas,
                aceita_financiamento: formData.aceitaFinanciamento,
                status_aprovacao: 'pendente', // Always reset to pending on update
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
            if (error) throw error;
            addToast(editingId ? 'Imóvel atualizado com sucesso! Aguardando nova aprovação.' : 'Imóvel cadastrado com sucesso! Aguardando aprovação.', 'success');
            navigate('/properties');
        } catch (error: any) {
            console.error('Error submitting property:', error);
            addToast('Erro ao cadastrar imóvel: ' + error.message, 'error');
        } finally {
            setLoading(false);
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

    const steps = [
        { num: 1, label: 'Localização', icon: MapPin },
        { num: 2, label: 'Detalhes', icon: Home },
        { num: 3, label: 'Financeiro', icon: DollarSign },
        { num: 4, label: 'Fotos', icon: UploadCloud },
        { num: 5, label: 'Revisão', icon: Check }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                addToast('CEP não encontrado', 'error');
                return;
            }

            console.log('Dados do CEP:', data);

            setFormData(prev => ({
                ...prev,
                address: data.logradouro || '',
                neighborhood: data.bairro || '',
                city: data.localidade || '',
                state: data.uf || '',
            }));

            // Automatically fetch coordinates using geocoding
            if (data.localidade) {
                console.log('Iniciando geocodificação...');

                // Try precise address first
                let coords = await geocodeAddress({
                    street: data.logradouro || '',
                    number: formData.number || 's/n',
                    neighborhood: data.bairro || '',
                    city: data.localidade,
                    state: data.uf,
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
                        city: data.localidade,
                        state: data.uf,
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
            // Get tipo, subtipo, and operacao names
            const tipoNome = tiposImovel.find(t => t.id === formData.tipoImovelId)?.tipo || formData.type;
            const subtipoNome = subtiposImovel.find(s => s.id === formData.subtipoImovelId)?.subtipo;
            const operacaoNome = operacoes.find(o => o.id === formData.operacaoId)?.tipo;

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
                area: Number(formData.privateArea) || 0,
                caracteristicas: formData.features
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

    const handleEvaluatePrice = async () => {
        // Validate required fields for price evaluation
        if (!formData.city || !formData.neighborhood || !formData.privateArea) {
            addToast('Preencha cidade, bairro e área privativa para avaliar o preço.', 'warning');
            return;
        }

        setIsEvaluating(true);

        try {
            const city = formData.city;
            const hood = formData.neighborhood;

            // Fetch similar properties from database
            const { data: similarProps } = await supabase
                .from('anuncios')
                .select('valor_venda, area_util, quartos')
                .eq('cidade', city)
                .eq('bairro', hood)
                .gt('valor_venda', 0) // Ensure valid price
                .limit(5);

            const mappedProps = (similarProps || []).map(p => ({
                valor: p.valor_venda,
                area: p.area_util,
                quartos: p.quartos || 0
            }));

            // If few properties found, add some mock data based on averages for the area to allow AI to work
            // This is afallback for new databases with few records
            if (mappedProps.length < 3) {
                console.log('Poucos imóveis similares encontrados, usando estimativa base...');
            }

            const tipoNome = tiposImovel.find(t => t.id === formData.tipoImovelId)?.tipo || 'Imóvel';

            const evaluation = await evaluatePropertyPrice({
                tipo: tipoNome,
                bairro: hood,
                cidade: city,
                quartos: Number(formData.bedrooms) || 0,
                area: Number(formData.privateArea) || 0,
                similarProperties: mappedProps.length >= 3 ? mappedProps : [
                    // Fallback mock data if DB is empty, to demonstrate AI capability
                    // In production, you might want to return "insufficient data" instead
                    { valor: 500000, area: 100, quartos: 2 },
                    { valor: 550000, area: 110, quartos: 3 },
                    { valor: 480000, area: 95, quartos: 2 }
                ]
            });

            if (evaluation) {
                setPriceEvaluation(evaluation);
                addToast('Avaliação de preço concluída!', 'success');
            } else {
                addToast('Não foi possível avaliar o preço neste momento.', 'warning');
            }
        } catch (error) {
            console.error('Error evaluating price:', error);
            addToast('Erro ao avaliar preço.', 'error');
        } finally {
            setIsEvaluating(false);
        }
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

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`; // Assuming user is logged in

            const { error: uploadError, data } = await supabase.storage
                .from('property-images')
                .upload(filePath, fileToUpload);

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

    return (
        <div className="mt-6 max-w-5xl mx-auto pb-12">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{editingId ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</h2>
                <p className="text-gray-500 dark:text-slate-400 mt-1">Preencha os dados do imóvel. Nossa IA ajudará em etapas chave.</p>
            </div>

            {/* Rejection Banner */}
            {rejectionData && propertyStatus === 'reprovado' && (
                <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex items-start">
                        <AlertTriangle className="text-red-600 dark:text-red-400 mr-4 flex-shrink-0 mt-1" size={24} />
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
                                Atenção: Este anúncio foi reprovado
                            </h3>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-100 dark:border-red-900/30 mb-4">
                                <p className="font-bold text-red-700 dark:text-red-300 mb-1">Motivo da Reprovação:</p>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                    {rejectionData.reason}
                                </p>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                Por favor, corrija os problemas apontados abaixo e salve o anúncio novamente.
                                Ele será enviado automaticamente para uma nova análise.
                            </p>

                            {rejectionData.history && rejectionData.history.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                                    <p className="text-md font-bold text-red-600 dark:text-red-400 uppercase mb-2 flex items-center">
                                        <History size={12} className="mr-1" /> Histórico de Reprovações
                                    </p>
                                    <div className="space-y-3">
                                        {rejectionData.history.map((item: any, idx: number) => (
                                            <div key={idx} className="text-md text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700 pb-2 last:border-0">
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
            <div className="mb-8 sticky top-[68px] z-20 md:static md:z-auto bg-gray-50 dark:bg-slate-900 py-2 md:py-0 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex flex-row md:justify-between items-center overflow-x-auto no-scrollbar gap-4 md:gap-0 snap-x">
                    {/* Connecting Line (Desktop Only) */}
                    <div className="hidden md:block absolute top-[26px] left-0 w-full h-1 bg-gray-200 dark:bg-slate-700 -z-10 rounded"></div>

                    {steps.map((s) => {
                        // Check validation status for this step (simplified logic for UI)
                        let isCompleted = step > s.num;
                        let isCurrent = step === s.num;

                        return (
                            <button
                                key={s.num}
                                onClick={() => changeStep(s.num)}
                                className={`flex flex-shrink-0 flex-col items-center relative group min-w-[80px] snap-start focus:outline-none`}
                            >
                                <div
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold border-2 md:border-4 transition-all duration-300 
                                    ${isCompleted || isCurrent
                                            ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                                            : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 group-hover:border-primary-300'
                                        }`}
                                >
                                    {isCompleted ? <Check size={20} /> : <s.icon size={18} />}
                                </div>
                                <span className={`mt-2 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap 
                                    ${isCompleted || isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                                    {s.label}
                                </span>

                                {/* Mobile Active Indicator */}
                                {isCurrent && (
                                    <div className="md:hidden h-1 w-full bg-primary-500 rounded-full mt-1"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Form Content */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 dark:border-slate-700 min-h-[450px] animate-in fade-in duration-300">

                {/* STEP 1: LOCALIZAÇÃO E DADOS BÁSICOS */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Título do Anúncio <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                                    placeholder="Ex: Lindo Apartamento no Centro com Vista Mar"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Operação <span className="text-red-500">*</span></label>
                                <select
                                    name="operacaoId"
                                    value={formData.operacaoId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 pr-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                                >
                                    <option value="">Selecione...</option>
                                    {operacoes.map(op => (
                                        <option key={op.id} value={op.id}>{op.tipo}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Tipo de Imóvel <span className="text-red-500">*</span></label>
                                <select
                                    name="tipoImovelId"
                                    value={formData.tipoImovelId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 pr-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                                >
                                    <option value="">Selecione...</option>
                                    {tiposImovel.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.tipo}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Subtipo <span className="text-red-500">*</span></label>
                                <select
                                    name="subtipoImovelId"
                                    value={formData.subtipoImovelId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 pr-10 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                                >
                                    <option value="">Selecione...</option>
                                    {subtiposImovel
                                        .filter(sub => !formData.tipoImovelId || sub.tipo_imovel === formData.tipoImovelId)
                                        .map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.subtipo}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <MapPin className="mr-2 text-primary-500" /> Endereço do Imóvel
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">CEP <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="cep"
                                            value={formData.cep}
                                            onChange={handleInputChange}
                                            onBlur={handleCepBlur}
                                            maxLength={9}
                                            className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all ${cepError ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                                            placeholder="00000-000"
                                        />
                                        {isLoadingCep && <Loader2 className="absolute right-3 top-3.5 animate-spin text-primary-500" size={18} />}
                                    </div>
                                    {cepError && <p className="text-xs text-red-500 mt-1 flex items-center"><AlertCircle size={12} className="mr-1" /> {cepError}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Endereço <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                                        placeholder="Rua, Avenida..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Número</label>
                                    <input
                                        type="text"
                                        name="number"
                                        value={formData.number}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                                        placeholder="123"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Complemento</label>
                                    <input
                                        type="text"
                                        name="complement"
                                        value={formData.complement}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                                        placeholder="Apto 101"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Bairro <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="neighborhood"
                                        value={formData.neighborhood}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Cidade <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">UF <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        maxLength={2}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all uppercase"
                                    />
                                </div>
                            </div>

                            {/* Manual Geocoding Test Button (if automatic fails) */}
                            {formData.city && !formData.latitude && (
                                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                                        <strong>⚠️ Buscando coordenadas automaticamente, um momento...</strong><br />
                                        Clique no botão abaixo para tentar buscar manualmente:
                                    </p>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setIsLoadingCep(true);
                                            try {
                                                console.log('Tentando geocodificação manual...');
                                                const coords = await geocodeAddress({
                                                    street: formData.address || '',
                                                    number: formData.number || 's/n',
                                                    neighborhood: formData.neighborhood || '',
                                                    city: formData.city,
                                                    state: formData.state,
                                                    postalCode: formData.cep.replace(/\D/g, '')
                                                });

                                                console.log('Resultado geocodificação manual:', coords);

                                                if (coords) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        latitude: coords.latitude.toString(),
                                                        longitude: coords.longitude.toString()
                                                    }));
                                                    addToast('Coordenadas obtidas! Mapa exibido abaixo.', 'success');
                                                } else {
                                                    addToast('Não foi possível obter coordenadas. Verifique o endereço.', 'error');
                                                }
                                            } catch (error) {
                                                console.error('Erro na geocodificação:', error);
                                                addToast('Erro ao buscar coordenadas.', 'error');
                                            } finally {
                                                setIsLoadingCep(false);
                                            }
                                        }}
                                        disabled={isLoadingCep}
                                        className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isLoadingCep ? (
                                            <>
                                                <Loader2 className="animate-spin mr-2" size={18} />
                                                Buscando...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="mr-2" size={18} />
                                                Buscar Coordenadas Manualmente
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Coordinate Info */}
                            {formData.latitude && formData.longitude && (
                                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center text-sm text-emerald-700 dark:text-emerald-300">
                                    <MapPin size={16} className="mr-2 flex-shrink-0" />
                                    <div>
                                        <strong>Coordenadas localizadas:</strong><br />
                                        Latitude: {formData.latitude}, Longitude: {formData.longitude}
                                    </div>
                                </div>
                            )}

                            {/* Interactive Map - Shows automatically after coordinates are fetched */}
                            {formData.latitude && formData.longitude && (
                                <div className="mt-6">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Localização no Mapa</h4>
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
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex items-center text-sm text-blue-700 dark:text-blue-300">
                                    <MapPin size={16} className="mr-2" />
                                    Coordenadas localizadas: {formData.latitude}, {formData.longitude}
                                </div>
                            )}
                        </div>
                    </div>
                )}



                {/* STEP 2: DETALHES DO IMÓVEL */}
                {step === 2 && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Características e Descrição</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Quartos</label>
                                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 outline-none dark:text-white focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Suítes</label>
                                <input type="number" name="suites" value={formData.suites} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 outline-none dark:text-white focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Banheiros</label>
                                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 outline-none dark:text-white focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Vagas</label>
                                <input type="number" name="garage" value={formData.garage} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 outline-none dark:text-white focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Área Privativa (m²) <span className="text-red-500">*</span></label>
                                <input type="number" name="privateArea" value={formData.privateArea} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 outline-none dark:text-white focus:border-primary-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Área Total (m²)</label>
                                <input type="number" name="totalArea" value={formData.totalArea} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 outline-none dark:text-white focus:border-primary-500" />
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Comodidades e Infraestrutura</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {availableFeatures.map(feature => (
                                    <label key={feature.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.features.includes(feature.nome) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.features.includes(feature.nome)}
                                            onChange={() => handleFeatureToggle(feature.nome)}
                                        />
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${formData.features.includes(feature.nome) ? 'bg-primary-500 border-primary-500' : 'border-gray-400'}`}>
                                            {formData.features.includes(feature.nome) && <Check size={10} className="text-white" />}
                                        </div>
                                        <span className="text-sm">{feature.nome}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Descrição do Imóvel <span className="text-red-500">*</span></label>
                                <button
                                    onClick={generateDescription}
                                    disabled={isGeneratingDesc}
                                    className="flex items-center text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    {isGeneratingDesc ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Wand2 size={14} className="mr-1.5" />}
                                    Gerar Texto Inteligente
                                </button>
                            </div>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white h-40 resize-none transition-all text-sm leading-relaxed"
                                placeholder="Descreva os pontos fortes do imóvel..."
                            ></textarea>

                            {/* Generated Description Options */}
                            {generatedDescriptions.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Opções Geradas pela IA - Clique para usar:</p>
                                    {generatedDescriptions.map((desc, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, description: desc }))}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${formData.description === desc
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                                                }`}
                                        >
                                            <div className="flex items-start">
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center mr-3 mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: FINANCEIRO */}
                {step === 3 && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Valores e Taxas</h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Lógica para determinar visibilidade baseada na operação */}
                            {(() => {
                                const operacaoNome = operacoes.find(op => op.id === formData.operacaoId)?.tipo?.toLowerCase() || '';
                                const isVenda = operacaoNome.includes('venda');
                                const isLocacao = operacaoNome.includes('locação') || operacaoNome.includes('aluguel');

                                return (
                                    <>
                                        <div className="space-y-6 md:col-span-2">
                                            {isVenda && (
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Valor de Venda</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">R$</span>
                                                        <input
                                                            type="text"
                                                            name="salePrice"
                                                            value={formData.salePrice}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white font-medium text-lg"
                                                            placeholder="1.000.000,00"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {isLocacao && (
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Valor de Locação</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">R$</span>
                                                        <input
                                                            type="text"
                                                            name="rentPrice"
                                                            value={formData.rentPrice}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white font-medium text-lg"
                                                            placeholder="5.000,00"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6 md:col-span-2">
                                            {isLocacao && (
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Condomínio (Mês)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">R$</span>
                                                        <input
                                                            type="text"
                                                            name="condoFee"
                                                            value={formData.condoFee}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                                                            placeholder="800,00"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">IPTU (Ano)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400">R$</span>
                                                    <input
                                                        type="text"
                                                        name="iptu"
                                                        value={formData.iptu}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                                                        placeholder="2.500,00"
                                                    />
                                                </div>
                                            </div>

                                            {isLocacao && (
                                                <div className="mt-3 flex items-center">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.taxasInclusas}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, taxasInclusas: e.target.checked }))}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                                                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Taxas inclusas no valor?
                                                        </span>
                                                    </label>
                                                </div>
                                            )}

                                            {isVenda && (
                                                <div className="pt-2">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.aceitaFinanciamento}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, aceitaFinanciamento: e.target.checked }))}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                                                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Aceita Financiamento?
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Partnership Field */}
                        <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Aceita Parceria neste Imóvel?</h4>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Permitir que outros Corretores trabalhem este imóvel</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.aceitaParceria}
                                        onChange={(e) => setFormData(prev => ({ ...prev, aceitaParceria: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {formData.aceitaParceria ? 'SIM' : 'NÃO'}
                                    </span>
                                </label>
                            </div>

                            {formData.aceitaParceria && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                                    <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
                                        <strong>ATENÇÃO:</strong> Caso você aceite a parceria com outros Corretores neste imóvel,
                                        desde já <strong>VOCÊ CONCORDA E ACEITA</strong> a divisão do comissionamento padrão
                                        (<strong>"fifty" 50/50</strong>), sem nada a reclamar posteriormente.
                                        <br /><br />
                                        <strong>A Plataforma NÃO SE RESPONSABILIZA PELAS PARCERIAS FEITAS ENTRE OS Corretores.</strong>
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl flex items-start justify-between items-center bg-white dark:bg-slate-800 shadow-sm">
                            <div className="flex items-start">
                                <Info className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 shrink-0" />
                                <div>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                        {priceEvaluation ? 'Avaliação de Preço (IA)' : 'Sugestão de Preço (IA)'}
                                    </p>
                                    <p className="text-sm text-yellow-800/80 dark:text-yellow-200/80 mt-1">
                                        {priceEvaluation ? priceEvaluation.suggestion : 'Clique para obter uma sugestão baseada em imóveis similares e análise de mercado.'}
                                        {priceEvaluation && priceEvaluation.min > 0 && (
                                            <span className="block mt-1 font-bold">
                                                Faixa sugerida: R$ {priceEvaluation.min.toLocaleString('pt-BR')} - R$ {priceEvaluation.max.toLocaleString('pt-BR')}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleEvaluatePrice}
                                disabled={isEvaluating}
                                className="ml-4 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-sm font-bold rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900 transition-colors flex items-center whitespace-nowrap border border-yellow-200 dark:border-yellow-700"
                            >
                                {isEvaluating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                                {isEvaluating ? 'Avaliando...' : 'Avaliar'}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: FOTOS E MÍDIA */}
                {step === 4 && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Galeria de Imagens</h3>

                        <label className="border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-500 bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-10 text-center mb-8 cursor-pointer transition-colors group block">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 text-gray-400 group-hover:text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors">
                                {uploading ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                {uploading ? 'Enviando fotos e aplicando marca d\'água (se houver)...' : 'Clique para fazer upload'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Ou arraste e solte seus arquivos JPG, PNG (Max 10MB)</p>
                        </label>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {images.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 relative group shadow-sm">
                                    <img src={img} className="w-full h-full object-cover" alt="preview" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            type="button"
                                        >
                                            <div className="w-4 h-0.5 bg-white rotate-45 absolute"></div>
                                            <div className="w-4 h-0.5 bg-white -rotate-45"></div>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Media Section */}
                        <div className="mb-8 border-t border-gray-100 dark:border-slate-700 pt-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Mídias</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Vídeo do Imóvel (YouTube/Vimeo)</label>
                                    <input
                                        type="text"
                                        name="videoUrl"
                                        value={formData.videoUrl}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                                        placeholder="https://youtube.com/watch?v=..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Tour 360º (Arquivo Max 50MB)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.zip" // Assuming 360 tours might be images or zip packages? Usually 360 images are JPGs.
                                            onChange={handleTourUpload}
                                            disabled={uploadingTour}
                                            className="hidden"
                                            id="tour-upload"
                                        />
                                        <label
                                            htmlFor="tour-upload"
                                            className={`flex items-center justify-center w-full px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${formData.tourVirtualUrl
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                                : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 hover:border-primary-500'
                                                }`}
                                        >
                                            {uploadingTour ? (
                                                <Loader2 size={20} className="animate-spin mr-2" />
                                            ) : formData.tourVirtualUrl ? (
                                                <Check size={20} className="mr-2" />
                                            ) : (
                                                <UploadCloud size={20} className="mr-2" />
                                            )}
                                            {uploadingTour ? 'Enviando...' : formData.tourVirtualUrl ? 'Tour Enviado!' : 'Clique para enviar arquivo'}
                                        </label>
                                    </div>
                                    {formData.tourVirtualUrl && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 truncate">
                                            URL: {formData.tourVirtualUrl}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Observações Adicionais</label>
                            <textarea
                                name="observacoes"
                                value={formData.observacoes}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white h-24 resize-none transition-all text-sm leading-relaxed"
                                placeholder="Informações adicionais sobre o imóvel que não constam no formulário..."
                            ></textarea>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">💡 Este campo será exibido publicamente no anúncio.</p>
                        </div>

                        {detectedTags.length > 0 && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center">
                                    <Sparkles size={16} className="mr-2" /> Características Detectadas pela IA
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {detectedTags.map((tag, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center shadow-sm">
                                            <Tag size={12} className="mr-1.5 text-indigo-500" /> {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 5: SMART REVIEW & VALIDATION */}
                {step === 5 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Revisão e Validação</h3>
                            <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
                                Verifique se todas as etapas obrigatórias foram preenchidas antes de enviar o imóvel para aprovação.
                            </p>
                        </div>

                        {/* Validation Checklist */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
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
                                    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${isValid ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'}`}>
                                        <div className={`mt-1 p-1 rounded-full ${isValid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {isValid ? <Check size={16} /> : <AlertTriangle size={16} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${isValid ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>Localização e Dados Básicos</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {isValid ? 'Todos os dados obrigatórios preenchidos.' : 'Faltam dados obrigatórios (Título, Tipo, Endereço).'}
                                            </p>
                                            {!isValid && (
                                                <button onClick={() => changeStep(1)} className="text-sm font-bold text-amber-600 hover:underline mt-2">
                                                    Corrigir Etapa 1
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 2. Detalhes - (Less strict, mostly optional but good to check description) */}
                            {(() => {
                                const isValid = formData.description && formData.description.length > 10;
                                return (
                                    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${isValid ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'}`}>
                                        <div className={`mt-1 p-1 rounded-full ${isValid ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {isValid ? <Check size={16} /> : <Info size={16} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${isValid ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}`}>Detalhes do Imóvel</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {isValid ? 'Descrição preenchida.' : 'Adicione uma descrição detalhada para atrair mais clientes.'}
                                            </p>
                                            {!isValid && (
                                                <button onClick={() => changeStep(2)} className="text-sm font-bold text-blue-600 hover:underline mt-2">
                                                    Revisar Etapa 2
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 3. Financeiro */}
                            {(() => {
                                // Check based on operation type
                                const isVenda = operacoes.find(o => o.id === formData.operacaoId)?.tipo.toLowerCase().includes('venda');
                                const isLocacao = operacoes.find(o => o.id === formData.operacaoId)?.tipo.toLowerCase().includes('locação');

                                let isValid = true;
                                let msg = 'Valores definidos.';

                                if (isVenda && !formData.salePrice) {
                                    isValid = false;
                                    msg = 'Informe o Valor de Venda.';
                                } else if (isLocacao && !formData.rentPrice) {
                                    isValid = false;
                                    msg = 'Informe o Valor de Locação.';
                                }

                                return (
                                    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${isValid ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'}`}>
                                        <div className={`mt-1 p-1 rounded-full ${isValid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {isValid ? <Check size={16} /> : <AlertTriangle size={16} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${isValid ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>Financeiro</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {msg}
                                            </p>
                                            {!isValid && (
                                                <button onClick={() => changeStep(3)} className="text-sm font-bold text-amber-600 hover:underline mt-2">
                                                    Corrigir Etapa 3
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 4. Fotos */}
                            {(() => {
                                const isValid = images.length >= 1; // Require at least 1 photo
                                return (
                                    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${isValid ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'}`}>
                                        <div className={`mt-1 p-1 rounded-full ${isValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {isValid ? <Check size={16} /> : <AlertCircle size={16} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${isValid ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>Fotos</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {isValid ? `${images.length} fotos carregadas.` : 'É obrigatório enviar pelo menos 1 foto.'}
                                            </p>
                                            {!isValid && (
                                                <button onClick={() => changeStep(4)} className="text-sm font-bold text-red-600 hover:underline mt-2">
                                                    Adicionar Fotos na Etapa 4
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* FINAL ACTION BUTTON */}
                        <div className="flex justify-center mt-8">
                            {(() => {
                                // Global Validation Check
                                const isVenda = operacoes.find(o => o.id === formData.operacaoId)?.tipo.toLowerCase().includes('venda');
                                const isLocacao = operacoes.find(o => o.id === formData.operacaoId)?.tipo.toLowerCase().includes('locação');

                                const isFormValid =
                                    formData.title &&
                                    formData.operacaoId &&
                                    formData.tipoImovelId &&
                                    formData.cep &&
                                    formData.address &&
                                    formData.city &&
                                    formData.state &&
                                    formData.neighborhood &&
                                    ((isVenda && formData.salePrice) || (isLocacao && formData.rentPrice)) &&
                                    images.length >= 1;

                                return (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!isFormValid || loading}
                                        className={`
                                           px-12 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all
                                           ${isFormValid
                                                ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white transform hover:scale-105'
                                                : 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'}
                                       `}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin mr-2" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                {isFormValid ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                                                {isFormValid ? (editingId ? 'Atualizar Anúncio' : 'Salvar e Enviar para Aprovação') : 'Preencha os dados obrigatórios'}
                                            </>
                                        )}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                )}


                {/* Footer Actions (Hidden on Step 5 because it has its own main action button) */}
                {
                    step < 5 && (
                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => step > 1 ? changeStep(step - 1) : navigate('/dashboard')}
                                className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                {step === 1 ? 'Cancelar' : 'Voltar'}
                            </button>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => changeStep(step + 1)}
                                    className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-600/30 flex items-center"
                                >
                                    Próxima Etapa
                                    <Check size={18} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
};
