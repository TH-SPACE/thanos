// ================================================================================
// 🎯 CONTROLLER DE PLANEJAMENTO DE HORAS EXTRAS (HE)
// ================================================================================
// Este controller centraliza toda a lógica de negócio do sistema de HE,
// incluindo: envio, aprovação, recusa, edição, exclusão, dashboards e exportação.
//
// Dependências:
// - ExcelJS: Manipulação de arquivos Excel (reservado para futuras funcionalidades)
// - db: Pool de conexões MySQL
// - valoresHE: Cálculo de valores de HE por cargo e tipo
// - limite_he.json: Limites financeiros por gerente/diretoria
// ================================================================================

const ExcelJS = require("exceljs");
const path = require("path");
const db = require("../../db/db");
const { getValorHora } = require("../utils/valoresHE");
const limitesData = require("../json/limite_he.json");
const gastoPrevController = require("./gastoPrevController");

// ================================================================================
// 🔗 FUNÇÕES AUXILIARES PARA LIMITES COMPARTILHADOS
// ================================================================================

/**
 * Obtém as informações de limite para um gerente (direto ou compartilhado)
 *
 * @param {string} gerente - Nome do gerente
 * @returns {Object|null} Objeto com informações de limite ou null se não encontrado
 */
function getInfoLimitePorGerente(gerente) {
  // Primeiro tenta encontrar diretamente no Responsavel
  let limiteInfo = limitesData.find((l) => l.Responsavel === gerente);

  if (limiteInfo) {
    return limiteInfo;
  }

  // Se não encontrar diretamente, procura nos GerentesCompartilhados
  for (const item of limitesData) {
    if (item.GerentesCompartilhados && item.GerentesCompartilhados.includes(gerente)) {
      return item;
    }
  }

  return null;
}

// ================================================================================
// 👤 API DE PERFIL DO USUÁRIO
// ================================================================================

/**
 * Retorna o perfil do usuário logado
 *
 * Utilizado pelo frontend para determinar quais funcionalidades exibir
 * (ex: menus de aprovação apenas para aprovadores).
 *
 * @param {Object} req - Request Express (usa req.session.usuario)
 * @param {Object} res - Response Express
 * @returns {Object} JSON com o perfil do usuário
 *
 * @example
 * // Resposta para usuário comum:
 * { "perfil": "HE_USER" }
 *
 * // Resposta para aprovador:
 * { "perfil": "HE_APROVADOR,HE_ENGENHARIA" }
 */
exports.getPerfilUsuario = (req, res) => {
  const perfil = req.session.usuario?.perfil || "USER";
  res.json({ perfil });
};

// ================================================================================
// 📊 RESUMOS E DASHBOARDS FINANCEIROS
// ================================================================================

/**
 * Gera resumo financeiro de aprovação com cálculo de limites
 *
 * Calcula o total de horas e valores por status (APROVADO, PENDENTE, RECUSADO)
 * e compara com os limites financeiros definidos em limite_he.json.
 * Permite filtrar por gerente e mês específico.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.mes - Mês para filtrar (obrigatório)
 * @param {string} req.query.gerente - Nome do gerente para filtrar (opcional)
 * @param {string} req.diretoriaHE - Diretoria do usuário (injetada pelo middleware)
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON com resumo financeiro:
 * {
 *   limiteTotal: 150000.00,
 *   limiteAtual: 120000.00,
 *   limitePosAprovacao: 100000.00,
 *   resumoPorStatus: {
 *     APROVADO: { horas: 200, valor: 30000.00 },
 *     PENDENTE: { horas: 100, valor: 20000.00 },
 *     RECUSADO: { horas: 50, valor: 10000.00 }
 *   }
 * }
 */
