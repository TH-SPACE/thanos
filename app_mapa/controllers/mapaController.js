const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'app_mapa/uploads/') // Pasta onde os arquivos serão salvos
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Permitir apenas arquivos Excel
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Apenas arquivos XLSX/XLS são permitidos.'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

// Variável para armazenar os dados do último upload
let ultimoUpload = [];

// Função para processar o upload do arquivo Excel
const processarUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    }

    // Ler o arquivo Excel
    const workbook = xlsx.readFile(path.join(__dirname, '../uploads/', req.file.filename));
    
    // Pegar a primeira planilha
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    let data = xlsx.utils.sheet_to_json(worksheet);
    
    // Normalizar os nomes das colunas para facilitar o uso no frontend
    // Mapear variações comuns de nomes de colunas para nomes padronizados
    data = data.map(row => {
      const normalizedRow = {};
      
      Object.keys(row).forEach(key => {
        // Padronizar nomes de colunas comuns para latitude
        if (key.toLowerCase().includes('lat') || key.toLowerCase().includes('latitude')) {
          normalizedRow['latitude'] = row[key];
        }
        // Padronizar nomes de colunas comuns para longitude
        else if (key.toLowerCase().includes('lon') || key.toLowerCase().includes('long') || key.toLowerCase().includes('longitude')) {
          normalizedRow['longitude'] = row[key];
        }
        // Outras colunas mantêm seus nomes originais
        else {
          normalizedRow[key] = row[key];
        }
      });
      
      return normalizedRow;
    });
    
    // Armazenar os dados do upload para uso posterior
    ultimoUpload = data;
    
    // Retornar os dados processados
    res.json(data);
  } catch (error) {
    console.error('Erro ao processar o arquivo Excel:', error);
    res.status(500).json({ error: 'Erro ao processar o arquivo Excel.' });
  }
};

// Função para obter os dados do último upload
const getUltimoUpload = (req, res) => {
  res.json(ultimoUpload);
};

module.exports = {
  upload,
  processarUpload,
  getUltimoUpload
};