// ================================================================================
// 📊 PAINEL DE GASTO VS PREVISTO DE HE
// ================================================================================
// Este arquivo controla o novo painel de comparação entre horas extras
// gastas (executadas) e as previamente solicitadas/aprovadas
// no sistema de planejamento, permitindo identificar horas executadas sem autorização.
// ================================================================================

// ================================================================================
// 🔧 Funções Auxiliares
// ================================================================================

/**
 * Retorna o nome do mês atual em português
 * @returns {string} Nome do mês (ex: "Janeiro", "Fevereiro", etc)
 */
function getMesAtualPortugues() {
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
  return meses[new Date().getMonth()];
}

/**
 * Formata um valor numérico como moeda brasileira (R$)
 *
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado como moeda (ex: R$ 1.234,56)
 */
function formatarMoeda(valor) {
  return (
    "R$ " +
    parseFloat(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// ================================================================================
// 📈 Carregamento e Exibição de Dados
// ================================================================================

/**
 * Carrega e exibe o comparativo de horas executadas vs autorizadas por gerente
 *
 * @param {string} mes - Mês para filtrar (obrigatório)
 * @param {string} ano - Ano para filtrar (opcional)
 */
function carregarComparativoGastoPrev(mes, ano = null) {
  const container = document.getElementById("tabelaComparativoFrequencia");
  container.innerHTML =
    '<p class="text-center text-muted">Carregando comparativo...</p>';

  const params = new URLSearchParams();
  params.append("mes", mes);
  if (ano && ano !== "") params.append("ano", ano);

  const url = `/planejamento-he/api/comparativo-gasto-prev?${params.toString()}`;

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

      if (!Array.isArray(dados) || dados.length === 0) {
        container.innerHTML =
          '<p class="text-center text-muted">Nenhum dado encontrado para o filtro selecionado.</p>';
        return;
      }

      container.innerHTML = criarTabelaComparativo(dados);

      // Carregar também a tabela de valores monetários
      carregarComparativoGastoPrevValor(mes, ano);
    })
    .catch((erro) => {
      console.error("Erro ao carregar comparativo de Gasto vs Previsto:", erro);
      container.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados. Tente novamente.</div>`;
    });
}

/**
 * Carrega e exibe o comparativo de valores monetários executados vs autorizados por gerente
 *
 * @param {string} mes - Mês para filtrar (obrigatório)
 * @param {string} ano - Ano para filtrar (opcional)
 */
function carregarComparativoGastoPrevValor(mes, ano = null) {
  const container = document.getElementById("tabelaComparativoFrequenciaValor");
  container.innerHTML =
    '<p class="text-center text-muted">Carregando comparativo monetário...</p>';

  const params = new URLSearchParams();
  params.append("mes", mes);
  if (ano && ano !== "") params.append("ano", ano);

  const url = `/planejamento-he/api/comparativo-gasto-prev-valor?${params.toString()}`;

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

      if (!Array.isArray(dados) || dados.length === 0) {
        container.innerHTML =
          '<p class="text-center text-muted">Nenhum dado monetário encontrado para o filtro selecionado.</p>';
        return;
      }

      container.innerHTML = criarTabelaComparativoValor(dados);
    })
    .catch((erro) => {
      console.error("Erro ao carregar comparativo monetário:", erro);
      container.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados monetários. Tente novamente.</div>`;
    });
}

// ================================================================================
// 📋 Criação de Tabelas
// ================================================================================

/**
 * Cria a tabela HTML do comparativo por gerente
 *
 * @param {Array} dados - Array de objetos com os dados comparativos
 * @returns {string} HTML da tabela
 */
function criarTabelaComparativo(dados) {
  let totalExecutado50 = 0;
  let totalExecutado100 = 0;
  let totalAutorizado50 = 0;
  let totalAutorizado100 = 0;
  let totalNaoAutorizado50 = 0;
  let totalNaoAutorizado100 = 0;

  // Agrupa os dados por gerente de divisão para cálculo de totais
  const dadosAgrupados = {};
  dados.forEach((item) => {
    const divisao = item.gerente_divisao || "Sem Divisão";
    if (!dadosAgrupados[divisao]) {
      dadosAgrupados[divisao] = {
        total_executado_50: 0,
        total_executado_100: 0,
        total_autorizado_50: 0,
        total_autorizado_100: 0,
        total_nao_autorizado_50: 0,
        total_nao_autorizado_100: 0,
        total_executado: 0,
        total_autorizado: 0,
        total_nao_autorizado: 0,
        gerentes: [],
      };
    }

    dadosAgrupados[divisao].total_executado_50 += item.executado_50 || 0;
    dadosAgrupados[divisao].total_executado_100 += item.executado_100 || 0;
    dadosAgrupados[divisao].total_autorizado_50 += item.autorizado_50 || 0;
    dadosAgrupados[divisao].total_autorizado_100 += item.autorizado_100 || 0;
    dadosAgrupados[divisao].total_nao_autorizado_50 += Math.max(
      0,
      (item.executado_50 || 0) - (item.autorizado_50 || 0)
    );
    dadosAgrupados[divisao].total_nao_autorizado_100 += Math.max(
      0,
      (item.executado_100 || 0) - (item.autorizado_100 || 0)
    );
    dadosAgrupados[divisao].total_executado += item.total_executado || 0;
    dadosAgrupados[divisao].total_autorizado += item.total_autorizado || 0;
    dadosAgrupados[divisao].total_nao_autorizado +=
      item.total_nao_autorizado || 0;
    dadosAgrupados[divisao].gerentes.push(item);
  });

  let html = `
    <div class="table-responsive-sm table-responsive-md table-responsive-lg">
      <table class="table table-bordered table-hover table-sm w-100">
        <thead class="thead" style="background-color: #8700d4ff; text-color: white; color: white;">
          <tr>
            <th class="text-left">Gerência SR</th>
            <th class="text-center autorizado-col" style="display: none;">Autorizado 50%</th>
            <th class="text-center autorizado-col" style="display: none;">Autorizado 100%</th>
            <th class="text-center nao-autorizado-col" style="display: none;">Não Autorizado 50%</th>
            <th class="text-center nao-autorizado-col" style="display: none;">Não Autorizado 100%</th>
            <th class="text-center">Total Autorizado</th>
            <th class="text-center">Total Não Autorizado</th>
            <th class="text-center executado-col" style="display: none;">Executado 50%</th>
            <th class="text-center executado-col" style="display: none;">Executado 100%</th>
            <th class="text-center">Total Executado</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Ordena as divisões e adiciona os dados à tabela
  Object.keys(dadosAgrupados)
    .sort()
    .forEach((divisao) => {
      const dadosDivisao = dadosAgrupados[divisao];
      const gerentes = dadosDivisao.gerentes;

      // Adiciona uma linha para o gerente de divisão com os totais consolidados nas colunas
      html += `
      <tr class="table font-weight-bold" style="background-color: #f3dbfdff;">
        <td class="text-left"><i class="fa-solid fa-users"></i> <strong>${divisao}</strong></td>
        <td class="text-center autorizado-col" style="display: none;"><strong>${dadosDivisao.total_autorizado_50.toFixed(
          2
        )}</strong></td>
        <td class="text-center autorizado-col" style="display: none;"><strong>${dadosDivisao.total_autorizado_100.toFixed(
          2
        )}</strong></td>
        <td class="text-center nao-autorizado-col" style="display: none;"><strong>${dadosDivisao.total_nao_autorizado_50.toFixed(
          2
        )}</strong></td>
        <td class="text-center nao-autorizado-col" style="display: none;"><strong>${dadosDivisao.total_nao_autorizado_100.toFixed(
          2
        )}</strong></td>
        <td class="text-center"><strong>${dadosDivisao.total_autorizado.toFixed(
          2
        )}</strong></td>
        <td class="text-center"><strong>${dadosDivisao.total_nao_autorizado.toFixed(
          2
        )}</strong></td>
        <td class="text-center executado-col" style="display: none;"><strong>${dadosDivisao.total_executado_50.toFixed(
          2
        )}</strong></td>
        <td class="text-center executado-col" style="display: none;"><strong>${dadosDivisao.total_executado_100.toFixed(
          2
        )}</strong></td>
        <td class="text-center"><strong>${dadosDivisao.total_executado.toFixed(
          2
        )}</strong></td>
      </tr>
    `;

      // Adiciona linha para cada gerente sob a divisão
      gerentes.forEach((item) => {
        const naoAut50 = Math.max(
          0,
          (item.executado_50 || 0) - (item.autorizado_50 || 0)
        );
        const naoAut100 = Math.max(
          0,
          (item.executado_100 || 0) - (item.autorizado_100 || 0)
        );

        // Extrai o primeiro nome e nome completo do gerente
        const primeiroNome = item.gerente ? item.gerente.split(" ")[0] : "-";
        const nomeCompleto = item.gerente || "-";

        html += `
        <tr>
          <td class="text-left"><strong class="nome-completo">${nomeCompleto}</strong><strong class="primeiro-nome" style="display: none;">${primeiroNome}</strong></td>
          <td class="text-center autorizado-col" style="display: none;">${(
            item.autorizado_50 || 0
          ).toFixed(2)}</td>
          <td class="text-center autorizado-col" style="display: none;">${(
            item.autorizado_100 || 0
          ).toFixed(2)}</td>
          <td class="text-center nao-autorizado-col" style="display: none;">${naoAut50.toFixed(
            2
          )}</td>
          <td class="text-center nao-autorizado-col" style="display: none;">${naoAut100.toFixed(
            2
          )}</td>
          <td class="text-center">${(item.total_autorizado || 0).toFixed(
            2
          )}</td>
          <td class="text-center">${(item.total_nao_autorizado || 0).toFixed(
            2
          )}</td>
          <td class="text-center executado-col" style="display: none;">${(
            item.executado_50 || 0
          ).toFixed(2)}</td>
          <td class="text-center executado-col" style="display: none;">${(
            item.executado_100 || 0
          ).toFixed(2)}</td>
          <td class="text-center">${(item.total_executado || 0).toFixed(2)}</td>
        </tr>
      `;

        // Acumula totais
        totalExecutado50 += item.executado_50 || 0;
        totalExecutado100 += item.executado_100 || 0;
        totalAutorizado50 += item.autorizado_50 || 0;
        totalAutorizado100 += item.autorizado_100 || 0;
        totalNaoAutorizado50 += naoAut50;
        totalNaoAutorizado100 += naoAut100;
      });
    });

  // Adiciona linha de total geral
  html += `
        </tbody>
        <tfoot class="font-weight-bold" style="background-color: #f8f9fa;">
          <tr>
            <td class="text-left">TOTAL GERAL</td>
            <td class="text-center autorizado-col" style="display: none;">${totalAutorizado50.toFixed(
              2
            )}</td>
            <td class="text-center autorizado-col" style="display: none;">${totalAutorizado100.toFixed(
              2
            )}</td>
            <td class="text-center nao-autorizado-col" style="display: none;">${totalNaoAutorizado50.toFixed(
              2
            )}</td>
            <td class="text-center nao-autorizado-col" style="display: none;">${totalNaoAutorizado100.toFixed(
              2
            )}</td>
            <td class="text-center">${(
              totalAutorizado50 + totalAutorizado100
            ).toFixed(2)}</td>
            <td class="text-center">${(
              totalNaoAutorizado50 + totalNaoAutorizado100
            ).toFixed(2)}</td>
            <td class="text-center executado-col" style="display: none;">${totalExecutado50.toFixed(
              2
            )}</td>
            <td class="text-center executado-col" style="display: none;">${totalExecutado100.toFixed(
              2
            )}</td>
            <td class="text-center">${(
              totalExecutado50 + totalExecutado100
            ).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  return html;
}

/**
 * Cria a tabela HTML do comparativo por gerente em valores monetários (R$)
 *
 * @param {Array} dados - Array de objetos com os dados comparativos em valores monetários
 * @returns {string} HTML da tabela
 */
function criarTabelaComparativoValor(dados) {
  let totalExecutado50 = 0;
  let totalExecutado100 = 0;
  let totalAutorizado50 = 0;
  let totalAutorizado100 = 0;
  let totalNaoAutorizado50 = 0;
  let totalNaoAutorizado100 = 0;

  // Agrupa os dados por gerente de divisão para cálculo de totais
  const dadosAgrupados = {};
  dados.forEach((item) => {
    const divisao = item.gerente_divisao || "Sem Divisão";
    if (!dadosAgrupados[divisao]) {
      dadosAgrupados[divisao] = {
        total_executado_50: 0,
        total_executado_100: 0,
        total_autorizado_50: 0,
        total_autorizado_100: 0,
        total_nao_autorizado_50: 0,
        total_nao_autorizado_100: 0,
        total_executado: 0,
        total_autorizado: 0,
        total_nao_autorizado: 0,
        gerentes: [],
      };
    }

    dadosAgrupados[divisao].total_executado_50 += item.executado_50 || 0;
    dadosAgrupados[divisao].total_executado_100 += item.executado_100 || 0;
    dadosAgrupados[divisao].total_autorizado_50 += item.autorizado_50 || 0;
    dadosAgrupados[divisao].total_autorizado_100 += item.autorizado_100 || 0;
    dadosAgrupados[divisao].total_nao_autorizado_50 += Math.max(
      0,
      (item.executado_50 || 0) - (item.autorizado_50 || 0)
    );
    dadosAgrupados[divisao].total_nao_autorizado_100 += Math.max(
      0,
      (item.executado_100 || 0) - (item.autorizado_100 || 0)
    );
    dadosAgrupados[divisao].total_executado += item.total_executado || 0;
    dadosAgrupados[divisao].total_autorizado += item.total_autorizado || 0;
    dadosAgrupados[divisao].total_nao_autorizado +=
      item.total_nao_autorizado || 0;
    dadosAgrupados[divisao].gerentes.push(item);
  });

  let html = `

    <div class="table-responsive-sm table-responsive-md table-responsive-lg">
      <table class="table table-bordered table-hover table-sm w-100">
        <thead class="thead" style="background-color: #8700d4ff; text-color: white; color: white;">
          <tr>
            <th class="text-left">Gerência SR</th>
            <th class="text-center autorizado-col" style="display: none;">Autorizado 50% (R$)</th>
            <th class="text-center autorizado-col" style="display: none;">Autorizado 100% (R$)</th>
            <th class="text-center nao-autorizado-col" style="display: none;">Não Autorizado 50% (R$)</th>
            <th class="text-center nao-autorizado-col" style="display: none;">Não Autorizado 100% (R$)</th>
            <th class="text-center">Total Autorizado (R$)</th>
            <th class="text-center">Total Não Autorizado (R$)</th>
            <th class="text-center executado-col" style="display: none;">Executado 50% (R$)</th>
            <th class="text-center executado-col" style="display: none;">Executado 100% (R$)</th>
            <th class="text-center">Total Executado (R$)</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Ordena as divisões e adiciona os dados à tabela
  Object.keys(dadosAgrupados)
    .sort()
    .forEach((divisao) => {
      const dadosDivisao = dadosAgrupados[divisao];
      const gerentes = dadosDivisao.gerentes;

      // Adiciona uma linha para o gerente de divisão com os totais consolidados nas colunas
      html += `
      <tr class="table font-weight-bold" style="background-color: #f3dbfdff;">
        <td class="text-left"><i class="fa-solid fa-users"></i> <strong>${divisao}</strong></td>
        <td class="text-center autorizado-col" style="display: none;"><strong>${formatarMoeda(
          dadosDivisao.total_autorizado_50
        )}</strong></td>
        <td class="text-center autorizado-col" style="display: none;"><strong>${formatarMoeda(
          dadosDivisao.total_autorizado_100
        )}</strong></td>
        <td class="text-center nao-autorizado-col" style="display: none;"><strong>${formatarMoeda(
          dadosDivisao.total_nao_autorizado_50
        )}</strong></td>
        <td class="text-center nao-autorizado-col" style="display: none;"><strong>${formatarMoeda(
          dadosDivisao.total_nao_autorizado_100
        )}</strong></td>
        <td class="text-center"><strong>${formatarMoeda(
          dadosDivisao.total_autorizado
        )}</strong></td>
        <td class="text-center"><strong>${formatarMoeda(
          dadosDivisao.total_nao_autorizado
        )}</strong></td>
        <td class="text-center executado-col" style="display: none;"><strong>${formatarMoeda(
          dadosDivisao.total_executado_50
        )}</strong></td>
        <td class="text-center executado-col" style="display: none;"><strong>${formatarMoeda(
          dadosDivisao.total_executado_100
        )}</strong></td>
        <td class="text-center"><strong>${formatarMoeda(
          dadosDivisao.total_executado
        )}</strong></td>
      </tr>
    `;

      // Adiciona linha para cada gerente sob a divisão
      gerentes.forEach((item) => {
        const naoAut50 = Math.max(
          0,
          (item.executado_50 || 0) - (item.autorizado_50 || 0)
        );
        const naoAut100 = Math.max(
          0,
          (item.executado_100 || 0) - (item.autorizado_100 || 0)
        );

        // Extrai o primeiro nome e nome completo do gerente
        const primeiroNome = item.gerente ? item.gerente.split(" ")[0] : "-";
        const nomeCompleto = item.gerente || "-";

        html += `
        <tr>
          <td class="text-left"><strong class="nome-completo">${nomeCompleto}</strong><strong class="primeiro-nome" style="display: none;">${primeiroNome}</strong></td>
          <td class="text-center autorizado-col" style="display: none;">${formatarMoeda(
            item.autorizado_50 || 0
          )}</td>
          <td class="text-center autorizado-col" style="display: none;">${formatarMoeda(
            item.autorizado_100 || 0
          )}</td>
          <td class="text-center nao-autorizado-col" style="display: none;">${formatarMoeda(
            naoAut50
          )}</td>
          <td class="text-center nao-autorizado-col" style="display: none;">${formatarMoeda(
            naoAut100
          )}</td>
          <td class="text-center">${formatarMoeda(
            item.total_autorizado || 0
          )}</td>
          <td class="text-center">${formatarMoeda(
            item.total_nao_autorizado || 0
          )}</td>
          <td class="text-center executado-col" style="display: none;">${formatarMoeda(
            item.executado_50 || 0
          )}</td>
          <td class="text-center executado-col" style="display: none;">${formatarMoeda(
            item.executado_100 || 0
          )}</td>
          <td class="text-center">${formatarMoeda(
            item.total_executado || 0
          )}</td>
        </tr>
      `;

        // Acumula totais
        totalExecutado50 += item.executado_50 || 0;
        totalExecutado100 += item.executado_100 || 0;
        totalAutorizado50 += item.autorizado_50 || 0;
        totalAutorizado100 += item.autorizado_100 || 0;
        totalNaoAutorizado50 += naoAut50;
        totalNaoAutorizado100 += naoAut100;
      });
    });

  // Adiciona linha de total geral
  html += `
        </tbody>
        <tfoot class="font-weight-bold" style="background-color: #f8f9fa;">
          <tr>
            <td class="text-left">TOTAL GERAL</td>
            <td class="text-center autorizado-col" style="display: none;">${formatarMoeda(
              totalAutorizado50
            )}</td>
            <td class="text-center autorizado-col" style="display: none;">${formatarMoeda(
              totalAutorizado100
            )}</td>
            <td class="text-center nao-autorizado-col" style="display: none;">${formatarMoeda(
              totalNaoAutorizado50
            )}</td>
            <td class="text-center nao-autorizado-col" style="display: none;">${formatarMoeda(
              totalNaoAutorizado100
            )}</td>
            <td class="text-center">${formatarMoeda(
              totalAutorizado50 + totalAutorizado100
            )}</td>
            <td class="text-center">${formatarMoeda(
              totalNaoAutorizado50 + totalNaoAutorizado100
            )}</td>
            <td class="text-center executado-col" style="display: none;">${formatarMoeda(
              totalExecutado50
            )}</td>
            <td class="text-center executado-col" style="display: none;">${formatarMoeda(
              totalExecutado100
            )}</td>
            <td class="text-center">${formatarMoeda(
              totalExecutado50 + totalExecutado100
            )}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  return html;
}

// ================================================================================
// 🎬 Inicialização do Painel
// ================================================================================

/**
 * Inicializa o painel de frequência vs planejamento
 */
function inicializarPainelGastoPrev() {
  const mesSelect = document.getElementById("filtroMesComparativo");
  const anoSelect = document.getElementById("filtroAnoComparativo");

  // Busca os meses disponíveis na tabela de frequência
  fetch("/planejamento-he/api/gasto-prev/meses-disponiveis")
    .then((res) => res.json())
    .then((mesesDisponiveis) => {
      // Limpa os selects antes de popular
      mesSelect.innerHTML = "";
      anoSelect.innerHTML = '<option value="">Todos os anos</option>';

      if (mesesDisponiveis && mesesDisponiveis.length > 0) {
        // Agrupa os meses por ano para preencher o dropdown de anos
        const anos = [...new Set(mesesDisponiveis.map(m => m.ano))];
        anos.forEach(ano => {
          const option = document.createElement("option");
          option.value = ano;
          option.textContent = ano;
          anoSelect.appendChild(option);
        });

        // Popula o select de meses com os meses retornados pela API
        mesSelect.innerHTML = mesesDisponiveis
          .map((m) => `<option value="${m.nome}" data-ano="${m.ano}">${m.nome}/${m.ano}</option>`)
          .join("");

        // Lógica para definir o mês e ano padrão
        const mesAtual = getMesAtualPortugues();
        const anoAtual = new Date().getFullYear();

        // Verifica se o mês/ano atual existe na lista de meses disponíveis
        const mesAnoAtualDisponivel = mesesDisponiveis.find(
          (m) => m.nome === mesAtual && m.ano === anoAtual
        );

        if (mesAnoAtualDisponivel) {
          // Se o mês/ano atual existe, define eles como padrão
          mesSelect.value = mesAtual;
          anoSelect.value = anoAtual;
        } else {
          // Se não, define o mais recente da lista (que é o primeiro) como padrão
          mesSelect.value = mesesDisponiveis[0].nome;
          anoSelect.value = mesesDisponiveis[0].ano;
        }
      } else {
        mesSelect.innerHTML =
          '<option value="" disabled>Nenhum mês com dados</option>';
        anoSelect.innerHTML =
          '<option value="" disabled>Nenhum ano com dados</option>';
      }
      // Carrega os dados iniciais com o mês e ano padrão
      carregarComparativoGastoPrev(mesSelect.value, anoSelect.value);

      // Carregar também a nova tabela com os dados iniciais
      preencherFiltroGerenciaColaborador();
      carregarComparativoColaborador(mesSelect.value, anoSelect.value);
    })
    .catch((err) => {
      console.error("Erro ao buscar meses disponíveis:", err);
      mesSelect.innerHTML = '<option value="">Erro ao carregar</option>';
      anoSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    });

  // Inicializa o container da nova tabela de valores
  const containerValor = document.getElementById(
    "tabelaComparativoFrequenciaValor"
  );
  if (containerValor) {
    containerValor.innerHTML =
      '<p class="text-center text-muted">Aguardando dados monetários...</p>';
  }

  // Configura event listeners
  document
    .getElementById("filtroMesComparativo")
    .addEventListener("change", function () {
      const mes = this.value;
      const ano = document.getElementById("filtroAnoComparativo").value;
      carregarComparativoGastoPrev(mes, ano);
      carregarComparativoGastoPrevValor(mes, ano);

      // Atualizar o filtro de gerência e carregar a nova tabela
      preencherFiltroGerenciaColaborador();
      carregarComparativoColaborador(mes, ano);
    });

  // Event listener para o dropdown de ano
  document
    .getElementById("filtroAnoComparativo")
    .addEventListener("change", function () {
      const ano = this.value;
      const mes = document.getElementById("filtroMesComparativo").value;

      // Atualiza o dropdown de meses para mostrar apenas os meses do ano selecionado
      atualizarMesesDropdown(ano);

      carregarComparativoGastoPrev(mes, ano);
      carregarComparativoGastoPrevValor(mes, ano);

      // Atualizar o filtro de gerência e carregar a nova tabela
      preencherFiltroGerenciaColaborador();
      carregarComparativoColaborador(mes, ano);
    });

  // Event listener para o filtro de gerência dos colaboradores
  document
    .getElementById("filtroGerenciaColaborador")
    .addEventListener("change", function () {
      const mes = document.getElementById("filtroMesComparativo").value;
      const ano = document.getElementById("filtroAnoComparativo").value;
      const gerente = this.value;

      carregarComparativoColaborador(mes, ano, gerente);
    });

  // Botão para limpar filtros
  document
    .getElementById("btnLimparFiltrosComparativo")
    .addEventListener("click", function () {
      fetch("/planejamento-he/api/gasto-prev/meses-disponiveis")
        .then((res) => res.json())
        .then((mesesDisponiveis) => {
          const mesSelect = document.getElementById("filtroMesComparativo");
          const anoSelect = document.getElementById("filtroAnoComparativo");
          const gerenteSelect = document.getElementById("filtroGerenciaColaborador");

          // Limpa os selects e os re-popula
          mesSelect.innerHTML = "";
          anoSelect.innerHTML = '<option value="">Todos os anos</option>';
          gerenteSelect.innerHTML = '<option value="">Todas as Gerências</option>';

          if (mesesDisponiveis && mesesDisponiveis.length > 0) {
            // Agrupa os meses por ano para preencher o dropdown de anos
            const anos = [...new Set(mesesDisponiveis.map(m => m.ano))];
            anos.forEach(ano => {
              const option = document.createElement("option");
              option.value = ano;
              option.textContent = ano;
              anoSelect.appendChild(option);
            });

            // Popula o select de meses
            mesSelect.innerHTML = mesesDisponiveis
              .map((m) => `<option value="${m.nome}" data-ano="${m.ano}">${m.nome}/${m.ano}</option>`)
              .join("");

            // Define o mês e ano padrão (o mais recente da lista)
            const mesPadrao = mesesDisponiveis[0].nome;
            const anoPadrao = mesesDisponiveis[0].ano;
            mesSelect.value = mesPadrao;
            anoSelect.value = anoPadrao;

            carregarComparativoGastoPrev(mesPadrao, anoPadrao);
            carregarComparativoGastoPrevValor(mesPadrao, anoPadrao);

            // Atualizar o filtro de gerência e carregar a nova tabela
            preencherFiltroGerenciaColaborador();
            carregarComparativoColaborador(mesPadrao, anoPadrao);
          } else {
            mesSelect.innerHTML = '<option value="" disabled>Nenhum mês com dados</option>';
            anoSelect.innerHTML = '<option value="" disabled>Nenhum ano com dados</option>';
            gerenteSelect.innerHTML = '<option value="">Nenhuma gerência disponível</option>';
          }
        })
        .catch((err) => {
          console.error("Erro ao buscar meses disponíveis:", err);
        });
    });
}

/**
 * Atualiza o dropdown de meses para mostrar apenas os meses do ano selecionado
 * @param {string} ano - Ano selecionado
 */
function atualizarMesesDropdown(ano) {
  const mesSelect = document.getElementById("filtroMesComparativo");
  const anoSelect = document.getElementById("filtroAnoComparativo");

  // Busca novamente os meses disponíveis para atualizar o dropdown
  fetch("/planejamento-he/api/gasto-prev/meses-disponiveis")
    .then((res) => res.json())
    .then((mesesDisponiveis) => {
      if (mesesDisponiveis && mesesDisponiveis.length > 0) {
        if (ano && ano !== "") {
          // Filtra os meses apenas para o ano selecionado
          const mesesDoAno = mesesDisponiveis.filter(m => m.ano === ano);
          mesSelect.innerHTML = mesesDoAno
            .map((m) => `<option value="${m.nome}" data-ano="${m.ano}">${m.nome}</option>`)
            .join("");

          // Define o primeiro mês do ano como padrão
          if (mesesDoAno.length > 0) {
            mesSelect.value = mesesDoAno[0].nome;
          }
        } else {
          // Se nenhum ano está selecionado, mostra todos os meses
          mesSelect.innerHTML = mesesDisponiveis
            .map((m) => `<option value="${m.nome}" data-ano="${m.ano}">${m.nome}/${m.ano}</option>`)
            .join("");
        }
      }
    })
    .catch((err) => {
      console.error("Erro ao atualizar meses disponíveis:", err);
    });
}

// ================================================================================
// 🔘 Função para alternar visibilidade das colunas de execução
// ================================================================================

let colunasExecucaoExpandidas = false;

/**
 * Alterna a visibilidade das colunas de execução (50% e 100%)
 */
function alternarColunasExecucao() {
  const iconesExecucao = document.querySelectorAll(
    "#iconeExecucao, .execucao-resumo i"
  );
  const textoBtn = document.getElementById("textoBtnExecucao");
  const colunasExecutado = document.querySelectorAll(".executado-col");
  const colunasAutorizado = document.querySelectorAll(".autorizado-col");
  const colunasNaoAutorizado = document.querySelectorAll(".nao-autorizado-col");
  const nomesCompletos = document.querySelectorAll(".nome-completo");
  const primeiroNomes = document.querySelectorAll(".primeiro-nome");

  colunasExecucaoExpandidas = !colunasExecucaoExpandidas;

  // Atualiza o ícone e o texto do botão
  iconesExecucao.forEach((icone) => {
    icone.className = colunasExecucaoExpandidas
      ? "fas fa-chevron-up"
      : "fas fa-chevron-down";
  });

  textoBtn.textContent = colunasExecucaoExpandidas
    ? "Recolher Detalhes"
    : "Expandir Detalhes";

  // Alterna a visibilidade das colunas
  colunasExecutado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoExpandidas ? "table-cell" : "none";
  });

  colunasAutorizado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoExpandidas ? "table-cell" : "none";
  });

  colunasNaoAutorizado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoExpandidas ? "table-cell" : "none";
  });

  // Alterna entre nome completo e primeiro nome
  // Quando recolhido (estado inicial), mostra nome completo
  // Quando expandido, mostra primeiro nome
  nomesCompletos.forEach((nome) => {
    nome.style.display = colunasExecucaoExpandidas ? "none" : "inline";
  });

  primeiroNomes.forEach((nome) => {
    nome.style.display = colunasExecucaoExpandidas ? "inline" : "none";
  });
}