exports.getApprovalSummary = async (req, res) => {
  const { gerente, mes } = req.query;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!mes) {
    return res
      .status(400)
      .json({ erro: "Parâmetro 'mes' é obrigatório para gerar o resumo." });
  }

  try {
    const conexao = db.mysqlPool;

    // Monta query SQL com filtros dinâmicos
    let query = `SELECT STATUS, CARGO, HORAS, TIPO_HE FROM PLANEJAMENTO_HE WHERE MES = ? AND (DIRETORIA = ? OR DIRETORIA IS NULL)`;
    const params = [mes, diretoria];

    // Adiciona filtro de gerente se fornecido
    if (gerente) {
      query += ` AND GERENTE = ?`;
      params.push(gerente);
    }

    // Busca todas as solicitações do mês/diretoria
    const [solicitacoes] = await conexao.query(query, params);

    // Calcula o limite financeiro total baseado em limite_he.json
    let limiteTotal = 0;
    if (gerente) {
      // Para um gerente específico, busca o limite individual ou compartilhado
      const limiteInfo = getInfoLimitePorGerente(gerente);
      limiteTotal = limiteInfo
        ? parseFloat(limiteInfo.Valores.replace(".", "").replace(",", "."))
        : 0;
    } else {
      // Se não especificar gerente, soma todos os limites da diretoria
      limiteTotal = limitesData.reduce((acc, l) => {
        const valor =
          parseFloat(l.Valores.replace(".", "").replace(",", ".")) || 0;
        return acc + valor;
      }, 0);
    }

    // Estrutura para acumular totais por status
    let resumo = {
      APROVADO: { horas: 0, valor: 0 },
      PENDENTE: { horas: 0, valor: 0 },
      RECUSADO: { horas: 0, valor: 0 },
    };

    // Itera sobre cada solicitação e acumula horas e valores
    solicitacoes.forEach((s) => {
      if (resumo[s.STATUS]) {
        const horas = Number(s.HORAS) || 0;
        // Calcula o valor financeiro usando a função getValorHora
        const valor = getValorHora(s.CARGO, s.TIPO_HE) * horas;
        resumo[s.STATUS].horas += horas;
        resumo[s.STATUS].valor += valor;
      }
    });

    // Busca também os dados de execução (horas realmente realizadas) na tabela FREQUENCIA
    let totalExecutadoValor = 0;

    // Verifica se a tabela FREQUENCIA existe e é válida
    const tabelaValida = await gastoPrevController.validarTabelaFrequencia(conexao);

    if (tabelaValida) {
      // Se a tabela é válida, buscamos os dados de execução para o gerente e mês
      const meses = {
        Janeiro: 1,
        Fevereiro: 2,
        Março: 3,
        Abril: 4,
        Maio: 5,
        Junho: 6,
        Julho: 7,
        Agosto: 8,
        Setembro: 9,
        Outubro: 10,
        Novembro: 11,
        Dezembro: 12,
      };
      const mesNumero = meses[mes];

      if (mesNumero !== undefined) {
        // Obter o grupo de gerentes que compartilham o limite
        const limiteInfo = getInfoLimitePorGerente(gerente);
        let gerentesParaConsulta = [gerente];

        if (limiteInfo && limiteInfo.GerentesCompartilhados) {
          gerentesParaConsulta = [limiteInfo.Responsavel, ...limiteInfo.GerentesCompartilhados];
        }

        // Obtemos todas as horas executadas (da tabela FREQUENCIA) agrupadas por colaborador
        const colunasFrequencia = require("../json/config_frequencia.json").tabela_frequencia.colunas_obrigatorias;
        const nomeTabelaFrequencia = require("../json/config_frequencia.json").tabela_frequencia.nome;

        // Criar placeholders para a consulta IN
        const placeholders = gerentesParaConsulta.map(() => '?').join(',');

        // Primeiro, vamos obter os dados de execução por colaborador para calcular valores monetários
        const queryExecutadoComCargo = `
          SELECT
            ${colunasFrequencia[0]} as colaborador,  -- NOME
            ${colunasFrequencia[1]} as cargo,  -- CARGO
            SUM(CASE WHEN ${colunasFrequencia[2]} = 'Hora Extra 50%' THEN ${colunasFrequencia[4]} ELSE 0 END) as executado_50,
            SUM(CASE WHEN ${colunasFrequencia[2]} = 'Horas extras 100%' THEN ${colunasFrequencia[4]} ELSE 0 END) as executado_100
          FROM ${nomeTabelaFrequencia}
          WHERE ${colunasFrequencia[3]} IN (${placeholders}) AND MONTH(${colunasFrequencia[5]}) = ?
          GROUP BY ${colunasFrequencia[0]}, ${colunasFrequencia[1]}
        `;

        const [executadoData] = await conexao.query(queryExecutadoComCargo, [...gerentesParaConsulta, mesNumero]);

        // Carregamos os valores por hora para cálculo monetário
        const { getValorHora } = require("../utils/valoresHE.js");

        // Calcula os valores monetários para cada colaborador
        for (const item of executadoData) {
          const horas_50 = parseFloat(item.executado_50) || 0;
          const horas_100 = parseFloat(item.executado_100) || 0;

          // Calcula valores monetários baseados no cargo do colaborador
          const valorHora50 = getValorHora(item.cargo, "50%");
          const valorHora100 = getValorHora(item.cargo, "100%");

          totalExecutadoValor += (horas_50 * valorHora50) + (horas_100 * valorHora100);
        }
      }
    }

    // Cálculos de limite CORRETOS segundo a nova lógica:
    // - Saldo = Limite - Executado
    const saldoAtual = limiteTotal - totalExecutadoValor;

    const finalSummary = {
      limiteTotal,
      aprovado: resumo.APROVADO.valor,
      pendente: resumo.PENDENTE.valor,
      executado: totalExecutadoValor,
      saldoAtual,
      resumoPorStatus: resumo,
    };

    res.json(finalSummary);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao gerar resumo de aprovação.`,
      error
    );
    res
      .status(500)
      .json({ erro: "Erro interno ao gerar o resumo financeiro." });
  }
};

// ================================================================================
// 📤 ENVIO DE SOLICITAÇÕES DE HE
// ================================================================================

/**
 * Renderiza a página HTML de envio de solicitações de HE
 *
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 */
exports.telaEnvio = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/enviar.html"));
};

/**
 * Envia múltiplas solicitações de HE de uma vez
 *
 * Permite que o usuário crie várias solicitações em um único request.
 * Cada solicitação é inserida no banco com STATUS='PENDENTE' e vinculada
 * ao email do usuário logado (ENVIADO_POR).
 *
 * A diretoria é obtida automaticamente da tabela COLABORADORES_CW baseada
 * na matrícula do colaborador, garantindo consistência dos dados.
 *
 * @param {Object} req - Request Express
 * @param {Array} req.body - Array de objetos com dados das solicitações:
 * [{
 *   gerente: "NOME DO GERENTE",
 *   colaborador: "NOME COLABORADOR",
 *   matricula: "12345",
 *   cargo: "ENGENHEIRO",
 *   mes: "Janeiro",
 *   ano: 2025,
 *   horas: 10,
 *   justificativa: "Projeto urgente",
 *   tipoHE: "50%"
 * }]
 * @param {string} req.diretoriaHE - Diretoria do usuário (fallback se não encontrar na base)
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "..." }
 */
exports.enviarSolicitacoesMultiplo = async (req, res) => {
  const conexao = db.mysqlPool;
  const enviadoPor = req.session.usuario?.email || "desconhecido";
  const diretoria = req.diretoriaHE; // Vem do middleware
  const user = req.session.usuario;
  const ip = req.ip;

  try {
    const solicitacoes = req.body;

    // Validação: Verifica se o body é um array válido
    if (!Array.isArray(solicitacoes) || solicitacoes.length === 0) {
      return res
        .status(400)
        .json({ sucesso: false, mensagem: "Nenhuma solicitação enviada." });
    }

    // Itera sobre cada solicitação e insere no banco
    for (const s of solicitacoes) {
      // Busca a diretoria e gerente_divisão do colaborador na tabela COLABORADORES_CW
      // Isso garante que a solicitação seja vinculada à diretoria e gerente_divisão corretos
      const [colabRows] = await conexao.query(
        `SELECT DIRETORIA, GERENTE_DIVISAO FROM COLABORADORES_CW WHERE MATRICULA = ? LIMIT 1`,
        [s.matricula]
      );

      // Usa a diretoria e gerente_divisão do colaborador se encontrados, senão usa os do usuário logado
      const diretoriaColab = colabRows.length > 0 ? colabRows[0].DIRETORIA : diretoria;
      const gerenteDivisao = colabRows.length > 0 ? colabRows[0].GERENTE_DIVISAO : null;

      // Determina o ano a ser utilizado:
      // 1. Se ano_anterior for true, usa o ano anterior ao ano atual
      // 2. Se ano for fornecido explicitamente (e ano_anterior não for true), usa esse valor
      // 3. Senão, usa o ano atual
      let ano;
      if (s.ano_anterior === true) {
        ano = new Date().getFullYear() - 1;  // Ano anterior ao ano atual
      } else if (s.ano !== undefined) {
        ano = s.ano;  // Ano explícito fornecido
      } else {
        ano = new Date().getFullYear();  // Ano atual (padrão)
      }

      // Insere a solicitação com STATUS='PENDENTE'
      await conexao.query(
        `INSERT INTO PLANEJAMENTO_HE
          (GERENTE, COLABORADOR, MATRICULA, CARGO, MES, ANO, HORAS, JUSTIFICATIVA, TIPO_HE, STATUS, ENVIADO_POR, DIRETORIA, GERENTE_DIVISAO)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.gerente,
          s.colaborador,
          s.matricula,
          s.cargo,
          s.mes,
          ano,
          s.horas,
          s.justificativa,
          s.tipoHE,
          'PENDENTE',
          enviadoPor,
          diretoriaColab,
          gerenteDivisao,
        ]
      );
    }

    res.json({ sucesso: true, mensagem: "Solicitações enviadas com sucesso!" });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || "desconhecido"
      }, IP: ${ip}, Ação: Erro ao enviar múltiplas solicitações de HE.`,
      error
    );
    res
      .status(500)
      .json({
        sucesso: false,
        mensagem: "Erro interno ao enviar solicitações.",
      });
  }
};

/**
 * Obtém resumo financeiro de HE por gerente e mês
 *
 * Calcula o valor total aprovado e pendente para um gerente específico
 * em um determinado mês, considerando apenas solicitações APROVADAS e PENDENTES.
 * Para gerentes com limites compartilhados, considera solicitações de todos os
 * gerentes no mesmo grupo de limite.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.gerente - Nome do gerente (obrigatório)
 * @param {string} req.query.mes - Mês para filtrar (obrigatório)
 * @param {string} req.diretoriaHE - Diretoria do usuário
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON:
 * {
 *   aprovado: 25000.50,
 *   pendente: 15000.00
 * }
 */

exports.obterResumoHE = async (req, res) => {
  const { gerente, mes } = req.query;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!gerente || !mes) {
    return res
      .status(400)
      .json({ erro: "Parâmetros 'gerente' e 'mes' são obrigatórios." });
  }

  try {
    const conexao = db.mysqlPool;

    // Obter o grupo de gerentes que compartilham o limite
    const limiteInfo = getInfoLimitePorGerente(gerente);
    let gerentesParaConsulta = [gerente];

    if (limiteInfo && limiteInfo.GerentesCompartilhados) {
      gerentesParaConsulta = [limiteInfo.Responsavel, ...limiteInfo.GerentesCompartilhados];
    }

    // Criar placeholders para a consulta IN
    const placeholders = gerentesParaConsulta.map(() => '?').join(',');
    const [rows] = await conexao.query(
      `SELECT CARGO, HORAS, TIPO_HE, STATUS
       FROM PLANEJAMENTO_HE
       WHERE GERENTE IN (${placeholders}) AND MES = ? AND STATUS IN ('APROVADO', 'PENDENTE') AND (DIRETORIA = ? OR DIRETORIA IS NULL)`,
      [...gerentesParaConsulta, mes, diretoria]
    );

    let totalAprovado = 0;
    let totalPendente = 0;

    rows.forEach((he) => {
      const valorHora = getValorHora(he.CARGO, he.TIPO_HE);
      const valorTotal = he.HORAS * valorHora;
      if (he.STATUS === "APROVADO") totalAprovado += valorTotal;
      else if (he.STATUS === "PENDENTE") totalPendente += valorTotal;
    });

    res.json({
      aprovado: parseFloat(totalAprovado.toFixed(2)),
      pendente: parseFloat(totalPendente.toFixed(2)),
    });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || "desconhecido"
      }, IP: ${ip}, Ação: Erro ao obter resumo de HE para gerente: ${gerente}, mês: ${mes}.`,
      error
    );
    res.status(500).json({ erro: "Erro ao buscar dados." });
  }
};

