// Funções JavaScript para o sistema de TMR

$(document).ready(function () {
  // Carregar dados iniciais e atualizar cabeçalhos
  carregarDadosTMR();

  // Botão de atualizar na aba de cluster
  $("#atualizarCluster").click(function () {
    carregarDadosCluster();
  });

  // Botão de atualizar na aba de regional
  $("#atualizarRegional").click(function () {
    carregarDadosRegional();
  });

  // Botão de sincronização manual de dados
  $("#sincronizarManual").click(function () {
    sincronizarDadosManually();
  });

  // Botão de sincronização manual de dados para regional
  $("#sincronizarManualRegional").click(function () {
    sincronizarDadosManually();
  });
});

// Função para atualizar os cabeçalhos das tabelas com os meses dos dados
function atualizarCabecalhoTabela(meses) {
  // Atualizar cabeçalho da tabela de cluster
  let headerClusterHtml = "<th>Cluster</th>";
  meses.forEach((mes) => {
    headerClusterHtml += `<th colspan="5">${mes}</th>`;
  });
  $("#headerCluster").html(headerClusterHtml);

  // Atualizar subcabeçalho da tabela de cluster
  let subheaderClusterHtml = '<th colspan="1"></th>'; // Célula vazia para alinhar com 'Cluster'
  meses.forEach((mes) => {
    subheaderClusterHtml += `
            <th>&lt;4h</th>
            <th>&gt;4h</th>
            <th>% Dentro</th>
            <th>Total</th>
            <th>TMR</th>
        `;
  });
  $("#subheaderCluster").html(subheaderClusterHtml);

  // Atualizar cabeçalho da tabela de regional
  let headerRegionalHtml = "<th>Regional</th>";
  meses.forEach((mes) => {
    headerRegionalHtml += `<th colspan="5">${mes}</th>`;
  });
  $("#headerRegional").html(headerRegionalHtml);

  // Atualizar subcabeçalho da tabela de regional
  let subheaderRegionalHtml = "<th></th>"; // Célula vazia para alinhar com 'Regional'
  meses.forEach((mes) => {
    subheaderRegionalHtml += `
            <th>&lt;4h</th>
            <th>&gt;4h</th>
            <th>% Dentro</th>
            <th>Total</th>
            <th>TMR</th>
        `;
  });
  $("#subheaderRegional").html(subheaderRegionalHtml);
}

// Função para sincronizar dados manualmente
function sincronizarDadosManually() {
  // Mostrar mensagem de carregamento
  const botao = $("#sincronizarManual, #sincronizarManualRegional");
  const textoOriginal = botao.html();
  botao
    .html('<i class="fas fa-spinner fa-spin"></i> Sincronizando...')
    .prop("disabled", true);

  $.post("/tmr/sincronizar", function (data) {
    alert("Sincronização concluída com sucesso!");

    // Atualizar os dados nas tabelas
    carregarDadosTMR();
  })
    .fail(function (xhr, status, error) {
      console.error("Erro na sincronização:", error);
      alert(
        "Erro ao sincronizar dados: " +
          (xhr.responseJSON && xhr.responseJSON.error
            ? xhr.responseJSON.error
            : error)
      );
    })
    .always(function () {
      // Restaurar o botão
      botao.html(textoOriginal).prop("disabled", false);
    });
}

function carregarDadosTMR() {
  // Carregar dados de cluster e regional
  carregarDadosCluster();
  carregarDadosRegional();
}

function carregarDadosCluster() {
  // Mostrar indicador de carregamento
  $("#tabelaCluster tbody").html(
    '<tr><td colspan="100" class="text-center p-4">Carregando dados do cluster...</td></tr>'
  );

  $.get("/tmr/data", function (dados) {
    // Obter os últimos 3 meses únicos dos dados recebidos
    const meses = obterUltimos3MesesDosDados(dados);

    // Atualizar cabeçalhos com os meses encontrados
    atualizarCabecalhoTabela(meses);

    atualizarTabelaCluster(dados, meses);
  }).fail(function () {
    $("#tabelaCluster tbody").html(
      '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de cluster</td></tr>'
    );
    alert("Erro ao carregar dados de cluster");
  });
}