// ================================================================================
// 🔘 Função para alternar visibilidade das colunas de execução na tabela de valores
// ================================================================================

let colunasExecucaoValorExpandidas = false;

/**
 * Alterna a visibilidade das colunas de execução (50% e 100%) na tabela de valores
 */
function alternarColunasExecucaoValor() {
  const iconesExecucao = document.querySelectorAll(
    "#iconeExecucaoValor, .execucao-resumo i"
  );
  const textoBtn = document.getElementById("textoBtnExecucaoValor");
  const colunasExecutado = document.querySelectorAll(".executado-col");
  const colunasAutorizado = document.querySelectorAll(".autorizado-col");
  const colunasNaoAutorizado = document.querySelectorAll(".nao-autorizado-col");

  colunasExecucaoValorExpandidas = !colunasExecucaoValorExpandidas;

  // Atualiza o ícone e o texto do botão
  iconesExecucao.forEach((icone) => {
    icone.className = colunasExecucaoValorExpandidas
      ? "fas fa-chevron-up"
      : "fas fa-chevron-down";
  });

  textoBtn.textContent = colunasExecucaoValorExpandidas
    ? "Recolher Detalhes"
    : "Expandir Detalhes";

  // Alterna a visibilidade das colunas
  colunasExecutado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoValorExpandidas
      ? "table-cell"
      : "none";
  });

  colunasAutorizado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoValorExpandidas
      ? "table-cell"
      : "none";
  });

  colunasNaoAutorizado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoValorExpandidas
      ? "table-cell"
      : "none";
  });
}

