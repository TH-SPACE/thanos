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
    'cluster': 'cluster',  // Se vier do CSV, usa. Senão, calcula
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

    // Converter Date para string se necessário
    let dataStr = data;
    if (data instanceof Date) {
        dataStr = data.toISOString().slice(0, 19).replace('T', ' ');
    } else if (typeof data !== 'string') {
        dataStr = String(data);
    }

    // Se já estiver no formato YYYY-MM-DD HH:MM:SS
    if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
        return dataStr.substring(0, 19);
    }

    // Se estiver no formato DD/MM/YYYY HH:MM:SS
    const match = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
    if (match) {
        const [, dia, mes, ano, hora] = match;
        return `${ano}-${mes}-${dia} ${hora}`;
    }

    // Se estiver apenas DD/MM/YYYY
    const matchDate = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (matchDate) {
        const [, dia, mes, ano] = matchDate;
        return `${ano}-${mes}-${dia} 00:00:00`;
    }

    return dataStr;
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
 * Corrigir regional com base na UF
 * Norte e Nordeste → NORTE
 * Centro-Oeste → CENTRO-OESTE
 * Sudeste → SUDESTE
 * Sul → SUL
 */
function corrigirRegional(uf) {
    if (!uf) return 'OUTRO';
    
    const ufUpper = uf.toUpperCase().trim();
    
    // Norte
    const norte = ['AP', 'AM', 'PA', 'RR', 'MA'];
    if (norte.includes(ufUpper)) return 'NORTE';
    
    // Nordeste
    const nordeste = ['PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'];
    if (nordeste.includes(ufUpper)) return 'NORDESTE';
    
    // Centro-Oeste
    const centroOeste = ['GO', 'MT', 'MS', 'DF', 'TO', 'RO', 'AC'];
    if (centroOeste.includes(ufUpper)) return 'CENTRO-OESTE';
    
    // Sudeste
    const sudeste = ['SP', 'RJ', 'MG', 'ES'];
    if (sudeste.includes(ufUpper)) return 'SUDESTE';
    
    // Sul
    const sul = ['PR', 'SC', 'RS'];
    if (sul.includes(ufUpper)) return 'SUL';
    
    return 'OUTRO';
}

/**
 * Corrigir cluster com base na cidade e UF
 * Similar ao app_b2b
 */
