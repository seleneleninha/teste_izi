"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, MapPin, DollarSign, Home, X, Camera, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';

export default function EditPropertyPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { addToast } = useToast();
    const propertyId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const [operations, setOperations] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        tipo_imovel: '',
        operacao: '',
        valor_venda: '',
        valor_locacao: '',
        quartos: '',
        banheiros: '',
        vagas: '',
        area_priv: '',
        area_total: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        aceita_parceria: false,
        aceita_financiamento: false,
        caracteristicas: '',
    });

    const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
    const [newPhotos, setNewPhotos] = useState<File[]>([]);
    const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);

    useEffect(() => {
        fetchOptions();
        if (propertyId) {
            fetchProperty();
        }
    }, [propertyId]);

    const fetchOptions = async () => {
        try {
            const { data: types } = await supabase.from('tipo_imovel').select('tipo').order('tipo');
            const { data: ops } = await supabase.from('operacao').select('tipo').order('tipo');

            if (types) setPropertyTypes(types.map(t => t.tipo));
            if (ops) setOperations(ops.map(o => o.tipo));
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const fetchProperty = async () => {
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select(`*, tipo_imovel (tipo), operacao (tipo)`)
                .eq('id', propertyId)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    titulo: data.titulo || '',
                    descricao: data.descricao || '',
                    tipo_imovel: data.tipo_imovel?.tipo || '',
                    operacao: data.operacao?.tipo || '',
                    valor_venda: data.valor_venda?.toString() || '',
                    valor_locacao: data.valor_locacao?.toString() || '',
                    quartos: data.quartos?.toString() || '',
                    banheiros: data.banheiros?.toString() || '',
                    vagas: data.vagas?.toString() || '',
                    area_priv: data.area_priv?.toString() || '',
                    area_total: data.area_total?.toString() || '',
                    cep: data.cep || '',
                    logradouro: data.logradouro || '',
                    numero: data.numero || '',
                    complemento: data.complemento || '',
                    bairro: data.bairro || '',
                    cidade: data.cidade || '',
                    uf: data.uf || '',
                    aceita_parceria: data.aceita_parceria || false,
                    aceita_financiamento: data.aceita_financiamento || false,
                    caracteristicas: data.caracteristicas || '',
                });
                setExistingPhotos(data.fotos ? data.fotos.split(',').filter(Boolean) : []);
            }
        } catch (error) {
            console.error('Error fetching property:', error);
            addToast('Erro ao carregar imóvel', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewPhotos(prev => [...prev, ...files]);
            files.forEach(file => {
                setNewPhotoUrls(prev => [...prev, URL.createObjectURL(file)]);
            });
        }
    };

    const removeExistingPhoto = (index: number) => {
        setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewPhoto = (index: number) => {
        setNewPhotos(prev => prev.filter((_, i) => i !== index));
        setNewPhotoUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);

        try {
            // Upload new photos
            const uploadedUrls: string[] = [];
            for (const photo of newPhotos) {
                const fileName = `${user.id}/${Date.now()}-${photo.name}`;
                const { error } = await supabase.storage
                    .from('property-photos')
                    .upload(fileName, photo);

                if (!error) {
                    const { data: urlData } = supabase.storage
                        .from('property-photos')
                        .getPublicUrl(fileName);
                    uploadedUrls.push(urlData.publicUrl);
                }
            }

            // Combine existing and new photos
            const allPhotos = [...existingPhotos, ...uploadedUrls];

            // Update property
            const { error: updateError } = await supabase
                .from('anuncios')
                .update({
                    titulo: formData.titulo,
                    descricao: formData.descricao,
                    tipo_imovel: formData.tipo_imovel,
                    operacao: formData.operacao,
                    valor_venda: formData.valor_venda ? parseFloat(formData.valor_venda) : null,
                    valor_locacao: formData.valor_locacao ? parseFloat(formData.valor_locacao) : null,
                    quartos: parseInt(formData.quartos) || 0,
                    banheiros: parseInt(formData.banheiros) || 0,
                    vagas: parseInt(formData.vagas) || 0,
                    area_priv: parseFloat(formData.area_priv) || 0,
                    area_total: parseFloat(formData.area_total) || 0,
                    cep: formData.cep,
                    logradouro: formData.logradouro,
                    numero: formData.numero,
                    complemento: formData.complemento,
                    bairro: formData.bairro,
                    cidade: formData.cidade,
                    uf: formData.uf,
                    aceita_parceria: formData.aceita_parceria,
                    aceita_financiamento: formData.aceita_financiamento,
                    caracteristicas: formData.caracteristicas,
                    fotos: allPhotos.join(','),
                    updated_at: new Date().toISOString()
                })
                .eq('id', propertyId);

            if (updateError) throw updateError;

            addToast('Imóvel atualizado com sucesso!', 'success');
            router.push('/dashboard/properties');
        } catch (error) {
            console.error('Error updating property:', error);
            addToast('Erro ao atualizar imóvel', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Imóvel</h1>
                    <p className="text-gray-500 dark:text-gray-400">Atualize as informações do imóvel</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl">
                {/* Basic Info */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Home className="text-emerald-500" size={20} />
                        Informações Básicas
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                            <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                            <select name="tipo_imovel" value={formData.tipo_imovel} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white">
                                <option value="">Selecione</option>
                                {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operação *</label>
                            <select name="operacao" value={formData.operacao} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white">
                                <option value="">Selecione</option>
                                {operations.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                            <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={4} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white resize-none" />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <DollarSign className="text-emerald-500" size={20} />
                        Valores
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Venda</label>
                            <input type="number" name="valor_venda" value={formData.valor_venda} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Locação</label>
                            <input type="number" name="valor_locacao" value={formData.valor_locacao} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Características</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quartos</label>
                            <input type="number" name="quartos" value={formData.quartos} onChange={handleChange} min="0" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banheiros</label>
                            <input type="number" name="banheiros" value={formData.banheiros} onChange={handleChange} min="0" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vagas</label>
                            <input type="number" name="vagas" value={formData.vagas} onChange={handleChange} min="0" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área (m²)</label>
                            <input type="number" name="area_priv" value={formData.area_priv} onChange={handleChange} min="0" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin className="text-emerald-500" size={20} />
                        Localização
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro *</label>
                            <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade *</label>
                            <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF *</label>
                            <input type="text" name="uf" value={formData.uf} onChange={handleChange} required maxLength={2} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                    </div>
                </div>

                {/* Photos */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Camera className="text-emerald-500" size={20} />
                        Fotos
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {existingPhotos.map((url, index) => (
                            <div key={`existing-${index}`} className="relative aspect-video bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeExistingPhoto(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}

                        {newPhotoUrls.map((url, index) => (
                            <div key={`new-${index}`} className="relative aspect-video bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden border-2 border-emerald-500">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Nova foto ${index + 1}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeNewPhoto(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                    <X size={14} />
                                </button>
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded">Nova</span>
                            </div>
                        ))}

                        <label className="aspect-video bg-gray-100 dark:bg-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors border-2 border-dashed border-gray-300 dark:border-slate-500">
                            <Upload className="text-gray-400 mb-2" size={24} />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Adicionar</span>
                            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Options */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Opções</h2>
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="aceita_parceria" checked={formData.aceita_parceria} onChange={handleChange} className="w-5 h-5 rounded text-emerald-500" />
                            <span className="text-gray-700 dark:text-gray-300">Aceita parceria</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="aceita_financiamento" checked={formData.aceita_financiamento} onChange={handleChange} className="w-5 h-5 rounded text-emerald-500" />
                            <span className="text-gray-700 dark:text-gray-300">Aceita financiamento</span>
                        </label>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button type="button" onClick={() => router.back()} className="px-8 py-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <><Loader2 className="animate-spin" size={20} />Salvando...</> : <><Save size={20} />Salvar Alterações</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
