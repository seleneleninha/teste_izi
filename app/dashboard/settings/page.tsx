"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Camera, Save, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';

export default function SettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        sobrenome: '',
        apelido: '',
        email: '',
        whatsapp: '',
        creci: '',
        uf_creci: '',
        cpf: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        show_address: false,
        instagram: '',
        facebook: '',
        linkedin: '',
        youtube: '',
    });

    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('perfis')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    nome: data.nome || '',
                    sobrenome: data.sobrenome || '',
                    apelido: data.apelido || '',
                    email: data.email || user.email || '',
                    whatsapp: data.whatsapp || '',
                    creci: data.creci || '',
                    uf_creci: data.uf_creci || '',
                    cpf: data.cpf || '',
                    cep: data.cep || '',
                    logradouro: data.logradouro || '',
                    numero: data.numero || '',
                    complemento: data.complemento || '',
                    bairro: data.bairro || '',
                    cidade: data.cidade || '',
                    uf: data.uf || '',
                    show_address: data.show_address || false,
                    instagram: data.instagram || '',
                    facebook: data.facebook || '',
                    linkedin: data.linkedin || '',
                    youtube: data.youtube || '',
                });
                setAvatar(data.avatar || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !user) return;

        const file = e.target.files[0];
        const fileName = `${user.id}/avatar-${Date.now()}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setAvatar(urlData.publicUrl);
            addToast('Foto atualizada!', 'success');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            addToast('Erro ao fazer upload da foto', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);

        try {
            const { error } = await supabase
                .from('perfis')
                .update({
                    ...formData,
                    avatar,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            addToast('Perfil atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            addToast('Erro ao atualizar perfil', 'error');
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seu perfil e preferências</p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                {/* Avatar */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Foto de Perfil</h2>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={avatar || `https://ui-avatars.com/api/?name=${formData.nome || 'User'}&size=200`}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500"
                            />
                            <label className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-white rounded-full cursor-pointer hover:bg-emerald-600 transition-colors">
                                <Camera size={16} />
                                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            </label>
                        </div>
                        <div>
                            <p className="text-gray-900 dark:text-white font-semibold">{formData.nome} {formData.sobrenome}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email}</p>
                        </div>
                    </div>
                </div>

                {/* Personal Info */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="text-emerald-500" size={20} />
                        Dados Pessoais
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sobrenome</label>
                            <input type="text" name="sobrenome" value={formData.sobrenome} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apelido</label>
                            <input type="text" name="apelido" value={formData.apelido} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
                            <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(99) 99999-9999" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CRECI</label>
                            <input type="text" name="creci" value={formData.creci} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF CRECI</label>
                            <input type="text" name="uf_creci" value={formData.uf_creci} onChange={handleChange} maxLength={2} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Endereço</h2>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                            <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                            <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                            <input type="text" name="uf" value={formData.uf} onChange={handleChange} maxLength={2} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" name="show_address" checked={formData.show_address} onChange={handleChange} className="w-5 h-5 rounded text-emerald-500" />
                        <span className="text-gray-700 dark:text-gray-300">Mostrar endereço no meu site</span>
                    </label>
                </div>

                {/* Social Media */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Redes Sociais</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram</label>
                            <input type="url" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook</label>
                            <input type="url" name="facebook" value={formData.facebook} onChange={handleChange} placeholder="https://facebook.com/..." className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn</label>
                            <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube</label>
                            <input type="url" name="youtube" value={formData.youtube} onChange={handleChange} placeholder="https://youtube.com/..." className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white" />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
