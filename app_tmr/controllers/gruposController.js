const { Router } = require('express');
const router = Router();
const db = require('../../db/db');

// Middleware de autenticação
const tmrAuth = require('../middleware/tmrAuth');

// Rota para obter dados de grupos
router.get('/grupos-data', tmrAuth, async (req, res) => {
    try {
        // Obter parâmetros de filtro, se existirem
        const grupoFiltro = req.query.grupo || null;
        const regionalFiltro = req.query.regional || null;
        const procedenciaFiltro = req.query.procedencia || null; // Pode ser uma string com valores separados por vírgula

        console.log('Recebendo requisição para /grupos-data com filtros:', { grupoFiltro, regionalFiltro, procedenciaFiltro }); // Log de debug

        // Obter dados do banco de dados
        const dados = await getDadosGrupos(grupoFiltro, regionalFiltro, procedenciaFiltro);

        console.log('Retornando dados para /grupos-data:', dados.length, 'grupos'); // Log de debug

        res.json(dados);
    } catch (error) {
        console.error('Erro ao obter dados de grupos:', error);
        res.status(500).json({ error: 'Erro ao obter dados de grupos' });
    }
});

// Função para obter dados de grupos
async function getDadosGrupos(grupoFiltro = null, regionalFiltro = null, procedenciaFiltro = null) {
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

        // Query para obter dados de grupos com contagem de reparos e cálculo de TMR
        // Corrigido para calcular o mês com base na tqi_abertura e agrupar por grupo+mês
        let query = `
            SELECT
                r.grp_nome,
                DATE_FORMAT(r.tqi_abertura, '%M %Y') as mes_nome_formatado,
                COUNT(DISTINCT r.tqi_codigo) as qtde_reparos,
                COALESCE(AVG(r.tmr_total), 0) as tmr_medio
            FROM reparos_b2b_tmr r
            WHERE r.tqi_abertura >= ? AND r.tqi_abertura <= ?
              AND r.grp_nome IS NOT NULL
              AND r.grp_nome != ''
              AND r.tqi_abertura IS NOT NULL
        `;

        // Adicionar filtros se especificados
        let params = [dataInicioStr, dataFinalStr];
        if (grupoFiltro) {
            query += ' AND r.grp_nome = ?';
            params.push(grupoFiltro);
        }
        if (regionalFiltro) {
            query += ' AND r.regional = ?';
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
            query += ` AND r.procedencia IN (${placeholders})`;
            params = params.concat(procedenciasArray);
        }

        query += ' GROUP BY r.grp_nome, DATE_FORMAT(r.tqi_abertura, "%Y-%m") ORDER BY r.grp_nome, r.tqi_abertura';

        // Buscar dados dos últimos 3 meses com base na tqi_abertura
        const [rows] = await connection.execute(query, params);

        // Converter nomes dos meses para português
        const mesesPortugues = {
            'January': 'Janeiro',
            'February': 'Fevereiro',
            'March': 'Março',
            'April': 'Abril',
            'May': 'Maio',
            'June': 'Junho',
            'July': 'Julho',
            'August': 'Agosto',
            'September': 'Setembro',
            'October': 'Outubro',
            'November': 'Novembro',
            'December': 'Dezembro'
        };

        // Organizar os dados por grupo e mês
        const dadosPorGrupo = {};

        for (const row of rows) {
            // Converter o nome do mês para português
            const partes = row.mes_nome_formatado.split(' ');
            if (partes.length === 2) {
                const mesIngles = partes[0];
                const ano = partes[1];
                const mesPortugues = mesesPortugues[mesIngles] || mesIngles;
                const mesFormatado = `${mesPortugues} ${ano}`;

                const grupo = row.grp_nome;

                if (!dadosPorGrupo[grupo]) {
                    dadosPorGrupo[grupo] = {
                        grupo: grupo,
                        meses: {}
                    };
                }

                dadosPorGrupo[grupo].meses[mesFormatado] = {
                    qtde_reparos: row.qtde_reparos,
                    tmr_medio: parseFloat(row.tmr_medio || 0).toFixed(2)
                };
            }
        }

        // Converter o objeto para array
        const dadosProcessados = Object.values(dadosPorGrupo);

        console.log('Dados processados para grupos:', dadosProcessados.length, 'grupos encontrados'); // Log de debug

        return dadosProcessados;
    } catch (error) {
        console.error('Erro ao buscar dados de grupos:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Exportar o router e a função para uso em outros módulos
module.exports = router;
module.exports.getDadosGrupos = getDadosGrupos;