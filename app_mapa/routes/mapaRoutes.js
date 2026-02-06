const express = require('express');
const router = express.Router();
const path = require('path');
const { upload, processarUpload, getUltimoUpload } = require('../controllers/mapaController');

// Rota para servir a página principal do mapa
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para upload do arquivo Excel
router.post('/upload', upload.single('excelFile'), processarUpload);

// Rota para obter os dados do último upload
router.get('/data', getUltimoUpload);

module.exports = router;