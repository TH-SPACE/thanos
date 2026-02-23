const { Router } = require('express');
const router = Router();
const http = require('http');
const db = require('../../db/db');
const b2bAuth = require('../middleware/b2bAuth');

// Configurações da API BDS
const CONFIG = {
    API_URL: process.env.BDS_API_URL || 'http://10.124.100.227:4012',
    USERNAME: process.env.BDS_USUARIO || 'g0056865',
    PASSWORD: process.env.BDS_SENHA || ''
};

/**
 * Faz requisição HTTP personalizada (igual ao navegador)
 */
function fazerRequisicao(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: json
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(body);
        }
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            'Connection': 'keep-alive'
        }
    };

    console.log('   📝 Payload:', payload);

    const response = await fazerRequisicao(options, payload);

    console.log(`   📊 Status HTTP: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.data.token) {
        console.log(`   ✅ Login bem-sucedido!`);
        console.log(`   👤 Usuário: ${response.data.user?.username || 'N/A'}`);
        console.log(`   🔑 Token: ${response.data.token.substring(0, 50)}...`);
        return response.data.token;
    } else {
        console.log(`   ❌ Falha na autenticação!`);
        console.log(`   📊 Response: ${JSON.stringify(response.data)}`);
        throw new Error(response.data.message || 'Falha na autenticação');
    }
}

/**
 * Buscar dados da API BDS
 */
async function buscarDadosBDS(token, filtros) {
    // Mapear tipoData para o formato que a API espera
    let tipoDataAPI = filtros.tipoData || 'buscaporabertura';
    
    // Para "buscaporabertos" e "buscaporfechamento", ajustar parâmetros
    const apenasAbertos = tipoDataAPI === 'buscaporabertos';
    const porFechamento = tipoDataAPI === 'buscaporfechamento';
    
    const payload = {
        regionalselecao: filtros.regionais || [],
        kpiselecao: filtros.kpis || [],
        tipodata: tipoDataAPI,
        data: apenasAbertos ? '' : (filtros.dataInicial || ''),
        data2: apenasAbertos ? '' : (filtros.dataFinal || ''),
        cliente: filtros.cliente || ''
    };

    // Se for busca por abertos, adicionar parâmetro de status
    if (apenasAbertos) {
        payload.status = 'ABERTO';
        payload.data = '';
        payload.data2 = '';
    }
    
    // Se for busca por fechamento, garantir que está usando o campo correto
    if (porFechamento) {
        // A API pode usar 'data_fechamento' ou outro campo
        // Manter tipodata como está e deixar a API processar
    }

    const payloadString = JSON.stringify(payload);
    
    console.log('   📝 Payload enviado:');
    console.log(`      - regionalselecao: ${JSON.stringify(payload.regionalselecao)}`);
    console.log(`      - kpiselecao: ${payload.kpiselecao.length} KPIs`);
    console.log(`      - tipodata: ${payload.tipodata}`);
    console.log(`      - data: ${payload.data}`);
    console.log(`      - data2: ${payload.data2}`);
    console.log(`      - cliente: ${payload.cliente}`);
    console.log(`      - status: ${payload.status || 'N/A'}`);

    const options = {
        hostname: '10.124.100.227',
        port: '4012',
        path: '/api/bds',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadString),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Authorization': `Bearer ${token}`,
            'Origin': 'http://10.124.100.227:3001',
            'Referer': 'http://10.124.100.227:3001/bds',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            'Connection': 'keep-alive'
        }
    };

    console.log(`   🔑 Authorization: Bearer ${token.substring(0, 50)}...`);

    const response = await fazerRequisicao(options, payloadString);

    console.log(`   📊 Status HTTP: ${response.statusCode}`);

    if (response.statusCode === 200 && Array.isArray(response.data)) {
        console.log(`   ✅ Dados recebidos com sucesso!`);
        console.log(`   📦 Quantidade de registros: ${response.data.length}`);
        return response.data;
    } else {
        console.log(`   ❌ Falha ao buscar dados!`);
        console.log(`   📊 Response: ${JSON.stringify(response.data)}`);
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

    // Se já estiver no formato YYYY-MM-DD HH:MM:SS
    if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
        return data;
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
 * Rota para sincronizar dados manualmente
 */
router.post('/sincronizar', b2bAuth, async (req, res) => {
    try {
        const { regionais, kpis, dataInicial, dataFinal, tipoData, cliente } = req.body;

        console.log('\n' + '='.repeat(70));
        console.log('🔄 INICIANDO SINCRONIZAÇÃO BDS');
        console.log('='.repeat(70));
        console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
        console.log(`📊 Período: ${dataInicial} até ${dataFinal}`);
        console.log(`📍 Tipo de Busca: ${tipoData}`);
        console.log(`🗺️  Regionais: ${regionais && regionais.length > 0 ? regionais.join(', ') : 'Todas'}`);
        console.log(`📈 KPIs: ${kpis ? kpis.length : 0} KPIs selecionados`);
        if (kpis && kpis.length > 0) {
            console.log(`   KPIs: ${kpis.join(', ')}`);
        }
        console.log('='.repeat(70));

        // Validar dados básicos
        if (!dataInicial || !dataFinal) {
            console.log('❌ ERRO: Data inicial e/ou final não informadas');
            return res.status(400).json({ error: 'Data inicial e/ou final não informadas' });
        }

        // 1. Autenticar na API BDS
        console.log('\n📡 [1/4] Autenticando na API BDS...');
        console.log(`   URL: ${CONFIG.API_URL}/api/login`);
        console.log(`   Usuário: ${CONFIG.USERNAME}`);
        
        const token = await autenticarNoBDS();
        
        console.log('   ✅ Token obtido com sucesso!');
        console.log(`   Token: ${token.substring(0, 50)}...`);

        // 2. Buscar dados da API
        console.log('\n📊 [2/4] Buscando dados na API BDS...');
        console.log(`   URL: ${CONFIG.API_URL}/api/bds`);
        console.log(`   Método: POST`);
        console.log(`   Filtros:`);
        console.log(`     - regionalselecao: ${JSON.stringify(regionais || [])}`);
        console.log(`     - kpiselecao: ${kpis ? kpis.length : 0} KPIs`);
        console.log(`     - tipodata: ${tipoData}`);
        console.log(`     - data: ${dataInicial}`);
        console.log(`     - data2: ${dataFinal}`);
        
        const dadosExternos = await buscarDadosBDS(token, {
            regionais,
            kpis,
            dataInicial,
            dataFinal,
            tipoData,
            cliente
        });

        console.log(`   ✅ ${dadosExternos.length} registros encontrados!`);

        if (dadosExternos.length === 0) {
            console.log('\n⚠️  Nenhum dado encontrado para os filtros selecionados.');
            console.log('='.repeat(70) + '\n');
            
            return res.json({
                success: true,
                message: 'Nenhum dado encontrado para os filtros selecionados.',
                inseridos: 0,
                atualizados: 0,
                total: 0
            });
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
                'bd': 'bd',
                'id_circuito': 'id_circuito',
                'bd_ant': 'bd_ant',
                'lp_15': 'lp_15',
                'designador_lp_13': 'designador_lp_13',
                'id_comercial': 'id_comercial',
                'data_abertura': 'data_abertura',
                'data_reparo': 'data_reparo',
                'data_encerramento': 'data_encerramento',
                'data_baixa': 'data_baixa',
                'last_update': 'last_update',
                'kpi': 'kpi',
                'kpi_acesso': 'kpi_acesso',
                'tipo_acesso': 'tipo_acesso',
                'origem': 'origem',
                'sistema_origem': 'sistema_origem',
                'cod_grupo': 'cod_grupo',
                'grupo_economico': 'grupo_economico',
                'bd_raiz': 'bd_raiz',
                'status_codigo': 'status_codigo',
                'status_nome': 'status_nome',
                'procedencia': 'procedencia',
                'reclamacao': 'reclamacao',
                'segmento_sistema': 'segmento_sistema',
                'segmento_v3': 'segmento_v3',
                'segmento_novo': 'segmento_novo',
                'segmento_vivo_corp': 'segmento_vivo_corp',
                'projeto': 'projeto',
                'cliente_nome': 'cliente_nome',
                'cnpj': 'cnpj',
                'cnpj_raiz': 'cnpj_raiz',
                'endereco': 'endereco',
                'localidade_codigo': 'localidade_codigo',
                'area_codigo': 'area_codigo',
                'escritorio_codigo': 'escritorio_codigo',
                'cidade': 'cidade',
                'uf': 'uf',
                'cluster': 'cluster',
                'regional': 'regional',
                'regional_vivo': 'regional_vivo',
                'lp_operadora': 'lp_operadora',
                'servico_cpcc_nome': 'servico_cpcc_nome',
                'velocidade': 'velocidade',
                'velocidade_kbps': 'velocidade_kbps',
                'produto_nome': 'produto_nome',
                'familia_produto': 'familia_produto',
                'baixa_n1_codigo': 'baixa_n1_codigo',
                'baixa_n2_codigo': 'baixa_n2_codigo',
                'baixa_n3_codigo': 'baixa_n3_codigo',
                'baixa_n4_codigo': 'baixa_n4_codigo',
                'baixa_n5_codigo': 'baixa_n5_codigo',
                'baixa_n1_nome': 'baixa_n1_nome',
                'baixa_n2_nome': 'baixa_n2_nome',
                'baixa_n3_nome': 'baixa_n3_nome',
                'baixa_n4_nome': 'baixa_n4_nome',
                'baixa_n5_nome': 'baixa_n5_nome',
                'resumo_intragov': 'resumo_intragov',
                'intragov_sigla': 'intragov_sigla',
                'intragov_codigo': 'intragov_codigo',
                'sla_horas': 'sla_horas',
                'grupo': 'grupo',
                'grupo_novo': 'grupo_novo',
                'foco_acoes': 'foco_acoes',
                'foco_novo': 'foco_novo',
                'grupo_baixa_codigo': 'grupo_baixa_codigo',
                'grupo_abertura': 'grupo_abertura',
                'usuario_abertura': 'usuario_abertura',
                'grupo_baixa': 'grupo_baixa',
                'usuario_baixa': 'usuario_baixa',
                'grupo_responsavel': 'grupo_responsavel',
                'operadora': 'operadora',
                'tipo_operadora': 'tipo_operadora',
                'tmr': 'tmr',
                'tmr_sem_parada': 'tmr_sem_parada',
                'tempo_parada': 'tempo_parada',
                'decorrido_sem_parada': 'decorrido_sem_parada',
                'prazo': 'prazo',
                'reincidencia_30d': 'reincidencia_30d',
                'reincidencia_tipo': 'reincidencia_tipo',
                'originou_reinc': 'originou_reinc',
                'prox_reinc': 'prox_reinc',
                'horario_func_inicio': 'horario_func_inicio',
                'horario_func_fim': 'horario_func_fim',
                'R30_Tratativas': 'R30_Tratativas'
            };

            // Processar cada registro
            for (let i = 0; i < dadosExternos.length; i++) {
                const item = dadosExternos[i];
                
                try {
                    // Obter cidade e UF para correção do cluster
                    const cidade = item.cidade || '';
                    const uf = item.uf || '';
                    const clusterOriginal = item.cluster;

                    // Mapear dados
                    const colunas = [];
                    const valores = [];

                    for (const [apiCampo, dbCampo] of Object.entries(mapeamentoCampos)) {
                        if (item[apiCampo] !== undefined) {
                            colunas.push(dbCampo);

                            let valor = item[apiCampo];

                            // Formatar datas
                            if (dbCampo.startsWith('data_') || dbCampo === 'last_update') {
                                valor = formatarData(valor);
                            }

                            // Corrigir cluster
                            if (dbCampo === 'cluster') {
                                valor = corrigirCluster(cidade, uf);
                            }

                            // Tratar null/undefined
                            if (valor === null || valor === undefined || valor === '') {
                                valor = null;
                            }

                            valores.push(valor);
                        }
                    }

                    // Verificar se tem BD
                    const bd = item.bd;
                    if (!bd) {
                        console.warn(`   ⚠️  Registro ${i + 1}/${dadosExternos.length}: Sem BD, ignorado`);
                        erros++;
                        continue;
                    }

                    // INSERT ou UPDATE
                    const placeholders = colunas.map(() => '?').join(', ');
                    const insertQuery = `INSERT INTO reparosb2b (${colunas.join(', ')}) VALUES (${placeholders})`;

                    try {
                        await connection.execute(insertQuery, valores);
                        inseridos++;
                        
                        // Log a cada 50 registros
                        if ((i + 1) % 50 === 0) {
                            console.log(`   📊 Progresso: ${i + 1}/${dadosExternos.length} processados...`);
                        }
                    } catch (insertError) {
                        if (insertError.code === 'ER_DUP_ENTRY') {
                            // UPDATE
                            const updateAssignments = colunas
                                .filter(col => col !== 'bd')
                                .map(col => `${col} = ?`)
                                .join(', ');

                            const updateValues = valores.filter((_, idx) => colunas[idx] !== 'bd');
                            updateValues.push(bd);

                            const updateQuery = `UPDATE reparosb2b SET ${updateAssignments} WHERE bd = ?`;
                            await connection.execute(updateQuery, updateValues);
                            atualizados++;
                            
                            // Log a cada 50 registros
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
            console.log('✅ SINCRONIZAÇÃO CONCLUÍDA!');
            console.log('='.repeat(70));
            console.log(`📊 RESULTADOS:`);
            console.log(`   ✅ Inseridos: ${inseridos}`);
            console.log(`   🔄 Atualizados: ${atualizados}`);
            console.log(`   ❌ Erros: ${erros}`);
            console.log(`   📦 Total processado: ${dadosExternos.length}`);
            console.log(`   📊 Taxa de sucesso: ${((inseridos + atualizados) / dadosExternos.length * 100).toFixed(1)}%`);
            console.log('='.repeat(70) + '\n');

            res.json({
                success: true,
                message: `Sincronização concluída! ${inseridos} inseridos, ${atualizados} atualizados.`,
                inseridos,
                atualizados,
                erros,
                total: dadosExternos.length
            });
        } finally {
            connection.release();
            console.log('💾 Conexão com banco de dados liberada.\n');
        }
    } catch (error) {
        console.error('\n' + '='.repeat(70));
        console.error('❌ ERRO NA SINCRONIZAÇÃO');
        console.error('='.repeat(70));
        console.error(`   Mensagem: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        console.error('='.repeat(70) + '\n');
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Rota para testar conexão com a API BDS
 */
router.get('/testar', b2bAuth, async (req, res) => {
    try {
        console.log('🧪 Testando conexão com BDS...');

        const token = await autenticarNoBDS();

        // Testar busca simples
        const dados = await buscarDadosBDS(token, {
            regionais: ['NORTE'],
            kpis: ['KPI'],
            dataInicial: new Date().toISOString().slice(0, 10),
            dataFinal: new Date().toISOString().slice(0, 10),
            tipoData: 'buscaporabertura',
            cliente: ''
        });

        res.json({
            success: true,
            message: 'Conexão com BDS estabelecida com sucesso!',
            autenticado: true,
            registros_teste: dados.length
        });
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Rota para obter lista de regionais disponíveis
 */
router.get('/regionais', b2bAuth, async (req, res) => {
    try {
        const regionais = [
            'CENTRO-OESTE',
            'NORDESTE',
            'NORTE',
            'SP CAPITAL',
            'SP INTERIOR',
            'SUDESTE - LESTE',
            'SUDESTE - MINAS',
            'SUL'
        ];

        res.json(regionais);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
