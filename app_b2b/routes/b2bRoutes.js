const express = require('express');
const router = express.Router();
const reparosB2BController = require('../controllers/reparosB2BController');
const sincronizacaoController = require('../controllers/sincronizacaoController');

// Rota principal para reparos B2B
router.use('/', reparosB2BController);

// Rotas de sincronização
router.use('/sincronizacao', sincronizacaoController);

module.exports = router;