/**
 * Obtém resumo de horas executadas por gerente e mês
 *
 * Calcula o total de horas executadas (realizadas) para um gerente específico
 * em um determinado mês, com base na tabela FREQUENCIA.
 * Para gerentes com limites compartilhados, considera registros de todos os
 * gerentes no mesmo grupo de limite.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.gerente - Nome do gerente (obrigatório)
 * @param {string} req.query.mes - Mês para filtrar (obrigatório)
 * @param {string} req.diretoriaHE - Diretoria do usuário
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON:
 * {
 *   executado_50: 120.5,
 *   executado_100: 80.0,
 *   total_executado: 200.5,
 *   executado_valor_50: 6025.00,
 *   executado_valor_100: 4938.00,
 *   total_executado_valor: 10963.00
 * }
 */
exports.obterResumoExecutado = async (req, res) => {
  const { gerente, mes } = req.query;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!gerente || !mes) {
    return res
      .status(400)
      .json({ erro: "Parâmetros 'gerente' e 'mes' são obrigatórios." });
  }

  try {
    const conexao = db.mysqlPool;

    // Verifica se a tabela FREQUENCIA existe e é válida
    const tabelaValida = await gastoPrevController.validarTabelaFrequencia(conexao);

    if (!tabelaValida) {
      return res.status(400).json({
        erro: "Tabela FREQUENCIA não encontrada ou com estrutura incorreta. Verifique se as colunas NOME, CARGO, EVENTO, GERENTE_IMEDIATO, QTD_HORAS e DATA existem."
      });
    }

    // Converter nome do mês para número correspondente
    const meses = {
      Janeiro: 1,
      Fevereiro: 2,
      Março: 3,
      Abril: 4,
      Maio: 5,
      Junho: 6,
      Julho: 7,
      Agosto: 8,
      Setembro: 9,
      Outubro: 10,
      Novembro: 11,
      Dezembro: 12,
    };
    const mesNumero = meses[mes];
    if (mesNumero === undefined) {
    return res.status(400).json({
        erro: `Mês inválido: ${mes}. Use um nome de mês válido em português.`,
      });
    }

    // Obter o grupo de gerentes que compartilham o limite
    const limiteInfo = getInfoLimitePorGerente(gerente);
    let gerentesParaConsulta = [gerente];

    if (limiteInfo && limiteInfo.GerentesCompartilhados) {
      gerentesParaConsulta = [limiteInfo.Responsavel, ...limiteInfo.GerentesCompartilhados];
    }

    // Obtemos todas as horas executadas (da tabela FREQUENCIA) agrupadas por gerente
    const colunasFrequencia = require("../json/config_frequencia.json").tabela_frequencia.colunas_obrigatorias;
    const nomeTabelaFrequencia = require("../json/config_frequencia.json").tabela_frequencia.nome;

    // Criar placeholders para a consulta IN
    const placeholders = gerentesParaConsulta.map(() => '?').join(',');

    // Primeiro, vamos obter os dados de execução por colaborador para calcular valores monetários
    const queryExecutadoComCargo = `
      SELECT
        ${colunasFrequencia[0]} as colaborador,  -- NOME
        ${colunasFrequencia[1]} as cargo,  -- CARGO
        SUM(CASE WHEN ${colunasFrequencia[2]} = 'Hora Extra 50%' THEN ${colunasFrequencia[4]} ELSE 0 END) as executado_50,
        SUM(CASE WHEN ${colunasFrequencia[2]} = 'Horas extras 100%' THEN ${colunasFrequencia[4]} ELSE 0 END) as executado_100
      FROM ${nomeTabelaFrequencia}
      WHERE ${colunasFrequencia[3]} IN (${placeholders}) AND MONTH(${colunasFrequencia[5]}) = ?
      GROUP BY ${colunasFrequencia[0]}, ${colunasFrequencia[1]}
    `;

    const [executadoData] = await conexao.query(queryExecutadoComCargo, [...gerentesParaConsulta, mesNumero]);

    // Carregamos os valores por hora para cálculo monetário
    const { getValorHora } = require("../utils/valoresHE.js");

    let totalExecutado = 0;
    let executado_50 = 0;
    let executado_100 = 0;
    let executado_valor_50 = 0;
    let executado_valor_100 = 0;

    // Calcula os valores monetários para cada colaborador
    for (const item of executadoData) {
      const horas_50 = parseFloat(item.executado_50) || 0;
      const horas_100 = parseFloat(item.executado_100) || 0;

      executado_50 += horas_50;
      executado_100 += horas_100;
      totalExecutado += horas_50 + horas_100;

      // Calcula valores monetários
      const valorHora50 = getValorHora(item.cargo, "50%");
      const valorHora100 = getValorHora(item.cargo, "100%");

      executado_valor_50 += horas_50 * valorHora50;
      executado_valor_100 += horas_100 * valorHora100;
    }

    const totalExecutadoValor = executado_valor_50 + executado_valor_100;

    res.json({
      executado_50: executado_50,
      executado_100: executado_100,
      total_executado: totalExecutado,
      executado_valor_50: parseFloat(executado_valor_50.toFixed(2)),
      executado_valor_100: parseFloat(executado_valor_100.toFixed(2)),
      total_executado_valor: parseFloat(totalExecutadoValor.toFixed(2))
    });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || "desconhecido"
      }, IP: ${ip}, Ação: Erro ao obter resumo de horas executadas para gerente: ${gerente}, mês: ${mes}.`,
      error
    );
    res.status(500).json({ erro: "Erro ao buscar dados de execução." });
  }
};

/**
 * Obtém lista de colaboradores que executaram horas extras por gerente e mês
 *
 * Busca na tabela FREQUENCIA os colaboradores que tiveram horas executadas
 * (realizadas) para um gerente específico em um determinado mês.
 * Para gerentes com limites compartilhados, considera registros de todos os
 * gerentes no mesmo grupo de limite.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.gerente - Nome do gerente (obrigatório)
 * @param {string} req.query.mes - Mês para filtrar (obrigatório)
 * @param {string} req.diretoriaHE - Diretoria do usuário
 * @param {Object} res - Response Express
 *
 * @returns {Array} JSON array com detalhes dos colaboradores que executaram HE:
 * [{
 *   colaborador: "NOME COLABORADOR",
 *   cargo: "CARGO",
 *   executado_50: 20.5,
 *   executado_100: 15.0,
 *   total_executado: 35.5
 * }]
 */
exports.obterDetalhesExecutado = async (req, res) => {
  const { gerente, mes } = req.query;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!gerente || !mes) {
    return res
      .status(400)
      .json({ erro: "Parâmetros 'gerente' e 'mes' são obrigatórios." });
  }

  try {
    const conexao = db.mysqlPool;

    // Verifica se a tabela FREQUENCIA existe e é válida
    const tabelaValida = await gastoPrevController.validarTabelaFrequencia(conexao);

    if (!tabelaValida) {
      return res.status(400).json({
        erro: "Tabela FREQUENCIA não encontrada ou com estrutura incorreta. Verifique se as colunas NOME, CARGO, EVENTO, GERENTE_IMEDIATO, QTD_HORAS e DATA existem."
      });
    }

    // Converter nome do mês para número correspondente
    const meses = {
      Janeiro: 1,
      Fevereiro: 2,
      Março: 3,
      Abril: 4,
      Maio: 5,
      Junho: 6,
      Julho: 7,
      Agosto: 8,
      Setembro: 9,
      Outubro: 10,
      Novembro: 11,
      Dezembro: 12,
    };
    const mesNumero = meses[mes];
    if (mesNumero === undefined) {
      return res.status(400).json({
        erro: `Mês inválido: ${mes}. Use um nome de mês válido em português.`,
      });
    }

    // Obter o grupo de gerentes que compartilham o limite
    const limiteInfo = getInfoLimitePorGerente(gerente);
    let gerentesParaConsulta = [gerente];

    if (limiteInfo && limiteInfo.GerentesCompartilhados) {
      gerentesParaConsulta = [limiteInfo.Responsavel, ...limiteInfo.GerentesCompartilhados];
    }

    // Obtemos as horas executadas (da tabela FREQUENCIA) agrupadas por colaborador
    const colunasFrequencia = require("../json/config_frequencia.json").tabela_frequencia.colunas_obrigatorias;
    const nomeTabelaFrequencia = require("../json/config_frequencia.json").tabela_frequencia.nome;

    // Criar placeholders para a consulta IN
    const placeholders = gerentesParaConsulta.map(() => '?').join(',');

    const queryDetalhes = `
      SELECT
        ${colunasFrequencia[0]} as colaborador,  -- NOME
        ${colunasFrequencia[1]} as cargo,  -- CARGO
        SUM(CASE WHEN ${colunasFrequencia[2]} = 'Hora Extra 50%' THEN ${colunasFrequencia[4]} ELSE 0 END) as executado_50,
        SUM(CASE WHEN ${colunasFrequencia[2]} = 'Horas extras 100%' THEN ${colunasFrequencia[4]} ELSE 0 END) as executado_100
      FROM ${nomeTabelaFrequencia}
      WHERE ${colunasFrequencia[3]} IN (${placeholders}) AND MONTH(${colunasFrequencia[5]}) = ?
      GROUP BY ${colunasFrequencia[0]}, ${colunasFrequencia[1]}
      ORDER BY ${colunasFrequencia[0]}
    `;

    const [detalhesData] = await conexao.query(queryDetalhes, [...gerentesParaConsulta, mesNumero]);

    // Formatar os resultados
    const detalhesFormatados = detalhesData.map(item => ({
      colaborador: item.colaborador,
      cargo: item.cargo,
      executado_50: parseFloat(item.executado_50) || 0,
      executado_100: parseFloat(item.executado_100) || 0,
      total_executado: (parseFloat(item.executado_50) || 0) + (parseFloat(item.executado_100) || 0)
    }));

    res.json(detalhesFormatados);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || "desconhecido"
      }, IP: ${ip}, Ação: Erro ao obter detalhes de horas executadas para gerente: ${gerente}, mês: ${mes}.`,
      error
    );
    res.status(500).json({ erro: "Erro ao buscar detalhes de execução." });
  }
};

