// Funções JavaScript para o sistema de TMR

// Variáveis para armazenar as procedências selecionadas
let procedenciasSelecionadas = ["proativo", "reativo"]; // Começa com os itens padrão selecionados
const procedenciasPadrao = ["proativo", "reativo"]; // Referência para os itens padrão

$(document).ready(function () {
  // Carregar dados iniciais e atualizar cabeçalhos
  carregarDadosTMR();

  // Botão de atualizar na aba de cluster
  $("#atualizarCluster").click(function () {
    // Fechar o dropdown de procedência
    $('#filtroProcedenciaClusterMenu').parent().find('[data-bs-toggle="dropdown"]').dropdown('hide');
    carregarDadosCluster();
  });

  // Botão de atualizar na aba de regional
  $("#atualizarRegional").click(function () {
    // Fechar o dropdown de procedência
    $('#filtroProcedenciaClusterMenu').parent().find('[data-bs-toggle="dropdown"]').dropdown('hide');
    carregarDadosRegional();
  });

  // Botão de atualizar ambas as visões
  $("#atualizarAmbas").click(function () {
    // Fechar o dropdown de procedência
    $('#filtroProcedenciaClusterMenu').parent().find('[data-bs-toggle="dropdown"]').dropdown('hide');
    carregarDadosTMR();
  });

  // Botão de aplicar filtros na aba de cluster
  $("#aplicarFiltrosCluster").click(function () {
    // Fechar o dropdown de procedência
    $('#filtroProcedenciaClusterMenu').parent().find('[data-bs-toggle="dropdown"]').dropdown('hide');
    carregarDadosCluster();
  });

  // Botão de aplicar filtros na aba de regional
  $("#aplicarFiltrosRegional").click(function () {
    // Fechar o dropdown de procedência
    $('#filtroProcedenciaClusterMenu').parent().find('[data-bs-toggle="dropdown"]').dropdown('hide');
    carregarDadosRegional();
  });

  // Botão de sincronização manual de dados
  $("#sincronizarManual").click(function () {
    // Fechar o dropdown de procedência
    $('#filtroProcedenciaClusterMenu').parent().find('[data-bs-toggle="dropdown"]').dropdown('hide');
    sincronizarDadosManually();
  });

  // Botão de sincronização manual de dados para regional
  $("#sincronizarManualRegional").click(function () {
    // Fechar o dropdown de procedência
    $('#filtroProcedenciaClusterMenu').parent().find('[data-bs-toggle="dropdown"]').dropdown('hide');
    sincronizarDadosManually();
  });

  // Filtro de grupo para cluster - atualiza visualmente mas não carrega dados até o botão ser pressionado
  $("#filtroGrupoCluster").change(function () {
    // Apenas atualiza o estado visual do filtro
  });

  // Filtro de regional para cluster - atualiza visualmente mas não carrega dados até o botão ser pressionado
  $("#filtroRegionalCluster").change(function () {
    // Apenas atualiza o estado visual do filtro
  });

  // Filtro de grupo para regional - atualiza visualmente mas não carrega dados até o botão ser pressionado
  $("#filtroGrupoRegional").change(function () {
    // Apenas atualiza o estado visual do filtro
  });

  // Select all functionality
  $('#selectAllProcedencia').change(function () {
    const isChecked = $(this).is(':checked');
    $('.procedencia-checkbox').prop('checked', isChecked);

    if (isChecked) {
      // Add all options to selection
      $('.procedencia-checkbox').each(function () {
        const value = $(this).val();
        if (!procedenciasSelecionadas.includes(value)) {
          procedenciasSelecionadas.push(value);
        }
      });
    } else {
      // Remove all options from selection
      $('.procedencia-checkbox').each(function () {
        const value = $(this).val();
        procedenciasSelecionadas = procedenciasSelecionadas.filter(p => p !== value);
      });
    }

    // Update UI
    $('.procedencia-option').toggleClass('selected', isChecked);
    atualizarRotuloProcedencia();
  });

  // Individual checkbox change
  $(document).on('change', '.procedencia-checkbox', function () {
    const procedencia = $(this).val();
    const isChecked = $(this).is(':checked');

    if (isChecked) {
      if (!procedenciasSelecionadas.includes(procedencia)) {
        procedenciasSelecionadas.push(procedencia);
      }
      $(this).closest('.procedencia-option').addClass('selected');
    } else {
      // Allow unchecking default options
      procedenciasSelecionadas = procedenciasSelecionadas.filter(p => p !== procedencia);
      $(this).closest('.procedencia-option').removeClass('selected');
    }

    // Update "Select All" checkbox state
    const allCheckboxes = $('.procedencia-checkbox');
    const checkedCheckboxes = allCheckboxes.filter(':checked');
    $('#selectAllProcedencia').prop('checked', checkedCheckboxes.length === allCheckboxes.length);

    atualizarRotuloProcedencia();
  });

  // Prevent dropdown from closing when clicking inside
  $('.procedencia-dropdown-menu').click(function (e) {
    e.stopPropagation();
  });
});

