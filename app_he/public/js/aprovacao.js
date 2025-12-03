document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("page-load:aprovacoes", setupAprovacoesPage);
});

function setupAprovacoesPage() {
  initializeFilters();

  const gerenteFilter = document.getElementById("aprovacaoFiltroGerente");
  const statusFilter = document.getElementById("aprovacaoFiltroStatus");
  const mesFilter = document.getElementById("aprovacaoFiltroMes");
  const anoFilter = document.getElementById("aprovacaoFiltroAno");
  const limparBtn = document.getElementById("btnLimparFiltrosAprovacao");
  const aprovarBtn = document.getElementById("btnAprovarSelecionados");
  const recusarBtn = document.getElementById("btnRecusarSelecionados");

  gerenteFilter.addEventListener("change", carregarDadosAprovacao);
  statusFilter.addEventListener("change", carregarDadosAprovacao);
  mesFilter.addEventListener("change", carregarDadosAprovacao);
  anoFilter.addEventListener("change", carregarDadosAprovacao);
  limparBtn.addEventListener("click", limparFiltrosAprovacao);
  aprovarBtn.addEventListener("click", () => processarEmMassa(true));
  recusarBtn.addEventListener("click", () => processarEmMassa(false));
}

function initializeFilters() {
  const mesSelect = document.getElementById("aprovacaoFiltroMes");
  const anoSelect = document.getElementById("aprovacaoFiltroAno");
  const gerenteSelect = document.getElementById("aprovacaoFiltroGerente");
  const statusSelect = document.getElementById("aprovacaoFiltroStatus");

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
  mesSelect.innerHTML = meses
    .map((m) => `<option value="${m}">${m}</option>`)
    .join("");
  mesSelect.value = meses[new Date().getMonth()];

  statusSelect.value = "PENDENTE";

  // Preenche os anos com base nos dados disponíveis
  carregarAnosDropdown(anoSelect);

  fetch("/planejamento-he/api/gerentes")
    .then((r) => r.json())
    .then((data) => {
      gerenteSelect.innerHTML = '<option value="">Todos</option>';
      if (data.gerentes) {
        data.gerentes.forEach((g) => {
          const opt = document.createElement("option");
          opt.value = g;
          opt.textContent = g;
          gerenteSelect.appendChild(opt);
        });
      }
    });
}

function carregarAnosDropdown(anoSelect) {
  // Primeiro, vamos carregar os anos únicos da tabela PLANEJAMENTO_HE
  fetch('/planejamento-he/api/meses-anos-unicos')
    .then(response => response.json())
    .then(data => {
      if (data.erro) {
        console.error('Erro ao carregar anos para o filtro:', data.erro);
        return;
      }

      // Preenche o dropdown de anos
      anoSelect.innerHTML = '<option value="">Todos os anos</option>';
      data.anos.forEach(ano => {
        const option = document.createElement("option");
        option.value = ano;
        option.textContent = ano;
        anoSelect.appendChild(option);
      });

      // Define o ano atual como padrão se estiver disponível
      const anoAtual = new Date().getFullYear();
      if (data.anos.includes(anoAtual.toString())) {
        anoSelect.value = anoAtual;
      } else if (data.anos.length > 0) {
        anoSelect.value = data.anos[0]; // Usa o primeiro ano disponível
      }
    })
    .catch(error => {
      console.error('Erro ao carregar anos para o dropdown:', error);
      // Mesmo em caso de erro, adicionamos uma opção padrão
      anoSelect.innerHTML = '<option value="">Todos os anos</option>';
    });
}