// ================================================================================
// 📋 GESTÃO DE SOLICITAÇÕES DO USUÁRIO
// ================================================================================

/**
 * Lista todas as solicitações criadas pelo usuário logado
 *
 * Retorna todas as solicitações (PENDENTE, APROVADO, RECUSADO) enviadas
 * pelo usuário, com filtros opcionais por colaborador, mês e ano.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.colaborador - Nome do colaborador para filtrar (opcional)
 * @param {string} req.query.mes - Mês para filtrar (opcional)
 * @param {string} req.query.ano - Ano para filtrar (opcional)
 * @param {string} req.diretoriaHE - Diretoria do usuário
 * @param {Object} res - Response Express
 *
 * @returns {Array} JSON array com solicitações do usuário
 */
exports.listarEnvios = async (req, res) => {
  const conexao = db.mysqlPool;
  const emailUsuario = req.session.usuario?.email;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;
  const { colaborador, mes, ano } = req.query;

  if (!emailUsuario) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    let query = `
      SELECT
        id, GERENTE, COLABORADOR, MATRICULA, CARGO, MES, ANO, HORAS, JUSTIFICATIVA, TIPO_HE, STATUS, ENVIADO_POR,
        DATE_FORMAT(DATA_ENVIO, '%d/%m/%Y %H:%i') AS DATA_ENVIO_FORMATADA
      FROM PLANEJAMENTO_HE
      WHERE ENVIADO_POR = ? AND (DIRETORIA = ? OR DIRETORIA IS NULL)`;
    const params = [emailUsuario, diretoria];

    if (colaborador) {
      query += ` AND COLABORADOR LIKE ?`;
      params.push(`%${colaborador.trim()}%`);
    }
    if (mes) {
      query += ` AND MES = ?`;
      params.push(mes);
    }
    if (ano) {
      query += ` AND ANO = ?`;
      params.push(ano);
    }

    query += ` ORDER BY DATA_ENVIO DESC`;
    const [rows] = await conexao.query(query, params);
          res.json(rows);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || emailUsuario
      }, IP: ${ip}, Ação: Erro ao listar envios.`,
      error
    );
    res.status(500).json({ erro: "Erro ao carregar suas solicitações." });
  }
};

/**
 * Edita uma solicitação de HE existente
 *
 * Permite que o usuário edite uma solicitação que ele mesmo criou.
 * Ao editar, o STATUS é resetado para 'PENDENTE' automaticamente.
 *
 * Regras:
 * - Apenas o criador da solicitação (ENVIADO_POR) pode editar
 * - Todos os campos (mes, horas, tipoHE, justificativa) são obrigatórios
 * - Status volta a PENDENTE após edição
 *
 * @param {Object} req - Request Express
 * @param {number} req.body.id - ID da solicitação
 * @param {string} req.body.mes - Mês
 * @param {number} req.body.horas - Quantidade de horas
 * @param {string} req.body.tipoHE - Tipo HE ("50%" ou "100%")
 * @param {string} req.body.justificativa - Justificativa
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "..." }
 */
exports.editarEnvio = async (req, res) => {
  const conexao = db.mysqlPool;
  const emailUsuario = req.session.usuario?.email;
  const user = req.session.usuario;
  const ip = req.ip;
  const { id, mes, horas, tipoHE, justificativa } = req.body;

  if (!emailUsuario) {
    return res
      .status(401)
      .json({ sucesso: false, mensagem: "Não autenticado." });
  }
  if (!id || !mes || !horas || !tipoHE || !justificativa) {
    return res
      .status(400)
      .json({ sucesso: false, mensagem: "Dados incompletos." });
  }

  try {
    const [verificacao] = await conexao.query(
      "SELECT STATUS FROM PLANEJAMENTO_HE WHERE id = ? AND ENVIADO_POR = ?",
      [id, emailUsuario]
    );

    if (verificacao.length === 0) {
      return res
        .status(403)
        .json({
          sucesso: false,
          mensagem: "Solicitação não encontrada ou acesso negado.",
        });
    }

    await conexao.query(
      `UPDATE PLANEJAMENTO_HE
       SET MES = ?, HORAS = ?, TIPO_HE = ?, JUSTIFICATIVA = ?, STATUS = 'PENDENTE'
       WHERE id = ? AND ENVIADO_POR = ?`,
      [mes, horas, tipoHE, justificativa, id, emailUsuario]
    );

    res.json({
      sucesso: true,
      mensagem: "Solicitação atualizada com sucesso!",
    });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || emailUsuario
      }, IP: ${ip}, Ação: Erro ao editar a solicitação ID: ${id}.`,
      error
    );
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao atualizar solicitação." });
  }
};

