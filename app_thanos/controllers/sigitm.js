const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const XLSX = require('xlsx');

router.get('/oracle-data', async (req, res) => {
    try {
        const { startDate, endDate, gprNome } = req.query;
        const connection = await db.getOracleConnection();

        // Alterar a sessão para português
        await connection.execute(`ALTER SESSION SET NLS_DATE_LANGUAGE = 'PORTUGUESE'`);

        // Mapear os valores do dropdown para os valores específicos de GPR_NOME
        let gprNomeValues = [];
        if (gprNome === "rede_externa") {
            gprNomeValues = [
                'Bucle Centro Oeste ABILITY',
                'Bucle Centro Oeste ONDACOM',
                'LP_FSP',
                'OSP CENTRO - OESTE B2B',
                'OSP NORTE',
                'Rede Externa Ability CO-NO',
                'Rede Externa Ondacom CO-NO'
            ];
        } else if (gprNome === "tel_pl") {
            gprNomeValues = [
                'Parceiros Centro Oeste',
                'Parceiros Norte'
            ];
        }

        // Construir a consulta SQL com base na nova consulta
        let sqlQuery = `
            WITH base AS (
                SELECT
                    /* =====================================================
                       TEMPO
                       ===================================================== */
                    UPPER(TRIM(TO_CHAR(ti.tqi_data_reclamacao, 'Month'))) AS mes_inicio,

                    /* =====================================================
                       IDENTIFICAÇÃO
                       ===================================================== */
                    vt.vdi_codigo,
                    ti.tqi_codigo,
                    ti.tqi_raiz,
                    ti.tqi_identificador AS id_circuito,

                    /* =====================================================
                       STATUS
                       ===================================================== */
                    vt.vdi_status,
                    CASE vt.vdi_status
                        WHEN 10 THEN 'Ativo'
                        WHEN 20 THEN 'Parado'
                        WHEN 30 THEN 'Baixado'
                        WHEN 90 THEN 'Fechado'
                        WHEN 91 THEN 'Cancelado'
                        ELSE 'nao_consta'
                    END AS status_vida,

                    CASE ti.tqi_status
                        WHEN 10 THEN 'Ativo'
                        WHEN 20 THEN 'Parado'
                        WHEN 30 THEN 'Baixado'
                        WHEN 90 THEN 'Fechado'
                        WHEN 91 THEN 'Cancelado'
                        ELSE 'nao_consta'
                    END AS status_reparo,

                    /* =====================================================
                       PROCEDÊNCIA / PRODUTO / ORIGEM
                       ===================================================== */
                    CASE ti.tqi_procedencia
                        WHEN 10 THEN 'reativo'
                        WHEN 20 THEN 'proativo'
                        WHEN 30 THEN 'preventivo'
                        WHEN 40 THEN 'triagem'
                        ELSE 'nao_consta'
                    END AS procedencia,

                    CASE ti.tqi_tipo_incidencia
                        WHEN 10 THEN 'DADOS'
                        WHEN 20 THEN 'DDR'
                        WHEN 30 THEN 'CONVERGENTE'
                        ELSE 'nao_consta'
                    END AS produto,

                    CASE
                        WHEN ti.tqi_origem = 20 THEN 'VIVO2'
                        ELSE 'VIVO1'
                    END AS origem,

                    /* =====================================================
                       LOCALIZAÇÃO
                       ===================================================== */
                    ti.tqi_municipio_nome AS cidade,
                    ti.tqi_estado_codigo  AS uf,
                    ti.tqi_estado_nome    AS estado,
                    ti.tqi_area_endereco AS endereco,

                    CASE
                        WHEN ti.tqi_estado_codigo = 'DF' AND UPPER(ti.tqi_municipio_nome) = 'BRASILIA' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'GO' AND UPPER(ti.tqi_municipio_nome) = 'GOIANIA' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'MT' AND UPPER(ti.tqi_municipio_nome) = 'CUIABA' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'MS' AND UPPER(ti.tqi_municipio_nome) = 'CAMPO GRANDE' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'PA' AND UPPER(ti.tqi_municipio_nome) = 'BELEM' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'AM' AND UPPER(ti.tqi_municipio_nome) = 'MANAUS' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'AP' AND UPPER(ti.tqi_municipio_nome) = 'MACAPA' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'MA' AND UPPER(ti.tqi_municipio_nome) = 'S LUIS' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'TO' AND UPPER(ti.tqi_municipio_nome) = 'PALMAS' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'RO' AND UPPER(ti.tqi_municipio_nome) = 'PORTO VELHO' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'AC' AND UPPER(ti.tqi_municipio_nome) = 'RIO BRANCO' THEN 'CAPITAL'
                        WHEN ti.tqi_estado_codigo = 'RR' AND UPPER(ti.tqi_municipio_nome) = 'BOA VISTA' THEN 'CAPITAL'
                        ELSE 'INTERIOR'
                    END AS tipo_cidade,

                    CASE
                        WHEN ti.tqi_estado_codigo IN ('DF','GO','MT','MS','TO','AC','RO') THEN 'CENTRO-OESTE'
                        WHEN ti.tqi_estado_codigo IN ('MA','AM','PA','AP','RR') THEN 'NORTE'
                        ELSE 'OUTRA'
                    END AS regional,

                    CASE
                        WHEN ti.tqi_municipio_nome IN
                            ('FORMOSA','CIDADE OCIDENTAL','VALPARAISO','PLANALTINA','LUZIANIA','LUZIÂNIA')
                            THEN 'BRASILIA'
                        WHEN ti.tqi_municipio_nome IN ('ANAPOLIS','Anápolis','JARAGUA','Jaraguá')
                            THEN 'ANAPOLIS'
                        WHEN ti.tqi_estado_codigo = 'PA' THEN 'BELEM'
                        WHEN ti.tqi_estado_codigo IN ('AP','AM','RR') THEN 'MANAUS'
                        WHEN ti.tqi_estado_codigo IN ('AC','MS','RO') THEN 'CAMPO GRANDE'
                        WHEN ti.tqi_estado_codigo = 'MT' THEN 'CUIABA'
                        WHEN ti.tqi_estado_codigo = 'GO' THEN 'GOIANIA'
                        WHEN ti.tqi_estado_codigo = 'TO' THEN 'PALMAS'
                        WHEN ti.tqi_estado_codigo = 'DF' THEN 'BRASILIA'
                        WHEN ti.tqi_estado_codigo = 'MA' THEN 'SAO LUIS'
                        ELSE 'OUTRO'
                    END AS nom_cluster,

                    /* =====================================================
                       CLIENTE
                       ===================================================== */
                    (
                        SELECT cliente
                        FROM (
                            SELECT ts.tis_cliente_titular AS cliente, 1 ordem
                            FROM sigitm_1_2.tbl_ti_servicos ts
                            WHERE ts.tis_lp = ti.tqi_identificador

                            UNION ALL
                            SELECT ts.tis_cliente_titular, 2
                            FROM sigitm_1_2.tbl_ti_servicos ts
                            WHERE ts.tis_designador_acesso = ti.tqi_identificador

                            UNION ALL
                            SELECT ts.tis_cliente_titular, 3
                            FROM sigitm_1_2.tbl_ti_servicos ts
                            WHERE ts.tis_cliente_terminal = ti.tqi_identificador
                        )
                        ORDER BY ordem
                        FETCH FIRST 1 ROW ONLY
                    ) AS nome_cliente,

                    /* =====================================================
                       GRUPOS
                       ===================================================== */
                    g.grp_codigo,
                    g.grp_nome,

                    (
                        SELECT MAX(gb.grp_nome)
                        FROM sigitm_1_2.tbl_ti_baixas tb
                        JOIN sigitm_1_2.tbl_grupos gb
                          ON gb.grp_codigo = tb.tix_baixadopor_grupo
                        WHERE tb.tix_ti = ti.tqi_codigo
                    ) AS grupo_baixa,

                    /* =====================================================
                       DIAGNÓSTICO
                       ===================================================== */
                    ti.tqi_diagnostico,
                    d.dgn_descricao,

                    /* =====================================================
                       DATAS
                       ===================================================== */
                    ti.tqi_data_reclamacao,
                    ti.tqi_data_encerramento,
                    vt.vdi_data_inicio,
                    vt.vdi_data_fim,

                    TO_CHAR(ti.tqi_data_reclamacao,  'DD/MM/YYYY HH24:MI:SS') AS tqi_abertura,
                    TO_CHAR(ti.tqi_data_encerramento,'DD/MM/YYYY HH24:MI:SS') AS tqi_encerramento,
                    TO_CHAR(vt.vdi_data_inicio,'DD/MM/YYYY HH24:MI:SS') AS vdi_data_inicio_fmt,
                    TO_CHAR(vt.vdi_data_fim,   'DD/MM/YYYY HH24:MI:SS') AS vdi_data_fim_fmt,

                    ROUND((vt.vdi_data_fim - vt.vdi_data_inicio) * 24, 2) AS tmr_total

                FROM sigitm_1_2.tbl_vidas_ti vt
                LEFT JOIN sigitm_1_2.tbl_ti ti
                       ON ti.tqi_codigo = vt.vdi_ti
                LEFT JOIN sigitm_1_2.tbl_grupos g
                       ON g.grp_codigo = vt.vdi_grupo
                LEFT JOIN sigitm_1_2.tbl_diagnostico d
                       ON d.dgn_id = ti.tqi_diagnostico

                WHERE
                    ti.tqi_estado_codigo IN ('MS','GO','MA','AM','MT','PA','AP','DF','TO','RO','AC','RR')
                    AND tqi_data_reclamacao >= TO_DATE(:startDate, 'YYYY-MM-DD')
                    AND tqi_data_reclamacao < TO_DATE(:endDate, 'YYYY-MM-DD') + 1
            ),
            ord AS (
                SELECT
                    base.*,
                    -- Captura grupo e status do evento anterior
                    LAG(base.grp_nome) OVER (PARTITION BY base.tqi_codigo ORDER BY base.vdi_data_inicio, base.vdi_codigo) AS grupo_prev,
                    LAG(base.vdi_status) OVER (PARTITION BY base.tqi_codigo ORDER BY base.vdi_data_inicio, base.vdi_codigo) AS status_prev
                FROM base
            )
            SELECT
                ord.*,
                -- Flag conta_tmr: 0 se status atual = Parado E (grupo_prev = 'Parada Relógio Avançados B2B' E status_prev = 20)
                CASE
                    WHEN vdi_status = 20
                         AND grupo_prev = 'Parada Relógio Avançados B2B'
                         AND status_prev = 20
                    THEN 0
                    ELSE 1
                END AS valida_parada,
                -- TMR válido
                CASE
                    WHEN vdi_status = 20
                         AND grupo_prev = 'Parada Relógio Avançados B2B'
                         AND status_prev = 20
                    THEN 0
                    ELSE tmr_total
                END AS tmr_sem_parada
            FROM ord
            ORDER BY tqi_codigo, vdi_data_inicio, vdi_codigo
        `;

        // Adicionar filtro de GPR_NOME se fornecido
        if (gprNomeValues.length > 0) {
            sqlQuery += ` AND g.grp_nome IN (${gprNomeValues.map((_, index) => `:gprNome${index}`).join(', ')})`;
        }

        const binds = { startDate, endDate };

        gprNomeValues.forEach((val, index) => {
            binds[`gprNome${index}`] = val;
        });

        const result = await connection.execute(sqlQuery, binds);

        const rows = result.rows;
        const columns = result.metaData.map(col => col.name);
        // Converte para um array de objetos com chaves nomeadas
        const formattedData = rows.map(row => {
            const obj = {};
            columns.forEach((col, i) => {
                const value = row[i];
                // Limpa null/undefined
                obj[col] = value === null || value === undefined ? '' : value;
            });
            return obj;
        });

        // Gera a planilha a partir dos dados limpos
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Exportar Planilha');

        // Gera o arquivo com compressão ativada
        const buffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'buffer',
            compression: true
        });

        res.setHeader('Content-Disposition', 'attachment; filename="dados.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

        await connection.close();
    } catch (err) {
        console.error('Erro ao consultar dados do OracleDB:', err);
        res.status(500).send('Erro ao consultar dados do OracleDB');
    }
});

module.exports = router;