// ================================================================================
// 🔘 Função para alternar visualização entre Horas e Valores
// ================================================================================

/**
 * Alterna a visualização entre as tabelas de horas e valores
 * @param {string} tipo - 'horas' ou 'valores'
 */
function alterarVisualizacao(tipo) {
  const tabelaHoras = document.getElementById("tabelaComparativoFrequencia");
  const tabelaValores = document.getElementById(
    "tabelaComparativoFrequenciaValor"
  );
  const titulo = document.getElementById("tituloTabelaComparativo");
  const btnHoras = document.getElementById("btnVisualizacaoHoras");
  const btnValores = document.getElementById("btnVisualizacaoValores");

  // Atualiza o título da tabela
  if (tipo === "horas") {
    titulo.innerHTML =
      '<i class="fas fa-users"></i> <span>Visão por Gerência (Horas)</span>';
    tabelaHoras.style.display = "block";
    tabelaValores.style.display = "none";

    // Atualiza os botões para refletir o estado ativo
    btnHoras.classList.add("active");
    btnHoras.classList.remove("btn-outline-success");
    btnHoras.classList.add("btn-outline-primary");
    btnValores.classList.remove("active");
    btnValores.classList.remove("btn-outline-primary");
    btnValores.classList.add("btn-outline-success");
  } else if (tipo === "valores") {
    titulo.innerHTML =
      '<i class="fas fa-dollar-sign"></i> <span>Visão por Gerência (Valores em R$)</span>';
    tabelaHoras.style.display = "none";
    tabelaValores.style.display = "block";

    // Atualiza os botões para refletir o estado ativo
    btnValores.classList.add("active");
    btnValores.classList.remove("btn-outline-primary");
    btnValores.classList.add("btn-outline-success");
    btnHoras.classList.remove("active");
    btnHoras.classList.remove("btn-outline-success");
    btnHoras.classList.add("btn-outline-primary");
  }
}

