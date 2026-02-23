/**
 * Script de teste completo - API BDS
 * Replica EXATAMENTE as requisições do navegador
 *
 * Uso: node test_bds_completo.js
 */

const http = require('http');

// Configurações
const CONFIG = {
    API_URL: 'http://10.124.100.227:4012',
    USERNAME: 'g0056865',
    PASSWORD: 'Thi0202@@'
};

/**
 * Faz requisição HTTP personalizada
 */
function fazerRequisicao(options, body = null) {
    return new Promise((resolve, reject) => {
        console.log(`📡 Enviando ${options.method} ${options.path}...`);

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
 * Testa login na API BDS
 */
async function testarLogin() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  FASE 1: AUTENTICAÇÃO                                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

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

    try {
        const response = await fazerRequisicao(options, payload);

        if (response.statusCode === 200 && response.data.token) {
            console.log('✅ LOGIN BEM-SUCEDIDO!\n');
            console.log(`   Token: ${response.data.token.substring(0, 80)}...`);
            console.log(`   Usuário: ${response.data.user.username}`);
            console.log(`   Role: ${response.data.user.role}\n`);

            return response.data.token;
        } else {
            console.log('❌ ERRO NO LOGIN!\n');
            console.log(`   Status: ${response.statusCode}`);
            console.log(`   Response: ${JSON.stringify(response.data)}\n`);
            return null;
        }
    } catch (error) {
        console.log('❌ ERRO NA REQUISIÇÃO!\n');
        console.log(`   ${error.message}\n`);
        return null;
    }
}

/**
 * Testa busca de dados na API BDS (POST com filtros)
 */
async function testarBuscaDados(token) {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  FASE 2: BUSCA DE DADOS                                   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    if (!token) {
        console.log('⏭️  Pulando (sem token)\n');
        return null;
    }

    // Payload EXATO como no navegador
    const payload = JSON.stringify({
        regionalselecao: ['CENTRO-OESTE', 'NORTE'],
        kpiselecao: ['KPI', 'EXP_DYING_GASP', 'EXP_TLF', 'EXP_SLM_CLIENTE', 'EXP_PREVENTIVA', 'EXP_PROJ_EFICIENCIA', 'EXP_TRIAGEM', 'EXP_SEDUC', 'EXP_LM', 'EXP_PROATIVO_CLIENTE', 'EXP_REDUNDANCIA', 'EXP_BLACKLIST', 'EXP_PROJ_GRECIA', 'EXP_FUST', 'EXP_INDEVIDO_CRM_V1', 'EXP_SERVICE_DESK', 'EXP_INDEVIDO_CRM_V2', 'EXP_SIP_PABX', 'EXP_SISTEMAS_CLIENTE', 'EXP_TPL', 'EXP_ROBO_EDUCACAO', 'EXP_MASSIVA_ITX_VOZ_B2B', 'KPI_GESTAO_DE_REDES', 'EXP_PROATIVO_ABERTO'],
        tipodata: 'buscaporabertura',
        data: '2026-02-01',
        data2: '2026-02-23',
        cliente: ''
    });

    const options = {
        hostname: '10.124.100.227',
        port: '4012',
        path: '/api/bds',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Authorization': `Bearer ${token}`,
            'Origin': 'http://10.124.100.227:3001',
            'Referer': 'http://10.124.100.227:3001/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
            'Connection': 'keep-alive'
        }
    };

    try {
        const response = await fazerRequisicao(options, payload);

        if (response.statusCode === 200) {
            console.log('✅ DADOS RECEBIDOS!\n');

            const dados = response.data;
            const isArray = Array.isArray(dados);

            console.log(`   Tipo: ${isArray ? 'Array' : typeof dados}`);
            console.log(`   Quantidade: ${isArray ? dados.length : 'N/A'} registros\n`);

            if (isArray && dados.length > 0) {
                console.log('📋 ESTRUTURA (primeiro registro):');
                console.log('   ' + '─'.repeat(70));

                const primeiro = dados[0];
                const chaves = Object.keys(primeiro);

                chaves.forEach(chave => {
                    const valor = JSON.stringify(primeiro[chave]).substring(0, 35);
                    console.log(`   ${chave.padEnd(25)} : ${valor.padEnd(35)} (${typeof primeiro[chave]})`);
                });

                console.log('   ' + '─'.repeat(70));
                console.log(`   Total de colunas: ${chaves.length}\n`);

                // Campos importantes
                console.log('📌 CAMPOS IMPORTANTES:');
                const importantes = ['bd', 'id_circuito', 'kpi', 'cidade', 'uf', 'cluster', 'regional', 'regional_vivo', 'segmento_novo', 'data_abertura', 'data_encerramento', 'cliente_nome', 'cnpj', 'status_nome', 'grupo', 'operadora', 'tmr'];

                importantes.forEach(campo => {
                    if (primeiro[campo] !== undefined) {
                        console.log(`   ${campo.padEnd(20)} : ${JSON.stringify(primeiro[campo])}`);
                    }
                });
                console.log('');
            }

            return dados;
        } else {
            console.log('❌ ERRO NA BUSCA!\n');
            console.log(`   Status: ${response.statusCode}`);
            console.log(`   Response: ${JSON.stringify(response.data)}\n`);
            return null;
        }
    } catch (error) {
        console.log('❌ ERRO NA REQUISIÇÃO!\n');
        console.log(`   ${error.message}\n`);
        return null;
    }
}

/**
 * Testa busca com filtros personalizados
 */
async function testarFiltrosPersonalizados(token) {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  FASE 3: TESTE COM FILTROS PERSONALIZADOS                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    if (!token) {
        console.log('⏭️  Pulando (sem token)\n');
        return null;
    }

    // Teste com filtro de uma regional só
    const payload = JSON.stringify({
        regionalselecao: ['NORTE'],
        kpiselecao: ['KPI', 'EXP_LM', 'EXP_SLM_CLIENTE'],
        tipodata: 'buscaporabertura',
        data: '2026-02-01',
        data2: '2026-02-23',
        cliente: ''
    });

    const options = {
        hostname: '10.124.100.227',
        port: '4012',
        path: '/api/bds',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Accept': 'application/json, text/plain, */*',
            'Authorization': `Bearer ${token}`,
            'Origin': 'http://10.124.100.227:3001',
            'Referer': 'http://10.124.100.227:3001/bds',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    try {
        const response = await fazerRequisicao(options, payload);

        if (response.statusCode === 200) {
            const dados = response.data;
            const qtd = Array.isArray(dados) ? dados.length : 'N/A';
            console.log(`   ✅ Filtro (NORTE, 3 KPIs): ${qtd} registros\n`);
            return dados;
        } else {
            console.log(`   ❌ Erro: Status ${response.statusCode}\n`);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}\n`);
        return null;
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('\n' + '═'.repeat(65));
    console.log('🔐 TESTE DE CONEXÃO - API BDS');
    console.log('═'.repeat(65));
    console.log(`API: ${CONFIG.API_URL}`);
    console.log(`Usuário: ${CONFIG.USERNAME}`);
    console.log(`Senha: ${CONFIG.PASSWORD.substring(0, 3)}***${CONFIG.PASSWORD.substring(CONFIG.PASSWORD.length - 1)}`);
    console.log('═'.repeat(65) + '\n');

    // Fase 1: Login
    const token = await testarLogin();

    // Fase 2: Busca dados (payload completo)
    const dados = await testarBuscaDados(token);

    // Fase 3: Filtros personalizados
    await testarFiltrosPersonalizados(token);

    // Resumo
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  📊 RESUMO FINAL                                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    if (token) {
        console.log('✅ Autenticação: OK');

        if (dados) {
            console.log('✅ Busca de dados: OK');
            console.log(`   Registros: ${Array.isArray(dados) ? dados.length : 0}`);
            console.log('\n🎉 PRÓXIMO PASSO: Implementar sincronização!');
            console.log('   Consulte: SINCRONIZACAO_BDS.md');
        } else {
            console.log('⚠️  Busca de dados: FALHOU');
        }
    } else {
        console.log('❌ Autenticação: FALHOU');
    }

    console.log('\n' + '═'.repeat(65) + '\n');
}

// Executar
main().catch(err => {
    console.error('\n❌ ERRO GERAL:', err.message);
    console.log('');
});