/**
 * Exclui uma solicitação de HE
 *
 * Permite que o usuário exclua uma solicitação que ele mesmo criou.
 *
 * Regras de segurança:
 * - Apenas o criador (ENVIADO_POR) pode excluir
 *
 * @param {Object} req - Request Express
 * @param {number} req.body.id - ID da solicitação a excluir
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "..." }
 */
exports.excluirEnvio = async (req, res) => {
  const conexao = db.mysqlPool;
  const emailUsuario = req.session.usuario?.email;
  const user = req.session.usuario;
  const ip = req.ip;
  const { id } = req.body;

  if (!emailUsuario) {
    return res
      .status(401)
      .json({ sucesso: false, mensagem: "Não autenticado." });
  }
  if (!id || (typeof id !== "number" && isNaN(id))) {
    return res.status(400).json({ sucesso: false, mensagem: "ID inválido." });
  }

  try {
    const [rows] = await conexao.query(
      "SELECT STATUS FROM PLANEJAMENTO_HE WHERE id = ? AND ENVIADO_POR = ?",
      [Number(id), emailUsuario]
    );

    if (rows.length === 0) {
      return res
        .status(403)
        .json({
          sucesso: false,
          mensagem: "Solicitação não encontrada ou acesso negado.",
        });
    }



    await conexao.query(
      "DELETE FROM PLANEJAMENTO_HE WHERE id = ? AND ENVIADO_POR = ?",
      [Number(id), emailUsuario]
    );

    res.json({ sucesso: true, mensagem: "Solicitação excluída com sucesso!" });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || emailUsuario
      }, IP: ${ip}, Ação: Erro ao excluir a solicitação ID: ${id}.`,
      error
    );
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro interno ao excluir." });
  }
};

/**
 * Retorna dados agregados por gerente para o dashboard principal
 *
 * Agrupa solicitações por gerente e calcula contadores de status
 * (aprovadas, pendentes, recusadas) e soma de horas por status.
 * Para gerentes com limites compartilhados, os dados são exibidos
 * separadamente para cada gerente do grupo.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.mes - Mês para filtrar (obrigatório)
 * @param {string} req.query.gerente - Nome do gerente para filtrar (opcional)
 * @param {string} req.query.ano - Ano para filtrar (opcional)
 * @param {string} req.diretoriaHE - Diretoria do usuário
 * @param {Object} res - Response Express
 *
 * @returns {Array} JSON array com dados agregados por gerente:
 * [{
 *   GERENTE: "NOME DO GERENTE",
 *   totalHoras: 150,
 *   pendentes: 5,
 *   aprovadas: 10,
 *   recusadas: 2,
 *   horasPendentes: 40,
 *   horasAprovadas: 100,
 *   horasRecusadas: 10
 * }]
 */
exports.getDashboardData = async (req, res) => {
  const conexao = db.mysqlPool;
  const { mes, gerente, ano } = req.query;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!mes) {
    return res.status(400).json({ erro: "O parâmetro 'mes' é obrigatório." });
  }

  try {
    let query = `
      SELECT
        GERENTE,
        SUM(HORAS) as totalHoras,
        SUM(CASE WHEN STATUS = 'PENDENTE' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN STATUS = 'APROVADO' THEN 1 ELSE 0 END) as aprovadas,
        SUM(CASE WHEN STATUS = 'RECUSADO' THEN 1 ELSE 0 END) as recusadas,
        SUM(CASE WHEN STATUS = 'PENDENTE' THEN HORAS ELSE 0 END) as horasPendentes,
        SUM(CASE WHEN STATUS = 'APROVADO' THEN HORAS ELSE 0 END) as horasAprovadas,
        SUM(CASE WHEN STATUS = 'RECUSADO' THEN HORAS ELSE 0 END) as horasRecusadas
      FROM PLANEJAMENTO_HE
      WHERE MES = ? AND (DIRETORIA = ? OR DIRETORIA IS NULL)`;
    const params = [mes, diretoria];

    if (gerente) {
      query += ` AND GERENTE LIKE ?`;
      params.push(`%${gerente}%`);
    }

    if (ano) {
      query += ` AND ANO = ?`;
      params.push(ano);
    }

    query += ` GROUP BY GERENTE ORDER BY GERENTE`;
    const [rows] = await conexao.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || "desconhecido"
      }, IP: ${ip}, Ação: Erro ao buscar dados do dashboard.`,
      error
    );
    res.status(500).json({ erro: "Erro ao buscar dados para o dashboard." });
  }
};

/**
 * Lista todos os gerentes únicos da diretoria
 *
 * Retorna lista de gerentes distintos que possuem solicitações de HE
 * cadastradas no sistema, filtrada por diretoria do usuário logado.
 *
 * @param {Object} req - Request Express
 * @param {string} req.diretoriaHE - Diretoria do usuário
 * @param {Object} res - Response Express
 *
 * @returns {Array} JSON array: [{ nome: "GERENTE 1" }, { nome: "GERENTE 2" }]
 */
