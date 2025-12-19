// Script simples para verificar colunas da tabela anuncios
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufhctvcpkwpzgcfgmirx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaGN0dmNwa3dwemdjZmdtaXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzU3MDgsImV4cCI6MjA3OTA1MTcwOH0.qPkkj8Vr1ntmciIqGVbAH7ukeM9qi2mnGlWIDPGMGEQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data, error } = await supabase.from('anuncios').select('*').limit(1);

    if (error) {
        console.log('ERRO:', error.message);
        return;
    }

    if (data && data.length > 0) {
        const cols = Object.keys(data[0]);
        console.log('\n=== COLUNAS DA TABELA ANUNCIOS ===\n');
        cols.forEach((c, i) => console.log(`${i + 1}. ${c}`));
        console.log('\n=== CAMPOS DE CONDOMINIO ===\n');
        console.log('valor_condo:', cols.includes('valor_condo') ? 'EXISTE' : 'NAO EXISTE');
        console.log('valor_condominio:', cols.includes('valor_condominio') ? 'EXISTE' : 'NAO EXISTE');
    }
}

check();
