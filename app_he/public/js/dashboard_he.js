// ================================================================================
// 📊 DASHBOARD DE HORAS EXTRAS (HE)
// ================================================================================
// Este arquivo controla o dashboard principal do sistema de HE, exibindo:
// - KPIs (Total de horas, aprovadas, pendentes, recusadas)
// - Tabela resumida por gerente
// - Filtros por mês e ano
// - Função de exportação para CSV
// ================================================================================

// Executa quando o DOM estiver completamente carregado
document.addEventListener("DOMContentLoaded", () => {
  // ================================================================================
  // 🔧 Referências aos Elementos do DOM
  // ================================================================================

  const filtroMes = document.getElementById("dashboardFiltroMes");
  const filtroAno = document.getElementById("dashboardFiltroAno");  // Novo filtro de ano
  const filtroGerente = document.getElementById("dashboardFiltroGerente");
  const tabelaBody = document.getElementById("tabelaGerentesBody");

  // ================================================================================
  // 🎬 Inicialização do Dashboard
  // ================================================================================

  inicializarFiltros();

  // Event listener para recarregar quando a página é aberta via navegação SPA
  document.addEventListener('page-load:dashboard', function() {
    carregarDashboard(filtroMes.value, filtroGerente.value, filtroAno.value);
  });

  // ================================================================================
  // 🔄 Inicialização dos Filtros e Event Listeners
  // ================================================================================

  /**
   * Inicializa os filtros do dashboard
   *
   * - Preenche o dropdown de meses
   * - Carrega a lista de gerentes da API
   * - Define o mês atual como padrão
   * - Carrega os dados iniciais
   * - Configura os event listeners dos filtros
   */
  async function inicializarFiltros() {
      // Carrega os dropdowns de ano e mês dinamicamente
      await carregarAnosMesesDropdowns();

      // Carrega os gerentes disponíveis da API
      await carregarGerentes();

      // Event listener: Recarrega ao mudar o mês
      filtroMes.addEventListener("change", () => carregarDashboard(filtroMes.value, filtroGerente.value, filtroAno.value));

      // Event listener: Recarrega ao mudar o ano
      filtroAno.addEventListener("change", () => carregarDashboard(filtroMes.value, filtroGerente.value, filtroAno.value));

      // Event listener: Recarrega ao mudar o gerente
      filtroGerente.addEventListener("change", () => carregarDashboard(filtroMes.value, filtroGerente.value, filtroAno.value));

      // Event listener: Botão de exportar dados
      document.getElementById("btnExportarDashboard").addEventListener("click", () => {
          exportarDadosDashboard();
      });

      // Event listener: Botão de limpar filtros
      document.getElementById("btnLimparFiltrosDashboard").addEventListener("click", () => {
        const mesAtual = getMesAtual();
        const anoAtual = getAnoAtual();
        filtroAno.value = anoAtual;
        filtroMes.value = mesAtual;
        filtroGerente.value = "";

        // Atualizar meses com base no ano selecionado
        atualizarMesesDropdown();

        carregarDashboard(mesAtual, "", anoAtual);
      });
  }

  // ================================================================================
  // 🗓️ Funções Auxiliares de Datas
  // ================================================================================

  /**
   * Retorna o nome do mês atual em português
   * @returns {string} Nome do mês atual
   */
  function getMesAtual() {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return meses[new Date().getMonth()];
  }

  /**
   * Retorna o ano atual
   * @returns {number} Ano atual
   */
  function getAnoAtual() {
    return new Date().getFullYear();
  }

  // ================================================================================
  // 📥 Carregamento de Dados da API
  // ================================================================================

  /**
   * Carrega a lista de gerentes disponíveis da API
   *
   * Popula o select de gerentes com os dados retornados, incluindo
   * a opção "Todas as Gerências" como padrão.
   */
  async function carregarGerentes() {
    const resp = await fetch("/planejamento-he/api/gerentes");
    const data = await resp.json();

    // Adiciona a opção padrão "Todas as Gerências"
    filtroGerente.innerHTML = `<option value="">Todas as Gerências</option>`;

    // Adiciona cada gerente como uma option
    (data.gerentes || []).forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      filtroGerente.appendChild(opt);
    });
  }

  /**
   * Carrega dinamicamente os dropdowns de ano e mês baseados nos dados do backend
   */
  async function carregarAnosMesesDropdowns() {
    try {
      const response = await fetch('/planejamento-he/api/meses-anos-unicos');
      const dados = await response.json();

      if (dados.erro) {
        console.error('Erro ao carregar anos e meses:', dados.erro);
        return;
      }

      // Preenche o dropdown de anos
      const anoSelect = document.getElementById("dashboardFiltroAno");
      anoSelect.innerHTML = '<option value="">Todos os anos</option>';
      dados.anos.forEach(ano => {
        const option = document.createElement("option");
        option.value = ano;
        option.textContent = ano;
        anoSelect.appendChild(option);
      });

      // Preenche o dropdown de meses com base no ano selecionado
      function atualizarMesesDropdown() {
        const anoSelecionado = anoSelect.value;
        const mesSelect = document.getElementById("dashboardFiltroMes");
        mesSelect.innerHTML = '<option value="">Todos os meses</option>';

        let mesesParaExibir = [];

        if (anoSelecionado) {
          // Se um ano está selecionado, mostra apenas os meses desse ano
          if (dados.mesesPorAno && dados.mesesPorAno[anoSelecionado]) {
            mesesParaExibir = dados.mesesPorAno[anoSelecionado];
          }
        } else {
          // Se nenhum ano está selecionado, mostra todos os meses de todos os anos
          const todosOsMeses = new Set();
          for (const ano in dados.mesesPorAno) {
            dados.mesesPorAno[ano].forEach(mes => todosOsMeses.add(mes));
          }
          mesesParaExibir = Array.from(todosOsMeses).sort((a, b) => {
            const ordemMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            return ordemMeses.indexOf(a) - ordemMeses.indexOf(b);
          });
        }

        mesesParaExibir.forEach(mes => {
          const option = document.createElement("option");
          option.value = mes;
          option.textContent = mes;
          mesSelect.appendChild(option);
        });
      }

      // Adiciona listener para atualizar os meses quando o ano mudar
      anoSelect.addEventListener('change', atualizarMesesDropdown);

      // Atualiza os meses inicialmente
      atualizarMesesDropdown();

      // Define o ano atual como padrão se estiver disponível
      const anoAtual = getAnoAtual();
      if (dados.anos.includes(anoAtual.toString())) {
        anoSelect.value = anoAtual;
      } else if (dados.anos.length > 0) {
        anoSelect.value = dados.anos[0]; // Usa o primeiro ano disponível
      }

      // Atualiza os meses novamente após definir o ano padrão
      setTimeout(atualizarMesesDropdown, 100);

      // Define o mês atual como padrão após atualizar os meses
      setTimeout(() => {
        const mesAtual = getMesAtual();
        const anoAtual = getAnoAtual();
        const mesSelect = document.getElementById("dashboardFiltroMes");

        // Verifica se o mês/ano atual existe nos dados disponíveis
        const mesAnoAtualDisponivel = dados.anos.includes(anoAtual.toString()) &&
                                     dados.mesesPorAno[anoAtual] &&
                                     dados.mesesPorAno[anoAtual].includes(mesAtual);

        if (mesAnoAtualDisponivel) {
          // Se o mês/ano atual está disponível, define como padrão
          mesSelect.value = mesAtual;
        } else {
          // Se não, define o mês mais recente disponível como padrão
          let mesMaisRecente = "";
          let anoMaisRecente = "";

          // Percorre os anos em ordem decrescente (do mais recente para o mais antigo)
          for (const ano of dados.anos.sort((a, b) => b - a)) {
            if (dados.mesesPorAno[ano] && dados.mesesPorAno[ano].length > 0) {
              // Encontra o mês mais recente dentro do ano
              const mesesDisponiveis = dados.mesesPorAno[ano].sort((a, b) => {
                const ordemMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                return ordemMeses.indexOf(b) - ordemMeses.indexOf(a); // Ordem reversa (mais recente primeiro)
              });

              if (mesesDisponiveis.length > 0) {
                mesMaisRecente = mesesDisponiveis[0];
                anoMaisRecente = ano;
                break; // Sai do loop ao encontrar o ano e mês mais recentes
              }
            }
          }

          // Define o mês e ano mais recentes disponíveis como padrão
          if (mesMaisRecente && anoMaisRecente) {
            mesSelect.value = mesMaisRecente;
            document.getElementById("dashboardFiltroAno").value = anoMaisRecente;
          }
        }

        // Carrega o dashboard com os filtros padrão
        const anoFiltro = document.getElementById("dashboardFiltroAno").value || anoAtual;
        carregarDashboard(mesSelect.value, filtroGerente.value, anoFiltro);
      }, 200);

    } catch (error) {
      console.error('Erro ao carregar anos e meses para os dropdowns:', error);
    }
  }

  /**
   * Carrega os dados do dashboard da API e atualiza a interface
   *
   * Busca o resumo de horas por gerente, filtrando por mês e gerente se fornecido.
   * Atualiza tanto a tabela quanto os KPIs na interface.
   *
   * @param {string} mes - Mês para filtrar (ex: "Janeiro")
   * @param {string} gerente - Nome do gerente para filtrar (opcional, vazio = todos)
   * @param {string} ano - Ano para filtrar (opcional, vazio = todos)
   */
  function carregarDashboard(mes, gerente, ano) {
    // Exibe mensagem de carregamento
    tabelaBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Carregando...</td></tr>`;

    // Constrói a URL com os parâmetros necessários
    let url = `/planejamento-he/api/dashboard-summary?mes=${encodeURIComponent(mes)}`;
    if(gerente) url += `&gerente=${encodeURIComponent(gerente)}`;
    if(ano) url += `&ano=${encodeURIComponent(ano)}`;

    // Faz a requisição para a API com os filtros aplicados
    fetch(url)
      .then(r => r.json())
      .then(data => {
        // Valida se há dados retornados
        if (!Array.isArray(data) || data.length === 0) {
          tabelaBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum dado encontrado para este filtro.</td></tr>`;
          atualizarKPIs(0, 0, 0, 0);
          return;
        }

        // Variáveis para acumular os totais
        let totalHoras = 0, horasAprov = 0, horasPend = 0, horasRec = 0;
        let html = "";

        // Itera sobre cada gerente retornado
        data.forEach(d => {
          // Converte os valores para número (evita problemas com null/undefined)
          const aprov = Number(d.horasAprovadas) || 0;
          const pend = Number(d.horasPendentes) || 0;
          const rec = Number(d.horasRecusadas) || 0;
          const total = aprov + pend + rec;

          // Acumula os totais para os KPIs
          totalHoras += total;
          horasAprov += aprov;
          horasPend += pend;
          horasRec += rec;

          // Constrói a linha da tabela para este gerente
          html += `
            <tr>
              <td>${d.GERENTE || "Sem nome"}</td>
              <td class="text-success font-weight-bold">${aprov}</td>
              <td class="text-warning font-weight-bold">${pend}</td>
              <td class="text-danger font-weight-bold">${rec}</td>
              <td class="font-weight-bold">${total}</td>
            </tr>
          `;
        });

        // Atualiza a tabela com os dados
        tabelaBody.innerHTML = html;

        // Atualiza os cards de KPI com os totais calculados
        atualizarKPIs(totalHoras, horasAprov, horasPend, horasRec);
      })
      .catch(e => {
        console.error(e);
        tabelaBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Erro ao carregar dados.</td></tr>`;
      });
  }

  // ================================================================================
  // 📈 Atualização de KPIs (Indicadores)
  // ================================================================================

  /**
   * Atualiza os cards de KPI com animação de contador
   *
   * Exibe os totais de horas com efeito visual de contagem progressiva.
   *
   * @param {number} total - Total de horas (aprovadas + pendentes + recusadas)
   * @param {number} aprov - Total de horas aprovadas
   * @param {number} pend - Total de horas pendentes
   * @param {number} rec - Total de horas recusadas
   */
  function atualizarKPIs(total, aprov, pend, rec) {
    // Anima cada KPI com efeito de contador
    animarContador("kpiTotalHoras", total);
    animarContador("kpiAprovadas", aprov);
    animarContador("kpiPendentes", pend);
    animarContador("kpiRecusadas", rec);
  }

  /**
   * Anima um contador de números com efeito de transição suave
   *
   * Cria um efeito visual de contagem progressiva do valor atual até o valor final,
   * tornando a atualização dos KPIs mais atrativa visualmente.
   *
   * @param {string} elementId - ID do elemento HTML a ser animado
   * @param {number} valorFinal - Valor final a ser exibido
   */
  function animarContador(elementId, valorFinal) {
    const elemento = document.getElementById(elementId);

    // Obtém o valor atual exibido (remove formatação antes de converter)
    const valorAtual = parseInt(elemento.textContent.replace(/\./g, '').replace(',', '.')) || 0;

    // Configurações da animação
    const duracao = 1000; // 1 segundo
    const passos = 30;     // Número de frames da animação
    const incremento = (valorFinal - valorAtual) / passos;
    let contador = 0;

    // Cria um intervalo para atualizar o valor gradualmente
    const intervalo = setInterval(() => {
      contador++;
      const valorAtualizado = Math.round(valorAtual + (incremento * contador));

      // Verifica se chegou ao final da animação
      if (contador >= passos) {
        clearInterval(intervalo);
        // Garante que o valor final seja exato (sem arredondamentos acumulados)
        elemento.textContent = Number(valorFinal || 0).toLocaleString("pt-BR");
      } else {
        // Atualiza com o valor intermediário formatado
        elemento.textContent = Number(valorAtualizado || 0).toLocaleString("pt-BR");
      }
    }, duracao / passos);
  }

  // ================================================================================
  // 📤 Exportação de Dados para CSV
  // ================================================================================

  /**
   * Exporta os dados do dashboard para um arquivo CSV
   *
   * Faz download de um arquivo CSV contendo todos os dados filtrados,
   * incluindo detalhes de cada solicitação de HE.
   */
  async function exportarDadosDashboard() {
    const mes = filtroMes.value;
    const ano = filtroAno.value;
    const gerente = filtroGerente.value;

    let url = `/planejamento-he/api/exportar?mes=${encodeURIComponent(mes)}`;
    if(gerente) url += `&gerente=${encodeURIComponent(gerente)}`;
    if(ano) url += `&ano=${encodeURIComponent(ano)}`;

    try {
        // Faz requisição para a API de exportação com os filtros aplicados
        const response = await fetch(url);

        // Valida se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        // Converte a resposta para Blob (arquivo binário)
        const blob = await response.blob();

        // Cria uma URL temporária para o arquivo
        const urlObj = window.URL.createObjectURL(blob);

        // Cria um elemento <a> invisível para forçar o download
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = urlObj;

        // Define o nome do arquivo com mês e data atual
        let fileName = `planejamento_he_${mes.toLowerCase()}`;
        if(ano) fileName += `_${ano}`;
        fileName += `_${new Date().toISOString().slice(0, 10)}.csv`;

        a.download = fileName;

        // Adiciona ao DOM, clica e remove (truque para forçar download)
        document.body.appendChild(a);
        a.click();

        // Limpa a URL temporária e remove o elemento
        window.URL.revokeObjectURL(urlObj);
        document.body.removeChild(a);

    } catch (error) {
        console.error("Erro ao exportar dados:", error);
        alert("Falha ao exportar os dados. Verifique o console para mais detalhes.");
    }
  }
});
