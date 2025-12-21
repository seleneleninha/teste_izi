import React, { useState } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';

interface DeactivatePropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyTitle: string;
    onSuccess: () => void;
}

type DeactivationReason = 'venda_faturada' | 'locacao_faturada' | 'imovel_perdido' | 'imovel_espera' | '';

export const DeactivatePropertyModal: React.FC<DeactivatePropertyModalProps> = ({
    isOpen,
    onClose,
    propertyId,
    propertyTitle,
    onSuccess
}) => {
    const [selectedReason, setSelectedReason] = useState<DeactivationReason>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const reasons = [
        {
            value: 'venda_faturada' as const,
            label: 'Imóvel vendido por mim',
            description: '✅ Parabéns! Venda concluída por você'
        },
        {
            value: 'locacao_faturada' as const,
            label: 'Imóvel alugado por mim',
            description: '✅ Parabéns! Locação concluída por você'
        },
        {
            value: 'imovel_perdido' as const,
            label: 'Vendido/alugado através de terceiros',
            description: '⚠️ Imóvel fechado por outro corretor'
        },
        {
            value: 'imovel_espera' as const,
            label: 'Proprietário desistiu de vender/alugar',
            description: '⏸️ Imóvel em standby (pode retomar futuramente)'
        }
    ];

    const handleConfirm = async () => {
        if (!selectedReason) {
            addToast('Por favor, selecione um motivo', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Update property status
            const { error } = await supabase
                .from('anuncios')
                .update({
                    status: selectedReason,
                    motivo_inativacao: reasons.find(r => r.value === selectedReason)?.label || '',
                    data_inativacao: new Date().toISOString()
                })
                .eq('id', propertyId);

            if (error) throw error;

            // 2. Remove from ALL users' favorites
            const { error: favoritesError } = await supabase
                .from('favoritos')
                .delete()
                .eq('anuncio_id', propertyId);

            if (favoritesError) {
                console.error('Error removing from favorites:', favoritesError);
                // Don't throw - property is already deactivated, this is cleanup
            }

            const successMessage = selectedReason.includes('faturada')
                ? '🎉 Parabéns pela conclusão!'
                : 'Imóvel inativado com sucesso';

            addToast(successMessage, 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error deactivating property:', error);
            addToast('Erro ao inativar imóvel: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-700">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Inativar Imóvel</h2>
                        <p className="text-slate-400 text-sm">{propertyTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Alert */}
                <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-yellow-200 text-sm font-medium">Esta ação não pode ser desfeita facilmente</p>
                        <p className="text-yellow-300/80 text-xs mt-1">
                            O imóvel será removido das buscas públicas. Selecione o motivo abaixo:
                        </p>
                    </div>
                </div>

                {/* Reasons */}
                <div className="space-y-3 mb-6">
                    {reasons.map((reason) => (
                        <label
                            key={reason.value}
                            className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedReason === reason.value
                                ? 'border-primary-500 bg-primary-900/20'
                                : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    name="deactivation-reason"
                                    value={reason.value}
                                    checked={selectedReason === reason.value}
                                    onChange={(e) => setSelectedReason(e.target.value as DeactivationReason)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-white text-sm">{reason.label}</p>
                                    <p className="text-slate-400 text-xs mt-1">{reason.description}</p>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedReason || isSubmitting}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>Inativando...</>
                        ) : (
                            <>
                                <Check size={18} />
                                Confirmar Inativação
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
