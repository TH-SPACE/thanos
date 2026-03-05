/**
 * Script de Teste - Sincronização Manual do Alerta B2B
 * 
 * Use este script para testar a sincronização fora do servidor
 * Execução: node test_sync.js
 */

const { executarSincronizacao } = require('./controllers/alertaB2BController');

async function testarSincronizacao() {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 TESTE DE SINCRONIZAÇÃO - ALERTA B2B');
    console.log('='.repeat(70));
    
    // Opções: 'url' para baixar da URL, 'arquivo' para usar CSV local
    const fonte = process.argv[2] || 'arquivo';
    
    console.log(`\n📡 Fonte selecionada: ${fonte}`);
    console.log('⏳ Iniciando sincronização...\n');
    
    try {
        const resultado = await executarSincronizacao(fonte);
        
        if (resultado.success) {
            console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
            console.log(`   📊 Registros inseridos: ${resultado.inseridos}`);
            console.log(`   ❌ Erros: ${resultado.erros}`);
            console.log(`   📦 Total: ${resultado.total}`);
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
