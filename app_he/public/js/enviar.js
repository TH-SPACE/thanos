// ========== DADOS DO USUÁRIO ==========
// Função responsável por carregar os dados do usuário logado (nome, cargo, etc.)
// e atualizar elementos da interface com essas informações.
function carregarDadosUsuario() {
  fetch("/auth/usuario")
    .then((res) => res.json())
    .then((data) => {
      const nomeCompleto = data.nome || "Usuário";
      const cargo = data.cargo || "USUÁRIO";
      const primeiroNome = nomeCompleto;

      document.getElementById("userName").textContent = primeiroNome;
      document.getElementById("sidebarUserName").textContent = nomeCompleto;
      document.querySelector(".profile-role").textContent = cargo;
    });
}

// ========== RESUMO DE HE ==========
// Variáveis globais para armazenar dados carregados de arquivos JSON:
// - limitesPorGerente: mapeia gerentes aos seus limites financeiros de HE (Horas Extras)
// - valoresPorCargo: mapeia cargos aos valores/hora por tipo de HE (50%, 100%)
let limitesPorGerente = {};
let gerentesCompartilhados = {};
let valoresPorCargo = {};
let colaboradoresAdicionados = []; // Armazena os colaboradores adicionados

// Carrega os limites de HE por gerente a partir de um arquivo JSON estático
function carregarLimitesHE() {
  fetch("/json/limite_he.json")
    .then((r) => r.json())
    .then((data) => {
      limitesPorGerente = {};
      gerentesCompartilhados = {};
      data.forEach((item) => {
        const valor = parseFloat(
          item.Valores.replace(/\./g, "").replace(",", ".")
        );
        // Adiciona o gerente responsável
        limitesPorGerente[item.Responsavel] = valor;

        // Se houver gerentes compartilhados, adiciona também com o mesmo limite
        if (
          item.GerentesCompartilhados &&
          Array.isArray(item.GerentesCompartilhados)
        ) {
          item.GerentesCompartilhados.forEach((gerenteCompartilhado) => {
            limitesPorGerente[gerenteCompartilhado] = valor;
            // Registra qual gerente é o responsável pelo limite compartilhado
            gerentesCompartilhados[gerenteCompartilhado] = item.Responsavel;
          });
        }
      });
    });
}

// Carrega os valores por cargo e tipo de HE (50% ou 100%) a partir de um arquivo JSON estático
function carregarValoresHE() {
  fetch("/json/valores_he.json")
    .then((r) => r.json())
    .then((data) => {
      valoresPorCargo = data;
    });
}

