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
                             (jsonData[0][0] === 'bd' || jsonData[0][0] === 'BD') &&
                             jsonData[0][1] === 'bd_raiz'; // Verificar se a primeira linha tem os nomes das colunas esperados

            const startIndex = hasHeader ? 1 : 0;

            // Definir o mapeamento fixo de colunas baseado na ordem esperada no arquivo Excel
            // A ordem deve corresponder exatamente à estrutura da tabela reparosb2b (ORDEM DO JSON - NOVA ESTRUTURA)
            const columnMapping = [
                'bd',                    // 0
                'bd_raiz',              // 1
                'protocolo_crm',        // 2
                'id_vantive',           // 3
                'status_nome',          // 4
                'tipo_ngem',            // 5
                'procedencia',          // 6
                'reclamacao',           // 7
                'segmento_sistema',     // 8
                'segmento_comercial',   // 9
                'segmento_novo',        // 10
                'segmento_v3',          // 11
                'atendimento_valor',    // 12
                'slm_flag',             // 13
                'cliente_nome',         // 14
                'cnpj',                 // 15
                'cnpj_raiz',            // 16
                'cod_grupo',            // 17
                'grupo_economico',      // 18
                'localidade_codigo',    // 19
                'area_codigo',          // 20
                'escritorio_codigo',    // 21
                'endereco',             // 22
                'cidade',               // 23
                'uf',                   // 24
                'cluster',              // 25
                'regional',             // 26
                'regional_vivo',        // 27
                'lp_15',                // 28
                'designador_lp_13',     // 29
                'lp_operadora',         // 30
                'servico_cpcc_nome',    // 31
                'cpcc',                 // 32
                'velocidade',           // 33
                'velocidade_kbps',      // 34
                'produto_nome',         // 35
                'servico',              // 36
                'familia_produto',      // 37
                'data_abertura',        // 38
                'data_abertura_dia_semana', // 39
                'data_abertura_dia',    // 40
                'data_abertura_mes',    // 41
                'data_abertura_ano',    // 42
                'mes_ano_abertura',     // 43
                'data_reparo',          // 44
                'data_reparo_dia_semana', // 45
                'data_reparo_dia',      // 46
                'data_reparo_mes',      // 47
                'data_reparo_ano',      // 48
                'data_encerramento',    // 49
                'data_encerramento_dia_semana', // 50
                'data_encerramento_dia', // 51
                'data_encerramento_mes', // 52
                'data_encerramento_ano', // 53
                'mes_ano_enc',          // 54
                'data_baixa',           // 55
                'data_baixa_dia_semana', // 56
                'data_baixa_dia',       // 57
                'data_baixa_mes',       // 58
                'data_baixa_ano',       // 59
                'baixa_n1_codigo',      // 60
                'baixa_n1_nome',        // 61
                'baixa_n2_codigo',      // 62
                'baixa_n2_nome',        // 63
                'baixa_n3_codigo',      // 64
                'baixa_n3_nome',        // 65
                'baixa_n4_codigo',      // 66
                'baixa_n4_nome',        // 67
                'baixa_n5_codigo',      // 68
                'baixa_n5_nome',        // 69
                'baixa_codigo',         // 70
                'resumo_intragov',      // 71
                'intragov_sigla',       // 72
                'intragov_codigo',      // 73
                'acionamento_tecnico',  // 74
                'acionamento_operadora', // 75
                'acionamento_integradora', // 76
                'acionamento_parceiro', // 77
                'acionamento_transmissao', // 78
                'acionamento_ccr',      // 79
                'acionamento_osp',      // 80
                'acionamento_diag_b2b', // 81
                'sla_horas',            // 82
                'sla_tipo',             // 83
                'grupo',                // 84
                'grupo_novo',           // 85
                'foco_acoes',           // 86
                'foco_novo',            // 87
                'grupo_baixa',          // 88
                'usuario_baixa',        // 89
                'grupo_abertura',       // 90
                'usuario_abertura',     // 91
                'grupo_responsavel',    // 92
                'operadora',            // 93
                'tipo_operadora',       // 94
                'massiva_flag',         // 95
                'tmr',                  // 96
                'prazo',                // 97
                'tempo_parada',         // 98
                'reincidencia_30d',     // 99
                'reincidencia_30d_grupo', // 100
                'reincidencia_tipo',    // 101
                'originou_reinc',       // 102
                'reincidencia_30d_atacado', // 103
                'reincidencia_tipo_atacado', // 104
                'reincidencia_30d_acesso', // 105
                'reincidencia_tipo_acesso', // 106
                'prox_reinc',           // 107
                'originou_reinc_grupo', // 108
                'prox_reinc_grupo',     // 109
                'maior_doze_flag',      // 110
                'tipo_empresa',         // 111
                'kpi',                  // 112
                'kpi_acesso',           // 113
                'origem',               // 114
                'sistema_origem',       // 115
                'id_projeto',           // 116
                'projeto',              // 117
                'top_atacado',          // 118
                'tj',                   // 119
                'last_update',          // 120
                'tmr_sem_parada',       // 121
                'triagem_flag',         // 122
                'planta_flag',          // 123
                'tipo_acesso',          // 124
                'contato_nome',         // 125
                'reclamante_nome',      // 126
                'reclamante_telefone',  // 127
                'contato_telefone',     // 128
                'flag_intragov',        // 129
                'R30_Tratativas',       // 130
                'tmr_exp_reparo_min',   // 131
                'tmr_exp_min',          // 132
                'id_circuito',          // 133
                'bd_ant',               // 134
                'status_codigo',        // 135
                'id_comercial'          // 136
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

                    // Obter cidade e UF para correção do cluster (índices 23 e 24 na nova estrutura)
                    const cidade = rowArray[23]?.toString().trim() || '';
                    const uf = rowArray[24]?.toString().trim() || '';

                    // Percorrer cada índice do array de valores e associar à coluna correspondente
                    for (let i = 0; i < rowArray.length && i < columnMapping.length; i++) {
                        const columnName = columnMapping[i];
                        let value = rowArray[i];

                        // Adicionar à lista se for uma coluna válida da tabela
                        if (columnName) {
                            columnNames.push(columnName);

                            // Verificar se é uma coluna de data e aplicar formatação adequada
                            const isDateColumn = ['data_abertura', 'data_reparo', 'data_encerramento', 'data_baixa', 'last_update',
                                                  'data_abertura_dia_semana', 'data_abertura_dia', 'data_abertura_mes', 'data_abertura_ano',
                                                  'data_reparo_dia_semana', 'data_reparo_dia', 'data_reparo_mes', 'data_reparo_ano',
                                                  'data_encerramento_dia_semana', 'data_encerramento_dia', 'data_encerramento_mes', 'data_encerramento_ano',
                                                  'data_baixa_dia_semana', 'data_baixa_dia', 'data_baixa_mes', 'data_baixa_ano'].includes(columnName);

                            // Converter valor com formatação adequada
                            value = formatValue(value, isDateColumn);

                            // Aplicar correção do cluster (índice 25 = coluna 'cluster')
                            if (columnName === 'cluster') {
                                value = corrigirCluster(cidade, uf);
                            }

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

                        // Obter cidade e UF para correção do cluster (índices 23 e 24 na nova estrutura)
                        const cidade = rowArray[23]?.toString().trim() || '';
                        const uf = rowArray[24]?.toString().trim() || '';

                        // Percorrer cada índice do array de valores e criar as cláusulas de atualização
                        // Começando do índice 1 para pular a coluna 'bd' (índice 0)
                        for (let i = 1; i < rowArray.length && i < columnMapping.length; i++) {
                            const columnName = columnMapping[i];
                            let value = rowArray[i];

                            // Não atualizar a coluna 'bd' pois é a chave primária
                            if (columnName && columnName !== 'bd') {
                                // Verificar se é uma coluna de data e aplicar formatação adequada
                                const isDateColumn = ['data_abertura', 'data_reparo', 'data_encerramento', 'data_baixa', 'last_update',
                                                      'data_abertura_dia_semana', 'data_abertura_dia', 'data_abertura_mes', 'data_abertura_ano',
                                                      'data_reparo_dia_semana', 'data_reparo_dia', 'data_reparo_mes', 'data_reparo_ano',
                                                      'data_encerramento_dia_semana', 'data_encerramento_dia', 'data_encerramento_mes', 'data_encerramento_ano',
                                                      'data_baixa_dia_semana', 'data_baixa_dia', 'data_baixa_mes', 'data_baixa_ano'].includes(columnName);

                                // Converter valor com formatação adequada
                                value = formatValue(value, isDateColumn);

                                // Aplicar correção do cluster (índice 25 = coluna 'cluster')
                                if (columnName === 'cluster') {
                                    value = corrigirCluster(cidade, uf);
                                }

                                updateAssignments.push(`${columnName} = ?`);
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

// Rota para exportar dados filtrados em formato Excel
router.get('/exportar-dados', b2bAuth, async (req, res) => {
    try {
        const connection = await db.mysqlPool.getConnection();
        try {
            // Obter parâmetros de filtro
            const { regional, segmento, procedencia, kpi, mes_ano } = req.query;

            // Construir cláusulas WHERE dinamicamente
            let whereClause = "WHERE 1=1";
            const params = [];

            if (regional) {
                whereClause += " AND regional_vivo = ?";
                params.push(regional);
            }

            // Aplicar filtro de segmento (padrão B2B se não for especificado)
            const segmentoFiltro = segmento || 'B2B';
            if (segmentoFiltro === 'Atacado') {
                whereClause += " AND segmento_novo = 'Atacado'";
            } else if (segmentoFiltro === 'B2B') {
                whereClause += " AND segmento_novo != 'Atacado'";
            }

            // Aplicar filtro de procedência
            if (procedencia) {
                const procedenciaArray = procedencia.split(',');
                if (procedenciaArray.length > 1) {
                    const placeholders = procedenciaArray.map(() => '?').join(',');
                    whereClause += ` AND procedencia IN (${placeholders})`;
                    params.push(...procedenciaArray.map(item => item.trim()));
                } else {
                    whereClause += " AND procedencia = ?";
                    params.push(procedencia);
                }
            }

            if (kpi) {
                const kpiArray = kpi.split(',');
                if (kpiArray.length > 1) {
                    const placeholders = kpiArray.map(() => '?').join(',');
                    whereClause += ` AND kpi IN (${placeholders})`;
                    params.push(...kpiArray.map(item => item.trim()));
                } else {
                    whereClause += " AND kpi = ?";
                    params.push(kpi);
                }
            }

            // Adicionar filtro por mês/ano se fornecido
            if (mes_ano) {
                whereClause += " AND (DATE_FORMAT(data_abertura, '%Y-%m') = ? OR DATE_FORMAT(data_encerramento, '%Y-%m') = ?)";
                params.push(mes_ano, mes_ano);
            } else {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
                const currentMonthFormatted = `${currentYear}-${currentMonth}`;

                whereClause += " AND (DATE_FORMAT(data_abertura, '%Y-%m') = ? OR DATE_FORMAT(data_encerramento, '%Y-%m') = ?)";
                params.push(currentMonthFormatted, currentMonthFormatted);
            }

            // Query para obter dados completos (NOVA ESTRUTURA - API 2026-02-27)
            const query = `
                SELECT
                    bd, bd_raiz, protocolo_crm, id_vantive, id_circuito, bd_ant, id_comercial,
                    status_codigo, status_nome, tipo_ngem,
                    procedencia, reclamacao, segmento_sistema, segmento_comercial, segmento_novo, segmento_v3, segmento_vivo_corp,
                    atendimento_valor, slm_flag, cliente_nome, cnpj, cnpj_raiz, cod_grupo, grupo_economico,
                    endereco, cidade, uf, cluster,
                    localidade_codigo, area_codigo, escritorio_codigo,
                    regional, regional_vivo, lp_15, designador_lp_13, lp_operadora, servico_cpcc_nome,
                    cpcc, velocidade, velocidade_kbps, produto_nome, servico, familia_produto,
                    data_abertura, data_abertura_dia_semana, data_abertura_dia, data_abertura_mes, data_abertura_ano, mes_ano_abertura,
                    data_reparo, data_reparo_dia_semana, data_reparo_dia, data_reparo_mes, data_reparo_ano,
                    data_encerramento, data_encerramento_dia_semana, data_encerramento_dia, data_encerramento_mes, data_encerramento_ano, mes_ano_enc,
                    data_baixa, data_baixa_dia_semana, data_baixa_dia, data_baixa_mes, data_baixa_ano,
                    last_update,
                    baixa_n1_codigo, baixa_n1_nome, baixa_n2_codigo, baixa_n2_nome,
                    baixa_n3_codigo, baixa_n3_nome, baixa_n4_codigo, baixa_n4_nome,
                    baixa_n5_codigo, baixa_n5_nome, baixa_codigo,
                    resumo_intragov, intragov_sigla, intragov_codigo, flag_intragov,
                    acionamento_tecnico, acionamento_operadora, acionamento_integradora,
                    acionamento_parceiro, acionamento_transmissao, acionamento_ccr,
                    acionamento_osp, acionamento_diag_b2b,
                    sla_horas, sla_tipo, grupo, grupo_novo, foco_acoes, foco_novo,
                    grupo_abertura, usuario_abertura, grupo_baixa, usuario_baixa, grupo_responsavel,
                    operadora, tipo_operadora, massiva_flag,
                    tmr, tmr_sem_parada, tempo_parada, tmr_exp_reparo_min, tmr_exp_min, prazo,
                    reincidencia_30d, reincidencia_30d_grupo, reincidencia_tipo,
                    originou_reinc, reincidencia_30d_atacado, reincidencia_tipo_atacado,
                    reincidencia_30d_acesso, reincidencia_tipo_acesso,
                    prox_reinc, originou_reinc_grupo, prox_reinc_grupo,
                    maior_doze_flag, tipo_empresa,
                    id_projeto, projeto, top_atacado, tj,
                    kpi, kpi_acesso, origem, sistema_origem,
                    triagem_flag, planta_flag,
                    tipo_acesso,
                    contato_nome, contato_telefone, reclamante_nome, reclamante_telefone,
                    R30_Tratativas,
                    created_at, updated_at
                FROM reparosb2b
                ${whereClause}
                ORDER BY regional_vivo, cluster, kpi, data_abertura
            `;

            const [rows] = await connection.execute(query, params);

            // Criar workbook Excel
            const XLSX = require('xlsx');
            const workbook = XLSX.utils.book_new();

            // Converter dados para formato de planilha com cabeçalhos em maiúsculo
            // Mapear cada linha para ter chaves em maiúsculo
            const rowsWithUppercaseKeys = rows.map(row => {
                const newRow = {};
                for (const [key, value] of Object.entries(row)) {
                    newRow[key.toUpperCase()] = value;
                }
                return newRow;
            });
            
            const worksheet = XLSX.utils.json_to_sheet(rowsWithUppercaseKeys);

            // Ajustar largura das colunas (NOVA ESTRUTURA COMPLETA - 121 colunas)
            const wscols = [
                { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 20 }, { wch: 15 },
                { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
                { wch: 30 }, { wch: 20 }, { wch: 2 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
                { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 },
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
                { wch: 20 },
                { wch: 20 }, { wch: 20 }
            ];
            worksheet['!cols'] = wscols;

            // Adicionar planilha ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados B2B');

            // Gerar buffer do arquivo
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            // Configurar headers para download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="export_b2b.xlsx"');

            // Enviar arquivo
            res.send(buffer);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao exportar dados B2B:', error);
        res.status(500).json({ error: 'Erro ao exportar dados: ' + error.message });
    }
});

// Rota para obter dados de análise
router.get('/analise-data', b2bAuth, async (req, res) => {
    try {
        const connection = await db.mysqlPool.getConnection();
        try {
            // Obter parâmetros de filtro
            const { regional, segmento, procedencia, kpi, mes_ano } = req.query;

            // Construir cláusulas WHERE dinamicamente
            let whereClause = "WHERE 1=1";
            const params = [];

            if (regional) {
                whereClause += " AND regional_vivo = ?";
                params.push(regional);
            }

            // Aplicar filtro de segmento (padrão B2B se não for especificado)
            const segmentoFiltro = segmento || 'B2B';
            if (segmentoFiltro === 'Atacado') {
                whereClause += " AND segmento_novo = 'Atacado'";
            } else if (segmentoFiltro === 'B2B') {
                whereClause += " AND segmento_novo != 'Atacado'";
            }

            // Aplicar filtro de procedência
            if (procedencia) {
                const procedenciaArray = procedencia.split(',');
                if (procedenciaArray.length > 1) {
                    const placeholders = procedenciaArray.map(() => '?').join(',');
                    whereClause += ` AND procedencia IN (${placeholders})`;
                    params.push(...procedenciaArray.map(item => item.trim()));
                } else {
                    whereClause += " AND procedencia = ?";
                    params.push(procedencia);
                }
            }

            if (kpi) {
                // Verificar se kpi é uma lista separada por vírgula
                const kpiArray = kpi.split(',');
                if (kpiArray.length > 1) {
                    // Múltiplos KPIs
                    const placeholders = kpiArray.map(() => '?').join(',');
                    whereClause += ` AND kpi IN (${placeholders})`;
                    params.push(...kpiArray.map(item => item.trim()));
                } else {
                    // Apenas um KPI
                    whereClause += " AND kpi = ?";
                    params.push(kpi);
                }
            }

            // Adicionar filtro por mês/ano se fornecido
            if (mes_ano) {
                // O parâmetro mes_ano vem no formato YYYY-MM
                whereClause += " AND (DATE_FORMAT(data_abertura, '%Y-%m') = ? OR DATE_FORMAT(data_encerramento, '%Y-%m') = ?)";
                params.push(mes_ano, mes_ano);
            } else {
                // Se não for fornecido, usar o mês atual
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
                const currentMonthFormatted = `${currentYear}-${currentMonth}`;

                whereClause += " AND (DATE_FORMAT(data_abertura, '%Y-%m') = ? OR DATE_FORMAT(data_encerramento, '%Y-%m') = ?)";
                params.push(currentMonthFormatted, currentMonthFormatted);
            }

            // Query para obter dados detalhados de entrantes vs encerramentos
            const query = `
                SELECT
                    bd,
                    data_abertura,
                    data_encerramento,
                    cluster,
                    regional_vivo
                FROM reparosb2b
                ${whereClause}
                ORDER BY regional_vivo, cluster, bd
            `;

            const [rows] = await connection.execute(query, params);

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
        const camposValidos = ['regional_vivo', 'kpi', 'procedencia'];
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

// Rota para obter a data da última atualização da base
router.get('/ultima-atualizacao', b2bAuth, async (req, res) => {
    try {
        const connection = await db.mysqlPool.getConnection();
        try {
            // Consultar a data da última atualização (pode ser a data do último registro ou a data de modificação mais recente)
            const query = `
                SELECT MAX(updated_at) as ultima_atualizacao
                FROM reparosb2b
            `;
            
            const [rows] = await connection.execute(query);
            
            if (rows.length > 0 && rows[0].ultima_atualizacao) {
                res.json({
                    ultima_atualizacao: rows[0].ultima_atualizacao
                });
            } else {
                // Se não encontrar registros, retornar a data atual
                res.json({
                    ultima_atualizacao: new Date()
                });
            }
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao obter a última atualização:', error);
        res.status(500).json({ error: 'Erro ao obter a última atualização' });
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

// Rota para download do modelo de upload
router.get('/modelo-upload', b2bAuth, (req, res) => {
    try {
        // Criar um modelo de planilha com os cabeçalhos corretos
        const fs = require('fs');
        const path = require('path');
        const XLSX = require('xlsx');
        
        // Dados de exemplo com todos os cabeçalhos (NOVA ESTRUTURA - API 2026-02-27)
        const headers = [
            'bd', 'bd_raiz', 'protocolo_crm', 'id_vantive', 'status_nome', 'tipo_ngem',
            'procedencia', 'reclamacao', 'segmento_sistema', 'segmento_comercial', 'segmento_novo', 'segmento_v3',
            'atendimento_valor', 'slm_flag', 'cliente_nome', 'cnpj', 'cnpj_raiz', 'cod_grupo', 'grupo_economico',
            'localidade_codigo', 'area_codigo', 'escritorio_codigo', 'endereco', 'cidade', 'uf', 'cluster',
            'regional', 'regional_vivo', 'lp_15', 'designador_lp_13', 'lp_operadora', 'servico_cpcc_nome',
            'cpcc', 'velocidade', 'velocidade_kbps', 'produto_nome', 'servico', 'familia_produto',
            'data_abertura', 'data_abertura_dia_semana', 'data_abertura_dia', 'data_abertura_mes', 'data_abertura_ano', 'mes_ano_abertura',
            'data_reparo', 'data_reparo_dia_semana', 'data_reparo_dia', 'data_reparo_mes', 'data_reparo_ano',
            'data_encerramento', 'data_encerramento_dia_semana', 'data_encerramento_dia', 'data_encerramento_mes', 'data_encerramento_ano', 'mes_ano_enc',
            'data_baixa', 'data_baixa_dia_semana', 'data_baixa_dia', 'data_baixa_mes', 'data_baixa_ano',
            'last_update',
            'baixa_n1_codigo', 'baixa_n1_nome', 'baixa_n2_codigo', 'baixa_n2_nome',
            'baixa_n3_codigo', 'baixa_n3_nome', 'baixa_n4_codigo', 'baixa_n4_nome',
            'baixa_n5_codigo', 'baixa_n5_nome', 'baixa_codigo',
            'resumo_intragov', 'intragov_sigla', 'intragov_codigo',
            'acionamento_tecnico', 'acionamento_operadora', 'acionamento_integradora',
            'acionamento_parceiro', 'acionamento_transmissao', 'acionamento_ccr',
            'acionamento_osp', 'acionamento_diag_b2b',
            'sla_horas', 'sla_tipo',
            'grupo', 'grupo_novo', 'foco_acoes', 'foco_novo',
            'grupo_abertura', 'usuario_abertura', 'grupo_baixa', 'usuario_baixa', 'grupo_responsavel',
            'operadora', 'tipo_operadora', 'massiva_flag',
            'tmr', 'prazo', 'tempo_parada',
            'reincidencia_30d', 'reincidencia_30d_grupo', 'reincidencia_tipo',
            'originou_reinc', 'reincidencia_30d_atacado', 'reincidencia_tipo_atacado',
            'reincidencia_30d_acesso', 'reincidencia_tipo_acesso',
            'prox_reinc', 'originou_reinc_grupo', 'prox_reinc_grupo',
            'maior_doze_flag', 'tipo_empresa',
            'kpi', 'kpi_acesso', 'origem', 'sistema_origem', 'id_projeto', 'projeto', 'top_atacado', 'tj',
            'tmr_sem_parada', 'triagem_flag', 'planta_flag', 'tipo_acesso',
            'contato_nome', 'reclamante_nome', 'reclamante_telefone', 'contato_telefone', 'flag_intragov',
            'R30_Tratativas', 'tmr_exp_reparo_min', 'tmr_exp_min',
            'id_circuito', 'bd_ant', 'status_codigo', 'id_comercial'
        ];
        
        // Criar uma planilha com apenas o cabeçalho
        const worksheetData = [headers];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
        
        // Caminho temporário para o arquivo
        const filePath = path.join(__dirname, '../uploads/modelo_upload.xlsx');
        
        // Garantir que o diretório existe
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Escrever o arquivo
        XLSX.writeFile(workbook, filePath);
        
        // Enviar o arquivo para download
        res.download(filePath, 'modelo_upload.xlsx', (err) => {
            if (err) {
                console.error('Erro ao enviar arquivo de modelo:', err);
            }
            // Remover o arquivo após o download
            setTimeout(() => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }, 1000);
        });
    } catch (error) {
        console.error('Erro ao gerar modelo de upload:', error);
        res.status(500).json({ error: 'Erro ao gerar modelo de upload' });
    }
});

// Função auxiliar para converter datas do formato DD-MM-YYYY HH:MM:SS para o formato YYYY-MM-DD HH:MM:SS que o MySQL aceita
function convertDateTime(value) {
    if (value === null || value === undefined || value === '') return null;

    // Verificar se o valor é um número (pode ser um timestamp do Excel)
    if (typeof value === 'number') {
        // Converter número (timestamp Excel) para data
        const date = new Date((value - 25569) * 86400 * 1000);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        // Converter para o formato YYYY-MM-DD HH:MM:SS que o MySQL aceita
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // Converter para string e verificar formato
    const dateString = String(value).trim();

    // Verificar se está no formato DD-MM-YYYY HH:MM:SS ou DD/MM/YYYY HH:MM:SS (formato do Excel)
    const dateRegex = /^(\d{2})[-\/](\d{2})[-\/](\d{4})\s+(\d{2}:\d{2}:\d{2})$/;
    const match = dateString.match(dateRegex);

    if (match) {
        // Converter para formato YYYY-MM-DD HH:MM:SS que o MySQL aceita
        const [, day, month, year, time] = match;
        return `${year}-${month}-${day} ${time}`;
    }

    // Verificar se está no formato DD-MM-YYYY ou DD/MM/YYYY (sem hora)
    const dateOnlyRegex = /^(\d{2})[-\/](\d{2})[-\/](\d{4})$/;
    const dateOnlyMatch = dateString.match(dateOnlyRegex);

    if (dateOnlyMatch) {
        // Converter para formato YYYY-MM-DD HH:MM:SS que o MySQL aceita
        const [, day, month, year] = dateOnlyMatch;
        return `${year}-${month}-${day} 00:00:00`;
    }

    // Verificar se já está no formato YYYY-MM-DD HH:MM:SS (formato ISO que o MySQL aceita)
    const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2})$/;
    const isoMatch = dateString.match(isoDateRegex);

    if (isoMatch) {
        // Já está no formato que o MySQL aceita
        return dateString;
    }

    // Se não for um formato reconhecido, retornar como string
    return dateString;
}

// Função auxiliar para padronizar valores
function formatValue(value, isDateColumn = false) {
    if (value === null || value === undefined || value === '') return null;

    if (isDateColumn) {
        return convertDateTime(value);
    }

    // Converter qualquer valor para string, removendo espaços extras
    return String(value).trim();
}

// Função para corrigir/normalizar o cluster com base na cidade e UF
function corrigirCluster(cidade, uf) {
    if (!cidade) return 'OUTRO';

    // Cidades específicas para Brasília
    const cidadesBrasilia = ['FORMOSA', 'CIDADE OCIDENTAL', 'VALPARAISO', 'PLANALTINA', 'LUZIANIA', 'LUZIÂNIA'];
    if (cidadesBrasilia.includes(cidade.toUpperCase())) {
        return 'BRASILIA';
    }

    // Cidades específicas para Anápolis
    const cidadesAnapolis = ['ANAPOLIS', 'ANÁPOLIS', 'JARAGUA', 'JARAGUÁ'];
    if (cidadesAnapolis.includes(cidade.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
        return 'ANAPOLIS';
    }

    // Por estado
    if (!uf) return 'OUTRO';

    const ufUpper = uf.toUpperCase();

    if (ufUpper === 'PA') return 'BELEM';
    if (['AP', 'AM', 'RR'].includes(ufUpper)) return 'MANAUS';
    if (['AC', 'MS', 'RO'].includes(ufUpper)) return 'CAMPO GRANDE';
    if (ufUpper === 'MT') return 'CUIABA';
    if (ufUpper === 'GO') return 'GOIANIA';
    if (ufUpper === 'TO') return 'PALMAS';
    if (ufUpper === 'DF') return 'BRASILIA';
    if (ufUpper === 'MA') return 'SAO LUIS';

    return 'OUTRO';
}

module.exports = router;