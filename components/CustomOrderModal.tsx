import React, { useState } from 'react';
import { X, Send, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CustomOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId?: string;
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
    prefilledData
}) => {
    const [formData, setFormData] = useState({
        nome_cliente: '',
        whatsapp: '',
        email: '',
        operacao: prefilledData?.operacao || '',
        tipo_imovel: prefilledData?.tipoImovel || '',
        cidade: prefilledData?.cidade || 'Natal',
        bairros_interesse: prefilledData?.bairro ? [prefilledData.bairro] : [''],
        preco_minimo: 0,
        preco_maximo: prefilledData?.valorMax || 0,
        observacoes: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

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

        if (!formData.whatsapp.trim()) {
            setError('WhatsApp é obrigatório');
            setLoading(false);
            return;
        }

        if (!formData.email.trim() || !formData.email.includes('@')) {
            setError('E-mail válido é obrigatório');
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
            const { error: insertError } = await supabase
                .from('encomendar_imovel')
                .insert({
                    nome_cliente: formData.nome_cliente,
                    whatsapp: formData.whatsapp,
                    email: formData.email,
                    operacao: formData.operacao,
                    tipo_imovel: formData.tipo_imovel,
                    cidade: formData.cidade,
                    bairros_interesse: validBairros,
                    preco_minimo: formData.preco_minimo,
                    preco_maximo: formData.preco_maximo,
                    observacoes: formData.observacoes || null,
                    conversation_id: conversationId || null,
                    status: 'pendente'
                });

            if (insertError) throw insertError;

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err) {
            console.error('Error submitting custom order:', err);
            setError('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-midnight-950 rounded-lg p-8 max-w-md w-full text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Solicitação Enviada!</h3>
                    <p className="text-white">
                        Em breve um corretor entrará em contato com opções personalizadas para você!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-midnight-950 rounded-lg max-w-2xl w-full my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Encomendar Imóvel</h2>
                        <p className="text-sm text-white mt-1">
                            Preencha todos os campos e vamos encontrar o imóvel ideal para você.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-600 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Dados Pessoais */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-white">Seus Dados</h3>

                        <div>
                            <label className="block text-sm font-medium text-white mb-1">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.nome_cliente}
                                onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="João Silva"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    WhatsApp <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="(84) 99999-9999"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    E-mail <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="joao@email.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Interesse */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-bold text-gray-900">Imóvel Desejado</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Operação <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.operacao}
                                    onChange={(e) => setFormData({ ...formData, operacao: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="locacao">Alugar</option>
                                    <option value="venda">Comprar</option>
                                    <option value="temporada">Temporada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Imóvel <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.tipo_imovel}
                                    onChange={(e) => setFormData({ ...formData, tipo_imovel: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Apartamento, Casa, etc."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cidade <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.cidade}
                                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Natal"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bairros de Interesse (até 3) <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                                {formData.bairros_interesse.map((bairro, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={bairro}
                                            onChange={(e) => handleBairroChange(index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={`Bairro ${index + 1}`}
                                        />
                                        {formData.bairros_interesse.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBairro(index)}
                                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {formData.bairros_interesse.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={handleAddBairro}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        + Adicionar outro bairro
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Preço Mínimo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.preco_minimo}
                                    onChange={(e) => setFormData({ ...formData, preco_minimo: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="R$ 0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Preço Máximo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.preco_maximo}
                                    onChange={(e) => setFormData({ ...formData, preco_maximo: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="R$ 5.000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observações (opcional)
                            </label>
                            <textarea
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Exemplo: preciso de 3 quartos, vaga de garagem..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
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
