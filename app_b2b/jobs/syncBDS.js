const cron = require('node-cron');
const http = require('http');
const db = require('../../db/db');

/**
 * Job de Sincronização Automática do BDS
 * Executa 3x ao dia: 05:00, 12:00 e 17:00
 */

// Configurações da API BDS
const CONFIG = {
    API_URL: process.env.BDS_API_URL || 'http://10.124.100.227:4012',
    USERNAME: process.env.BDS_USUARIO || 'g0056865',
    PASSWORD: process.env.BDS_SENHA || '',
    
    // Configurações de sincronização automática
    SYNC_AUTOMATICO: process.env.BDS_SYNC_AUTOMATICO === 'true',
    HORARIO_1: process.env.BDS_SYNC_HORARIO_1 || '05:00',
    HORARIO_2: process.env.BDS_SYNC_HORARIO_2 || '12:00',
    HORARIO_3: process.env.BDS_SYNC_HORARIO_3 || '17:00',
    REGIONAIS: (process.env.BDS_SYNC_REGIONAIS || 'NORTE,CENTRO-OESTE').split(',').map(r => r.trim()),
    KPIS: process.env.BDS_SYNC_KPIS ? process.env.BDS_SYNC_KPIS.split(',').map(k => k.trim()) : [],
    DIAS_ATRAS: parseInt(process.env.BDS_SYNC_DIAS_ATRAS) || 30,
    TIPO_BUSCA: process.env.BDS_SYNC_TIPO_BUSCA || 'buscaporabertura'
};

// KPIs padrão (todos os 24)
const TODOS_KPIS = [
    'KPI', 'EXP_DYING_GASP', 'EXP_TLF', 'EXP_SLM_CLIENTE', 'EXP_PREVENTIVA',
    'EXP_PROJ_EFICIENCIA', 'EXP_TRIAGEM', 'EXP_SEDUC', 'EXP_LM',
    'EXP_PROATIVO_CLIENTE', 'EXP_REDUNDANCIA', 'EXP_BLACKLIST', 'EXP_PROJ_GRECIA',
    'EXP_FUST', 'EXP_INDEVIDO_CRM_V1', 'EXP_SERVICE_DESK', 'EXP_INDEVIDO_CRM_V2',
    'EXP_SIP_PABX', 'EXP_SISTEMAS_CLIENTE', 'EXP_TPL', 'EXP_ROBO_EDUCACAO',
    'EXP_MASSIVA_ITX_VOZ_B2B', 'KPI_GESTAO_DE_REDES', 'EXP_PROATIVO_ABERTO'
];

/**
 * Faz requisição HTTP personalizada
 */
function fazerRequisicao(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, headers: res.headers, data: json });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, headers: res.headers, data: data });
                }
            });
        });
        req.on('error', (e) => { reject(e); });
        if (body) { req.write(body); }
        req.end();
    });
}

/**
 * Autenticar na API BDS e obter token
 */
async function autenticarNoBDS() {
    const payload = JSON.stringify({
        username: CONFIG.USERNAME,
        password: CONFIG.PASSWORD
    });

    const options = {
        hostname: '10.124.100.227',
        port: '4012',
        path: '/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Origin': 'http://10.124.100.227:3001',
            'Referer': 'http://10.124.100.227:3001/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Connection': 'keep-alive'
        }
    };

    const response = await fazerRequisicao(options, payload);

    if (response.statusCode === 200 && response.data.token) {
        return response.data.token;
    } else {
        throw new Error(response.data.message || 'Falha na autenticação');
    }
}

/**
 * Buscar dados da API BDS
 */
async function buscarDadosBDS(token, filtros) {
    const payload = {
        regionalselecao: filtros.regionais || [],
        kpiselecao: filtros.kpis || [],
        tipodata: filtros.tipoData || 'buscaporabertura',
        data: filtros.dataInicial || '',
        data2: filtros.dataFinal || '',
        cliente: filtros.cliente || ''
    };

    const payloadString = JSON.stringify(payload);

    const options = {
        hostname: '10.124.100.227',
        port: '4012',
        path: '/api/bds',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadString),
            'Accept': 'application/json, text/plain, */*',
            'Authorization': `Bearer ${token}`,
            'Origin': 'http://10.124.100.227:3001',
            'Referer': 'http://10.124.100.227:3001/bds',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Connection': 'keep-alive'
        }
    };

    const response = await fazerRequisicao(options, payloadString);

    if (response.statusCode === 200 && Array.isArray(response.data)) {
        return response.data;
    } else {
        throw new Error(response.data.message || 'Falha ao buscar dados');
    }
}