// Exibe um resumo financeiro de HE para um gerente e mês específicos
// Mostra limite, valor aprovado, pendente, saldo e estimativa de custo
function mostrarResumoHE(gerente, mes) {
  const limite = limitesPorGerente[gerente] || 0;

  // Se não houver gerente, mês ou limite definido, exibe mensagem apropriada ou limpa o resumo
  if (!gerente || !mes || limite === 0) {
    // Mesmo sem limite ou dados, ainda podemos mostrar os valores estimados atuais
    document.getElementById("limiteValor").textContent = limite.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );

    // Os outros valores continuam como zero quando não há gerente/mês selecionado
    document.getElementById("aprovadoValor").textContent = "R$ 0,00";
    document.getElementById("pendenteValor").textContent = "R$ 0,00";
    document.getElementById("executadoValor").textContent = "R$ 0,00";
    document.getElementById("saldoRealValor").textContent = limite.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    document.getElementById("saldoRealValor").className =
      "h5 font-weight-bold text-success"; // Verde quando não há consumo
    return;
  }

  // Primeiro busca os dados de execução (horas já realizadas) via API
  fetch(`/planejamento-he/api/resumo-executado?gerente=${encodeURIComponent(gerente)}&mes=${encodeURIComponent(mes)}`)
    .then(r => r.json())
    .then(executadoData => {
      const executadoValor = executadoData.total_executado_valor || 0;

      // Em seguida, busca dados de HE aprovadas e pendentes via API
      return fetch(
        `/planejamento-he/api/resumo-he?gerente=${encodeURIComponent(
          gerente
        )}&mes=${encodeURIComponent(mes)}`
      ).then(r => r.json())
        .then(data => {
          const aprovado = data.aprovado || 0;
          const pendente = data.pendente || 0;

          // O NOVO CÁLCULO de SALDO REAL é: LIMITE - EXECUTADO
          const saldoReal = limite - executadoValor;

          // Atualiza os valores no resumo financeiro
          document.getElementById("limiteValor").textContent =
            limite.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
          document.getElementById("aprovadoValor").textContent =
            aprovado.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
          document.getElementById("pendenteValor").textContent =
            pendente.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
          document.getElementById("executadoValor").textContent =
            executadoValor.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
          document.getElementById("saldoRealValor").textContent = saldoReal.toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            }
          );

          // Atualiza a cor do saldo REAL dependendo do valor
          document.getElementById("saldoRealValor").className = "h5 font-weight-bold";
          document
            .getElementById("saldoRealValor")
            .classList.add(saldoReal > 0 ? "text-success" : "text-danger");

          // Carrega os detalhes de execução após atualizar o resumo
          carregarDetalhesExecutado(gerente, mes);
        });
    })
    .catch((error) => {
      console.error("Erro ao carregar resumo financeiro:", error);
      // Em caso de erro, define valores padrão
      document.getElementById("limiteValor").textContent =
        limite.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
      document.getElementById("aprovadoValor").textContent = "R$ 0,00";
      document.getElementById("pendenteValor").textContent = "R$ 0,00";
      document.getElementById("executadoValor").textContent = "R$ 0,00";
      document.getElementById("saldoRealValor").textContent = (limite).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      document.getElementById("saldoRealValor").className =
        "h5 font-weight-bold text-success";
    });
}

// Carrega e exibe os detalhes de horas executadas por colaborador
function carregarDetalhesExecutado(gerente, mes) {
  // Limpa qualquer mensagem prévia na tabela de detalhes
  const tabela = document.getElementById("tabelaDetalhesExecutado");

  // Se não temos gerente ou mês, limpamos a tabela de detalhes
  if (!gerente || !mes) {
    tabela.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-3">
          <i class="fas fa-user-clock fa-lg mb-2"></i>
          <div>Selecione gerente e mês para visualizar detalhes</div>
        </td>
      </tr>
    `;
    return;
  }

  // Carrega os detalhes de execução através da API
  fetch(`/planejamento-he/api/detalhes-executado?gerente=${encodeURIComponent(gerente)}&mes=${encodeURIComponent(mes)}`)
    .then(r => r.json())
    .then(data => {
      // Filtra apenas colaboradores que têm horas executadas
      const dadosFiltrados = data.filter(item => (item.total_executado || 0) > 0);

      // Ordena os dados filtrados por total de horas executadas em ordem decrescente
      dadosFiltrados.sort((a, b) => (b.total_executado || 0) - (a.total_executado || 0));

      // Verifica se existem dados após filtragem
      if (!dadosFiltrados || dadosFiltrados.length === 0) {
        tabela.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted py-3">
              <i class="fas fa-user-check fa-lg mb-2"></i>
              <div>Nenhum registro de horas executadas encontrado</div>
              <small>Este gerente não possui colaboradores com horas executadas registradas para este mês</small>
            </td>
          </tr>
        `;
        return;
      }

      // Limpa a tabela existente
      tabela.innerHTML = "";

      // Adiciona os dados de cada colaborador executado (ordenados)
      dadosFiltrados.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><i class="fas fa-user text-primary mr-2"></i>${item.colaborador}</td>
          <td>${item.cargo}</td>
          <td class="text-center">${(item.executado_50 || 0).toFixed(1)}</td>
          <td class="text-center">${(item.executado_100 || 0).toFixed(1)}</td>
          <td class="font-weight-bold text-info text-center">${(item.total_executado || 0).toFixed(1)}</td>
        `;
        tabela.appendChild(row);
      });
    })
    .catch(error => {
      console.error("Erro ao carregar detalhes de execução:", error);
      tabela.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger py-3">
            <i class="fas fa-exclamation-triangle fa-lg mb-2"></i>
            <div>Erro ao carregar detalhes de execução</div>
            <small>Tente novamente mais tarde</small>
          </td>
        </tr>
      `;
    });
}

