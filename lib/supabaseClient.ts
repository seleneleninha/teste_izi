import { createBrowserClient } from '@supabase/ssr';

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

// Use createBrowserClient for proper SSR cookie handling
export const supabase = createBrowserClient(supabaseUrl || '', supabaseAnonKey || '');

