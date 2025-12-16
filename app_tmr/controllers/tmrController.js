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

        // Primeiro, vamos organizar os dados por mês e reparo
        const dadosPorMes = {};

        for (const row of rows) {
            // Calcular o mês com base na vdi_data_inicio desta vida específica
            let mes = '';
            if (row.vdi_data_inicio) {
                const dataInicio = new Date(row.vdi_data_inicio);
                const meses = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ];
                mes = meses[dataInicio.getMonth()];
            }

            // Criar chave única para reparo+mês
            const chave = `${row.tqi_codigo}_${mes}`;

            if (!dadosPorMes[chave]) {
                // Criar cópia do registro com tmr_total zerado para este mês
                dadosPorMes[chave] = {
                    ...row,
                    tmr_total: 0, // Inicializar com 0 e somar apenas o tempo desta vida
                    mes: mes
                };
            }

            // Somar o tmr_total específico desta vida para o mês correspondente
            dadosPorMes[chave].tmr_total += (row.tmr_total !== null ? parseFloat(row.tmr_total) : 0);
        }

        // Converter o objeto para array
        const dadosProcessados = Object.values(dadosPorMes);

        return dadosProcessados;
    } catch (error) {
        console.error('Erro ao buscar dados do TMR:', error);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = router;