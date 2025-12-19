// Script para verificar estrutura da tabela anuncios
// Execute com: node check_db.mjs

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (mesmas do projeto)
const supabaseUrl = 'https://ufhctvcpkwpzgcfgmirx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaGN0dmNwa3dwemdjZmdtaXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzU3MDgsImV4cCI6MjA3OTA1MTcwOH0.qPkkj8Vr1ntmciIqGVbAH7ukeM9qi2mnGlWIDPGMGEQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
    console.log('🔍 Consultando tabela anuncios...\n');

    // 1. Verificar se conseguimos acessar a tabela
    const { data: testData, error: testError } = await supabase
        .from('anuncios')
        .select('*')
        .limit(1);

    if (testError) {
        console.error('❌ Erro ao acessar tabela:', testError);
        return;
    }

    console.log('✅ Acesso à tabela anuncios OK!\n');

    // 2. Listar todas as colunas
    if (testData && testData.length > 0) {
        const columns = Object.keys(testData[0]);
        console.log('📋 COLUNAS DA TABELA ANUNCIOS:');
        console.log('='.repeat(50));

        columns.forEach((col, idx) => {
            const isCondoField = col.toLowerCase().includes('cond') || col.toLowerCase().includes('condominio');
            const marker = isCondoField ? ' 🔴 CONDOMÍNIO' : '';
            console.log(`${(idx + 1).toString().padStart(2)}. ${col}${marker}`);
        });

        console.log('='.repeat(50));
        console.log(`\n📊 Total de colunas: ${columns.length}\n`);

        // 3. Verificar campos específicos
        console.log('🔍 VERIFICAÇÃO ESPECÍFICA:');
        console.log('-'.repeat(50));

        const hasValorCondo = columns.includes('valor_condo');
        const hasValorCondominio = columns.includes('valor_condominio');

        console.log(`valor_condo:       ${hasValorCondo ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
        console.log(`valor_condominio:  ${hasValorCondominio ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
        console.log('-'.repeat(50));

        // 4. Mostrar um registro de exemplo
        console.log('\n📄 EXEMPLO DE REGISTRO (primeiro registro da tabela):');
        console.log('-'.repeat(50));
        console.log(JSON.stringify(testData[0], null, 2));
        console.log('-'.repeat(50));

        // 5. Diagnóstico e recomendação
        console.log('\n💡 DIAGNÓSTICO:');
        if (!hasValorCondo && !hasValorCondominio) {
            console.log('⚠️  Nenhum campo de condomínio encontrado!');
            console.log('   → O campo pode não existir na tabela.');
        } else if (hasValorCondo && !hasValorCondominio) {
            console.log('✅ Campo existe como: valor_condo');
            console.log('   → Código deve usar: valor_condo');
            console.log('   → Se trigger busca valor_condominio, renomeie a coluna no BD');
        } else if (!hasValorCondo && hasValorCondominio) {
            console.log('✅ Campo existe como: valor_condominio');
            console.log('   → Código deve usar: valor_condominio');
        } else {
            console.log('⚠️  Ambos os campos existem! (duplicação)');
        }
    } else {
        console.log('⚠️  Tabela está vazia, não há dados para análise.');
    }
}

// Executar
checkDatabase().catch(console.error);