/**
 * Preenche o dropdown de filtro de gerência com as gerências disponíveis
 */
function preencherFiltroGerenciaColaborador() {
  const filtroSelect = document.getElementById("filtroGerenciaColaborador");

  // Busca as gerências disponíveis na tabela de frequência
  const mes = document.getElementById("filtroMesComparativo").value;
  const ano = document.getElementById("filtroAnoComparativo").value;

  if (!mes) {
    filtroSelect.innerHTML = '<option value="">Selecione um mês primeiro</option>';
    return;
  }

  const params = new URLSearchParams();
  params.append("mes", mes);
  if (ano && ano !== "") params.append("ano", ano);

  const url = `/planejamento-he/api/gerentes-disponiveis?${params.toString()}`;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
      return response.json();
    })
    .then((dados) => {
      if (dados.erro) {
        filtroSelect.innerHTML = '<option value="">Erro ao carregar gerentes</option>';
        return;
      }

      if (!Array.isArray(dados) || dados.length === 0) {
        filtroSelect.innerHTML = '<option value="">Nenhuma gerência encontrada</option>';
        return;
      }

      // Adiciona as opções ao dropdown
      filtroSelect.innerHTML = '<option value="">Todas as Gerências</option>';
      dados.forEach((gerente) => {
        const option = document.createElement("option");
        option.value = gerente.gerente;
        option.textContent = gerente.gerente;
        filtroSelect.appendChild(option);
      });
    })
    .catch((erro) => {
      console.error("Erro ao carregar gerências disponíveis:", erro);
      filtroSelect.innerHTML = '<option value="">Erro ao carregar gerências</option>';
    });
}