// Função para atualizar o rótulo do botão de procedência
function atualizarRotuloProcedencia() {
  if (procedenciasSelecionadas.length === 0) {
    $("#filtroProcedenciaClusterLabel").text("Procedência");
    $("#filtroProcedenciaClusterBtn").removeClass("btn-procedencia-selected");
  } else if (procedenciasSelecionadas.length === 1) {
    $("#filtroProcedenciaClusterLabel").text(procedenciasSelecionadas[0]);
    $("#filtroProcedenciaClusterBtn").addClass("btn-procedencia-selected");
  } else {
    // Mostrar os nomes das procedências selecionadas (limitado a 2 para evitar texto muito longo)
    if (procedenciasSelecionadas.length <= 2) {
      $("#filtroProcedenciaClusterLabel").text(
        procedenciasSelecionadas.join(", ")
      );
    } else {
      $("#filtroProcedenciaClusterLabel").text(
        `${procedenciasSelecionadas.length} selecionadas`
      );
    }
    $("#filtroProcedenciaClusterBtn").addClass("btn-procedencia-selected");
  }

  // Atualizar o estado do checkbox "Selecionar Todos"
  const allCheckboxes = $('.procedencia-checkbox');
  const checkedCheckboxes = allCheckboxes.filter(':checked');
  $('#selectAllProcedencia').prop('checked', checkedCheckboxes.length === allCheckboxes.length);
}

// Função para obter os parâmetros de filtro atuais
function obterParametrosFiltro() {
  const params = {};
  const grupoSelecionadoCluster = $("#filtroGrupoCluster").val();
  const grupoSelecionadoRegional = $("#filtroGrupoRegional").val();
  const regionalSelecionadaCluster = $("#filtroRegionalCluster").val();

  // Usar o grupo selecionado em qualquer uma das abas (como critério para a requisição)
  const grupoSelecionado = grupoSelecionadoCluster || grupoSelecionadoRegional;
  if (grupoSelecionado) {
    params.grupo = grupoSelecionado;
  }

  // Usar a regional selecionada apenas na aba de cluster
  if (regionalSelecionadaCluster) {
    params.regional = regionalSelecionadaCluster;
  }

  // Usar as procedências selecionadas apenas na aba de cluster
  if (procedenciasSelecionadas && procedenciasSelecionadas.length > 0) {
    // Converter array em string separada por vírgulas
    params.procedencia = procedenciasSelecionadas.join(",");
  }

  return params;
}

// Função para resetar aos filtros padrão
function resetarFiltrosPadrao() {
  // Resetar os seletores de grupo e regional
  $("#filtroGrupoCluster").val("");
  $("#filtroGrupoRegional").val("");
  $("#filtroRegionalCluster").val("");

  // Resetar as procedências selecionadas para o padrão
  procedenciasSelecionadas = [...procedenciasPadrao];

  // Atualizar o menu de procedência para refletir as seleções
  // Obter novamente a lista completa de procedências para atualizar o menu
  $.get("/tmr/procedencias", function (procedencias) {
    atualizarMenuProcedenciaCompleto(procedencias);
  });

  // Atualizar o rótulo do botão
  atualizarRotuloProcedencia();
}

