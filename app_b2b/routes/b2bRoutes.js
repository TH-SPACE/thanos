const express = require('express');
const router = express.Router();
const reparosB2BController = require('../controllers/reparosB2BController');

// Rota principal para reparos B2B
router.use('/', reparosB2BController);

module.exports = router;