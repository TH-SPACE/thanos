/**
 * Script de Teste - Sincronização Manual do Alerta B2B
 * 
 * Use este script para testar a sincronização fora do servidor
 * Execução: node test_sync.js
 * 
 * FILTRO: Apenas UF's do Centro-Oeste e Norte
 */

const { executarSincronizacao } = require('./controllers/alertaB2BController');

async function testarSincronizacao() {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 TESTE DE SINCRONIZAÇÃO - ALERTA B2B');
    console.log('📍 FILTRO: Centro-Oeste e Norte (GO, MT, MS, DF, AC, AP, AM, PA, RO, RR, TO)');
    console.log('='.repeat(70));
    
    // Opções: 'url' para baixar da URL, 'arquivo' para usar CSV local
    const fonte = process.argv[2] || 'arquivo';
    
    console.log(`\n📡 Fonte selecionada: ${fonte}`);
    console.log('⏳ Iniciando sincronização...\n');
    
    try {
        const resultado = await executarSincronizacao(fonte);
        
        if (resultado.success) {
            console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
            console.log(`   📊 Registros inseridos (CO/Norte): ${resultado.inseridos}`);
            console.log(`   🚫 Registros filtrados: ${resultado.filtrados || 0}`);
            console.log(`   ❌ Erros: ${resultado.erros}`);
            console.log(`   📦 Total processado: ${resultado.total}`);
        } else {
            console.log('\n❌ ERRO NO TESTE:', resultado.error);
        }
    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO:', error.message);
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(0);
}

testarSincronizacao();
