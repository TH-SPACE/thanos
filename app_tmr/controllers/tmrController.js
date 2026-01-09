const { Router } = require('express');
const router = Router();
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
        // Obter parâmetros de filtro, se existirem
        const grupoFiltro = req.query.grupo || null;
        const regionalFiltro = req.query.regional || null;
        const procedenciaFiltro = req.query.procedencia || null; // Pode ser uma string com valores separados por vírgula

        // Obter dados do banco de dados
        const dados = await getDadosTMR(grupoFiltro, regionalFiltro, procedenciaFiltro);
        res.json(dados);
    } catch (error) {
        console.error('Erro ao obter dados de TMR:', error);
        res.status(500).json({ error: 'Erro ao obter dados de TMR' });
    }
});

// Rota para obter todos os grupos disponíveis
router.get('/grupos', tmrAuth, async (req, res) => {
    try {
        const connection = await db.mysqlPool.getConnection();
        try {
            // Buscar todos os grupos distintos da tabela reparos_b2b_tmr
            const [rows] = await connection.execute(
                'SELECT DISTINCT grp_nome FROM reparos_b2b_tmr WHERE grp_nome IS NOT NULL AND grp_nome != "" ORDER BY grp_nome ASC'
            );

            const grupos = rows.map(row => row.grp_nome);
            res.json(grupos);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao obter grupos:', error);
        res.status(500).json({ error: 'Erro ao obter grupos' });
    }
});

// Rota para obter todas as regionais disponíveis
router.get('/regionais', tmrAuth, async (req, res) => {
    try {
        const connection = await db.mysqlPool.getConnection();
        try {
            // Buscar todas as regionais distintas da tabela reparos_b2b_tmr
            const [rows] = await connection.execute(
                'SELECT DISTINCT regional FROM reparos_b2b_tmr WHERE regional IS NOT NULL AND regional != "" ORDER BY regional ASC'
            );

            const regionais = rows.map(row => row.regional);
            res.json(regionais);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao obter regionais:', error);
        res.status(500).json({ error: 'Erro ao obter regionais' });
    }
});

// Rota para obter todas as procedências disponíveis
router.get('/procedencias', tmrAuth, async (req, res) => {
    try {
        const connection = await db.mysqlPool.getConnection();
        try {
            // Buscar todas as procedências distintas da tabela reparos_b2b_tmr
            const [rows] = await connection.execute(
                'SELECT DISTINCT procedencia FROM reparos_b2b_tmr WHERE procedencia IS NOT NULL AND procedencia != "" ORDER BY procedencia ASC'
            );

            const procedencias = rows.map(row => row.procedencia);
            res.json(procedencias);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao obter procedências:', error);
        res.status(500).json({ error: 'Erro ao obter procedências' });
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

// Rota para obter dados do perfil do usuário
router.get('/perfil-usuario', tmrAuth, (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: "Não autenticado" });
    }

    res.json({
        id: req.session.usuario.id,
        nome: req.session.usuario.nome,
        email: req.session.usuario.email,
        perfil: req.session.usuario.perfil,
        cargo: req.session.usuario.cargo,
    });
});

async function getDadosTMR(grupoFiltro = null, regionalFiltro = null, procedenciaFiltro = null) {
    // Esta função buscará os dados da tabela reparos_b2b_tmr
    const connection = await db.mysqlPool.getConnection();
    try {
        // Calcular datas para os últimos 3 meses (incluindo o mês atual em andamento)
        const dataAtual = new Date();

        // Para pegar os 3 meses mais recentes (até o mês atual), pegamos do primeiro dia de 2 meses atrás
        // até o final do mês atual
        const primeiroDiaTresMesesAtras = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 2, 1); // 3 meses incluindo o atual

        // Definir data final para o início do dia seguinte (00:00 de amanhã) para incluir todos os dados de hoje
        const dataFinal = new Date(dataAtual);
        dataFinal.setDate(dataFinal.getDate() + 1);
        dataFinal.setHours(0, 0, 0, 0); // Zerar horas, minutos, segundos e milissegundos

        // Formatar datas para o formato SQL
        const dataInicioStr = primeiroDiaTresMesesAtras.toISOString().split('T')[0];
        const dataFinalStr = dataFinal.toISOString().split('T')[0];

        let query = `SELECT * FROM reparos_b2b_tmr WHERE tqi_abertura >= '${dataInicioStr}' AND tqi_abertura <= '${dataFinalStr}'`;

        // Adicionar filtros se especificados
        let params = [];
        if (grupoFiltro) {
            query += ' AND grp_nome = ?';
            params.push(grupoFiltro);
        }
        if (regionalFiltro) {
            query += ' AND regional = ?';
            params.push(regionalFiltro);
        }

        // Adicionar filtro por procedência (multisseleção)
        if (procedenciaFiltro) {
            // Converter a string de procedências em array
            const procedenciasArray = Array.isArray(procedenciaFiltro)
                ? procedenciaFiltro
                : procedenciaFiltro.split(',');

            // Criar placeholders para cada procedência
            const placeholders = procedenciasArray.map(() => '?').join(',');
            query += ` AND procedencia IN (${placeholders})`;
            params = params.concat(procedenciasArray);
        }

        query += ' ORDER BY tqi_abertura DESC';

        // Buscar dados dos últimos 3 meses com base na data de início da vida
        const [rows] = await connection.execute(query, params);

        // Primeiro, vamos organizar os dados por mês e reparo
        const dadosPorMes = {};

        for (const row of rows) {
            // Calcular o mês com base na tqi_abertura desta vida específica
            let mes = '';
            if (row.tqi_abertura) {
                const dataInicio = new Date(row.tqi_abertura);
                const meses = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ];
                mes = `${meses[dataInicio.getMonth()]} ${dataInicio.getFullYear()}`;
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