exports.getGerentes = async (req, res) => {
  const conexao = db.mysqlPool;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  try {
    const [rows] = await conexao.query(`
      SELECT DISTINCT GERENTE AS nome
      FROM PLANEJAMENTO_HE
      WHERE GERENTE IS NOT NULL AND GERENTE <> '' AND (DIRETORIA = ? OR DIRETORIA IS NULL)
      ORDER BY GERENTE
    `, [diretoria]);
    res.json(rows);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || "desconhecido"
      }, IP: ${ip}, Ação: Erro ao listar gerentes.`,
      error
    );
    res.status(500).json({ erro: "Erro ao listar gerentes." });
  }
};

// ================================================================================
// 👔 FUNÇÕES PARA APROVADORES DE HE
// ================================================================================

/**
 * Lista solicitações pendentes para tratamento por aprovadores
 *
 * Retorna todas as solicitações da diretoria do aprovador, com filtros
 * opcionais por gerente, status e mês. Adiciona o VALOR_HORA calculado
 * para cada solicitação.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.gerente - Nome do gerente para filtrar (opcional)
 * @param {string} req.query.status - Status para filtrar (opcional): PENDENTE|APROVADO|RECUSADO
 * @param {string} req.query.mes - Mês para filtrar (opcional)
 * @param {string} req.diretoriaHE - Diretoria do aprovador
 * @param {Object} res - Response Express
 *
 * @returns {Array} JSON array com solicitações incluindo VALOR_HORA calculado
 */
exports.listarSolicitacoesPendentes = async (req, res) => {
  const conexao = db.mysqlPool;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;
  const { gerente, status, mes } = req.query;

  try {
    let query = `
      SELECT
        id, GERENTE, COLABORADOR, MATRICULA, CARGO, MES, HORAS, JUSTIFICATIVA, TIPO_HE, STATUS, ENVIADO_POR, GERENTE_DIVISAO,
        DATE_FORMAT(DATA_ENVIO, '%d/%m/%Y %H:%i') AS DATA_ENVIO_FORMATADA
      FROM PLANEJAMENTO_HE
      WHERE (DIRETORIA = ? OR DIRETORIA IS NULL)`;
    const params = [diretoria];

    if (gerente) {
      query += ` AND GERENTE = ?`;
      params.push(gerente);
    }
    if (status) {
      query += ` AND STATUS = ?`;
      params.push(status);
    }
    if (mes) {
      query += ` AND MES = ?`;
      params.push(mes);
    }

    query += ` ORDER BY DATA_ENVIO ASC`;
    const [rows] = await conexao.query(query, params);

    // Adiciona o valor hora calculado para cada solicitação
    const rowsComValor = rows.map(row => ({
      ...row,
      VALOR_HORA: getValorHora(row.CARGO, row.TIPO_HE)
    }));

    res.json(rowsComValor);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${
        user?.nome || "desconhecido"
      }, IP: ${ip}, Ação: Erro ao listar solicitações para tratamento.`,
      error
    );
    res
      .status(500)
      .json({ erro: "Erro ao carregar as solicitações para tratamento." });
  }
};

/**
 * Aprova uma solicitação de HE
 *
 * Altera o STATUS da solicitação para 'APROVADO' e registra
 * quem aprovou (TRATADO_POR) e quando (DATA_TRATAMENTO).
 *
 * @param {Object} req - Request Express
 * @param {number} req.body.id - ID da solicitação a aprovar
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "..." }
 */
exports.aprovarSolicitacao = async (req, res) => {
  const conexao = db.mysqlPool;
  const { id } = req.body;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!id) {
    return res
      .status(400)
      .json({ sucesso: false, mensagem: "ID da solicitação é obrigatório." });
  }

  try {
    await conexao.query(
      `UPDATE PLANEJAMENTO_HE
       SET STATUS = 'APROVADO',
           TRATADO_POR = ?,
           DATA_TRATAMENTO = NOW()
       WHERE id = ?`,
      [user?.email || 'desconhecido', id]
    );
    res.json({ sucesso: true, mensagem: "Solicitação aprovada com sucesso!" });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao aprovar solicitação ID: ${id}.`,
      error
    );
    res
      .status(500)
      .json({
        sucesso: false,
        mensagem: "Erro interno ao aprovar a solicitação.",
      });
  }
};

/**
 * Recusa uma solicitação de HE
 *
 * Altera o STATUS da solicitação para 'RECUSADO' e registra
 * quem recusou (TRATADO_POR) e quando (DATA_TRATAMENTO).
 *
 * @param {Object} req - Request Express
 * @param {number} req.body.id - ID da solicitação a recusar
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "..." }
 */
exports.recusarSolicitacao = async (req, res) => {
  const conexao = db.mysqlPool;
  const { id } = req.body;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!id) {
    return res
      .status(400)
      .json({ sucesso: false, mensagem: "ID da solicitação é obrigatório." });
  }

  try {
    await conexao.query(
      `UPDATE PLANEJAMENTO_HE
       SET STATUS = 'RECUSADO',
           TRATADO_POR = ?,
           DATA_TRATAMENTO = NOW()
       WHERE id = ?`,
      [user?.email || 'desconhecido', id]
    );
    res.json({ sucesso: true, mensagem: "Solicitação recusada com sucesso!" });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao recusar solicitação ID: ${id}.`,
      error
    );
    res
      .status(500)
      .json({
        sucesso: false,
        mensagem: "Erro interno ao recusar a solicitação.",
      });
  }
};

/**
 * Aprova ou recusa múltiplas solicitações de uma vez
 *
 * Permite ao aprovador processar várias solicitações simultaneamente,
 * alterando todas para o mesmo status (APROVADO ou RECUSADO).
 *
 * @param {Object} req - Request Express
 * @param {Array<number>} req.body.ids - Array com IDs das solicitações
 * @param {string} req.body.status - Status desejado: "APROVADO" ou "RECUSADO"
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "X solicitações foram atualizadas..." }
 */