function carregarGerenciasParaSelecao() {
  const mesSelecionado = document.getElementById("selecaoGerenciaMes").value;
  const anoSelecionado = document.getElementById("selecaoGerenciaAno").value;
  const statusSelecionado = document.getElementById(
    "selecaoGerenciaStatus"
  ).value;

  // Preenche o dropdown de anos se ainda não estiver preenchido
  if (anoSelecionado === '') {
    carregarAnosDropdown(document.getElementById("selecaoGerenciaAno"));
  }

  fetch("/planejamento-he/api/gerentes")
    .then((r) => r.json())
    .then((data) => {
      const list = document.getElementById("gerenciasList");
      list.innerHTML = '<p class="text-center text-muted">Carregando...</p>';

      if (!data.gerentes || data.gerentes.length === 0) {
        list.innerHTML =
          '<p class="text-center text-muted">Nenhuma gerência disponível.</p>';
        return;
      }

      list.innerHTML = "";
      let gerenciasComSolicitacoes = 0;
      const statusTexto = statusSelecionado
        ? statusSelecionado.charAt(0) + statusSelecionado.slice(1).toLowerCase()
        : "Total";

      data.gerentes.forEach((gerente) => {
        // Monta a URL com os filtros
        let url = `/planejamento-he/api/solicitacoes-pendentes?gerente=${encodeURIComponent(
          gerente
        )}&mes=${encodeURIComponent(mesSelecionado)}`;
        if (statusSelecionado) {
          url += `&status=${statusSelecionado}`;
        }
        if (anoSelecionado) {
          url += `&ano=${anoSelecionado}`;
        }

        // Busca as solicitações filtradas
        fetch(url)
          .then((r) => r.json())
          .then((solicitacoes) => {
            if (solicitacoes.length > 0) {
              gerenciasComSolicitacoes++;

              // Calcula totais
              const totalHoras = solicitacoes.reduce(
                (sum, sol) => sum + (parseFloat(sol.HORAS) || 0),
                0
              );
              const totalValor = solicitacoes.reduce((sum, sol) => {
                const horas = parseFloat(sol.HORAS) || 0;
                const valorHora = parseFloat(sol.VALOR_HORA) || 0;
                return sum + horas * valorHora;
              }, 0);

              // Define a cor baseada no status
              let corStatus = "#350187"; // Padrão (todos)
              if (statusSelecionado === "PENDENTE") corStatus = "#350187";
              else if (statusSelecionado === "APROVADO") corStatus = "#034d19";
              else if (statusSelecionado === "RECUSADO") corStatus = "#6b0000";

              const item = document.createElement("div");
              item.className = "gerencia-list-item";
              item.onclick = () => acessarGerencia(gerente, mesSelecionado);
              item.innerHTML = `
                                <div class="gerencia-list-info">
                                    <div class="gerencia-list-icon">
                                        <i class="fas fa-user-tie"></i>
                                    </div>
                                    <div class="gerencia-list-details">
                                        <div class="gerencia-list-name">${gerente}</div>
                                        <div class="gerencia-list-meta">Mês de ${mesSelecionado}${anoSelecionado ? `/${anoSelecionado}` : ''}${
                statusSelecionado ? ` - ${statusTexto}` : ""
              }</div>
                                    </div>
                                </div>
                                <div class="gerencia-list-stats">
                                    <div class="gerencia-list-stat">
                                        <span class="gerencia-list-stat-value" style="color: ${corStatus};">${
                solicitacoes.length
              }</span>
                                        <span class="gerencia-list-stat-label">Solicitações</span>
                                    </div>
                                    <div class="gerencia-list-stat">
                                        <span class="gerencia-list-stat-value" style="color: ${corStatus};">${totalHoras.toFixed(
                1
              )}h</span>
                                        <span class="gerencia-list-stat-label">Total Horas</span>
                                    </div>
                                    <div class="gerencia-list-stat">
                                        <span class="gerencia-list-stat-value" style="color: ${corStatus}; font-size: 1.2rem; font-weight: bold;">${totalValor.toLocaleString(
                "pt-BR",
                { style: "currency", currency: "BRL" }
              )}</span>
                                        <span class="gerencia-list-stat-label">Valor Total</span>
                                    </div>
                                </div>
                                <div class="gerencia-list-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            `;
              list.appendChild(item);
            }

            // Verifica se não há gerências após processar todas
            setTimeout(() => {
              if (list.children.length === 0) {
                const statusMsg = statusSelecionado
                  ? `com status "${statusSelecionado}"`
                  : "";
                list.innerHTML = `<p class="text-center text-muted">Nenhuma gerência com solicitações ${statusMsg} em ${mesSelecionado}${anoSelecionado ? `/${anoSelecionado}` : ''}.</p>`;
              }
            }, 1000);
          });
      });
    })
    .catch((err) => {
      console.error("Erro ao carregar gerências:", err);
      document.getElementById("gerenciasList").innerHTML =
        '<p class="text-center text-danger">Erro ao carregar gerências.</p>';
    });
}

function limparFiltrosAprovacao() {
  document.getElementById("aprovacaoFiltroGerente").value = "";
  document.getElementById("aprovacaoFiltroStatus").value = "PENDENTE";
  const mesAtual = [
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
  ][new Date().getMonth()];
  document.getElementById("aprovacaoFiltroMes").value = mesAtual;
  carregarDadosAprovacao();
}

function carregarDadosAprovacao() {
  carregarAprovacoes();
  updateApprovalSummary();
}

