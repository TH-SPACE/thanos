// ================================================================================
// 🛣️ ROTAS PARA COMPARATIVO DE GASTO VS PREVISTO DE HE
// ================================================================================
// Este arquivo define as rotas para o novo painel de comparação entre
// horas extras gastas (executadas) e as previamente
// solicitadas/aprovadas no sistema de planejamento.
// ================================================================================

const express = require("express");
const router = express.Router();

// ================================================================================
// 🔐 Middlewares de Autenticação
// ================================================================================

const heAuth = require("../middleware/heAuth");
const heDiretoriaAuth = require("../middleware/heDiretoriaAuth");
const heAprovadorAuth = require("../middleware/heAprovadorAuth");

// ================================================================================
// 📊 Controller
// ================================================================================

const gastoPrevController = require("../controllers/gastoPrevController");

// ================================================================================
// 📈 APIs para o Dashboard de Gasto vs Previsto
// ================================================================================

/**
 * GET /api/comparativo-gasto-prev
 * Retorna dados comparativos entre horas executadas e autorizadas por gerente
 *
 * Middlewares: requireHEAuth, requireAnyHEDiretoria
 * Query params: mes (obrigatório)
 * Filtro: Por diretoria do usuário
 */
router.get("/api/comparativo-gasto-prev",
    heAuth.requireHEAuth,
    heDiretoriaAuth.requireAnyHEDiretoria,
    gastoPrevController.getComparativoGastoPrev
);



/**
 * GET /api/comparativo-gasto-prev-valor
 * Retorna dados comparativos monetários entre valores executados e autorizados por gerente
 *
 * Middlewares: requireHEAuth, requireAnyHEDiretoria
 * Query params: mes (obrigatório)
 * Filtro: Por diretoria do usuário
 */
router.get("/api/comparativo-gasto-prev-valor",
    heAuth.requireHEAuth,
    heDiretoriaAuth.requireAnyHEDiretoria,
    gastoPrevController.getComparativoGastoPrevValor
);

/**
 * GET /api/gasto-prev/meses-disponiveis
 * Retorna uma lista de meses/anos únicos que possuem registros na tabela FREQUENCIA.
 * Usado para popular dinamicamente os filtros de mês no frontend.
 *
 * Middlewares: requireHEAuth, requireAnyHEDiretoria
 */
router.get("/api/gasto-prev/meses-disponiveis",
    heAuth.requireHEAuth,
    heDiretoriaAuth.requireAnyHEDiretoria,
    gastoPrevController.getMesesDisponiveisGastoPrev
);

module.exports = router;