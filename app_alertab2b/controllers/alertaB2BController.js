const axios = require('axios');
const https = require('https');
const { parse } = require('csv-parse');
const db = require('../../db/db');

/**
 * Controller principal do Alerta B2B
 * Responsável por gerenciar os dados do Backlog BDSLA
 */

// Configurações
const CONFIG = {
    CSV_URL: process.env.ALERTA_B2B_CSV_URL || 'https://brtdtlts0002fu.redecorp.br/bdsla/index/excel',
    IGNORE_SSL: process.env.ALERTA_B2B_IGNORE_SSL === 'true'
};

// Mapeamento de colunas do CSV para o banco de dados
const MAPEAMENTO_COLUNAS = {
    'bd': 'bd',
    'grupo': 'grupo',
    'procedencia': 'procedencia',
    'tipo_servico': 'tipo_servico',
    'data_criacao': 'data_criacao',
    'nome_usuario': 'nome_usuario',
    'cnpj': 'cnpj',
    'nome_cliente': 'nome_cliente',
    'segmento_cliente': 'segmento_cliente',
    'reclamacao': 'reclamacao',
    'lp': 'lp',
    'id_vantive': 'id_vantive',
    'servico_nome': 'servico_nome',
    'regional': 'regional',
    'municipio': 'municipio',
    'uf': 'uf',
    'raiz': 'raiz',
    'status': 'status',
    'sla': 'sla',
    'tipo': 'tipo',
    'prazo': 'prazo',
    'urgencia_codigo': 'urgencia_codigo',
    'urgencia': 'urgencia',
    'origem': 'origem',
    'tipo_abertura': 'tipo_abertura',
    'status_circuito': 'status_circuito',
    'fonte_status': 'fonte_status',
    'indice': 'indice',
    'last_update': 'last_update',
    'flag_covid19': 'flag_covid19',
    'operadora': 'operadora',
    'segmento_sf': 'segmento_sf',
    'id_projeto': 'id_projeto',
    'flag_prioridade': 'flag_prioridade',
    'reincidencia': 'reincidencia',
    'contato_cliente': 'contato_cliente',
    'atuacao_gi': 'atuacao_gi',
    'area_escalonada': 'area_escalonada',
    'nivel_escalonamento': 'nivel_escalonamento',
    'vivo_gi': 'vivo_gi',
    'cluster': 'cluster',
    'segmento_v3': 'segmento_v3'
};

/**
 * Faz o download do CSV da URL
 */
async function baixarCSV(url) {
    try {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: !CONFIG.IGNORE_SSL
        });

        const response = await axios.get(url, {
            httpsAgent,
            responseType: 'text',
            timeout: 60000 // 60 segundos
        });

        return response.data;
    } catch (error) {
        throw new Error(`Erro ao baixar CSV: ${error.message}`);
    }
}

/**
 * Parse do CSV para array de objetos
 */
