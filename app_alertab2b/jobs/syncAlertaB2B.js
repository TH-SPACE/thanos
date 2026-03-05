const cron = require('node-cron');
const { executarSincronizacao } = require('../controllers/alertaB2BController');

/**
 * Job de Sincronização Automática do Alerta B2B
 * Executa automaticamente a cada 5 minutos
 */

// Configurações
const CONFIG = {
    // Habilitar sincronização automática (true/false)
    SYNC_AUTOMATICO: process.env.ALERTA_B2B_SYNC_AUTOMATICO === 'true',
    
    // Intervalo da sincronização: '5min' ou 'horario' (usa HORARIO_SYNC)
    INTERVALO_SYNC: process.env.ALERTA_B2B_INTERVALO_SYNC || '5min',
    
    // Horário da sincronização automática (formato HH:MM) - usado se INTERVALO_SYNC for 'horario'
    HORARIO_SYNC: process.env.ALERTA_B2B_HORARIO_SYNC || '06:00',
    
    // Fonte dos dados ('url' ou 'arquivo')
    FONTE_DADOS: process.env.ALERTA_B2B_FONTE || 'url'
};

/**
 * Converter horário HH:MM para expressão cron
 */
function horarioParaCron(horario) {
    const [hora, minuto] = horario.split(':');
    return `${minuto} ${hora} * * *`;
}

/**
 * Obter expressão cron para intervalo de 5 minutos
 */
function intervaloParaCron(intervalo) {
    if (intervalo === '5min') {
        return '*/5 * * * *';  // A cada 5 minutos
    }
    if (intervalo === '10min') {
        return '*/10 * * * *';  // A cada 10 minutos
    }
    if (intervalo === '15min') {
        return '*/15 * * * *';  // A cada 15 minutos
    }
    if (intervalo === '30min') {
        return '*/30 * * * *';  // A cada 30 minutos
    }
    // Default: a cada 5 minutos
    return '*/5 * * * *';
}

/**
 * Executar sincronização agendada
 */
async function executarSincronizacaoAgendada() {
    console.log('\n' + '='.repeat(70));
    console.log('⏰ [AUTO] SINCRONIZAÇÃO ALERTA B2B - AGENDADA');
    console.log('='.repeat(70));
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    
    try {
        const resultado = await executarSincronizacao(CONFIG.FONTE_DADOS);
        
        if (resultado.success) {
            console.log('✅ [AUTO] Sincronização automática concluída com sucesso!');
        } else {
            console.error('❌ [AUTO] Erro na sincronização automática:', resultado.error);
        }
        
        return resultado;
    } catch (error) {
        console.error('❌ [AUTO] Erro crítico na sincronização automática:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Inicializar jobs de sincronização
 */
function inicializarSincronizacao() {
    if (!CONFIG.SYNC_AUTOMATICO) {
        console.log('⚠️  Sincronização automática do Alerta B2B está DESATIVADA');
        return null;
    }

    console.log('🔧 Inicializando job de sincronização do Alerta B2B...');
    console.log(`   📡 Fonte: ${CONFIG.FONTE_DADOS}`);

    try {
        let expressaoCron;
        
        if (CONFIG.INTERVALO_SYNC === 'horario') {
            expressaoCron = horarioParaCron(CONFIG.HORARIO_SYNC);
            console.log(`   ⏰ Horário configurado: ${CONFIG.HORARIO_SYNC}`);
        } else {
            expressaoCron = intervaloParaCron(CONFIG.INTERVALO_SYNC);
            console.log(`   ⏰ Intervalo configurado: ${CONFIG.INTERVALO_SYNC}`);
        }
        
        // Agendar job
        const job = cron.schedule(expressaoCron, () => {
            executarSincronizacaoAgendada();
        }, {
            scheduled: true,
            timezone: 'America/Sao_Paulo'
        });

        console.log(`   ✅ Job agendado: "${expressaoCron}"`);
        
        return { job, config: CONFIG };
    } catch (error) {
        console.error('❌ Erro ao inicializar job de sincronização:', error.message);
        return null;
    }
}

/**
 * Parar job de sincronização
 */
function pararSincronizacao(job) {
    if (job) {
        job.stop();
        console.log('🛑 Job de sincronização do Alerta B2B parado');
    }
}

module.exports = {
    inicializarSincronizacao,
    pararSincronizacao,
    executarSincronizacaoAgendada,
    CONFIG
};
