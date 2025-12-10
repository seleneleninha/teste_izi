import { createClient } from '@supabase/supabase-js';

// Environment variables - DO NOT hardcode credentials here!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration in development
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas!');
    console.error('📝 Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
