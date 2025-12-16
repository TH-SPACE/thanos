// Arquivo de inicialização do módulo TMR
const tmrSyncService = require('./services/tmrSyncService');

// Iniciar o serviço de sincronização
tmrSyncService.iniciarSyncService();

console.log('Módulo TMR inicializado com sucesso!');