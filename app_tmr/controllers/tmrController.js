const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../../db/db');

// Middleware de autenticação (semelhante ao do app_he)
const tmrAuth = require('../middleware/tmrAuth');

// Serviço de sincronização
const { syncDadosTmr } = require('../services/tmrSyncService');

// Rota para acessar a página principal do TMR
router.get('/', tmrAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/b2btmr.html'));
});

// Rota para obter dados de TMR
router.get('/data', tmrAuth, async (req, res) => {
    try {
        // Obter dados do banco de dados
        const dados = await getDadosTMR();
        res.json(dados);
    } catch (error) {
        console.error('Erro ao obter dados de TMR:', error);
        res.status(500).json({ error: 'Erro ao obter dados de TMR' });
    }
});

// Rota para sincronização manual de dados
router.post('/sincronizar', tmrAuth, async (req, res) => {
    try {
        console.log('Iniciando sincronização manual de dados TMR...');
        await syncDadosTmr();
        res.json({ success: true, message: 'Sincronização concluída com sucesso!' });
    } catch (error) {
        console.error('Erro na sincronização manual de dados TMR:', error);
        res.status(500).json({ success: false, error: 'Erro na sincronização: ' + error.message });
    }
});

async function getDadosTMR() {
    // Esta função buscará os dados da tabela reparos_b2b_tmr
    const connection = await db.mysqlPool.getConnection();
    try {
        // Buscar dados dos últimos 3 meses com base na data de início da vida
        const [rows] = await connection.execute(
            'SELECT * FROM reparos_b2b_tmr WHERE vdi_data_inicio >= DATE_SUB(NOW(), INTERVAL 3 MONTH) ORDER BY vdi_data_inicio DESC'
        );

        // Agrupar dados por tqi_codigo para somar tmr_total por reparo (não por vida)
        const reparosAgrupados = {};

        for (const row of rows) {
            const codigo = row.tqi_codigo;

            if (!reparosAgrupados[codigo]) {
                reparosAgrupados[codigo] = {
                    ...row,
                    tmr_total: row.tmr_total !== null ? parseFloat(row.tmr_total) : 0,
                    // Armazenar datas relevantes para o reparo
                    datas_reparo: [row.vdi_data_inicio],
                    meses: new Set(),
                };
            } else {
                // Somar tmr_total para o mesmo reparo (várias vidas do mesmo reparo)
                reparosAgrupados[codigo].tmr_total += (row.tmr_total !== null ? parseFloat(row.tmr_total) : 0);

                // Adicionar datas adicionais se necessário
                if (row.vdi_data_inicio) {
                    reparosAgrupados[codigo].datas_reparo.push(row.vdi_data_inicio);
                }
            }

            // Adicionar mês à lista de meses do reparo
            if (row.vdi_data_inicio) {
                const dataInicio = new Date(row.vdi_data_inicio);
                const meses = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ];
                const mes = meses[dataInicio.getMonth()];
                reparosAgrupados[codigo].meses.add(mes);
            }
        }

        // Converter os reparos agrupados de volta para array
        const dadosProcessados = Object.values(reparosAgrupados).map(reparo => {
            // Usar o primeiro mês (ou podemos definir lógica mais específica)
            const mesesArray = Array.from(reparo.meses);
            const mes = mesesArray.length > 0 ? mesesArray[0] : '';

            // Remover propriedades auxiliares
            const { datas_reparo, meses: _meses, ...dadosLimpos } = reparo;

            return {
                ...dadosLimpos,
                mes: mes
            };
        });

        return dadosProcessados;
    } catch (error) {
        console.error('Erro ao buscar dados do TMR:', error);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = router;