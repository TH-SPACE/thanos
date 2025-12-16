// Funções JavaScript para o sistema de TMR

$(document).ready(function() {
    // Carregar dados iniciais
    carregarDadosTMR();

    // Atualizar dados quando mudar o filtro de mês
    $('#mesReferencia').change(function() {
        atualizarCabecalhoTabela();
        carregarDadosTMR();
    });

    // Botão de atualizar na aba de cluster
    $('#atualizarCluster').click(function() {
        carregarDadosCluster();
    });

    // Botão de atualizar na aba de regional
    $('#atualizarRegional').click(function() {
        carregarDadosRegional();
    });

    // Atualizar cabeçalhos iniciais
    atualizarCabecalhoTabela();
});

// Função para atualizar os cabeçalhos das tabelas com os meses selecionados
function atualizarCabecalhoTabela() {
    const meses = obterUltimos3Meses();

    // Atualizar cabeçalho da tabela de cluster
    let headerClusterHtml = '<th>Cluster</th>';
    meses.forEach(mes => {
        headerClusterHtml += `<th colspan="5">${mes}</th>`;
    });
    $('#headerCluster').html(headerClusterHtml);

    // Atualizar cabeçalho da tabela de regional
    let headerRegionalHtml = '<th>Regional</th>';
    meses.forEach(mes => {
        headerRegionalHtml += `<th colspan="5">${mes}</th>`;
    });
    $('#headerRegional').html(headerRegionalHtml);
}

function carregarDadosTMR() {
    // Obter o mês selecionado
    const mesReferencia = $('#mesReferencia').val();

    // Se nenhum mês for selecionado, usar o mês atual
    if (!mesReferencia) {
        const dataAtual = new Date();
        const mesAtual = String(dataAtual.getMonth() + 1).padStart(2, '0');
        $('#mesReferencia').val(mesAtual);
    }

    // Atualizar cabeçalhos e depois carregar dados
    atualizarCabecalhoTabela();

    // Aguardar um pouco para garantir que os cabeçalhos sejam atualizados
    setTimeout(() => {
        // Carregar dados de cluster e regional
        carregarDadosCluster();
        carregarDadosRegional();
    }, 50);
}

function carregarDadosCluster() {
    $.get('/tmr/data', function(data) {
        atualizarTabelaCluster(data);
    }).fail(function() {
        alert('Erro ao carregar dados de cluster');
    });
}

function carregarDadosRegional() {
    $.get('/tmr/data', function(data) {
        atualizarTabelaRegional(data);
    }).fail(function() {
        alert('Erro ao carregar dados de regional');
    });
}

function atualizarTabelaCluster(dados) {
    const tbody = $('#tabelaCluster tbody');
    tbody.empty();

    // Agrupar dados por cluster
    const dadosPorCluster = agruparPorCluster(dados);

    // Obter os últimos 3 meses para exibição
    const meses = obterUltimos3Meses();

    // Preencher a tabela com os dados
    for (const cluster in dadosPorCluster) {
        const clusterData = dadosPorCluster[cluster];

        // Calcular métricas para cada mês individualmente
        // Primeiro, vamos organizar os dados por mês
        const dadosPorMes = {};

        // Inicializar os meses
        meses.forEach(mes => {
            dadosPorMes[mes] = [];
        });

        // Agrupar os dados por mês
        clusterData.forEach(item => {
            // Usar o mês calculado no backend
            const mes = item.mes;

            // Se o mês fizer parte dos 3 meses considerados, adicionar ao array
            if (meses.includes(mes)) {
                dadosPorMes[mes].push(item);
            }
        });

        // Para cada mês, calcular as métricas
        let allMesesCells = '';
        for (const mes of meses) {
            const dadosMes = dadosPorMes[mes] || [];

            // Calcular métricas para este mês específico
            const dentroPrazo = dadosMes.filter(item => item.tmr_total !== null && parseFloat(item.tmr_total) < 4).length;
            const foraPrazo = dadosMes.filter(item => item.tmr_total !== null && parseFloat(item.tmr_total) >= 4).length;
            const total = dadosMes.length;
            const percDentroPrazo = total > 0 ? ((dentroPrazo / total) * 100).toFixed(2) : 0;
            const tmrMedio = total > 0 ? (dadosMes.reduce((sum, item) => sum + (item.tmr_total || 0), 0) / total).toFixed(2) : 0;

            // Adicionar as 5 colunas para este mês
            allMesesCells += `
                <td class="value-within">${dentroPrazo}</td>
                <td class="value-over">${foraPrazo}</td>
                <td class="perc-dentro-prazo">${percDentroPrazo}%</td>
                <td>${total}</td>
                <td class="tmr-value">${tmrMedio}h</td>
            `;
        }

        const row = `
            <tr>
                <td>${cluster}</td>
                ${allMesesCells}
            </tr>
        `;

        tbody.append(row);
    }
}