async function parseCSV(csvContent) {
    return new Promise((resolve, reject) => {
        const registros = [];
        
        const parser = parse(csvContent, {
            delimiter: ';',
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        parser.on('readable', function() {
            let record;
            while ((record = parser.read()) !== null) {
                registros.push(record);
            }
        });

        parser.on('error', function(err) {
            reject(err);
        });

        parser.on('end', function() {
            resolve(registros);
        });
    });
}

/**
 * Formatar data para o formato do MySQL
 */
function formatarData(data) {
    if (!data || data === '') return null;
    
    // Se já estiver no formato YYYY-MM-DD HH:MM:SS
    if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
        return data.substring(0, 19);
    }
    
    // Se estiver no formato DD/MM/YYYY HH:MM:SS
    const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
    if (match) {
        const [, dia, mes, ano, hora] = match;
        return `${ano}-${mes}-${dia} ${hora}`;
    }
    
    // Se estiver apenas DD/MM/YYYY
    const matchDate = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (matchDate) {
        const [, dia, mes, ano] = matchDate;
        return `${ano}-${mes}-${dia} 00:00:00`;
    }
    
    return data;
}

/**
 * Salvar log de sincronização
 */
async function salvarLogSincronizacao(params) {
    try {
        const {
            fonte_url,
            filtro_uf,
            total_registros,
            registros_inseridos,
            registros_filtrados,
            registros_atualizados,
            registros_erro,
            status_sync,
            duracao_segundos,
            mensagem,
            erro_detalhe
        } = params;

        const connection = await db.mysqlPool.getConnection();

        try {
            const query = `
                INSERT INTO logs_sync_alertab2b (
                    data_sync, fonte_url, filtro_uf,
                    total_registros, registros_inseridos, registros_filtrados, registros_atualizados, registros_erro,
                    status_sync, duracao_segundos, mensagem, erro_detalhe
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                new Date(),
                fonte_url || CONFIG.CSV_URL,
                filtro_uf || 'CO-NORTE',
                total_registros || 0,
                registros_inseridos || 0,
                registros_filtrados || 0,
                registros_atualizados || 0,
                registros_erro || 0,
                status_sync || 'sucesso',
                duracao_segundos || null,
                mensagem || null,
                erro_detalhe || null
            ];

            await connection.execute(query, values);
            console.log('   📝 Log de sincronização salvo com sucesso!');
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('   ⚠️  Erro ao salvar log de sincronização:', error.message);
    }
}

/**
 * Processar e salvar dados do CSV no banco
 * Faz TRUNCATE antes de inserir para garantir dados sempre atualizados
 * FILTRO: Salva apenas UF's do Centro-Oeste e Norte
 */
async function processarCSV(registros) {
    const connection = await db.mysqlPool.getConnection();

    try {
        let inseridos = 0;
        let erros = 0;
        let filtrados = 0;

        // UF's do Centro-Oeste e Norte
        const UFS_PERMITIDAS = [
            // Centro-Oeste
            'GO', 'MATO GROSSO', 'MT', 'MATO GROSSO DO SUL', 'MS', 'DISTRITO FEDERAL', 'DF',
            // Norte
            'AC', 'AMAPA', 'AP', 'AMAZONAS', 'AM', 'PARA', 'PA', 'RONDONIA', 'RO', 'RORAIMA', 'RR', 'TOCANTINS', 'TO'
        ];

        console.log(`   📊 Total de registros para processar: ${registros.length}`);

        // 🔥 TRUNCATE na tabela antes de inserir novos dados
        console.log('   🗑️  Limpando tabela antes de inserir novos dados...');
        await connection.execute('TRUNCATE TABLE backlog_b2b');
        console.log('   ✅ Tabela limpa com sucesso!');

        // Preparar INSERT em lote para melhor performance
        console.log('   📝 Inserindo novos registros (Filtro: Centro-Oeste e Norte)...');

        for (let i = 0; i < registros.length; i++) {
            const item = registros[i];

            try {
                const bd = item.bd;
                const uf = item.uf ? item.uf.toUpperCase().trim() : '';

                // Filtrar apenas UF's do Centro-Oeste e Norte
                if (!UFS_PERMITIDAS.includes(uf)) {
                    filtrados++;
                    continue;
                }

                if (!bd) {
                    console.warn(`   ⚠️  Registro ${i + 1}: Sem BD, ignorado`);
                    erros++;
                    continue;
                }

                // Mapear campos do CSV para o banco
                const dadosMapeados = {};
                for (const [csvCampo, dbCampo] of Object.entries(MAPEAMENTO_COLUNAS)) {
                    if (item[csvCampo] !== undefined && item[csvCampo] !== '') {
                        let valor = item[csvCampo];

                        // Formatar campos de data
                        if (dbCampo.startsWith('data_') || dbCampo === 'last_update') {
                            valor = formatarData(valor);
                        }

                        // Converter numéricos
                        if (['sla', 'prazo'].includes(dbCampo)) {
                            valor = parseFloat(valor.replace(',', '.')) || null;
                        }
                        if (['tipo', 'urgencia_codigo', 'indice', 'reincidencia'].includes(dbCampo)) {
                            valor = parseInt(valor) || 0;
                        }

                        dadosMapeados[dbCampo] = valor;
                    }
                }

                // Preparar INSERT simples (sem update, pois tabela foi truncada)
                const colunas = Object.keys(dadosMapeados);
                const valores = Object.values(dadosMapeados);
                const placeholders = colunas.map(() => '?').join(', ');

                const insertQuery = `
                    INSERT INTO backlog_b2b (${colunas.join(', ')})
                    VALUES (${placeholders})
                `;

                await connection.execute(insertQuery, valores);
                inseridos++;

                if ((i + 1) % 100 === 0) {
                    console.log(`   📊 Progresso: ${i + 1}/${registros.length} processados...`);
                }

            } catch (error) {
                console.error(`   ❌ Erro ao processar registro ${item.bd || i + 1}: ${error.message}`);
                erros++;
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ SINCRONIZAÇÃO CONCLUÍDA!');
        console.log('='.repeat(70));
        console.log(`📊 RESULTADOS:`);
        console.log(`   ✅ Inseridos: ${inseridos}`);
        console.log(`   🚫 Filtrados (não CO/Norte): ${filtrados}`);
        console.log(`   ❌ Erros: ${erros}`);
        console.log(`   📦 Total processado: ${registros.length}`);
        if (registros.length > 0) {
            console.log(`   📊 Taxa de sucesso: ${((inseridos) / registros.length * 100).toFixed(1)}%`);
        }
        console.log('='.repeat(70) + '\n');

        return {
            success: true,
            inseridos,
            filtrados,
            erros,
            total: registros.length
        };

    } catch (error) {
        console.error('❌ Erro ao processar CSV:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Executar sincronização completa
 */
async function executarSincronizacao(fonte = 'url') {
    const dataInicio = new Date();

    console.log('\n' + '='.repeat(70));
    console.log('🔄 INICIANDO SINCRONIZAÇÃO ALERTA B2B');
    console.log('='.repeat(70));
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`📡 Fonte: ${fonte === 'arquivo' ? 'Arquivo local' : CONFIG.CSV_URL}`);
    console.log('='.repeat(70));

    try {
        let csvContent;

        // 1. Baixar ou ler CSV
        console.log('\n📥 [1/3] Obtendo arquivo CSV...');
        if (fonte === 'arquivo') {
            const fs = require('fs');
            const path = require('path');
            const caminhoArquivo = path.join(__dirname, '..', 'BacklogBDSLA.csv');
            csvContent = fs.readFileSync(caminhoArquivo, 'utf-8');
            console.log('   ✅ Arquivo local lido com sucesso!');
        } else {
            csvContent = await baixarCSV(CONFIG.CSV_URL);
            console.log('   ✅ CSV baixado com sucesso!');
        }

        // 2. Parse do CSV
        console.log('\n📋 [2/3] Processando CSV...');
        const registros = await parseCSV(csvContent);
        console.log(`   ✅ ${registros.length} registros encontrados!`);

        if (registros.length === 0) {
            console.log('\n⚠️  Nenhum dado encontrado no CSV.');
            console.log('='.repeat(70) + '\n');
            
            await salvarLogSincronizacao({
                fonte_url: fonte === 'arquivo' ? 'arquivo_local' : CONFIG.CSV_URL,
                total_registros: 0,
                registros_inseridos: 0,
                registros_atualizados: 0,
                registros_erro: 0,
                status_sync: 'sucesso',
                duracao_segundos: 0,
                mensagem: 'Nenhum dado encontrado no CSV'
            });
            
            return { success: true, inseridos: 0, atualizados: 0, total: 0 };
        }

        // 3. Salvar no banco
        console.log('\n💾 [3/3] Salvando no banco de dados...');
        const resultado = await processarCSV(registros);

        // Calcular duração e salvar log
        const dataFim = new Date();
        const duracao = ((dataFim - dataInicio) / 1000).toFixed(2);
        const status_sync = resultado.erros === 0 ? 'sucesso' : (resultado.inseridos > 0 ? 'parcial' : 'erro');
        const mensagem = `Sincronização concluída! ${resultado.inseridos} registros inseridos (CO/Norte), ${resultado.filtrados || 0} filtrados, ${resultado.erros} erros.`;

        await salvarLogSincronizacao({
            fonte_url: fonte === 'arquivo' ? 'arquivo_local' : CONFIG.CSV_URL,
            total_registros: resultado.total,
            registros_inseridos: resultado.inseridos,
            registros_filtrados: resultado.filtrados || 0,
            registros_atualizados: resultado.atualizados,
            registros_erro: resultado.erros,
            status_sync,
            duracao_segundos: parseFloat(duracao),
            mensagem
        });

        return resultado;

    } catch (error) {
        console.error('\n' + '='.repeat(70));
        console.error('❌ ERRO NA SINCRONIZAÇÃO');
        console.error('='.repeat(70));
        console.error(`   Mensagem: ${error.message}`);
        console.error('='.repeat(70) + '\n');

        const dataFim = new Date();
        const duracao = ((dataFim - dataInicio) / 1000).toFixed(2);

        await salvarLogSincronizacao({
            fonte_url: fonte === 'arquivo' ? 'arquivo_local' : CONFIG.CSV_URL,
            total_registros: 0,
            registros_inseridos: 0,
            registros_atualizados: 0,
            registros_erro: 0,
            status_sync: 'erro',
            duracao_segundos: parseFloat(duracao),
            mensagem: 'Erro na sincronização',
            erro_detalhe: error.message
        });

        return { success: false, error: error.message };
    }
}

/**
 * Buscar dados do backlog com filtros
 */
async function buscarBacklog(filtros = {}) {
    try {
        const {
            pagina = 1,
            limite = 50,
            bd,
            cnpj,
            regional,
            status,
            grupo,
            cliente,
            dataInicio,
            dataFim
        } = filtros;

        const offset = (pagina - 1) * limite;

        let query = 'SELECT * FROM backlog_b2b WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM backlog_b2b WHERE 1=1';
        const params = [];

        if (bd) {
            query += ' AND bd LIKE ?';
            countQuery += ' AND bd LIKE ?';
            params.push(`%${bd}%`);
        }

        if (cnpj) {
            query += ' AND cnpj LIKE ?';
            countQuery += ' AND cnpj LIKE ?';
            params.push(`%${cnpj}%`);
        }

        if (regional) {
            query += ' AND regional = ?';
            countQuery += ' AND regional = ?';
            params.push(regional);
        }

        if (status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
        }

        if (grupo) {
            query += ' AND grupo LIKE ?';
            countQuery += ' AND grupo LIKE ?';
            params.push(`%${grupo}%`);
        }

        if (cliente) {
            query += ' AND nome_cliente LIKE ?';
            countQuery += ' AND nome_cliente LIKE ?';
            params.push(`%${cliente}%`);
        }

        if (dataInicio) {
            query += ' AND data_criacao >= ?';
            countQuery += ' AND data_criacao >= ?';
            params.push(dataInicio);
        }

        if (dataFim) {
            query += ' AND data_criacao <= ?';
            countQuery += ' AND data_criacao <= ?';
            params.push(dataFim);
        }

        query += ' ORDER BY last_update DESC LIMIT ? OFFSET ?';
        params.push(limite, offset);

        const connection = await db.mysqlPool.getConnection();
        
        try {
            const [registros] = await connection.execute(query, params);
            const [countResult] = await connection.execute(countQuery, params.slice(0, -2));

            return {
                success: true,
                dados: registros,
                total: countResult[0].total,
                pagina,
                limite,
                totalPaginas: Math.ceil(countResult[0].total / limite)
            };
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erro ao buscar backlog:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar estatísticas do backlog
 * Suporta filtros para atualizar os cards dinamicamente
 */
async function buscarEstatisticas(filtros = {}) {
    try {
        const {
            bd,
            cliente,
            regional,
            status,
            grupo,
            dataInicio,
            dataFim
        } = filtros;

        const connection = await db.mysqlPool.getConnection();

        try {
            // Construir query com filtros
            let whereClause = 'WHERE 1=1';
            const params = [];

            if (bd) {
                whereClause += ' AND bd LIKE ?';
                params.push(`%${bd}%`);
            }

            if (cliente) {
                whereClause += ' AND nome_cliente LIKE ?';
                params.push(`%${cliente}%`);
            }

            if (regional) {
                whereClause += ' AND regional = ?';
                params.push(regional);
            }

            if (status) {
                whereClause += ' AND status = ?';
                params.push(status);
            }

            if (grupo) {
                whereClause += ' AND grupo LIKE ?';
                params.push(`%${grupo}%`);
            }

            if (dataInicio) {
                whereClause += ' AND data_criacao >= ?';
                params.push(dataInicio);
            }

            if (dataFim) {
                whereClause += ' AND data_criacao <= ?';
                params.push(dataFim);
            }

            const query = `
                SELECT
                    COUNT(*) as total_registros,
                    COUNT(DISTINCT regional) as total_regionais,
                    COUNT(DISTINCT cnpj) as total_clientes,
                    SUM(CASE WHEN status = 'Ativo' THEN 1 ELSE 0 END) as ativos,
                    SUM(CASE WHEN status = 'Parado' THEN 1 ELSE 0 END) as parados,
                    AVG(prazo) as prazo_medio,
                    AVG(sla) as sla_medio
                FROM backlog_b2b
                ${whereClause}
            `;

            const [resultado] = await connection.execute(query, params);

            const queryRegionais = `
                SELECT regional, COUNT(*) as quantidade
                FROM backlog_b2b
                ${whereClause}
                GROUP BY regional
                ORDER BY quantidade DESC
            `;

            const [regionais] = await connection.execute(queryRegionais, params);

            const queryStatus = `
                SELECT status, COUNT(*) as quantidade
                FROM backlog_b2b
                ${whereClause}
                GROUP BY status
                ORDER BY quantidade DESC
            `;

            const [status] = await connection.execute(queryStatus, params);

            return {
                success: true,
                dados: {
                    geral: resultado[0],
                    regionais,
                    status
                }
            };
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    executarSincronizacao,
    buscarBacklog,
    buscarEstatisticas,
    baixarCSV,
    parseCSV
};
