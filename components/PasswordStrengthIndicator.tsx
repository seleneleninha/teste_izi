// Password Strength Indicator Component
// Provides visual feedback for password strength

import React from 'react';
import { checkPasswordStrength } from '../lib/validation';
import { Check, X, AlertTriangle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
    password: string;
    showFeedback?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
    password,
    showFeedback = true
}) => {
    if (!password) return null;

    const { score, strength, feedback, warnings } = checkPasswordStrength(password);

    const strengthColors = {
        weak: 'bg-red-500',
        fair: 'bg-orange-500',
        good: 'bg-yellow-500',
        strong: 'bg-emerald-500'
    };

    const strengthLabels = {
        weak: 'Muito Fraca',
        fair: 'Fraca',
        good: 'Boa',
        strong: 'Forte'
    };

    const strengthTextColors = {
        weak: 'text-red-500',
        fair: 'text-orange-500',
        good: 'text-yellow-500',
        strong: 'text-emerald-500'
    };

    return (
        <div className="mt-2 space-y-2">
            {/* Strength bar */}
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${level <= score
                                ? strengthColors[strength]
                                : 'bg-gray-700'
                            }`}
                    />
                ))}
            </div>

            {/* Strength label */}
            <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${strengthTextColors[strength]}`}>
                    Força: {strengthLabels[strength]}
                </span>
                {strength === 'strong' && feedback.length === 0 && (
                    <span className="flex items-center gap-1 text-emerald-500">
                        <Check size={14} />
                        Segura
                    </span>
                )}
            </div>

            {/* Required feedback list (missing requirements - RED) */}
            {showFeedback && feedback.length > 0 && (
                <div className="text-xs space-y-1">
                    <p className="font-medium text-red-400">Requisitos obrigatórios:</p>
                    <ul className="space-y-1">
                        {feedback.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-red-400">
                                <X size={14} className="flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Warning feedback list (recommendations - YELLOW) */}
            {showFeedback && warnings.length > 0 && (
                <div className="text-xs space-y-1">
                    <p className="font-medium text-yellow-400">⚠️ Recomendações de segurança:</p>
                    <ul className="space-y-1">
                        {warnings.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-yellow-400">
                                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Success feedback */}
            {showFeedback && feedback.length === 0 && warnings.length === 0 && strength === 'strong' && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check size={14} />
                    Senha excelente! Atende todos os requisitos de segurança.
                </p>
            )}

            {/* Partial success (good password with warnings) */}
            {showFeedback && feedback.length === 0 && warnings.length > 0 && strength === 'good' && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                    <Check size={14} />
                    Senha atende os requisitos mínimos.
                </p>
            )}
        </div>
    );
};
