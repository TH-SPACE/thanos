// Arquivo para inicializar o serviço de sincronização do TMR

const { iniciarSyncService } = require('./services/tmrSyncService');

// Iniciar o serviço de sincronização do TMR
iniciarSyncService();

module.exports = { iniciarSyncService };