// Função para atualizar os cabeçalhos das tabelas com os meses dos dados
function atualizarCabecalhoTabela(meses) {
  // Atualizar cabeçalho da tabela de cluster (com rowspan)
  let headerClusterHtml = '<th rowspan="2">Cluster</th>';

  // Processar meses para determinar quando mostrar o ano
  const mesesProcessados = meses.map((mes) => {
    const [nomeMes, ano] = mes.split(" ");
    return { nomeMes, ano };
  });

  // Identificar anos únicos
  const anosUnicos = [...new Set(mesesProcessados.map((item) => item.ano))];

  mesesProcessados.forEach((mesInfo, index) => {
    let mesDisplay = mesInfo.nomeMes;

    // Se houver mais de um ano nos dados, mostrar o ano para cada mês
    if (anosUnicos.length > 1) {
      mesDisplay = `${mesInfo.nomeMes} ${mesInfo.ano}`;
    } else {
      // Se for o primeiro mês ou o ano mudou em relação ao anterior, mostrar o ano
      if (index === 0 || mesInfo.ano !== mesesProcessados[index - 1].ano) {
        mesDisplay = `${mesInfo.nomeMes} ${mesInfo.ano}`;
      }
    }

    headerClusterHtml += `<th colspan="5">${mesDisplay}</th>`;
  });

  $("#headerCluster").html(headerClusterHtml);

  // Atualizar subcabeçalho da tabela de cluster com rótulos das colunas
  let subheaderClusterHtml = "";
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

  // Atualizar cabeçalho da tabela de regional (com rowspan)
  let headerRegionalHtml = '<th rowspan="2">Regional</th>';

  // Processar meses para determinar quando mostrar o ano
  const mesesProcessadosRegional = meses.map((mes) => {
    const [nomeMes, ano] = mes.split(" ");
    return { nomeMes, ano };
  });

  // Identificar anos únicos
  const anosUnicosRegional = [
    ...new Set(mesesProcessadosRegional.map((item) => item.ano)),
  ];

  mesesProcessadosRegional.forEach((mesInfo, index) => {
    let mesDisplay = mesInfo.nomeMes;

    // Se houver mais de um ano nos dados, mostrar o ano para cada mês
    if (anosUnicosRegional.length > 1) {
      mesDisplay = `${mesInfo.nomeMes} ${mesInfo.ano}`;
    } else {
      // Se for o primeiro mês ou o ano mudou em relação ao anterior, mostrar o ano
      if (
        index === 0 ||
        mesInfo.ano !== mesesProcessadosRegional[index - 1].ano
      ) {
        mesDisplay = `${mesInfo.nomeMes} ${mesInfo.ano}`;
      }
    }

    headerRegionalHtml += `<th colspan="5">${mesDisplay}</th>`;
  });

  $("#headerRegional").html(headerRegionalHtml);

  // Atualizar subcabeçalho da tabela de regional com rótulos das colunas
  let subheaderRegionalHtml = "";
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
  // Mostrar animações de carregamento e ocultar tabelas
  $("#loadingCluster").show();
  $("#tabelaClusterContainer").hide();
  $("#loadingRegional").show();
  $("#tabelaRegionalContainer").hide();

  // Desabilitar botões de filtro durante o carregamento
  desabilitarBotoesFiltro(true);

  // Obter parâmetros de filtro atuais
  const params = obterParametrosFiltro();

  // Fazer as requisições simultaneamente: dados filtrados, lista completa de grupos, regionais e procedências
  $.when(
    $.get("/tmr/data", params),
    $.get("/tmr/grupos"),
    $.get("/tmr/regionais"),
    $.get("/tmr/procedencias")
  )
    .done(function (
      dataResponse,
      gruposResponse,
      regionaisResponse,
      procedenciasResponse
    ) {
      const dados = dataResponse[0]; // Primeiro resultado é a resposta da requisição de dados
      const grupos = gruposResponse[0]; // Segundo resultado é a resposta da requisição de grupos
      const regionais = regionaisResponse[0]; // Terceiro resultado é a resposta da requisição de regionais
      const procedencias = procedenciasResponse[0]; // Quarto resultado é a resposta da requisição de procedências

      // Obter os últimos 3 meses únicos dos dados recebidos
      const meses = obterUltimos3MesesDosDados(dados);

      // Atualizar cabeçalhos com os meses encontrados
      atualizarCabecalhoTabela(meses);

      // Preencher os seletores de grupo com a lista completa de grupos
      atualizarOpcoesGrupoCompleta(
        grupos,
        "filtroGrupoCluster",
        "filtroGrupoRegional"
      );

      // Preencher o seletor de regional com a lista completa de regionais
      atualizarOpcoesRegionalCompleta(regionais, "filtroRegionalCluster");

      // Preencher o menu de procedência com a lista completa de procedências
      atualizarMenuProcedenciaCompleto(procedencias);

      // Atualizar ambas as tabelas com os dados já filtrados no backend
      atualizarTabelaCluster(dados, meses);
      atualizarTabelaRegional(dados, meses);

      // Atualizar o gráfico com os dados atuais
      atualizarGraficoCluster(dados, meses);

      // Após carregar os dados, ocultar animações de carregamento e mostrar tabelas
      $("#loadingCluster").hide();
      $("#tabelaClusterContainer").show();
      $("#loadingRegional").hide();
      $("#tabelaRegionalContainer").show();

      // Reabilitar botões de filtro após o carregamento
      desabilitarBotoesFiltro(false);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#loadingCluster").hide();
      $("#tabelaClusterContainer").show();
      $("#loadingRegional").hide();
      $("#tabelaRegionalContainer").show();

      $("#tabelaCluster tbody").html(
        '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de cluster</td></tr>'
      );
      $("#tabelaRegional tbody").html(
        '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de regional</td></tr>'
      );

      // Reabilitar botões de filtro mesmo em caso de erro
      desabilitarBotoesFiltro(false);

      alert("Erro ao carregar dados de cluster e regional: " + textStatus);
    });
}

