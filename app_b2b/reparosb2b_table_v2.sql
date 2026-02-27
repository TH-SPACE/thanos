-- ==========================================
-- TABELA reparosb2b - NOVA ESTRUTURA
-- Baseada na nova API BDS (2026-02-27)
-- ==========================================
-- Todos os campos são TEXT para evitar problemas de formatação,
-- exceto campos de data composta e flags que são INT
-- ==========================================

DROP TABLE IF EXISTS reparosb2b;

CREATE TABLE `reparosb2b` (

	`id` INT(11) NOT NULL AUTO_INCREMENT,

	`bd` TEXT NOT NULL COMMENT 'Identificador único do BD (chave para evitar duplicação)' COLLATE 'utf8mb4_unicode_ci',

	`bd_raiz` TEXT NULL DEFAULT NULL COMMENT 'BD raiz' COLLATE 'utf8mb4_unicode_ci',

	`protocolo_crm` TEXT NULL DEFAULT NULL COMMENT 'Protocolo CRM' COLLATE 'utf8mb4_unicode_ci',

	`id_vantive` TEXT NULL DEFAULT NULL COMMENT 'ID Vantive' COLLATE 'utf8mb4_unicode_ci',

	`id_circuito` TEXT NULL DEFAULT NULL COMMENT 'ID do circuito' COLLATE 'utf8mb4_unicode_ci',

	`bd_ant` TEXT NULL DEFAULT NULL COMMENT 'BD antigo' COLLATE 'utf8mb4_unicode_ci',

	`id_comercial` TEXT NULL DEFAULT NULL COMMENT 'ID comercial' COLLATE 'utf8mb4_unicode_ci',

	`status_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código do status' COLLATE 'utf8mb4_unicode_ci',

	`status_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome do status (STATUS na API)' COLLATE 'utf8mb4_unicode_ci',

	`tipo_ngem` TEXT NULL DEFAULT NULL COMMENT 'Tipo NGEM' COLLATE 'utf8mb4_unicode_ci',

	`procedencia` TEXT NULL DEFAULT NULL COMMENT 'Procedência' COLLATE 'utf8mb4_unicode_ci',

	`reclamacao` TEXT NULL DEFAULT NULL COMMENT 'Reclamação' COLLATE 'utf8mb4_unicode_ci',

	`segmento_sistema` TEXT NULL DEFAULT NULL COMMENT 'Segmento do sistema (SEGMENTO_SIGITM)' COLLATE 'utf8mb4_unicode_ci',

	`segmento_comercial` TEXT NULL DEFAULT NULL COMMENT 'Segmento comercial (SEGMENTO_COMERCIAL)' COLLATE 'utf8mb4_unicode_ci',

	`segmento_novo` TEXT NULL DEFAULT NULL COMMENT 'Segmento novo (SEGMENTO_COMERCIAL_NOVO)' COLLATE 'utf8mb4_unicode_ci',

	`segmento_v3` TEXT NULL DEFAULT NULL COMMENT 'Segmento V3' COLLATE 'utf8mb4_unicode_ci',

	`segmento_vivo_corp` TEXT NULL DEFAULT NULL COMMENT 'Segmento Vivo Corp' COLLATE 'utf8mb4_unicode_ci',

	`atendimento_valor` TEXT NULL DEFAULT NULL COMMENT 'Atendimento valor' COLLATE 'utf8mb4_unicode_ci',

	`slm_flag` TEXT NULL DEFAULT NULL COMMENT 'Flag SLM' COLLATE 'utf8mb4_unicode_ci',

	`cliente_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome do cliente (CLIENTE na API)' COLLATE 'utf8mb4_unicode_ci',

	`cnpj` TEXT NULL DEFAULT NULL COMMENT 'CNPJ' COLLATE 'utf8mb4_unicode_ci',

	`cnpj_raiz` TEXT NULL DEFAULT NULL COMMENT 'CNPJ raiz' COLLATE 'utf8mb4_unicode_ci',

	`cod_grupo` TEXT NULL DEFAULT NULL COMMENT 'Código do grupo' COLLATE 'utf8mb4_unicode_ci',

	`grupo_economico` TEXT NULL DEFAULT NULL COMMENT 'Grupo econômico' COLLATE 'utf8mb4_unicode_ci',

	`endereco` TEXT NULL DEFAULT NULL COMMENT 'Endereço (ENDERECO na API)' COLLATE 'utf8mb4_unicode_ci',

	`cidade` TEXT NULL DEFAULT NULL COMMENT 'Cidade' COLLATE 'utf8mb4_unicode_ci',

	`uf` TEXT NULL DEFAULT NULL COMMENT 'Unidade federativa' COLLATE 'utf8mb4_unicode_ci',

	`cluster` TEXT NULL DEFAULT NULL COMMENT 'Cluster' COLLATE 'utf8mb4_unicode_ci',

	`localidade_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código da localidade (CNL)' COLLATE 'utf8mb4_unicode_ci',

	`area_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código da área (AREA)' COLLATE 'utf8mb4_unicode_ci',

	`escritorio_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código do escritório (ESCRITORIO)' COLLATE 'utf8mb4_unicode_ci',

	`regional` TEXT NULL DEFAULT NULL COMMENT 'Regional' COLLATE 'utf8mb4_unicode_ci',

	`regional_vivo` TEXT NULL DEFAULT NULL COMMENT 'Regional Vivo' COLLATE 'utf8mb4_unicode_ci',

	`lp_15` TEXT NULL DEFAULT NULL COMMENT 'LP 15' COLLATE 'utf8mb4_unicode_ci',

	`designador_lp_13` TEXT NULL DEFAULT NULL COMMENT 'Designador LP 13 (LP_13 na API)' COLLATE 'utf8mb4_unicode_ci',

	`lp_operadora` TEXT NULL DEFAULT NULL COMMENT 'LP operadora' COLLATE 'utf8mb4_unicode_ci',

	`servico_cpcc_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome do serviço CPCC' COLLATE 'utf8mb4_unicode_ci',

	`cpcc` TEXT NULL DEFAULT NULL COMMENT 'CPCC' COLLATE 'utf8mb4_unicode_ci',

	`velocidade` TEXT NULL DEFAULT NULL COMMENT 'Velocidade' COLLATE 'utf8mb4_unicode_ci',

	`velocidade_kbps` TEXT NULL DEFAULT NULL COMMENT 'Velocidade em Kbps' COLLATE 'utf8mb4_unicode_ci',

	`produto_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome do produto' COLLATE 'utf8mb4_unicode_ci',

	`servico` TEXT NULL DEFAULT NULL COMMENT 'Serviço' COLLATE 'utf8mb4_unicode_ci',

	`familia_produto` TEXT NULL DEFAULT NULL COMMENT 'Família do produto' COLLATE 'utf8mb4_unicode_ci',

	`data_abertura` DATETIME NULL DEFAULT NULL COMMENT 'Data de abertura',

	`data_abertura_dia_semana` TEXT NULL DEFAULT NULL COMMENT 'Dia da semana da abertura' COLLATE 'utf8mb4_unicode_ci',

	`data_abertura_dia` TEXT NULL DEFAULT NULL COMMENT 'Dia da abertura' COLLATE 'utf8mb4_unicode_ci',

	`data_abertura_mes` TEXT NULL DEFAULT NULL COMMENT 'Mês da abertura' COLLATE 'utf8mb4_unicode_ci',

	`data_abertura_ano` TEXT NULL DEFAULT NULL COMMENT 'Ano da abertura' COLLATE 'utf8mb4_unicode_ci',

	`mes_ano_abertura` TEXT NULL DEFAULT NULL COMMENT 'Mês/ano da abertura' COLLATE 'utf8mb4_unicode_ci',

	`data_reparo` DATETIME NULL DEFAULT NULL COMMENT 'Data do reparo',

	`data_reparo_dia_semana` TEXT NULL DEFAULT NULL COMMENT 'Dia da semana do reparo' COLLATE 'utf8mb4_unicode_ci',

	`data_reparo_dia` TEXT NULL DEFAULT NULL COMMENT 'Dia do reparo' COLLATE 'utf8mb4_unicode_ci',

	`data_reparo_mes` TEXT NULL DEFAULT NULL COMMENT 'Mês do reparo' COLLATE 'utf8mb4_unicode_ci',

	`data_reparo_ano` TEXT NULL DEFAULT NULL COMMENT 'Ano do reparo' COLLATE 'utf8mb4_unicode_ci',

	`data_encerramento` DATETIME NULL DEFAULT NULL COMMENT 'Data de encerramento',

	`data_encerramento_dia_semana` TEXT NULL DEFAULT NULL COMMENT 'Dia da semana do encerramento' COLLATE 'utf8mb4_unicode_ci',

	`data_encerramento_dia` TEXT NULL DEFAULT NULL COMMENT 'Dia do encerramento' COLLATE 'utf8mb4_unicode_ci',

	`data_encerramento_mes` TEXT NULL DEFAULT NULL COMMENT 'Mês do encerramento' COLLATE 'utf8mb4_unicode_ci',

	`data_encerramento_ano` TEXT NULL DEFAULT NULL COMMENT 'Ano do encerramento' COLLATE 'utf8mb4_unicode_ci',

	`mes_ano_enc` TEXT NULL DEFAULT NULL COMMENT 'Mês/ano do encerramento' COLLATE 'utf8mb4_unicode_ci',

	`data_baixa` DATETIME NULL DEFAULT NULL COMMENT 'Data de baixa',

	`data_baixa_dia_semana` TEXT NULL DEFAULT NULL COMMENT 'Dia da semana da baixa' COLLATE 'utf8mb4_unicode_ci',

	`data_baixa_dia` TEXT NULL DEFAULT NULL COMMENT 'Dia da baixa' COLLATE 'utf8mb4_unicode_ci',

	`data_baixa_mes` TEXT NULL DEFAULT NULL COMMENT 'Mês da baixa' COLLATE 'utf8mb4_unicode_ci',

	`data_baixa_ano` TEXT NULL DEFAULT NULL COMMENT 'Ano da baixa' COLLATE 'utf8mb4_unicode_ci',

	`last_update` TEXT NULL DEFAULT NULL COMMENT 'Última atualização' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n1_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código da baixa N1' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n1_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome da baixa N1 (BAIXA_N1)' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n2_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código da baixa N2' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n2_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome da baixa N2 (BAIXA_N2)' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n3_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código da baixa N3' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n3_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome da baixa N3 (BAIXA_N3)' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n4_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código da baixa N4' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n4_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome da baixa N4 (BAIXA_N4)' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n5_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código da baixa N5' COLLATE 'utf8mb4_unicode_ci',

	`baixa_n5_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome da baixa N5 (BAIXA_N5)' COLLATE 'utf8mb4_unicode_ci',

	`baixa_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código da baixa (BAIXA_CODIGO)' COLLATE 'utf8mb4_unicode_ci',

	`resumo_intragov` TEXT NULL DEFAULT NULL COMMENT 'Resumo intragov' COLLATE 'utf8mb4_unicode_ci',

	`intragov_sigla` TEXT NULL DEFAULT NULL COMMENT 'Sigla intragov' COLLATE 'utf8mb4_unicode_ci',

	`intragov_codigo` TEXT NULL DEFAULT NULL COMMENT 'Código intragov' COLLATE 'utf8mb4_unicode_ci',

	`flag_intragov` TEXT NULL DEFAULT NULL COMMENT 'Flag intragov' COLLATE 'utf8mb4_unicode_ci',

	`acionamento_tecnico` TEXT NULL DEFAULT NULL COMMENT 'Acionamento técnico' COLLATE 'utf8mb4_unicode_ci',

	`acionamento_operadora` TEXT NULL DEFAULT NULL COMMENT 'Acionamento operadora' COLLATE 'utf8mb4_unicode_ci',

	`acionamento_integradora` TEXT NULL DEFAULT NULL COMMENT 'Acionamento integradora' COLLATE 'utf8mb4_unicode_ci',

	`acionamento_parceiro` TEXT NULL DEFAULT NULL COMMENT 'Acionamento parceiro' COLLATE 'utf8mb4_unicode_ci',

	`acionamento_transmissao` TEXT NULL DEFAULT NULL COMMENT 'Acionamento transmissão' COLLATE 'utf8mb4_unicode_ci',

	`acionamento_ccr` TEXT NULL DEFAULT NULL COMMENT 'Acionamento CCR' COLLATE 'utf8mb4_unicode_ci',

	`acionamento_osp` TEXT NULL DEFAULT NULL COMMENT 'Acionamento OSP' COLLATE 'utf8mb4_unicode_ci',

	`acionamento_diag_b2b` TEXT NULL DEFAULT NULL COMMENT 'Acionamento diag B2B' COLLATE 'utf8mb4_unicode_ci',

	`sla_horas` TEXT NULL DEFAULT NULL COMMENT 'SLA em horas' COLLATE 'utf8mb4_unicode_ci',

	`sla_tipo` TEXT NULL DEFAULT NULL COMMENT 'Tipo de SLA' COLLATE 'utf8mb4_unicode_ci',

	`grupo` TEXT NULL DEFAULT NULL COMMENT 'Grupo (GRUPO_MIS)' COLLATE 'utf8mb4_unicode_ci',

	`grupo_novo` TEXT NULL DEFAULT NULL COMMENT 'Grupo novo (GRUPO_PER_B2B)' COLLATE 'utf8mb4_unicode_ci',

	`foco_acoes` TEXT NULL DEFAULT NULL COMMENT 'Foco das ações (FOCO_MIS)' COLLATE 'utf8mb4_unicode_ci',

	`foco_novo` TEXT NULL DEFAULT NULL COMMENT 'Foco novo (FOCO_PER_B2B)' COLLATE 'utf8mb4_unicode_ci',

	`grupo_abertura` TEXT NULL DEFAULT NULL COMMENT 'Grupo de abertura' COLLATE 'utf8mb4_unicode_ci',

	`usuario_abertura` TEXT NULL DEFAULT NULL COMMENT 'Usuário de abertura' COLLATE 'utf8mb4_unicode_ci',

	`grupo_baixa` TEXT NULL DEFAULT NULL COMMENT 'Grupo de baixa' COLLATE 'utf8mb4_unicode_ci',

	`usuario_baixa` TEXT NULL DEFAULT NULL COMMENT 'Usuário de baixa' COLLATE 'utf8mb4_unicode_ci',

	`grupo_responsavel` TEXT NULL DEFAULT NULL COMMENT 'Grupo responsável' COLLATE 'utf8mb4_unicode_ci',

	`operadora` TEXT NULL DEFAULT NULL COMMENT 'Operadora' COLLATE 'utf8mb4_unicode_ci',

	`tipo_operadora` TEXT NULL DEFAULT NULL COMMENT 'Tipo de operadora' COLLATE 'utf8mb4_unicode_ci',

	`massiva_flag` INT(11) NULL DEFAULT NULL COMMENT 'Flag massiva',

	`tmr` TEXT NULL DEFAULT NULL COMMENT 'TMR (TMR_MIN na API)' COLLATE 'utf8mb4_unicode_ci',

	`tmr_sem_parada` TEXT NULL DEFAULT NULL COMMENT 'TMR sem parada (decorrido_sem_parada)' COLLATE 'utf8mb4_unicode_ci',

	`tempo_parada` TEXT NULL DEFAULT NULL COMMENT 'Tempo de parada (TEMPO_PARADA_MIN)' COLLATE 'utf8mb4_unicode_ci',

	`tmr_exp_reparo_min` TEXT NULL DEFAULT NULL COMMENT 'TMR exp reparo (min)' COLLATE 'utf8mb4_unicode_ci',

	`tmr_exp_min` TEXT NULL DEFAULT NULL COMMENT 'TMR exp (min)' COLLATE 'utf8mb4_unicode_ci',

	`prazo` TEXT NULL DEFAULT NULL COMMENT 'Prazo' COLLATE 'utf8mb4_unicode_ci',

	`reincidencia_30d` TEXT NULL DEFAULT NULL COMMENT 'Reincidência 30 dias (REINC_30D)' COLLATE 'utf8mb4_unicode_ci',

	`reincidencia_30d_grupo` TEXT NULL DEFAULT NULL COMMENT 'Reincidência 30D grupo (REINC_30D_GRUPO)' COLLATE 'utf8mb4_unicode_ci',

	`reincidencia_tipo` TEXT NULL DEFAULT NULL COMMENT 'Tipo de reincidência (REINC_TIPO)' COLLATE 'utf8mb4_unicode_ci',

	`originou_reinc` TEXT NULL DEFAULT NULL COMMENT 'Originou reincidência' COLLATE 'utf8mb4_unicode_ci',

	`reincidencia_30d_atacado` TEXT NULL DEFAULT NULL COMMENT 'Reincidência 30D atacado (REINC_30D_ATACADO)' COLLATE 'utf8mb4_unicode_ci',

	`reincidencia_tipo_atacado` TEXT NULL DEFAULT NULL COMMENT 'Tipo de reincidência atacado (REINC_TIPO_ATACADO)' COLLATE 'utf8mb4_unicode_ci',

	`reincidencia_30d_acesso` TEXT NULL DEFAULT NULL COMMENT 'Reincidência 30D acesso (REINC_30D_ACESSO)' COLLATE 'utf8mb4_unicode_ci',

	`reincidencia_tipo_acesso` TEXT NULL DEFAULT NULL COMMENT 'Tipo de reincidência acesso (REINC_TIPO_ACESSO)' COLLATE 'utf8mb4_unicode_ci',

	`prox_reinc` TEXT NULL DEFAULT NULL COMMENT 'Próxima reincidência' COLLATE 'utf8mb4_unicode_ci',

	`originou_reinc_grupo` TEXT NULL DEFAULT NULL COMMENT 'Originou reincidência grupo' COLLATE 'utf8mb4_unicode_ci',

	`prox_reinc_grupo` TEXT NULL DEFAULT NULL COMMENT 'Próxima reincidência grupo' COLLATE 'utf8mb4_unicode_ci',

	`maior_doze_flag` TEXT NULL DEFAULT NULL COMMENT 'Flag maior que 12' COLLATE 'utf8mb4_unicode_ci',

	`tipo_empresa` TEXT NULL DEFAULT NULL COMMENT 'Tipo de empresa' COLLATE 'utf8mb4_unicode_ci',

	`projeto` TEXT NULL DEFAULT NULL COMMENT 'Projeto' COLLATE 'utf8mb4_unicode_ci',

	`id_projeto` TEXT NULL DEFAULT NULL COMMENT 'ID do projeto' COLLATE 'utf8mb4_unicode_ci',

	`top_atacado` TEXT NULL DEFAULT NULL COMMENT 'Top atacado' COLLATE 'utf8mb4_unicode_ci',

	`tj` TEXT NULL DEFAULT NULL COMMENT 'TJ' COLLATE 'utf8mb4_unicode_ci',

	`kpi` TEXT NULL DEFAULT NULL COMMENT 'KPI' COLLATE 'utf8mb4_unicode_ci',

	`kpi_acesso` TEXT NULL DEFAULT NULL COMMENT 'KPI acesso' COLLATE 'utf8mb4_unicode_ci',

	`origem` TEXT NULL DEFAULT NULL COMMENT 'Origem' COLLATE 'utf8mb4_unicode_ci',

	`sistema_origem` TEXT NULL DEFAULT NULL COMMENT 'Sistema de origem' COLLATE 'utf8mb4_unicode_ci',

	`triagem_flag` TEXT NULL DEFAULT NULL COMMENT 'Flag triagem (TRIAGEM_FLAG)' COLLATE 'utf8mb4_unicode_ci',

	`planta_flag` TEXT NULL DEFAULT NULL COMMENT 'Flag planta (PLANTA_FLAG)' COLLATE 'utf8mb4_unicode_ci',

	`tipo_acesso` TEXT NULL DEFAULT NULL COMMENT 'Tipo de acesso' COLLATE 'utf8mb4_unicode_ci',

	`contato_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome do contato' COLLATE 'utf8mb4_unicode_ci',

	`contato_telefone` TEXT NULL DEFAULT NULL COMMENT 'Telefone do contato' COLLATE 'utf8mb4_unicode_ci',

	`reclamante_nome` TEXT NULL DEFAULT NULL COMMENT 'Nome do reclamante' COLLATE 'utf8mb4_unicode_ci',

	`reclamante_telefone` TEXT NULL DEFAULT NULL COMMENT 'Telefone do reclamante' COLLATE 'utf8mb4_unicode_ci',

	`R30_Tratativas` TEXT NULL DEFAULT NULL COMMENT 'Tratativas R30' COLLATE 'utf8mb4_unicode_ci',

	`created_at` TIMESTAMP NULL DEFAULT current_timestamp() COMMENT 'Data de criação do registro',

	`updated_at` TIMESTAMP NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Data da última atualização',

	PRIMARY KEY (`id`) USING BTREE,

	UNIQUE INDEX `unique_bd` (`bd`(255)) USING BTREE,

	INDEX `idx_bd` (`bd`(255)) USING BTREE,

	INDEX `idx_data_abertura` (`data_abertura`) USING BTREE,

	INDEX `idx_data_encerramento` (`data_encerramento`) USING BTREE,

	INDEX `idx_data_baixa` (`data_baixa`) USING BTREE,

	INDEX `idx_data_abertura_ano` (`data_abertura_ano`(768)) USING BTREE,

	INDEX `idx_data_abertura_mes` (`data_abertura_mes`(768)) USING BTREE,

	INDEX `idx_mes_ano_abertura` (`mes_ano_abertura`(7)) USING BTREE,

	INDEX `idx_mes_ano_enc` (`mes_ano_enc`(7)) USING BTREE,

	INDEX `idx_cluster` (`cluster`(100)) USING BTREE,

	INDEX `idx_regional` (`regional`(100)) USING BTREE,

	INDEX `idx_regional_vivo` (`regional_vivo`(100)) USING BTREE,

	INDEX `idx_procedencia` (`procedencia`(100)) USING BTREE,

	INDEX `idx_segmento_comercial` (`segmento_comercial`(100)) USING BTREE,

	INDEX `idx_segmento_novo` (`segmento_novo`(100)) USING BTREE,

	INDEX `idx_massiva_flag` (`massiva_flag`) USING BTREE,

	INDEX `idx_triagem_flag` (`triagem_flag`(768)) USING BTREE,

	INDEX `idx_reincidencia_30d` (`reincidencia_30d`(768)) USING BTREE,

	INDEX `idx_protocolo_crm` (`protocolo_crm`(100)) USING BTREE,

	INDEX `idx_kpi` (`kpi`(100)) USING BTREE,

	INDEX `idx_cidade` (`cidade`(100)) USING BTREE,

	INDEX `idx_uf` (`uf`(2)) USING BTREE,

	INDEX `idx_cliente_nome` (`cliente_nome`(255)) USING BTREE,

	INDEX `idx_cnpj` (`cnpj`(20)) USING BTREE,

	INDEX `idx_grupo_economico` (`grupo_economico`(255)) USING BTREE

)

COMMENT='Tabela para armazenar dados de reparos B2B - Nova API BDS (2026-02-27)'

COLLATE='utf8mb4_unicode_ci'

ENGINE=InnoDB

AUTO_INCREMENT=10806

;

 