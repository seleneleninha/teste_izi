import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { User, Lock, Bell, Shield, Camera, Trash2, Save, Loader2, Eye, EyeOff, AlertTriangle, ExternalLink, MapPin, Phone, Share2, Instagram, Facebook, Linkedin, Youtube, Twitter, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { geocodeAddress } from '../lib/geocodingHelper';

export const Settings: React.FC = () => {
  const { user, signOut, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'slug' | 'security' | 'notifications'>('profile');

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
    x: ''
  });

  // Password State
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState({
    leads: true,
    messages: true,
    properties: true,
    marketing: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

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
          watermarkDark: data.watermark_dark || '',
          marcaDagua: data.marca_dagua || '',
          instagram: data.instagram || '',
          facebook: data.facebook || '',
          threads: data.threads || '',
          youtube: data.youtube || '',
          linkedin: data.linkedin || '',
          x: data.x || ''
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

    if (passwords.newPassword.length < 6) {
      addToast('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
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
      console.error('Erro ao alterar senha:', error);
      addToast('Erro ao alterar senha: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('ATENÇÃO: Esta ação é irreversível. Todos os seus dados serão apagados. Tem certeza?')) return;

    try {
      setDeleting(true);

      const { error } = await supabase.rpc('delete_own_account');

      if (error) throw error;

      addToast('Conta excluída com sucesso.', 'success');
      await signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error);
      addToast('Erro ao excluir conta: ' + error.message, 'error');
    } finally {
      setDeleting(false);
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
    <div className="mt-6 max-w-5xl mx-auto pb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configurações da Conta</h2>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="
            bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-800/95 
            md:bg-white md:dark:bg-slate-800
            rounded-xl md:shadow-sm md:border border-gray-200 dark:border-slate-700 
            overflow-hidden 
            sticky top-[68px] md:top-24 z-20 
            md:z-0
          ">
            <div className="flex flex-row md:flex-col overflow-x-auto p-2 md:p-0 gap-2 md:gap-0 no-scrollbar">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-3 px-4 py-2.5 md:py-4 transition-all whitespace-nowrap rounded-full md:rounded-none flex-shrink-0 md:flex-shrink
                  ${activeTab === 'profile'
                    ? 'bg-primary-500 text-white shadow-md md:shadow-none md:bg-primary-50 md:dark:bg-primary-900/20 md:text-primary-600 md:dark:text-primary-400 md:border-l-4 md:border-primary-500 font-bold md:font-medium'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 md:hover:bg-gray-50 md:dark:hover:bg-slate-750 font-medium'
                  }`}
              >
                <User size={20} />
                <span>Perfil</span>
              </button>

              {role !== 'Cliente' && (
                <button
                  onClick={() => setActiveTab('slug')}
                  className={`flex items-center space-x-3 px-4 py-2.5 md:py-4 transition-all whitespace-nowrap rounded-full md:rounded-none flex-shrink-0 md:flex-shrink
                      ${activeTab === 'slug'
                      ? 'bg-primary-500 text-white shadow-md md:shadow-none md:bg-primary-50 md:dark:bg-primary-900/20 md:text-primary-600 md:dark:text-primary-400 md:border-l-4 md:border-primary-500 font-bold md:font-medium'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 md:hover:bg-gray-50 md:dark:hover:bg-slate-750 font-medium'
                    }`}
                >
                  <MapPin size={20} />
                  <span>Sua Página</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center space-x-3 px-4 py-2.5 md:py-4 transition-all whitespace-nowrap rounded-full md:rounded-none flex-shrink-0 md:flex-shrink
                  ${activeTab === 'security'
                    ? 'bg-primary-500 text-white shadow-md md:shadow-none md:bg-primary-50 md:dark:bg-primary-900/20 md:text-primary-600 md:dark:text-primary-400 md:border-l-4 md:border-primary-500 font-bold md:font-medium'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 md:hover:bg-gray-50 md:dark:hover:bg-slate-750 font-medium'
                  }`}
              >
                <Lock size={20} />
                <span>Segurança</span>
              </button>

              {role !== 'Cliente' && (
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center space-x-3 px-4 py-2.5 md:py-4 transition-all whitespace-nowrap rounded-full md:rounded-none flex-shrink-0 md:flex-shrink
                      ${activeTab === 'notifications'
                      ? 'bg-primary-500 text-white shadow-md md:shadow-none md:bg-primary-50 md:dark:bg-primary-900/20 md:text-primary-600 md:dark:text-primary-400 md:border-l-4 md:border-primary-500 font-bold md:font-medium'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 md:hover:bg-gray-50 md:dark:hover:bg-slate-750 font-medium'
                    }`}
                >
                  <Bell size={20} />
                  <span>Notificações</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 min-h-[500px]">

            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" data-tour="profile-settings">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Informações Pessoais</h3>

                <div className="flex items-center mb-8">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img
                      src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
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
                  <div className="ml-6">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">Sua Foto de Perfil</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Faça o upload de uma nova foto.</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      {uploading ? 'Enviando...' : 'Fazer Upload'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* READ-ONLY VITAL FIELDS */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      title="Este campo só pode ser alterado pelos administradores"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Sobrenome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profile.sobrenome}
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      title="Este campo só pode ser alterado pelos administradores"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      title="Este campo só pode ser alterado pelos administradores"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      CPF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profile.cpf}
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      title="Este campo só pode ser alterado pelos administradores"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      disabled
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="(XX) XXXXX-XXXX"
                      className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  {role !== 'Cliente' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          CRECI <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profile.creci}
                          disabled
                          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          title="Este campo só pode ser alterado pelos administradores"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          UF do CRECI <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profile.ufCreci}
                          disabled
                          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          title="Este campo só pode ser alterado pelos administradores"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Aviso ADM */}

                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30 mb-8">
                  <h4 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center">
                    <AlertTriangle size={18} className="mr-2" /> Dados Restritos
                  </h4>
                  <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">
                    Somente Administradores poderão alterar seus dados pessoais, por questões de segurança. Fale com um Administrador clicando no botão abaixo.
                  </p>
                  <a
                    href="mailto:admin@izibrokerz.com?subject=Solicitação de Alteração de Dados Pessoais&body=Olá, gostaria de solicitar a alteração dos meus dados pessoais cadastrados.%0D%0A%0D%0AMeu Nome: [SEU NOME]%0D%0AMeu Email: [SEU EMAIL]%0D%0A%0D%0ADados que preciso alterar:%0D%0A- [DESCREVA AQUI]"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center w-fit"
                  >
                    <Phone size={16} className="mr-2" />
                    Falar com ADMIN
                  </a>
                </div>


                {/* ADDRESS SECTION */}
                <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mb-8">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MapPin size={20} className="mr-2 text-primary-500" /> Endereço
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">CEP</label>
                      <input
                        type="text"
                        value={profile.cep}
                        onChange={e => setProfile({ ...profile, cep: e.target.value })}
                        onBlur={e => fetchCep(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                      />
                      {loadingCep && <p className="text-xs text-primary-500 mt-1">Buscando CEP...</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Logradouro</label>
                      <input
                        type="text"
                        value={profile.logradouro}
                        disabled
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Número</label>
                      <input
                        type="text"
                        value={profile.numero}
                        onChange={e => setProfile({ ...profile, numero: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Complemento</label>
                      <input
                        type="text"
                        value={profile.complemento}
                        onChange={e => setProfile({ ...profile, complemento: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Bairro</label>
                      <input
                        type="text"
                        value={profile.bairro}
                        disabled
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Cidade</label>
                      <input
                        type="text"
                        value={profile.cidade}
                        disabled
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">UF</label>
                      <input
                        type="text"
                        value={profile.uf}
                        disabled
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400"
                      />
                    </div>

                    {role !== 'Cliente' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showAddress"
                          checked={profile.showAddress}
                          onChange={e => setProfile({ ...profile, showAddress: e.target.checked })}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="showAddress" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                          Exibir Endereço Em Sua Página?
                        </label>
                      </div>
                    )}

                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 flex items-center transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'slug' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personalize sua Página de Imóveis e Redes Sociais</h3>

                {/* Slug Display and Visit Button */}
                {/* Public Page URL Display - Enhanced */}
                {profile.slug && (
                  <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 bg-gradient-to-r from-primary-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-primary-100 dark:border-primary-900/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex-1 min-w-0 z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                          <Share2 size={20} />
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Endereço da Sua Página</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 border border-gray-100 dark:border-slate-700/50 backdrop-blur-sm">
                        <p className="text-base md:text-lg font-mono font-bold text-primary-700 dark:text-primary-400 truncate select-all">
                          {window.location.origin}/#/corretor/{profile.slug || 'configurar-slug'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 z-10 w-full md:w-auto">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/#/corretor/${profile.slug || 'configurar-slug'}`;
                          navigator.clipboard.writeText(url);
                          addToast('Link colado na sua área de transferência! 📋', 'success');
                        }}
                        className="flex-1 md:flex-none px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        title="Copiar Link"
                      >
                        <Share2 size={20} />
                      </button>
                      <button
                        onClick={() => window.open(`/#/corretor/${profile.slug || 'configurar-slug'}`, '_blank')}
                        className="px-4 py-3 bg-white dark:bg-slate-800 border-2 border-primary-100 dark:border-slate-600 text-primary-600 dark:text-slate-300 font-bold rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                        title="Visitar Página"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-4 space-y-8" data-tour="logo-upload">
                  {/* Logotipos Modo Claro */}
                  <div className="p-6 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Logotipo - Modo Claro</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                      Sua marca será exibida na sua página e no rodapé quando o site estiver em modo claro.
                    </p>
                    <p className="text-md text-blue-600 dark:text-blue-400 mb-4">
                      💡 Dica: Use imagens PNG com fundo transparente para melhor resultado.
                    </p>
                    <div className="mb-4 flex items-center gap-4">
                      {profile.watermarkLight && (
                        <img
                          src={profile.watermarkLight}
                          alt="Logotipo modo claro"
                          className="w-32 h-32 object-contain border border-gray-300 dark:border-slate-600 rounded-lg bg-white p-2"
                        />
                      )}
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) handleWatermarkUpload(file, 'light');
                          };
                          input.click();
                        }}
                        disabled={uploading}
                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                      >
                        {uploading ? 'Enviando...' : (profile.watermarkLight ? 'Alterar Imagem' : 'Fazer Upload')}
                      </button>
                    </div>

                    {/* Logotipo Modo Escuro */}
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Logotipo - Modo Escuro</h4>
                    <div className="flex items-center gap-4">
                      {profile.watermarkDark && (
                        <img
                          src={profile.watermarkDark}
                          alt="Logotipo modo escuro"
                          className="w-32 h-32 object-contain border border-gray-300 dark:border-slate-600 rounded-lg bg-slate-800 p-2"
                        />
                      )}
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
                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                      >
                        {uploading ? 'Enviando...' : (profile.watermarkDark ? 'Alterar Imagem' : 'Fazer Upload')}
                      </button>
                    </div>

                  </div>

                  {/* Marca D'Água para Fotos */}
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Marca D'Água para Fotos</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                      Esta marca será aplicada automaticamente nas fotos dos seus imóveis para proteger suas imagens.
                    </p>
                    <div className="flex items-center gap-4">
                      {profile.marcaDagua && (
                        <img
                          src={profile.marcaDagua}
                          alt="Marca d'água"
                          className="w-32 h-32 object-contain border border-blue-300 dark:border-blue-600 rounded-lg bg-white/50 p-2"
                        />
                      )}
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
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {uploading ? 'Enviando...' : (profile.marcaDagua ? 'Alterar Marca D\'água' : 'Fazer Upload')}
                      </button>
                    </div>
                  </div>

                  {/* Redes Sociais */}
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Redes Sociais</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                      Adicione os links das suas redes sociais para que apareçam na sua página.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Instagram */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Instagram size={16} className="text-pink-600" /> Instagram
                        </label>
                        <input
                          type="text"
                          value={profile.instagram}
                          onChange={e => setProfile({ ...profile, instagram: e.target.value })}
                          placeholder="https://instagram.com/seu.usuario"
                          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Facebook */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Facebook size={16} className="text-blue-600" /> Facebook
                        </label>
                        <input
                          type="text"
                          value={profile.facebook}
                          onChange={e => setProfile({ ...profile, facebook: e.target.value })}
                          placeholder="https://facebook.com/sua.pagina"
                          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* LinkedIn */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Linkedin size={16} className="text-blue-700" /> LinkedIn
                        </label>
                        <input
                          type="text"
                          value={profile.linkedin}
                          onChange={e => setProfile({ ...profile, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/seu-perfil"
                          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* YouTube */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Youtube size={16} className="text-red-600" /> YouTube
                        </label>
                        <input
                          type="text"
                          value={profile.youtube}
                          onChange={e => setProfile({ ...profile, youtube: e.target.value })}
                          placeholder="https://youtube.com/@seu-canal"
                          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* X / Twitter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Twitter size={16} className="text-gray-800 dark:text-gray-200" /> X (Twitter)
                        </label>
                        <input
                          type="text"
                          value={profile.x}
                          onChange={e => setProfile({ ...profile, x: e.target.value })}
                          placeholder="https://x.com/seu_usuario"
                          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Threads */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <AtSign size={16} className="text-gray-900 dark:text-white" /> Threads
                        </label>
                        <input
                          type="text"
                          value={profile.threads}
                          onChange={e => setProfile({ ...profile, threads: e.target.value })}
                          placeholder="https://threads.net/@seu_usuario"
                          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 flex items-center transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>

              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Segurança da Conta</h3>

                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Lock size={18} className="mr-2 text-primary-500" /> Alterar Senha
                    </h4>

                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nova Senha</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={passwords.newPassword}
                            onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          value={passwords.confirmPassword}
                          onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={saving || !passwords.newPassword}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Alterando...' : 'Atualizar Senha'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
                    <h4 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center">
                      <AlertTriangle size={18} className="mr-2" /> Zona de Perigo
                    </h4>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">
                      Excluir sua conta é uma ação permanente e não poderá ser desfeita. Todos os seus dados, imóveis e leads serão perdidos.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center disabled:opacity-50"
                    >
                      {deleting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
                      {deleting ? 'Excluindo...' : 'Excluir Minha Conta'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Preferências de Notificação</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Novas Leads</h4>
                      <p className="text-xs text-gray-500">Receber notificações quando um novo lead for cadastrado.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.leads}
                        onChange={() => toggleNotification('leads')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Mensagens</h4>
                      <p className="text-xs text-gray-500">Receber notificações de novas mensagens no chat.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.messages}
                        onChange={() => toggleNotification('messages')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Atualizações de Imóveis</h4>
                      <p className="text-xs text-gray-500">Receber alertas sobre mudanças em seus imóveis.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.properties}
                        onChange={() => toggleNotification('properties')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Marketing e Dicas</h4>
                      <p className="text-xs text-gray-500">Receber novidades e dicas da Plataforma.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.marketing}
                        onChange={() => toggleNotification('marketing')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveNotifications}
                    disabled={saving}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 flex items-center transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                    {saving ? 'Salvando...' : 'Salvar Preferências'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div >
    </div >
  );
};