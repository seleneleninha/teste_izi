// Script para listar triggers da tabela anuncios
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufhctvcpkwpzgcfgmirx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaGN0dmNwa3dwemdjZmdtaXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzU3MDgsImV4cCI6MjA3OTA1MTcwOH0.qPkkj8Vr1ntmciIqGVbAH7ukeM9qi2mnGlWIDPGMGEQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTriggers() {
    console.log('\n=== LISTANDO TRIGGERS DA TABELA ANUNCIOS ===\n');

    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
      SELECT 
        t.trigger_name,
        t.event_manipulation,
        t.action_timing,
        pg_get_triggerdef(tr.oid) as trigger_definition
      FROM information_schema.triggers t
      JOIN pg_trigger tr ON tr.tgname = t.trigger_name
      WHERE t.event_object_table = 'anuncios'
      ORDER BY t.trigger_name;
    `
    });

    if (error) {
        console.log('ERRO ao listar triggers:', error.message);
        console.log('\n=== SOLUCAO ===');
        console.log('Execute esta query no Supabase SQL Editor:\n');
        console.log(`
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'anuncios'
ORDER BY trigger_name;
    `);
        console.log('\nDepois, para ver o codigo completo de uma trigger:');
        console.log('SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname = \'nome_da_trigger\';');
    } else {
        console.log('Triggers encontradas:');
        console.log(JSON.stringify(data, null, 2));
    }
}

listTriggers();
