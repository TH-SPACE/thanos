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
            'SELECT * FROM reparos_b2b_tmr WHERE vdi_data_inicio >= DATE_SUB(NOW(), INTERVAL 3 MONTH) OR tqi_abertura >= DATE_SUB(NOW(), INTERVAL 3 MONTH) ORDER BY vdi_data_inicio DESC'
        );

        // Converter tmr_total para número para cálculos no frontend e adicionar campo de mês
        const dadosProcessados = rows.map(row => {
            // Extrair o mês da data de início da vida
            let mes = '';
            if (row.vdi_data_inicio) {
                const dataInicio = new Date(row.vdi_data_inicio);
                const meses = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ];
                mes = meses[dataInicio.getMonth()];
            }

            return {
                ...row,
                tmr_total: row.tmr_total !== null ? parseFloat(row.tmr_total) : null,
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