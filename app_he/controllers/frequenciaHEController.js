// ================================================================================
// 📊 CONTROLLER DE FREQUÊNCIA DE HORAS EXTRAS (HE)
// ================================================================================
// Este controller gerencia a comparação entre horas extras executadas
// (na tabela de frequência) e as que foram previamente solicitadas/aprovadas
// no sistema de planejamento, permitindo identificar horas executadas sem autorização.
// ================================================================================

const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const db = require("../../db/db");
const configFrequencia = require("../json/config_frequencia.json");

// ================================================================================
// 🔍 Funções auxiliares de validação
// ================================================================================

/**
 * Verifica se a tabela FREQUENCIA existe e tem as colunas necessárias
 *
 * @param {Object} conexao - Conexão do banco de dados
 * @returns {Promise<boolean>} - True se a tabela e colunas necessárias existirem
 */
// Exportar a função de validação para uso externo
exports.validarTabelaFrequencia = async function validarTabelaFrequencia(
  conexao
) {
  try {
    const tabelaNome = configFrequencia.tabela_frequencia.nome;

    // Verifica se a tabela FREQUENCIA existe
    const [tabelas] = await conexao.query(`SHOW TABLES LIKE '${tabelaNome}'`);

    if (tabelas.length === 0) {
      console.log(
        `[AVISO] Tabela ${tabelaNome} não encontrada no banco de dados.`
      );
      return false;
    }

    // Verifica se as colunas necessárias existem
    const [colunas] = await conexao.query(`SHOW COLUMNS FROM ${tabelaNome}`);
    const nomesColunas = colunas.map((c) => c.Field.toUpperCase());

    const colunasNecessarias =
      configFrequencia.tabela_frequencia.colunas_obrigatorias;
    const colunasFaltando = colunasNecessarias.filter(
      (col) => !nomesColunas.includes(col)
    );

    if (colunasFaltando.length > 0) {
      console.log(
        `[AVISO] Colunas faltando na tabela ${tabelaNome}: ${colunasFaltando.join(
          ", "
        )}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[ERRO] Erro ao validar tabela FREQUENCIA:", error);
    return false;
  }
};

// ================================================================================
// 📋 APIs para Dashboard de Frequência vs Planejamento
// ================================================================================

/**
 * Gera resumo comparativo entre horas executadas e autorizadas por gerente
 *
 * Compara as horas extras marcadas na tabela FREQUENCIA com as que foram
 * previamente solicitadas e aprovadas no PLANEJAMENTO_HE para o mesmo período.
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.mes - Mês para filtrar (obrigatório)
 * @param {string} req.query.gerente - Gerente para filtrar (opcional)
 * @param {string} req.diretoriaHE - Diretoria do usuário (injetada pelo middleware)
 * @param {Object} res - Response Express
 *
 * @returns {Array} JSON array com dados comparativos por gerente:
 * [{
 *   gerente: "NOME DO GERENTE",
 *   executado_50: 20,      // Horas executadas 50%
 *   executado_100: 10,     // Horas executadas 100%
 *   autorizado_50: 15,     // Horas autorizadas 50%
 *   autorizado_100: 10,    // Horas autorizadas 100%
 *   nao_autorizado_50: 5,  // Executado sem autorização 50%
 *   nao_autorizado_100: 0, // Executado sem autorização 100%
 *   total_executado: 30,
 *   total_autorizado: 25,
 *   total_nao_autorizado: 5
 * }]
 */
exports.getComparativoFrequencia = async (req, res) => {
  const { mes, gerente } = req.query;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!mes) {
    return res.status(400).json({
      erro: "Parâmetro 'mes' é obrigatório para gerar o comparativo.",
    });
  }

  try {
    const conexao = db.mysqlPool;

    // Valida se a tabela FREQUENCIA existe e tem as colunas necessárias
    const tabelaValida = await exports.validarTabelaFrequencia(conexao);
    if (!tabelaValida) {
      return res.status(400).json({
        erro: "Tabela FREQUENCIA não encontrada ou com estrutura incorreta. Verifique se as colunas NOME, CARGO, EVENTO, GERENTE_IMEDIATO, QTD_HORAS e DATA existem.",
      });
    }

    const colunas = configFrequencia.tabela_frequencia.colunas_obrigatorias;
    const nomeTabela = configFrequencia.tabela_frequencia.nome;

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

    // Obtemos todas as horas executadas (da tabela FREQUENCIA) agrupadas por colaborador e gerente
    // Agora adicionando também a coluna GERENTE_DIVISAO para agrupamento hierárquico

    let queryExecutado = `
      SELECT 
        ${colunas[3]} as gerente,
        ${colunas[0]} as colaborador,
        COALESCE(GERENTE_DIVISAO, '') as gerente_divisao,
        SUM(CASE WHEN ${colunas[2]} = 'Hora Extra 50%' THEN ${colunas[4]} ELSE 0 END) as executado_50,
        SUM(CASE WHEN ${colunas[2]} = 'Horas extras 100%' THEN ${colunas[4]} ELSE 0 END) as executado_100
      FROM ${nomeTabela}
      WHERE MONTH(${colunas[5]}) = ?
    `;
    let paramsExecutado = [mesNumero];

    if (gerente) {
      queryExecutado += ` AND ${colunas[3]} = ?`; // GERENTE_IMEDIATO
      paramsExecutado.push(gerente);
    }

    queryExecutado += ` GROUP BY ${colunas[3]}, ${colunas[0]}, GERENTE_DIVISAO
        ORDER BY ${colunas[3]}, ${colunas[0]}`;

    const [executado] = await conexao.query(queryExecutado, paramsExecutado);

    // Obtemos todas as horas autorizadas (da tabela PLANEJAMENTO_HE) - agrupadas por colaborador e gerente
    let queryAutorizado = `
      SELECT 
        GERENTE as gerente,
        COLABORADOR as colaborador,
        SUM(CASE WHEN TIPO_HE = '50%' THEN HORAS ELSE 0 END) as autorizado_50,
        SUM(CASE WHEN TIPO_HE = '100%' THEN HORAS ELSE 0 END) as autorizado_100
      FROM PLANEJAMENTO_HE 
      WHERE MES = ?
        AND STATUS = 'APROVADO'
        AND (DIRETORIA = ? OR DIRETORIA IS NULL)
    `;
    const paramsAutorizado = [mes, diretoria];

    if (gerente) {
      queryAutorizado += ` AND GERENTE = ?`;
      paramsAutorizado.push(gerente);
    }

    queryAutorizado += ` GROUP BY GERENTE, COLABORADOR`;

    const [autorizado] = await conexao.query(queryAutorizado, paramsAutorizado);

    // Montamos mapas para cada conjunto de dados, associando por gerente e colaborador
    const mapaExecutado = {};
    executado.forEach((item) => {
      const key = `${item.gerente}_${item.colaborador}`;
      if (!mapaExecutado[key]) {
        mapaExecutado[key] = {
          executado_50: 0,
          executado_100: 0,
          gerente_divisao: item.gerente_divisao,
        };
      }
      mapaExecutado[key].executado_50 += parseFloat(item.executado_50 || 0);
      mapaExecutado[key].executado_100 += parseFloat(item.executado_100 || 0);
      mapaExecutado[key].gerente_divisao = item.gerente_divisao;
    });

    const mapaAutorizado = {};
    autorizado.forEach((item) => {
      const key = `${item.gerente}_${item.colaborador}`;
      if (!mapaAutorizado[key]) {
        mapaAutorizado[key] = {
          autorizado_50: 0,
          autorizado_100: 0,
        };
      }
      mapaAutorizado[key].autorizado_50 += parseFloat(item.autorizado_50 || 0);
      mapaAutorizado[key].autorizado_100 += parseFloat(
        item.autorizado_100 || 0
      );
    });

    // Agora, pegamos todos os gerentes possíveis (tanto de executado quanto de autorizado)
    const todosGerentes = [
      ...new Set([
        ...Object.keys(mapaExecutado),
        ...Object.keys(mapaAutorizado),
      ]),
    ];

    // Para a visão agregada por gerente, precisamos:
    // 1. Calcular individualmente por colaborador: executado vs autorizado
    // 2. Somar os resultados por gerente
    const mapaTotalPorGerente = {};

    // Processamos cada colaborador individualmente para calcular horas não autorizadas
    // Primeiro, obtemos todas as chaves únicas (gerente_colaborador)
    const todasChaves = [
      ...new Set([
        ...Object.keys(mapaExecutado),
        ...Object.keys(mapaAutorizado),
      ]),
    ];

    for (const key of todasChaves) {
      const [nomeGerente, colaborador] = key.split("_");

      if (!mapaTotalPorGerente[nomeGerente]) {
        const exec = mapaExecutado[key];
        mapaTotalPorGerente[nomeGerente] = {
          executado_50: 0,
          executado_100: 0,
          autorizado_50: 0,
          autorizado_100: 0,
          nao_autorizado_50: 0,
          nao_autorizado_100: 0,
          gerente_divisao: exec ? exec.gerente_divisao : "",
        };
      }

      const exec = mapaExecutado[key] || { executado_50: 0, executado_100: 0 };
      const aut = mapaAutorizado[key] || {
        autorizado_50: 0,
        autorizado_100: 0,
      };

      // Calculamos as horas não autorizadas para este colaborador individualmente
      // Apenas autorizações do mesmo colaborador podem cobrir horas executadas dele
      const nao_aut_50 = Math.max(0, exec.executado_50 - aut.autorizado_50);
      const nao_aut_100 = Math.max(0, exec.executado_100 - aut.autorizado_100);

      // Somamos ao total do gerente
      mapaTotalPorGerente[nomeGerente].executado_50 += exec.executado_50;
      mapaTotalPorGerente[nomeGerente].executado_100 += exec.executado_100;
      // Para os totais autorizados e não autorizados, usamos os valores calculados individualmente
      mapaTotalPorGerente[nomeGerente].nao_autorizado_50 += nao_aut_50;
      mapaTotalPorGerente[nomeGerente].nao_autorizado_100 += nao_aut_100;
    }

    // Obter informações de divisão para agrupamento hierárquico
    const gerentesComDivisao = {};
    for (const nomeGerente of Object.keys(mapaTotalPorGerente)) {
      const dados = mapaTotalPorGerente[nomeGerente];
      gerentesComDivisao[nomeGerente] = {
        ...dados,
        gerente_divisao: dados.gerente_divisao,
      };
    }

    // Montamos o resultado combinando todos os dados por gerente
    const resultado = Object.keys(gerentesComDivisao).map((nomeGerente) => {
      const dados = gerentesComDivisao[nomeGerente];

      // Calculamos o total autorizado como executado - não autorizado (apenas o que foi coberto)
      const autorizado_50 = dados.executado_50 - dados.nao_autorizado_50;
      const autorizado_100 = dados.executado_100 - dados.nao_autorizado_100;

      return {
        gerente: nomeGerente,
        executado_50: dados.executado_50,
        executado_100: dados.executado_100,
        autorizado_50: Math.max(0, autorizado_50), // Não pode ser negativo
        autorizado_100: Math.max(0, autorizado_100), // Não pode ser negativo
        nao_autorizado_50: dados.nao_autorizado_50,
        nao_autorizado_100: dados.nao_autorizado_100,
        total_executado: dados.executado_50 + dados.executado_100,
        total_autorizado:
          Math.max(0, autorizado_50) + Math.max(0, autorizado_100),
        total_nao_autorizado:
          dados.nao_autorizado_50 + dados.nao_autorizado_100,
        gerente_divisao: dados.gerente_divisao,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao gerar comparativo de frequência.`,
      error
    );
    res
      .status(500)
      .json({ erro: "Erro interno ao gerar o comparativo de frequência." });
  }
};


// ================================================================================
// 💰 API para comparativo monetário (valores em R$)
// ================================================================================

/**
 * Gera resumo comparativo entre horas executadas e autorizadas por gerente convertido em valores monetários
 *
 * Converte as horas extras em valores monetários usando os valores por hora definidos no sistema
 *
 * @param {Object} req - Request Express
 * @param {string} req.query.mes - Mês para filtrar (obrigatório)
 * @param {string} req.query.gerente - Gerente para filtrar (opcional)
 * @param {string} req.diretoriaHE - Diretoria do usuário (injetada pelo middleware)
 * @param {Object} res - Response Express
 *
 * @returns {Array} JSON array com dados comparativos por gerente em valores monetários:
 * [{
 *   gerente: "NOME DO GERENTE",
 *   executado_50: 2469.00,    // Valor em R$ executado 50%
 *   executado_100: 2469.00,   // Valor em R$ executado 100%
 *   autorizado_50: 1851.75,   // Valor em R$ autorizado 50%
 *   autorizado_100: 2469.00,  // Valor em R$ autorizado 100%
 *   nao_autorizado_50: 617.25,// Valor em R$ executado sem autorização 50%
 *   nao_autorizado_100: 0,    // Valor em R$ executado sem autorização 100%
 *   total_executado: 4938.00,
 *   total_autorizado: 4320.75,
 *   total_nao_autorizado: 617.25
 * }]
 */
exports.getComparativoFrequenciaValor = async (req, res) => {
  const { mes, gerente } = req.query;
  const diretoria = req.diretoriaHE;
  const user = req.session.usuario;
  const ip = req.ip;

  if (!mes) {
    return res.status(400).json({
      erro: "Parâmetro 'mes' é obrigatório para gerar o comparativo.",
    });
  }

  try {
    const conexao = db.mysqlPool;

    // Valida se a tabela FREQUENCIA existe e tem as colunas necessárias
    const tabelaValida = await exports.validarTabelaFrequencia(conexao);
    if (!tabelaValida) {
      return res.status(400).json({
        erro: "Tabela FREQUENCIA não encontrada ou com estrutura incorreta. Verifique se as colunas NOME, CARGO, EVENTO, GERENTE_IMEDIATO, QTD_HORAS e DATA existem.",
      });
    }

    const colunas = configFrequencia.tabela_frequencia.colunas_obrigatorias;
    const nomeTabela = configFrequencia.tabela_frequencia.nome;

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

    // Obtemos todas as horas executadas (da tabela FREQUENCIA) agrupadas por colaborador e gerente
    // Usando a mesma abordagem da função que funciona corretamente, com distinção exata no SQL
    let queryExecutado = `
      SELECT 
        ${colunas[3]} as gerente,
        ${colunas[0]} as colaborador,
        ${colunas[1]} as cargo,
        COALESCE(GERENTE_DIVISAO, '') as gerente_divisao,
        SUM(CASE WHEN ${colunas[2]} = 'Hora Extra 50%' THEN ${colunas[4]} ELSE 0 END) as executado_50,
        SUM(CASE WHEN ${colunas[2]} = 'Horas extras 100%' THEN ${colunas[4]} ELSE 0 END) as executado_100
      FROM ${nomeTabela}
      WHERE MONTH(${colunas[5]}) = ?
    `;
    let paramsExecutado = [mesNumero];

    if (gerente) {
      queryExecutado += ` AND ${colunas[3]} = ?`; // GERENTE_IMEDIATO
      paramsExecutado.push(gerente);
    }

    queryExecutado += ` GROUP BY ${colunas[3]}, ${colunas[0]}, ${colunas[1]}, GERENTE_DIVISAO
        ORDER BY ${colunas[3]}, ${colunas[0]}`;

    const [dadosExecutado] = await conexao.query(
      queryExecutado,
      paramsExecutado
    );

    // Obtemos todas as horas autorizadas (da tabela PLANEJAMENTO_HE) - agrupadas por colaborador e gerente
    let queryAutorizado = `
      SELECT 
        GERENTE as gerente,
        COLABORADOR as colaborador,
        CARGO,
        SUM(CASE WHEN TIPO_HE = '50%' THEN HORAS ELSE 0 END) as autorizado_50,
        SUM(CASE WHEN TIPO_HE = '100%' THEN HORAS ELSE 0 END) as autorizado_100
      FROM PLANEJAMENTO_HE 
      WHERE MES = ?
        AND STATUS = 'APROVADO'
        AND (DIRETORIA = ? OR DIRETORIA IS NULL)
    `;
    const paramsAutorizado = [mes, diretoria];

    if (gerente) {
      queryAutorizado += ` AND GERENTE = ?`;
      paramsAutorizado.push(gerente);
    }

    queryAutorizado += ` GROUP BY GERENTE, COLABORADOR, CARGO`;

    const [autorizado] = await conexao.query(queryAutorizado, paramsAutorizado);

    // Carregamos os valores por hora para conversão
    const { getValorHora } = require("../utils/valoresHE.js");

    // Obtemos os valores por hora para os cargos únicos presentes nos dados
    const cargosUnicos = [
      ...new Set([
        ...dadosExecutado.map((e) => e.cargo),
        ...autorizado.map((a) => a.CARGO),
      ]),
    ];
    const valoresPorCargo = {};

    for (const cargo of cargosUnicos) {
      if (cargo) {
        // Apenas processa se o cargo não for nulo/vazio
        valoresPorCargo[cargo] = {
          "50%": getValorHora(cargo, "50%"),
          "100%": getValorHora(cargo, "100%"),
        };
      }
    }

    // Montamos mapas para cada conjunto de dados, associando por gerente e colaborador
    const mapaExecutado = {};
    for (const item of dadosExecutado) {
      const key = `${item.gerente}_${item.colaborador}`;

      if (!mapaExecutado[key]) {
        mapaExecutado[key] = {
          executado_50: 0,
          executado_100: 0,
          gerente_divisao: item.gerente_divisao,
          gerente: item.gerente,
          cargo: item.cargo,
        };
      }

      // Converter horas para valores monetários
      const valorHora50 = valoresPorCargo[item.cargo]
        ? valoresPorCargo[item.cargo]["50%"]
        : 0;
      const valorHora100 = valoresPorCargo[item.cargo]
        ? valoresPorCargo[item.cargo]["100%"]
        : 0;

      mapaExecutado[key].executado_50 +=
        parseFloat(item.executado_50 || 0) * valorHora50;
      mapaExecutado[key].executado_100 +=
        parseFloat(item.executado_100 || 0) * valorHora100;
    }

    const mapaAutorizado = {};
    for (const item of autorizado) {
      const key = `${item.gerente}_${item.colaborador}`;

      if (!mapaAutorizado[key]) {
        mapaAutorizado[key] = {
          autorizado_50: 0,
          autorizado_100: 0,
          cargo: item.CARGO,
        };
      }

      // Converter horas para valores monetários diretamente aqui
      const valorHora50 = valoresPorCargo[item.CARGO]
        ? valoresPorCargo[item.CARGO]["50%"]
        : 0;
      const valorHora100 = valoresPorCargo[item.CARGO]
        ? valoresPorCargo[item.CARGO]["100%"]
        : 0;

      mapaAutorizado[key].autorizado_50 +=
        parseFloat(item.autorizado_50 || 0) * valorHora50;
      mapaAutorizado[key].autorizado_100 +=
        parseFloat(item.autorizado_100 || 0) * valorHora100;
    }

    // Agora, pegamos todos os gerentes possíveis (tanto de executado quanto de autorizado)
    const mapaTotalPorGerente = {};

    // Processamos cada colaborador individualmente para calcular valores não autorizados
    const todasChaves = [
      ...new Set([
        ...Object.keys(mapaExecutado),
        ...Object.keys(mapaAutorizado),
      ]),
    ];

    for (const key of todasChaves) {
      const [nomeGerente, colaborador] = key.split("_");

      if (!mapaTotalPorGerente[nomeGerente]) {
        const exec = mapaExecutado[key];
        mapaTotalPorGerente[nomeGerente] = {
          executado_50: 0,
          executado_100: 0,
          autorizado_50: 0,
          autorizado_100: 0,
          nao_autorizado_50: 0,
          nao_autorizado_100: 0,
          gerente_divisao: exec ? exec.gerente_divisao : "",
        };
      }

      const exec = mapaExecutado[key] || { executado_50: 0, executado_100: 0 };
      const aut = mapaAutorizado[key] || {
        autorizado_50: 0,
        autorizado_100: 0,
      };

      // Calculamos os valores não autorizados para este colaborador individualmente
      // Apenas autorizações do mesmo colaborador podem cobrir horas executadas dele
      const nao_aut_50 = Math.max(0, exec.executado_50 - aut.autorizado_50);
      const nao_aut_100 = Math.max(0, exec.executado_100 - aut.autorizado_100);

      // Somamos ao total do gerente
      mapaTotalPorGerente[nomeGerente].executado_50 += exec.executado_50;
      mapaTotalPorGerente[nomeGerente].executado_100 += exec.executado_100;
      // Para os totais não autorizados, usamos os valores calculados individualmente
      mapaTotalPorGerente[nomeGerente].nao_autorizado_50 += nao_aut_50;
      mapaTotalPorGerente[nomeGerente].nao_autorizado_100 += nao_aut_100;
    }

    // Montamos o resultado combinando todos os dados por gerente
    const resultado = Object.keys(mapaTotalPorGerente).map((nomeGerente) => {
      const dados = mapaTotalPorGerente[nomeGerente];

      // Lógica corrigida: O valor autorizado é a parte do executado que foi coberta.
      // Valor Autorizado = Valor Executado - Valor Não Autorizado
      const autorizado_50 = dados.executado_50 - dados.nao_autorizado_50;
      const autorizado_100 = dados.executado_100 - dados.nao_autorizado_100;

      return {
        gerente: nomeGerente,
        executado_50: dados.executado_50,
        executado_100: dados.executado_100,
        autorizado_50: Math.max(0, autorizado_50), // Garante que não seja negativo
        autorizado_100: Math.max(0, autorizado_100), // Garante que não seja negativo
        nao_autorizado_50: dados.nao_autorizado_50,
        nao_autorizado_100: dados.nao_autorizado_100,
        total_executado: dados.executado_50 + dados.executado_100,
        total_autorizado: Math.max(0, autorizado_50) + Math.max(0, autorizado_100),
        total_nao_autorizado:
          dados.nao_autorizado_50 + dados.nao_autorizado_100,
        gerente_divisao: dados.gerente_divisao,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error(
      `[ERRO] Usuário: ${user?.nome}, IP: ${ip}, Ação: Erro ao gerar comparativo monetário.`,
      error
    );
    res
      .status(500)
      .json({ erro: "Erro interno ao gerar o comparativo monetário." });
  }
};

// As funções já foram definidas como exports.functionName,
// então não precisamos fazer uma nova exportação com module.exports.
// A função validarTabelaFrequencia também já foi adicionada ao exports.
