const express = require('express');
const router = express.Router();
const path = require('path');
const {
    executarSincronizacao,
    buscarBacklog,
    buscarEstatisticas,
    buscarDashboardCluster,
    buscarLogsSincronizacao,
    buscarFiltrosDisponiveis,
    buscarStatusPorCluster,
    buscarReparosCriticost,
    baixarCSV
} = require('../controllers/alertaB2BController');

/**
 * Rota para servir a página do Dashboard
 * Deve vir antes das rotas da API para não conflitar
 */
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

/**
 * Rotas da API do Alerta B2B
 */

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
            cliente: req.query.cliente,
            cluster: req.query.cluster,
            dataInicio: req.query.dataInicio,
            dataFim: req.query.dataFim
        };

        console.log('📡 Filtros da rota:', filtros);

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
 * Busca estatísticas do backlog (suporta filtros)
 */
router.get('/estatisticas', async (req, res) => {
    try {
        const filtros = {
            bd: req.query.bd,
            cliente: req.query.cliente,
            regional: req.query.regional,
            status: req.query.status,
            grupo: req.query.grupo,
            cluster: req.query.cluster,
            dataInicio: req.query.dataInicio,
            dataFim: req.query.dataFim
        };

        const resultado = await buscarEstatisticas(filtros);

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

/**
 * GET /dashboard
 * Busca dashboard por cluster com tempo de backlog
 */
router.get('/dashboard', async (req, res) => {
    try {
        const resultado = await buscarDashboardCluster();

        if (resultado.success) {
            res.json({
                success: true,
                dados: resultado.dados
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar dashboard',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao buscar dashboard',
            error: error.message
        });
    }
});

/**
 * GET /logs
 * Busca logs de sincronização
 */
router.get('/logs', async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 20;
        const resultado = await buscarLogsSincronizacao(limite);

        if (resultado.success) {
            res.json({
                success: true,
                dados: resultado.dados
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar logs',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao buscar logs',
            error: error.message
        });
    }
});

/**
 * GET /filtros
 * Busca filtros disponíveis para dropdowns
 */
router.get('/filtros', async (req, res) => {
    try {
        const resultado = await buscarFiltrosDisponiveis();

        if (resultado.success) {
            res.json({
                success: true,
                dados: resultado.dados
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar filtros',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar filtros:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao buscar filtros',
            error: error.message
        });
    }
});

/**
 * GET /status-por-cluster
 * Busca status (ativos/parados) por cluster
 */
router.get('/status-por-cluster', async (req, res) => {
    try {
        const filtros = {
            regional: req.query.regional,
            status: req.query.status,
            cluster: req.query.cluster,
            dataInicio: req.query.dataInicio,
            dataFim: req.query.dataFim
        };

        const resultado = await buscarStatusPorCluster(filtros);

        if (resultado.success) {
            res.json({
                success: true,
                dados: resultado.dados
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar status por cluster',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar status por cluster:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao buscar status por cluster',
            error: error.message
        });
    }
});

/**
 * GET /reparos-criticos
 * Busca reparos Ativos críticos (próximos ou após 18h)
 */
router.get('/reparos-criticos', async (req, res) => {
    try {
        const resultado = await buscarReparosCriticost();

        if (resultado.success) {
            res.json({
                success: true,
                dados: resultado.dados
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar reparos críticos',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar reparos críticos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao buscar reparos críticos',
            error: error.message
        });
    }
});

/**
 * GET /exportar
 * Exporta dados em formato CSV/Excel
 */
router.get('/exportar', async (req, res) => {
    try {
        const filtros = {
            pagina: 1,
            limite: 10000, // Buscar todos os registros
            regional: req.query.regional,
            status: req.query.status,
            cluster: req.query.cluster,
            dataInicio: req.query.dataInicio,
            dataFim: req.query.dataFim
        };

        const resultado = await buscarBacklog(filtros);

        if (resultado.success) {
            const csv = baixarCSV(resultado.dados, 'backlog_b2b');

            if (csv.success) {
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csv.nomeArquivo}"`);
                res.send(csv.conteudo);
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao gerar CSV',
                    error: csv.error
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar dados para exportação',
                error: resultado.error
            });
        }
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao exportar dados',
            error: error.message
        });
    }
});

module.exports = router;
