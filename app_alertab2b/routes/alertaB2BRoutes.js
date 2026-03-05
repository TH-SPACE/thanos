const express = require('express');
const router = express.Router();
const {
    executarSincronizacao,
    buscarBacklog,
    buscarEstatisticas
} = require('../controllers/alertaB2BController');

/**
 * Rotas do Alerta B2B
 * Base: /alerta-b2b
 */

// Página principal (se houver frontend)
router.get('/', (req, res) => {
    res.json({
        message: 'API Alerta B2B - Backlog BDSLA',
        endpoints: {
            sincronizar: 'POST /alerta-b2b/sincronizar',
            backlog: 'GET /alerta-b2b/backlog',
            estatisticas: 'GET /alerta-b2b/estatisticas'
        }
    });
});

/**
 * POST /sincronizar
 * Executa a sincronização dos dados do CSV
 */
router.post('/sincronizar', async (req, res) => {
    try {
        const { fonte } = req.body; // 'url' ou 'arquivo'
        
        console.log(`\n📡 Solicitação de sincronização recebida (fonte: ${fonte || 'url'})...`);
        
        const resultado = await executarSincronizacao(fonte || 'url');
        
        if (resultado.success) {
            res.json({
                success: true,
                message: 'Sincronização realizada com sucesso!',
                dados: resultado
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro na sincronização',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao sincronizar:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao sincronizar',
            error: error.message
        });
    }
});

/**
 * GET /backlog
 * Busca dados do backlog com filtros opcionais
 */
router.get('/backlog', async (req, res) => {
    try {
        const filtros = {
            pagina: parseInt(req.query.pagina) || 1,
            limite: parseInt(req.query.limite) || 50,
            bd: req.query.bd,
            cnpj: req.query.cnpj,
            regional: req.query.regional,
            status: req.query.status,
            grupo: req.query.grupo,
            dataInicio: req.query.dataInicio,
            dataFim: req.query.dataFim
        };

        const resultado = await buscarBacklog(filtros);

        if (resultado.success) {
            res.json({
                success: true,
                dados: resultado.dados,
                paginacao: {
                    total: resultado.total,
                    pagina: resultado.pagina,
                    limite: resultado.limite,
                    totalPaginas: resultado.totalPaginas
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar backlog',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar backlog:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao buscar backlog',
            error: error.message
        });
    }
});

/**
 * GET /estatisticas
 * Busca estatísticas do backlog
 */
router.get('/estatisticas', async (req, res) => {
    try {
        const resultado = await buscarEstatisticas();

        if (resultado.success) {
            res.json({
                success: true,
                dados: resultado.dados
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar estatísticas',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao buscar estatísticas',
            error: error.message
        });
    }
});

module.exports = router;
