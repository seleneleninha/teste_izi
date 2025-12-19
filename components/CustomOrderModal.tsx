import React, { useState } from 'react';
import { X, Send, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CustomOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId?: string;
    brokerId?: string; // ID do corretor ou 'plataforma' para PublicHome
    prefilledData?: {
        operacao?: string;
        tipoImovel?: string;
        cidade?: string;
        bairro?: string;
        valorMax?: number;
    };
}

export const CustomOrderModal: React.FC<CustomOrderModalProps> = ({
    isOpen,
    onClose,
    conversationId,
    brokerId,
    prefilledData
}) => {
    const [formData, setFormData] = useState({
        nome_cliente: '',
        whatsapp: '',
        operacao: prefilledData?.operacao || '',
        tipo_imovel: prefilledData?.tipoImovel || '',
        cidade: prefilledData?.cidade || 'Natal',
        bairros_interesse: prefilledData?.bairro ? [prefilledData.bairro] : [''],
        preco_minimo: 0,
        preco_maximo: prefilledData?.valorMax || 0,
        metragem: 0,
        quartos: 0,
        banheiros: 0,
        vagas: 0,
        observacoes: ''
    });

    // Máscaras de input
    const formatWhatsApp = (value: string) => {
        const numbers = value.replace(/\D/g, '').slice(0, 11);
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)})${numbers.slice(2)}`;
        return `(${numbers.slice(0, 2)})${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    };

    const formatCurrencyValue = (value: string | number): string => {
        const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) || 0 : value;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    };

    const parseCurrency = (value: string): number => {
        return parseInt(value.replace(/\D/g, '')) || 0;
    };

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Função para resetar formulário
    const resetForm = () => {
        setFormData({
            nome_cliente: '',
            whatsapp: '',
            operacao: '',
            tipo_imovel: '',
            cidade: 'Natal',
            bairros_interesse: [''],
            preco_minimo: 0,
            preco_maximo: 0,
            metragem: 0,
            quartos: 0,
            banheiros: 0,
            vagas: 0,
            observacoes: ''
        });
        setError('');
        setLoading(false);
        setSuccess(false);
    };

    if (!isOpen) return null;

    const handleAddBairro = () => {
        if (formData.bairros_interesse.length < 3) {
            setFormData({
                ...formData,
                bairros_interesse: [...formData.bairros_interesse, '']
            });
        }
    };

    const handleRemoveBairro = (index: number) => {
        setFormData({
            ...formData,
            bairros_interesse: formData.bairros_interesse.filter((_, i) => i !== index)
        });
    };

    const handleBairroChange = (index: number, value: string) => {
        const newBairros = [...formData.bairros_interesse];
        newBairros[index] = value;
        setFormData({ ...formData, bairros_interesse: newBairros });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (!formData.nome_cliente.trim()) {
            setError('Nome é obrigatório');
            setLoading(false);
            return;
        }

        const validBairros = formData.bairros_interesse.filter(b => b.trim() !== '');
        if (validBairros.length === 0) {
            setError('Pelo menos 1 bairro é obrigatório');
            setLoading(false);
            return;
        }

        if (formData.preco_maximo <= 0) {
            setError('Preço máximo é obrigatório');
            setLoading(false);
            return;
        }

        if (formData.preco_minimo >= formData.preco_maximo) {
            setError('Preço mínimo deve ser menor que o máximo');
            setLoading(false);
            return;
        }

        try {
            // Debug: verificar valor do brokerId
            console.log('CustomOrderModal - brokerId recebido:', brokerId);
            console.log('CustomOrderModal - assigned_broker_id que será salvo:', brokerId || null);

            const { error: insertError } = await supabase
                .from('encomendar_imovel')
                .insert({
                    nome_cliente: formData.nome_cliente,
                    whatsapp: formData.whatsapp || null,
                    operacao: formData.operacao,
                    tipo_imovel: formData.tipo_imovel,
                    cidade: formData.cidade,
                    bairros_interesse: validBairros,
                    preco_minimo: formData.preco_minimo,
                    preco_maximo: formData.preco_maximo,
                    metragem: formData.metragem || null,
                    quartos: formData.quartos || null,
                    banheiros: formData.banheiros || null,
                    vagas: formData.vagas || null,
                    observacoes: formData.observacoes || null,
                    conversation_id: conversationId || null,
                    assigned_broker_id: brokerId || null, // NULL se vier de PublicHome, broker ID se vier de BrokerPage
                    status: 'pendente'
                });

            if (insertError) throw insertError;

            setSuccess(true);
            // Removido setTimeout para deixar modal aberto até usuário fechar
        } catch (err) {
            console.error('Error submitting custom order:', err);
            setError('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-midnight-900 rounded-2xl p-8 max-w-md w-full text-center relative border border-slate-700 shadow-2xl">
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1"
                    >
                        <X size={22} />
                    </button>
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Encomenda realizada!</h3>
                    <p className="text-white">
                        Obrigado pela confiança e vamos comunicar nossos Corretores Parceiros sobre o seu imóvel ideal.                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 overflow-y-auto">
            <div className="bg-midnight-900 rounded-2xl max-w-lg w-full my-4 mx-4 border border-slate-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">Encomendar Imóvel</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Preencha os campos e vamos encontrar o imóvel ideal para você.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="text-gray-400 hover:text-white transition p-1"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
                            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Dados Pessoais */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-white text-sm">Seus Dados</h3>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Nome e Sobrenome <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.nome_cliente}
                                onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500"
                                placeholder="João Silva"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    WhatsApp (opcional)
                                </label>
                                <input
                                    type="tel"
                                    value={formatWhatsApp(formData.whatsapp)}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })}
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500"
                                    placeholder="(84) 99999-9999"
                                    maxLength={15}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Interesse */}
                    <div className="space-y-3 pt-3 border-t border-slate-700">
                        <h3 className="font-semibold text-white text-sm">Imóvel Desejado</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Quero para <span className="text-red-400">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.operacao}
                                    onChange={(e) => setFormData({ ...formData, operacao: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                >
                                    <option value="" className="bg-slate-800">Selecione...</option>
                                    <option value="locacao" className="bg-slate-800">Alugar</option>
                                    <option value="venda" className="bg-slate-800">Comprar</option>
                                    <option value="temporada" className="bg-slate-800">Temporada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Tipo de Imóvel <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.tipo_imovel}
                                    onChange={(e) => setFormData({ ...formData, tipo_imovel: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500"
                                    placeholder="Apartamento, Casa, etc."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Cidade <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.cidade}
                                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500"
                                placeholder="Natal"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                Bairros de Interesse (informe ao menos um) <span className="text-red-400">*</span>
                            </label>
                            <div className="space-y-2">
                                {formData.bairros_interesse.map((bairro, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={bairro}
                                            onChange={(e) => handleBairroChange(index, e.target.value)}
                                            className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500"
                                            placeholder={`Bairro ${index + 1}`}
                                        />
                                        {formData.bairros_interesse.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBairro(index)}
                                                className="px-3 py-2.5 text-red-400 hover:bg-red-900/20 rounded-lg transition"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {formData.bairros_interesse.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={handleAddBairro}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                                    >
                                        + Adicionar outro bairro
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Características do Imóvel */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                Características Desejadas (opcional)
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                <div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.metragem || ''}
                                        onChange={(e) => setFormData({ ...formData, metragem: Number(e.target.value) || 0 })}
                                        className="w-full px-2 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500 text-center"
                                        placeholder="m²"
                                    />
                                    <div className="text-xs text-gray-500 text-center mt-1">Área</div>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.quartos || ''}
                                        onChange={(e) => setFormData({ ...formData, quartos: Number(e.target.value) || 0 })}
                                        className="w-full px-2 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500 text-center"
                                        placeholder="0"
                                    />
                                    <div className="text-xs text-gray-500 text-center mt-1">Quartos</div>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.banheiros || ''}
                                        onChange={(e) => setFormData({ ...formData, banheiros: Number(e.target.value) || 0 })}
                                        className="w-full px-2 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500 text-center"
                                        placeholder="0"
                                    />
                                    <div className="text-xs text-gray-500 text-center mt-1">Banh.</div>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.vagas || ''}
                                        onChange={(e) => setFormData({ ...formData, vagas: Number(e.target.value) || 0 })}
                                        className="w-full px-2 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500 text-center"
                                        placeholder="0"
                                    />
                                    <div className="text-xs text-gray-500 text-center mt-1">Vagas</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Preço Mínimo <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formatCurrencyValue(formData.preco_minimo)}
                                    onChange={(e) => setFormData({ ...formData, preco_minimo: parseCurrency(e.target.value) })}
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500"
                                    placeholder="R$ 0"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                    Preço Máximo <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formatCurrencyValue(formData.preco_maximo)}
                                    onChange={(e) => setFormData({ ...formData, preco_maximo: parseCurrency(e.target.value) })}
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm placeholder:text-gray-500"
                                    placeholder="R$ 5.000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Observações (opcional)
                            </label>
                            <textarea
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm resize-none placeholder:text-gray-500"
                                placeholder="Exemplo: preciso de 3 quartos, vaga de garagem..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-5 py-2.5 border border-slate-600 text-gray-300 rounded-lg font-medium hover:bg-slate-800 transition text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Encomendar Imóvel
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