// Calcula o custo total das horas extras com base nos colaboradores adicionados
// e atualiza os elementos que exibem esse valor
function calcularCustoTotal() {
  let custoTotal = 0;
  let totalHoras = 0;

  colaboradoresAdicionados.forEach((colab) => {
    const valorHora =
      valoresPorCargo[colab.cargo] && valoresPorCargo[colab.cargo][colab.tipoHE]
        ? valoresPorCargo[colab.cargo][colab.tipoHE]
        : 0;
    const custoItem = valorHora * colab.horas;
    custoTotal += custoItem;
    totalHoras += colab.horas;
  });

  // Formata o valor total em BRL
  const valorTotal = custoTotal.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Atualiza os elementos na página que mostram o valor total
  const totalRodape = document.getElementById("valorTotalHoras");
  if (totalRodape) totalRodape.textContent = valorTotal;

  // Não há mais elemento "valorTotalHorasResumo" no novo layout, mas mantemos para compatibilidade
  const totalResumo = document.getElementById("valorTotalHorasResumo");
  if (totalResumo) totalResumo.textContent = valorTotal;

  return { custoTotal, totalHoras, valorTotal };
}

// Atualiza a lista de colaboradores na aba 'Colaboradores'
function atualizarListaColaboradores() {
  const tbody = document.getElementById("listaColaboradores");
  tbody.innerHTML = "";

  if (colaboradoresAdicionados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          <i class="fas fa-user-clock fa-2x mb-2"></i>
          <div>Nenhum colaborador adicionado</div>
          <small>Adicione colaboradores usando o formulário acima</small>
        </td>
      </tr>
    `;
    verificarEnableProximoBtn();
    return;
  }

  colaboradoresAdicionados.forEach((colab, index) => {
    const valorHora =
      valoresPorCargo[colab.cargo] && valoresPorCargo[colab.cargo][colab.tipoHE]
        ? valoresPorCargo[colab.cargo][colab.tipoHE]
        : 0;
    const valorEstimado = (valorHora * colab.horas).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><i class="fas fa-user mr-2 text-primary"></i>${colab.colaborador}</td>
      <td style="display: none;">${colab.matricula}</td>
      <td>${colab.cargo}</td>
      <td class="font-weight-bold">${colab.tipoHE}</td>
      <td class="text-center">${colab.horas}</td>
      <td><span class="badge badge-secondary">${colab.justificativa}</span></td>
      <td class="font-weight-bold text-success">${valorEstimado}</td>
      <td class="text-center">
        <button type="button" class="btn btn-danger btn-sm remover-colaborador" data-index="${index}" title="Remover colaborador">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Adiciona evento para remover colaborador
  document.querySelectorAll(".remover-colaborador").forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      colaboradoresAdicionados.splice(index, 1);
      atualizarListaColaboradores();
      atualizarResumoFinais();
      verificarEnableProximoBtn();
    });
  });

  // Atualiza o custo total
  calcularCustoTotal();
  verificarEnableProximoBtn();
}

// Atualiza o contador de colaboradores
function atualizarContadorColaboradores() {
  const contador = document.getElementById("contadorColaboradores");
  const total = colaboradoresAdicionados.length;
  contador.textContent = `${total} colaborador${total !== 1 ? "es" : ""}`;

  // Atualiza visualmente a cor do badge baseado no número
  contador.className = "badge badge-primary";
  if (total > 0) {
    contador.classList.add("badge-success");
    contador.classList.remove("badge-primary");
  }
}

// Atualiza os dados na aba de resumo
function atualizarResumoFinais() {
  // Atualiza o resumo com informações gerais
  document.getElementById("resumoGerente").textContent =
    document.getElementById("gerente").value || "-";
  document.getElementById("resumoMes").textContent =
    document.getElementById("mes").value || "-";

  const { custoTotal, totalHoras, valorTotal } = calcularCustoTotal();
  document.getElementById("resumoValor").textContent = valorTotal;
  document.getElementById("resumoHoras").textContent =
    totalHoras.toFixed(1) + "h";
  document.getElementById("resumoColaboradores").textContent =
    colaboradoresAdicionados.length;

  // Atualiza a tabela de resumo
  const tbody = document.getElementById("tabelaResumoColaboradores");

  if (colaboradoresAdicionados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          <i class="fas fa-user-clock fa-2x mb-2"></i>
          <div>Nenhum colaborador adicionado</div>
          <small>Adicione colaboradores na aba anterior</small>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  colaboradoresAdicionados.forEach((colab) => {
    const valorHora =
      valoresPorCargo[colab.cargo] && valoresPorCargo[colab.cargo][colab.tipoHE]
        ? valoresPorCargo[colab.cargo][colab.tipoHE]
        : 0;
    const valorEstimado = (valorHora * colab.horas).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><i class="fas fa-user mr-2 text-primary"></i>${colab.colaborador}</td>
      <td>${colab.cargo}</td>
      <td class="font-weight-bold">${colab.tipoHE}</td>
      <td class="text-center">${colab.horas}</td>
      <td><span class="badge badge-secondary">${colab.justificativa}</span></td>
      <td class="font-weight-bold text-success">${valorEstimado}</td>
    `;
    tbody.appendChild(row);
  });

  // Adiciona linha total
  const totalRow = document.createElement("tr");
  totalRow.className = "table-active";
  totalRow.innerHTML = `
    <td colspan="5" class="text-right"><strong>Total:</strong></td>
    <td><strong>${valorTotal}</strong></td>
  `;
  tbody.appendChild(totalRow);
}

