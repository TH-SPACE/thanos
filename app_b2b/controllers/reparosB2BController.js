const { Router } = require('express');
const router = Router();
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const db = require('../../db/db'); // Ajuste o caminho conforme necessário

// Middleware de autenticação
const b2bAuth = require('../middleware/b2bAuth');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'reparos_b2b_' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Rota para acessar a página principal de reparos B2B
router.get('/', b2bAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/reparos_b2b.html'));
});

// Rota para upload de arquivo Excel
// ATENÇÃO: A tabela 'reparosb2b' deve ser criada previamente no banco de dados
// Use o arquivo 'reparosb2b_table.sql' para criar a estrutura da tabela
router.post('/upload-reparos', b2bAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
        }

        // Ler o arquivo Excel
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0]; // Assumindo que a primeira planilha contém os dados
        const worksheet = workbook.Sheets[sheetName];
        
        // Ler como array para manter a ordem das colunas
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (jsonData.length === 0) {
            return res.status(400).json({ error: 'O arquivo está vazio ou não contém dados válidos.' });
        }

        // Conectar ao banco de dados e inserir os dados
        const connection = await db.mysqlPool.getConnection();

        try {
            // Inserir dados com verificação de duplicidade
            let insertedCount = 0;
            let updatedCount = 0;

            // Pular a primeira linha se for cabeçalho (verificar se é cabeçalho comparando com o mapeamento)
            const hasHeader = jsonData.length > 0 && 
                             jsonData[0][0] === 'bd' && 
                             jsonData[0][1] === 'id_circuito'; // Verificar se a primeira linha tem os nomes das colunas esperados
            
            const startIndex = hasHeader ? 1 : 0;

            // Definir o mapeamento fixo de colunas baseado na ordem esperada no arquivo Excel
            // A ordem deve corresponder exatamente à estrutura da tabela reparosb2b
            const columnMapping = [
                'bd',                    // 0
                'id_circuito',          // 1
                'bd_ant',               // 2
                'lp_15',                // 3
                'designador_lp_13',     // 4
                'id_comercial',         // 5
                'data_abertura',        // 6
                'data_reparo',          // 7
                'data_encerramento',    // 8
                'data_baixa',           // 9
                'last_update',          // 10
                'kpi',                  // 11
                'kpi_acesso',           // 12
                'tipo_acesso',          // 13
                'origem',               // 14
                'sistema_origem',       // 15
                'cod_grupo',            // 16
                'grupo_economico',      // 17
                'bd_raiz',              // 18
                'status_codigo',        // 19
                'status_nome',          // 20
                'procedencia',          // 21
                'reclamacao',           // 22
                'segmento_sistema',     // 23
                'segmento_v3',          // 24
                'segmento_novo',        // 25
                'segmento_vivo_corp',   // 26
                'projeto',              // 27
                'cliente_nome',         // 28
                'cnpj',                 // 29
                'cnpj_raiz',            // 30
                'endereco',             // 31
                'localidade_codigo',    // 32
                'area_codigo',          // 33
                'escritorio_codigo',    // 34
                'cidade',               // 35
                'uf',                   // 36
                'cluster',              // 37
                'regional',             // 38
                'regional_vivo',        // 39
                'lp_operadora',         // 40
                'servico_cpcc_nome',    // 41
                'velocidade',           // 42
                'velocidade_kbps',      // 43
                'produto_nome',         // 44
                'familia_produto',      // 45
                'baixa_n1_codigo',      // 46
                'baixa_n2_codigo',      // 47
                'baixa_n3_codigo',      // 48
                'baixa_n4_codigo',      // 49
                'baixa_n5_codigo',      // 50
                'baixa_n1_nome',        // 51
                'baixa_n2_nome',        // 52
                'baixa_n3_nome',        // 53
                'baixa_n4_nome',        // 54
                'baixa_n5_nome',        // 55
                'resumo_intragov',      // 56
                'intragov_sigla',       // 57
                'intragov_codigo',      // 58
                'sla_horas',            // 59
                'grupo',                // 60
                'grupo_novo',           // 61
                'foco_acoes',           // 62
                'foco_novo',            // 63
                'grupo_baixa_codigo',   // 64
                'grupo_abertura',       // 65
                'usuario_abertura',     // 66
                'grupo_baixa',          // 67
                'usuario_baixa',        // 68
                'grupo_responsavel',    // 69
                'operadora',            // 70
                'tipo_operadora',       // 71
                'tmr',                  // 72
                'tmr_sem_parada',       // 73
                'tempo_parada',         // 74
                'decorrido_sem_parada', // 75
                'prazo',                // 76
                'reincidencia_30d',     // 77
                'reincidencia_tipo',    // 78
                'originou_reinc',       // 79
                'prox_reinc',           // 80
                'horario_func_inicio',  // 81
                'horario_func_fim',     // 82
                'R30_Tratativas'        // 83
            ];

            for (let rowIndex = startIndex; rowIndex < jsonData.length; rowIndex++) {
                const rowArray = jsonData[rowIndex];
                
                // Pegar o valor do BD (primeira coluna) para verificação
                const bd = rowArray[0]?.toString().trim() || null;

                if (!bd) {
                    console.warn('Registro ignorado por falta de valor na coluna bd:', rowArray);
                    continue;
                }

                try {
                    // Mapear os valores para as colunas correspondentes
                    const columnNames = [];
                    const values = [];

                    // Percorrer cada índice do array de valores e associar à coluna correspondente
                    for (let i = 0; i < rowArray.length && i < columnMapping.length; i++) {
                        const columnName = columnMapping[i];
                        let value = rowArray[i];

                        // Adicionar à lista se for uma coluna válida da tabela
                        if (columnName) {
                            columnNames.push(columnName);

                            // Converter todos os valores para texto
                            value = formatValue(value);
                            values.push(value);
                        }
                    }

                    // Criar placeholders para os valores
                    const placeholders = columnNames.map(() => '?').join(', ');

                    // Montar a query de INSERT
                    const insertQuery = `INSERT INTO reparosb2b (${columnNames.join(', ')}) VALUES (${placeholders})`;

                    const result = await connection.execute(insertQuery, values);
                    insertedCount++;
                } catch (insertError) {
                    // Se der erro de duplicidade (por causa da constraint UNIQUE), atualizar o registro
                    if (insertError.code === 'ER_DUP_ENTRY') {
                        // Criar lista de assignments para o UPDATE
                        const updateAssignments = [];
                        const updateValues = [];

                        // Percorrer cada índice do array de valores e criar as cláusulas de atualização
                        // Começando do índice 1 para pular a coluna 'bd' (índice 0)
                        for (let i = 1; i < rowArray.length && i < columnMapping.length; i++) {
                            const columnName = columnMapping[i];
                            let value = rowArray[i];

                            // Não atualizar a coluna 'bd' pois é a chave primária
                            if (columnName && columnName !== 'bd') {
                                updateAssignments.push(`${columnName} = ?`);

                                // Converter todos os valores para texto
                                value = formatValue(value);
                                updateValues.push(value);
                            }
                        }

                        // Adicionar o valor do BD no final para a cláusula WHERE
                        updateValues.push(bd);

                        const updateQuery = `UPDATE reparosb2b SET ${updateAssignments.join(', ')} WHERE bd = ?`;

                        await connection.execute(updateQuery, updateValues);
                        updatedCount++;
                    } else {
                        // Se for outro tipo de erro, lançar novamente
                        throw insertError;
                    }
                }
            }

            // Remover o arquivo temporário após o processamento
            fs.unlinkSync(req.file.path);

            res.json({
                success: true,
                message: `Processamento concluído com sucesso! ${insertedCount} registros inseridos, ${updatedCount} registros atualizados.`
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao processar upload de reparos B2B:', error);
        
        // Remover o arquivo temporário em caso de erro
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            error: 'Erro ao processar o arquivo: ' + error.message 
        });
    }
});