/**
 * Corrigir cluster com base na cidade e UF
 */
function corrigirCluster(cidade, uf) {
    if (!cidade) return 'OUTRO';

    const cidadesBrasilia = ['FORMOSA', 'CIDADE OCIDENTAL', 'VALPARAISO', 'VALPARAISO DE GOIAS', 'PLANALTINA', 'LUZIANIA', 'LUZIÂNIA', 'TAGUATINGA','GUARA', 'RIACHO FUNDO','SAMAMBAIA','STA MARIA'];
    if (cidadesBrasilia.includes(cidade.toUpperCase())) {
        return 'BRASILIA';
    }

    const cidadesAnapolis = ['ANAPOLIS', 'ANÁPOLIS', 'JARAGUA', 'JARAGUÁ'];
    if (cidadesAnapolis.includes(cidade.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
        return 'ANAPOLIS';
    }

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

/**
 * Formatar data para MySQL (YYYY-MM-DD HH:MM:SS)
 */
function formatarData(data) {
    if (!data) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
        // Se já tiver hora, manter, senão adicionar 00:00:00
        if (data.length === 10) {
            return data + ' 00:00:00';
        }
        return data;
    }
    const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
    if (match) {
        const [, dia, mes, ano, hora] = match;
        return `${ano}-${mes}-${dia} ${hora}`;
    }
    const matchDate = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (matchDate) {
        const [, dia, mes, ano] = matchDate;
        return `${ano}-${mes}-${dia} 00:00:00`;
    }
    return data;
}

/**
 * Salvar log de sincronização no banco
 */
async function salvarLogSincronizacao(params) {
    try {
        const {
            tipo_sync,
            periodo_inicio,
            periodo_fim,
            regionais,
            kpis,
            tipo_busca,
            total_registros,
            registros_inseridos,
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
                INSERT INTO logs_sync_b2b (
                    data_sync, tipo_sync, periodo_inicio, periodo_fim,
                    regionais, kpis, tipo_busca,
                    total_registros, registros_inseridos, registros_atualizados, registros_erro,
                    status_sync, duracao_segundos, mensagem, erro_detalhe
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                new Date(),
                tipo_sync || 'automatico',
                periodo_inicio || null,
                periodo_fim || null,
                regionais ? JSON.stringify(regionais) : null,
                kpis ? JSON.stringify(kpis) : null,
                tipo_busca || null,
                total_registros || 0,
                registros_inseridos || 0,
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
        // Não lança erro para não falhar a sincronização principal
    }
}

/**
 * Executar sincronização automática
 */
async function executarSincronizacao() {
    const dataInicio = new Date();
    
    // Calcular período (dataFinal = hoje, dataInicial = hoje - DIAS_ATRAS)
    const dataFinal = dataInicio.toISOString().slice(0, 10);
    const dataInicial = new Date(dataInicio);
    dataInicial.setDate(dataInicial.getDate() - CONFIG.DIAS_ATRAS);
    const dataInicialStr = dataInicial.toISOString().slice(0, 10);

    // Usar todos os KPIs se nenhum foi especificado
    const kpisParaUsar = CONFIG.KPIS.length > 0 ? CONFIG.KPIS : TODOS_KPIS;

    console.log('\n' + '='.repeat(70));
    console.log('🔄 [AUTO] INICIANDO SINCRONIZAÇÃO BDS');
    console.log('='.repeat(70));
    console.log(`📅 Data/Hora: ${dataInicio.toLocaleString('pt-BR')}`);
    console.log(`📊 Período: ${dataInicialStr} até ${dataFinal} (${CONFIG.DIAS_ATRAS} dias)`);
    console.log(`📍 Tipo de Busca: ${CONFIG.TIPO_BUSCA}`);
    console.log(`🗺️  Regionais: ${CONFIG.REGIONAIS.join(', ')}`);
    console.log(`📈 KPIs: ${kpisParaUsar.length} KPIs`);
    console.log('='.repeat(70));

    try {
        // 1. Autenticar na API BDS
        console.log('\n📡 [1/4] Autenticando na API BDS...');
        const token = await autenticarNoBDS();
        console.log('   ✅ Token obtido com sucesso!');

        // 2. Buscar dados da API
        console.log('\n📊 [2/4] Buscando dados na API BDS...');
        const dadosExternos = await buscarDadosBDS(token, {
            regionais: CONFIG.REGIONAIS,
            kpis: kpisParaUsar,
            dataInicial: dataInicialStr,
            dataFinal: dataFinal,
            tipoData: CONFIG.TIPO_BUSCA,
            cliente: ''
        });
        console.log(`   ✅ ${dadosExternos.length} registros encontrados!`);

        if (dadosExternos.length === 0) {
            console.log('\n⚠️  Nenhum dado encontrado para os filtros configurados.');
            console.log('='.repeat(70) + '\n');
            return { success: true, inseridos: 0, atualizados: 0, total: 0 };
        }

        // 3. Conectar ao banco e processar dados
        console.log('\n💾 [3/4] Conectando ao banco de dados...');
        const connection = await db.mysqlPool.getConnection();
        console.log('   ✅ Conexão estabelecida!');

        try {
            let inseridos = 0;
            let atualizados = 0;
            let erros = 0;

            console.log('\n📝 [4/4] Processando registros...');
            console.log(`   Total de registros: ${dadosExternos.length}`);

            // Mapeamento de campos da API para o banco
            const mapeamentoCampos = {
                'bd': 'bd', 'id_circuito': 'id_circuito', 'bd_ant': 'bd_ant',
                'lp_15': 'lp_15', 'designador_lp_13': 'designador_lp_13',
                'id_comercial': 'id_comercial', 'data_abertura': 'data_abertura',
                'data_reparo': 'data_reparo', 'data_encerramento': 'data_encerramento',
                'data_baixa': 'data_baixa', 'last_update': 'last_update',
                'kpi': 'kpi', 'kpi_acesso': 'kpi_acesso', 'tipo_acesso': 'tipo_acesso',
                'origem': 'origem', 'sistema_origem': 'sistema_origem',
                'cod_grupo': 'cod_grupo', 'grupo_economico': 'grupo_economico',
                'bd_raiz': 'bd_raiz', 'status_codigo': 'status_codigo',
                'status_nome': 'status_nome', 'procedencia': 'procedencia',
                'reclamacao': 'reclamacao', 'segmento_sistema': 'segmento_sistema',
                'segmento_v3': 'segmento_v3', 'segmento_novo': 'segmento_novo',
                'segmento_vivo_corp': 'segmento_vivo_corp', 'projeto': 'projeto',
                'cliente_nome': 'cliente_nome', 'cnpj': 'cnpj', 'cnpj_raiz': 'cnpj_raiz',
                'endereco': 'endereco', 'localidade_codigo': 'localidade_codigo',
                'area_codigo': 'area_codigo', 'escritorio_codigo': 'escritorio_codigo',
                'cidade': 'cidade', 'uf': 'uf', 'cluster': 'cluster',
                'regional': 'regional', 'regional_vivo': 'regional_vivo',
                'lp_operadora': 'lp_operadora', 'servico_cpcc_nome': 'servico_cpcc_nome',
                'velocidade': 'velocidade', 'velocidade_kbps': 'velocidade_kbps',
                'produto_nome': 'produto_nome', 'familia_produto': 'familia_produto',
                'baixa_n1_codigo': 'baixa_n1_codigo', 'baixa_n2_codigo': 'baixa_n2_codigo',
                'baixa_n3_codigo': 'baixa_n3_codigo', 'baixa_n4_codigo': 'baixa_n4_codigo',
                'baixa_n5_codigo': 'baixa_n5_codigo', 'baixa_n1_nome': 'baixa_n1_nome',
                'baixa_n2_nome': 'baixa_n2_nome', 'baixa_n3_nome': 'baixa_n3_nome',
                'baixa_n4_nome': 'baixa_n4_nome', 'baixa_n5_nome': 'baixa_n5_nome',
                'resumo_intragov': 'resumo_intragov', 'intragov_sigla': 'intragov_sigla',
                'intragov_codigo': 'intragov_codigo', 'sla_horas': 'sla_horas',
                'grupo': 'grupo', 'grupo_novo': 'grupo_novo', 'foco_acoes': 'foco_acoes',
                'foco_novo': 'foco_novo', 'grupo_baixa_codigo': 'grupo_baixa_codigo',
                'grupo_abertura': 'grupo_abertura', 'usuario_abertura': 'usuario_abertura',
                'grupo_baixa': 'grupo_baixa', 'usuario_baixa': 'usuario_baixa',
                'grupo_responsavel': 'grupo_responsavel', 'operadora': 'operadora',
                'tipo_operadora': 'tipo_operadora', 'tmr': 'tmr',
                'tmr_sem_parada': 'tmr_sem_parada', 'tempo_parada': 'tempo_parada',
                'decorrido_sem_parada': 'decorrido_sem_parada', 'prazo': 'prazo',
                'reincidencia_30d': 'reincidencia_30d', 'reincidencia_tipo': 'reincidencia_tipo',
                'originou_reinc': 'originou_reinc', 'prox_reinc': 'prox_reinc',
                'horario_func_inicio': 'horario_func_inicio',
                'horario_func_fim': 'horario_func_fim', 'R30_Tratativas': 'R30_Tratativas'
            };

            // Processar cada registro
            for (let i = 0; i < dadosExternos.length; i++) {
                const item = dadosExternos[i];

                try {
                    const cidade = item.cidade || '';
                    const uf = item.uf || '';

                    const colunas = [];
                    const valores = [];

                    for (const [apiCampo, dbCampo] of Object.entries(mapeamentoCampos)) {
                        if (item[apiCampo] !== undefined) {
                            colunas.push(dbCampo);
                            let valor = item[apiCampo];

                            if (dbCampo.startsWith('data_') || dbCampo === 'last_update') {
                                valor = formatarData(valor);
                            }
                            if (dbCampo === 'cluster') {
                                valor = corrigirCluster(cidade, uf);
                            }
                            if (valor === null || valor === undefined || valor === '') {
                                valor = null;
                            }
                            valores.push(valor);
                        }
                    }

                    const bd = item.bd;
                    if (!bd) {
                        console.warn(`   ⚠️  Registro ${i + 1}/${dadosExternos.length}: Sem BD, ignorado`);
                        erros++;
                        continue;
                    }

                    const placeholders = colunas.map(() => '?').join(', ');
                    const insertQuery = `INSERT INTO reparosb2b (${colunas.join(', ')}) VALUES (${placeholders})`;

                    try {
                        await connection.execute(insertQuery, valores);
                        inseridos++;
                        if ((i + 1) % 50 === 0) {
                            console.log(`   📊 Progresso: ${i + 1}/${dadosExternos.length} processados...`);
                        }
                    } catch (insertError) {
                        if (insertError.code === 'ER_DUP_ENTRY') {
                            const updateAssignments = colunas
                                .filter(col => col !== 'bd')
                                .map(col => `${col} = ?`)
                                .join(', ');
                            const updateValues = valores.filter((_, idx) => colunas[idx] !== 'bd');
                            updateValues.push(bd);
                            const updateQuery = `UPDATE reparosb2b SET ${updateAssignments} WHERE bd = ?`;
                            await connection.execute(updateQuery, updateValues);
                            atualizados++;
                            if ((i + 1) % 50 === 0) {
                                console.log(`   📊 Progresso: ${i + 1}/${dadosExternos.length} processados...`);
                            }
                        } else {
                            throw insertError;
                        }
                    }
                } catch (error) {
                    console.error(`   ❌ Erro ao processar registro ${item.bd || i + 1}: ${error.message}`);
                    erros++;
                }
            }

            console.log('\n' + '='.repeat(70));
            console.log('✅ [AUTO] SINCRONIZAÇÃO CONCLUÍDA!');
            console.log('='.repeat(70));
            console.log(`📊 RESULTADOS:`);
            console.log(`   ✅ Inseridos: ${inseridos}`);
            console.log(`   🔄 Atualizados: ${atualizados}`);
            console.log(`   ❌ Erros: ${erros}`);
            console.log(`   📦 Total processado: ${dadosExternos.length}`);
            if (dadosExternos.length > 0) {
                console.log(`   📊 Taxa de sucesso: ${((inseridos + atualizados) / dadosExternos.length * 100).toFixed(1)}%`);
            }
            console.log('='.repeat(70) + '\n');

            // Calcular duração e salvar log
            const dataFim = new Date();
            const duracao = ((dataFim - dataInicio) / 1000).toFixed(2);
            const status_sync = erros === 0 ? 'sucesso' : (inseridos + atualizados > 0 ? 'parcial' : 'erro');
            const mensagem = `Sincronização automática concluída! ${inseridos} inseridos, ${atualizados} atualizados, ${erros} erros.`;

            // Salvar log na tabela
            await salvarLogSincronizacao({
                tipo_sync: 'automatico',
                periodo_inicio: dataInicialStr,
                periodo_fim: dataFinal,
                regionais: CONFIG.REGIONAIS,
                kpis: kpisParaUsar,
                tipo_busca: CONFIG.TIPO_BUSCA,
                total_registros: dadosExternos.length,
                registros_inseridos: inseridos,
                registros_atualizados: atualizados,
                registros_erro: erros,
                status_sync,
                duracao_segundos: parseFloat(duracao),
                mensagem
            });

            return { success: true, inseridos, atualizados, erros, total: dadosExternos.length };
        } finally {
            connection.release();
            console.log('💾 Conexão com banco de dados liberada.\n');
        }
    } catch (error) {
        console.error('\n' + '='.repeat(70));
        console.error('❌ [AUTO] ERRO NA SINCRONIZAÇÃO');
        console.error('='.repeat(70));
        console.error(`   Mensagem: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        console.error('='.repeat(70) + '\n');

        // Salvar log do erro
        const dataFim = new Date();
        const duracao = ((dataFim - dataInicio) / 1000).toFixed(2);

        await salvarLogSincronizacao({
            tipo_sync: 'automatico',
            periodo_inicio: dataInicialStr,
            periodo_fim: dataFinal,
            regionais: CONFIG.REGIONAIS,
            kpis: kpisParaUsar,
            tipo_busca: CONFIG.TIPO_BUSCA,
            total_registros: 0,
            registros_inseridos: 0,
            registros_atualizados: 0,
            registros_erro: 0,
            status_sync: 'erro',
            duracao_segundos: parseFloat(duracao),
            mensagem: 'Erro na sincronização automática',
            erro_detalhe: error.message
        });

        return { success: false, error: error.message };
    }
}

/**
 * Converter horário HH:MM para expressão cron
 */
function horarioParaCron(horario) {
    const [hora, minuto] = horario.split(':').map(Number);
    return `${minuto} ${hora} * * *`;
}

/**
 * Inicializar jobs de sincronização
 */
function inicializarSincronizacao() {
    if (!CONFIG.SYNC_AUTOMATICO) {
        console.log('⚠️  Sincronização automática do BDS está DESATIVADA.');
        console.log('   Para ativar, defina BDS_SYNC_AUTOMATICO=true no .env\n');
        return;
    }

    console.log('\n' + '='.repeat(70));
    console.log('🤖 INICIALIZANDO SINCRONIZAÇÃO AUTOMÁTICA DO BDS');
    console.log('='.repeat(70));
    console.log(`📅 Configuração:`);
    console.log(`   - Horário 1: ${CONFIG.HORARIO_1}`);
    console.log(`   - Horário 2: ${CONFIG.HORARIO_2}`);
    console.log(`   - Horário 3: ${CONFIG.HORARIO_3}`);
    console.log(`   - Regionais: ${CONFIG.REGIONAIS.join(', ')}`);
    console.log(`   - Dias para trás: ${CONFIG.DIAS_ATRAS}`);
    console.log(`   - Tipo de busca: ${CONFIG.TIPO_BUSCA}`);
    console.log('='.repeat(70));

    // Criar os 3 jobs cron
    const jobs = [];
    
    // Job 1 - Horário 1 (05:00)
    const cronExpressao1 = horarioParaCron(CONFIG.HORARIO_1);
    const job1 = cron.schedule(cronExpressao1, () => {
        console.log(`\n⏰ [CRON] Executando sincronização das ${CONFIG.HORARIO_1}...`);
        executarSincronizacao();
    }, {
        scheduled: true,
        timezone: 'America/Sao_Paulo'
    });
    jobs.push({ horario: CONFIG.HORARIO_1, job: job1 });

    // Job 2 - Horário 2 (12:00)
    const cronExpressao2 = horarioParaCron(CONFIG.HORARIO_2);
    const job2 = cron.schedule(cronExpressao2, () => {
        console.log(`\n⏰ [CRON] Executando sincronização das ${CONFIG.HORARIO_2}...`);
        executarSincronizacao();
    }, {
        scheduled: true,
        timezone: 'America/Sao_Paulo'
    });
    jobs.push({ horario: CONFIG.HORARIO_2, job: job2 });

    // Job 3 - Horário 3 (17:00)
    const cronExpressao3 = horarioParaCron(CONFIG.HORARIO_3);
    const job3 = cron.schedule(cronExpressao3, () => {
        console.log(`\n⏰ [CRON] Executando sincronização das ${CONFIG.HORARIO_3}...`);
        executarSincronizacao();
    }, {
        scheduled: true,
        timezone: 'America/Sao_Paulo'
    });
    jobs.push({ horario: CONFIG.HORARIO_3, job: job3 });

    console.log(`\n✅ Jobs agendados com sucesso!`);
    console.log(`   - Job 1: ${CONFIG.HORARIO_1} (cron: ${cronExpressao1})`);
    console.log(`   - Job 2: ${CONFIG.HORARIO_2} (cron: ${cronExpressao2})`);
    console.log(`   - Job 3: ${CONFIG.HORARIO_3} (cron: ${cronExpressao3})`);
    console.log('   - Fuso horário: America/Sao_Paulo');
    console.log('='.repeat(70) + '\n');

    return jobs;
}

module.exports = {
    inicializarSincronizacao,
    executarSincronizacao,
    CONFIG
};
