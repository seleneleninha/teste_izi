import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { useHeader } from '../components/HeaderContext';
import { User, Lock, Bell, Shield, Camera, Trash2, Save, Loader2, Eye, EyeOff, AlertTriangle, ExternalLink, MapPin, Phone, Share2, Instagram, Facebook, Linkedin, Youtube, Twitter, AtSign, Download, Search, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { geocodeAddress } from '../lib/geocodingHelper';
import { checkPasswordStrength, validateEmail, validatePhone, validateCRECI, sanitizeInput } from '../lib/validation';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { DeleteAccountModal } from '../components/DeleteAccountModal';

export const Settings: React.FC = () => {
  const { user, signOut, role } = useAuth();
  const { addToast } = useToast();
  const { setHeaderContent } = useHeader();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'page' | 'branding'>('account');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    sobrenome: '',
    apelido: '',
    email: '',
    phone: '',
    cpf: '',
    creci: '',
    ufCreci: '',
    avatar: '',
    role: '',
    slug: '',
    // Address
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    showAddress: false,
    raioAtuacao: 10,
    // Watermarks
    watermarkLight: '',
    watermarkDark: '',
    marcaDagua: '',
    // Social Media
    instagram: '',
    facebook: '',
    threads: '',
    youtube: '',
    linkedin: '',
    x: '',
    // Welcome Messages
    boasVindas1: '',
    boasVindas2: '',
    // About Page Fields
    sobreMim: '',
    imoveisVendidos: 0,
    clientesAtendidos: 0
  });

  // Password State
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    leads: true,
    messages: true,
    properties: true,
    marketing: false
  });

  // LGPD States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    setHeaderContent(
      <div className="flex flex-col justify-center">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
          Configurações da Conta
        </h2>
        <p className="text-slate-400 text-xs font-medium leading-tight">Gerencie seu perfil, segurança e preferências</p>
      </div>
    );
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (data) {
        setProfile({
          name: data.nome || user?.user_metadata?.name || '',
          sobrenome: data.sobrenome || '',
          apelido: data.apelido || '',
          email: data.email || user?.email || '',
          phone: data.whatsapp || '',
          cpf: data.cpf || '',
          creci: data.creci || '',
          ufCreci: data.uf_creci || '',
          avatar: data.avatar || user?.user_metadata?.avatar_url || '',
          slug: data.slug || '',
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          uf: data.uf || '',
          showAddress: data.show_address || false,
          raioAtuacao: data.raio_atuacao || 10,
          watermarkLight: data.watermark_light || '',
          watermarkDark: data.watermark_dark || '',
          marcaDagua: data.marca_dagua || '',
          instagram: data.instagram || '',
          facebook: data.facebook || '',
          threads: data.threads || '',
          youtube: data.youtube || '',
          linkedin: data.linkedin || '',
          x: data.x || '',
          boasVindas1: data.mensagem_boasvindas || '',
          boasVindas2: data.boasvindas2 || '',
          sobreMim: data.sobre_mim || '',
          imoveisVendidos: data.imoveis_vendidos || 0,
          clientesAtendidos: data.clientes_atendidos || 0
        });

        if (data.preferencias_notificacao) {
          setNotifications(data.preferencias_notificacao);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      setLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setProfile(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        }));

        // Automatically geocode to get lat/lng
        try {
          const coords = await geocodeAddress({
            street: data.logradouro,
            number: profile.numero || '0',
            neighborhood: data.bairro || '',
            city: data.localidade,
            state: data.uf,
            postalCode: cleanCep
          });

          if (coords && user) {
            // Save lat/lng to database immediately
            await supabase
              .from('perfis')
              .update({
                latitude: coords.latitude,
                longitude: coords.longitude
              })
              .eq('id', user.id);

            addToast('Endereço e localização atualizados!', 'success');
          }
        } catch (geoError) {
          console.error('Erro ao geocodificar:', geoError);
          // Don't show error to user, just log it
        }
      } else {
        addToast('CEP não encontrado.', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      addToast('Erro ao buscar CEP.', 'error');
    } finally {
      setLoadingCep(false);
    }
  };

  // --- Profile Handlers ---

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);

      const updates = {
        nome: profile.name,
        sobrenome: profile.sobrenome,
        apelido: profile.apelido || null, // Use null for empty string to avoid unique constraint on ""
        avatar: profile.avatar || null, // Use null instead of empty string
        whatsapp: profile.phone,
        cep: profile.cep,
        logradouro: profile.logradouro,
        numero: profile.numero,
        complemento: profile.complemento,
        bairro: profile.bairro,
        cidade: profile.cidade,
        uf: profile.uf,
        show_address: profile.showAddress,
        raio_atuacao: profile.raioAtuacao || null,
        watermark_light: profile.watermarkLight || null,
        watermark_dark: profile.watermarkDark || null,
        marca_dagua: profile.marcaDagua || null,
        instagram: profile.instagram || null,
        facebook: profile.facebook || null,
        threads: profile.threads || null,
        youtube: profile.youtube || null,
        linkedin: profile.linkedin || null,
        x: profile.x || null,
        mensagem_boasvindas: profile.boasVindas1 || null,
        boasvindas2: profile.boasVindas2 || null,
        sobre_mim: profile.sobreMim || null,
        imoveis_vendidos: profile.imoveisVendidos || null,
        clientes_atendidos: profile.clientesAtendidos || null,
        preferencias_notificacao: notifications,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('perfis')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { name: profile.name, avatar_url: profile.avatar || null }
      });

      addToast('Perfil atualizado com sucesso!', 'success');
      fetchProfile(); // Refresh to get updated slug
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      if (error.code === '23505' && error.message?.includes('perfis_apelido_key')) {
        addToast('Este apelido já está em uso. Por favor, escolha outro.', 'error');
      } else {
        addToast('Erro ao atualizar perfil.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar: publicUrl }));

      await supabase
        .from('perfis')
        .update({
          avatar: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      addToast('Foto de perfil atualizada!', 'success');

    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      addToast('Erro ao fazer upload da foto.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleWatermarkUpload = async (file: File, type: 'light' | 'dark' | 'marca') => {
    if (!file || !user) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `watermark-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/watermarks/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile state based on type
      if (type === 'light') {
        setProfile(prev => ({ ...prev, watermarkLight: publicUrl }));
      } else if (type === 'dark') {
        setProfile(prev => ({ ...prev, watermarkDark: publicUrl }));
      } else {
        setProfile(prev => ({ ...prev, marcaDagua: publicUrl }));
      }

      addToast(`${type === 'marca' ? 'Marca d\'água' : 'Logotipo'} atualizado!`, 'success');

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      addToast('Erro ao fazer upload da imagem.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // --- Security Handlers ---

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast('As senhas não coincidem.', 'error');
      return;
    }

    // ✅ IMPROVED: Validação robusta de senha
    const { score, strength, feedback } = checkPasswordStrength(passwords.newPassword);

    if (strength === 'weak') {
      addToast(`Senha muito fraca. ${feedback.join('. ')}`, 'error');
      return;
    }

    if (strength === 'fair') {
      addToast(`Senha fraca. Recomendações: ${feedback.join(', ')}`, 'warning');
      // Permitir continuar mas com aviso
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;

      addToast('Senha alterada com sucesso!', 'success');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      addToast(error.message || 'Erro ao alterar senha', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- LGPD Functions ---

  const handleExportData = async () => {
    if (!user) return;

    try {
      setExportingData(true);
      addToast('Preparando seus dados...', 'info');

      // 1. Buscar perfil
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .single();

      // 2. Buscar anúncios
      const { data: anunciosData } = await supabase
        .from('anuncios')
        .select('*')
        .eq('user_id', user.id);

      // 3. Buscar parcerias
      const { data: parceriasData } = await supabase
        .from('parcerias')
        .select('*')
        .or(`anunciante_id.eq.${user.id},parceiro_id.eq.${user.id}`);

      // 4. Buscar conversas com IzA (se existir)
      const { data: conversasData } = await supabase
        .from('encomendar_imovel')
        .select('*')
        .eq('user_id', user.id);

      // 5. Montar JSON
      const userData = {
        exportado_em: new Date().toISOString(),
        usuario: {
          id: user.id,
          email: user.email,
          ...perfilData
        },
        anuncios: anunciosData || [],
        parcerias: parceriasData || [],
        encomendas: conversasData || [],
        total_registros: {
          anuncios: anunciosData?.length || 0,
          parcerias: parceriasData?.length || 0,
          encomendas: conversasData?.length || 0
        }
      };

      // 6. Download como JSON
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `izibrokerz_dados_${user.id}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Dados exportados com sucesso! Arquivo baixado.', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      addToast('Erro ao exportar dados. Tente novamente.', 'error');
    } finally {
      setExportingData(false);
    }
  };

  // --- Notification Handlers ---

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveNotifications = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('perfis')
        .update({ preferencias_notificacao: notifications })
        .eq('id', user.id);

      if (error) throw error;
      addToast('Preferências salvas!', 'success');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      addToast('Erro ao salvar preferências.', 'error');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Title moved to Header */}


      {/* Unified Horizontal Tab Navigation */}
      {/* Unified Horizontal Tab Navigation - Mobile First Scroll */}
      <div className="mt-8 mb-8">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-1.5 rounded-2xl inline-flex gap-1 shadow-lg shadow-black/20 overflow-x-auto max-w-full no-scrollbar w-full md:w-auto">

          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-medium
              ${activeTab === 'account'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-600/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            <User size={16} />
            <span>Minha Conta</span>
          </button>

          {role !== 'Cliente' && (
            <>
              <button
                onClick={() => setActiveTab('page')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-medium
                  ${activeTab === 'page'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-600/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                <div className="relative">
                  <MapPin size={16} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
                <span>Página & Conteúdo</span>
              </button>

              <button
                onClick={() => setActiveTab('branding')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-medium
                  ${activeTab === 'branding'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-600/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                <Share2 size={16} />
                <span>Marca & Redes</span>
              </button>
            </>
          )}

        </div>
      </div>

      {/* Content Area */}
      <div className="bg-slate-800/50 rounded-3xl shadow-sm border border-slate-700/50 p-6 md:p-8 min-h-auto backdrop-blur-sm">

        {activeTab === 'account' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" data-tour="profile-settings">

            {/* 1. Header & Avatar */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-slate-800/50 rounded-3xl border border-slate-700">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-600 shadow-lg group-hover:border-emerald-500 transition-colors"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? <Loader2 className="text-white animate-spin" size={24} /> : <Camera className="text-white" size={24} />}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarUpload}
                accept="image/*"
              />
              <div className="text-center md:text-left flex-1">
                <h3 className="text-2xl font-bold text-white">{profile.name} {profile.sobrenome}</h3>
                <p className="text-slate-400 text-sm mb-3">{profile.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-sm font-medium text-gray-200 transition-colors"
                >
                  {uploading ? 'Enviando...' : 'Alterar Foto'}
                </button>
              </div>
            </div>

            {/* 2. Form Grid */}
            <h4 className="text-lg font-bold text-white mb-4 flex items-center"><User size={20} className="mr-2 text-emerald-500" /> Dados Pessoais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Read-Only Fields */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
                <input type="text" value={profile.name} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sobrenome</label>
                <input type="text" value={profile.sobrenome} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input type="text" value={profile.email} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">WhatsApp <span className="text-emerald-500">*</span></label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {role !== 'Cliente' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CPF</label>
                  <input type="text" value={profile.cpf} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CRECI</label>
                  <input type="text" value={profile.creci} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">UF CRECI</label>
                  <input type="text" value={profile.ufCreci} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed" />
                </div>
              </div>
            )}

            {/* 3. Address Section */}
            <div className="mb-8 pt-6 border-t border-slate-700/50">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center"><MapPin size={20} className="mr-2 text-emerald-500" /> Endereço Profissional</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CEP (Busca Automática)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.cep}
                      onChange={e => setProfile({ ...profile, cep: e.target.value })}
                      onBlur={e => fetchCep(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white pl-10 transition-all"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    {loadingCep && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-500">Buscando...</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Logradouro</label>
                  <input type="text" value={profile.logradouro} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Número</label>
                  <input type="text" value={profile.numero} onChange={e => setProfile({ ...profile, numero: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Complemento</label>
                  <input type="text" value={profile.complemento} onChange={e => setProfile({ ...profile, complemento: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Bairro</label>
                  <input type="text" value={profile.bairro} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cidade - UF</label>
                  <input type="text" value={`${profile.cidade} - ${profile.uf}`} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500" />
                </div>
              </div>

              {role !== 'Cliente' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAddress"
                    checked={profile.showAddress}
                    onChange={e => setProfile({ ...profile, showAddress: e.target.checked })}
                    className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="showAddress" className="text-sm text-slate-300 cursor-pointer select-none">
                    Exibir meu endereço completo na minha página pública?
                  </label>
                </div>
              )}
            </div>

            {/* 4. Security Section (Merged) */}
            <div className="mb-8 pt-6 border-t border-slate-700/50">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center"><Lock size={20} className="mr-2 text-emerald-500" /> Segurança</h4>

              <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-700/50 mb-6">
                <h5 className="font-medium text-white mb-3">Alterar Senha</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nova Senha"
                      value={passwords.newPassword}
                      onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 outline-none text-white"
                    />
                    {passwords.newPassword && <div className="mt-2"><PasswordStrengthIndicator password={passwords.newPassword} /></div>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Confirmar Senha"
                      value={passwords.confirmPassword}
                      onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 outline-none text-white"
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !passwords.newPassword}
                      className="px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={handleExportData}
                  disabled={exportingData}
                  className="flex-1 px-4 py-3 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 text-emerald-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {exportingData ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Baixar meus Dados (LGPD)
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 px-4 py-3 bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 text-red-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Excluir Conta
                </button>
              </div>
              <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
            </div>

            <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-sm p-4 -mx-6 -mb-6 md:-mx-8 md:-mb-8 border-t border-slate-700 mt-4 rounded-b-3xl flex justify-end z-10">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />}
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

          </div>
        )}

        {activeTab === 'page' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-white mb-2">Página & Conteúdo</h3>
            <p className="text-slate-400 mb-8">Personalize como os clientes veem sua página profissional.</p>

            {/* 1. SLUG / URL */}
            {profile.slug && (
              <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-700 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex-1 min-w-0 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><Share2 size={18} /></span>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Link da Sua Página</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-slate-700/50 backdrop-blur-sm flex items-center justify-between gap-3">
                    <p className="text-sm md:text-base font-mono font-bold text-white truncate select-all">
                      {window.location.origin}/{profile.slug || 'configurar-slug'}
                    </p>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/${profile.slug || 'configurar-slug'}`;
                        navigator.clipboard.writeText(url);
                        addToast('Copiado!', 'success');
                      }}
                      className="text-slate-400 hover:text-white"
                      title="Copiar"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 z-10 w-full md:w-auto mt-2 md:mt-0">
                  <button
                    onClick={() => window.open(`/${profile.slug || 'configurar-slug'}`, '_blank')}
                    className="w-full md:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={18} /> Acessar Página
                  </button>
                </div>
              </div>
            )}

            {/* 2. WELCOME MESSAGES */}
            <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 mb-8">
              <h4 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <span className="text-xl">👋</span> Mensagens de Boas-Vindas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Frase Principal (Topo - Branca)
                  </label>
                  <input
                    type="text"
                    value={profile.boasVindas1}
                    onChange={e => e.target.value.length <= 40 && setProfile({ ...profile, boasVindas1: e.target.value })}
                    maxLength={40}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 outline-none text-white"
                    placeholder="Ex: Os Melhores Imóveis"
                  />
                  <div className="flex justify-end mt-1"><span className="text-xs text-slate-500">{profile.boasVindas1.length}/40</span></div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Frase de Destaque (Verde)
                  </label>
                  <input
                    type="text"
                    value={profile.boasVindas2}
                    onChange={e => e.target.value.length <= 40 && setProfile({ ...profile, boasVindas2: e.target.value })}
                    maxLength={40}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 focus:border-emerald-500 outline-none text-emerald-400 font-medium"
                    placeholder="Ex: Encontre aqui!"
                  />
                  <div className="flex justify-end mt-1"><span className="text-xs text-slate-500">{profile.boasVindas2.length}/40</span></div>
                </div>
              </div>
            </div>

            {/* 3. ABOUT & STATS */}
            <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 mb-8">
              <h4 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📝</span> Sobre & Estatísticas
              </h4>

              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 mb-1">Sua Biografia (aparece na seção "Sobre")</label>
                <textarea
                  value={profile.sobreMim}
                  onChange={e => e.target.value.length <= 800 && setProfile({ ...profile, sobreMim: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 outline-none text-white resize-none leading-relaxed"
                  placeholder="Conte sua história profissional..."
                />
                <div className="flex justify-end mt-1"><span className="text-xs text-slate-500">{profile.sobreMim.length}/800</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Imóveis Vendidos</label>
                  <input
                    type="number"
                    value={profile.imoveisVendidos || ''}
                    onChange={e => setProfile({ ...profile, imoveisVendidos: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 outline-none text-white text-center font-bold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Clientes Atendidos</label>
                  <input
                    type="number"
                    value={profile.clientesAtendidos || ''}
                    onChange={e => setProfile({ ...profile, clientesAtendidos: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 outline-none text-white text-center font-bold"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-sm p-4 -mx-6 -mb-6 md:-mx-8 md:-mb-8 border-t border-slate-700 mt-4 rounded-b-3xl flex justify-end z-10">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />}
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-white mb-2">Marca & Redes Sociais</h3>
            <p className="text-slate-400 mb-8">Defina sua identidade visual e conecte suas redes.</p>

            {/* 1. BRANDING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" data-tour="logo-upload">
              {/* Logotipo */}
              <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-700 flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-slate-800 rounded-2xl border border-slate-600">
                  {profile.watermarkDark ? (
                    <img src={profile.watermarkDark} alt="Logotipo" className="w-32 h-32 object-contain" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-slate-600"><Camera size={32} /></div>
                  )}
                </div>
                <h4 className="font-bold text-lg text-white mb-2">Logotipo Principal</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Sua marca no topo do site. Use PNG transparente.
                </p>
                <div className="mt-auto w-full">
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) handleWatermarkUpload(file, 'dark');
                      };
                      input.click();
                    }}
                    disabled={uploading}
                    className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Enviando...' : (profile.watermarkDark ? 'Alterar Logo' : 'Fazer Upload')}
                  </button>
                </div>
              </div>

              {/* Marca D'Água */}
              <div className="p-6 bg-blue-900/10 rounded-3xl border border-blue-500/30 flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-slate-800 rounded-2xl border border-slate-600 relative overflow-hidden">
                  {profile.marcaDagua ? (
                    <img src={profile.marcaDagua} alt="Marca d'água" className="w-32 h-32 object-contain relative z-10" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-slate-600"><Camera size={32} /></div>
                  )}
                  <div className="absolute inset-0 bg-repeat opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                </div>
                <h4 className="font-bold text-lg text-white mb-2">Marca D'Água</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Aplicada automaticamente nas fotos dos imóveis para proteção.
                </p>
                <div className="mt-auto w-full">
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) handleWatermarkUpload(file, 'marca');
                      };
                      input.click();
                    }}
                    disabled={uploading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Enviando...' : (profile.marcaDagua ? 'Alterar Marca' : 'Fazer Upload')}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. SOCIALS GRID */}
            <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 mb-8">
              <h4 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                <span className="text-xl">🌐</span> Redes Conectadas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Instagram */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><Instagram size={14} className="text-pink-500" /> Instagram</label>
                  <input type="text" value={profile.instagram} onChange={e => setProfile({ ...profile, instagram: e.target.value })} placeholder="instagram.com/seu.perfil" className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-white text-sm" />
                </div>
                {/* Facebook */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><Facebook size={14} className="text-blue-500" /> Facebook</label>
                  <input type="text" value={profile.facebook} onChange={e => setProfile({ ...profile, facebook: e.target.value })} placeholder="facebook.com/sua.pagina" className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white text-sm" />
                </div>
                {/* LinkedIn */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><Linkedin size={14} className="text-blue-400" /> LinkedIn</label>
                  <input type="text" value={profile.linkedin} onChange={e => setProfile({ ...profile, linkedin: e.target.value })} placeholder="linkedin.com/in/voce" className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-white text-sm" />
                </div>
                {/* YouTube */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><Youtube size={14} className="text-red-500" /> YouTube</label>
                  <input type="text" value={profile.youtube} onChange={e => setProfile({ ...profile, youtube: e.target.value })} placeholder="youtube.com/@canal" className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-white text-sm" />
                </div>
                {/* Twitter */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><Twitter size={14} className="text-sky-500" /> X (Twitter)</label>
                  <input type="text" value={profile.x} onChange={e => setProfile({ ...profile, x: e.target.value })} placeholder="x.com/usuario" className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white text-sm" />
                </div>
                {/* Threads */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5"><AtSign size={14} className="text-white" /> Threads</label>
                  <input type="text" value={profile.threads} onChange={e => setProfile({ ...profile, threads: e.target.value })} placeholder="threads.net/@usuario" className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-white focus:ring-1 focus:ring-white outline-none text-white text-sm" />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-sm p-4 -mx-6 -mb-6 md:-mx-8 md:-mb-8 border-t border-slate-700 mt-4 rounded-b-3xl flex justify-end z-10">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />}
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}





      </div>
    </div >
  );
};
