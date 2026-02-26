/**
 * Inicializador do Serviço de Sincronização Automática do BDS
 * 
 * Este arquivo é responsável por inicializar os jobs de sincronização
 * automática do sistema BDS quando o servidor é iniciado.
 * 
 * Horários configurados (3x ao dia):
 * - 05:00 - Manhã
 * - 12:00 - Meio-dia
 * - 17:00 - Tarde
 */

const { inicializarSincronizacao } = require('./jobs/syncBDS');

// Inicializar sincronização automática
console.log('\n🔧 Carregando serviço de sincronização automática do BDS...');

try {
    const jobs = inicializarSincronizacao();
    
    if (jobs) {
        console.log('✅ Serviço de sincronização BDS inicializado com sucesso!\n');
    } else {
        console.log('⚠️  Serviço de sincronização BDS não foi inicializado (desativado).\n');
    }
} catch (error) {
    console.error('❌ Erro ao inicializar serviço de sincronização BDS:');
    console.error(`   ${error.message}`);
    console.error('   A aplicação continuá rodando, mas a sincronização automática não estará disponível.\n');
}

module.exports = { inicializarSincronizacao };