function carregarDadosRegional() {
  // Mostrar indicador de carregamento
  $("#tabelaRegional tbody").html(
    '<tr><td colspan="100" class="text-center p-4">Carregando dados da regional...</td></tr>'
  );

  $.get("/tmr/data", function (dados) {
    // Obter os últimos 3 meses únicos dos dados recebidos (já feito na função de cluster)
    const meses = obterUltimos3MesesDosDados(dados);

    // Atualizar cabeçalhos com os meses encontrados (já deve ter sido feito)
    // atualizarCabecalhoTabela(meses); // Comentado para evitar sobreposição

    atualizarTabelaRegional(dados, meses);
  }).fail(function () {
    $("#tabelaRegional tbody").html(
      '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de regional</td></tr>'
    );
    alert("Erro ao carregar dados de regional");
  });
}

function atualizarTabelaCluster(dados, meses) {
  // Criar o conteúdo da tabela primeiro, depois adicionar ao DOM para melhor performance
  let tableHtml = "";

  // Agrupar dados por cluster
  const dadosPorCluster = agruparPorCluster(dados);

  // Preencher a tabela com os dados
  for (const cluster in dadosPorCluster) {
    const clusterData = dadosPorCluster[cluster];

    // Calcular métricas para cada mês individualmente
    // Primeiro, vamos organizar os dados por mês
    const dadosPorMes = {};

    // Inicializar os meses
    meses.forEach((mes) => {
      dadosPorMes[mes] = [];
    });

    // Agrupar os dados por mês
    clusterData.forEach((item) => {
      // Usar o mês calculado no backend
      const mes = item.mes;

      // Se o mês fizer parte dos meses encontrados, adicionar ao array
      if (meses.includes(mes)) {
        dadosPorMes[mes].push(item);
      }
    });

    // Para cada mês, calcular as métricas
    let allMesesCells = "";
    for (const mes of meses) {
      const dadosMes = dadosPorMes[mes] || [];

      // Calcular métricas para este mês específico
      const dentroPrazo = dadosMes.filter(
        (item) => item.tmr_total !== null && parseFloat(item.tmr_total) < 4
      ).length;
      const foraPrazo = dadosMes.filter(
        (item) => item.tmr_total !== null && parseFloat(item.tmr_total) >= 4
      ).length;
      const total = dadosMes.length;
      const percDentroPrazo =
        total > 0 ? ((dentroPrazo / total) * 100).toFixed(2) : 0;
      const tmrMedio =
        total > 0
          ? (
              dadosMes.reduce((sum, item) => sum + (item.tmr_total || 0), 0) /
              total
            ).toFixed(2)
          : 0;

      // Adicionar as 5 colunas para este mês
      allMesesCells += `
                <td class="text-center value-within">${dentroPrazo}</td>
                <td class="text-center value-over">${foraPrazo}</td>
                <td class="text-center perc-dentro-prazo">${percDentroPrazo}%</td>
                <td class="text-center">${total}</td>
                <td class="text-center tmr-value">${tmrMedio}h</td>
            `;
    }

    tableHtml += `
            <tr>
                <td class="fw-bold">${cluster}</td>
                ${allMesesCells}
            </tr>
        `;
  }

  // Adicionar todo o conteúdo ao tbody de uma vez para melhor performance
  $("#tabelaCluster tbody").html(tableHtml);
}