function corrigirCluster(cidade, uf) {
    if (!cidade) return 'OUTRO';
    
    const cidadeUpper = cidade.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const ufUpper = uf ? uf.toUpperCase().trim() : '';
    
    // Cidades de Brasília (DF e entorno)
    const cidadesBrasilia = ['FORMOSA', 'CIDADE OCIDENTAL', 'VALPARAISO', 'VALPARAISO DE GOIAS', 'PLANALTINA', 'LUZIANIA', 'LUZIÂNIA', 'TAGUATINGA', 'GUARA', 'RIACHO FUNDO', 'SAMAMBAIA', 'STA MARIA'];
    if (cidadesBrasilia.includes(cidadeUpper) || ufUpper === 'DF') {
        return 'BRASILIA';
    }
    
    // Cidades de Anápolis
    const cidadesAnapolis = ['ANAPOLIS', 'ANÁPOLIS', 'JARAGUA', 'JARAGUÁ'];
    if (cidadesAnapolis.includes(cidadeUpper)) {
        return 'ANAPOLIS';
    }
    
    // Norte por UF
    if (ufUpper === 'PA') return 'BELEM';
    if (['AP', 'AM', 'RR'].includes(ufUpper)) return 'MANAUS';
    if (['AC', 'RO'].includes(ufUpper)) return 'PORTO VELHO';
    if (ufUpper === 'TO') return 'PALMAS';
    if (ufUpper === 'MA') return 'SAO LUIS';
    
    // Centro-Oeste
    if (ufUpper === 'MT') return 'CUIABA';
    if (ufUpper === 'MS') return 'CAMPO GRANDE';
    if (ufUpper === 'GO') return 'GOIANIA';
    
    return 'OUTRO';
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
                const cidade = item.municipio || item.cidade || '';

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

                        // Corrigir regional automaticamente baseado na UF
                        if (dbCampo === 'regional') {
                            valor = corrigirRegional(uf);
                        }

                        // Corrigir cluster automaticamente (sempre calcula)
                        if (dbCampo === 'cluster') {
                            valor = corrigirCluster(cidade, uf);
                        }

                        dadosMapeados[dbCampo] = valor;
                    } else if (dbCampo === 'cluster') {
                        // Se não veio cluster do CSV, calcula mesmo assim
                        dadosMapeados[dbCampo] = corrigirCluster(cidade, uf);
                    } else if (dbCampo === 'regional') {
                        // Se não veio regional do CSV, calcula baseado na UF
                        dadosMapeados[dbCampo] = corrigirRegional(uf);
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
            cluster,
            procedencia,
            dataInicio,
            dataFim
        } = filtros;

        console.log('🔍 Filtros recebidos:', filtros);
        console.log('📍 Cluster:', cluster);

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

        if (cluster) {
            query += ' AND cluster = ?';
            countQuery += ' AND cluster = ?';
            params.push(cluster);
            console.log('✅ Adicionado filtro cluster:', cluster);
        } else {
            console.log('⚠️ Cluster não informado');
        }

        // Procedência pode vir múltipla (separada por vírgula)
        if (procedencia) {
            const procedenciasArray = procedencia.split(',');
            if (procedenciasArray.length === 1) {
                query += ' AND procedencia = ?';
                countQuery += ' AND procedencia = ?';
                params.push(procedencia);
            } else {
                const placeholders = procedenciasArray.map(() => '?').join(', ');
                query += ` AND procedencia IN (${placeholders})`;
                countQuery += ` AND procedencia IN (${placeholders})`;
                params.push(...procedenciasArray);
            }
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

        console.log('📝 Query:', query);
        console.log('📦 Params:', params);

        const connection = await db.mysqlPool.getConnection();

        try {
            const [registros] = await connection.execute(query, params);
            const [countResult] = await connection.execute(countQuery, params.slice(0, -2));

            console.log('✅ Registros encontrados:', registros.length);

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
            cluster,
            procedencia,
            dataInicio,
            dataFim
        } = filtros;

        console.log('🔍 buscarEstatisticas - Filtros recebidos:', filtros);
        console.log('📍 procedencia:', procedencia);

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

            if (cluster) {
                whereClause += ' AND cluster = ?';
                params.push(cluster);
            }

            // Procedência pode vir múltipla (separada por vírgula)
            if (procedencia) {
                const procedenciasArray = procedencia.split(',');
                console.log('📍 procedenciaArray:', procedenciasArray);
                if (procedenciasArray.length === 1) {
                    whereClause += ' AND procedencia = ?';
                    params.push(procedencia);
                } else {
                    const placeholders = procedenciasArray.map(() => '?').join(', ');
                    whereClause += ` AND procedencia IN (${placeholders})`;
                    params.push(...procedenciasArray);
                }
            }

            if (dataInicio) {
                whereClause += ' AND data_criacao >= ?';
                params.push(dataInicio);
            }

            if (dataFim) {
                whereClause += ' AND data_criacao <= ?';
                params.push(dataFim);
            }

            console.log('📝 whereClause:', whereClause);
            console.log('📦 params:', params);

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

            const [resultado] = await connection.execute(query, params.length > 0 ? params : []);

            // Tratar valores nulos
            const dadosTratados = {
                total_registros: resultado[0].total_registros || 0,
                total_regionais: resultado[0].total_regionais || 0,
                total_clientes: resultado[0].total_clientes || 0,
                ativos: resultado[0].ativos || 0,
                parados: resultado[0].parados || 0,
                prazo_medio: resultado[0].prazo_medio || 0,
                sla_medio: resultado[0].sla_medio || 0
            };

            const queryRegionais = `
                SELECT regional, COUNT(*) as quantidade
                FROM backlog_b2b
                ${whereClause}
                GROUP BY regional
                ORDER BY quantidade DESC
            `;

            const [regionais] = await connection.execute(queryRegionais, params.length > 0 ? params : []);

            const queryStatus = `
                SELECT status, COUNT(*) as quantidade
                FROM backlog_b2b
                ${whereClause}
                GROUP BY status
                ORDER BY quantidade DESC
            `;

            const [statusResult] = await connection.execute(queryStatus, params.length > 0 ? params : []);

            return {
                success: true,
                dados: {
                    geral: dadosTratados,
                    regionais,
                    status: statusResult
                }
            };
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error.message);
        console.error('Stack:', error.stack);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar dashboard por cluster com tempo de backlog
 * Mostra tempo em horas e dias no backlog
 */