function atualizarTabelaRegional(dados) {
    const tbody = $('#tabelaRegional tbody');
    tbody.empty();

    // Agrupar dados por regional
    const dadosPorRegional = agruparPorRegional(dados);

    // Obter os últimos 3 meses para exibição
    const meses = obterUltimos3Meses();

    // Preencher a tabela com os dados
    for (const regional in dadosPorRegional) {
        const regionalData = dadosPorRegional[regional];

        // Calcular métricas para cada mês individualmente
        // Primeiro, vamos organizar os dados por mês
        const dadosPorMes = {};

        // Inicializar os meses
        meses.forEach(mes => {
            dadosPorMes[mes] = [];
        });

        // Agrupar os dados por mês
        regionalData.forEach(item => {
            // Usar o mês calculado no backend
            const mes = item.mes;

            // Se o mês fizer parte dos 3 meses considerados, adicionar ao array
            if (meses.includes(mes)) {
                dadosPorMes[mes].push(item);
            }
        });

        // Para cada mês, calcular as métricas
        let allMesesCells = '';
        for (const mes of meses) {
            const dadosMes = dadosPorMes[mes] || [];

            // Calcular métricas para este mês específico
            const dentroPrazo = dadosMes.filter(item => item.tmr_total !== null && parseFloat(item.tmr_total) < 4).length;
            const foraPrazo = dadosMes.filter(item => item.tmr_total !== null && parseFloat(item.tmr_total) >= 4).length;
            const total = dadosMes.length;
            const percDentroPrazo = total > 0 ? ((dentroPrazo / total) * 100).toFixed(2) : 0;
            const tmrMedio = total > 0 ? (dadosMes.reduce((sum, item) => sum + (item.tmr_total || 0), 0) / total).toFixed(2) : 0;

            // Adicionar as 5 colunas para este mês
            allMesesCells += `
                <td class="value-within">${dentroPrazo}</td>
                <td class="value-over">${foraPrazo}</td>
                <td class="perc-dentro-prazo">${percDentroPrazo}%</td>
                <td>${total}</td>
                <td class="tmr-value">${tmrMedio}h</td>
            `;
        }

        const row = `
            <tr>
                <td>${regional}</td>
                ${allMesesCells}
            </tr>
        `;

        tbody.append(row);
    }
}

function agruparPorCluster(dados) {
    const agrupado = {};
    
    dados.forEach(item => {
        const cluster = item.nom_cluster || 'OUTRO';
        
        if (!agrupado[cluster]) {
            agrupado[cluster] = [];
        }
        
        agrupado[cluster].push(item);
    });
    
    return agrupado;
}

function agruparPorRegional(dados) {
    const agrupado = {};
    
    dados.forEach(item => {
        const regional = item.regional || 'OUTRA';
        
        if (!agrupado[regional]) {
            agrupado[regional] = [];
        }
        
        agrupado[regional].push(item);
    });
    
    return agrupado;
}

function obterUltimos3Meses() {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const dataAtual = new Date();
    const mesReferencia = $('#mesReferencia').val();

    if (mesReferencia) {
        // Se um mês de referência foi selecionado, obter os 3 meses até esse mês
        const mesAtual = parseInt(mesReferencia, 10);

        // Calcular os 3 meses consecutivos terminando no mês selecionado
        const mes3 = mesAtual - 2 <= 0 ? 12 + (mesAtual - 2) : mesAtual - 2;  // Mês -2
        const mes2 = mesAtual - 1 <= 0 ? 12 + (mesAtual - 1) : mesAtual - 1;  // Mês -1
        const mes1 = mesAtual;  // Mês selecionado

        return [meses[mes3 - 1], meses[mes2 - 1], meses[mes1 - 1]];
    } else {
        // Caso contrário, usar os últimos 3 meses a partir do mês atual
        const mesAtual = dataAtual.getMonth() + 1;  // Adiciona 1 porque getMonth() é 0-indexado
        const mes2 = mesAtual - 1 <= 0 ? 12 : mesAtual - 1;  // Mês anterior
        const mes3 = mesAtual - 2 <= 0 ? (mesAtual - 2 + 12) : mesAtual - 2;  // Dois meses antes

        return [meses[mes3 - 1], meses[mes2 - 1], meses[mesAtual - 1]];
    }
}

function obterMesAtual() {
    const meses = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1;

    return meses[mesAtual] || '';
}

// Exibir mensagem de carregamento
function mostrarCarregando(element) {
    element.html('<tr><td colspan="7" class="text-center">Carregando dados...</td></tr>');
}

// Função para formatar números com separador de milhar
function formatarNumero(numero) {
    if (numero === null || numero === undefined) {
        return '';
    }
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Função para verificar se o valor é um número válido
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}