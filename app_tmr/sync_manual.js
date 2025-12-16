// Script para executar a sincronização manual dos dados TMR
const db = require('../db/db');
const { syncDadosTmr } = require('./services/tmrSyncService');

async function runSync() {
  try {
    console.log('Iniciando sincronização manual de dados TMR...');

    // Espera a inicialização do pool OracleDB antes de prosseguir
    await db.initializeOracle();

    await syncDadosTmr();
    console.log('Sincronização concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na sincronização:', error);
    process.exit(1);
  }
}

runSync();