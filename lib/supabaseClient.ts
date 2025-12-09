import { createClient } from '@supabase/supabase-js';

// Environment variables - DO NOT hardcode credentials here!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas!');
        console.error('📝 Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local');
    }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
