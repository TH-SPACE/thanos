const express = require('express');
const router = express.Router();
const db = require('../../db/db');

// Middleware de autenticação (semelhante ao do app_he)
const tmrAuth = require('../middleware/tmrAuth');

// Rota para acessar a página principal do TMR
router.get('/', tmrAuth, (req, res) => {
    res.render('b2btmr', {
        title: 'TMR - Tempo Médio de Reparos',
        user: req.session.usuario
    });
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

async function getDadosTMR() {
    // Esta função buscará os dados da tabela reparos_b2b_tmr
    const connection = await db.mysqlPool.getConnection();
    try {
        // Buscar dados dos últimos 3 meses
        const [rows] = await connection.execute(
            'SELECT * FROM reparos_b2b_tmr WHERE data_registro >= DATE_SUB(NOW(), INTERVAL 3 MONTH) ORDER BY data_registro DESC'
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