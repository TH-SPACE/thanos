// Script para executar apenas o serviço de sincronização do TMR
const tmrSyncService = require('./services/tmrSyncService');

// Iniciar o serviço de sincronização
tmrSyncService.iniciarSyncService();

console.log('Serviço de sincronização TMR iniciado. Atualizações a cada 12 horas.');
console.log('Este processo continuará em execução para manter os dados sincronizados.');