exports.tratarSolicitacoesEmMassa = async (req, res) => {
  const conexao = db.mysqlPool;
  const { ids, status } = req.body;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({
        sucesso: false,
        mensagem: "Nenhum ID de solicitação fornecido.",
      });
  }
  if (!["APROVADO", "RECUSADO"].includes(status)) {
    return res
      .status(400)
      .json({ sucesso: false, mensagem: "Status inválido." });
  }

  try {
    const placeholders = ids.map(() => "?").join(",");
    const query = `UPDATE PLANEJAMENTO_HE
                   SET STATUS = ?,
                       TRATADO_POR = ?,
                       DATA_TRATAMENTO = NOW()
                   WHERE id IN (${placeholders})`;
    const params = [status, user?.email || 'desconhecido', ...ids];
    const [result] = await conexao.query(query, params);

    res.json({
      sucesso: true,
      mensagem: `${result.affectedRows} solicitações foram atualizadas para ${status}.`,
    });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao tratar solicitações em massa.`,
      error
    );
    res
      .status(500)
      .json({
        sucesso: false,
        mensagem: "Erro interno ao processar a solicitação em massa.",
      });
  }
};

/**
 * Exporta dados de solicitações de HE em formato CSV
 *
 * Gera um arquivo CSV com todas as solicitações filtradas por mês e/ou gerente.
 * O arquivo inclui BOM UTF-8 para compatibilidade com Excel.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.mes - Mês para filtrar (opcional)
 * @param {string} req.query.gerente - Gerente para filtrar (opcional)
 * @param {string} req.diretoriaHE - Diretoria do usuário
 * @param {Object} res - Response Express
 *
 * @returns {File} Arquivo CSV para download
 */
exports.exportarDados = async (req, res) => {
    const { mes, gerente } = req.query;
    const diretoria = req.diretoriaHE;
    const user = req.session.usuario;
    const ip = req.ip;

    try {
        const conexao = db.mysqlPool;
        let query = `SELECT * FROM PLANEJAMENTO_HE WHERE (DIRETORIA = ? OR DIRETORIA IS NULL)`;
        const params = [diretoria];

        if (mes) {
            query += ` AND MES = ?`;
            params.push(mes);
        }
        if (gerente) {
            query += ` AND GERENTE = ?`;
            params.push(gerente);
        }

        const [rows] = await conexao.query(query, params);

        if (rows.length === 0) {
            return res.status(404).send("Nenhum dado encontrado para exportar com os filtros selecionados.");
        }

        // Constrói o CSV
        const header = Object.keys(rows[0]).join(",") + "\r\n";
        const csvData = rows.map(row => {
            return Object.values(row).map(value => {
                // Trata valores que podem conter vírgulas ou aspas
                let strValue = String(value === null || value === undefined ? '' : value);
                if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
                    strValue = `"${strValue.replace(/"/g, '""')}"`;
                }
                return strValue;
            }).join(",");
        }).join("\r\n");

        const csv = "\uFEFF" + header + csvData;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=PLANEJAMENTO_HE.csv");
        res.status(200).send(csv);

    } catch (error) {
        console.error(`[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao exportar dados.`, error);
        res.status(500).send("Erro interno ao exportar os dados.");
    }
};

// ================================================================================
// 👥 CRUD DE COLABORADORES
// ================================================================================
// Funções para gerenciar a base de colaboradores (COLABORADORES_CW)
// Apenas aprovadores têm acesso a estas funcionalidades

/**
 * Lista todos os colaboradores da diretoria
 *
 * Retorna a lista completa de colaboradores cadastrados na diretoria
 * do usuário logado, ordenados por nome.
 *
 * @param {Object} req - Request Express
 * @param {string} req.diretoriaHE - Diretoria do aprovador
 * @param {Object} res - Response Express
 *
 * @returns {Array} JSON array com dados dos colaboradores
 */
exports.listarColaboradores = async (req, res) => {
  const conexao = db.mysqlPool;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  try {
    const [rows] = await conexao.query(
      `SELECT ID, MATRICULA, NOME, CARGO, REGIONAL, ESTADO, CIDADE, GERENTE, GESTOR_DIRETO, EMAIL_GESTOR, DIRETORIA, GERENTE_DIVISAO
       FROM COLABORADORES_CW
       WHERE (DIRETORIA = ? OR DIRETORIA IS NULL)
       ORDER BY NOME`,
      [diretoria]
    );
    res.json(rows);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao listar colaboradores.`,
      error
    );
    res.status(500).json({ erro: "Erro ao listar colaboradores." });
  }
};

/**
 * Obtém dados de um colaborador específico por ID
 *
 * @param {Object} req - Request Express
 * @param {number} req.params.id - ID do colaborador
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON com dados do colaborador ou erro 404
 */
exports.obterColaborador = async (req, res) => {
  const conexao = db.mysqlPool;
  const user = req.session.usuario;
  const ip = req.ip;
  const { id } = req.params;

  try {
    const [rows] = await conexao.query(
      `SELECT ID, MATRICULA, NOME, CARGO, REGIONAL, ESTADO, CIDADE, GERENTE, GESTOR_DIRETO, EMAIL_GESTOR, GERENTE_DIVISAO
       FROM COLABORADORES_CW
       WHERE ID = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Colaborador não encontrado." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao buscar colaborador ID: ${id}.`,
      error
    );
    res.status(500).json({ erro: "Erro ao buscar colaborador." });
  }
};

/**
 * Cria um novo colaborador na base de dados
 *
 * Valida se a matrícula já não existe antes de inserir.
 * Todos os campos são obrigatórios.
 *
 * @param {Object} req - Request Express
 * @param {string} req.body.matricula - Matrícula do colaborador (único)
 * @param {string} req.body.nome - Nome completo
 * @param {string} req.body.cargo - Cargo (ex: "ENGENHEIRO", "TECNICO")
 * @param {string} req.body.regional - Regional
 * @param {string} req.body.estado - Estado (UF)
 * @param {string} req.body.cidade - Cidade
 * @param {string} req.body.gerente - Nome do gerente
 * @param {string} req.body.gestorDireto - Nome do gestor direto
 * @param {string} req.body.emailGestor - Email do gestor
 * @param {string} req.body.gerenteDivisao - Nome do gerente de divisão (opcional)
 * @param {string} req.diretoriaHE - Diretoria (injetada automaticamente)
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "..." }
 */
exports.criarColaborador = async (req, res) => {
  const conexao = db.mysqlPool;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;
  const {
    matricula,
    nome,
    cargo,
    regional,
    estado,
    cidade,
    gerente,
    gestorDireto,
    emailGestor,
    gerenteDivisao,
  } = req.body;

  // Validação dos campos obrigatórios
  if (!matricula || !nome || !cargo || !regional || !estado || !cidade || !gerente || !gestorDireto || !emailGestor) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Todos os campos são obrigatórios.",
    });
  }

  try {
    // Verifica se a matrícula já existe
    const [existe] = await conexao.query(
      `SELECT ID FROM COLABORADORES_CW WHERE MATRICULA = ?`,
      [matricula]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Já existe um colaborador com esta matrícula.",
      });
    }

    await conexao.query(
      `INSERT INTO COLABORADORES_CW (MATRICULA, NOME, CARGO, REGIONAL, ESTADO, CIDADE, GERENTE, GESTOR_DIRETO, EMAIL_GESTOR, DIRETORIA, GERENTE_DIVISAO)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matricula,
        nome,
        cargo,
        regional,
        estado,
        cidade,
        gerente,
        gestorDireto,
        emailGestor,
        diretoria,
        gerenteDivisao || null, // GERENTE_DIVISAO
      ]
    );

    res.json({
      sucesso: true,
      mensagem: "Colaborador criado com sucesso!",
    });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao criar colaborador.`,
      error
    );
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao criar colaborador." });
  }
};

/**
 * Edita dados de um colaborador existente
 *
 * Valida se a matrícula não está sendo usada por outro colaborador.
 * Apenas colaboradores da mesma diretoria podem ser editados.
 *
 * @param {Object} req - Request Express
 * @param {number} req.body.id - ID do colaborador a editar
 * @param {string} req.body.matricula - Nova matrícula (deve ser única)
 * @param {string} req.body.nome - Novo nome
 * @param {string} req.body.cargo - Novo cargo
 * @param {string} req.body.regional - Nova regional
 * @param {string} req.body.estado - Novo estado
 * @param {string} req.body.cidade - Nova cidade
 * @param {string} req.body.gerente - Novo gerente
 * @param {string} req.body.gestorDireto - Novo gestor direto
 * @param {string} req.body.emailGestor - Novo email do gestor
 * @param {string} req.body.gerenteDivisao - Novo gerente de divisão (opcional)
 * @param {string} req.diretoriaHE - Diretoria do aprovador
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "..." }
 */
