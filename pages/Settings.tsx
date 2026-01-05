
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { useHeader } from '../components/HeaderContext';
import {
  User, Lock, Shield, Camera, Trash2, Save, Loader2, Eye, EyeOff, Lightbulb, AlertTriangle, ExternalLink, MessageCircle, Play, Info, Instagram, Facebook, Linkedin, Youtube, Twitter, AtSign,
  MessageSquare, Zap, Sparkles, Bot, Check, X, UserMinus, Download, Upload,
  ShieldCheck, Eraser, MapPin, Rocket, CheckCircle, AlertCircle, Share2, Search, ImageIcon, Copy, QrCode
} from 'lucide-react';
import { processXMLImport, cleanupHtmlArtifacts, batchGeocodeProperties, massPublishProperties, migrateExternalImages } from '../api/import-xml/client';
import { useNavigate } from 'react-router-dom';
import { geocodeAddress } from '../lib/geocodingHelper';
import { checkPasswordStrength, validateEmail, validatePhone, validateCRECI, sanitizeInput } from '../lib/validation';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { UploadDialog } from '../components/ImportXML/UploadDialog';
import { getVerificationConfig } from '../lib/verificationHelper';

export const Settings: React.FC = () => {
  const { user, userProfile, signOut, role } = useAuth();
  const { addToast } = useToast();
  const { setHeaderContent } = useHeader();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'page' | 'branding' | 'whatsapp' | 'importXml'>('account');

  // Loading States
  const [loading, setLoading] = useState(false);

  // Verified Status Check (Avançado or Profissional)
  // Verified Status Check (Tiered) - Memoized to prevent infinite re-render
  const verificationConfig = React.useMemo(
    () => getVerificationConfig(userProfile?.plano_id),
    [userProfile?.plano_id]
  );

  // Plan Info Helper
  const planInfo = React.useMemo(() => {
    const planMap: Record<string, { name: string; color: string; bgClass: string }> = {
      'ad586103-eb71-4ad0-af95-38a9e16b3c8f': { name: 'Básico', color: 'text-slate-400', bgClass: 'bg-slate-500' },
      'b974682b-cb4e-4a93-86ef-1efa47a2813c': { name: 'Intermediário', color: 'text-blue-400', bgClass: 'bg-blue-500' },
      '55de4ee5-c2f1-4f9d-b466-7e08138854f0': { name: 'Avançado', color: 'text-emerald-400', bgClass: 'bg-emerald-500' },
      'edf90163-d554-4f8e-bfe9-7d9e98fc4450': { name: 'Profissional', color: 'text-pink-400', bgClass: 'bg-pink-500' },
    };
    return planMap[userProfile?.plano_id || ''] || { name: 'Básico', color: 'text-slate-400', bgClass: 'bg-slate-500' };
  }, [userProfile?.plano_id]);

  // Check if user has Avançado or Profissional plan (for IA features)
  const isPlanAvancadoOrPro = userProfile?.plano_id === '55de4ee5-c2f1-4f9d-b466-7e08138854f0' ||
    userProfile?.plano_id === 'edf90163-d554-4f8e-bfe9-7d9e98fc4450';

  // Import Limits Logic
  const importConfig = React.useMemo(() => {
    const planId = userProfile?.plano_id;
    if (planId === 'ad586103-eb71-4ad0-af95-38a9e16b3c8f') return { canImport: false, limit: 0 }; // Básico
    if (planId === 'b974682b-cb4e-4a93-86ef-1efa47a2813c') return { canImport: true, limit: 20 }; // Intermediário
    if (planId === '55de4ee5-c2f1-4f9d-b466-7e08138854f0') return { canImport: true, limit: 30 }; // Avançado
    if (planId === 'edf90163-d554-4f8e-bfe9-7d9e98fc4450') return { canImport: true, limit: 50 }; // Profissional
    return { canImport: false, limit: 0 }; // Fallback
  }, [userProfile?.plano_id]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    sobrenome: '',
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
    clientesAtendidos: 0,
    anosExperiencia: 0
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
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Admin Tools State
  const [cleanupResult, setCleanupResult] = useState<{ fixed: number, total: number } | null>(null);
  const [cleanupStatus, setCleanupStatus] = useState<'idle' | 'cleaning' | 'success' | 'error'>('idle');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [geoProgress, setGeoProgress] = useState<{ current: number, total: number, message: string }>({ current: 0, total: 0, message: '' });
  const [geoResult, setGeoResult] = useState<{ success: number, failed: number } | null>(null);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [publishResult, setPublishResult] = useState<{ published: number, total: number } | null>(null);

  // State for Image Migration
  const [migrateStatus, setMigrateStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [migrateResult, setMigrateResult] = useState<{ success: number, errors: number } | null>(null);
  const [migrateProgress, setMigrateProgress] = useState<{ current: number, total: number, message: string }>({ current: 0, total: 0, message: '' });



  // Admin Tools Handlers
  const handleCleanup = async () => {
    setCleanupStatus('cleaning');
    try {
      const res = await cleanupHtmlArtifacts(supabase, user?.id || '');
      setCleanupResult(res);
      setCleanupStatus('success');
    } catch (e: any) {
      console.error(e);
      setCleanupStatus('error');
    }
  };

  const handleGeocode = async () => {
    setGeoStatus('running');
    setGeoProgress({ current: 0, total: 0, message: 'Iniciando...' });
    try {
      const res = await batchGeocodeProperties(
        supabase,
        user?.id || '',
        (current, total, message) => setGeoProgress({ current, total, message }),
        role === 'Admin' // isAdmin flag
      );
      setGeoResult(res);
      setGeoStatus('success');
    } catch (e: any) {
      console.error(e);
      setGeoStatus('error');
    }
  }

  const handlePublish = async () => {
    setPublishStatus('publishing');
    try {
      const res = await massPublishProperties(
        supabase,
        user?.id || '',
        role === 'Admin' // isAdmin flag
      );
      setPublishResult(res);
      setPublishStatus('success');
    } catch (e: any) {
      console.error(e);
      setPublishStatus('error');
    }
  };

  const handleMigrateImages = async () => {
    setMigrateStatus('running');
    try {
      const result = await migrateExternalImages(
        user?.id || '',
        (p) => {
          setMigrateProgress({
            current: p.current,
            total: p.total,
            message: p.currentFile || `Processando ${p.current}/${p.total}`
          });
        },
        role === 'Admin' // isAdmin flag
      );
      setMigrateResult({ success: result.success, errors: result.errors.length });
      setMigrateStatus('success');
      addToast(`Migração concluída! ${result.success} imagens salvas no Supabase.`, 'success');
    } catch (error: any) {
      console.error(error);
      setMigrateStatus('error');
      addToast('Erro na migração de imagens.', 'error');
    }
  };

  const [exportingData, setExportingData] = useState(false);

  // Slug availability check
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugSaved, setSlugSaved] = useState(false);
  const slugCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- WhatsApp & IA Integration States ---
  const [whatsappConfig, setWhatsappConfig] = useState<{
    instanceName: string;
    instanceToken: string;
    status: string;
    agentName: string;
    operationMode: 'comercial' | 'estendido' | '24h7';
    awayMessage: string;
  } | null>(null);
  const [agentConfigSaving, setAgentConfigSaving] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // WAHA API Configuration
  const WAHA_API_URL = 'http://18.205.1.162:3000';
  const WAHA_API_KEY = 'izi_secret_key_2024'; // Found from server config

  const fileInputRef = useRef<HTMLInputElement>(null);

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    setHeaderContent(
      <div className="flex flex-col justify-center">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight flex items-center gap-2">
          Configurações da Conta
          {verificationConfig && (
            <img src={verificationConfig.badgeUrl} alt={verificationConfig.title} className="w-6 h-6 object-contain drop-shadow-sm" title={verificationConfig.title} />
          )}
        </h2>
        <p className="text-slate-400 text-xs font-medium leading-tight">Gerencie seu perfil, segurança e preferências</p>
      </div>
    );
    return () => setHeaderContent(null);
  }, [setHeaderContent, verificationConfig]);

  useEffect(() => {
    if (user?.id) {
      // Pre-fill profile with userProfile from AuthContext (already loaded from perfis table)
      if (userProfile) {
        setProfile(prev => ({
          ...prev,
          // Personal Data
          name: userProfile.nome || prev.name || '',
          sobrenome: userProfile.sobrenome || prev.sobrenome || '',
          email: userProfile.email || prev.email || user.email || '',
          phone: userProfile.whatsapp || prev.phone || '',
          cpf: userProfile.cpf || prev.cpf || '',
          creci: userProfile.creci || prev.creci || '',
          ufCreci: userProfile.uf_creci || prev.ufCreci || '',
          avatar: userProfile.avatar || prev.avatar || '',
          role: userProfile.role || prev.role || '',
          slug: userProfile.slug || prev.slug || '',
          // Address
          cep: userProfile.cep || prev.cep || '',
          logradouro: userProfile.logradouro || prev.logradouro || '',
          numero: userProfile.numero || prev.numero || '',
          complemento: userProfile.complemento || prev.complemento || '',
          bairro: userProfile.bairro || prev.bairro || '',
          cidade: userProfile.cidade || prev.cidade || '',
          uf: userProfile.uf || prev.uf || '',
          showAddress: userProfile.show_address || prev.showAddress || false,
          raioAtuacao: userProfile.raio_atuacao || prev.raioAtuacao || 10,
          // Brands & Watermarks
          watermarkDark: userProfile.watermark_dark || prev.watermarkDark || '',
          marcaDagua: userProfile.marca_dagua || prev.marcaDagua || '',
          // Social Media
          instagram: userProfile.instagram || prev.instagram || '',
          facebook: userProfile.facebook || prev.facebook || '',
          threads: userProfile.threads || prev.threads || '',
          youtube: userProfile.youtube || prev.youtube || '',
          linkedin: userProfile.linkedin || prev.linkedin || '',
          x: userProfile.x || prev.x || '',
          // Page & Content
          boasVindas1: userProfile.mensagem_boasvindas || prev.boasVindas1 || '',
          boasVindas2: userProfile.boasvindas2 || prev.boasVindas2 || '',
          sobreMim: userProfile.sobre_mim || prev.sobreMim || '',
          imoveisVendidos: userProfile.imoveis_vendidos || prev.imoveisVendidos || 0,
          clientesAtendidos: userProfile.clientes_atendidos || prev.clientesAtendidos || 0,
          anosExperiencia: userProfile.anos_experiencia || prev.anosExperiencia || 0
        }));
      }

      fetchProfile();
      fetchWhatsAppConfig();
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [user?.id, userProfile]);

  const fetchWhatsAppConfig = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setWhatsappConfig({
          instanceName: data.instance_name,
          instanceToken: data.instance_token,
          status: data.status,
          agentName: data.agent_name || 'IzA',
          operationMode: data.operation_mode || '24h7',
          awayMessage: data.away_message || 'Olá! Sua mensagem é muito importante para nós, porém nosso expediente é de segunda à sexta das 08h às 18h.\n\n📱 Deixe seu nome e interesse que retornaremos assim que possível!\n\nOu se preferir, acesse nosso portfólio: {LINK}'
        });

        // If status is not "connected", check WAHA directly
        if (data.status === 'connected') {
          checkWahaStatus(data.instance_name);
        }
      } else {
        // Initialize with defaults for new users (allows editing before first connection)
        setWhatsappConfig({
          instanceName: '',
          instanceToken: '',
          status: 'disconnected',
          agentName: '',
          operationMode: '24h7',
          awayMessage: 'Olá! Sua mensagem é muito importante para nós. Deixe seu nome e interesse que retornaremos assim que possível!\nOu se preferir, acesse nosso portfólio: {LINK}'
        });
      }
    } catch (error) {
      console.error('Error fetching whatsapp config:', error);
    }
  };

  const checkWahaStatus = async (sessionName: string) => {
    try {
      const response = await fetch(`${WAHA_API_URL} /api/sessions / ${sessionName} `, {
        headers: { 'X-Api-Key': WAHA_API_KEY }
      });
      const data = await response.json();

      // WAHA status: WORKING means connected
      if (data.status === 'WORKING') {
        updateWhatsAppStatus('connected');
      } else {
        updateWhatsAppStatus('disconnected');
      }
    } catch (error) {
      console.error('Error checking WAHA status:', error);
    }
  };

  const updateWhatsAppStatus = async (status: string) => {
    if (!user || !whatsappConfig) return;
    try {
      await supabase
        .from('whatsapp_config')
        .update({ status })
        .eq('user_id', user.id);

      setWhatsappConfig(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('Error updating status in Supabase:', error);
    }
  };

  const handleConnectWhatsApp = async () => {
    if (!user) return;
    try {
      setIsConnecting(true);
      setQrCode(null);

      // WAHA Core only supports 'default' session name
      // For multi-session support, upgrade to WAHA PLUS
      const sessionName = 'default';

      // 1. First, check if session exists and try to stop it if FAILED
      const statusRes = await fetch(`${WAHA_API_URL} /api/sessions / ${sessionName} `, {
        headers: { 'X-Api-Key': WAHA_API_KEY }
      });

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        console.log('WAHA Session Status:', statusData);

        // If session is FAILED or STOPPED, restart it
        if (statusData.status === 'FAILED' || statusData.status === 'STOPPED') {
          console.log('Session is FAILED/STOPPED, restarting...');
          await fetch(`${WAHA_API_URL} /api/sessions / ${sessionName}/stop`, {
            method: 'POST',
            headers: { 'X-Api-Key': WAHA_API_KEY }
          });
          // Wait a moment for cleanup
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      // 2. Try to start session (will fail with 422 if already running, which is OK)
      const startRes = await fetch(`${WAHA_API_URL}/api/sessions/${sessionName}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': WAHA_API_KEY,
        },
        body: JSON.stringify({
          name: sessionName,
          config: {
            webhooks: [
              {
                url: 'http://18.205.1.162:5678/webhook/waha-webhook-clientes',
                events: ['message']
              }
            ]
          }
        })
      });

      const startData = await startRes.json();
      console.log('WAHA Start Response:', startData);

      // 422 "already started" is OK, we can proceed to get QR code
      if (!startRes.ok && startData.statusCode !== 422) {
        throw new Error(startData.message || 'Erro ao iniciar sessão WAHA');
      }

      // 3. Save/Update in Supabase (use user_id as conflict key)
      const { error: dbError } = await supabase
        .from('whatsapp_config')
        .upsert({
          user_id: user.id,
          instance_name: sessionName,
          instance_token: sessionName, // WAHA uses session name as identifier
          status: 'connecting'
        }, { onConflict: 'user_id' });

      if (dbError) throw dbError;

      setWhatsappConfig(prev => prev
        ? { ...prev, instanceName: sessionName, status: 'connecting' }
        : { instanceName: sessionName, instanceToken: sessionName, status: 'connecting', agentName: 'IzA', operationMode: '24h7' as const, awayMessage: '' });

      // 4. Get QR Code from WAHA
      const qrRes = await fetch(`${WAHA_API_URL}/api/${sessionName}/auth/qr`, {
        headers: {
          'Accept': 'image/png',
          'X-Api-Key': WAHA_API_KEY,
        }
      });

      if (qrRes.ok) {
        // WAHA returns image directly, convert to base64
        const blob = await qrRes.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setQrCode(base64);
        };
        reader.readAsDataURL(blob);
      } else {
        // QR fetch failed - maybe already connected or session issue
        console.log('QR fetch failed with status:', qrRes.status);
        // Try using the start response data (may contain QR)
        if (startData.qr?.base64) {
          setQrCode(`data:image/png;base64,${startData.qr.base64}`);
        } else if (startData.qr) {
          // QR might be returned as direct string
          setQrCode(startData.qr.startsWith('data:') ? startData.qr : `data:image/png;base64,${startData.qr}`);
        } else {
          addToast('Aguardando conexão... Verifique o WhatsApp.', 'info');
        }
      }

      // Always start polling to detect when connection is established
      startPollingStatus(sessionName);

    } catch (error: any) {
      console.error('Error connecting WhatsApp:', error);
      addToast(error.message || 'Erro ao conectar WhatsApp', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const startPollingStatus = (instanceName: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    console.log('Starting polling for session:', instanceName);

    pollInterval.current = setInterval(async () => {
      try {
        // WAHA status check endpoint
        const response = await fetch(`${WAHA_API_URL}/api/sessions/${instanceName}`, {
          headers: { 'X-Api-Key': WAHA_API_KEY }
        });
        const data = await response.json();
        console.log('Polling status:', data.status);

        // WAHA status values: STOPPED, STARTING, SCAN_QR_CODE, WORKING, FAILED
        if (data.status === 'WORKING') {
          console.log('WhatsApp connected! Stopping poll.');
          if (pollInterval.current) clearInterval(pollInterval.current);
          updateWhatsAppStatus('connected');
          setQrCode(null);
          addToast('WhatsApp conectado com sucesso!', 'success');
        } else if (data.status === 'FAILED') {
          console.log('Session FAILED, stopping poll.');
          if (pollInterval.current) clearInterval(pollInterval.current);
          addToast('Conexão falhou. Tente novamente.', 'error');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds for faster detection
  };

  const handleDisconnectWhatsApp = async () => {
    if (!user || !whatsappConfig) return;
    if (!confirm('Deseja realmente desconectar seu WhatsApp?')) return;

    try {
      setLoading(true);
      // WAHA stop/logout endpoint
      await fetch(`${WAHA_API_URL}/api/sessions/${whatsappConfig.instanceName}/stop`, {
        method: 'POST',
        headers: { 'X-Api-Key': WAHA_API_KEY }
      });

      await supabase
        .from('whatsapp_config')
        .delete()
        .eq('user_id', user.id);

      setWhatsappConfig(null);
      setQrCode(null);
      addToast('WhatsApp desconectado.', 'info');
    } catch (error) {
      console.error('Error disconnecting:', error);
      addToast('Erro ao desconectar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Save AI Agent Configuration ---
  const handleSaveAgentConfig = async () => {
    if (!user || !whatsappConfig) return;
    try {
      setAgentConfigSaving(true);
      const { error } = await supabase
        .from('whatsapp_config')
        .update({
          agent_name: whatsappConfig.agentName,
          operation_mode: whatsappConfig.operationMode,
          away_message: whatsappConfig.awayMessage
        })
        .eq('user_id', user.id);

      if (error) throw error;
      addToast('Configurações do Agente salvas!', 'success');
    } catch (error) {
      console.error('Error saving agent config:', error);
      addToast('Erro ao salvar configurações.', 'error');
    } finally {
      setAgentConfigSaving(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('nome, sobrenome, email, whatsapp, cpf, creci, uf_creci, avatar, slug, cep, logradouro, numero, complemento, bairro, cidade, uf, show_address, raio_atuacao, watermark_dark, marca_dagua, instagram, facebook, threads, youtube, linkedin, x, mensagem_boasvindas, boasvindas2, sobre_mim, imoveis_vendidos, clientes_atendidos, anos_experiencia, plano_id')
        .eq('id', user?.id)
        .single();

      if (data) {
        setProfile({
          name: data.nome || user?.user_metadata?.name || '',
          sobrenome: data.sobrenome || '',
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
          raioAtuacao: data.raio_atuacao || 10,
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
          clientesAtendidos: data.clientes_atendidos || 0,
          anosExperiencia: data.anos_experiencia || 0
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
        nome: profile.name || null,
        sobrenome: profile.sobrenome || null,
        email: profile.email || null,
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
        show_address: profile.showAddress,
        raio_atuacao: profile.raioAtuacao || null,
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
        anos_experiencia: profile.anosExperiencia || null,
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
      if (error.code === '23505' && error.message?.includes('perfis_slug_key')) {
        addToast('Este slug já está em uso. Por favor, escolha outro.', 'error');
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

  const handleWatermarkUpload = async (file: File, type: 'dark' | 'marca') => {
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
      if (type === 'dark') {
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
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-medium
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

              {/* WhatsApp & IA */}
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-medium
                  ${activeTab === 'whatsapp'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-600/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                <div className="relative">
                  <MessageSquare size={16} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-ping"></span>
                </div>
                <span>WhatsApp & IA</span>
              </button>
            </>
          )}

          {/* XML Import Tab - Visible if plan allows */}
          {importConfig.canImport && (
            <button
              onClick={() => setActiveTab('importXml')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-medium
                  ${activeTab === 'importXml'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-600/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              <div className="relative">
                <Upload size={16} />
              </div>
              <span>Importação XML</span>
            </button>
          )}

        </div>
      </div>

      {/* Content Area */}
      <div className="bg-slate-800/50 rounded-3xl shadow-sm border border-slate-700/50 p-6 md:p-8 min-h-auto backdrop-blur-sm">

        {activeTab === 'account' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" data-tour="profile-settings">

            {/* 1. Header & Avatar */}
            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
              <Camera size={20} className="mr-2 text-emerald-500" /> Foto do Perfil
            </h4>
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-slate-800/50 rounded-3xl border border-slate-700">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className={`relative rounded-full ${verificationConfig ? `p-1 ${verificationConfig.gradientClass} ${verificationConfig.pulseClass}` : ''}`}>
                  <img
                    src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`}
                    alt="Profile"
                    className={`w-24 h-24 rounded-full object-cover border-4 shadow-lg transition-colors bg-slate-900 ${verificationConfig ? 'border-slate-900' : 'border-slate-600 group-hover:border-emerald-500'}`}
                  />
                </div>
                {verificationConfig && (
                  <div className="absolute -top-1 -right-1 z-30" title={verificationConfig.title}>
                    <img src={verificationConfig.badgeUrl} alt={verificationConfig.title} className={`w-10 h-10 drop-shadow-xl ${verificationConfig.pulseClass}`} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
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
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-fit px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-sm font-medium text-gray-200 transition-colors"
                  >
                    {uploading ? 'Enviando...' : 'Alterar Foto'}
                  </button>
                  <p className="text-xs text-slate-500 font-medium">
                    Recomendado: Imagem quadrada (1:1), PNG/JPG, até 2MB.
                  </p>
                </div>
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
                  disabled={true}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed outline-none transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {role !== 'Cliente' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

                {/* Warning Message for Vital Data */}
                <div className="mb-8 p-4 bg-red-900/10 border border-red-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-full text-red-500">
                      <AlertTriangle size={20} />
                    </div>
                    <p className="text-sm text-slate-300">
                      Informações vitais não podem ser alteradas diretamente. Para alterar seu <span className="text-white font-bold">Nome, CPF, CRECI ou WhatsApp</span>, entre em contato com o suporte.
                    </p>
                  </div>
                  <a
                    href="mailto:falecom@izibrokerz.com"
                    className="w-full md:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                  >
                    <AtSign size={16} />
                    Solicitar Alteração
                  </a>
                </div>
              </>
            )}

            {/* 3. Address Section */}
            <div className="mb-8 pt-6 border-t border-slate-700/50">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center"><MapPin size={20} className="mr-2 text-emerald-500" /> Seu Endereço (opcional)</h4>

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
                  <input
                    type="text"
                    value={profile.complemento}
                    onChange={e => setProfile({ ...profile, complemento: e.target.value })}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white"
                  />
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

            {/* 4. Security Section */}
            <div className="mb-8 pt-6 border-t border-slate-700/50">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                <Lock size={20} className="mr-2 text-emerald-500" /> Segurança
              </h4>

              <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-700/50 mb-6 font-geist">
                <h5 className="font-medium text-white mb-3">Alterar Senha</h5>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  <div className="w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nova Senha"
                      value={passwords.newPassword}
                      onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                      autoComplete="new-password"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 outline-none text-white text-sm"
                    />
                    {passwords.newPassword && <div className="mt-2"><PasswordStrengthIndicator password={passwords.newPassword} /></div>}
                  </div>
                  <div className="w-full">
                    <input
                      type="password"
                      placeholder="Confirmar Senha"
                      value={passwords.confirmPassword}
                      onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      autoComplete="new-password"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 outline-none text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={saving || !passwords.newPassword}
                    className="w-full h-[42px] bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-black/20"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Atualizar'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-8">
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

              {/* Importação de Dados MOVED to separate tab */}
            </div>

            {/* Modals */}
            <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />


            {/* Sticky Save Button (at the bottom of tab content) */}
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
            <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 mb-8">
              <h4 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <Share2 size={20} className="text-emerald-500" /> Endereço da Sua Página
              </h4>

              {(userProfile?.slug || slugSaved) ? (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Endereço da sua página (bloqueado)
                  </label>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-slate-500 text-sm font-medium whitespace-nowrap">
                      {window.location.origin}/
                    </span>
                    <input
                      type="text"
                      value={profile.slug}
                      disabled
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-500 font-mono cursor-not-allowed"
                    />
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/${profile.slug}`;
                        navigator.clipboard.writeText(url);
                        addToast('Copiado!', 'success');
                      }}
                      className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-400 hover:text-white transition-colors"
                      title="Copiar link"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => window.open(`/${profile.slug}`, '_blank')}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Eye size={16} /> Acessar
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Para alterar o endereço da sua página, entre em contato com o suporte.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Crie o endereço exclusivo da sua página profissional:
                  </label>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-slate-200 text-lg font-medium whitespace-nowrap">
                      {window.location.origin}/
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={profile.slug}
                        onChange={e => {
                          // Only allow lowercase letters and numbers
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setProfile({ ...profile, slug: value });
                          setSlugAvailable(null);

                          // Debounced availability check
                          if (slugCheckTimeout.current) {
                            clearTimeout(slugCheckTimeout.current);
                          }

                          if (value.length >= 5) {
                            setCheckingSlug(true);
                            slugCheckTimeout.current = setTimeout(async () => {
                              try {
                                const { data, error } = await supabase
                                  .from('perfis')
                                  .select('slug')
                                  .eq('slug', value)
                                  .maybeSingle();

                                if (!error) {
                                  setSlugAvailable(!data);
                                }
                              } catch (err) {
                                console.error('Erro ao verificar slug:', err);
                              } finally {
                                setCheckingSlug(false);
                              }
                            }, 500);
                          } else {
                            setCheckingSlug(false);
                          }
                        }}
                        placeholder="seu-nome-aqui"
                        className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900 border outline-none text-white font-mono transition-colors ${slugAvailable === true ? 'border-emerald-500 focus:border-emerald-500' :
                          slugAvailable === false ? 'border-red-500 focus:border-red-500' :
                            'border-slate-600 focus:border-emerald-500'
                          }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingSlug && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        {!checkingSlug && slugAvailable === true && <Check size={16} className="text-emerald-500" />}
                        {!checkingSlug && slugAvailable === false && <X size={16} className="text-red-500" />}
                      </div>
                    </div>
                  </div>
                  {slugAvailable === false && (
                    <p className="text-red-400 text-sm mb-3 flex items-center gap-1">
                      <X size={12} /> Este endereço já está em uso. Escolha outro.
                    </p>
                  )}
                  {slugAvailable === true && profile.slug.length >= 5 && (
                    <p className="text-emerald-400 text-sm mb-3 flex items-center gap-1">
                      <Check size={12} /> Endereço disponível!
                    </p>
                  )}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                    <p className="text-slate-200 text-sm font-medium flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <span>
                        Atenção: O endereço da sua página pode ser criado <strong>apenas uma vez</strong>.
                        Caso precise alterá-lo posteriormente, entre em contato com o suporte explicando o motivo.
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!profile.slug || profile.slug.length < 5) {
                        addToast('O endereço deve ter pelo menos 5 caracteres', 'error');
                        return;
                      }
                      try {
                        setSaving(true);
                        const { error } = await supabase
                          .from('perfis')
                          .update({ slug: profile.slug })
                          .eq('id', user?.id);

                        if (error) {
                          if (error.code === '23505') {
                            addToast('Este endereço já está em uso. Escolha outro.', 'error');
                          } else {
                            throw error;
                          }
                        } else {
                          setSlugSaved(true);
                          addToast('PARABÉNS! Endereço da página criado com sucesso!', 'success');
                        }
                      } catch (error) {
                        console.error('Erro ao salvar slug:', error);
                        addToast('Erro ao salvar o endereço', 'error');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || !profile.slug || profile.slug.length < 5 || slugAvailable !== true}
                    className="w-full px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Criar Meu Endereço
                  </button>
                </div>
              )}
            </div>

            {/* 2. WELCOME MESSAGES */}
            <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 mb-8">
              <h4 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <MessageCircle size={20} className="text-emerald-500" /> Mensagens de Boas-Vindas
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
                <Info size={20} className="text-emerald-500" /> Sobre & Estatísticas
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

              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Anos de Experiência</label>
                  <input
                    type="number"
                    value={profile.anosExperiencia || ''}
                    onChange={e => setProfile({ ...profile, anosExperiencia: parseInt(e.target.value) || 0 })}
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
        {activeTab === 'whatsapp' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="text-emerald-400" /> WhatsApp & IA
                </h3>
                <p className="text-slate-400">Conecte seu WhatsApp e ative o <span className="font-bold text-emerald-400">poder da IA para atender seus leads 24/7/365.</span></p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className={`w-2 h-2 rounded-full ${whatsappConfig?.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className={`text-xs font-bold uppercase tracking-wider ${whatsappConfig?.status === 'connected' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Status: {whatsappConfig?.status === 'connected' ? 'Servidor Online' : 'Servidor Pronto'}
                </span>
              </div>
            </div>

            {/* Current Tier Status Card */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-700/50 mb-10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* QR Code Placeholder / Live QR */}
                <div className="w-48 h-48 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-4 text-center p-4 relative">
                  {qrCode ? (
                    <div className="bg-white p-2 rounded-xl">
                      <img src={qrCode} alt="WhatsApp QR Code" className="w-32 h-32" />
                    </div>
                  ) : whatsappConfig?.status === 'connected' ? (
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex flex-col items-center gap-2">
                      <Check size={48} className="text-emerald-500" />
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Conectado</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/20">
                        <QrCode size={48} className="text-slate-500" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-tight">
                        Aguardando Conexão
                      </p>
                    </>
                  )}
                  {isConnecting && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Loader2 className="text-emerald-500 animate-spin" size={32} />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                    <span className={`px-3 py-1 ${planInfo.bgClass} text-white text-[10px] font-black rounded-lg uppercase tracking-wider`}>Seu Plano: {planInfo.name}</span>
                    {whatsappConfig && (
                      <span className="px-3 py-1 bg-white/5 text-slate-400 text-[10px] font-bold rounded-lg border border-white/10 uppercase tracking-wider">Instância: {whatsappConfig.instanceName}</span>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
                    {whatsappConfig?.status === 'connected' ? 'WhatsApp Conectado!' : 'Configure sua Conexão'}
                  </h4>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-lg">
                    {whatsappConfig?.status === 'connected'
                      ? 'Seu WhatsApp está pronto para uso. O botão flutuante e os links diretos já estão utilizando esta conexão.'
                      : 'Para desbloquear o Agente de IA, faça upgrade do plano.'
                    }
                  </p>

                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {/* Connect/Disconnect - Only for Avançado/Pro plans */}
                    {isPlanAvancadoOrPro && (
                      whatsappConfig?.status === 'connected' ? (
                        <button
                          onClick={handleDisconnectWhatsApp}
                          className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/30 transition-all flex items-center gap-2"
                        >
                          <Trash2 size={18} />
                          Desconectar WhatsApp
                        </button>
                      ) : (
                        <button
                          onClick={handleConnectWhatsApp}
                          disabled={isConnecting}
                          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                          {qrCode ? 'Gerar novo QR Code' : 'Conectar WhatsApp'}
                        </button>
                      )
                    )}

                    {/* Upgrade button - Always visible, but emphasized for Básico/Intermediário */}
                    <button
                      onClick={() => addToast('Em breve: escolha seu plano!', 'info')}
                      className={`px-6 py-2.5 font-bold rounded-xl active:scale-95 transition-all flex items-center gap-2 ${isPlanAvancadoOrPro
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        }`}
                    >
                      <Sparkles size={18} className={isPlanAvancadoOrPro ? 'text-emerald-400' : 'text-white'} />
                      {isPlanAvancadoOrPro ? 'Fazer Upgrade' : 'Fazer Upgrade p/ ativar AGENTE DE IA'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tip */}
            <div className="p-4 bg-emerald-900/50 rounded-2xl border border-emerald-700/50 flex items-center gap-4 mb-10">
              <div className="p-3 bg-emerald-800 rounded-xl text-slate-400"><Lightbulb size={24} /></div>
              <div className="flex-1">
                <h6 className="text-lg font-bold text-white">Por que conectar o WhatsApp?</h6>
                <p className="text-sm text-emerald-400">95% das vendas imobiliárias no Brasil começam pelo WhatsApp. <span className="font-bold text-white animate-pulse">Ter uma IA respondendo na hora, PODE AUMENTAR SUA CONVERSÃO EM ATÉ 300%.</span></p>
              </div>
            </div>

            {/* AI Agent Configuration - Visible to all, but DISABLED for Básico/Intermediário */}
            {(
              <div className="mb-10 relative">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 px-1 flex items-center gap-2">
                  <Bot size={16} className="text-emerald-400" />
                  Configurações do Agente IA
                  {!isPlanAvancadoOrPro && <span className="text-xs text-yellow-400 ml-2">🔒 Disponível nos planos Avançado e Profissional</span>}
                </h4>
                <div className={`p-6 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-700/50 ${!isPlanAvancadoOrPro ? 'opacity-60 pointer-events-none' : ''}`}>
                  {/* Single Row: Agent Name + Operation Modes */}
                  <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
                    {/* Agent Name */}
                    <div className="flex-shrink-0 lg:w-48">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Nome do Agente
                      </label>
                      <input
                        type="text"
                        value={whatsappConfig?.agentName || ''}
                        onChange={(e) => setWhatsappConfig(prev => prev ? { ...prev, agentName: e.target.value } : null)}
                        placeholder="Ex: MarIA, SophIA..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      />
                    </div>

                    {/* Operation Mode - Inline */}
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Modo de Operação
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <label className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all ${whatsappConfig?.operationMode === 'comercial' ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-600 text-white'}`}>
                          <input
                            type="radio"
                            name="operationMode"
                            value="comercial"
                            checked={whatsappConfig?.operationMode === 'comercial'}
                            onChange={(e) => setWhatsappConfig(prev => prev ? { ...prev, operationMode: e.target.value as 'comercial' | 'estendido' | '24h7' } : null)}
                            className="hidden"
                          />
                          <span className="text-sm font-bold whitespace-nowrap">Comercial (Seg a Sex)</span>
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all ${whatsappConfig?.operationMode === 'estendido' ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-600 text-white'}`}>
                          <input
                            type="radio"
                            name="operationMode"
                            value="estendido"
                            checked={whatsappConfig?.operationMode === 'estendido'}
                            onChange={(e) => setWhatsappConfig(prev => prev ? { ...prev, operationMode: e.target.value as 'comercial' | 'estendido' | '24h7' } : null)}
                            className="hidden"
                          />
                          <span className="text-sm font-bold whitespace-nowrap">Estendido (Seg a Sáb)</span>
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all ${whatsappConfig?.operationMode === '24h7' ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-600 text-white'}`}>
                          <input
                            type="radio"
                            name="operationMode"
                            value="24h7"
                            checked={whatsappConfig?.operationMode === '24h7'}
                            onChange={(e) => setWhatsappConfig(prev => prev ? { ...prev, operationMode: e.target.value as 'comercial' | 'estendido' | '24h7' } : null)}
                            className="hidden"
                          />
                          <span className="text-sm font-bold whitespace-nowrap">Sempre Online 24/7/365</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Away Message - Only show if not 24h7 */}
                  {whatsappConfig?.operationMode !== '24h7' && (
                    <div className="mt-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Mensagem de Ausência
                      </label>
                      <textarea
                        value={whatsappConfig?.awayMessage || ''}
                        onChange={(e) => setWhatsappConfig(prev => prev ? { ...prev, awayMessage: e.target.value } : null)}
                        rows={4}
                        placeholder="Digite a mensagem que será enviada fora do horário de atendimento..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all resize-none"
                      />
                      <p className="text-xs text-slate-500 mt-2">Use {'{LINK}'} para incluir o link do seu portfólio automaticamente.</p>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSaveAgentConfig}
                      disabled={agentConfigSaving}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {agentConfigSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Salvar Configurações
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Plans Comparison Grid - Modern UI */}
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 px-1">Recursos por Plano</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">

              {/* Plano Básico */}
              <div className={`p-5 rounded-3xl flex flex-col transition-all ${userProfile?.plano_id === 'ad586103-eb71-4ad0-af95-38a9e16b3c8f' ? 'bg-slate-500/10 border-2 border-slate-400/50' : 'bg-slate-900/40 border-2 border-slate-800/50 hover:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Básico</span>
                  <div className="p-2 bg-slate-800 rounded-xl text-slate-400"><MessageCircle size={18} /></div>
                </div>
                <h5 className="text-lg font-bold text-white mb-4">Botão Simples WA</h5>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-xs text-slate-400"><Check size={14} className="text-emerald-500" /> Botão Flutuante WA</li>
                  <li className="flex items-center gap-2 text-xs text-slate-600"><X size={14} /> Agente de IA</li>
                  <li className="flex items-center gap-2 text-xs text-slate-600"><X size={14} /> Selo Verificado</li>
                </ul>
                {userProfile?.plano_id === 'ad586103-eb71-4ad0-af95-38a9e16b3c8f' ? (
                  <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">✓ Plano Atual</p>
                  </div>
                ) : (
                  <button onClick={() => addToast('Planos em definição!', 'info')} className="mt-auto w-full py-2 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-500/30 transition-all">
                    Migrar
                  </button>
                )}
              </div>

              {/* Plano Intermediário */}
              <div className={`p-5 rounded-3xl flex flex-col transition-all ${userProfile?.plano_id === 'b974682b-cb4e-4a93-86ef-1efa47a2813c' ? 'bg-blue-500/10 border-2 border-blue-500/50' : 'bg-slate-900/60 border-2 border-slate-800/50 hover:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Intermediário</span>
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><Bot size={18} /></div>
                </div>
                <h5 className="text-lg font-bold text-white mb-4">ChatBot Padrão</h5>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-500" /> Perguntas e Respostas</li>
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-500" /> Triagem de Leads</li>
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-500" /> Selo Verificado <span className="text-orange-400 font-bold">BRONZE</span></li>
                </ul>
                {userProfile?.plano_id === 'b974682b-cb4e-4a93-86ef-1efa47a2813c' ? (
                  <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest text-center">✓ Plano Atual</p>
                  </div>
                ) : (
                  <button onClick={() => addToast('Planos em definição!', 'info')} className="mt-auto w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-500/30 transition-all">
                    Migrar
                  </button>
                )}
              </div>

              {/* Plano Avançado */}
              <div className={`p-5 rounded-3xl flex flex-col relative overflow-hidden group transition-all ${userProfile?.plano_id === '55de4ee5-c2f1-4f9d-b466-7e08138854f0' ? 'bg-emerald-500/20 border-2 border-emerald-500/60' : 'bg-emerald-500/10 border-2 border-emerald-500/30'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Avançado</span>
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><Sparkles size={18} /></div>
                </div>
                <h5 className="text-lg font-bold text-white mb-4">Agente de IA</h5>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-500" /> Conversa Fluida (LLM)</li>
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-500" /> Consulta de Imóveis</li>
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-emerald-500" /> Selo Verificado <span className="text-slate-300 font-bold">PRATA</span></li>
                </ul>
                {userProfile?.plano_id === '55de4ee5-c2f1-4f9d-b466-7e08138854f0' ? (
                  <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center">✓ Plano Atual</p>
                  </div>
                ) : (
                  <button onClick={() => addToast('Planos em definição!', 'info')} className="mt-auto w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                    Contratar
                  </button>
                )}
              </div>

              {/* Plano Profissional */}
              <div className={`p-5 rounded-3xl flex flex-col transition-all ${userProfile?.plano_id === 'edf90163-d554-4f8e-bfe9-7d9e98fc4450' ? 'bg-pink-500/20 border-2 border-pink-500/60' : 'bg-pink-500/10 border-2 border-pink-500/30 hover:border-pink-500/50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Profissional</span>
                  <div className="p-2 bg-pink-500/20 rounded-xl text-pink-400"><Zap size={18} /></div>
                </div>
                <h5 className="text-lg font-bold text-white mb-4">Escala Total</h5>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-pink-500" /> Atendimento Prioritário</li>
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-pink-500" /> Agente de IA ilimitado</li>
                  <li className="flex items-center gap-2 text-xs text-slate-200"><Check size={14} className="text-pink-500" /> Selo Verificado <span className="text-yellow-500 font-bold">OURO</span></li>
                </ul>
                {userProfile?.plano_id === 'edf90163-d554-4f8e-bfe9-7d9e98fc4450' ? (
                  <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest text-center">✓ Plano Atual</p>
                  </div>
                ) : (
                  <button onClick={() => addToast('Planos em definição!', 'info')} className="mt-auto w-full py-2 bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-pink-500/30 transition-all">
                    Migrar
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'importXml' && importConfig.canImport && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-white mb-2">Importação de Dados (XML)</h3>
            <p className="text-slate-400 mb-8">Traga seus imóveis de outras plataformas (Tecimob).</p>

            {/* Main Upload Section - Hidden for Admin */}
            {role !== 'Admin' && (
              <div className="p-8 bg-slate-800/50 rounded-3xl border border-slate-700 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload size={40} className="text-emerald-500" />
                </div>

                <h4 className="text-xl font-bold text-white mb-3">
                  Migração Automática de Imóveis
                </h4>

                <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                  Importe todo o seu portfólio via arquivo XML. Suportamos o padrão <b>Tecimob</b> e outros compatíveis.
                  Imóveis são importados como <span className="text-white font-bold bg-slate-700 px-2 py-0.5 rounded text-sm">Rascunho</span> para sua segurança.
                </p>

                <div className="inline-block p-4 bg-slate-900 rounded-2xl border border-slate-700 mb-8">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right border-r border-slate-700 pr-4">
                      <div className="text-slate-500">Seu Plano</div>
                      <div className="font-bold text-white max-w-[150px] truncate">{planInfo.name}</div>
                    </div>
                    <div className="text-left pl-2">
                      <div className="text-slate-500">Limite de Importação</div>
                      <div className="font-bold text-emerald-400">{importConfig.limit} imóveis / vez</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowImportDialog(true)}
                  className="w-full md:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                >
                  <Upload size={20} />
                  Iniciar Importação Agora
                </button>
              </div>
            )}

            {/* Admin Tools Section */}
            {role === 'Admin' && (
              <div className="mt-12 pt-8 border-t border-slate-700 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 text-left">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" /> Ferramentas Administrativas
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 1. Cleanup Tool */}
                  <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors">
                    <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4">
                      <Eraser className="w-6 h-6 text-blue-400" />
                    </div>
                    <h5 className="font-bold text-white mb-2">Limpar HTML</h5>
                    <p className="text-xs text-slate-400 mb-4 h-10">Remove formatação quebrada dos textos importados (bolds, tags, etc).</p>

                    {cleanupStatus === 'cleaning' ? (
                      <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse font-medium">
                        <Loader2 size={14} className="animate-spin" /> Limpando...
                      </div>
                    ) : cleanupStatus === 'success' && cleanupResult ? (
                      <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> {cleanupResult.fixed} limpos!
                      </div>
                    ) : (
                      <button
                        onClick={handleCleanup}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-all"
                      >
                        Executar Limpeza
                      </button>
                    )}
                  </div>

                  {/* 2. Geocoding Tool */}
                  <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors">
                    <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-4">
                      <MapPin className="w-6 h-6 text-purple-400" />
                    </div>
                    <h5 className="font-bold text-white mb-2">Auto Geomapping</h5>
                    <p className="text-xs text-slate-400 mb-4 h-10">Busca latitude/longitude automática baseada no endereço dos imóveis.</p>

                    {geoStatus === 'running' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-purple-400 font-medium">
                          <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Processando...</span>
                          <span>{Math.round((geoProgress.current / (geoProgress.total || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${(geoProgress.current / (geoProgress.total || 1)) * 100}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{geoProgress.message}</p>
                      </div>
                    ) : geoStatus === 'success' && geoResult ? (
                      <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> {geoResult.success} geolocalizados!
                      </div>
                    ) : (
                      <button
                        onClick={handleGeocode}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-all"
                      >
                        Iniciar Mapeamento
                      </button>
                    )}
                  </div>

                  {/* 3. Mass Publish Tool */}
                  <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors">
                    <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4">
                      <Rocket className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h5 className="font-bold text-white mb-2">Publicar em Massa</h5>
                    <p className="text-xs text-slate-400 mb-4 h-10">Converte todos os anúncios de 'Rascunho' para 'Ativo' de uma vez.</p>

                    {publishStatus === 'publishing' ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse font-medium">
                        <Loader2 size={14} className="animate-spin" /> Publicando...
                      </div>
                    ) : publishStatus === 'success' && publishResult ? (
                      <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> {publishResult.published} publicados!
                      </div>
                    ) : (
                      <button
                        onClick={handlePublish}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all"
                      >
                        Publicar Todos
                      </button>
                    )}
                  </div>

                  {/* 4. Image Migration Tool */}
                  <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors">
                    <div className="p-3 bg-orange-500/10 rounded-xl w-fit mb-4">
                      <ImageIcon className="w-6 h-6 text-orange-400" />
                    </div>
                    <h5 className="font-bold text-white mb-2">Migrar Imagens</h5>
                    <p className="text-xs text-slate-400 mb-4 h-10">Baixa fotos externas (Tecimob) e salva no Supabase Storage.</p>

                    {migrateStatus === 'running' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-orange-400 font-medium">
                          <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> {migrateProgress.message}</span>
                          <span>{Math.round((migrateProgress.current / (migrateProgress.total || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${(migrateProgress.current / (migrateProgress.total || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    ) : migrateStatus === 'success' && migrateResult ? (
                      <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> {migrateResult.success} migradas!
                      </div>
                    ) : (
                      <button
                        onClick={handleMigrateImages}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-all"
                      >
                        Iniciar Migração
                      </button>
                    )}
                  </div>
                </div>

                {(cleanupStatus === 'error' || geoStatus === 'error' || publishStatus === 'error' || migrateStatus === 'error') && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} /> Erro na execução da ferramenta. Verifique o console.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Modals */}
      < UploadDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        userId={user?.id || ''}
        limit={importConfig.limit}
        isAdmin={role === 'Admin'}
      />
    </div >
  );
};