function carregarDadosCluster() {
  // Mostrar animação de carregamento e ocultar tabela
  $("#loadingCluster").show();
  $("#tabelaClusterContainer").hide();

  // Desabilitar botões de filtro durante o carregamento
  desabilitarBotoesFiltro(true);

  // Obter parâmetros de filtro atuais
  const params = obterParametrosFiltro();

  // Fazer as requisições simultaneamente: dados filtrados, lista completa de grupos, regionais e procedências
  $.when(
    $.get("/tmr/data", params),
    $.get("/tmr/grupos"),
    $.get("/tmr/regionais"),
    $.get("/tmr/procedencias")
  )
    .done(function (
      dataResponse,
      gruposResponse,
      regionaisResponse,
      procedenciasResponse
    ) {
      const dados = dataResponse[0]; // Primeiro resultado é a resposta da requisição de dados
      const grupos = gruposResponse[0]; // Segundo resultado é a resposta da requisição de grupos
      const regionais = regionaisResponse[0]; // Terceiro resultado é a resposta da requisição de regionais
      const procedencias = procedenciasResponse[0]; // Quarto resultado é a resposta da requisição de procedências

      // Obter os últimos 3 meses únicos dos dados recebidos
      const meses = obterUltimos3MesesDosDados(dados);

      // Atualizar cabeçalhos com os meses encontrados
      atualizarCabecalhoTabela(meses);

      // Preencher os seletores de grupo com a lista completa de grupos
      atualizarOpcoesGrupoCompleta(
        grupos,
        "filtroGrupoCluster",
        "filtroGrupoRegional"
      );

      // Preencher o seletor de regional com a lista completa de regionais
      atualizarOpcoesRegionalCompleta(regionais, "filtroRegionalCluster");

      // Preencher o menu de procedência com a lista completa de procedências
      atualizarMenuProcedenciaCompleto(procedencias);

      atualizarTabelaCluster(dados, meses);

      // Atualizar o gráfico com os dados atuais
      atualizarGraficoCluster(dados, meses);

      // Após carregar os dados, ocultar animação de carregamento e mostrar tabela
      $("#loadingCluster").hide();
      $("#tabelaClusterContainer").show();

      // Reabilitar botões de filtro após o carregamento
      desabilitarBotoesFiltro(false);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#loadingCluster").hide();
      $("#tabelaClusterContainer").show();

      $("#tabelaCluster tbody").html(
        '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de cluster</td></tr>'
      );

      // Reabilitar botões de filtro mesmo em caso de erro
      desabilitarBotoesFiltro(false);

      alert("Erro ao carregar dados de cluster: " + textStatus);
    });
}

