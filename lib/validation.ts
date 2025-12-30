// Security & Validation Utilities for iziBrokerz
// Protects against XSS, SQL injection, and validates user inputs

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Raw user input
 * @returns Sanitized string safe for display
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';

    return DOMPurify.sanitize(input.trim(), {
        ALLOWED_TAGS: [], // Remove all HTML tags
        ALLOWED_ATTR: []  // Remove all attributes
    });
};

/**
 * Sanitize HTML content (for rich text editors)
 * @param html - Raw HTML content
 * @returns Sanitized HTML safe for innerHTML
 */
export const sanitizeHTML = (html: string): string => {
    if (!html) return '';

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li', 'ol'],
        ALLOWED_ATTR: ['href', 'target']
    });
};

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export const validateEmail = (email: string): boolean => {
    if (!email) return false;

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.toLowerCase());
};

/**
 * Traduz erros comuns do Supabase Auth para mensagens amigáveis em Português
 * @param error - O erro original retornado pelo Supabase
 * @returns Mensagem traduzida
 */
export const translateAuthError = (error: any): string => {
    if (!error) return 'Ocorreu um erro desconhecido.';

    const message = typeof error === 'string' ? error : (error.message || '');

    if (message.includes('Invalid login credentials')) return 'Email ou senha inválidos. Verifique seus dados.';
    if (message.includes('User already registered')) return 'Este email já está cadastrado. Tente fazer login.';
    if (message.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (message.includes('Email not confirmed')) return 'Este email ainda não foi confirmado. Verifique sua caixa de entrada.';
    if (message.includes('Too many requests')) return 'Muitas tentativas em pouco tempo. Tente novamente mais tarde.';
    if (message.includes('Email address not found')) return 'Este endereço de email não foi encontrado.';

    // Database errors with specific field information
    if (message.includes('Database error saving new user')) {
        // Check for specific field errors from Supabase function
        if (message.includes('CPF já cadastrado')) return 'CPF já cadastrado por outro usuário.';
        if (message.includes('Email já cadastrado')) return 'Email já cadastrado por outro usuário.';
        if (message.includes('WhatsApp já cadastrado')) return 'WhatsApp já cadastrado por outro usuário.';
        if (message.includes('Slug já cadastrado')) return 'Este nome de página já está em uso.';
        return 'Erro ao salvar perfil. Verifique seus dados e tente novamente.';
    }

    return message || 'Erro ao realizar autenticação. Tente novamente.';
};

/**
 * Validate Brazilian phone number
 * @param phone - Phone number to validate
 * @returns true if valid Brazilian phone format
 */
export const validatePhone = (phone: string): boolean => {
    if (!phone) return false;

    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Valid formats: 11 digits (with 9) or 10 digits (without 9)
    // Examples: (11) 98765-4321 or (11) 8765-4321
    return /^[1-9]{2}9?\d{8}$/.test(cleaned);
};

/**
 * Format phone number for display
 * @param phone - Raw phone number
 * @returns Formatted phone: (11) 98765-4321
 */
export const formatPhone = (phone: string): string => {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
        // (11) 98765-4321
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
        // (11) 8765-4321
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
};

/**
 * Validate CRECI number (Brazilian realtor license)
 * @param creci - CRECI number to validate
 * @returns true if valid CRECI format
 */
export const validateCRECI = (creci: string): boolean => {
    if (!creci) return false;

    // Format: 1234, 12345, 123456, optionally with -F, -J, -T
    return /^[0-9]{4,6}(-[FJTP])?$/i.test(creci);
};

/**
 * Validate CPF (Brazilian individual taxpayer ID)
 * @param cpf - CPF to validate
 * @returns true if valid CPF
 */
export const validateCPF = (cpf: string): boolean => {
    if (!cpf) return false;

    // Remove non-numeric characters
    const cleaned = cpf.replace(/\D/g, '');

    // Must have 11 digits
    if (cleaned.length !== 11) return false;

    // Reject known invalid sequences
    const invalidSequences = [
        '00000000000', '11111111111', '22222222222', '33333333333',
        '44444444444', '55555555555', '66666666666', '77777777777',
        '88888888888', '99999999999'
    ];

    if (invalidSequences.includes(cleaned)) return false;

    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    if (parseInt(cleaned.charAt(9)) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    return parseInt(cleaned.charAt(10)) === digit2;
};

/**
 * Validate CNPJ (Brazilian company taxpayer ID)
 * @param cnpj - CNPJ to validate
 * @returns true if valid CNPJ
 */
export const validateCNPJ = (cnpj: string): boolean => {
    if (!cnpj) return false;

    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) return false;

    // Reject known invalid sequences
    const invalidSequences = [
        '00000000000000', '11111111111111', '22222222222222', '33333333333333',
        '44444444444444', '55555555555555', '66666666666666', '77777777777777',
        '88888888888888', '99999999999999'
    ];

    if (invalidSequences.includes(cleaned)) return false;

    // Validate check digits
    let size = cleaned.length - 2;
    let numbers = cleaned.substring(0, size);
    const digits = cleaned.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size++;
    numbers = cleaned.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
};

/**
 * Check password strength with iziBrokerz rules
 * Regras:
 * - 8 caracteres no mínimo
 * - Ao menos uma letra maiúscula
 * - Ao menos um caractere especial (!@#$%&)
 * - Dica: evite números repetidos e datas
 * 
 * @param password - Password to check
 * @returns Score (0-4), strength level, and feedback array
 */
export const checkPasswordStrength = (password: string): {
    score: number;
    strength: 'weak' | 'fair' | 'good' | 'strong';
    feedback: string[];
    warnings: string[];
} => {
    let score = 0;
    const feedback: string[] = [];
    const warnings: string[] = [];

    if (!password) {
        return { score: 0, strength: 'weak', feedback: ['Senha é obrigatória'], warnings: [] };
    }

    // ✅ CRITICAL: Length check (8 minimum)
    if (password.length >= 8) {
        score++;
    } else {
        feedback.push('Use pelo menos 8 caracteres');
    }

    // ✅ CRITICAL: Uppercase check (required)
    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push('Inclua ao menos uma letra maiúscula');
    }

    // ✅ CRITICAL: Special character check (required: !@#$%&)
    if (/[!@#$%&]/.test(password)) {
        score++;
    } else {
        feedback.push('Inclua ao menos um caractere especial (!@#$%&)');
    }

    // Lowercase check (bonus)
    if (/[a-z]/.test(password)) {
        score++;
    } else {
        feedback.push('Use letras minúsculas também');
    }

    // ⚠️ WARNING: Repeated numbers (e.g., 111, 222, 123456)
    if (/(\d)\1{2,}/.test(password)) {
        warnings.push('Evite números repetidos (ex: 111, 222)');
    }

    // ⚠️ WARNING: Sequential numbers (123456, 654321)
    if (/(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(password)) {
        warnings.push('Evite sequências numéricas (ex: 123456)');
    }

    // ⚠️ WARNING: Common date patterns (e.g., 1990, 2000, 01/01)
    if (/(19\d{2}|20\d{2})/.test(password)) {
        warnings.push('Evite usar datas (ex: 1990, 2000)');
    }

    // ⚠️ WARNING: Very short password
    if (password.length < 10 && score >= 3) {
        warnings.push('Considere usar 10+ caracteres para maior segurança');
    }

    const strengthMap = {
        0: 'weak',
        1: 'weak',
        2: 'fair',
        3: 'good',
        4: 'strong'
    } as const;

    return {
        score,
        strength: strengthMap[Math.min(score, 4) as keyof typeof strengthMap],
        feedback,
        warnings
    };
};

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns true if valid URL
 */
export const validateURL = (url: string): boolean => {
    if (!url) return false;

    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Validate CEP (Brazilian postal code)
 * @param cep - CEP to validate
 * @returns true if valid CEP format (12345-678 or 12345678)
 */
export const validateCEP = (cep: string): boolean => {
    if (!cep) return false;

    const cleaned = cep.replace(/\D/g, '');
    return /^\d{8}$/.test(cleaned);
};

/**
 * Format CEP for display
 * @param cep - Raw CEP
 * @returns Formatted CEP: 12345-678
 */
export const formatCEP = (cep: string): string => {
    if (!cep) return '';

    const cleaned = cep.replace(/\D/g, '');

    if (cleaned.length === 8) {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }

    return cep;
};

/**
 * Validate Brazilian property code (numeric)
 * @param code - Property code
 * @returns true if valid (3-10 digits)
 */
export const validatePropertyCode = (code: string | number): boolean => {
    const codeStr = String(code);
    return /^\d{3,10}$/.test(codeStr);
};

/**
 * Sanitize filename for upload
 * @param filename - Original filename
 * @returns Safe filename without special characters
 */
export const sanitizeFilename = (filename: string): string => {
    if (!filename) return '';

    return filename
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
        .toLowerCase();
};

/**
 * Validate file size (in bytes)
 * @param size - File size in bytes
 * @param maxSizeMB - Maximum size in megabytes
 * @returns true if within limit
 */
export const validateFileSize = (size: number, maxSizeMB: number = 5): boolean => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return size <= maxBytes;
};

/**
 * Validate file type
 * @param filename - File name or path
 * @param allowedTypes - Array of allowed extensions (e.g., ['jpg', 'png'])
 * @returns true if file type is allowed
 */
export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
    if (!filename) return false;

    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
};

/**
 * Rate limit check (client-side)
 * Simple in-memory rate limiting for client-side protection
 * @param key - Identifier (e.g., 'login', 'search')
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if within rate limit
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = (
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 60000 // 1 minute
): boolean => {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
        // Reset or create new record
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + windowMs
        });
        return true;
    }

    if (record.count >= maxAttempts) {
        return false; // Rate limit exceeded
    }

    // Increment count
    record.count++;
    rateLimitStore.set(key, record);
    return true;
};

/**
 * Get time remaining until rate limit reset
 * @param key - Identifier
 * @returns Seconds until reset, or 0 if not rate limited
 */
export const getRateLimitReset = (key: string): number => {
    const record = rateLimitStore.get(key);
    if (!record) return 0;

    const now = Date.now();
    if (now > record.resetAt) return 0;

    return Math.ceil((record.resetAt - now) / 1000);
};
