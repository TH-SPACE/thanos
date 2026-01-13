const { Router } = require('express');
const router = Router();
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const xlsx = require('xlsx');
const tmrAuth = require('../middleware/tmrAuth');

// Verificar e criar pasta de uploads se não existir
const uploadDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Pasta temporária para uploads
    },
    filename: function (req, file, cb) {
        cb(null, 'grupo_agrupado_upload_' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Permitir apenas arquivos Excel
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.originalname.endsWith('.xlsx')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos .xlsx são permitidos!'));
        }
    }
});

// Rota para obter o conteúdo do arquivo de mapeamento de grupos
router.get('/grupo-mapping', tmrAuth, async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../grupo_agrupado_mapping.json');
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Erro ao ler o arquivo de mapeamento de grupos:', error);
        res.status(500).json({ error: 'Erro ao ler o arquivo de mapeamento de grupos' });
    }
});

// Rota para salvar o conteúdo no arquivo de mapeamento de grupos
router.post('/grupo-mapping', tmrAuth, async (req, res) => {
    try {
        // Verificar se o usuário tem permissão para salvar (precisa ser ADM)
        if (!req.session.usuario || !req.session.usuario.perfil.includes("ADM")) {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem salvar alterações.' });
        }

        const { grupo_agrupado_rules } = req.body;

        if (!grupo_agrupado_rules) {
            return res.status(400).json({ error: 'Dados inválidos. O corpo da requisição deve conter grupo_agrupado_rules.' });
        }

        const newData = {
            grupo_agrupado_rules: grupo_agrupado_rules
        };

        const filePath = path.join(__dirname, '../grupo_agrupado_mapping.json');
        await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');

        res.json({ success: true, message: 'Arquivo de mapeamento de grupos atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar o arquivo de mapeamento de grupos:', error);
        res.status(500).json({ error: 'Erro ao salvar o arquivo de mapeamento de grupos' });
    }
});

// Middleware para verificar permissão de administrador
function verificarADM(req, res, next) {
    if (!req.session.usuario || !req.session.usuario.perfil.includes("ADM")) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' });
    }
    next();
}

// Rota para acessar a página de configurações (restringida a ADM)
router.get('/', tmrAuth, verificarADM, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/config.html'));
});

// Rota para upload e processamento de arquivo Excel
router.post('/upload-xlsx', tmrAuth, verificarADM, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
        }

        // Ler o arquivo Excel
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0]; // Assumindo que a primeira planilha contém os dados
        const worksheet = workbook.Sheets[sheetName];

        // Converter para JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        // Validar estrutura dos dados
        if (!jsonData || jsonData.length === 0) {
            return res.status(400).json({ error: 'O arquivo Excel não contém dados válidos.' });
        }

        // Verificar se as colunas necessárias existem
        const requiredColumns = ['contains', 'group'];
        const hasRequiredColumns = requiredColumns.every(col =>
            Object.keys(jsonData[0]).some(key => key.toLowerCase() === col.toLowerCase())
        );

        if (!hasRequiredColumns) {
            return res.status(400).json({
                error: 'O arquivo Excel deve conter as colunas "contains" e "group".'
            });
        }

        // Normalizar os nomes das colunas para minúsculas
        const normalizedData = jsonData.map(row => {
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'contains') {
                    normalizedRow.contains = String(row[key] || '');
                } else if (lowerKey === 'group') {
                    normalizedRow.group = String(row[key] || '');
                }
            });
            return normalizedRow;
        });

        // Criar o objeto JSON com a estrutura esperada
        const jsonStructure = {
            grupo_agrupado_rules: normalizedData
        };

        // Salvar no arquivo JSON
        const filePath = path.join(__dirname, '../grupo_agrupado_mapping.json');
        await fs.writeFile(filePath, JSON.stringify(jsonStructure, null, 2), 'utf8');

        // Remover o arquivo temporário de upload
        await fs.unlink(req.file.path);

        res.json({
            success: true,
            message: `Arquivo Excel processado com sucesso! ${normalizedData.length} regras foram atualizadas.`
        });
    } catch (error) {
        console.error('Erro ao processar o arquivo Excel:', error);

        // Tentar remover o arquivo temporário mesmo em caso de erro
        try {
            if (req.file && req.file.path) {
                await fs.unlink(req.file.path);
            }
        } catch (unlinkError) {
            console.error('Erro ao remover arquivo temporário:', unlinkError);
        }

        res.status(500).json({ error: 'Erro ao processar o arquivo Excel: ' + error.message });
    }
});

// Rota para download do modelo de Excel
router.get('/download-modelo', tmrAuth, verificarADM, async (req, res) => {
    try {
        // Dados de exemplo para o modelo
        const exemploDados = [
            { contains: "TEXTO_EXEMPLO_1", group: "Grupo Exemplo 1" },
            { contains: "TEXTO_EXEMPLO_2", group: "Grupo Exemplo 2" },
            { contains: "OUTRO_TEXTO", group: "Outro Grupo" }
        ];

        // Criar uma planilha com os dados de exemplo
        const worksheet = xlsx.utils.json_to_sheet(exemploDados);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Modelo");

        // Definir cabeçalhos
        xlsx.utils.sheet_add_aoa(worksheet, [["contains", "group"]], { origin: "A1" });

        // Escrever o arquivo Excel em memória
        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Enviar como download
        res.setHeader('Content-Disposition', 'attachment; filename=modelo_grupo_agrupado.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error('Erro ao gerar modelo Excel:', error);
        res.status(500).json({ error: 'Erro ao gerar modelo Excel: ' + error.message });
    }
});

module.exports = router;