/**
 * Carrega e exibe o comparativo de horas executadas vs autorizadas por colaborador
 *
 * @param {string} mes - Mês para filtrar (obrigatório)
 * @param {string} ano - Ano para filtrar (opcional)
 * @param {string} gerente - Gerente para filtrar (opcional)
 */
function carregarComparativoColaborador(mes, ano = null, gerente = null) {
  const container = document.getElementById("tabelaComparativoColaborador");
  container.innerHTML =
    '<p class="text-center text-muted">Carregando comparativo por colaborador...</p>';

  const params = new URLSearchParams();
  params.append("mes", mes);
  if (ano && ano !== "") params.append("ano", ano);
  if (gerente && gerente !== "") params.append("gerente", gerente);

  const url = `/planejamento-he/api/comparativo-gasto-prev-colaborador?${params.toString()}`;

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

      if (!Array.isArray(dados) || dados.length === 0) {
        container.innerHTML =
          '<p class="text-center text-muted">Nenhum dado encontrado para o filtro selecionado.</p>';
        return;
      }

      container.innerHTML = criarTabelaComparativoColaborador(dados);

      // Carregar também a tabela de valores monetários
      carregarComparativoColaboradorValor(mes, ano, gerente);
    })
    .catch((erro) => {
      console.error("Erro ao carregar comparativo de Gasto vs Previsto por Colaborador:", erro);
      container.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados por colaborador. Tente novamente.</div>`;
    });
}

/**
 * Carrega e exibe o comparativo de valores monetários executados vs autorizados por colaborador
 *
 * @param {string} mes - Mês para filtrar (obrigatório)
 * @param {string} ano - Ano para filtrar (opcional)
 * @param {string} gerente - Gerente para filtrar (opcional)
 */
function carregarComparativoColaboradorValor(mes, ano = null, gerente = null) {
  const container = document.getElementById("tabelaComparativoColaboradorValor");
  container.innerHTML =
    '<p class="text-center text-muted">Carregando comparativo monetário por colaborador...</p>';

  const params = new URLSearchParams();
  params.append("mes", mes);
  if (ano && ano !== "") params.append("ano", ano);
  if (gerente && gerente !== "") params.append("gerente", gerente);

  const url = `/planejamento-he/api/comparativo-gasto-prev-colaborador-valor?${params.toString()}`;

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

      if (!Array.isArray(dados) || dados.length === 0) {
        container.innerHTML =
          '<p class="text-center text-muted">Nenhum dado monetário encontrado para o filtro selecionado.</p>';
        return;
      }

      container.innerHTML = criarTabelaComparativoColaboradorValor(dados);
    })
    .catch((erro) => {
      console.error("Erro ao carregar comparativo monetário por colaborador:", erro);
      container.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados monetários por colaborador. Tente novamente.</div>`;
    });
}

