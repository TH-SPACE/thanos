// Funções JavaScript para o sistema de TMR

$(document).ready(function() {
    // Carregar dados iniciais
    carregarDadosTMR();
    
    // Atualizar dados quando mudar o filtro de mês
    $('#mesReferencia').change(function() {
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
});

function carregarDadosTMR() {
    // Obter o mês selecionado
    const mesReferencia = $('#mesReferencia').val();
    
    // Se nenhum mês for selecionado, usar o mês atual
    if (!mesReferencia) {
        const dataAtual = new Date();
        const mesAtual = String(dataAtual.getMonth() + 1).padStart(2, '0');
        $('#mesReferencia').val(mesAtual);
    }
    
    // Carregar dados de cluster e regional
    carregarDadosCluster();
    carregarDadosRegional();
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

        // Calcular métricas
        const dentroPrazo = clusterData.filter(item => item.tmr_total !== null && parseFloat(item.tmr_total) < 4).length;
        const foraPrazo = clusterData.filter(item => item.tmr_total !== null && parseFloat(item.tmr_total) >= 4).length;
        const total = clusterData.length;
        const percDentroPrazo = total > 0 ? ((dentroPrazo / total) * 100).toFixed(2) : 0;
        const tmrMedio = total > 0 ? (clusterData.reduce((sum, item) => sum + (item.tmr_total || 0), 0) / total).toFixed(2) : 0;

        // Criar células para cada mês
        let mesesCells = '';
        meses.forEach(mes => {
            mesesCells += `<td>${mes}</td>`;
        });

        const row = `
            <tr>
                <td>${cluster}</td>
                ${mesesCells}
                <td class="value-within">${dentroPrazo}</td>
                <td class="value-over">${foraPrazo}</td>
                <td class="perc-dentro-prazo">${percDentroPrazo}%</td>
                <td>${total}</td>
                <td class="tmr-value">${tmrMedio}h</td>
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

        // Calcular métricas
        const dentroPrazo = regionalData.filter(item => item.tmr_total !== null && parseFloat(item.tmr_total) < 4).length;
        const foraPrazo = regionalData.filter(item => item.tmr_total !== null && parseFloat(item.tmr_total) >= 4).length;
        const total = regionalData.length;
        const percDentroPrazo = total > 0 ? ((dentroPrazo / total) * 100).toFixed(2) : 0;
        const tmrMedio = total > 0 ? (regionalData.reduce((sum, item) => sum + (item.tmr_total || 0), 0) / total).toFixed(2) : 0;

        // Criar células para cada mês
        let mesesCells = '';
        meses.forEach(mes => {
            mesesCells += `<td>${mes}</td>`;
        });

        const row = `
            <tr>
                <td>${regional}</td>
                ${mesesCells}
                <td class="value-within">${dentroPrazo}</td>
                <td class="value-over">${foraPrazo}</td>
                <td class="perc-dentro-prazo">${percDentroPrazo}%</td>
                <td>${total}</td>
                <td class="tmr-value">${tmrMedio}h</td>
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
        // Se um mês de referência foi selecionado, obter os 3 meses anteriores a ele
        const anoAtual = dataAtual.getFullYear();
        const mesAtual = parseInt(mesReferencia, 10);

        // Calcular os 3 meses anteriores
        const mes1 = mesAtual;
        const mes2 = mesAtual - 1 < 1 ? 12 : mesAtual - 1;
        const mes3 = mesAtual - 2 < 1 ? 12 + (mesAtual - 2) : mesAtual - 2;

        return [meses[mes3 - 1], meses[mes2 - 1], meses[mes1 - 1]];
    } else {
        // Caso contrário, usar os últimos 3 meses
        const mesAtual = dataAtual.getMonth();
        const mes2Anterior = mesAtual - 2 < 0 ? 12 + (mesAtual - 2) : mesAtual - 2;
        const mes1Anterior = mesAtual - 1 < 0 ? 12 + (mesAtual - 1) : mesAtual - 1;

        return [meses[mes2Anterior], meses[mes1Anterior], meses[mesAtual]];
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