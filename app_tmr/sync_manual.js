// Script para executar a sincronização manual dos dados TMR
const { syncDadosTmr } = require('./services/tmrSyncService');

console.log('Iniciando sincronização manual de dados TMR...');
syncDadosTmr()
  .then(() => {
    console.log('Sincronização concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro na sincronização:', error);
    process.exit(1);
  });