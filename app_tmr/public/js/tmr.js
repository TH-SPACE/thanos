// Funções JavaScript para o sistema de TMR

// Variáveis para armazenar as procedências selecionadas
let procedenciasSelecionadas = ["proativo", "reativo"]; // Começa com os itens padrão selecionados
const procedenciasPadrao = ["proativo", "reativo"]; // Referência para os itens padrão

// Variáveis para armazenar os tipos de cidade selecionados
let tiposCidadeSelecionados = []; // Começa sem itens selecionados

// Variável para armazenar o perfil do usuário
let perfilUsuario = null;

$(document).ready(function () {
  // Carregar dados iniciais e atualizar cabeçalhos
  carregarDadosTMR();

  // Adicionar evento para quando a aba de grupos for ativada
  $("#grupos-tab").on("shown.bs.tab", function (e) {
    console.log("Aba de grupos ativada"); // Log de debug
    carregarDadosGrupos();
  });

  // Botão de atualizar na aba de cluster
  $("#atualizarCluster").click(function () {
    // Fechar o dropdown de procedência
    $("#filtroProcedenciaClusterMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    carregarDadosCluster();
  });

  // Botão de atualizar na aba de regional
  $("#atualizarRegional").click(function () {
    // Fechar o dropdown de procedência
    $("#filtroProcedenciaClusterMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    carregarDadosRegional();
  });

  // Botão de atualizar na aba de grupos
  $("#atualizarGrupos").click(function () {
    console.log("Botão atualizarGrupos clicado"); // Log de debug
    // Fechar o dropdown de procedência
    $("#filtroProcedenciaGruposMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    carregarDadosGrupos();
  });

  // Botão de atualizar ambas as visões
  $("#atualizarAmbas").click(function () {
    // Verificar se o usuário tem permissão para executar esta ação
    if (typeof window.perfilUsuario === 'undefined' || !window.perfilUsuario.includes("ADM")) {
      alert("Você não tem permissão para executar esta ação.");
      return;
    }

    // Fechar o dropdown de procedência
    $("#filtroProcedenciaClusterMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    carregarDadosTMR();
  });

  // Botão de aplicar filtros na aba de cluster
  $("#aplicarFiltrosCluster").click(function () {
    // Fechar o dropdown de procedência
    $("#filtroProcedenciaClusterMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    carregarDadosCluster();
  });

  // Botão de aplicar filtros na aba de regional
  $("#aplicarFiltrosRegional").click(function () {
    // Fechar o dropdown de procedência
    $("#filtroProcedenciaRegionalMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    carregarDadosRegional();
  });

  // Botão de aplicar filtros na aba de grupos
  $("#aplicarFiltrosGrupos").click(function () {
    // Fechar o dropdown de procedência
    $("#filtroProcedenciaGruposMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    carregarDadosGrupos();
  });

  // Botão de sincronização manual de dados
  $("#sincronizarManual").click(function () {
    // Verificar se o usuário tem permissão para executar esta ação
    if (typeof window.perfilUsuario === 'undefined' || !window.perfilUsuario.includes("ADM")) {
      alert("Você não tem permissão para executar esta ação.");
      return;
    }

    // Fechar o dropdown de procedência
    $("#filtroProcedenciaClusterMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    sincronizarDadosManually();
  });

  // Botão de sincronização manual de dados para regional
  $("#sincronizarManualRegional").click(function () {
    // Verificar se o usuário tem permissão para executar esta ação
    if (typeof window.perfilUsuario === 'undefined' || !window.perfilUsuario.includes("ADM")) {
      alert("Você não tem permissão para executar esta ação.");
      return;
    }

    // Fechar o dropdown de procedência
    $("#filtroProcedenciaClusterMenu")
      .parent()
      .find('[data-bs-toggle="dropdown"]')
      .dropdown("hide");
    sincronizarDadosManually();
  });

  // Botão de resetar filtros na aba de cluster
  $("#resetarFiltrosCluster").click(function () {
    resetarFiltrosPadrao();
    carregarDadosCluster();
  });

  // Botão de resetar filtros na aba de regional
  $("#resetarFiltrosRegional").click(function () {
    resetarFiltrosPadrao();
    carregarDadosRegional();
  });

  // Botão de resetar filtros na aba de grupos
  $("#resetarFiltrosGrupos").click(function () {
    resetarFiltrosPadrao();
    carregarDadosGrupos();
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

  // Filtro de regional para grupos - atualiza visualmente mas não carrega dados até o botão ser pressionado
  $("#filtroRegionalGrupos").change(function () {
    // Apenas atualiza o estado visual do filtro
  });

  // Select all functionality for grupos tab
  $("#selectAllProcedenciaGrupos").change(function () {
    const isChecked = $(this).is(":checked");
    $(".procedencia-checkbox-grupos").prop("checked", isChecked);

    if (isChecked) {
      // Add all options to selection
      $(".procedencia-checkbox-grupos").each(function () {
        const value = $(this).val();
        if (!procedenciasSelecionadas.includes(value)) {
          procedenciasSelecionadas.push(value);
        }
      });
    } else {
      // Remove all options from selection
      $(".procedencia-checkbox-grupos").each(function () {
        const value = $(this).val();
        procedenciasSelecionadas = procedenciasSelecionadas.filter(
          (p) => p !== value
        );
      });
    }

    // Update UI
    $(".procedencia-option-grupos").toggleClass("selected", isChecked);
    atualizarRotuloProcedenciaGrupos();
  });

  // Select all functionality for cluster tab
  $("#selectAllProcedencia").change(function () {
    const isChecked = $(this).is(":checked");
    $(".procedencia-checkbox").prop("checked", isChecked);

    if (isChecked) {
      // Add all options to selection
      $(".procedencia-checkbox").each(function () {
        const value = $(this).val();
        if (!procedenciasSelecionadas.includes(value)) {
          procedenciasSelecionadas.push(value);
        }
      });
    } else {
      // Remove all options from selection
      $(".procedencia-checkbox").each(function () {
        const value = $(this).val();
        procedenciasSelecionadas = procedenciasSelecionadas.filter(
          (p) => p !== value
        );
      });
    }

    // Update UI
    $(".procedencia-option").toggleClass("selected", isChecked);
    atualizarRotuloProcedencia();
  });

  // Select all functionality for regional tab
  $("#selectAllProcedenciaRegional").change(function () {
    const isChecked = $(this).is(":checked");
    $(".procedencia-checkbox-regional").prop("checked", isChecked);

    if (isChecked) {
      // Add all options to selection
      $(".procedencia-checkbox-regional").each(function () {
        const value = $(this).val();
        if (!procedenciasSelecionadas.includes(value)) {
          procedenciasSelecionadas.push(value);
        }
      });
    } else {
      // Remove all options from selection
      $(".procedencia-checkbox-regional").each(function () {
        const value = $(this).val();
        procedenciasSelecionadas = procedenciasSelecionadas.filter(
          (p) => p !== value
        );
      });
    }

    // Update UI
    $(".procedencia-option-regional").toggleClass("selected", isChecked);
    atualizarRotuloProcedenciaRegional();
  });

  // Individual checkbox change for grupos tab
  $(document).on("change", ".procedencia-checkbox-grupos", function () {
    const procedencia = $(this).val();
    const isChecked = $(this).is(":checked");

    if (isChecked) {
      if (!procedenciasSelecionadas.includes(procedencia)) {
        procedenciasSelecionadas.push(procedencia);
      }
      $(this).closest(".procedencia-option-grupos").addClass("selected");
    } else {
      // Allow unchecking default options
      procedenciasSelecionadas = procedenciasSelecionadas.filter(
        (p) => p !== procedencia
      );
      $(this).closest(".procedencia-option-grupos").removeClass("selected");
    }

    // Update "Select All" checkbox state
    const allCheckboxes = $(".procedencia-checkbox-grupos");
    const checkedCheckboxes = allCheckboxes.filter(":checked");
    $("#selectAllProcedenciaGrupos").prop(
      "checked",
      checkedCheckboxes.length === allCheckboxes.length
    );

    atualizarRotuloProcedenciaGrupos();
  });

  // Individual checkbox change for cluster tab
  $(document).on("change", ".procedencia-checkbox", function () {
    const procedencia = $(this).val();
    const isChecked = $(this).is(":checked");

    if (isChecked) {
      if (!procedenciasSelecionadas.includes(procedencia)) {
        procedenciasSelecionadas.push(procedencia);
      }
      $(this).closest(".procedencia-option").addClass("selected");
    } else {
      // Allow unchecking default options
      procedenciasSelecionadas = procedenciasSelecionadas.filter(
        (p) => p !== procedencia
      );
      $(this).closest(".procedencia-option").removeClass("selected");
    }

    // Update "Select All" checkbox state
    const allCheckboxes = $(".procedencia-checkbox");
    const checkedCheckboxes = allCheckboxes.filter(":checked");
    $("#selectAllProcedencia").prop(
      "checked",
      checkedCheckboxes.length === allCheckboxes.length
    );

    atualizarRotuloProcedencia();
  });

  // Individual checkbox change for regional tab
  $(document).on("change", ".procedencia-checkbox-regional", function () {
    const procedencia = $(this).val();
    const isChecked = $(this).is(":checked");

    if (isChecked) {
      if (!procedenciasSelecionadas.includes(procedencia)) {
        procedenciasSelecionadas.push(procedencia);
      }
      $(this).closest(".procedencia-option-regional").addClass("selected");
    } else {
      // Allow unchecking default options
      procedenciasSelecionadas = procedenciasSelecionadas.filter(
        (p) => p !== procedencia
      );
      $(this).closest(".procedencia-option-regional").removeClass("selected");
    }

    // Update "Select All" checkbox state
    const allCheckboxes = $(".procedencia-checkbox-regional");
    const checkedCheckboxes = allCheckboxes.filter(":checked");
    $("#selectAllProcedenciaRegional").prop(
      "checked",
      checkedCheckboxes.length === allCheckboxes.length
    );

    atualizarRotuloProcedenciaRegional();
  });

  // Prevent dropdown from closing when clicking inside
  $(".procedencia-dropdown-menu").click(function (e) {
    e.stopPropagation();
  });

  // Select all functionality for tipo cidade
  $("#selectAllTipoCidade").change(function () {
    const isChecked = $(this).is(":checked");
    $(".tipo-cidade-checkbox").prop("checked", isChecked);

    if (isChecked) {
      // Add all options to selection
      $(".tipo-cidade-checkbox").each(function () {
        const value = $(this).val();
        if (!tiposCidadeSelecionados.includes(value)) {
          tiposCidadeSelecionados.push(value);
        }
      });
    } else {
      // Remove all options from selection
      $(".tipo-cidade-checkbox").each(function () {
        const value = $(this).val();
        tiposCidadeSelecionados = tiposCidadeSelecionados.filter(
          (p) => p !== value
        );
      });
    }

    // Update UI
    $(".tipo-cidade-option").toggleClass("selected", isChecked);
    atualizarRotuloTipoCidade();
  });

  // Individual checkbox change for tipo cidade
  $(document).on("change", ".tipo-cidade-checkbox", function () {
    const tipoCidade = $(this).val();
    const isChecked = $(this).is(":checked");

    if (isChecked) {
      if (!tiposCidadeSelecionados.includes(tipoCidade)) {
        tiposCidadeSelecionados.push(tipoCidade);
      }
      $(this).closest(".tipo-cidade-option").addClass("selected");
    } else {
      tiposCidadeSelecionados = tiposCidadeSelecionados.filter(
        (p) => p !== tipoCidade
      );
      $(this).closest(".tipo-cidade-option").removeClass("selected");
    }

    // Update "Select All" checkbox state
    const allCheckboxes = $(".tipo-cidade-checkbox");
    const checkedCheckboxes = allCheckboxes.filter(":checked");
    $("#selectAllTipoCidade").prop(
      "checked",
      checkedCheckboxes.length === allCheckboxes.length
    );

    atualizarRotuloTipoCidade();
  });

  // Prevent dropdown from closing when clicking inside
  $(".tipo-cidade-dropdown-menu").click(function (e) {
    e.stopPropagation();
  });
});

// Função para atualizar o rótulo do botão de procedência para a aba de grupos
function atualizarRotuloProcedenciaGrupos() {
  if (procedenciasSelecionadas.length === 0) {
    $("#filtroProcedenciaGruposLabel").text("Procedência");
    $("#filtroProcedenciaGruposBtn").removeClass("btn-procedencia-selected");
  } else if (procedenciasSelecionadas.length === 1) {
    $("#filtroProcedenciaGruposLabel").text(procedenciasSelecionadas[0]);
    $("#filtroProcedenciaGruposBtn").addClass("btn-procedencia-selected");
  } else {
    // Mostrar os nomes das procedências selecionadas (limitado a 2 para evitar texto muito longo)
    if (procedenciasSelecionadas.length <= 2) {
      $("#filtroProcedenciaGruposLabel").text(
        procedenciasSelecionadas.join(", ")
      );
    } else {
      $("#filtroProcedenciaGruposLabel").text(
        `${procedenciasSelecionadas.length} selecionadas`
      );
    }
    $("#filtroProcedenciaGruposBtn").addClass("btn-procedencia-selected");
  }

  // Atualizar o estado do checkbox "Selecionar Todos"
  const allCheckboxes = $(".procedencia-checkbox-grupos");
  const checkedCheckboxes = allCheckboxes.filter(":checked");
  $("#selectAllProcedenciaGrupos").prop(
    "checked",
    checkedCheckboxes.length === allCheckboxes.length
  );
}

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
  const allCheckboxes = $(".procedencia-checkbox");
  const checkedCheckboxes = allCheckboxes.filter(":checked");
  $("#selectAllProcedencia").prop(
    "checked",
    checkedCheckboxes.length === allCheckboxes.length
  );
}

// Função para atualizar o rótulo do botão de procedência para a aba de regional
function atualizarRotuloProcedenciaRegional() {
  if (procedenciasSelecionadas.length === 0) {
    $("#filtroProcedenciaRegionalLabel").text("Procedência");
    $("#filtroProcedenciaRegionalBtn").removeClass("btn-procedencia-selected");
  } else if (procedenciasSelecionadas.length === 1) {
    $("#filtroProcedenciaRegionalLabel").text(procedenciasSelecionadas[0]);
    $("#filtroProcedenciaRegionalBtn").addClass("btn-procedencia-selected");
  } else {
    // Mostrar os nomes das procedências selecionadas (limitado a 2 para evitar texto muito longo)
    if (procedenciasSelecionadas.length <= 2) {
      $("#filtroProcedenciaRegionalLabel").text(
        procedenciasSelecionadas.join(", ")
      );
    } else {
      $("#filtroProcedenciaRegionalLabel").text(
        `${procedenciasSelecionadas.length} selecionadas`
      );
    }
    $("#filtroProcedenciaRegionalBtn").addClass("btn-procedencia-selected");
  }

  // Atualizar o estado do checkbox "Selecionar Todos"
  const allCheckboxes = $(".procedencia-checkbox-regional");
  const checkedCheckboxes = allCheckboxes.filter(":checked");
  $("#selectAllProcedenciaRegional").prop(
    "checked",
    checkedCheckboxes.length === allCheckboxes.length
  );
}

// Função para atualizar o rótulo do botão de tipo de cidade
function atualizarRotuloTipoCidade() {
  if (tiposCidadeSelecionados.length === 0) {
    $("#filtroTipoCidadeClusterLabel").text("Tipo de Cidade");
    $("#filtroTipoCidadeClusterBtn").removeClass("btn-tipo-cidade-selected");
  } else if (tiposCidadeSelecionados.length === 1) {
    $("#filtroTipoCidadeClusterLabel").text(tiposCidadeSelecionados[0]);
    $("#filtroTipoCidadeClusterBtn").addClass("btn-tipo-cidade-selected");
  } else {
    // Mostrar os nomes dos tipos de cidade selecionados (limitado a 2 para evitar texto muito longo)
    if (tiposCidadeSelecionados.length <= 2) {
      $("#filtroTipoCidadeClusterLabel").text(
        tiposCidadeSelecionados.join(", ")
      );
    } else {
      $("#filtroTipoCidadeClusterLabel").text(
        `${tiposCidadeSelecionados.length} selecionados`
      );
    }
    $("#filtroTipoCidadeClusterBtn").addClass("btn-tipo-cidade-selected");
  }

  // Atualizar o estado do checkbox "Selecionar Todos"
  const allCheckboxes = $(".tipo-cidade-checkbox");
  const checkedCheckboxes = allCheckboxes.filter(":checked");
  $("#selectAllTipoCidade").prop(
    "checked",
    checkedCheckboxes.length === allCheckboxes.length
  );
}

// Função para carregar dados da aba de grupos
function carregarDadosGrupos() {
  // Mostrar animação de carregamento e ocultar tabela
  $("#loadingGrupos").show();
  $("#tabelaGruposContainer").hide();

  // Desabilitar botões de filtro durante o carregamento
  desabilitarBotoesFiltro(true);

  // Obter parâmetros de filtro atuais
  const params = obterParametrosFiltroGrupos();

  // Fazer as requisições simultaneamente: dados filtrados, lista completa de grupos, regionais e procedências
  $.when(
    $.get("/tmr/grupos/grupos-data", params),
    $.get("/tmr/grupos-lista"),
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

      console.log("Dados recebidos para grupos:", dados); // Log de debug
      console.log(
        "Meses encontrados:",
        dados.length > 0 ? Object.keys(dados[0].meses) : []
      ); // Log de debug

      // Obter os últimos 3 meses únicos dos dados recebidos
      const meses = obterUltimos3MesesDosDadosGrupos(dados);
      console.log("Meses processados:", meses); // Log de debug

      // Atualizar cabeçalhos com os meses encontrados
      atualizarCabecalhoTabelaGrupos(meses);

      // Preencher o seletor de regional com a lista completa de regionais
      atualizarOpcoesRegionalCompleta(regionais, "filtroRegionalGrupos");

      // Preencher o menu de procedência com a lista completa de procedências
      atualizarMenuProcedenciaCompletoGrupos(procedencias);

      atualizarTabelaGrupos(dados, meses);

      // Após carregar os dados, ocultar animação de carregamento e mostrar tabela
      $("#loadingGrupos").hide();
      $("#tabelaGruposContainer").show();

      // Reabilitar botões de filtro após o carregamento
      desabilitarBotoesFiltro(false);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error("Erro nas requisições:", jqXHR, textStatus, errorThrown); // Log de debug
      $("#loadingGrupos").hide();
      $("#tabelaGruposContainer").show();

      $("#tabelaGrupos tbody").html(
        '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de grupos</td></tr>'
      );

      // Reabilitar botões de filtro mesmo em caso de erro
      desabilitarBotoesFiltro(false);

      // Exibir mensagem de erro no elemento de status
      const mensagemErro = "Erro ao carregar dados de grupos: " + textStatus;
      $("#statusMensagemGrupos").text(mensagemErro).addClass("text-danger");
    });
}

// Função para obter os parâmetros de filtro atuais para a aba de grupos
function obterParametrosFiltroGrupos() {
  const params = {};
  const regionalSelecionadaGrupos = $("#filtroRegionalGrupos").val();

  // Usar a regional selecionada na aba de grupos
  if (regionalSelecionadaGrupos) {
    params.regional = regionalSelecionadaGrupos;
  }

  // Usar as procedências selecionadas na aba de grupos
  if (procedenciasSelecionadas && procedenciasSelecionadas.length > 0) {
    // Converter array em string separada por vírgulas
    params.procedencia = procedenciasSelecionadas.join(",");
  }

  return params;
}

// Função para obter os últimos 3 meses únicos dos dados recebidos para a aba de grupos
function obterUltimos3MesesDosDadosGrupos(dados) {
  // Extrair todos os meses únicos dos dados
  const mesesUnicos = [
    ...new Set(dados.flatMap((item) => Object.keys(item.meses))),
  ];

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

// Função para atualizar os cabeçalhos das tabelas com os meses dos dados para a aba de grupos
function atualizarCabecalhoTabelaGrupos(meses) {
  // Atualizar cabeçalho da tabela de grupos (com rowspan)
  let headerGruposHtml = '<th rowspan="2">Grupo</th>';

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

    headerGruposHtml += `<th colspan="2">${mesDisplay}</th>`;
  });

  $("#headerGrupos").html(headerGruposHtml);

  // Atualizar subcabeçalho da tabela de grupos com rótulos das colunas
  let subheaderGruposHtml = "";
  meses.forEach((mes) => {
    subheaderGruposHtml += `
            <th>Qtde. Reparos</th>
            <th>TMR Médio</th>
        `;
  });
  $("#subheaderGrupos").html(subheaderGruposHtml);
}

// Função para atualizar o menu de procedência com a lista completa para a aba de grupos
function atualizarMenuProcedenciaCompletoGrupos(procedencias) {
  // Ordenar as procedências alfabeticamente
  procedencias.sort();

  // Limpar o container de opções
  const container = $(".procedencia-options-container-grupos");
  container.empty();

  // Adicionar novos itens de procedência
  procedencias.forEach((procedencia) => {
    const isSelected = procedenciasSelecionadas.includes(procedencia);

    const optionElement = $(`
      <div class="procedencia-option-grupos ${isSelected ? "selected" : ""}">
        <div class="form-check">
          <input class="form-check-input procedencia-checkbox-grupos" type="checkbox"
                 value="${procedencia}" id="proc_grupos_${procedencia}"
                 ${isSelected ? "checked" : ""}>
          <label class="form-check-label" for="proc_grupos_${procedencia}">
            ${procedencia}
          </label>
        </div>
      </div>
    `);

    container.append(optionElement);
  });

  // Atualizar o rótulo do botão
  atualizarRotuloProcedenciaGrupos();
}

// Função para atualizar tabela de grupos
function atualizarTabelaGrupos(dados, meses) {
  console.log(
    "Atualizando tabela de grupos com",
    dados.length,
    "grupos e meses:",
    meses
  ); // Log de debug

  // Criar o conteúdo da tabela primeiro, depois adicionar ao DOM para melhor performance
  let tableHtml = "";

  // Verificar se há dados para processar
  if (!dados || dados.length === 0) {
    console.log("Nenhum dado encontrado para grupos"); // Log de debug
    tableHtml =
      '<tr><td colspan="' +
      (1 + meses.length * 2) +
      '" class="text-center">Nenhum dado encontrado</td></tr>';
  } else {
    console.log("Processando", dados.length, "grupos"); // Log de debug

    // Preencher a tabela com os dados
    for (const item of dados) {
      console.log(
        "Processando grupo:",
        item.grupo,
        "com meses:",
        Object.keys(item.meses)
      ); // Log de debug
      const grupo = item.grupo;

      // Calcular métricas para cada mês individualmente
      let allMesesCells = "";
      for (const mes of meses) {
        const mesData = item.meses[mes] || { qtde_reparos: 0, tmr_medio: 0 };
        console.log("  Mês:", mes, "Dados:", mesData); // Log de debug

        // Adicionar as 2 colunas para este mês
        allMesesCells += `
                  <td class="text-center">${mesData.qtde_reparos}</td>
                  <td class="text-center">${mesData.tmr_medio}h</td>
              `;
      }

      tableHtml += `
              <tr>
                  <td class="fw-bold">${grupo}</td>
                  ${allMesesCells}
              </tr>
          `;
    }
  }

  console.log("HTML da tabela gerado:", tableHtml); // Log de debug

  // Adicionar todo o conteúdo ao tbody de uma vez para melhor performance
  $("#tabelaGrupos tbody").html(tableHtml);

  console.log("Tabela atualizada com sucesso"); // Log de debug
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

  // Usar as procedências selecionadas (agora aplicável a todas as abas)
  if (procedenciasSelecionadas && procedenciasSelecionadas.length > 0) {
    // Converter array em string separada por vírgulas
    params.procedencia = procedenciasSelecionadas.join(",");
  }

  // Usar os tipos de cidade selecionados apenas na aba de cluster
  if (tiposCidadeSelecionados && tiposCidadeSelecionados.length > 0) {
    // Converter array em string separada por vírgulas
    params.tipo_cidade = tiposCidadeSelecionados.join(",");
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

  // Resetar os tipos de cidade selecionados
  tiposCidadeSelecionados = [];

  // Atualizar o menu de procedência para refletir as seleções
  // Obter novamente a lista completa de procedências para atualizar o menu
  $.get("/tmr/procedencias", function (procedencias) {
    atualizarMenuProcedenciaCompleto(procedencias);
    atualizarMenuProcedenciaCompletoRegional(procedencias);
  });

  // Atualizar o menu de tipo de cidade para refletir as seleções
  // Obter novamente a lista completa de tipos de cidade para atualizar o menu
  $.get("/tmr/tipos-cidade", function (tiposCidade) {
    atualizarMenuTipoCidadeCompleto(tiposCidade);
  });

  // Atualizar os rótulos dos botões
  atualizarRotuloProcedencia();
  atualizarRotuloProcedenciaRegional();
  atualizarRotuloTipoCidade();
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
      // Exibir mensagem de erro no elemento de status
      const mensagemErro = "Erro ao sincronizar dados: " +
        (xhr.responseJSON && xhr.responseJSON.error
          ? xhr.responseJSON.error
          : error);
      $("#statusMensagemCluster").text(mensagemErro).addClass("text-danger");
      $("#statusMensagemRegional").text(mensagemErro).addClass("text-danger");
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

  // Fazer as requisições simultaneamente: dados filtrados, lista completa de grupos, regionais, procedências e tipos de cidade
  $.when(
    $.get("/tmr/data", params),
    $.get("/tmr/grupos-lista"),
    $.get("/tmr/regionais"),
    $.get("/tmr/procedencias"),
    $.get("/tmr/tipos-cidade")
  )
    .done(function (
      dataResponse,
      gruposResponse,
      regionaisResponse,
      procedenciasResponse,
      tiposCidadeResponse
    ) {
      const dados = dataResponse[0]; // Primeiro resultado é a resposta da requisição de dados
      const grupos = gruposResponse[0]; // Segundo resultado é a resposta da requisição de grupos
      const regionais = regionaisResponse[0]; // Terceiro resultado é a resposta da requisição de regionais
      const procedencias = procedenciasResponse[0]; // Quarto resultado é a resposta da requisição de procedências
      const tiposCidade = tiposCidadeResponse[0]; // Quinto resultado é a resposta da requisição de tipos de cidade

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

      // Preencher o menu de tipo de cidade com a lista completa de tipos de cidade
      atualizarMenuTipoCidadeCompleto(tiposCidade);

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
      $("#tabelaRegionalTotalContainer").show();

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
      $("#tabelaRegionalTotal tbody").html(
        '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de regional</td></tr>'
      );

      // Reabilitar botões de filtro mesmo em caso de erro
      desabilitarBotoesFiltro(false);

      // Exibir mensagem de erro nos elementos de status
      const mensagemErro = "Erro ao carregar dados de cluster e regional: " + textStatus;
      $("#statusMensagemCluster").text(mensagemErro).addClass("text-danger");
      $("#statusMensagemRegional").text(mensagemErro).addClass("text-danger");
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

  // Fazer as requisições simultaneamente: dados filtrados, lista completa de grupos, regionais, procedências e tipos de cidade
  $.when(
    $.get("/tmr/data", params),
    $.get("/tmr/grupos-lista"),
    $.get("/tmr/regionais"),
    $.get("/tmr/procedencias"),
    $.get("/tmr/tipos-cidade")
  )
    .done(function (
      dataResponse,
      gruposResponse,
      regionaisResponse,
      procedenciasResponse,
      tiposCidadeResponse
    ) {
      const dados = dataResponse[0]; // Primeiro resultado é a resposta da requisição de dados
      const grupos = gruposResponse[0]; // Segundo resultado é a resposta da requisição de grupos
      const regionais = regionaisResponse[0]; // Terceiro resultado é a resposta da requisição de regionais
      const procedencias = procedenciasResponse[0]; // Quarto resultado é a resposta da requisição de procedências
      const tiposCidade = tiposCidadeResponse[0]; // Quinto resultado é a resposta da requisição de tipos de cidade

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

      // Preencher o menu de tipo de cidade com a lista completa de tipos de cidade
      atualizarMenuTipoCidadeCompleto(tiposCidade);

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

      // Exibir mensagem de erro no elemento de status
      const mensagemErro = "Erro ao carregar dados de cluster: " + textStatus;
      $("#statusMensagemCluster").text(mensagemErro).addClass("text-danger");
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

  // Fazer as requisições simultaneamente: dados filtrados, lista completa de grupos, regionais, procedências e tipos de cidade
  $.when(
    $.get("/tmr/data", params),
    $.get("/tmr/grupos-lista"),
    $.get("/tmr/regionais"),
    $.get("/tmr/procedencias"),
    $.get("/tmr/tipos-cidade")
  )
    .done(function (
      dataResponse,
      gruposResponse,
      regionaisResponse,
      procedenciasResponse,
      tiposCidadeResponse
    ) {
      const dados = dataResponse[0]; // Primeiro resultado é a resposta da requisição de dados
      const grupos = gruposResponse[0]; // Segundo resultado é a resposta da requisição de grupos
      const regionais = regionaisResponse[0]; // Terceiro resultado é a resposta da requisição de regionais
      const procedencias = procedenciasResponse[0]; // Quarto resultado é a resposta da requisição de procedências
      const tiposCidade = tiposCidadeResponse[0]; // Quinto resultado é a resposta da requisição de tipos de cidade

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
      atualizarMenuProcedenciaCompletoRegional(procedencias);

      // Preencher o menu de tipo de cidade com a lista completa de tipos de cidade
      atualizarMenuTipoCidadeCompleto(tiposCidade);

      atualizarTabelaRegional(dados, meses);

      // Após carregar os dados, ocultar animação de carregamento e mostrar tabelas
      $("#loadingRegional").hide();
      $("#tabelaRegionalContainer").show();
      $("#tabelaRegionalTotalContainer").show();

      // Reabilitar botões de filtro após o carregamento
      desabilitarBotoesFiltro(false);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#loadingRegional").hide();
      $("#tabelaRegionalContainer").show();

      $("#tabelaRegional tbody").html(
        '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de regional</td></tr>'
      );
      $("#tabelaRegionalTotal tbody").html(
        '<tr><td colspan="100" class="text-center text-danger p-4">Erro ao carregar dados de regional</td></tr>'
      );

      // Reabilitar botões de filtro mesmo em caso de erro
      desabilitarBotoesFiltro(false);

      // Exibir mensagem de erro no elemento de status
      const mensagemErro = "Erro ao carregar dados de regional: " + textStatus;
      $("#statusMensagemRegional").text(mensagemErro).addClass("text-danger");
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
  // Usar a nova função de agrupamento para regional e tipo de cidade
  atualizarTabelaRegionalComTipoCidade(dados, meses);
}

// Função específica para atualizar a tabela regional com distinção entre CAPITAL e INTERIOR
function atualizarTabelaRegionalComTipoCidade(dados, meses) {
  // Agrupar dados por regional e tipo de cidade
  const dadosAgrupados = agruparPorRegionalETipoCidade(dados);

  // Criar o conteúdo da tabela primeiro, depois adicionar ao DOM para melhor performance
  let tableHtml = "";
  let totalCells = '<td class="fw-bold">TOTAL</td>'; // Célula do total geral para a coluna de agrupamento

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
  for (const regional in dadosAgrupados) {
    const dadosRegional = dadosAgrupados[regional];

    // Calcular totais por mês para esta regional específica
    const totaisRegionalPorMes = {};
    meses.forEach((mes) => {
      totaisRegionalPorMes[mes] = {
        dentroPrazo: 0,
        foraPrazo: 0,
        total: 0,
        tmrTotal: 0,
        tmrCount: 0,
      };
    });

    // Calcular métricas para cada mês individualmente para a regional completa (somando CAPITAL e INTERIOR)
    const dadosRegionalCompleta = [
      ...dadosRegional["CAPITAL"],
      ...dadosRegional["INTERIOR"],
    ];

    // Primeiro, vamos organizar os dados por mês para a regional completa
    const dadosPorMesRegional = {};
    meses.forEach((mes) => {
      dadosPorMesRegional[mes] = [];
    });

    dadosRegionalCompleta.forEach((item) => {
      const mes = item.mes;
      if (meses.includes(mes)) {
        dadosPorMesRegional[mes].push(item);
      }
    });

    // Calcular as métricas para a regional completa
    let allMesesCellsRegional = "";
    for (const mes of meses) {
      const dadosMes = dadosPorMesRegional[mes] || [];

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

      // Atualizar totais por mês para esta regional
      totaisRegionalPorMes[mes].dentroPrazo += dentroPrazo;
      totaisRegionalPorMes[mes].foraPrazo += foraPrazo;
      totaisRegionalPorMes[mes].total += total;
      totaisRegionalPorMes[mes].tmrTotal += dadosMes.reduce(
        (sum, item) => sum + (item.tmr_total || 0),
        0
      );
      totaisRegionalPorMes[mes].tmrCount += dadosMes.length;

      // Atualizar totais por mês para o total geral
      totaisPorMes[mes].dentroPrazo += dentroPrazo;
      totaisPorMes[mes].foraPrazo += foraPrazo;
      totaisPorMes[mes].total += total;
      totaisPorMes[mes].tmrTotal += dadosMes.reduce(
        (sum, item) => sum + (item.tmr_total || 0),
        0
      );
      totaisPorMes[mes].tmrCount += dadosMes.length;

      // Adicionar as 5 colunas para este mês
      allMesesCellsRegional += `
                <td class="text-center value-within">${dentroPrazo}</td>
                <td class="text-center value-over">${foraPrazo}</td>
                <td class="text-center perc-dentro-prazo">${percDentroPrazo}%</td>
                <td class="text-center">${total}</td>
                <td class="text-center tmr-value">${tmrMedio}h</td>
            `;
    }

    // Adicionar linha com os valores totais da regional
    tableHtml += `
            <tr>
                <td class="fw-bold">${regional}</td>
                ${allMesesCellsRegional}
            </tr>
        `;

    // Adicionar linhas para CAPITAL e INTERIOR abaixo da linha principal da regional
    for (const tipoCidade of ["CAPITAL", "INTERIOR"]) {
      const dadosTipoCidade = dadosRegional[tipoCidade] || [];

      // Calcular métricas para cada mês individualmente
      // Primeiro, vamos organizar os dados por mês
      const dadosPorMes = {};

      // Inicializar os meses
      meses.forEach((mes) => {
        dadosPorMes[mes] = [];
      });

      // Agrupar os dados por mês
      dadosTipoCidade.forEach((item) => {
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
              <tr class="tipo-cidade-row">
                  <td class="fw-bold tipo-cidade">${tipoCidade}</td>
                  ${allMesesCells}
              </tr>
          `;
    }
  }

  // Calcular e adicionar linha de totais geral
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

  tableHtml += `<tr id="totalRegional" class="table-info">${totalCells}</tr>`;

  // Adicionar todo o conteúdo ao tbody de uma vez para melhor performance
  $("#tabelaRegional tbody").html(tableHtml);

  // Gerar e exibir o comparativo CAPITAL vs INTERIOR
  gerarComparativoCapitalInterior(dados);
}

// Função para gerar o comparativo entre CAPITAL e INTERIOR
function gerarComparativoCapitalInterior(dados) {
  // Agrupar dados por tipo de cidade
  const dadosAgrupados = agruparPorRegionalETipoCidade(dados);

  // Obter os meses únicos dos dados
  const mesesUnicos = [...new Set(dados.map((item) => item.mes))];

  // Obter as regionais únicas
  const regionaisUnicas = Object.keys(dadosAgrupados);

  // Calcular TMR médio para CAPITAL e INTERIOR mês a mês e regional a regional
  let htmlComparativo = "";

  // Adicionar comparativo geral
  let totalTmrCapital = 0;
  let totalReparosCapital = 0;
  let totalTmrInterior = 0;
  let totalReparosInterior = 0;

  for (const regional in dadosAgrupados) {
    const dadosRegional = dadosAgrupados[regional];

    // Calcular para CAPITAL
    for (const item of dadosRegional["CAPITAL"]) {
      if (item.tmr_total !== null && item.tmr_total !== undefined) {
        totalTmrCapital += parseFloat(item.tmr_total);
        totalReparosCapital++;
      }
    }

    // Calcular para INTERIOR
    for (const item of dadosRegional["INTERIOR"]) {
      if (item.tmr_total !== null && item.tmr_total !== undefined) {
        totalTmrInterior += parseFloat(item.tmr_total);
        totalReparosInterior++;
      }
    }
  }

  // Calcular TMR médio geral
  const tmrMedioCapital =
    totalReparosCapital > 0 ? totalTmrCapital / totalReparosCapital : 0;
  const tmrMedioInterior =
    totalReparosInterior > 0 ? totalTmrInterior / totalReparosInterior : 0;

  // Formatando para 2 casas decimais
  const tmrFormatadoCapital = tmrMedioCapital.toFixed(2);
  const tmrFormatadoInterior = tmrMedioInterior.toFixed(2);

  // Determinar qual TMR é maior e gerar recomendações
  let comparativoGeralHtml = "";
  let recomendacoesHtml = "";

  if (tmrMedioCapital > tmrMedioInterior) {
    const diferenca = tmrMedioCapital - tmrMedioInterior;
    comparativoGeralHtml = `
      <div class="alert alert-info mt-4">
        <h5><i class="fas fa-exchange-alt"></i> Comparativo Geral CAPITAL vs INTERIOR</h5>
        <p><strong>CAPITAL:</strong> ${tmrFormatadoCapital}h | <strong>INTERIOR:</strong> ${tmrFormatadoInterior}h</p>
        <p class="mb-2"><strong>CAPITAL tem TMR geral maior que INTERIOR (+${diferenca.toFixed(
          2
        )}h)</strong></p>
        <p class="mb-0"><small class="text-muted">* Detalhes mês a mês e por regional disponíveis abaixo</small></p>
      </div>
    `;

    recomendacoesHtml = `
      <div class="card mt-3">
        <div class="card-header bg-warning text-dark">
          <h6 class="mb-0"><i class="fas fa-lightbulb"></i> Recomendações para CAPITAL</h6>
        </div>
        <div class="card-body">
          <ul class="mb-0">
            <li>Analisar processos de reparo nas áreas metropolitanas</li>
            <li>Verificar se há gargalos específicos em zonas urbanas densas</li>
            <li>Avaliar a distribuição de recursos técnicos nas capitais</li>
            <li>Investigar se a complexidade dos circuitos é maior nas áreas urbanas</li>
          </ul>
        </div>
      </div>
    `;
  } else if (tmrMedioInterior > tmrMedioCapital) {
    const diferenca = tmrMedioInterior - tmrMedioCapital;
    comparativoGeralHtml = `
      <div class="alert alert-info mt-4">
        <h5><i class="fas fa-exchange-alt"></i> Comparativo Geral CAPITAL vs INTERIOR</h5>
        <p><strong>CAPITAL:</strong> ${tmrFormatadoCapital}h | <strong>INTERIOR:</strong> ${tmrFormatadoInterior}h</p>
        <p class="mb-2"><strong>INTERIOR tem TMR geral maior que CAPITAL (+${diferenca.toFixed(
          2
        )}h)</strong></p>
        <p class="mb-0"><small class="text-muted">* Detalhes mês a mês e por regional disponíveis abaixo</small></p>
      </div>
    `;

    recomendacoesHtml = `
      <div class="card mt-3">
        <div class="card-header bg-warning text-dark">
          <h6 class="mb-0"><i class="fas fa-lightbulb"></i> Recomendações para INTERIOR</h6>
        </div>
        <div class="card-body">
          <ul class="mb-0">
            <li>Verificar disponibilidade de técnicos em áreas remotas</li>
            <li>Avaliar logística de transporte de equipamentos para interior</li>
            <li>Considerar desafios geográficos e infraestrutura de comunicação</li>
            <li>Analizar se os prazos são adequados considerando distâncias maiores</li>
          </ul>
        </div>
      </div>
    `;
  } else {
    comparativoGeralHtml = `
      <div class="alert alert-info mt-4">
        <h5><i class="fas fa-exchange-alt"></i> Comparativo Geral CAPITAL vs INTERIOR</h5>
        <p><strong>CAPITAL:</strong> ${tmrFormatadoCapital}h | <strong>INTERIOR:</strong> ${tmrFormatadoInterior}h</p>
        <p class="mb-2"><strong>Os TMRs gerais são iguais</strong></p>
        <p class="mb-0"><small class="text-muted">* Detalhes mês a mês e por regional disponíveis abaixo</small></p>
      </div>
    `;
  }

  // Adicionar comparativo por regional e mês
  for (const regional of regionaisUnicas) {
    const dadosRegional = dadosAgrupados[regional];

    // Calcular TMR mensal para esta regional
    const dadosPorMes = {};

    // Ordenar os meses em ordem cronológica (considerando o formato "Mês Ano")
    const mesesOrdenados = mesesUnicos.sort((a, b) => {
      // Converter os nomes dos meses para índices numéricos para ordenação
      const mesesMap = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
        'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
      };

      // Separar mês e ano
      const [mesA, anoA] = a.split(' ');
      const [mesB, anoB] = b.split(' ');

      // Comparar primeiro por ano, depois por mês
      if (parseInt(anoA) !== parseInt(anoB)) {
        return parseInt(anoA) - parseInt(anoB);
      }
      return mesesMap[mesA] - mesesMap[mesB];
    });

    for (const mes of mesesOrdenados) {
      dadosPorMes[mes] = {
        CAPITAL: { totalTmr: 0, totalReparos: 0 },
        INTERIOR: { totalTmr: 0, totalReparos: 0 },
      };
    }

    // Preencher os dados mês a mês para esta regional
    // Calcular para CAPITAL mês a mês
    for (const item of dadosRegional["CAPITAL"]) {
      const mes = item.mes;
      if (mes && item.tmr_total !== null && item.tmr_total !== undefined) {
        dadosPorMes[mes].CAPITAL.totalTmr += parseFloat(item.tmr_total);
        dadosPorMes[mes].CAPITAL.totalReparos++;
      }
    }

    // Calcular para INTERIOR mês a mês
    for (const item of dadosRegional["INTERIOR"]) {
      const mes = item.mes;
      if (mes && item.tmr_total !== null && item.tmr_total !== undefined) {
        dadosPorMes[mes].INTERIOR.totalTmr += parseFloat(item.tmr_total);
        dadosPorMes[mes].INTERIOR.totalReparos++;
      }
    }

    // Calcular TMR médio mês a mês para esta regional
    const tmrMensal = {};
    for (const mes of mesesUnicos) {
      tmrMensal[mes] = {
        CAPITAL:
          dadosPorMes[mes].CAPITAL.totalReparos > 0
            ? dadosPorMes[mes].CAPITAL.totalTmr /
              dadosPorMes[mes].CAPITAL.totalReparos
            : 0,
        INTERIOR:
          dadosPorMes[mes].INTERIOR.totalReparos > 0
            ? dadosPorMes[mes].INTERIOR.totalTmr /
              dadosPorMes[mes].INTERIOR.totalReparos
            : 0,
      };
    }

    // Adicionar seção para esta regional
    htmlComparativo += `
      <div class="card mt-4">
        <div class="card-header bg-secondary text-white">
          <h6 class="mb-0"><i class="fas fa-globe-americas"></i> Regional: ${regional}</h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead class="table-dark">
                <tr>
                  <th>Mês</th>
                  <th>CAPITAL (h)</th>
                  <th>INTERIOR (h)</th>
                  <th>Diferença (h)</th>
                  <th>Destaque</th>
                </tr>
              </thead>
              <tbody>
    `;

    for (const mes of mesesUnicos) {
      const tmrCapital = tmrMensal[mes].CAPITAL;
      const tmrInterior = tmrMensal[mes].INTERIOR;
      const diferenca = Math.abs(tmrCapital - tmrInterior);
      const maior =
        tmrCapital > tmrInterior
          ? "CAPITAL"
          : tmrInterior > tmrCapital
          ? "INTERIOR"
          : "IGUAL";

      htmlComparativo += `
                <tr>
                  <td>${mes}</td>
                  <td class="${
                    maior === "CAPITAL" ? "fw-bold text-danger" : ""
                  }">${tmrCapital.toFixed(2)}</td>
                  <td class="${
                    maior === "INTERIOR" ? "fw-bold text-primary" : ""
                  }">${tmrInterior.toFixed(2)}</td>
                  <td>${diferenca.toFixed(2)}</td>
                  <td>${maior}</td>
                </tr>
      `;
    }

    htmlComparativo += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // Preparar dados para o gráfico geral
  // Ordenar os meses em ordem cronológica (considerando o formato "Mês Ano")
  const labels = mesesUnicos.sort((a, b) => {
    // Converter os nomes dos meses para índices numéricos para ordenação
    const mesesMap = {
      'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
      'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    };

    // Separar mês e ano
    const [mesA, anoA] = a.split(' ');
    const [mesB, anoB] = b.split(' ');

    // Comparar primeiro por ano, depois por mês
    if (parseInt(anoA) !== parseInt(anoB)) {
      return parseInt(anoA) - parseInt(anoB);
    }
    return mesesMap[mesA] - mesesMap[mesB];
  });
  const dadosCapital = labels.map((mes) => {
    let totalTmr = 0;
    let totalReparos = 0;

    for (const regional in dadosAgrupados) {
      const dadosRegional = dadosAgrupados[regional];

      // Calcular para CAPITAL mês a mês
      for (const item of dadosRegional["CAPITAL"]) {
        if (
          item.mes === mes &&
          item.tmr_total !== null &&
          item.tmr_total !== undefined
        ) {
          totalTmr += parseFloat(item.tmr_total);
          totalReparos++;
        }
      }
    }

    return totalReparos > 0 ? (totalTmr / totalReparos).toFixed(2) : 0;
  });

  const dadosInterior = labels.map((mes) => {
    let totalTmr = 0;
    let totalReparos = 0;

    for (const regional in dadosAgrupados) {
      const dadosRegional = dadosAgrupados[regional];

      // Calcular para INTERIOR mês a mês
      for (const item of dadosRegional["INTERIOR"]) {
        if (
          item.mes === mes &&
          item.tmr_total !== null &&
          item.tmr_total !== undefined
        ) {
          totalTmr += parseFloat(item.tmr_total);
          totalReparos++;
        }
      }
    }

    return totalReparos > 0 ? (totalTmr / totalReparos).toFixed(2) : 0;
  });

  // Gerar HTML para o gráfico
  const graficoHtml = `
    <div class="card mt-4">
      <div class="card-header bg-primary text-white">
        <h6 class="mb-0"><i class="fas fa-chart-bar"></i> Comparativo Mensal CAPITAL vs INTERIOR (Geral)</h6>
      </div>
      <div class="card-body">
        <div style="height: 200px;">
          <canvas id="graficoComparativoCapitalInterior"></canvas>
        </div>
      </div>
    </div>
  `;

  // Criar tabela TOTAL consolidando todos os dados
  const tabelaTotalHtml = gerarTabelaTotalCapitalInterior(dados, mesesUnicos);

  // Exibir o comparativo abaixo da tabela
  const comparativoContainer = $(`
    <div id="comparativoCapitalInterior">
      ${comparativoGeralHtml}
      ${recomendacoesHtml}
      ${htmlComparativo}
      ${tabelaTotalHtml}
      ${graficoHtml}
    </div>
  `);

  // Remover comparações anteriores e adicionar a nova
  $("#comparativoCapitalInterior").remove();
  $("#tabelaRegionalContainer").after(comparativoContainer);

  // Gerar o gráfico após adicionar o HTML ao DOM
  setTimeout(() => {
    gerarGraficoComparativo(labels, dadosCapital, dadosInterior);
  }, 100);
}

// Função para gerar a tabela TOTAL de comparativo CAPITAL vs INTERIOR
function gerarTabelaTotalCapitalInterior(dados, mesesUnicos) {
  // Agrupar dados por tipo de cidade
  const dadosAgrupados = agruparPorRegionalETipoCidade(dados);

  // Calcular TMR médio para CAPITAL e INTERIOR mês a mês considerando todas as regionais
  const dadosPorMes = {};

  // Inicializar os meses
  mesesUnicos.forEach((mes) => {
    dadosPorMes[mes] = {
      CAPITAL: { totalTmr: 0, totalReparos: 0 },
      INTERIOR: { totalTmr: 0, totalReparos: 0 },
    };
  });

  // Preencher os dados mês a mês considerando todas as regionais
  for (const regional in dadosAgrupados) {
    const dadosRegional = dadosAgrupados[regional];

    // Calcular para CAPITAL mês a mês
    for (const item of dadosRegional["CAPITAL"]) {
      const mes = item.mes;
      if (mes && item.tmr_total !== null && item.tmr_total !== undefined) {
        if (dadosPorMes[mes]) {
          dadosPorMes[mes].CAPITAL.totalTmr += parseFloat(item.tmr_total);
          dadosPorMes[mes].CAPITAL.totalReparos++;
        } else {
          dadosPorMes[mes] = {
            CAPITAL: { totalTmr: parseFloat(item.tmr_total), totalReparos: 1 },
            INTERIOR: { totalTmr: 0, totalReparos: 0 }
          };
        }
      }
    }

    // Calcular para INTERIOR mês a mês
    for (const item of dadosRegional["INTERIOR"]) {
      const mes = item.mes;
      if (mes && item.tmr_total !== null && item.tmr_total !== undefined) {
        if (dadosPorMes[mes]) {
          dadosPorMes[mes].INTERIOR.totalTmr += parseFloat(item.tmr_total);
          dadosPorMes[mes].INTERIOR.totalReparos++;
        } else {
          dadosPorMes[mes] = {
            CAPITAL: { totalTmr: 0, totalReparos: 0 },
            INTERIOR: { totalTmr: parseFloat(item.tmr_total), totalReparos: 1 }
          };
        }
      }
    }
  }

  // Calcular TMR médio mês a mês para o total geral
  const tmrMensal = {};
  for (const mes of mesesUnicos) {
    tmrMensal[mes] = {
      CAPITAL:
        dadosPorMes[mes].CAPITAL.totalReparos > 0
          ? dadosPorMes[mes].CAPITAL.totalTmr /
            dadosPorMes[mes].CAPITAL.totalReparos
          : 0,
      INTERIOR:
        dadosPorMes[mes].INTERIOR.totalReparos > 0
          ? dadosPorMes[mes].INTERIOR.totalTmr /
            dadosPorMes[mes].INTERIOR.totalReparos
          : 0,
    };
  }

  // Ordenar os meses em ordem cronológica (considerando o formato "Mês Ano")
  const mesesOrdenados = mesesUnicos.sort((a, b) => {
    // Converter os nomes dos meses para índices numéricos para ordenação
    const mesesMap = {
      'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
      'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    };

    // Separar mês e ano
    const [mesA, anoA] = a.split(' ');
    const [mesB, anoB] = b.split(' ');

    // Comparar primeiro por ano, depois por mês
    if (parseInt(anoA) !== parseInt(anoB)) {
      return parseInt(anoA) - parseInt(anoB);
    }
    return mesesMap[mesA] - mesesMap[mesB];
  });

  // Gerar HTML para a tabela TOTAL
  let tabelaTotalHtml = `
    <div class="card mt-4">
      <div class="card-header bg-success text-white">
        <h6 class="mb-0"><i class="fas fa-table"></i> TABELA TOTAL - Comparativo CAPITAL vs INTERIOR (Consolidado)</h6>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered table-sm">
            <thead class="table-dark">
              <tr>
                <th>Mês</th>
                <th>CAPITAL (h)</th>
                <th>INTERIOR (h)</th>
                <th>Diferença (h)</th>
                <th>Destaque</th>
              </tr>
            </thead>
            <tbody>
  `;

  for (const mes of mesesOrdenados) {
    const tmrCapital = tmrMensal[mes].CAPITAL;
    const tmrInterior = tmrMensal[mes].INTERIOR;
    const diferenca = Math.abs(tmrCapital - tmrInterior);
    const maior =
      tmrCapital > tmrInterior
        ? "CAPITAL"
        : tmrInterior > tmrCapital
        ? "INTERIOR"
        : "IGUAL";

    tabelaTotalHtml += `
              <tr>
                <td>${mes}</td>
                <td class="${
                  maior === "CAPITAL" ? "fw-bold text-danger" : ""
                }">${tmrCapital.toFixed(2)}</td>
                <td class="${
                  maior === "INTERIOR" ? "fw-bold text-primary" : ""
                }">${tmrInterior.toFixed(2)}</td>
                <td>${diferenca.toFixed(2)}</td>
                <td>${maior}</td>
              </tr>
    `;
  }

  tabelaTotalHtml += `
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return tabelaTotalHtml;
}

// Função para gerar o gráfico comparativo
function gerarGraficoComparativo(labels, dadosCapital, dadosInterior) {
  const ctx = document
    .getElementById("graficoComparativoCapitalInterior")
    .getContext("2d");

  // Destruir instância anterior do gráfico, se existir
  if (window.graficoComparativoCI) {
    window.graficoComparativoCI.destroy();
  }

  // Calcular as diferenças para cada mês
  const dadosDiferenca = labels.map((mes, index) => {
    const capital = parseFloat(dadosCapital[index]);
    const interior = parseFloat(dadosInterior[index]);
    return Math.abs(capital - interior);
  });

  // Determinar cores com base em qual é maior
  const coresCapital = labels.map((mes, index) => {
    const capital = parseFloat(dadosCapital[index]);
    const interior = parseFloat(dadosInterior[index]);
    return capital > interior
      ? "rgba(255, 99, 132, 0.7)"
      : "rgba(255, 99, 132, 0.5)";
  });

  const coresInterior = labels.map((mes, index) => {
    const capital = parseFloat(dadosCapital[index]);
    const interior = parseFloat(dadosInterior[index]);
    return interior > capital
      ? "rgba(54, 162, 235, 0.7)"
      : "rgba(54, 162, 235, 0.5)";
  });

  // Calcular o valor máximo para definir a escala do eixo X
  const maxValor = Math.max(...dadosCapital, ...dadosInterior) * 1.2;

  window.graficoComparativoCI = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.map(
        (mes) =>
          `${mes}\nCAPITAL: ${dadosCapital[labels.indexOf(mes)]}h\nINTERIOR: ${
            dadosInterior[labels.indexOf(mes)]
          }h`
      ),
      datasets: [
        {
          label: "CAPITAL",
          data: dadosCapital,
          backgroundColor: coresCapital,
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 1,
        },
        {
          label: "INTERIOR",
          data: dadosInterior,
          backgroundColor: coresInterior,
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y", // Barras horizontais
      responsive: true, // Desativar responsividade para manter tamanho fixo
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          max: maxValor,
          title: {
            display: true,
            text: "TMR (horas)",
          },
        },
        y: {
          stacked: false,
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.x !== null) {
                label += context.parsed.x + "h";
              }
              return label;
            },
          },
        },
      },
    },
  });
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
    .forEach((key) => {
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

function agruparPorRegionalETipoCidade(dados) {
  const agrupado = {};

  dados.forEach((item) => {
    const regional = item.regional || "OUTRA";

    // Garantir que a regional exista no objeto
    if (!agrupado[regional]) {
      agrupado[regional] = {
        CAPITAL: [],
        INTERIOR: [],
      };
    }

    // Determinar o tipo de cidade (padronizando possíveis variações)
    let tipoCidade = item.tipo_cidade ? item.tipo_cidade.toUpperCase() : "";
    if (tipoCidade === "CAPITAL" || tipoCidade === "INTERIOR") {
      agrupado[regional][tipoCidade].push(item);
    } else {
      // Se não for nem CAPITAL nem INTERIOR, adicionar a ambos para não perder dados
      agrupado[regional]["CAPITAL"].push(item);
      agrupado[regional]["INTERIOR"].push(item);
    }
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
  const container = $(".procedencia-options-container");
  container.empty();

  // Adicionar novos itens de procedência
  procedencias.forEach((procedencia) => {
    const isSelected = procedenciasSelecionadas.includes(procedencia);

    const optionElement = $(`
      <div class="procedencia-option ${isSelected ? "selected" : ""}">
        <div class="form-check">
          <input class="form-check-input procedencia-checkbox" type="checkbox"
                 value="${procedencia}" id="proc_${procedencia}"
                 ${isSelected ? "checked" : ""}>
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

// Função para atualizar o menu de procedência com a lista completa para a aba de regional
function atualizarMenuProcedenciaCompletoRegional(procedencias) {
  // Ordenar as procedências alfabeticamente
  procedencias.sort();

  // Limpar o container de opções
  const container = $(".procedencia-options-container-regional");
  container.empty();

  // Adicionar novos itens de procedência
  procedencias.forEach((procedencia) => {
    const isSelected = procedenciasSelecionadas.includes(procedencia);

    const optionElement = $(`
      <div class="procedencia-option-regional ${isSelected ? "selected" : ""}">
        <div class="form-check">
          <input class="form-check-input procedencia-checkbox-regional" type="checkbox"
                 value="${procedencia}" id="proc_regional_${procedencia}"
                 ${isSelected ? "checked" : ""}>
          <label class="form-check-label" for="proc_regional_${procedencia}">
            ${procedencia}
          </label>
        </div>
      </div>
    `);

    container.append(optionElement);
  });

  // Atualizar o rótulo do botão
  atualizarRotuloProcedenciaRegional();
}

// Função para atualizar o menu de tipo de cidade com a lista completa
function atualizarMenuTipoCidadeCompleto(tiposCidade) {
  // Ordenar os tipos de cidade alfabeticamente
  tiposCidade.sort();

  // Limpar o container de opções
  const container = $(".tipo-cidade-options-container");
  container.empty();

  // Adicionar novos itens de tipo de cidade
  tiposCidade.forEach((tipoCidade) => {
    const isSelected = tiposCidadeSelecionados.includes(tipoCidade);

    const optionElement = $(`
      <div class="tipo-cidade-option ${isSelected ? "selected" : ""}">
        <div class="form-check">
          <input class="form-check-input tipo-cidade-checkbox" type="checkbox"
                 value="${tipoCidade}" id="tipo_cidade_${tipoCidade}"
                 ${isSelected ? "checked" : ""}>
          <label class="form-check-label" for="tipo_cidade_${tipoCidade}">
            ${tipoCidade}
          </label>
        </div>
      </div>
    `);

    container.append(optionElement);
  });

  // Atualizar o rótulo do botão
  atualizarRotuloTipoCidade();
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
          right: 10,
        },
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
            padding: 20,
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
    "#filtroTipoCidadeClusterBtn",
    "#aplicarFiltrosCluster",
    "#aplicarFiltrosRegional",
  ];

  botoesFiltro.forEach(function (seletor) {
    $(seletor).prop("disabled", desabilitar);

    // Adicionar ou remover classe visual para indicar estado desabilitado
    if (desabilitar) {
      $(seletor).addClass("disabled");
    } else {
      $(seletor).removeClass("disabled");
    }
  });
}