// Rota para obter dados de análise
router.get('/analise-data', b2bAuth, async (req, res) => {
    try {
        const connection = await db.mysqlPool.getConnection();
        try {
            // Obter parâmetros de filtro
            const { regional, kpi } = req.query; // Removido o parâmetro data
            
            console.log('Parâmetros recebidos:', { regional, kpi });
            
            // Construir cláusulas WHERE dinamicamente
            let whereClause = "WHERE cluster IS NOT NULL AND cluster != ''";
            const params = [];
            
            if (regional) {
                whereClause += " AND regional_vivo = ?";
                params.push(regional);
            }
            
            if (kpi) {
                whereClause += " AND kpi = ?";
                params.push(kpi);
            }
            
            console.log('Query final:', `SELECT cluster, COUNT(CASE WHEN data_abertura IS NOT NULL THEN 1 END) AS entrantes, COUNT(CASE WHEN data_encerramento IS NOT NULL THEN 1 END) AS encerramentos, (COUNT(CASE WHEN data_abertura IS NOT NULL THEN 1 END) - COUNT(CASE WHEN data_encerramento IS NOT NULL THEN 1 END)) AS diferenca FROM reparosb2b ${whereClause} GROUP BY cluster ORDER BY cluster`);
            console.log('Parâmetros:', params);
            
            // Query para obter dados de entrantes vs encerramentos por cluster
            const query = `
                SELECT
                    cluster,
                    COUNT(CASE WHEN data_abertura IS NOT NULL THEN 1 END) AS entrantes,
                    COUNT(CASE WHEN data_encerramento IS NOT NULL THEN 1 END) AS encerramentos,
                    (COUNT(CASE WHEN data_abertura IS NOT NULL THEN 1 END) -
                     COUNT(CASE WHEN data_encerramento IS NOT NULL THEN 1 END)) AS diferenca
                FROM reparosb2b
                ${whereClause}
                GROUP BY cluster
                ORDER BY cluster
            `;
            
            const [rows] = await connection.execute(query, params);
            
            console.log('Número de linhas retornadas:', rows.length);

            res.json(rows);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao obter dados de análise:', error);
        res.status(500).json({ error: 'Erro ao obter dados de análise' });
    }
});

// Rota para obter opções de filtros
router.get('/filtros-opcoes', b2bAuth, async (req, res) => {
    try {
        const { campo } = req.query;
        
        if (!campo) {
            return res.status(400).json({ error: 'Campo não especificado' });
        }
        
        // Validar campo para evitar SQL injection
        const camposValidos = ['regional_vivo', 'kpi'];
        if (!camposValidos.includes(campo)) {
            return res.status(400).json({ error: 'Campo inválido' });
        }
        
        const connection = await db.mysqlPool.getConnection();
        try {
            // Query para obter valores únicos do campo especificado
            const query = `
                SELECT DISTINCT ${campo} 
                FROM reparosb2b 
                WHERE ${campo} IS NOT NULL AND ${campo} != ''
                ORDER BY ${campo}
            `;
            
            const [rows] = await connection.execute(query);

            // Extrair os valores do campo
            const valores = rows.map(row => row[campo]);

            res.json(valores);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao obter opções de filtros:', error);
        res.status(500).json({ error: 'Erro ao obter opções de filtros' });
    }
});

// Rota para obter perfil do usuário
router.get('/perfil-usuario', b2bAuth, async (req, res) => {
    try {
        // Retorna as informações do usuário da sessão
        if (req.session.usuario) {
            const usuario = req.session.usuario;
            
            // Monta o objeto com as informações necessárias
            const perfilUsuario = {
                nome: usuario.nome || '',
                email: usuario.email || '',
                cargo: usuario.cargo || '',
                perfil: usuario.perfil || ''
            };
            
            res.json(perfilUsuario);
        } else {
            res.status(401).json({ error: 'Usuário não autenticado' });
        }
    } catch (error) {
        console.error('Erro ao obter perfil do usuário:', error);
        res.status(500).json({ error: 'Erro ao obter perfil do usuário' });
    }
});

// Função auxiliar para padronizar valores (agora todos serão texto)
function formatValue(value) {
    if (value === null || value === undefined || value === '') return null;
    
    // Converter qualquer valor para string, removendo espaços extras
    return String(value).trim();
}

module.exports = router;