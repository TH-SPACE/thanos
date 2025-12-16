const db = require('../../db/db');
const { obterDadosOracle } = require('../controllers/dadosTmrController');

// Função para sincronizar dados do Oracle para o MariaDB
async function syncDadosTmr() {
    try {
        console.log('Iniciando sincronização de dados TMR...');

        // Obter dados do Oracle
        const dadosOracle = await obterDadosOracle();
        
        if (!dadosOracle || dadosOracle.length === 0) {
            console.log('Nenhum dado encontrado no Oracle para sincronizar.');
            return;
        }
        
        // Conectar ao banco MariaDB
        const connection = await db.getConnection();
        
        try {
            // Remover dados antigos antes de inserir os novos
            await connection.execute('DELETE FROM reparos_b2b_tmr');
            
            // Preparar dados para inserção
            const valores = dadosOracle.map(item => [
                item.MES_INICIO,
                item.VDI_CODIGO,
                item.TQI_CODIGO,
                item.TQI_RAZ,
                item.ID_CIRCUITO,
                item.STATUS_VIDA,
                item.STATUS_REPARO,
                item.PROCEDENCIA,
                item.PRODUTO,
                item.ORIGEM,
                item.CIDADE,
                item.UF,
                item.ESTADO,
                item.ENDERECO,
                item.TIPO_CIDADE,
                item.REGIONAL,
                item.NOM_CLUSTER,
                item.NOME_CLIENTE,
                item.GRP_CODIGO,
                item.GRP_NOME,
                item.GRUPO_BAIXA,
                item.TQI_DIAGNOSTICO,
                item.DGN_DESCRICAO,
                item.TQI_ABERTURA ? new Date(item.TQI_ABERTURA) : null,
                item.TQI_ENCERRAMENTO ? new Date(item.TQI_ENCERRAMENTO) : null,
                item.VDI_DATA_INICIO ? new Date(item.VDI_DATA_INICIO) : null,
                item.VDI_DATA_FIM ? new Date(item.VDI_DATA_FIM) : null,
                item.TMR_TOTAL !== null && item.TMR_TOTAL !== undefined ? parseFloat(item.TMR_TOTAL) : null,
            ]);
            
            // Inserir novos dados
            const query = `
                INSERT INTO reparos_b2b_tmr (
                    mes_inicio, vdi_codigo, tqi_codigo, tqi_raiz, id_circuito,
                    status_vida, status_reparo, procedencia, produto, origem,
                    cidade, uf, estado, endereco, tipo_cidade, regional,
                    nom_cluster, nome_cliente, grp_codigo, grp_nome, grupo_baixa,
                    tqi_diagnostico, dgn_descricao, tqi_abertura, tqi_encerramento,
                    vdi_data_inicio, vdi_data_fim, tmr_total
                ) VALUES ?
            `;
            
            await connection.query(query, [valores]);
            
            console.log(`Sincronização concluída. ${dadosOracle.length} registros transferidos.`);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro na sincronização de dados TMR:', error);
        throw error;
    }
}

// Função para iniciar o serviço de sincronização
function iniciarSyncService() {
    // Executar sincronização imediatamente ao iniciar
    syncDadosTmr().catch(console.error);
    
    // Agendar sincronização a cada 12 horas (43,200,000 milissegundos)
    setInterval(async () => {
        try {
            await syncDadosTmr();
        } catch (error) {
            console.error('Erro no intervalo de sincronização:', error);
        }
    }, 12 * 60 * 60 * 1000); // 12 horas em milissegundos
    
    console.log('Serviço de sincronização TMR iniciado. Atualizações a cada 12 horas.');
}

module.exports = {
    syncDadosTmr,
    iniciarSyncService
};