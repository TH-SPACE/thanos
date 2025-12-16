const express = require('express');
const router = express.Router();
const tmrController = require('../controllers/tmrController');
const dadosTmrController = require('../controllers/dadosTmrController');

// Rota principal do TMR
router.use('/', tmrController);

// Rotas para dados do TMR
router.use('/dados', dadosTmrController.router);

module.exports = router;