function carregarDadosRegional() {
  // Mostrar animação de carregamento e ocultar tabela
  $("#loadingRegional").show();
  $("#tabelaRegionalContainer").hide();

  // Desabilitar botões de filtro durante o carregamento
  desabilitarBotoesFiltro(true);

  // Obter parâmetros de filtro atuais
  const params = obterParametrosFiltro();

  // Fazer as requisições simultaneamente: dados filtrados, lista completa de grupos, regionais e procedências
  $.when(
    $.get("/tmr/data", params),
    $.get("/tmr/grupos"),
    $.get("/tmr/regionais"),
    $.get("/tmr/procedencias")
  )
    .done(function (
      dataResponse,
      gruposResponse,
      regionaisResponse,
      procedenciasResponse
    ) {
      const dados = dataResponse[0]; // Primeiro resultado é a resposta da requisição de dados
      const grupos = gruposResponse[0]; // Segundo resultado é a resposta da requisição de grupos
      const regionais = regionaisResponse[0]; // Terceiro resultado é a resposta da requisição de regionais
      const procedencias = procedenciasResponse[0]; // Quarto resultado é a resposta da requisição de procedências

      // Obter os últimos 3 meses únicos dos dados recebidos (já feito na função de cluster)
      const meses = obterUltimos3MesesDosDados(dados);

      // Atualizar cabeçalhos com os meses encontrados (já deve ter sido feito)
      // atualizarCabecalhoTabela(meses); // Comentado para evitar sobreposição

      // Preencher os seletores de grupo com a lista completa de grupos
      atualizarOpcoesGrupoCompleta(
        grupos,
        "filtroGrupoCluster",
        "filtroGrupoRegional"
      );

      // Preencher o seletor de regional com a lista completa de regionais
      atualizarOpcoesRegionalCompleta(regionais, "filtroRegionalCluster");

      // Preencher o menu de procedência com a lista completa de procedências
      atualizarMenuProcedenciaCompleto(procedencias);

      atualizarTabelaRegional(dados, meses);

      // Após carregar os dados, ocultar animação de carregamento e mostrar tabela
      $("#loadingRegional").hide();
      $("#tabelaRegionalContainer").show();

      // Reabilitar botões de filtro após o carregamento
      desabilitarBotoesFiltro(false);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#loadingRegional").hide();
      $("#tabelaRegionalContainer").show();

      $("#tabelaRegional tbody").html(
        '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de regional</td></tr>'
      );

      // Reabilitar botões de filtro mesmo em caso de erro
      desabilitarBotoesFiltro(false);

      alert("Erro ao carregar dados de regional: " + textStatus);
    });
}