function carregarAprovacoes() {
  const container = document.getElementById("tabelaAprovacoesContainer");
  container.innerHTML =
    '<p class="text-center text-muted">Carregando solicitações...</p>';

  const gerente = document.getElementById("aprovacaoFiltroGerente").value;
  const status = document.getElementById("aprovacaoFiltroStatus").value;
  const mes = document.getElementById("aprovacaoFiltroMes").value;
  const ano = document.getElementById("aprovacaoFiltroAno").value;

  const params = new URLSearchParams();
  if (gerente) params.append("gerente", gerente);
  if (status) params.append("status", status);
  if (mes) params.append("mes", mes);
  if (ano) params.append("ano", ano);

  const url = `/planejamento-he/api/solicitacoes-pendentes?${params.toString()}`;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
      return response.json();
    })
    .then((dados) => {
      if (dados.erro) {
        container.innerHTML = `<div class="alert alert-danger">${dados.erro}</div>`;
        return;
      }
      container.innerHTML = criarTabelaAprovacoes(dados);

      // Adiciona lógica para o checkbox "selecionar todos"
      const selectAll = document.getElementById("selectAllCheckbox");
      if (selectAll) {
        selectAll.addEventListener("change", function () {
          document
            .querySelectorAll(".solicitacao-checkbox")
            .forEach((checkbox) => {
              checkbox.checked = this.checked;
            });
        });
      }
    })
    .catch((erro) => {
      console.error("Erro ao carregar solicitações para aprovação:", erro);
      container.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados. Tente novamente.</div>`;
    });
}

function criarTabelaAprovacoes(solicitacoes) {
  if (solicitacoes.length === 0) {
    return '<p class="text-center text-muted">Nenhuma solicitação encontrada para os filtros selecionados.</p>';
  }

  let tabelaHtml = `
        <div class="table-responsive">
            <table class="table table-bordered table-hover table-sm">
                <thead class="thead-light">
                    <tr>
                        <th class="text-center"><input type="checkbox" id="selectAllCheckbox"></th>
                        <th>Colaborador</th>
                        <th>Cargo</th>
                        <th>Mês</th>
                        <th>Horas</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th class="text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;

  solicitacoes.forEach((s) => {
    const statusBadge =
      s.STATUS === "APROVADO"
        ? '<span class="badge badge-success">Aprovado</span>'
        : s.STATUS === "RECUSADO"
        ? '<span class="badge badge-danger">Recusado</span>'
        : '<span class="badge badge-warning">Pendente</span>';

    // Calcula o valor da hora extra
    const valorHora = s.VALOR_HORA || 0;
    const horas = parseFloat(s.HORAS) || 0;
    const valorTotal = (valorHora * horas).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    tabelaHtml += `
            <tr id="solicitacao-row-${s.id}">
                <td class="text-center"><input type="checkbox" class="solicitacao-checkbox" data-id="${
                  s.id
                }"></td>
                <td>${s.COLABORADOR || "-"}</td>
                <td>${s.CARGO || "-"}</td>
                <td>${s.MES || "-"}</td>
                <td>${s.HORAS || "0"}</td>
                <td>${s.TIPO_HE || "-"}</td>
                <td>${valorTotal}</td>
                <td>${statusBadge}</td>
                <td class="text-center">
                    ${
                      s.STATUS === "PENDENTE"
                        ? `
                    <button class="btn btn-success btn-sm mr-1" onclick="processarAprovacao(${s.id}, true)" title="Aprovar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="processarAprovacao(${s.id}, false)" title="Recusar">
                        <i class="fas fa-times"></i>
                    </button>`
                        : ""
                    }
                </td>
            </tr>
        `;
  });

  tabelaHtml += `
                </tbody>
            </table>
        </div>
    `;

  return tabelaHtml;
}

function processarAprovacao(id, isAprovado) {
  // Reutiliza a função de processamento em massa para consistência
  processarEmMassa(isAprovado, [id]);
}

function processarEmMassa(isAprovado, ids = null) {
  const acao = isAprovado ? "Aprovar" : "Recusar";
  const status = isAprovado ? "APROVADO" : "RECUSADO";
  const url = "/planejamento-he/api/tratar-em-massa";

  // Se os IDs não forem passados, pega dos checkboxes
  if (!ids) {
    ids = Array.from(
      document.querySelectorAll(".solicitacao-checkbox:checked")
    ).map((cb) => cb.dataset.id);
  }

  if (ids.length === 0) {
    Swal.fire(
      "Nenhum item selecionado",
      "Por favor, selecione uma ou mais solicitações para tratar.",
      "info"
    );
    return;
  }

  Swal.fire({
    title: `Confirmar ${acao} em Massa`,
    text: `Você tem certeza que deseja ${acao.toLowerCase()} ${
      ids.length
    } solicitação(ões)?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: isAprovado ? "#28a745" : "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: `Sim, ${acao.toLowerCase()}!`,
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ids, status: status }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.sucesso) {
            Swal.fire(`${acao}!`, data.mensagem, "success").then(() => {
              carregarDadosAprovacao();
            });
          } else {
            Swal.fire(
              "Erro!",
              data.mensagem || "Não foi possível completar a ação.",
              "error"
            );
          }
        })
        .catch((err) => {
          console.error(`Erro ao ${acao.toLowerCase()} em massa:`, err);
          Swal.fire(
            "Erro de Conexão!",
            "Ocorreu um problema ao se comunicar com o servidor.",
            "error"
          );
        });
    }
  });
}

function updateApprovalSummary() {
  const container = document.getElementById("resumoFinanceiroContainer");
  const gerente = document.getElementById("aprovacaoFiltroGerente").value;
  const mes = document.getElementById("aprovacaoFiltroMes").value;
  const ano = document.getElementById("aprovacaoFiltroAno").value;

  // Não retorna mais se o gerente não estiver selecionado, em vez disso, busca o resumo geral.
  container.innerHTML =
    '<p class="text-center text-muted">Calculando resumo...</p>';

  const params = new URLSearchParams({ mes }); // Inicia com o mês que é sempre obrigatório
  if (gerente) {
    params.append("gerente", gerente); // Adiciona o gerente apenas se estiver selecionado
  }
  if (ano) {
    params.append("ano", ano); // Adiciona o ano apenas se estiver selecionado
  }

  const url = `/planejamento-he/api/approval-summary?${params.toString()}`;

  fetch(url)
    .then((res) => res.json())
    .then((summary) => {
      if (summary.erro) {
        container.innerHTML = `<div class="alert alert-warning">${summary.erro}</div>`;
        return;
      }

      const formatCurrency = (value) =>
        (value || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

      const { resumoPorStatus, limiteTotal, limiteAtual, limitePosAprovacao } =
        summary;

      // Títulos e labels dinâmicos
      const tituloResumo = gerente
        ? "Resumo Financeiro da Gerência"
        : "Resumo Financeiro Geral";
      const labelLimite = gerente
        ? "Limite Total da Gerência"
        : "Limite Total Geral";

      container.innerHTML = `
                <h5 class="mb-3">${tituloResumo}</h5>
                <div class="table-responsive">
                    <table class="table table-bordered table-sm">
                        <thead class="thead-dark">
                            <tr>
                                <th>Status</th>
                                <th>Qtd. Horas</th>
                                <th>Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="badge badge-success">Aprovado</span></td>
                                <td>${(
                                  resumoPorStatus.APROVADO?.horas || 0
                                ).toFixed(2)}</td>
                                <td>${formatCurrency(
                                  resumoPorStatus.APROVADO?.valor || 0
                                )}</td>
                            </tr>
                            <tr>
                                <td><span class="badge badge-warning">Pendente</span></td>
                                <td>${(
                                  resumoPorStatus.PENDENTE?.horas || 0
                                ).toFixed(2)}</td>
                                <td>${formatCurrency(
                                  resumoPorStatus.PENDENTE?.valor || 0
                                )}</td>
                            </tr>
                             <tr>
                                <td><span class="badge badge-danger">Recusado</span></td>
                                <td>${(
                                  resumoPorStatus.RECUSADO?.horas || 0
                                ).toFixed(2)}</td>
                                <td>${formatCurrency(
                                  resumoPorStatus.RECUSADO?.valor || 0
                                )}</td>
                            </tr>
                        </tbody>
                        <tfoot class="bg-light font-weight-bold">
                            <tr>
                                <td colspan="2">${labelLimite}</td>
                                <td>${formatCurrency(limiteTotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="2">Saldo Atual (Limite - Aprovado)</td>
                                <td class="${
                                  limiteAtual < 0 ? "text-danger" : ""
                                }">${formatCurrency(limiteAtual)}</td>
                            </tr>
                            <tr>
                                <td colspan="2">Saldo Pós-Aprovação (Saldo Atual - Pendente)</td>
                                <td class="${
                                  limitePosAprovacao < 0 ? "text-danger" : ""
                                }">${formatCurrency(limitePosAprovacao)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
    })
    .catch((err) => {
      console.error("Erro ao buscar resumo financeiro:", err);
      container.innerHTML =
        '<div class="alert alert-danger">Não foi possível carregar o resumo financeiro.</div>';
    });
}