/**
 * Cria a tabela HTML do comparativo por colaborador
 *
 * @param {Array} dados - Array de objetos com os dados comparativos
 * @returns {string} HTML da tabela
 */
function criarTabelaComparativoColaborador(dados) {
  let totalExecutado50 = 0;
  let totalExecutado100 = 0;
  let totalAutorizado50 = 0;
  let totalAutorizado100 = 0;
  let totalNaoAutorizado50 = 0;
  let totalNaoAutorizado100 = 0;

  // Agrupa os dados por gerente de divisão para cálculo de totais
  const dadosAgrupados = {};
  dados.forEach((item) => {
    const gerente = item.gerente || "Sem Gerente";
    if (!dadosAgrupados[gerente]) {
      dadosAgrupados[gerente] = {
        colaboradores: [],
        total_executado_50: 0,
        total_executado_100: 0,
        total_autorizado_50: 0,
        total_autorizado_100: 0,
        total_nao_autorizado_50: 0,
        total_nao_autorizado_100: 0,
        total_executado: 0,
        total_autorizado: 0,
        total_nao_autorizado: 0,
      };
    }

    dadosAgrupados[gerente].total_executado_50 += item.executado_50 || 0;
    dadosAgrupados[gerente].total_executado_100 += item.executado_100 || 0;
    dadosAgrupados[gerente].total_autorizado_50 += item.autorizado_50 || 0;
    dadosAgrupados[gerente].total_autorizado_100 += item.autorizado_100 || 0;
    dadosAgrupados[gerente].total_nao_autorizado_50 += Math.max(
      0,
      (item.executado_50 || 0) - (item.autorizado_50 || 0)
    );
    dadosAgrupados[gerente].total_nao_autorizado_100 += Math.max(
      0,
      (item.executado_100 || 0) - (item.autorizado_100 || 0)
    );
    dadosAgrupados[gerente].total_executado += item.total_executado || 0;
    dadosAgrupados[gerente].total_autorizado += item.total_autorizado || 0;
    dadosAgrupados[gerente].total_nao_autorizado +=
      item.total_nao_autorizado || 0;
    dadosAgrupados[gerente].colaboradores.push(item);
  });

  let html = `
    <div class="table-responsive-sm table-responsive-md table-responsive-lg">
      <table class="table table-bordered table-hover table-sm w-100">
        <thead class="thead" style="background-color: #8700d4ff; text-color: white; color: white;">
          <tr>
            <th class="text-left">Colaborador</th>
            <th class="text-center">Gerente</th>
            <th class="text-center autorizado-col" style="display: none;">Autorizado 50%</th>
            <th class="text-center autorizado-col" style="display: none;">Autorizado 100%</th>
            <th class="text-center nao-autorizado-col" style="display: none;">Não Autorizado 50%</th>
            <th class="text-center nao-autorizado-col" style="display: none;">Não Autorizado 100%</th>
            <th class="text-center">Total Autorizado</th>
            <th class="text-center">Total Não Autorizado</th>
            <th class="text-center executado-col" style="display: none;">Executado 50%</th>
            <th class="text-center executado-col" style="display: none;">Executado 100%</th>
            <th class="text-center">Total Executado</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Ordena os gerentes e adiciona os dados à tabela
  Object.keys(dadosAgrupados)
    .sort()
    .forEach((gerente) => {
      const dadosGerente = dadosAgrupados[gerente];
      const colaboradores = dadosGerente.colaboradores;

      // Adiciona uma linha para o gerente com os totais consolidados
      html += `
      <tr class="table font-weight-bold" style="background-color: #f3dbfdff;">
        <td class="text-left"><i class="fa-solid fa-user-tie"></i> <strong>${gerente}</strong></td>
        <td class="text-center">TOTAL</td>
        <td class="text-center autorizado-col" style="display: none;"><strong>${dadosGerente.total_autorizado_50.toFixed(
          2
        )}</strong></td>
        <td class="text-center autorizado-col" style="display: none;"><strong>${dadosGerente.total_autorizado_100.toFixed(
          2
        )}</strong></td>
        <td class="text-center nao-autorizado-col" style="display: none;"><strong>${dadosGerente.total_nao_autorizado_50.toFixed(
          2
        )}</strong></td>
        <td class="text-center nao-autorizado-col" style="display: none;"><strong>${dadosGerente.total_nao_autorizado_100.toFixed(
          2
        )}</strong></td>
        <td class="text-center"><strong>${dadosGerente.total_autorizado.toFixed(
          2
        )}</strong></td>
        <td class="text-center"><strong>${dadosGerente.total_nao_autorizado.toFixed(
          2
        )}</strong></td>
        <td class="text-center executado-col" style="display: none;"><strong>${dadosGerente.total_executado_50.toFixed(
          2
        )}</strong></td>
        <td class="text-center executado-col" style="display: none;"><strong>${dadosGerente.total_executado_100.toFixed(
          2
        )}</strong></td>
        <td class="text-center"><strong>${dadosGerente.total_executado.toFixed(
          2
        )}</strong></td>
      </tr>
    `;

      // Adiciona linha para cada colaborador sob o gerente
      colaboradores.forEach((item) => {
        const naoAut50 = Math.max(
          0,
          (item.executado_50 || 0) - (item.autorizado_50 || 0)
        );
        const naoAut100 = Math.max(
          0,
          (item.executado_100 || 0) - (item.autorizado_100 || 0)
        );

        html += `
        <tr>
          <td class="text-left"><strong>${item.colaborador || '-'}</strong></td>
          <td class="text-center">${item.gerente || '-'}</td>
          <td class="text-center autorizado-col" style="display: none;">${(
            item.autorizado_50 || 0
          ).toFixed(2)}</td>
          <td class="text-center autorizado-col" style="display: none;">${(
            item.autorizado_100 || 0
          ).toFixed(2)}</td>
          <td class="text-center nao-autorizado-col" style="display: none;">${naoAut50.toFixed(
            2
          )}</td>
          <td class="text-center nao-autorizado-col" style="display: none;">${naoAut100.toFixed(
            2
          )}</td>
          <td class="text-center">${(item.total_autorizado || 0).toFixed(
            2
          )}</td>
          <td class="text-center">${(item.total_nao_autorizado || 0).toFixed(
            2
          )}</td>
          <td class="text-center executado-col" style="display: none;">${(
            item.executado_50 || 0
          ).toFixed(2)}</td>
          <td class="text-center executado-col" style="display: none;">${(
            item.executado_100 || 0
          ).toFixed(2)}</td>
          <td class="text-center">${(item.total_executado || 0).toFixed(2)}</td>
        </tr>
      `;

        // Acumula totais
        totalExecutado50 += item.executado_50 || 0;
        totalExecutado100 += item.executado_100 || 0;
        totalAutorizado50 += item.autorizado_50 || 0;
        totalAutorizado100 += item.autorizado_100 || 0;
        totalNaoAutorizado50 += naoAut50;
        totalNaoAutorizado100 += naoAut100;
      });
    });

  // Adiciona linha de total geral
  html += `
        </tbody>
        <tfoot class="font-weight-bold" style="background-color: #f8f9fa;">
          <tr>
            <td class="text-left">TOTAL GERAL</td>
            <td class="text-center">-</td>
            <td class="text-center autorizado-col" style="display: none;">${totalAutorizado50.toFixed(
              2
            )}</td>
            <td class="text-center autorizado-col" style="display: none;">${totalAutorizado100.toFixed(
              2
            )}</td>
            <td class="text-center nao-autorizado-col" style="display: none;">${totalNaoAutorizado50.toFixed(
              2
            )}</td>
            <td class="text-center nao-autorizado-col" style="display: none;">${totalNaoAutorizado100.toFixed(
              2
            )}</td>
            <td class="text-center">${(
              totalAutorizado50 + totalAutorizado100
            ).toFixed(2)}</td>
            <td class="text-center">${(
              totalNaoAutorizado50 + totalNaoAutorizado100
            ).toFixed(2)}</td>
            <td class="text-center executado-col" style="display: none;">${totalExecutado50.toFixed(
              2
            )}</td>
            <td class="text-center executado-col" style="display: none;">${totalExecutado100.toFixed(
              2
            )}</td>
            <td class="text-center">${(
              totalExecutado50 + totalExecutado100
            ).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  return html;
}

/**
 * Cria a tabela HTML do comparativo por colaborador em valores monetários (R$)
 *
 * @param {Array} dados - Array de objetos com os dados comparativos em valores monetários
 * @returns {string} HTML da tabela
 */
function criarTabelaComparativoColaboradorValor(dados) {
  let totalExecutado50 = 0;
  let totalExecutado100 = 0;
  let totalAutorizado50 = 0;
  let totalAutorizado100 = 0;
  let totalNaoAutorizado50 = 0;
  let totalNaoAutorizado100 = 0;

  // Agrupa os dados por gerente de divisão para cálculo de totais
  const dadosAgrupados = {};
  dados.forEach((item) => {
    const gerente = item.gerente || "Sem Gerente";
    if (!dadosAgrupados[gerente]) {
      dadosAgrupados[gerente] = {
        colaboradores: [],
        total_executado_50: 0,
        total_executado_100: 0,
        total_autorizado_50: 0,
        total_autorizado_100: 0,
        total_nao_autorizado_50: 0,
        total_nao_autorizado_100: 0,
        total_executado: 0,
        total_autorizado: 0,
        total_nao_autorizado: 0,
      };
    }

    dadosAgrupados[gerente].total_executado_50 += item.executado_50 || 0;
    dadosAgrupados[gerente].total_executado_100 += item.executado_100 || 0;
    dadosAgrupados[gerente].total_autorizado_50 += item.autorizado_50 || 0;
    dadosAgrupados[gerente].total_autorizado_100 += item.autorizado_100 || 0;
    dadosAgrupados[gerente].total_nao_autorizado_50 += Math.max(
      0,
      (item.executado_50 || 0) - (item.autorizado_50 || 0)
    );
    dadosAgrupados[gerente].total_nao_autorizado_100 += Math.max(
      0,
      (item.executado_100 || 0) - (item.autorizado_100 || 0)
    );
    dadosAgrupados[gerente].total_executado += item.total_executado || 0;
    dadosAgrupados[gerente].total_autorizado += item.total_autorizado || 0;
    dadosAgrupados[gerente].total_nao_autorizado +=
      item.total_nao_autorizado || 0;
    dadosAgrupados[gerente].colaboradores.push(item);
  });

  let html = `
    <div class="table-responsive-sm table-responsive-md table-responsive-lg">
      <table class="table table-bordered table-hover table-sm w-100">
        <thead class="thead" style="background-color: #8700d4ff; text-color: white; color: white;">
          <tr>
            <th class="text-left">Colaborador</th>
            <th class="text-center">Gerente</th>
            <th class="text-center autorizado-col" style="display: none;">Autorizado 50% (R$)</th>
            <th class="text-center autorizado-col" style="display: none;">Autorizado 100% (R$)</th>
            <th class="text-center nao-autorizado-col" style="display: none;">Não Autorizado 50% (R$)</th>
            <th class="text-center nao-autorizado-col" style="display: none;">Não Autorizado 100% (R$)</th>
            <th class="text-center">Total Autorizado (R$)</th>
            <th class="text-center">Total Não Autorizado (R$)</th>
            <th class="text-center executado-col" style="display: none;">Executado 50% (R$)</th>
            <th class="text-center executado-col" style="display: none;">Executado 100% (R$)</th>
            <th class="text-center">Total Executado (R$)</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Ordena os gerentes e adiciona os dados à tabela
  Object.keys(dadosAgrupados)
    .sort()
    .forEach((gerente) => {
      const dadosGerente = dadosAgrupados[gerente];
      const colaboradores = dadosGerente.colaboradores;

      // Adiciona uma linha para o gerente com os totais consolidados
      html += `
      <tr class="table font-weight-bold" style="background-color: #f3dbfdff;">
        <td class="text-left"><i class="fa-solid fa-user-tie"></i> <strong>${gerente}</strong></td>
        <td class="text-center">TOTAL</td>
        <td class="text-center autorizado-col" style="display: none;"><strong>${formatarMoeda(
          dadosGerente.total_autorizado_50
        )}</strong></td>
        <td class="text-center autorizado-col" style="display: none;"><strong>${formatarMoeda(
          dadosGerente.total_autorizado_100
        )}</strong></td>
        <td class="text-center nao-autorizado-col" style="display: none;"><strong>${formatarMoeda(
          dadosGerente.total_nao_autorizado_50
        )}</strong></td>
        <td class="text-center nao-autorizado-col" style="display: none;"><strong>${formatarMoeda(
          dadosGerente.total_nao_autorizado_100
        )}</strong></td>
        <td class="text-center"><strong>${formatarMoeda(
          dadosGerente.total_autorizado
        )}</strong></td>
        <td class="text-center"><strong>${formatarMoeda(
          dadosGerente.total_nao_autorizado
        )}</strong></td>
        <td class="text-center executado-col" style="display: none;"><strong>${formatarMoeda(
          dadosGerente.total_executado_50
        )}</strong></td>
        <td class="text-center executado-col" style="display: none;"><strong>${formatarMoeda(
          dadosGerente.total_executado_100
        )}</strong></td>
        <td class="text-center"><strong>${formatarMoeda(
          dadosGerente.total_executado
        )}</strong></td>
      </tr>
    `;

      // Adiciona linha para cada colaborador sob o gerente
      colaboradores.forEach((item) => {
        const naoAut50 = Math.max(
          0,
          (item.executado_50 || 0) - (item.autorizado_50 || 0)
        );
        const naoAut100 = Math.max(
          0,
          (item.executado_100 || 0) - (item.autorizado_100 || 0)
        );

        html += `
        <tr>
          <td class="text-left"><strong>${item.colaborador || '-'}</strong></td>
          <td class="text-center">${item.gerente || '-'}</td>
          <td class="text-center autorizado-col" style="display: none;">${formatarMoeda(
            item.autorizado_50 || 0
          )}</td>
          <td class="text-center autorizado-col" style="display: none;">${formatarMoeda(
            item.autorizado_100 || 0
          )}</td>
          <td class="text-center nao-autorizado-col" style="display: none;">${formatarMoeda(
            naoAut50
          )}</td>
          <td class="text-center nao-autorizado-col" style="display: none;">${formatarMoeda(
            naoAut100
          )}</td>
          <td class="text-center">${formatarMoeda(
            item.total_autorizado || 0
          )}</td>
          <td class="text-center">${formatarMoeda(
            item.total_nao_autorizado || 0
          )}</td>
          <td class="text-center executado-col" style="display: none;">${formatarMoeda(
            item.executado_50 || 0
          )}</td>
          <td class="text-center executado-col" style="display: none;">${formatarMoeda(
            item.executado_100 || 0
          )}</td>
          <td class="text-center">${formatarMoeda(
            item.total_executado || 0
          )}</td>
        </tr>
      `;

        // Acumula totais
        totalExecutado50 += item.executado_50 || 0;
        totalExecutado100 += item.executado_100 || 0;
        totalAutorizado50 += item.autorizado_50 || 0;
        totalAutorizado100 += item.autorizado_100 || 0;
        totalNaoAutorizado50 += naoAut50;
        totalNaoAutorizado100 += naoAut100;
      });
    });

  // Adiciona linha de total geral
  html += `
        </tbody>
        <tfoot class="font-weight-bold" style="background-color: #f8f9fa;">
          <tr>
            <td class="text-left">TOTAL GERAL</td>
            <td class="text-center">-</td>
            <td class="text-center autorizado-col" style="display: none;">${formatarMoeda(
              totalAutorizado50
            )}</td>
            <td class="text-center autorizado-col" style="display: none;">${formatarMoeda(
              totalAutorizado100
            )}</td>
            <td class="text-center nao-autorizado-col" style="display: none;">${formatarMoeda(
              totalNaoAutorizado50
            )}</td>
            <td class="text-center nao-autorizado-col" style="display: none;">${formatarMoeda(
              totalNaoAutorizado100
            )}</td>
            <td class="text-center">${formatarMoeda(
              totalAutorizado50 + totalAutorizado100
            )}</td>
            <td class="text-center">${formatarMoeda(
              totalNaoAutorizado50 + totalNaoAutorizado100
            )}</td>
            <td class="text-center executado-col" style="display: none;">${formatarMoeda(
              totalExecutado50
            )}</td>
            <td class="text-center executado-col" style="display: none;">${formatarMoeda(
              totalExecutado100
            )}</td>
            <td class="text-center">${formatarMoeda(
              totalExecutado50 + totalExecutado100
            )}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  return html;
}

// ================================================================================
// 🔘 Funções para alternar visibilidade das colunas de execução para a nova tabela
// ================================================================================

let colunasExecucaoColaboradorExpandidas = false;

/**
 * Alterna a visibilidade das colunas de execução (50% e 100%) na tabela de colaboradores
 */
function alternarColunasExecucaoColaborador() {
  const iconesExecucao = document.querySelectorAll(
    "#iconeExecucaoColaborador, .execucao-resumo i"
  );
  const textoBtn = document.getElementById("textoBtnExecucaoColaborador");
  const colunasExecutado = document.querySelectorAll(".executado-col");
  const colunasAutorizado = document.querySelectorAll(".autorizado-col");
  const colunasNaoAutorizado = document.querySelectorAll(".nao-autorizado-col");

  colunasExecucaoColaboradorExpandidas = !colunasExecucaoColaboradorExpandidas;

  // Atualiza o ícone e o texto do botão
  iconesExecucao.forEach((icone) => {
    icone.className = colunasExecucaoColaboradorExpandidas
      ? "fas fa-chevron-up"
      : "fas fa-chevron-down";
  });

  textoBtn.textContent = colunasExecucaoColaboradorExpandidas
    ? "Recolher Detalhes"
    : "Expandir Detalhes";

  // Alterna a visibilidade das colunas
  colunasExecutado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoColaboradorExpandidas ? "table-cell" : "none";
  });

  colunasAutorizado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoColaboradorExpandidas ? "table-cell" : "none";
  });

  colunasNaoAutorizado.forEach((coluna) => {
    coluna.style.display = colunasExecucaoColaboradorExpandidas ? "table-cell" : "none";
  });
}