function atualizarTabelaRegional(dados, meses) {
  // Criar o conteúdo da tabela primeiro, depois adicionar ao DOM para melhor performance
  let tableHtml = "";

  // Agrupar dados por regional
  const dadosPorRegional = agruparPorRegional(dados);

  // Preencher a tabela com os dados
  for (const regional in dadosPorRegional) {
    const regionalData = dadosPorRegional[regional];

    // Calcular métricas para cada mês individualmente
    // Primeiro, vamos organizar os dados por mês
    const dadosPorMes = {};

    // Inicializar os meses
    meses.forEach((mes) => {
      dadosPorMes[mes] = [];
    });

    // Agrupar os dados por mês
    regionalData.forEach((item) => {
      // Usar o mês calculado no backend
      const mes = item.mes;

      // Se o mês fizer parte dos meses encontrados, adicionar ao array
      if (meses.includes(mes)) {
        dadosPorMes[mes].push(item);
      }
    });

    // Para cada mês, calcular as métricas
    let allMesesCells = "";
    for (const mes of meses) {
      const dadosMes = dadosPorMes[mes] || [];

      // Calcular métricas para este mês específico
      const dentroPrazo = dadosMes.filter(
        (item) => item.tmr_total !== null && parseFloat(item.tmr_total) < 4
      ).length;
      const foraPrazo = dadosMes.filter(
        (item) => item.tmr_total !== null && parseFloat(item.tmr_total) >= 4
      ).length;
      const total = dadosMes.length;
      const percDentroPrazo =
        total > 0 ? ((dentroPrazo / total) * 100).toFixed(2) : 0;
      const tmrMedio =
        total > 0
          ? (
              dadosMes.reduce((sum, item) => sum + (item.tmr_total || 0), 0) /
              total
            ).toFixed(2)
          : 0;

      // Adicionar as 5 colunas para este mês
      allMesesCells += `
                <td class="text-center value-within">${dentroPrazo}</td>
                <td class="text-center value-over">${foraPrazo}</td>
                <td class="text-center perc-dentro-prazo">${percDentroPrazo}%</td>
                <td class="text-center">${total}</td>
                <td class="text-center tmr-value">${tmrMedio}h</td>
            `;
    }

    tableHtml += `
            <tr>
                <td class="fw-bold">${regional}</td>
                ${allMesesCells}
            </tr>
        `;
  }

  // Adicionar todo o conteúdo ao tbody de uma vez para melhor performance
  $("#tabelaRegional tbody").html(tableHtml);
}

function agruparPorCluster(dados) {
  const agrupado = {};

  dados.forEach((item) => {
    const cluster = item.nom_cluster || "OUTRO";

    if (!agrupado[cluster]) {
      agrupado[cluster] = [];
    }

    agrupado[cluster].push(item);
  });

  return agrupado;
}

function agruparPorRegional(dados) {
  const agrupado = {};

  dados.forEach((item) => {
    const regional = item.regional || "OUTRA";

    if (!agrupado[regional]) {
      agrupado[regional] = [];
    }

    agrupado[regional].push(item);
  });

  return agrupado;
}

function obterUltimos3MesesDosDados(dados) {
  // Extrair todos os meses únicos dos dados
  const mesesUnicos = [...new Set(dados.map((item) => item.mes))];

  // Ordenar os meses em ordem cronológica (assumindo que os meses estão em formato textual)
  const ordemMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Filtrar meses válidos e ordenar de acordo com a ordem cronológica
  const mesesOrdenados = mesesUnicos
    .filter((mes) => ordemMeses.includes(mes))
    .sort((a, b) => ordemMeses.indexOf(a) - ordemMeses.indexOf(b));

  // Pegar os últimos 3 meses, ou todos se houver menos de 3
  const ultimos3Meses = mesesOrdenados.slice(-3);

  // Se tivermos menos de 3 meses, completar com meses anteriores (se necessário)
  return ultimos3Meses;
}

// Função para obter os meses únicos existentes nos dados
function obterMesesUnicos(dados) {
  return [
    ...new Set(
      dados.map((item) => item.mes).filter((mes) => mes && mes !== "")
    ),
  ];
}

// Exibir mensagem de carregamento
function mostrarCarregando(element) {
  element.html(
    '<tr><td colspan="7" class="text-center">Carregando dados...</td></tr>'
  );
}

// Função para formatar números com separador de milhar
function formatarNumero(numero) {
  if (numero === null || numero === undefined) {
    return "";
  }
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Função para verificar se o valor é um número válido
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
