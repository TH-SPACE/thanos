const fs = require('fs');
const path = require('path');
const db = require('../../db/db');
const { obterDadosOracle } = require('../controllers/dadosTmrController');
const { parseOracleDate } = require('../utils/dateUtils');

// Função para sincronizar dados do Oracle para o MariaDB
async function syncDadosTmr() {
    try {
        // Obter dados do Oracle
        const dadosOracle = await obterDadosOracle();

        if (!dadosOracle || dadosOracle.length === 0) {
            console.log('Nenhum dado encontrado no Oracle para sincronizar.');
            return;
        }

        // Conectar ao banco MariaDB
        const connection = await db.mysqlPool.getConnection();

        try {
            // Remover dados antigos antes de inserir os novos
            await connection.execute('DELETE FROM reparos_b2b_tmr');

            // Ler o arquivo JSON de mapeamento
            const jsonPath = path.join(__dirname, '../grupo_agrupado_mapping.json');
            const jsonData = fs.readFileSync(jsonPath, 'utf8');
            const rules = JSON.parse(jsonData).grupo_agrupado_rules;

            // Preparar dados para inserção com grupo_agrupado determinado pelas regras
            const valores = dadosOracle.map(item => {
                // Determinar o grupo_agrupado com base nas regras
                let grupoAgrupado = 'NÃO MAPEADO'; // Valor padrão

                if (item.GRP_NOME) {
                    const grpNomeLower = item.GRP_NOME.toLowerCase();

                    // Verificar cada regra para encontrar uma correspondência
                    for (const rule of rules) {
                        if (grpNomeLower.includes(rule.contains.toLowerCase())) {
                            grupoAgrupado = rule.group;
                            break; // Parar no primeiro match
                        }
                    }
                }

                return [
                    item.MES_INICIO !== undefined && item.MES_INICIO !== '' ? item.MES_INICIO : null,
                    item.VDI_CODIGO !== undefined && item.VDI_CODIGO !== '' ? item.VDI_CODIGO : null,
                    item.TQI_CODIGO !== undefined && item.TQI_CODIGO !== '' ? item.TQI_CODIGO : null,
                    item.TQI_RAZ !== undefined && item.TQI_RAZ !== '' ? item.TQI_RAZ : null,
                    item.ID_CIRCUITO !== undefined && item.ID_CIRCUITO !== '' ? item.ID_CIRCUITO : null,
                    item.STATUS_VIDA !== undefined && item.STATUS_VIDA !== '' ? item.STATUS_VIDA : null,
                    item.STATUS_REPARO !== undefined && item.STATUS_REPARO !== '' ? item.STATUS_REPARO : null,
                    item.PROCEDENCIA !== undefined && item.PROCEDENCIA !== '' ? item.PROCEDENCIA : null,
                    item.PRODUTO !== undefined && item.PRODUTO !== '' ? item.PRODUTO : null,
                    item.ORIGEM !== undefined && item.ORIGEM !== '' ? item.ORIGEM : null,
                    item.CIDADE !== undefined && item.CIDADE !== '' ? item.CIDADE : null,
                    item.UF !== undefined && item.UF !== '' ? item.UF : null,
                    item.ESTADO !== undefined && item.ESTADO !== '' ? item.ESTADO : null,
                    item.ENDERECO !== undefined && item.ENDERECO !== '' ? item.ENDERECO : null,
                    item.TIPO_CIDADE !== undefined && item.TIPO_CIDADE !== '' ? item.TIPO_CIDADE : null,
                    item.REGIONAL !== undefined && item.REGIONAL !== '' ? item.REGIONAL : null,
                    item.NOM_CLUSTER !== undefined && item.NOM_CLUSTER !== '' ? item.NOM_CLUSTER : null,
                    item.NOME_CLIENTE !== undefined && item.NOME_CLIENTE !== '' ? item.NOME_CLIENTE : null,
                    item.GRP_CODIGO !== undefined && item.GRP_CODIGO !== '' ? item.GRP_CODIGO : null,
                    item.GRP_NOME !== undefined && item.GRP_NOME !== '' ? item.GRP_NOME : null,
                    item.GRUPO_BAIXA !== undefined && item.GRUPO_BAIXA !== '' ? item.GRUPO_BAIXA : null,
                    item.TQI_DIAGNOSTICO !== undefined && item.TQI_DIAGNOSTICO !== '' ?
                        !isNaN(item.TQI_DIAGNOSTICO) ? parseInt(item.TQI_DIAGNOSTICO) : null : null,
                    item.DGN_DESCRICAO !== undefined && item.DGN_DESCRICAO !== '' ? item.DGN_DESCRICAO : null,
                    item.TQI_ABERTURA && item.TQI_ABERTURA !== '' ? parseOracleDate(item.TQI_ABERTURA) : null,
                    item.TQI_ENCERRAMENTO && item.TQI_ENCERRAMENTO !== '' ? parseOracleDate(item.TQI_ENCERRAMENTO) : null,
                    item.VDI_DATA_INICIO && item.VDI_DATA_INICIO !== '' ? parseOracleDate(item.VDI_DATA_INICIO) : null,
                    item.VDI_DATA_FIM && item.VDI_DATA_FIM !== '' ? parseOracleDate(item.VDI_DATA_FIM) : null,
                    item.TMR_TOTAL !== null && item.TMR_TOTAL !== undefined && item.TMR_TOTAL !== '' ? parseFloat(item.TMR_TOTAL) : null,
                    grupoAgrupado // Valor determinado pelas regras
                ];
            });


            // Inserir novos dados em blocos para evitar o limite de placeholders
            const batchSize = 100; // Tamanho do lote menor para evitar o limite de placeholders

            for (let i = 0; i < valores.length; i += batchSize) {
                const batch = valores.slice(i, i + batchSize);

                // Criar placeholders para cada registro no lote (29 valores por registro, incluindo grupo_agrupado)
                const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
                const query = `
                    INSERT INTO reparos_b2b_tmr (
                        mes_inicio, vdi_codigo, tqi_codigo, tqi_raiz, id_circuito,
                        status_vida, status_reparo, procedencia, produto, origem,
                        cidade, uf, estado, endereco, tipo_cidade, regional,
                        nom_cluster, nome_cliente, grp_codigo, grp_nome, grupo_baixa,
                        tqi_diagnostico, dgn_descricao, tqi_abertura, tqi_encerramento,
                        vdi_data_inicio, vdi_data_fim, tmr_total, grupo_agrupado
                    ) VALUES ${placeholders}
                `;

                // Achatar o array de valores do lote para passar como argumento único
                const flatValues = batch.flat();

                await connection.execute(query, flatValues);

                console.log(`Lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(valores.length / batchSize)} inserido com sucesso (${batch.length} registros)`);
            }

            console.log(`Sincronização concluída. ${dadosOracle.length} registros transferidos.`);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro na sincronização de dados TMR:');
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

    // console.log('Serviço de sincronização TMR iniciado. Atualizações a cada 12 horas.');
}

module.exports = {
    syncDadosTmr,
    iniciarSyncService
};