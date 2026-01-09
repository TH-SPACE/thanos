const express = require('express');
const router = express.Router();
const tmrController = require('../controllers/tmrController');
const dadosTmrController = require('../controllers/dadosTmrController');
const gruposController = require('../controllers/gruposController');

// Rota principal do TMR
router.use('/', tmrController);

// Rotas para dados do TMR
router.use('/dados', dadosTmrController.router);

// Rotas para visão por grupos
router.use('/grupos', gruposController);

module.exports = router;