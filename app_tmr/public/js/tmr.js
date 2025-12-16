// Funções JavaScript para o sistema de TMR

$(document).ready(function() {
    // Carregar dados iniciais e atualizar cabeçalhos
    carregarDadosTMR();

    // Botão de atualizar na aba de cluster
    $('#atualizarCluster').click(function() {
        carregarDadosCluster();
    });

    // Botão de atualizar na aba de regional
    $('#atualizarRegional').click(function() {
        carregarDadosRegional();
    });

    // Botão de sincronização manual de dados
    $('#sincronizarManual').click(function() {
        sincronizarDadosManually();
    });

    // Botão de sincronização manual de dados para regional
    $('#sincronizarManualRegional').click(function() {
        sincronizarDadosManually();
    });
});

// Função para atualizar os cabeçalhos das tabelas com os meses dos dados
function atualizarCabecalhoTabela(meses) {
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

// Função para sincronizar dados manualmente
function sincronizarDadosManually() {
    // Mostrar mensagem de carregamento
    const botao = $('#sincronizarManual, #sincronizarManualRegional');
    const textoOriginal = botao.html();
    botao.html('<i class="fas fa-spinner fa-spin"></i> Sincronizando...').prop('disabled', true);

    $.post('/tmr/sincronizar', function(data) {
        alert('Sincronização concluída com sucesso!');

        // Atualizar os dados nas tabelas
        carregarDadosTMR();
    })
    .fail(function(xhr, status, error) {
        console.error('Erro na sincronização:', error);
        alert('Erro ao sincronizar dados: ' + (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : error));
    })
    .always(function() {
        // Restaurar o botão
        botao.html(textoOriginal).prop('disabled', false);
    });
}

function carregarDadosTMR() {
    // Carregar dados de cluster e regional
    carregarDadosCluster();
    carregarDadosRegional();
}

function carregarDadosCluster() {
    $.get('/tmr/data', function(dados) {
        // Obter os últimos 3 meses únicos dos dados recebidos
        const meses = obterUltimos3MesesDosDados(dados);

        // Atualizar cabeçalhos com os meses encontrados
        atualizarCabecalhoTabela(meses);

        atualizarTabelaCluster(dados, meses);
    }).fail(function() {
        alert('Erro ao carregar dados de cluster');
    });
}

function carregarDadosRegional() {
    $.get('/tmr/data', function(dados) {
        // Obter os últimos 3 meses únicos dos dados recebidos
        const meses = obterUltimos3MesesDosDados(dados);

        // Atualizar cabeçalhos com os meses encontrados (se ainda não foram atualizados)
        atualizarCabecalhoTabela(meses);

        atualizarTabelaRegional(dados, meses);
    }).fail(function() {
        alert('Erro ao carregar dados de regional');
    });
}

function atualizarTabelaCluster(dados, meses) {
    const tbody = $('#tabelaCluster tbody');
    tbody.empty();

    // Agrupar dados por cluster
    const dadosPorCluster = agruparPorCluster(dados);

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

            // Se o mês fizer parte dos meses encontrados, adicionar ao array
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

function atualizarTabelaRegional(dados, meses) {
    const tbody = $('#tabelaRegional tbody');
    tbody.empty();

    // Agrupar dados por regional
    const dadosPorRegional = agruparPorRegional(dados);

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

            // Se o mês fizer parte dos meses encontrados, adicionar ao array
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

function obterUltimos3MesesDosDados(dados) {
    // Extrair todos os meses únicos dos dados
    const mesesUnicos = [...new Set(dados.map(item => item.mes))];

    // Ordenar os meses em ordem cronológica (assumindo que os meses estão em formato textual)
    const ordemMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Filtrar meses válidos e ordenar de acordo com a ordem cronológica
    const mesesOrdenados = mesesUnicos
        .filter(mes => ordemMeses.includes(mes))
        .sort((a, b) => ordemMeses.indexOf(a) - ordemMeses.indexOf(b));

    // Pegar os últimos 3 meses, ou todos se houver menos de 3
    const ultimos3Meses = mesesOrdenados.slice(-3);

    // Se tivermos menos de 3 meses, completar com meses anteriores (se necessário)
    return ultimos3Meses;
}

// Função para obter os meses únicos existentes nos dados
function obterMesesUnicos(dados) {
    return [...new Set(dados.map(item => item.mes).filter(mes => mes && mes !== ''))];
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