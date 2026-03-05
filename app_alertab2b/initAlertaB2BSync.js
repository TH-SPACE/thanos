/**
 * Inicializador do Serviço de Sincronização Automática do Alerta B2B
 *
 * Este arquivo é responsável por inicializar os jobs de sincronização
 * automática do Backlog BDSLA quando o servidor é iniciado.
 *
 * Horário configurado:
 * - 06:00 (configurável via .env)
 */

const { inicializarSincronizacao } = require('./jobs/syncAlertaB2B');

// Inicializar sincronização automática
console.log('\n🔧 Carregando serviço de sincronização automática do Alerta B2B...');

try {
    const job = inicializarSincronizacao();

    if (job) {
        console.log('✅ Serviço de sincronização Alerta B2B inicializado com sucesso!\n');
    } else {
        console.log('⚠️  Serviço de sincronização Alerta B2B não foi inicializado (desativado).\n');
    }
} catch (error) {
    console.error('❌ Erro ao inicializar serviço de sincronização Alerta B2B:');
    console.error(`   ${error.message}`);
    console.error('   A aplicação continuará rodando, mas a sincronização automática não estará disponível.\n');
}

module.exports = { inicializarSincronizacao };