// Verifica se o botão "Próximo" na aba de colaboradores deve ser habilitado
function verificarEnableProximoBtn() {
  const btnProximo = document.getElementById("btnProximoColaboradores");
  btnProximo.disabled = colaboradoresAdicionados.length === 0;

  // Atualiza visualmente o botão
  if (btnProximo.disabled) {
    btnProximo.classList.add("btn-secondary");
    btnProximo.classList.remove("btn-primary");
  } else {
    btnProximo.classList.remove("btn-secondary");
    btnProximo.classList.add("btn-primary");
  }
}

// ========== EVENTOS ==========
// Executado quando o DOM está totalmente carregado
document.addEventListener("DOMContentLoaded", () => {
  // Carrega dados iniciais
  carregarDadosUsuario();
  carregarLimitesHE();
  carregarValoresHE();

  // Define o mês atual como valor padrão no seletor de mês
  const meses = [
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
  const mesAtual = meses[new Date().getMonth()];
  document.getElementById("mes").value = mesAtual;

  // Atualiza o resumo financeiro com o mês atual selecionado
  const gerenteAtual = document.getElementById("gerente").value;
  if (gerenteAtual) {
    mostrarResumoHE(gerenteAtual, mesAtual);
  } else {
    // Mostra valores padrão quando não há gerente selecionado
    mostrarResumoHE("", mesAtual);
  }

  // Carrega a lista de gerentes via API e popula o seletor
  fetch("/planejamento-he/api/gerentes")
    .then((r) => r.json())
    .then((data) => {
      const select = document.getElementById("gerente");
      select.innerHTML = '<option value="">Selecione</option>'; // Limpa opções anteriores
      data.gerentes.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        select.appendChild(opt);
      });
    });

  // Eventos de mudança no seletor de gerente e mês: atualizam o resumo de HE
  document.getElementById("gerente").addEventListener("change", () => {
    const g = document.getElementById("gerente").value;
    const m = document.getElementById("mes").value;
    if (g && m) mostrarResumoHE(g, m);
    else mostrarResumoHE(g, m); // Mostra valores padrão mesmo quando um dos campos não está preenchido

    // Atualiza a lista de colaboradores disponíveis
    atualizarListaColaboradoresDisponiveis();
  });

  document.getElementById("mes").addEventListener("change", () => {
    const g = document.getElementById("gerente").value;
    const m = document.getElementById("mes").value;
    if (g && m) mostrarResumoHE(g, m);
    else mostrarResumoHE(g, m); // Mostra valores padrão mesmo quando um dos campos não está preenchido
  });

  // Função para atualizar a lista de colaboradores disponíveis com base no gerente selecionado
  function atualizarListaColaboradoresDisponiveis() {
    const gerente = document.getElementById("gerente").value;
    const select = document.getElementById("novoColaborador");

    if (!gerente) {
      select.innerHTML =
        '<option value="">Selecione o gerente primeiro</option>';
      select.disabled = true;
      return;
    }

    select.disabled = false;
    fetch(
      `/planejamento-he/api/colaboradores?gerente=${encodeURIComponent(
        gerente
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        select.innerHTML = '<option value="">Selecione um colaborador</option>';
        data.colaboradores.forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c;
          select.appendChild(opt);
        });
        // Inicializa o Select2 para busca amigável
        $(select).select2({ width: "100%", placeholder: "Buscar colaborador" });
      })
      .catch(() => {
        select.innerHTML =
          '<option value="">Erro ao carregar colaboradores</option>';
      });
  }

  // Ao selecionar um colaborador, busca seu cargo e matrícula
  $(document).on("select2:select", "#novoColaborador", function (e) {
    const colaborador = e.params.data.id;
    fetch(`/planejamento-he/api/cargo?nome=${encodeURIComponent(colaborador)}`)
      .then((r) => r.json())
      .then((info) => {
        document.getElementById("novoCargo").value = info.cargo || "";
        document.getElementById("novoMatricula").value = info.matricula || "";
      });
  });

  // Adiciona colaborador à lista ao clicar no botão
  document
    .getElementById("btnAdicionarColaborador")
    .addEventListener("click", () => {
      const colaborador = document.getElementById("novoColaborador").value;
      const matricula = document.getElementById("novoMatricula").value;
      const cargo = document.getElementById("novoCargo").value;
      const tipoHE = document.getElementById("novoTipoHE").value;
      const horas = parseFloat(document.getElementById("novoHoras").value) || 0;
      const justificativa = document.getElementById("novoJustificativa").value;

      // Validação
      if (
        !colaborador ||
        !matricula ||
        !cargo ||
        !tipoHE ||
        horas <= 0 ||
        !justificativa
      ) {
        // Exibe mensagem de erro no formulário
        const infoGeral = document.querySelector(
          "#colaboradores .card:first-child"
        );
        infoGeral.insertAdjacentHTML(
          "afterend",
          `<div class="alert alert-danger alert-dismissible fade show" role="alert">
          Preencha todos os campos corretamente.
          <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
          </button>
        </div>`
        );
        // Remove o alerta após 5 segundos
        setTimeout(() => {
          const alert = document.querySelector(".alert");
          if (alert) alert.remove();
        }, 5000);
        return;
      }

      // Adiciona à lista de colaboradores
      colaboradoresAdicionados.push({
        colaborador,
        matricula,
        cargo,
        tipoHE,
        horas,
        justificativa,
      });

      // Atualiza a lista visual e o contador
      atualizarListaColaboradores();
      atualizarContadorColaboradores();

      // Limpa o formulário
      document.getElementById("novoColaborador").value = "";
      document.getElementById("novoMatricula").value = "";
      document.getElementById("novoCargo").value = "";
      document.getElementById("novoTipoHE").value = "";
      document.getElementById("novoHoras").value = "";
      document.getElementById("novoJustificativa").value = "";

      // Atualiza o Select2 se estiver presente
      if ($("#novoColaborador").data("select2")) {
        $("#novoColaborador").val("").trigger("change");
      }
    });

  // Prevenir a navegação direta por cliques nas abas desabilitadas
  document
    .querySelectorAll("#solicitacaoTabs .nav-link.disabled")
    .forEach((tab) => {
      tab.addEventListener("click", function (e) {
        if (this.classList.contains("disabled")) {
          e.preventDefault();
          return false;
        }
      });
    });

  // Navegação entre as abas
  // Botão "Próximo" da aba de informações gerais
  document
    .getElementById("btnProximoInfoGerais")
    .addEventListener("click", () => {
      const gerente = document.getElementById("gerente").value;
      const mes = document.getElementById("mes").value;

      if (!gerente) {
        // Exibe mensagem de erro no formulário
        const infoGeral = document.querySelector("#informacoes-gerais");
        infoGeral.insertAdjacentHTML(
          "afterbegin",
          `<div class="alert alert-warning alert-dismissible fade show" role="alert">
          Selecione um gerente antes de continuar.
          <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
          </button>
        </div>`
        );
        // Remove o alerta após 5 segundos
        setTimeout(() => {
          const alert = document.querySelector(".alert");
          if (alert) alert.remove();
        }, 5000);
        return;
      }

      if (!mes) {
        // Exibe mensagem de erro no formulário
        const infoGeral = document.querySelector("#informacoes-gerais");
        infoGeral.insertAdjacentHTML(
          "afterbegin",
          `<div class="alert alert-warning alert-dismissible fade show" role="alert">
          Selecione um mês antes de continuar.
          <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
          </button>
        </div>`
        );
        // Remove o alerta após 5 segundos
        setTimeout(() => {
          const alert = document.querySelector(".alert");
          if (alert) alert.remove();
        }, 5000);
        return;
      }

      // Ativa a aba de colaboradores e remove a classe disabled
      const colaboradoresTab = document.getElementById("colaboradores-tab");
      colaboradoresTab.classList.remove("disabled");

      // Mostra a aba de colaboradores
      $('#solicitacaoTabs a[href="#colaboradores"]').tab("show");
    });

  // Botão "Anterior" da aba de colaboradores
  document
    .getElementById("btnAnteriorColaboradores")
    .addEventListener("click", () => {
      $('#solicitacaoTabs a[href="#informacoes-gerais"]').tab("show");
    });

  // Botão "Próximo" da aba de colaboradores
  document
    .getElementById("btnProximoColaboradores")
    .addEventListener("click", () => {
      if (colaboradoresAdicionados.length === 0) {
        Swal.fire({
          title: "Atenção!",
          text: "Adicione pelo menos um colaborador antes de continuar.",
          icon: "warning",
          confirmButtonText: "Ok",
        });
        return;
      }

      // Atualiza a aba de resumo com os dados atuais
      atualizarResumoFinais();

      // Ativa a aba de resumo e remove a classe disabled
      const resumoTab = document.getElementById("resumo-tab");
      resumoTab.classList.remove("disabled");

      // Mostra a aba de resumo
      $('#solicitacaoTabs a[href="#resumo"]').tab("show");
    });

  // Botão "Anterior" da aba de resumo
  document.getElementById("btnAnteriorResumo").addEventListener("click", () => {
    // Verifica se a aba de colaboradores está ativa antes de voltar
    const colaboradoresTab = document.getElementById("colaboradores-tab");
    if (colaboradoresTab.classList.contains("disabled")) {
      // Caso a aba esteja desabilitada, volta para a aba de informações gerais
      $('#solicitacaoTabs a[href="#informacoes-gerais"]').tab("show");
    } else {
      $('#solicitacaoTabs a[href="#colaboradores"]').tab("show");
    }
  });

  // Lógica de envio do formulário de planejamento de HE
  document
    .getElementById("btnEnviarSolicitacao")
    .addEventListener("click", () => {
      const gerente = document.getElementById("gerente").value;
      const mes = document.getElementById("mes").value;

      if (!gerente || !mes) {
        // Exibe mensagem de erro no formulário
        const infoGeral = document.querySelector("#resumo");
        infoGeral.insertAdjacentHTML(
          "afterbegin",
          `<div class="alert alert-danger alert-dismissible fade show" role="alert">
          Selecione Gerente e Mês.
          <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
          </button>
        </div>`
        );
        // Remove o alerta após 5 segundos
        setTimeout(() => {
          const alert = document.querySelector(".alert");
          if (alert) alert.remove();
        }, 5000);
        return;
      }

      if (colaboradoresAdicionados.length === 0) {
        // Exibe mensagem de erro no formulário
        const infoGeral = document.querySelector("#resumo");
        infoGeral.insertAdjacentHTML(
          "afterbegin",
          `<div class="alert alert-danger alert-dismissible fade show" role="alert">
          Adicione pelo menos um colaborador.
          <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
          </button>
        </div>`
        );
        // Remove o alerta após 5 segundos
        setTimeout(() => {
          const alert = document.querySelector(".alert");
          if (alert) alert.remove();
        }, 5000);
        return;
      }

      // Prepara os dados para envio
      const dados = colaboradoresAdicionados.map((colab) => ({
        gerente,
        mes,
        colaborador: colab.colaborador,
        matricula: colab.matricula,
        cargo: colab.cargo,
        tipoHE: colab.tipoHE,
        horas: colab.horas,
        justificativa: colab.justificativa,
      }));

      // Envia os dados para o backend
      fetch("/planejamento-he/enviar-multiplo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      })
        .then((r) => r.json())
        .then((resp) => {
          if (resp.sucesso) {
            // Limpa os dados
            colaboradoresAdicionados = [];
            atualizarListaColaboradores();
            atualizarResumoFinais();
            verificarEnableProximoBtn();

            // Volta para a primeira aba
            $('#solicitacaoTabs a[href="#informacoes-gerais"]').tab("show");

            //Desativa novamente as abas seguintes
            document
              .getElementById("colaboradores-tab")
              .classList.add("disabled");
            document.getElementById("resumo-tab").classList.add("disabled");

            // Atualiza o resumo HE após envio bem-sucedido
            if (gerente && mes) {
              // Atualiza o resumo após o envio (mostrarResumoHE já atualiza os valores no elemento existente)
              mostrarResumoHE(gerente, mes);
            }

            // Exibe mensagem de sucesso
            const infoGeral = document.querySelector("#resumo");
            infoGeral.insertAdjacentHTML(
              "afterbegin",
              `<div class="alert alert-success alert-dismissible fade show" role="alert">
              ${resp.mensagem}
              <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
              </button>
            </div>`
            );
            // Remove o alerta após 5 segundos
            setTimeout(() => {
              const alert = document.querySelector(".alert");
              if (alert) alert.remove();
            }, 5000);
          } else {
            // Exibe mensagem de erro
            const infoGeral = document.querySelector("#resumo");
            infoGeral.insertAdjacentHTML(
              "afterbegin",
              `<div class="alert alert-danger alert-dismissible fade show" role="alert">
              ${resp.mensagem}
              <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
              </button>
            </div>`
            );
            // Remove o alerta após 5 segundos
            setTimeout(() => {
              const alert = document.querySelector(".alert");
              if (alert) alert.remove();
            }, 5000);
          }
        })
        .catch((error) => {
          console.error("Erro ao enviar solicitação:", error);
          // Exibe mensagem de erro
          const infoGeral = document.querySelector("#resumo");
          infoGeral.insertAdjacentHTML(
            "afterbegin",
            `<div class="alert alert-danger alert-dismissible fade show" role="alert">
            Ocorreu um erro ao enviar as solicitações. Tente novamente.
            <button type="button" class="close" data-dismiss="alert">
              <span>&times;</span>
            </button>
          </div>`
          );
          // Remove o alerta após 5 segundos
          setTimeout(() => {
            const alert = document.querySelector(".alert");
            if (alert) alert.remove();
          }, 5000);
        });
    });

  // ========== MENU DO USUÁRIO (dropdown) ==========
  const userMenu = document.querySelector(".user-menu");
  const dropdown = userMenu.querySelector(".dropdown-menu");

  // Alterna a visibilidade do dropdown ao clicar no ícone do usuário
  userMenu.addEventListener("click", (e) => {
    if (e.target.id === "perfilLink") return; // Evita fechar ao clicar no link de perfil
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  });

  // Ao clicar em "Perfil", abre um modal com os dados do usuário
  document.getElementById("perfilLink").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    dropdown.style.display = "none"; // Fecha o dropdown

    fetch("/auth/usuario")
      .then((r) => r.json())
      .then((data) => {
        document.getElementById("perfilNome").value = data.nome || "";
        document.getElementById("perfilEmail").value = data.email || "";
        document.getElementById("perfilCargo").value = data.cargo || "";

        $("#perfilModal").modal("show"); // Usa Bootstrap Modal via jQuery
      });
  });

  // Fecha o dropdown se o clique for fora dele
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  // Lógica de logout
  document.getElementById("logoutLink").addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/auth/logout-he";
  });
});