/**
 * Alterna a visualização entre as tabelas de horas e valores para a nova tabela
 * @param {string} tipo - 'horas' ou 'valores'
 */
function alterarVisualizacaoColaborador(tipo) {
  const tabelaHoras = document.getElementById("tabelaComparativoColaborador");
  const tabelaValores = document.getElementById(
    "tabelaComparativoColaboradorValor"
  );
  const btnHoras = document.getElementById("btnVisualizacaoHorasColaborador");
  const btnValores = document.getElementById("btnVisualizacaoValoresColaborador");

  if (tipo === "horas") {
    tabelaHoras.style.display = "block";
    tabelaValores.style.display = "none";

    // Atualiza os botões para refletir o estado ativo
    btnHoras.classList.add("active");
    btnHoras.classList.remove("btn-outline-success");
    btnHoras.classList.add("btn-outline-primary");
    btnValores.classList.remove("active");
    btnValores.classList.remove("btn-outline-primary");
    btnValores.classList.add("btn-outline-success");
  } else if (tipo === "valores") {
    tabelaHoras.style.display = "none";
    tabelaValores.style.display = "block";

    // Atualiza os botões para refletir o estado ativo
    btnValores.classList.add("active");
    btnValores.classList.remove("btn-outline-primary");
    btnValores.classList.add("btn-outline-success");
    btnHoras.classList.remove("active");
    btnHoras.classList.remove("btn-outline-success");
    btnHoras.classList.add("btn-outline-primary");
  }
}

// ================================================================================
// 📊 Evento de Carregamento da Página
// ================================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Adiciona ouvinte de evento para quando a página for carregada
  document.addEventListener("page-load:painelGastoPrev", function () {
    // Nome do evento personalizado
    inicializarPainelGastoPrev();
  });
});
