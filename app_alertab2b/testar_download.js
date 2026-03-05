/**
 * Script para testar download e parse do CSV
 * Comparar quantidade entre download via código vs navegador
 */

const axios = require('axios');
const https = require('https');
const { parse } = require('csv-parse');
const fs = require('fs');
const path = require('path');

const CSV_URL = 'https://brtdtlts0002fu.redecorp.br/bdsla/index/excel';

async function testarDownload() {
    console.log('='.repeat(70));
    console.log('🧪 TESTE DE DOWNLOAD E PARSE DO CSV');
    console.log('='.repeat(70));
    
    // 1. Baixar CSV
    console.log('\n📥 [1/4] Baixando CSV...');
    try {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false  // Ignora SSL
        });

        const response = await axios.get(CSV_URL, {
            httpsAgent,
            responseType: 'text',
            timeout: 60000
        });

        const csvContent = response.data;
        const tamanhoBytes = Buffer.byteLength(csvContent, 'utf8');
        const tamanhoKB = (tamanhoBytes / 1024).toFixed(2);
        const tamanhoMB = (tamanhoBytes / 1024 / 1024).toFixed(2);
        
        console.log(`   ✅ CSV baixado!`);
        console.log(`   📊 Tamanho: ${tamanhoKB} KB (${tamanhoMB} MB)`);
        console.log(`   📊 Linhas (quebras \\n): ${(csvContent.match(/\n/g) || []).length}`);
        
        // Salvar CSV localmente para conferência
        const caminhoArquivo = path.join(__dirname, 'BacklogBDSLA_teste.csv');
        fs.writeFileSync(caminhoArquivo, csvContent, 'utf8');
        console.log(`   💾 CSV salvo em: ${caminhoArquivo}`);
        
        // Mostrar primeiras linhas
        console.log('\n📋 [2/4] Primeiras 5 linhas do CSV:');
        const linhas = csvContent.split('\n').slice(0, 5);
        linhas.forEach((linha, i) => {
            console.log(`   ${i + 1}: ${linha.substring(0, 150)}...`);
        });

        // 2. Parse do CSV
        console.log('\n📋 [3/4] Fazendo parse do CSV...');
        const registros = await parseCSV(csvContent);
        console.log(`   ✅ ${registros.length} registros parseados!`);
        
        // 3. Analisar UFs
        console.log('\n📍 [4/4] Analisando distribuição de UFs...');
        const ufs = {};
        const ufsPermitidas = [
            'GO', 'MATO GROSSO', 'MT', 'MATO GROSSO DO SUL', 'MS', 'DISTRITO FEDERAL', 'DF',
            'AC', 'AMAPA', 'AP', 'AMAZONAS', 'AM', 'PARA', 'PA', 'RONDONIA', 'RO', 'RORAIMA', 'RR', 'TOCANTINS', 'TO'
        ];
        
        registros.forEach(item => {
            const uf = item.uf ? item.uf.toUpperCase().trim() : 'VAZIO';
            ufs[uf] = (ufs[uf] || 0) + 1;
        });
        
        console.log('\n📊 Distribuição de UFs:');
        console.log('='.repeat(70));
        let totalCO_Norte = 0;
        let totalOutros = 0;
        
        Object.entries(ufs)
            .sort((a, b) => b[1] - a[1])
            .forEach(([uf, qtd]) => {
                const permitido = ufsPermitidas.includes(uf);
                const marcador = permitido ? '✅' : '❌';
                console.log(`   ${marcador} ${uf.padEnd(20)} : ${qtd.toString().padStart(5)} registros`);
                
                if (permitido) {
                    totalCO_Norte += qtd;
                } else {
                    totalOutros += qtd;
                }
            });
        
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMO:');
        console.log(`   📦 Total de registros: ${registros.length}`);
        console.log(`   ✅ CO + Norte (serão salvos): ${totalCO_Norte}`);
        console.log(`   ❌ Outras regiões (filtradas): ${totalOutros}`);
        console.log(`   🚫 Registros sem UF: ${ufs['VAZIO'] || 0}`);
        console.log('='.repeat(70));
        
        // 4. Verificar coluna UF
        console.log('\n🔍 Verificando nome da coluna UF...');
        if (registros.length > 0) {
            const colunas = Object.keys(registros[0]);
            console.log('   Colunas disponíveis:', colunas.join(', '));
            
            // Verificar se tem UF
            const temUF = colunas.some(c => c.toLowerCase().includes('uf'));
            const temEstado = colunas.some(c => c.toLowerCase().includes('estado'));
            console.log(`   ✅ Tem coluna "uf": ${temUF}`);
            console.log(`   ✅ Tem coluna "estado": ${temEstado}`);
            
            // Mostrar valor da UF em alguns registros
            console.log('\n   📋 Amostra de valores da coluna "uf":');
            for (let i = 0; i < Math.min(5, registros.length); i++) {
                console.log(`      Registro ${i}: "${registros[i].uf || 'N/A'}"`);
            }
        }
        
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error(error.stack);
    }
}

async function parseCSV(csvContent) {
    const registros = parse(csvContent, {
        delimiter: ';',
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true
    });
    
    return registros;
}

// Executar
testarDownload();