async function buscarDashboardCluster() {
    try {
        const connection = await db.mysqlPool.getConnection();

        try {
            // Dashboard por cluster com contagem de tempo
            const queryDashboard = `
                SELECT 
                    cluster,
                    COUNT(*) as total_registros,
                    SUM(CASE WHEN status = 'Ativo' THEN 1 ELSE 0 END) as ativos,
                    SUM(CASE WHEN status = 'Parado' THEN 1 ELSE 0 END) as parados,
                    
                    -- Tempo em HORAS no backlog (para registros recentes)
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(HOUR, data_criacao, NOW()) <= 1 THEN 1 
                        ELSE 0 
                    END) as menos_1_hora,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(HOUR, data_criacao, NOW()) > 1 
                         AND TIMESTAMPDIFF(HOUR, data_criacao, NOW()) <= 3 THEN 1 
                        ELSE 0 
                    END) as entre_1_3_horas,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(HOUR, data_criacao, NOW()) > 3 
                         AND TIMESTAMPDIFF(HOUR, data_criacao, NOW()) <= 6 THEN 1 
                        ELSE 0 
                    END) as entre_3_6_horas,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(HOUR, data_criacao, NOW()) > 6 
                         AND TIMESTAMPDIFF(HOUR, data_criacao, NOW()) <= 8 THEN 1 
                        ELSE 0 
                    END) as entre_6_8_horas,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(HOUR, data_criacao, NOW()) > 8 
                         AND TIMESTAMPDIFF(HOUR, data_criacao, NOW()) <= 24 THEN 1 
                        ELSE 0 
                    END) as entre_8_24_horas,
                    
                    -- Tempo em DIAS no backlog (para registros mais antigos)
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(DAY, data_criacao, NOW()) >= 1 
                         AND TIMESTAMPDIFF(DAY, data_criacao, NOW()) < 3 THEN 1 
                        ELSE 0 
                    END) as entre_1_3_dias,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(DAY, data_criacao, NOW()) >= 3 
                         AND TIMESTAMPDIFF(DAY, data_criacao, NOW()) < 5 THEN 1 
                        ELSE 0 
                    END) as entre_3_5_dias,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(DAY, data_criacao, NOW()) >= 5 
                         AND TIMESTAMPDIFF(DAY, data_criacao, NOW()) < 7 THEN 1 
                        ELSE 0 
                    END) as entre_5_7_dias,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(DAY, data_criacao, NOW()) >= 7 
                         AND TIMESTAMPDIFF(DAY, data_criacao, NOW()) < 15 THEN 1 
                        ELSE 0 
                    END) as entre_7_15_dias,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(DAY, data_criacao, NOW()) >= 15 
                         AND TIMESTAMPDIFF(DAY, data_criacao, NOW()) < 30 THEN 1 
                        ELSE 0 
                    END) as entre_15_30_dias,
                    
                    SUM(CASE 
                        WHEN TIMESTAMPDIFF(DAY, data_criacao, NOW()) >= 30 THEN 1 
                        ELSE 0 
                    END) as mais_30_dias,
                    
                    -- Tempo médio em horas
                    AVG(TIMESTAMPDIFF(HOUR, data_criacao, NOW())) as tempo_medio_horas
                    
                FROM backlog_b2b
                GROUP BY cluster
                ORDER BY total_registros DESC
            `;

            const [dashboard] = await connection.execute(queryDashboard);

            // Total geral
            const queryTotal = `
                SELECT 
                    COUNT(*) as total_geral,
                    AVG(TIMESTAMPDIFF(HOUR, data_criacao, NOW())) as media_geral_horas
                FROM backlog_b2b
            `;

            const [total] = await connection.execute(queryTotal);

            return {
                success: true,
                dados: {
                    clusters: dashboard,
                    total: total[0]
                }
            };
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erro ao buscar dashboard cluster:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar logs de sincronização
 */
async function buscarLogsSincronizacao(limite = 20) {
    try {
        const connection = await db.mysqlPool.getConnection();

        try {
            const query = `
                SELECT * FROM logs_sync_alertab2b
                ORDER BY data_sync DESC
                LIMIT ?
            `;

            const [logs] = await connection.execute(query, [limite]);

            return {
                success: true,
                dados: logs
            };
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erro ao buscar logs:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar filtros disponíveis (para preencher dropdowns)
 */
async function buscarFiltrosDisponiveis() {
    try {
        const connection = await db.mysqlPool.getConnection();

        try {
            // Buscar regionais únicas
            const queryRegionais = `
                SELECT DISTINCT regional
                FROM backlog_b2b
                WHERE regional IS NOT NULL AND regional != ''
                ORDER BY regional
            `;

            // Buscar clusters únicos
            const queryClusters = `
                SELECT DISTINCT cluster
                FROM backlog_b2b
                WHERE cluster IS NOT NULL AND cluster != ''
                ORDER BY cluster
            `;

            // Buscar procedências únicas
            const queryProcedencias = `
                SELECT DISTINCT procedencia
                FROM backlog_b2b
                WHERE procedencia IS NOT NULL AND procedencia != ''
                ORDER BY procedencia
            `;

            // Buscar status únicos
            const queryStatus = `
                SELECT DISTINCT status
                FROM backlog_b2b
                WHERE status IS NOT NULL AND status != ''
                ORDER BY status
            `;

            // Buscar grupos únicos
            const queryGrupos = `
                SELECT DISTINCT grupo
                FROM backlog_b2b
                WHERE grupo IS NOT NULL AND grupo != ''
                ORDER BY grupo
            `;

            const [regionais] = await connection.execute(queryRegionais);
            const [clusters] = await connection.execute(queryClusters);
            const [procedencias] = await connection.execute(queryProcedencias);
            const [status] = await connection.execute(queryStatus);
            const [grupos] = await connection.execute(queryGrupos);

            return {
                success: true,
                dados: {
                    regionais: regionais.map(r => r.regional),
                    clusters: clusters.map(c => c.cluster),
                    procedencias: procedencias.map(p => p.procedencia),
                    status: status.map(s => s.status),
                    grupos: grupos.map(g => g.grupo)
                }
            };
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erro ao buscar filtros disponíveis:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar status por cluster
 */
async function buscarStatusPorCluster(filtros = {}) {
    try {
        const {
            regional,
            status,
            cluster,
            procedencia,
            dataInicio,
            dataFim
        } = filtros;

        console.log('🔍 buscarStatusPorCluster - Filtros recebidos:', filtros);
        console.log('📍 procedencia:', procedencia);

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (regional) {
            whereClause += ' AND regional = ?';
            params.push(regional);
        }

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (cluster) {
            whereClause += ' AND cluster = ?';
            params.push(cluster);
        }

        // Procedência pode vir múltipla (separada por vírgula)
        if (procedencia) {
            const procedenciasArray = procedencia.split(',');
            console.log('📍 procedenciaArray:', procedenciasArray);
            if (procedenciasArray.length === 1) {
                whereClause += ' AND procedencia = ?';
                params.push(procedencia);
            } else {
                const placeholders = procedenciasArray.map(() => '?').join(', ');
                whereClause += ` AND procedencia IN (${placeholders})`;
                params.push(...procedenciasArray);
            }
        }

        if (dataInicio) {
            whereClause += ' AND data_criacao >= ?';
            params.push(dataInicio);
        }

        if (dataFim) {
            whereClause += ' AND data_criacao <= ?';
            params.push(dataFim);
        }

        console.log('📝 whereClause:', whereClause);
        console.log('📦 params:', params);

        const connection = await db.mysqlPool.getConnection();

        try {
            const query = `
                SELECT
                    cluster,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Ativo' THEN 1 ELSE 0 END) as ativos,
                    SUM(CASE WHEN status = 'Parado' THEN 1 ELSE 0 END) as parados
                FROM backlog_b2b
                ${whereClause}
                GROUP BY cluster
                ORDER BY total DESC
            `;

            const [resultado] = await connection.execute(query, params);

            return {
                success: true,
                dados: resultado
            };
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erro ao buscar status por cluster:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Baixar CSV/Excel
 */
function baixarCSV(dados, nomeArquivo = 'backlog_b2b') {
    try {
        if (!dados || dados.length === 0) {
            return { success: false, error: 'Nenhum dado para exportar' };
        }

        // Cabeçalhos
        const cabecalhos = [
            'BD',
            'Cliente',
            'Regional',
            'Cluster',
            'Cidade',
            'UF',
            'Status',
            'Grupo',
            'Procedência',
            'SLA',
            'Prazo',
            'Reclamação',
            'Data Criação',
            'Última Atualização'
        ];

        // Linhas
        const linhas = dados.map(item => [
            item.bd || '',
            item.nome_cliente || '',
            item.regional || '',
            item.cluster || '',
            item.municipio || '',
            item.uf || '',
            item.status || '',
            item.grupo || '',
            item.procedencia || '',
            item.sla || '',
            item.prazo || '',
            (item.reclamacao || '').replace(/[\r\n]+/g, ' '),
            formatarData(item.data_criacao),
            formatarData(item.last_update)
        ]);

        // Criar conteúdo CSV
        const conteudo = [
            cabecalhos.join(';'),
            ...linhas.map(linha => linha.map(campo => `"${campo}"`).join(';'))
        ].join('\n');

        return {
            success: true,
            conteudo,
            nomeArquivo: `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`
        };
    } catch (error) {
        console.error('Erro ao gerar CSV:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar reparos críticos (Ativos no dia atual próximo/após 18h)
 */
async function buscarReparosCriticost() {
    try {
        const connection = await db.mysqlPool.getConnection();

        try {
            // Buscar reparos Ativos criados hoje ou nos últimos 2 dias
            const query = `
                SELECT 
                    bd,
                    nome_cliente,
                    regional,
                    cluster,
                    municipio,
                    uf,
                    status,
                    grupo,
                    procedencia,
                    sla,
                    prazo,
                    data_criacao,
                    last_update,
                    HOUR(data_criacao) as hora_criacao,
                    TIMESTAMPDIFF(HOUR, NOW(), data_criacao) as horas_restantes
                FROM backlog_b2b
                WHERE status = 'Ativo'
                AND DATE(data_criacao) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                ORDER BY data_criacao ASC
            `;

            const [reparos] = await connection.execute(query);

            const agora = new Date();
            const horaAtual = agora.getHours();
            const minutosAtuais = agora.getMinutes();
            const tempoAtual = horaAtual + (minutosAtuais / 60);

            // Classificar por criticidade baseado no horário de criação vs 18h
            const criticos = {
                urgente: [],      // Criados antes das 18h e ainda ativos após 18h
                atencao: [],      // Criados entre 17h-18h
                alerta: [],       // Criados entre 16h-17h
                monitorar: []     // Criados após 18h ou muito recentes
            };

            reparos.forEach(reparo => {
                const horaCriacao = reparo.hora_criacao || 0;
                
                // Se já passou das 18h e o reparo foi criado hoje e ainda está Ativo
                if (tempoAtual >= 18) {
                    if (horaCriacao < 18) {
                        // Criado antes das 18h e ainda ativo → Urgente
                        criticos.urgente.push(reparo);
                    } else if (horaCriacao < 19) {
                        // Criado entre 18h-19h
                        criticos.atencao.push(reparo);
                    } else if (horaCriacao < 20) {
                        // Criado entre 19h-20h
                        criticos.alerta.push(reparo);
                    } else {
                        // Criado após 20h
                        criticos.monitorar.push(reparo);
                    }
                } else {
                    // Antes das 18h
                    if (horaCriacao < 16) {
                        // Criado antes das 16h → Atenção (vai fazer 18h logo)
                        criticos.atencao.push(reparo);
                    } else if (horaCriacao < 17) {
                        // Criado entre 16h-17h → Alerta
                        criticos.alerta.push(reparo);
                    } else {
                        // Criado após 17h → Monitorar
                        criticos.monitorar.push(reparo);
                    }
                }
            });

            return {
                success: true,
                dados: {
                    resumo: {
                        total: reparos.length,
                        urgente: criticos.urgente.length,
                        atencao: criticos.atencao.length,
                        alerta: criticos.alerta.length,
                        monitorar: criticos.monitorar.length,
                        hora_atual: tempoAtual.toFixed(1)
                    },
                    criticos,
                    hora_atual: horaAtual.toString().padStart(2, '0') + ':' + minutosAtuais.toString().padStart(2, '0')
                }
            };
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erro ao buscar reparos críticos:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    executarSincronizacao,
    buscarBacklog,
    buscarEstatisticas,
    buscarDashboardCluster,
    buscarLogsSincronizacao,
    buscarFiltrosDisponiveis,
    buscarStatusPorCluster,
    buscarReparosCriticost,
    baixarCSV,
    parseCSV
};
