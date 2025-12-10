/**
 * Formatters - Funções de formatação centralizadas
 * @module lib/formatters
 */

/**
 * Formata valor monetário para BRL (sem centavos)
 * Ex: 300000 -> "R$ 300.000"
 */
export const formatCurrency = (value: number | null | undefined): string => {
    if (!value || value === 0) return 'Sob Consulta';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

/**
 * Formata valor monetário para exibição em input (sem R$)
 * Ex: "300000" -> "300.000"
 */
export const formatCurrencyInput = (value: string | number): string => {
    const numeric = String(value).replace(/\D/g, '');
    if (!numeric) return '';
    return Number(numeric).toLocaleString('pt-BR');
};

/**
 * Converte string formatada para número
 * Ex: "300.000" -> 300000
 */
export const parseCurrencyInput = (formatted: string): number => {
    return Number(formatted.replace(/\D/g, '')) || 0;
};

/**
 * Formata área com separador de milhar
 * Ex: 1500 -> "1.500"
 */
export const formatArea = (value: number | null | undefined): string => {
    if (!value || value === 0) return '0';
    return value.toLocaleString('pt-BR');
};

/**
 * Formata área para input (mesmo que formatCurrencyInput)
 */
export const formatAreaInput = (value: string | number): string => {
    const numeric = String(value).replace(/\D/g, '');
    if (!numeric) return '';
    return Number(numeric).toLocaleString('pt-BR');
};

/**
 * Converte string de área formatada para número
 */
export const parseAreaInput = (formatted: string): number => {
    return Number(formatted.replace(/\D/g, '')) || 0;
};
