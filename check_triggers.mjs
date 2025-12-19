import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufhctvcpkwpzgcfgmirx.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sua_chave_aqui';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
    console.log('🔍 Investigando triggers na tabela anuncios...\n');

    // Query para buscar triggers
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'anuncios'
      ORDER BY trigger_name;
    `
    });

    if (error) {
        console.error('❌ Erro ao buscar triggers:', error);

        // Tentar método alternativo - executar SQL direto
        console.log('\n🔄 Tentando método alternativo...\n');

        const { data: columnsData, error: colError } = await supabase
            .from('anuncios')
            .select('*')
            .limit(0);

        if (colError) {
            console.error('❌ Erro ao verificar colunas:', colError);
        } else {
            console.log('✅ Tabela anuncios existe');
            console.log('📋 Para ver triggers, execute este SQL no Supabase SQL Editor:\n');
            console.log(`
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'anuncios'
ORDER BY trigger_name;
      `);
        }
    } else {
        console.log('✅ Triggers encontradas:\n');
        console.table(data);
    }
}

// Também vamos verificar as colunas da tabela
async function checkColumns() {
    console.log('\n🔍 Verificando colunas da tabela anuncios...\n');

    const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Erro:', error);
    } else if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('📋 Colunas encontradas:');
        columns.forEach(col => {
            if (col.includes('cond') || col.includes('valor')) {
                console.log(`   ✅ ${col} ${col.includes('cond') ? '← CAMPO DE CONDOMÍNIO!' : ''}`);
            } else {
                console.log(`   - ${col}`);
            }
        });

        // Verificar especificamente
        if (columns.includes('valor_condo')) {
            console.log('\n✅ "valor_condo" EXISTE na tabela');
        } else {
            console.log('\n❌ "valor_condo" NÃO existe na tabela');
        }

        if (columns.includes('valor_condominio')) {
            console.log('✅ "valor_condominio" EXISTE na tabela');
        } else {
            console.log('❌ "valor_condominio" NÃO existe na tabela');
        }
    }
}

// Executar
(async () => {
    await checkColumns();
    await checkTriggers();

    console.log('\n📝 SOLUÇÃO SQL para executar no Supabase:\n');
    console.log(`
-- Se a trigger estiver usando NEW.valor_condominio mas a coluna é valor_condo,
-- você pode renomear a coluna ou atualizar a trigger.
-- Para renomear a coluna:
ALTER TABLE anuncios RENAME COLUMN valor_condo TO valor_condominio;

-- OU para dropar triggers problemáticas (cuidado!):
-- DROP TRIGGER nome_da_trigger ON anuncios;
  `);
})();
