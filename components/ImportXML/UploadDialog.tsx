import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, Link as LinkIcon, Globe, ShieldCheck, Eraser, Check, MapPin, Rocket } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { processXMLImport, ImportResult, cleanupHtmlArtifacts, batchGeocodeProperties, massPublishProperties } from '../../api/import-xml/client';

interface UploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    limit?: number;
    isAdmin?: boolean;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ isOpen, onClose, userId, limit, isAdmin = false }) => {
    const [activeTab, setActiveTab] = useState<'file' | 'link' | 'tools'>('file');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [cleanupResult, setCleanupResult] = useState<{ fixed: number, total: number } | null>(null);
    const [cleanupStatus, setCleanupStatus] = useState<'idle' | 'cleaning' | 'success' | 'error'>('idle');
    const [geoStatus, setGeoStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [geoProgress, setGeoProgress] = useState<{ current: number, total: number, message: string }>({ current: 0, total: 0, message: '' });
    const [geoResult, setGeoResult] = useState<{ success: number, failed: number } | null>(null);
    const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
    const [publishResult, setPublishResult] = useState<{ published: number, total: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCleanup = async () => {
        setCleanupStatus('cleaning');
        try {
            const res = await cleanupHtmlArtifacts(supabase, userId);
            setCleanupResult(res);
            setCleanupStatus('success');
        } catch (e: any) {
            setErrorMsg(e.message);
            setCleanupStatus('error');
        }
    };

    const handleGeocode = async () => {
        setGeoStatus('running');
        setGeoProgress({ current: 0, total: 0, message: 'Iniciando...' });
        try {
            const res = await batchGeocodeProperties(
                supabase,
                userId,
                (current, total, message) => setGeoProgress({ current, total, message })
            );
            setGeoResult(res);
            setGeoStatus('success');
        } catch (e: any) {
            setErrorMsg(e.message);
            setGeoStatus('error');
        }
    }


    const handlePublish = async () => {
        setPublishStatus('publishing');
        try {
            const res = await massPublishProperties(supabase, userId);
            setPublishResult(res);
            setPublishStatus('success');
        } catch (e: any) {
            setErrorMsg(e.message);
            setPublishStatus('error');
        }
    };

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.type === 'text/xml' || droppedFile.name.endsWith('.xml'))) {
            setFile(droppedFile);
            setResult(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const processText = async (text: string) => {
        setImporting(true);
        setResult(null);
        try {
            // Pass limit to processXMLImport
            const res = await processXMLImport(text, supabase, userId, limit);
            setResult(res);
        } catch (error: any) {
            setResult({
                total: 0,
                imported: 0,
                duplicates: 0,
                errors: [`Erro crítico: ${error.message} `]
            });
        } finally {
            setImporting(false);
        }
    };

    const handleImportFile = async () => {
        if (!file) return;
        try {
            const text = await file.text();
            await processText(text);
        } catch (e: any) {
            setResult({ total: 0, imported: 0, duplicates: 0, errors: ["Erro ao ler arquivo."] });
        }
    };

    const handleImportLink = async () => {
        if (!url) return;
        setImporting(true);
        setResult(null);

        // Tentar fetch direto primeiro
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro ao baixar XML");
            const text = await response.text();
            await processText(text);
        } catch (error) {
            // Se falhar (provável CORS), avisar usuário
            setImporting(false);
            setResult({
                total: 0,
                imported: 0,
                duplicates: 0,
                errors: [
                    "Bloqueio de segurança do navegador (CORS).",
                    "Ação necessária: Baixe o arquivo XML e use a aba 'Arquivo'."
                ]
            });
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setUrl('');
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Upload className="text-emerald-500" size={24} />
                            Importar Imóveis
                        </h2>
                        <div className="flex flex-col">
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">
                                Modo Seguro: Importados como Rascunho
                            </p>
                            {limit && limit > 0 && (
                                <p className="text-xs text-emerald-400 mt-0.5">
                                    Limite do seu plano: <b>{limit} imóveis</b>
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition p-1"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Tabs */}
                {!importing && !result && (
                    <div className="flex border-b border-slate-700">
                        <button
                            onClick={() => setActiveTab('file')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'file' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            Arquivo (XML)
                        </button>
                        <button
                            onClick={() => setActiveTab('link')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'link' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            Link / URL
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('tools')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'tools' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Ferramentas
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* Tools Tab */}
                    {activeTab === 'tools' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg">
                                        <Eraser className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-white mb-2">Limpar Formatação HTML</h3>
                                        <p className="text-sm text-slate-400 mb-4">
                                            Remove tags HTML (como negrito, itálico) e caracteres de formatação dos títulos e descrições dos <b>imóveis em Rascunho</b>.
                                            Ideal para corrigir textos importados com códigos estranhos (ex: &lt;b&gt;).
                                        </p>

                                        {cleanupStatus === 'cleaning' ? (
                                            <div className="flex items-center gap-2 text-sm text-blue-400 animate-pulse">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Limpando textos... aguarde.
                                            </div>
                                        ) : cleanupStatus === 'success' && cleanupResult ? (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400 mb-2 flex gap-2">
                                                <CheckCircle size={18} />
                                                <span>Feito! <b>{cleanupResult.fixed}</b> de {cleanupResult.total} imóveis foram limpos.</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleCleanup}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Executar Limpeza Agora
                                            </button>
                                        )}
                                        {cleanupStatus === 'error' && (
                                            <p className="text-red-400 text-xs mt-2">Erro: {errorMsg}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Geolocation Tool */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-amber-500/20 rounded-lg">
                                        <MapPin className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-white mb-2">Geolocalização Automática</h3>
                                        <p className="text-sm text-slate-400 mb-4">
                                            Busca automaticamente a Latitude e Longitude para imóveis em <b>Rascunho</b> que tenham CEP válido.
                                            Isso permite que eles apareçam no mapa.
                                            <br /><span className="text-amber-400/80 text-xs mt-1 block">⚠️ Processo lento (~1.5s por imóvel) para respeitar limites da API gratuita.</span>
                                        </p>

                                        {geoStatus === 'running' ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs text-amber-400">
                                                    <span>Processando... {geoProgress.current}/{geoProgress.total}</span>
                                                    <span>{Math.round((geoProgress.current / (geoProgress.total || 1)) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-amber-500 h-full transition-all duration-300"
                                                        style={{ width: `${(geoProgress.current / (geoProgress.total || 1)) * 100}% ` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 animate-pulse">{geoProgress.message}</p>
                                            </div>
                                        ) : geoStatus === 'success' && geoResult ? (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400 mb-2 flex gap-2">
                                                <CheckCircle size={18} />
                                                <span>Sucesso! <b>{geoResult.success}</b> localizados. <span className="text-red-400">({geoResult.failed} falharam)</span></span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleGeocode}
                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Iniciar Geolocalização
                                            </button>
                                        )}
                                        {geoStatus === 'error' && (
                                            <p className="text-red-400 text-xs mt-2">Erro: {errorMsg}</p>
                                        )}
                                    </div>
                                </div>
                            </div>


                            {/* Publish Tool */}
                            <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                                        <Rocket className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-white mb-2">Publicar Imóveis (Em Massa)</h3>
                                        <p className="text-sm text-slate-400 mb-4">
                                            Transforma todos os seus imóveis que estão em <b>Rascunho</b> para <b>Ativo</b>.
                                            Eles ficarão visíveis imediatamente no site e nas buscas.
                                        </p>

                                        {publishStatus === 'publishing' ? (
                                            <div className="flex items-center gap-2 text-sm text-emerald-400 animate-pulse">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Publicando imóveis...
                                            </div>
                                        ) : publishStatus === 'success' && publishResult ? (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400 mb-2 flex gap-2">
                                                <CheckCircle size={18} />
                                                <span>Sucesso! <b>{publishResult.published}</b> imóveis agora estão Ativos! 🚀</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handlePublish}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                                            >
                                                Publicar Tudo Agora
                                            </button>
                                        )}
                                        {publishStatus === 'error' && (
                                            <p className="text-red-400 text-xs mt-2">Erro: {errorMsg}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* File Tab */}
                    {!result && activeTab === 'file' && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] w-full
                                ${isDragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800'}
                                ${file ? 'bg-slate-800 border-emerald-500/30' : ''}
                            `}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".xml"
                                className="hidden"
                            />

                            {file ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="text-emerald-400" size={32} />
                                    </div>
                                    <h3 className="text-white font-medium mb-1">{file.name}</h3>
                                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); reset(); }}
                                        className="mt-4 text-xs text-red-400 hover:text-red-300 hover:underline"
                                    >
                                        Remover arquivo
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-700 transition">
                                        <Download className="text-slate-400 group-hover:text-emerald-400 transition" size={32} />
                                    </div>
                                    <h3 className="text-white font-medium mb-1">Clique para selecionar</h3>
                                    <p className="text-sm text-slate-400 mb-4">ou arraste o arquivo XML aqui</p>
                                    <span className="text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400">
                                        Suporta: Tecimob
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Link Tab */}
                    {!result && activeTab === 'link' && (
                        <div className="min-h-[200px] flex flex-col justify-center">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Cole o link do arquivo XML</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon className="text-slate-500" size={18} />
                                </div>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://site.com/feed.xml"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                <Globe size={12} className="inline mr-1" />
                                Dica: O link deve terminar em .xml
                            </p>

                            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <p className="text-xs text-amber-200 flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        Alguns sites bloqueiam acesso direto (CORS). Se falhar, copie o link, faça download no seu computador e use a aba "Arquivo".
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {importing && (
                        <div className="text-center py-8">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                            <h3 className="text-white font-medium">Processando XML...</h3>
                            <p className="text-sm text-slate-400 mt-2">Isso pode levar alguns segundos.</p>
                        </div>
                    )}

                    {/* Results */}
                    {result && !importing && (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                                    <div className="text-xs text-slate-400 mb-1">Total</div>
                                    <div className="text-xl font-bold text-white">{result.total}</div>
                                </div>
                                <div className="bg-emerald-900/20 p-3 rounded-lg text-center border border-emerald-500/30">
                                    <div className="text-xs text-emerald-400 mb-1">Importados</div>
                                    <div className="text-xl font-bold text-emerald-400">{result.imported}</div>
                                </div>
                                <div className="bg-orange-900/20 p-3 rounded-lg text-center border border-orange-500/30">
                                    <div className="text-xs text-orange-400 mb-1">Duplicados</div>
                                    <div className="text-xl font-bold text-orange-400">{result.duplicates}</div>
                                </div>
                            </div>

                            {result.imported > 0 && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
                                    <Check className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                                    <div>
                                        <h4 className="text-sm font-medium text-green-400">Sucesso!</h4>
                                        <p className="text-xs text-green-300 mt-0.5">
                                            {result.imported} imóveis foram adicionados como <b>Rascunho</b>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {result.errors.length > 0 && (
                                <div className={`p - 3 rounded - lg border ${result.errors[0].includes("CORS") ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'} `}>
                                    <div className="flex items-start gap-3 mb-2">
                                        <AlertCircle className={`mt - 0.5 flex - shrink - 0 ${result.errors[0].includes("CORS") ? 'text-amber-500' : 'text-red-500'} `} size={18} />
                                        <h4 className={`text - sm font - medium ${result.errors[0].includes("CORS") ? 'text-amber-400' : 'text-red-400'} `}>
                                            {result.errors[0].includes("CORS") ? 'Atenção Necessária' : 'Erros Encontrados'}
                                        </h4>
                                    </div>
                                    <ul className={`text - xs space - y - 1 max - h - 32 overflow - y - auto pl - 8 list - disc ${result.errors[0].includes("CORS") ? 'text-amber-200' : 'text-red-300'} `}>
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>

                                    {result.errors[0].includes("CORS") && url && (
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 block w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold text-center rounded-lg transition"
                                        >
                                            <Download size={14} className="inline mr-2" />
                                            Baixar Arquivo Manualmente
                                        </a>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={reset}
                                className="w-full py-2 text-sm text-slate-400 hover:text-white underline"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                </div>

                {/* Footer */}
                {
                    !result && !importing && (
                        <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition text-sm font-medium"
                            >
                                Cancelar
                            </button>

                            {activeTab === 'file' ? (
                                <button
                                    onClick={handleImportFile}
                                    disabled={!file}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                    <Upload size={18} />
                                    Importar Arquivo
                                </button>
                            ) : (
                                <button
                                    onClick={handleImportLink}
                                    disabled={!url || url.length < 5}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                    <Globe size={18} />
                                    Importar URL
                                </button>
                            )}
                        </div>
                    )
                }
            </div >
        </div >
    );
};