exports.editarColaborador = async (req, res) => {
  const conexao = db.mysqlPool;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;
  const {
    id,
    matricula,
    nome,
    cargo,
    regional,
    estado,
    cidade,
    gerente,
    gestorDireto,
    emailGestor,
    gerenteDivisao,
  } = req.body;

  // Validação dos campos obrigatórios
  if (!id || !matricula || !nome || !cargo || !regional || !estado || !cidade || !gerente || !gestorDireto || !emailGestor) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Todos os campos são obrigatórios.",
    });
  }

  try {
    // Verifica se a matrícula já existe em outro colaborador
    const [existe] = await conexao.query(
      `SELECT ID FROM COLABORADORES_CW WHERE MATRICULA = ? AND ID != ?`,
      [matricula, id]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Já existe outro colaborador com esta matrícula.",
      });
    }

    const [result] = await conexao.query(
      `UPDATE COLABORADORES_CW
       SET MATRICULA = ?, NOME = ?, CARGO = ?, REGIONAL = ?, ESTADO = ?, CIDADE = ?, GERENTE = ?, GESTOR_DIRETO = ?, EMAIL_GESTOR = ?, GERENTE_DIVISAO = ?
       WHERE ID = ? AND (DIRETORIA = ? OR DIRETORIA IS NULL)`,
      [
        matricula,
        nome,
        cargo,
        regional,
        estado,
        cidade,
        gerente,
        gestorDireto,
        emailGestor,
        gerenteDivisao || null, // GERENTE_DIVISAO
        id,
        diretoria,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ sucesso: false, mensagem: "Colaborador não encontrado." });
    }

    res.json({
      sucesso: true,
      mensagem: "Colaborador atualizado com sucesso!",
    });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao editar colaborador ID: ${id}.`,
      error
    );
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao atualizar colaborador." });
  }
};

/**
 * Exclui um colaborador da base de dados
 *
 * Remove permanentemente o colaborador do sistema.
 * Apenas colaboradores da mesma diretoria podem ser excluídos.
 *
 * @param {Object} req - Request Express
 * @param {number} req.body.id - ID do colaborador a excluir
 * @param {string} req.diretoriaHE - Diretoria do aprovador
 * @param {Object} res - Response Express
 *
 * @returns {Object} JSON: { sucesso: true, mensagem: "..." }
 */
exports.excluirColaborador = async (req, res) => {
  const conexao = db.mysqlPool;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ sucesso: false, mensagem: "ID é obrigatório." });
  }

  try {
    const [result] = await conexao.query(
      `DELETE FROM COLABORADORES_CW WHERE ID = ? AND (DIRETORIA = ? OR DIRETORIA IS NULL)`,
      [id, diretoria]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ sucesso: false, mensagem: "Colaborador não encontrado." });
    }

    res.json({
      sucesso: true,
      mensagem: "Colaborador excluído com sucesso!",
    });
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao excluir colaborador ID: ${id}.`,
      error
    );
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao excluir colaborador." });
  }
};

/**
 * Exporta lista de colaboradores em formato CSV
 *
 * Gera arquivo CSV com todos os colaboradores da diretoria,
 * incluindo BOM UTF-8 para compatibilidade com Excel.
 *
 * @param {Object} req - Request Express
 * @param {string} req.diretoriaHE - Diretoria do aprovador
 * @param {Object} res - Response Express
 *
 * @returns {File} Arquivo CSV para download
 */
exports.exportarColaboradores = async (req, res) => {
  const conexao = db.mysqlPool;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  try {
    const [rows] = await conexao.query(
      `SELECT ID, MATRICULA, NOME, CARGO, REGIONAL, ESTADO, CIDADE, GERENTE, GESTOR_DIRETO, EMAIL_GESTOR, DIRETORIA, GERENTE_DIVISAO
       FROM COLABORADORES_CW
       WHERE (DIRETORIA = ? OR DIRETORIA IS NULL)
       ORDER BY NOME`,
      [diretoria]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .send("Nenhum colaborador encontrado para exportar.");
    }

    // Constrói o CSV
    const header = Object.keys(rows[0]).join(",") + "\r\n";
    const csvData = rows
      .map((row) => {
        return Object.values(row)
          .map((value) => {
            // Trata valores que podem conter vírgulas ou aspas
            let strValue = String(
              value === null || value === undefined ? "" : value
            );
            if (
              strValue.includes(",") ||
              strValue.includes('"') ||
              strValue.includes("\n")
            ) {
              strValue = `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
          })
          .join(",");
      })
      .join("\r\n");

    const csv = "\uFEFF" + header + csvData;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=colaboradores.csv"
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao exportar colaboradores.`,
      error
    );
    res.status(500).send("Erro interno ao exportar os colaboradores.");
  }
};

/**
 * Retorna meses e anos únicos da tabela PLANEJAMENTO_HE
 *
 * Esta função é usada para preencher os dropdowns de filtro
 * na página "Minhas Solicitações", mostrando apenas os meses
 * e anos que contêm registros na base.
 */
exports.obterMesesAnosUnicos = async (req, res) => {
  const conexao = db.mysqlPool;
  const emailUsuario = req.session.usuario?.email;
  const diretoria = req.diretoriaHE;

  if (!emailUsuario) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    // Consulta para obter meses e anos únicos da base
    // Ajustei para considerar a diretoria do usuário
    const query = `
      SELECT DISTINCT MES, ANO
      FROM PLANEJAMENTO_HE
      WHERE ENVIADO_POR = ? AND (DIRETORIA = ? OR DIRETORIA IS NULL)
      ORDER BY ANO DESC, FIELD(MES, 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro')`;

    const [rows] = await conexao.query(query, [emailUsuario, diretoria]);

    // Agrupa os meses por ano para facilitar o uso no frontend
    const mesesPorAno = {};
    const anosUnicos = new Set();

    rows.forEach(row => {
      if (row.ANO) {
        anosUnicos.add(row.ANO);
        if (!mesesPorAno[row.ANO]) {
          mesesPorAno[row.ANO] = new Set();
        }
        if (row.MES) {
          mesesPorAno[row.ANO].add(row.MES);
        }
      }
    });

    // Converte os sets para arrays
    const resultado = {
      anos: Array.from(anosUnicos).sort().reverse(), // Ordena do mais recente para o mais antigo
      mesesPorAno: {}
    };

    for (const [ano, meses] of Object.entries(mesesPorAno)) {
      resultado.mesesPorAno[ano] = Array.from(meses).sort((a, b) => {
        // Ordena meses na ordem cronológica
        const ordemMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return ordemMeses.indexOf(a) - ordemMeses.indexOf(b);
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error('[ERRO] Erro ao obter meses e anos únicos:', error);
    res.status(500).json({ erro: "Erro ao carregar meses e anos." });
  }
};