// Função genérica para atualizar tabelas com base em diferentes agrupamentos
function atualizarTabelaGenerico(
  dados,
  meses,
  elementoTabela,
  idTotal,
  agruparFuncao,
  campoAgrupamento
) {
  // Criar o conteúdo da tabela primeiro, depois adicionar ao DOM para melhor performance
  let tableHtml = "";
  let totalCells = '<td class="fw-bold">TOTAL</td>'; // Célula do total para a coluna de agrupamento

  // Agrupar dados usando a função fornecida (os dados já estão filtrados no backend)
  const dadosAgrupados = agruparFuncao(dados);

  // Calcular totais por mês
  const totaisPorMes = {};

  // Inicializar os meses
  meses.forEach((mes) => {
    totaisPorMes[mes] = {
      dentroPrazo: 0,
      foraPrazo: 0,
      total: 0,
      tmrTotal: 0,
      tmrCount: 0,
    };
  });

  // Preencher a tabela com os dados
  for (const agrupamento in dadosAgrupados) {
    const agrupamentoData = dadosAgrupados[agrupamento];

    // Calcular métricas para cada mês individualmente
    // Primeiro, vamos organizar os dados por mês
    const dadosPorMes = {};

    // Inicializar os meses
    meses.forEach((mes) => {
      dadosPorMes[mes] = [];
    });

    // Agrupar os dados por mês
    agrupamentoData.forEach((item) => {
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

      // Atualizar totais por mês
      totaisPorMes[mes].dentroPrazo += dentroPrazo;
      totaisPorMes[mes].foraPrazo += foraPrazo;
      totaisPorMes[mes].total += total;
      totaisPorMes[mes].tmrTotal += dadosMes.reduce(
        (sum, item) => sum + (item.tmr_total || 0),
        0
      );
      totaisPorMes[mes].tmrCount += dadosMes.length;

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
                <td class="fw-bold">${agrupamento}</td>
                ${allMesesCells}
            </tr>
        `;
  }

  // Calcular e adicionar linha de totais
  for (const mes of meses) {
    const mesTotais = totaisPorMes[mes];
    const tmrMedioTotal =
      mesTotais.tmrCount > 0
        ? (mesTotais.tmrTotal / mesTotais.tmrCount).toFixed(2)
        : 0;
    const percDentroPrazoTotal =
      mesTotais.total > 0
        ? ((mesTotais.dentroPrazo / mesTotais.total) * 100).toFixed(2)
        : 0;

    totalCells += `
            <td class="text-center value-within fw-bold">${mesTotais.dentroPrazo}</td>
            <td class="text-center value-over fw-bold">${mesTotais.foraPrazo}</td>
            <td class="text-center perc-dentro-prazo fw-bold">${percDentroPrazoTotal}%</td>
            <td class="text-center fw-bold">${mesTotais.total}</td>
            <td class="text-center tmr-value fw-bold">${tmrMedioTotal}h</td>
        `;
  }

  tableHtml += `<tr id="${idTotal}" class="table-info">${totalCells}</tr>`;

  // Adicionar todo o conteúdo ao tbody de uma vez para melhor performance
  $(elementoTabela).html(tableHtml);
}

function atualizarTabelaCluster(dados, meses) {
  atualizarTabelaGenerico(
    dados,
    meses,
    "#tabelaCluster tbody",
    "totalCluster",
    agruparPorCluster,
    "nom_cluster"
  );

  // Atualizar o gráfico com os dados atuais
  atualizarGraficoCluster(dados, meses);
}

function atualizarTabelaRegional(dados, meses) {
  atualizarTabelaGenerico(
    dados,
    meses,
    "#tabelaRegional tbody",
    "totalRegional",
    agruparPorRegional,
    "regional"
  );
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

  // Ordenar os clusters alfabeticamente (A a Z)
  const agrupadoOrdenado = {};
  Object.keys(agrupado)
    .sort()
    .forEach(key => {
      agrupadoOrdenado[key] = agrupado[key];
    });

  return agrupadoOrdenado;
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

  // Ordenar os meses em ordem cronológica considerando o ano
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

  // Função para extrair mês e ano de uma string no formato "Mês Ano"
  function extrairMesAno(mesStr) {
    const partes = mesStr.split(" ");
    if (partes.length === 2) {
      const mes = partes[0];
      const ano = parseInt(partes[1]);
      return { mes, ano };
    }
    return { mes: mesStr, ano: 0 };
  }

  // Filtrar meses válidos e ordenar de acordo com a ordem cronológica
  const mesesOrdenados = mesesUnicos
    .filter((mes) => {
      const { mes: nomeMes } = extrairMesAno(mes);
      return ordemMeses.includes(nomeMes);
    })
    .sort((a, b) => {
      const { mes: mesA, ano: anoA } = extrairMesAno(a);
      const { mes: mesB, ano: anoB } = extrairMesAno(b);

      // Primeiro compara por ano
      if (anoA !== anoB) {
        return anoA - anoB;
      }
      // Se o ano for igual, compara por mês
      return ordemMeses.indexOf(mesA) - ordemMeses.indexOf(mesB);
    });

  // Pegar os últimos 3 meses, ou todos se houver menos de 3
  const ultimos3Meses = mesesOrdenados.slice(-3);

  // Se tivermos menos de 3 meses, completar com meses anteriores (se necessário)
  return ultimos3Meses;
}

// Função para atualizar as opções do seletor de grupo com a lista completa
function atualizarOpcoesGrupoCompleta(grupos, idSelect1, idSelect2) {
  // Ordenar os grupos alfabeticamente
  grupos.sort();

  // Atualizar ambos os seletores com as mesmas opções
  const seletor1 = $(`#${idSelect1}`);
  const seletor2 = $(`#${idSelect2}`);

  // Salvar valores atuais selecionados
  const valorAtual1 = seletor1.val();
  const valorAtual2 = seletor2.val();

  // Atualizar as opções mantendo os valores atuais selecionados
  atualizarSelectComValoresPreservados(seletor1, grupos, valorAtual1);
  atualizarSelectComValoresPreservados(seletor2, grupos, valorAtual2);
}

// Função auxiliar para atualizar um seletor mantendo o valor selecionado
function atualizarSelectComValoresPreservados(
  seletor,
  novasOpcoes,
  valorAtual
) {
  // Salvar o valor atual
  const valorAntigo = seletor.val();

  // Verificar se é um seletor múltiplo
  const isMultiple = seletor.prop("multiple");

  // Limpar as opções atuais (exceto a primeira que é "Todos os Grupos")
  seletor.find("option:gt(0)").remove();

  // Adicionar novas opções
  novasOpcoes.forEach((opcao) => {
    const option = new Option(opcao, opcao);
    seletor.append(option);
  });

  // Restaurar o valor selecionado, mas manter "Todos os Grupos" se nenhum valor específico foi passado e nenhum estava selecionado anteriormente
  if (valorAtual !== undefined) {
    seletor.val(valorAtual);
  } else if (valorAntigo !== undefined) {
    // Para seletores múltiplos, restaurar array de valores
    if (isMultiple && Array.isArray(valorAntigo)) {
      seletor.val(valorAntigo);
    } else {
      seletor.val(valorAntigo);
    }
  }
  // Caso contrário, mantém o padrão ("Todos os Grupos" que é vazio)
}

// Função para atualizar as opções do seletor de regional com a lista completa
function atualizarOpcoesRegionalCompleta(regionais, idSelect) {
  // Ordenar as regionais alfabeticamente
  regionais.sort();

  // Atualizar o seletor com as opções
  const seletor = $(`#${idSelect}`);

  // Salvar valor atual selecionado
  const valorAtual = seletor.val();

  // Atualizar as opções mantendo o valor atual selecionado
  atualizarSelectComValoresPreservados(seletor, regionais, valorAtual);
}

// Função para atualizar o menu de procedência com a lista completa
function atualizarMenuProcedenciaCompleto(procedencias) {
  // Ordenar as procedências alfabeticamente
  procedencias.sort();

  // Limpar o container de opções
  const container = $('.procedencia-options-container');
  container.empty();

  // Adicionar novos itens de procedência
  procedencias.forEach((procedencia) => {
    const isSelected = procedenciasSelecionadas.includes(procedencia);

    const optionElement = $(`
      <div class="procedencia-option ${isSelected ? 'selected' : ''}">
        <div class="form-check">
          <input class="form-check-input procedencia-checkbox" type="checkbox"
                 value="${procedencia}" id="proc_${procedencia}"
                 ${isSelected ? 'checked' : ''}>
          <label class="form-check-label" for="proc_${procedencia}">
            ${procedencia}
          </label>
        </div>
      </div>
    `);

    container.append(optionElement);
  });

  // Atualizar o rótulo do botão
  atualizarRotuloProcedencia();
}

// Função para criar o gráfico de total de reparos por mês na visão por cluster
function criarGraficoCluster(dados, meses) {
  // Calcular totais por mês
  const totaisPorMes = {};

  // Inicializar os meses
  meses.forEach((mes) => {
    totaisPorMes[mes] = {
      total: 0,
      tmrTotal: 0,
      tmrCount: 0,
    };
  });

  // Agrupar os dados por mês e calcular totais
  dados.forEach((item) => {
    const mes = item.mes;
    if (meses.includes(mes)) {
      totaisPorMes[mes].total += 1; // Contar cada registro
      if (item.tmr_total !== null) {
        totaisPorMes[mes].tmrTotal += parseFloat(item.tmr_total);
        totaisPorMes[mes].tmrCount += 1;
      }
    }
  });

  // Preparar dados para o gráfico
  const labels = meses.map((mes) => {
    // Exibir apenas o nome do mês para manter o gráfico limpo
    return mes.split(" ")[0];
  });

  const totalReparos = meses.map((mes) => totaisPorMes[mes].total);

  // Calcular TMR médio por mês
  const tmrMedioPorMes = meses.map((mes) => {
    const mesData = totaisPorMes[mes];
    return mesData.tmrCount > 0
      ? parseFloat((mesData.tmrTotal / mesData.tmrCount).toFixed(2))
      : 0;
  });

  // Obter o contexto do canvas
  const ctx = document.getElementById("graficoCluster").getContext("2d");

  // Destruir gráfico anterior se existir
  if (window.graficoClusterInstance) {
    window.graficoClusterInstance.destroy();
  }

  // Criar novo gráfico
  window.graficoClusterInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total de Reparos",
          data: totalReparos,
          backgroundColor: "rgba(0, 123, 255, 0.5)", // Azul Bootstrap
          borderColor: "rgba(0, 123, 255, 1)", // Azul Bootstrap
          borderWidth: 1,
          yAxisID: "y",
          order: 2, // Colocar as barras atrás da linha
          datalabels: {
            // Configurações do plugin datalabels para barras
            anchor: "start", //para colocar a label dentro do grafico em baixo é só trocar 'end' por 'start'
            align: "end",
            color: "#000", //para colocar um background branco na label é só colocar backgroundColor: '#fff',
            backgroundColor: "#fff",
            font: {
              weight: "bold",
              size: 11,
            },
            formatter: function (value) {
              return value > 0 ? value : ""; // Mostrar apenas se o valor for maior que 0
            },
          },
        },
        {
          label: "TMR Médio (horas)",
          data: tmrMedioPorMes,
          type: "line",
          fill: false,
          borderColor: "rgba(220, 53, 69, 1)", // Vermelho Bootstrap
          backgroundColor: "rgba(220, 53, 69, 0.2)",
          borderWidth: 3,
          borderDash: [5, 5], // Linha tracejada para distinguir
          yAxisID: "y1",
          pointRadius: 6,
          pointBackgroundColor: "rgba(220, 53, 69, 1)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          order: 1, // Colocar a linha na frente das barras
          datalabels: {
            anchor: "end",
            align: "top",
            color: "#dc3545",
            font: {
              weight: "bold",
              size: 11,
            },
            formatter: function (value) {
              return value > 0 ? value.toFixed(2) + "h" : ""; // Mostrar TMR com 2 casas decimais e sufixo 'h'
            },
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20, // Aumentar o espaçamento superior para afastar a legenda do gráfico
          bottom: 20,
          left: 10,
          right: 10
        }
      },
      scales: {
        y: {
          type: "linear",
          display: false, // Ocultar eixo Y esquerdo
          position: "left",
          title: {
            display: false, // Ocultar título do eixo Y esquerdo
            text: "Total de Reparos",
            font: {
              size: 12,
              weight: "bold",
            },
          },
          grid: {
            display: false, // Remover linhas do grid
          },
          ticks: {
            display: false, // Ocultar rótulos numéricos
            font: {
              size: 11,
            },
          },
        },
        y1: {
          type: "linear",
          display: false, // Ocultar eixo Y direito
          position: "right",
          title: {
            display: false, // Ocultar título do eixo Y direito
            text: "TMR Médio (horas)",
            font: {
              size: 12,
              weight: "bold",
            },
          },
          grid: {
            display: false, // Remover linhas do grid
          },
          ticks: {
            display: false, // Ocultar rótulos numéricos
            font: {
              size: 11,
            },
          },
        },
        x: {
          grid: {
            display: false, // Remover linhas do grid do eixo X
          },
          ticks: {
            font: {
              size: 12,
              weight: "bold",
            },
          },
        },
      },
      plugins: {
        legend: {
          padding: { top: 20, bottom: 30 },
          position: "bottom", //tipos de posicao: top, bottom, left, right
          align: "start", //tipos de alinhamento: start, center, end
          labels: {
            font: {
              size: 12,
              weight: "bold",
            },
            usePointStyle: true,
            padding: 20
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: {
            size: 14,
          },
          bodyFont: {
            size: 13,
          },
          padding: 10,
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
        },
        title: {
          display: false, // Removido título duplicado do gráfico já que temos no card
        },
        datalabels: {
          display: true, // Ativar o plugin datalabels globalmente
        },
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
    plugins: [ChartDataLabels], // Registrar o plugin datalabels
  });
}

// Função para atualizar o gráfico quando os dados forem carregados
function atualizarGraficoCluster(dados, meses) {
  if (dados && meses && meses.length > 0) {
    criarGraficoCluster(dados, meses);
  }
}

// Função para habilitar/desabilitar botões de filtro
function desabilitarBotoesFiltro(desabilitar) {
  const botoesFiltro = [
    "#filtroGrupoCluster",
    "#filtroRegionalCluster",
    "#filtroGrupoRegional",
    "#filtroProcedenciaClusterBtn",
    "#aplicarFiltrosCluster",
    "#aplicarFiltrosRegional"
  ];

  botoesFiltro.forEach(function (seletor) {
    $(seletor).prop('disabled', desabilitar);

    // Adicionar ou remover classe visual para indicar estado desabilitado
    if (desabilitar) {
      $(seletor).addClass('disabled');
    } else {
      $(seletor).removeClass('disabled');
    }
  });
}
